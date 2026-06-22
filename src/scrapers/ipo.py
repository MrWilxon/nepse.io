"""Scrape IPO/FPO data from ShareSansar."""
import json
import sys
import time
from bs4 import BeautifulSoup
from .config import create_session, cache_get, cache_set, safe_float, safe_int, BASE_URL


def scrape_ipo(force=False):
    """Scrape IPO and FPO data."""
    cache_key = "ipo"
    if not force:
        cached = cache_get(cache_key, max_age_hours=24)
        if cached:
            return cached

    session = create_session()
    ipo_data = []

    try:
        # ShareSansar IPO page
        url = f"{BASE_URL}/ipo-fpo"
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
                if len(cells) < 4:
                    continue

                entry = {}
                for i, cell in enumerate(cells):
                    if i < len(headers):
                        val = cell.get_text(strip=True)
                        h = headers[i]
                        if "symbol" in h or "scrip" in h:
                            entry["symbol"] = val
                        elif "name" in h or "company" in h:
                            entry["name"] = val
                        elif "sector" in h or "industry" in h:
                            entry["sector"] = val
                        elif "issue" in h and ("price" in h or "rate" in h):
                            entry["issuePrice"] = safe_float(val)
                        elif "date" in h and ("issue" in h or "open" in h):
                            entry["issueDate"] = val
                        elif "status" in h or "result" in h:
                            entry["status"] = val
                        elif "lot" in h:
                            entry["lots"] = safe_int(val)
                        elif "close" in h or "price" in h:
                            entry["currentPrice"] = safe_float(val)
                        elif "change" in h:
                            entry["change"] = safe_float(val)

                if entry.get("symbol"):
                    entry.setdefault("name", entry["symbol"])
                    entry.setdefault("sector", "Other")
                    entry.setdefault("issuePrice", 100)
                    entry.setdefault("status", "Listed")
                    entry.setdefault("lots", 0)
                    entry.setdefault("currentPrice", 0)
                    entry.setdefault("change", 0)
                    ipo_data.append(entry)

        # Also scrape upcoming IPOs from separate section
        upcoming_section = soup.select(".upcoming-ipo, .ipo-upcoming, #upcoming")
        for section in upcoming_section:
            rows = section.find_all("tr")
            for row in rows:
                cells = row.find_all("td")
                if len(cells) >= 3:
                    entry = {
                        "symbol": cells[0].get_text(strip=True),
                        "name": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                        "sector": cells[2].get_text(strip=True) if len(cells) > 2 else "Other",
                        "issuePrice": safe_float(cells[3].get_text(strip=True)) if len(cells) > 3 else 100,
                        "issueDate": cells[4].get_text(strip=True) if len(cells) > 4 else "",
                        "status": "Upcoming",
                        "lots": 0,
                        "currentPrice": 100,
                        "change": 0,
                    }
                    if entry["symbol"] and not any(e["symbol"] == entry["symbol"] for e in ipo_data):
                        ipo_data.append(entry)

    except Exception as e:
        ipo_data = [{"error": str(e)}]

    cache_set(cache_key, ipo_data)
    return ipo_data


if __name__ == "__main__":
    data = scrape_ipo(force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
