"""Scrape institutional holdings data."""
import json
import sys
import time
from bs4 import BeautifulSoup
from .config import create_session, cache_get, cache_set, safe_float, safe_int, BASE_URL


def scrape_holdings(symbols=None, force=False):
    """Scrape institutional holdings data."""
    cache_key = "holdings"
    if not force:
        cached = cache_get(cache_key, max_age_hours=48)
        if cached:
            return cached

    session = create_session()
    holdings = {}

    try:
        # ShareSansar holdings/promoter page
        url = f"{BASE_URL}/company-promoter"
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
                        elif "promoter" in h or " Sponsor" in h:
                            entry["promoterHolding"] = safe_float(val)
                        elif "public" in h or "floating" in h:
                            entry["publicHolding"] = safe_float(val)
                        elif "mutual" in h or "fund" in h:
                            entry["mutualFundHolding"] = safe_float(val)
                        elif "foreign" in h or "fpi" in h:
                            entry["foreignHolding"] = safe_float(val)

                if entry.get("symbol"):
                    sym = entry["symbol"]
                    if symbols and sym not in symbols:
                        continue
                    holdings[sym] = entry

    except Exception as e:
        holdings = {"error": str(e)}

    cache_set(cache_key, holdings)
    return holdings


if __name__ == "__main__":
    symbols = sys.argv[1:] if len(sys.argv) > 1 else None
    data = scrape_holdings(symbols=symbols, force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
