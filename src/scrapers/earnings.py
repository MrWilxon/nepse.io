"""Scrape earnings calendar from ShareSansar."""
import json
import sys
import time
from bs4 import BeautifulSoup
from .config import create_session, cache_get, cache_set, safe_float, BASE_URL


def scrape_earnings_calendar(force=False):
    """Scrape earnings announcement dates."""
    cache_key = "earnings_calendar"
    if not force:
        cached = cache_get(cache_key, max_age_hours=24)
        if cached:
            return cached

    session = create_session()
    earnings = []

    try:
        # Try ShareSansar financial results page
        url = f"{BASE_URL}/financial-results"
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
                        if "symbol" in h or "company" in h:
                            entry["symbol"] = val
                        elif "name" in h:
                            entry["companyName"] = val
                        elif "sector" in h:
                            entry["sector"] = val
                        elif "report" in h or "type" in h:
                            entry["reportType"] = val
                        elif "date" in h and ("announce" in h or "publish" in h):
                            entry["announcementDate"] = val
                        elif "fiscal" in h or "year" in h:
                            entry["fiscalYear"] = val
                        elif "eps" in h and ("est" in h or "forecast" in h):
                            entry["estimatedEPS"] = safe_float(val)
                        elif "eps" in h and ("prev" in h or "last" in h):
                            entry["previousEPS"] = safe_float(val)

                if entry.get("symbol"):
                    entry.setdefault("companyName", entry["symbol"])
                    entry.setdefault("sector", "Other")
                    entry.setdefault("reportType", "Annual")
                    earnings.append(entry)

    except Exception as e:
        earnings = [{"error": str(e)}]

    cache_set(cache_key, earnings)
    return earnings


if __name__ == "__main__":
    data = scrape_earnings_calendar(force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
