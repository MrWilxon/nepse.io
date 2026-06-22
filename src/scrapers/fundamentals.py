"""Scrape company fundamentals from ShareSansar."""
import json
import sys
import time
from bs4 import BeautifulSoup
from .config import create_session, cache_get, cache_set, safe_float, safe_int, BASE_URL


def scrape_fundamentals(symbols=None, force=False):
    """Scrape fundamental data for companies."""
    cache_key = "fundamentals"
    if not force:
        cached = cache_get(cache_key, max_age_hours=48)
        if cached:
            return cached

    session = create_session()
    results = {}

    # Import company map
    try:
        sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent.parent))
        from constants.companyIdMap import COMPANY_ID_MAP
        target_symbols = symbols or list(COMPANY_ID_MAP.keys())
    except ImportError:
        target_symbols = symbols or []

    for symbol in target_symbols:
        try:
            url = f"{BASE_URL}/company/{symbol.lower()}"
            resp = session.get(url, timeout=20)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")

            fund = {"symbol": symbol, "category": "Other"}

            # Parse the company page for fundamental data
            # ShareSansar company pages have tables with financial data
            tables = soup.find_all("table")
            for table in tables:
                rows = table.find_all("tr")
                for row in rows:
                    cells = row.find_all(["td", "th"])
                    if len(cells) >= 2:
                        label = cells[0].get_text(strip=True).lower()
                        value = cells[1].get_text(strip=True)

                        if "market capitalization" in label or "market cap" in label:
                            fund["marketCap"] = safe_float(value)
                        elif "p/e" in label or "pe ratio" in label:
                            fund["pe"] = safe_float(value)
                        elif "eps" in label:
                            fund["eps"] = safe_float(value)
                        elif "book value" in label or "bvps" in label:
                            fund["bookValue"] = safe_float(value)
                        elif "p/b" in label or "pb ratio" in label:
                            fund["pb"] = safe_float(value)
                        elif "roe" in label or "return on equity" in label:
                            fund["roe"] = safe_float(value)
                        elif "roa" in label or "return on assets" in label:
                            fund["roa"] = safe_float(value)
                        elif "dividend yield" in label:
                            fund["dividendYield"] = safe_float(value)
                        elif "debt" in label and "equity" in label:
                            fund["debtToEquity"] = safe_float(value)
                        elif "sector" in label or "industry" in label:
                            fund["category"] = value
                        elif "52 week high" in label or "52w high" in label:
                            fund["fiftyTwoWeekHigh"] = safe_float(value)
                        elif "52 week low" in label or "52w low" in label:
                            fund["fiftyTwoWeekLow"] = safe_float(value)
                        elif "beta" in label:
                            fund["beta"] = safe_float(value)
                        elif "shares outstanding" in label or " outstanding" in label:
                            fund["sharesOutstanding"] = safe_int(value)
                        elif "floating shares" in label:
                            fund["floatingShares"] = safe_int(value)
                        elif "lector:" in label or " promoter" in label:
                            fund["promoterHolding"] = safe_float(value)
                        elif "public" in label and "holding" in label:
                            fund["publicHolding"] = safe_float(value)

            # Try to get close price from the page
            price_el = soup.select_one(".company-price, .stock-price, .ltp")
            if price_el:
                fund["latestClose"] = safe_float(price_el.get_text(strip=True))

            results[symbol] = fund
            time.sleep(0.3)

        except Exception as e:
            results[symbol] = {"symbol": symbol, "error": str(e)}

    cache_set(cache_key, results)
    return results


if __name__ == "__main__":
    symbols = sys.argv[1:] if len(sys.argv) > 1 else None
    data = scrape_fundamentals(symbols=symbols, force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
