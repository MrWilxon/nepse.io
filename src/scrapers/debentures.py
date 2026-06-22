"""Scrape debenture/bond data from ShareSansar."""
import json
import sys
import time
from bs4 import BeautifulSoup
from .config import create_session, cache_get, cache_set, safe_float, safe_int, BASE_URL


def scrape_debentures(force=False):
    """Scrape debenture and bond data."""
    cache_key = "debentures"
    if not force:
        cached = cache_get(cache_key, max_age_hours=24)
        if cached:
            return cached

    session = create_session()
    debentures = []

    try:
        url = f"{BASE_URL}/debenture"
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

                deb = {}
                for i, cell in enumerate(cells):
                    if i < len(headers):
                        val = cell.get_text(strip=True)
                        h = headers[i]
                        if "symbol" in h or "code" in h:
                            deb["symbol"] = val
                        elif "name" in h:
                            deb["name"] = val
                        elif "issuer" in h:
                            deb["issuer"] = val
                        elif "coupon" in h or "rate" in h:
                            deb["couponRate"] = safe_float(val)
                        elif "maturity" in h:
                            deb["maturityDate"] = val
                        elif "face value" in h or "par" in h:
                            deb["faceValue"] = safe_float(val)
                        elif "rating" in h:
                            deb["creditRating"] = val
                        elif "price" in h or "close" in h:
                            deb["currentPrice"] = safe_float(val)
                        elif "yield" in h or "ytm" in h:
                            deb["yieldToMaturity"] = safe_float(val)
                        elif "volume" in h or "traded" in h:
                            deb["volume"] = safe_int(val)

                if deb.get("symbol"):
                    deb.setdefault("name", deb["symbol"])
                    deb.setdefault("issuer", "Unknown")
                    deb.setdefault("couponRate", 8.0)
                    deb.setdefault("faceValue", 1000)
                    deb.setdefault("creditRating", "AA")
                    deb.setdefault("currentPrice", deb["faceValue"])
                    debentures.append(deb)

    except Exception as e:
        debentures = [{"error": str(e)}]

    cache_set(cache_key, debentures)
    return debentures


if __name__ == "__main__":
    data = scrape_debentures(force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
