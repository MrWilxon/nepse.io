"""Scrape dividend data from ShareSansar."""
import json
import sys
import time
from bs4 import BeautifulSoup
from .config import create_session, cache_get, cache_set, safe_float, safe_int, BASE_URL


def scrape_dividends(symbols=None, force=False):
    """Scrape dividend history for companies."""
    cache_key = "dividends"
    if not force:
        cached = cache_get(cache_key, max_age_hours=48)
        if cached:
            return cached

    session = create_session()
    all_dividends = {}

    try:
        # ShareSansar dividend page
        url = f"{BASE_URL}/dividend"
        resp = session.get(url, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        tables = soup.find_all("table")
        for table in tables:
            rows = table.find_all("tr")
            headers = []
            for row in rows:
                cells = row.find_all(["td", "th"])
                if not headers:
                    headers = [c.get_text(strip=True).lower() for c in cells]
                    continue
                if len(cells) < 3:
                    continue

                entry = {}
                for i, cell in enumerate(cells):
                    if i < len(headers):
                        val = cell.get_text(strip=True)
                        h = headers[i]
                        if "symbol" in h or "scrip" in h:
                            entry["symbol"] = val
                        elif "year" in h or "fiscal" in h:
                            entry["year"] = val
                        elif "cash" in h and ("dividend" in h or "rate" in h):
                            entry["cashDividend"] = safe_float(val)
                        elif "bonus" in h:
                            entry["bonusDividend"] = safe_float(val)
                        elif "right" in h:
                            entry["rightsDividend"] = safe_float(val)
                        elif "total" in h:
                            entry["totalDividend"] = safe_float(val)
                        elif "type" in h or "kind" in h:
                            entry["type"] = val

                if entry.get("symbol"):
                    sym = entry["symbol"]
                    if symbols and sym not in symbols:
                        continue
                    if sym not in all_dividends:
                        all_dividends[sym] = []
                    all_dividends[sym].append({
                        "year": entry.get("year", ""),
                        "cashDividend": entry.get("cashDividend", 0),
                        "bonusDividend": entry.get("bonusDividend", 0),
                        "rightsDividend": entry.get("rightsDividend", 0),
                        "totalDividend": entry.get("totalDividend", 0),
                        "type": entry.get("type", "cash"),
                    })

        # Also try per-company dividend pages
        if symbols:
            for symbol in symbols:
                if symbol not in all_dividends or not all_dividends[symbol]:
                    try:
                        comp_url = f"{BASE_URL}/company/{symbol.lower()}"
                        resp = session.get(comp_url, timeout=15)
                        soup = BeautifulSoup(resp.text, "lxml")

                        # Look for dividend section
                        div_section = soup.find("div", id="dividend") or soup.find("section", class_="dividend")
                        if div_section:
                            tables = div_section.find_all("table")
                            for table in tables:
                                rows = table.find_all("tr")
                                for row in rows[1:]:  # skip header
                                    cells = row.find_all("td")
                                    if len(cells) >= 2:
                                        all_dividends.setdefault(symbol, []).append({
                                            "year": cells[0].get_text(strip=True),
                                            "cashDividend": safe_float(cells[1].get_text(strip=True)) if len(cells) > 1 else 0,
                                            "bonusDividend": safe_float(cells[2].get_text(strip=True)) if len(cells) > 2 else 0,
                                            "rightsDividend": safe_float(cells[3].get_text(strip=True)) if len(cells) > 3 else 0,
                                            "totalDividend": 0,
                                            "type": "cash",
                                        })
                        time.sleep(0.3)
                    except Exception:
                        pass

    except Exception as e:
        all_dividends = {"error": str(e)}

    cache_set(cache_key, all_dividends)
    return all_dividends


if __name__ == "__main__":
    symbols = sys.argv[1:] if len(sys.argv) > 1 else None
    data = scrape_dividends(symbols=symbols, force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
