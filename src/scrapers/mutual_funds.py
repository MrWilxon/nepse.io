"""Scrape mutual fund data from ShareSansar."""
import json
import sys
import time
from bs4 import BeautifulSoup
from .config import create_session, cache_get, cache_set, safe_float, safe_int, BASE_URL


def scrape_mutual_funds(force=False):
    """Scrape mutual fund list and NAV data."""
    cache_key = "mutual_funds"
    if not force:
        cached = cache_get(cache_key, max_age_hours=24)
        if cached:
            return cached

    session = create_session()
    funds = []

    try:
        url = f"{BASE_URL}/mutual-fund"
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

                fund = {}
                for i, cell in enumerate(cells):
                    if i < len(headers):
                        val = cell.get_text(strip=True)
                        h = headers[i]
                        if "symbol" in h or "code" in h:
                            fund["symbol"] = val
                        elif "name" in h:
                            fund["name"] = val
                        elif "nav" in h:
                            fund["nav"] = safe_float(val)
                        elif "category" in h or "type" in h:
                            fund["category"] = val
                        elif "aum" in h or "fund size" in h:
                            fund["aum"] = safe_float(val)
                        elif "return" in h and ("1y" in h or "year" in h):
                            fund["oneYearReturn"] = safe_float(val)
                        elif "return" in h and "ytd" in h:
                            fund["ytdReturn"] = safe_float(val)
                        elif "expense" in h or "ratio" in h:
                            fund["expenseRatio"] = safe_float(val)

                if fund.get("symbol"):
                    fund.setdefault("name", fund["symbol"])
                    fund.setdefault("category", "Open End")
                    fund.setdefault("nav", 100)
                    fund.setdefault("aum", 0)
                    fund.setdefault("oneYearReturn", 0)
                    fund.setdefault("ytdReturn", 0)
                    fund.setdefault("expenseRatio", 0)
                    funds.append(fund)

        # Try to get individual fund NAV history
        for fund in funds[:20]:  # Limit to avoid too many requests
            try:
                fund_url = f"{BASE_URL}/mutual-fund/{fund['symbol'].lower()}"
                resp = session.get(fund_url, timeout=15)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "lxml")
                    # Look for NAV history table
                    tables = soup.find_all("table")
                    for table in tables:
                        rows = table.find_all("tr")
                        if len(rows) > 2:
                            history = []
                            for row in rows[1:]:
                                cells = row.find_all("td")
                                if len(cells) >= 2:
                                    history.append({
                                        "date": cells[0].get_text(strip=True),
                                        "nav": safe_float(cells[1].get_text(strip=True)),
                                    })
                            if history:
                                fund["navHistory"] = history[-30:]  # Last 30 days
                time.sleep(0.3)
            except Exception:
                pass

    except Exception as e:
        funds = [{"error": str(e)}]

    cache_set(cache_key, funds)
    return funds


if __name__ == "__main__":
    data = scrape_mutual_funds(force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
