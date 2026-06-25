"""Scrape earnings calendar from ShareSansar."""
import json
import re
import sys
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from .config import create_session, cache_get, cache_set, safe_float, BASE_URL


def _get_earnings_from_announcements():
    """Fallback: extract earnings-related announcements."""
    try:
        from .announcements import scrape_announcements
        announcements = scrape_announcements()
        today = datetime.now().strftime("%Y-%m-%d")
        cutoff = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")

        earnings = []
        for ann in announcements:
            if ann.get("type") != "report":
                continue
            date = ann.get("date", "")
            if date < cutoff:
                continue
            symbol = ann.get("symbol", "").upper()
            if not symbol:
                continue

            title = ann.get("title", "")
            fiscal_year = ""
            fy_match = re.search(r"FY\s*(\d{4}(?:/\d{4})?)", title, re.IGNORECASE)
            if fy_match:
                fiscal_year = fy_match.group(1)

            report_type = "Annual"
            if "quarterly" in title.lower() or "q1" in title.lower() or "q2" in title.lower() or "q3" in title.lower() or "q4" in title.lower():
                report_type = "Quarterly"
            elif "annual" in title.lower():
                report_type = "Annual"

            earnings.append({
                "symbol": symbol,
                "companyName": symbol,
                "sector": "Other",
                "reportType": report_type,
                "announcementDate": date,
                "fiscalYear": fiscal_year,
                "estimatedEPS": None,
                "previousEPS": None,
                "_source": "announcements",
            })

        return earnings
    except Exception as e:
        print(f"Earnings fallback error: {e}", file=sys.stderr)
        return []


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
        print(f"SCRAPER ERROR: {type(e).__name__}: {e}", file=sys.stderr)

    if not earnings:
        earnings = _get_earnings_from_announcements()

    cache_set(cache_key, earnings)
    return earnings


if __name__ == "__main__":
    data = scrape_earnings_calendar(force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
