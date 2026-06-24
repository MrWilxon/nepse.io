"""Scrape company fundamentals from ShareSansar."""
import json
import re
import sys
import time
import logging
from pathlib import Path

from bs4 import BeautifulSoup

from .config import create_session, cache_get, cache_set, safe_float, safe_int, BASE_URL

logger = logging.getLogger(__name__)

sys.path.insert(0, str(Path(__file__).parent.parent))
from constants.companyIdMap import companyIdMap as COMPANY_ID_MAP


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _clean_number(text):
    """Strip commas, 'Rs.', '%', 'units' and convert to float."""
    text = text.strip()
    text = re.sub(r"Rs\.\s*", "", text)
    text = re.sub(r"%", "", text)
    text = re.sub(r"units", "", text)
    text = text.replace(",", "")
    try:
        return float(text.strip())
    except (ValueError, TypeError):
        return None


def _parse_second_row_spans(row_div):
    """Parse a .second-row div and return a dict of label -> float value."""
    data = {}
    for span in row_div.find_all("span"):
        label_el = span.find("span", class_="text-org")
        if label_el:
            label = label_el.get_text(strip=True).rstrip(":").strip()
            # Get raw text, remove the label portion, then clean
            raw = span.get_text(" ", strip=True)
            label_raw = label_el.get_text(strip=True)
            value_text = raw.split(label_raw, 1)[-1].strip().rstrip(":").strip()
            # Handle "52 Week High-Low" which has two values separated by ' - '
            if "52 Week" in label:
                parts = [p.strip() for p in value_text.split("-")]
                parts = [p for p in parts if p]
                if len(parts) == 2:
                    data["fiftyTwoWeekHigh"] = _clean_number(parts[0])
                    data["fiftyTwoWeekLow"] = _clean_number(parts[1])
                continue
            val = _clean_number(value_text)
            if val is not None:
                norm = label.lower().replace(" ", "").replace("-", "")
                data[norm] = val
    return data


def _parse_company_info_table(soup):
    """Parse #myTableCInfo rows for Listed Shares, Paid Up, etc."""
    info = {}
    table = soup.find("table", id="myTableCInfo")
    if not table:
        return info
    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 2:
            continue
        label = cells[0].get_text(strip=True).lower()
        raw_value = " ".join(c.get_text(strip=True) for c in cells[1:])
        if "listed shares" in label:
            info["listedShares"] = _clean_number(raw_value)
        elif "paid up value" in label:
            info["totalPaidUpValue"] = _clean_number(raw_value)
        elif "paid up" in label:
            info["paidUpValue"] = _clean_number(raw_value)
        elif label == "name":
            info["companyName"] = raw_value
        elif label == "sector":
            info["category"] = raw_value
    return info


def _parse_latest_dividend(soup):
    """Parse the first company-table under 'Latest Dividend' heading."""
    dividend = {
        "bonusPct": 0.0,
        "cashDividendPct": 0.0,
        "dividendYear": "",
        "bookClose": "",
    }
    # Find the heading and then the next table
    heading = soup.find("h3", string=re.compile(r"Latest Dividend", re.I))
    if not heading:
        return dividend
    table = heading.find_next("table", class_="company-table")
    if not table:
        return dividend
    for row in table.find_all("tr"):
        cells = row.find_all("td")
        if len(cells) < 2:
            continue
        label = cells[0].get_text(strip=True).lower()
        raw_value = cells[1].get_text(strip=True)
        if "bonus" in label:
            dividend["bonusPct"] = _clean_number(raw_value) or 0.0
        elif "cash" in label:
            dividend["cashDividendPct"] = _clean_number(raw_value) or 0.0
        elif "year" in label:
            dividend["dividendYear"] = raw_value
        elif "book close" in label:
            dividend["bookClose"] = raw_value
    return dividend


def _parse_moving_analysis(soup):
    """Parse Moving Analysis table for MA values and signals."""
    ma = {}
    heading = soup.find("h3", string=re.compile(r"Moving Analysis", re.I))
    if not heading:
        return ma
    table = heading.find_next("table", class_="company-table")
    if not table:
        return ma
    rows = table.find_all("tr")
    i = 0
    while i < len(rows):
        cells = rows[i].find_all("td")
        if len(cells) < 2:
            i += 1
            continue
        label = cells[0].get_text(strip=True).upper()
        value_text = cells[1].get_text(strip=True)
        if label in ("MA5", "MA20", "MA180"):
            key = label.lower()
            ma[key] = _clean_number(value_text)
            # Next row should be the signal
            if i + 1 < len(rows):
                sig_cells = rows[i + 1].find_all("td")
                if len(sig_cells) >= 2:
                    sig_text = sig_cells[1].get_text(strip=True).upper()
                    ma[key + "Signal"] = sig_text
            i += 2
        else:
            i += 1
    return ma


def _fetch_dividend_history(session, company_id, csrf_token):
    """POST to /company-dividend to fetch full dividend history."""
    url = f"{BASE_URL}/company-dividend"
    headers = {
        "X-CSRF-Token": csrf_token,
        "X-Requested-With": "XMLHttpRequest",
        "Referer": BASE_URL,
    }
    try:
        resp = session.post(url, data={"company": company_id}, headers=headers, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        records = []
        table = soup.find("table")
        if not table:
            return records
        # DataTables response wraps data in <td> rows
        for row in table.find_all("tr"):
            cells = row.find_all("td")
            if len(cells) < 5:
                continue
            records.append({
                "cashDividend": _clean_number(cells[0].get_text(strip=True)),
                "bonusShare": _clean_number(cells[1].get_text(strip=True)),
                "totalDividend": _clean_number(cells[2].get_text(strip=True)),
                "announcementDate": cells[3].get_text(strip=True),
                "bookcloseDate": cells[4].get_text(strip=True),
                "year": cells[5].get_text(strip=True) if len(cells) > 5 else "",
            })
        return records
    except Exception as exc:
        logger.debug("Dividend history fetch failed for company %s: %s", company_id, exc)
        return []


def _format_market_cap(value):
    """Format market cap in Arab/Rawalpa/Kharba."""
    if value is None:
        return "0"
    if value >= 1_000_000_000_000:
        return f"{value / 1_000_000_000_000:.2f}Ar"
    if value >= 1_000_000_000:
        return f"{value / 1_000_000_000:.2f}Kharba"
    if value >= 1_000_000:
        return f"{value / 1_000_000:.2f}M"
    return str(int(value))


# ---------------------------------------------------------------------------
# Main scraper
# ---------------------------------------------------------------------------

def scrape_fundamentals(symbols=None, force=False):
    """Scrape fundamental data for companies from ShareSansar.

    Args:
        symbols: Optional list of symbols to scrape.  If *None* every symbol
                 in ``COMPANY_ID_MAP`` is scraped.
        force:   Skip the cache when *True*.

    Returns:
        dict keyed by symbol containing fundamental data.
    """
    cache_key = "fundamentals"
    if not force:
        cached = cache_get(cache_key, max_age_hours=48)
        if cached:
            logger.info("Returning cached fundamentals")
            return cached

    session = create_session()
    results = {}

    # Extract CSRF token from the homepage (session is already on it)
    csrf_token = ""
    try:
        home_resp = session.get(BASE_URL, timeout=15)
        home_soup = BeautifulSoup(home_resp.text, "lxml")
        meta = home_soup.find("meta", attrs={"name": "_token"})
        if meta:
            csrf_token = meta.get("content", "")
    except Exception:
        pass

    target_symbols = symbols or list(COMPANY_ID_MAP.keys())
    total = len(target_symbols)

    for idx, symbol in enumerate(target_symbols, 1):
        try:
            url = f"{BASE_URL}/company/{symbol.lower()}"
            logger.info("[%d/%d] Fetching %s", idx, total, symbol)
            resp = session.get(url, timeout=20)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")

            fund = {
                "symbol": symbol,
                "companyName": "",
                "category": "",
                "latestClose": None,
                "change": None,
                "changePct": None,
                "listedShares": None,
                "paidUpValue": None,
                "totalPaidUpValue": None,
                "marketCap": None,
                "marketCapFormatted": "0",
                "fiftyTwoWeekHigh": None,
                "fiftyTwoWeekLow": None,
                "eps": None,
                "pe": None,
                "bookValue": None,
                "pb": None,
                "roe": None,
                "dividendYield": None,
                "bonusPct": 0.0,
                "cashDividendPct": 0.0,
                "bookClose": "",
                "dividendYear": "",
                "ma5": None,
                "ma5Signal": "",
                "ma20": None,
                "ma20Signal": "",
                "ma180": None,
                "ma180Signal": "",
            }

            # -- Hidden divs for symbol / sector / companyid --
            sym_el = soup.find("div", id="symbol")
            sector_el = soup.find("div", id="sector")
            companyid_el = soup.find("div", id="companyid")

            if sym_el:
                fund["symbol"] = sym_el.get_text(strip=True) or symbol
            if sector_el:
                fund["category"] = sector_el.get_text(strip=True)
            if companyid_el:
                fund["_companyId"] = companyid_el.get_text(strip=True)

            # -- First row: LTP, change, % change --
            first_row = soup.find("div", class_="first-row")
            if first_row:
                price_el = first_row.find("span", class_="comp-price")
                if price_el:
                    fund["latestClose"] = _clean_number(price_el.get_text(strip=True))
                ratio_el = first_row.find("span", class_="comp-ratio")
                if ratio_el:
                    fund["change"] = _clean_number(ratio_el.get_text(strip=True))
                pct_el = first_row.find("span", class_="comp-percent")
                if pct_el:
                    fund["changePct"] = _clean_number(pct_el.get_text(strip=True))

            # -- Second rows: open/high/low/volume, 52w, 120d, 180d --
            for row_div in soup.find_all("div", class_="second-row"):
                parsed = _parse_second_row_spans(row_div)
                if "open" in parsed:
                    fund["open"] = parsed["open"]
                if "high" in parsed:
                    fund["high"] = parsed["high"]
                if "low" in parsed:
                    fund["low"] = parsed["low"]
                if "volume" in parsed:
                    fund["volume"] = parsed["volume"]
                if "ltp" in parsed:
                    fund["latestClose"] = parsed["ltp"]
                if "fiftyTwoWeekHigh" in parsed:
                    fund["fiftyTwoWeekHigh"] = parsed["fiftyTwoWeekHigh"]
                if "fiftyTwoWeekLow" in parsed:
                    fund["fiftyTwoWeekLow"] = parsed["fiftyTwoWeekLow"]
                if "120DaysAverage" in parsed:
                    fund["ma120"] = parsed["120DaysAverage"]
                if "180DaysAverage" in parsed:
                    fund["ma180Avg"] = parsed["180DaysAverage"]

            # -- Company info table --
            info = _parse_company_info_table(soup)
            fund["companyName"] = info.get("companyName", "")
            if not fund["category"]:
                fund["category"] = info.get("category", "")
            fund["listedShares"] = info.get("listedShares")
            fund["paidUpValue"] = info.get("paidUpValue")
            fund["totalPaidUpValue"] = info.get("totalPaidUpValue")

            # -- Latest dividend --
            div_data = _parse_latest_dividend(soup)
            fund["bonusPct"] = div_data["bonusPct"]
            fund["cashDividendPct"] = div_data["cashDividendPct"]
            fund["bookClose"] = div_data["bookClose"]
            fund["dividendYear"] = div_data["dividendYear"]

            # -- Moving analysis --
            ma = _parse_moving_analysis(soup)
            fund["ma5"] = ma.get("ma5")
            fund["ma5Signal"] = ma.get("ma5Signal", "")
            fund["ma20"] = ma.get("ma20")
            fund["ma20Signal"] = ma.get("ma20Signal", "")
            fund["ma180"] = ma.get("ma180")
            fund["ma180Signal"] = ma.get("ma180Signal", "")

            # -- Derived metrics --
            if fund["latestClose"] and fund["listedShares"]:
                fund["marketCap"] = int(fund["latestClose"] * fund["listedShares"])
                fund["marketCapFormatted"] = _format_market_cap(fund["marketCap"])
            if fund["latestClose"] and fund["cashDividendPct"] and fund["paidUpValue"]:
                fund["dividendYield"] = round(
                    (fund["cashDividendPct"] / 100.0 * fund["paidUpValue"]) / fund["latestClose"] * 100, 2
                )

            # -- Try dividend history via AJAX --
            company_id = fund.get("_companyId") or COMPANY_ID_MAP.get(symbol)
            if company_id and csrf_token:
                div_history = _fetch_dividend_history(session, company_id, csrf_token)
                if div_history:
                    latest = div_history[0]
                    if latest.get("cashDividend"):
                        fund["cashDividendPct"] = latest["cashDividend"]
                    if latest.get("bonusShare"):
                        fund["bonusPct"] = latest["bonusShare"]
                    if latest.get("bookcloseDate"):
                        fund["bookClose"] = latest["bookcloseDate"]
                    if latest.get("year"):
                        fund["dividendYear"] = latest["year"]
                    fund["dividendHistory"] = div_history

            # Remove internal-only key
            fund.pop("_companyId", None)
            results[symbol] = fund
            time.sleep(0.5)

        except Exception as exc:
            logger.warning("Failed to scrape %s: %s", symbol, exc)
            results[symbol] = {"symbol": symbol, "error": str(exc)}

    cache_set(cache_key, results)
    logger.info("Scraped %d companies (%d succeeded)", total,
                sum(1 for v in results.values() if "error" not in v))
    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    syms = [a for a in sys.argv[1:] if not a.startswith("--")]
    data = scrape_fundamentals(symbols=syms or None, force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
