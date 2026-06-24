"""Scrape IPO/FPO data from ShareSansar DataTable API."""
import json
import re
import sys
import urllib.request
import urllib.parse
from .config import cache_get, cache_set, safe_float, safe_int, BASE_URL, HEADERS

PAGE_SIZE = 50


def _fetch_page(start=0):
    params = {
        "draw": "1", "start": str(start), "length": str(PAGE_SIZE),
        "columns[0][data]": "DT_Row_Index", "columns[0][orderable]": "false",
        "columns[1][data]": "company.symbol", "columns[1][orderable]": "false",
        "columns[2][data]": "company.companyname", "columns[2][orderable]": "false",
        "columns[3][data]": "company.sector.sectorname", "columns[3][orderable]": "false",
        "columns[4][data]": "ratio_value", "columns[4][orderable]": "false",
        "columns[5][data]": "issue_open_date", "columns[5][orderable]": "false",
        "columns[6][data]": "issue_close_date", "columns[6][orderable]": "false",
    }
    query = urllib.parse.urlencode(params)
    url = f"{BASE_URL}/upcoming-issue?{query}"
    req = urllib.request.Request(url, headers={
        "User-Agent": HEADERS["User-Agent"],
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": f"{BASE_URL}/upcoming-issue",
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def scrape_ipo(force=False):
    cache_key = "ipo"
    if not force:
        cached = cache_get(cache_key, max_age_hours=24)
        if cached:
            return cached

    ipo_data = []
    try:
        first_page = _fetch_page(0)
        total = first_page.get("recordsTotal", 0)
        all_items = first_page.get("data", [])
        if total > PAGE_SIZE:
            pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
            for page in range(1, pages):
                try:
                    page_data = _fetch_page(page * PAGE_SIZE)
                    all_items.extend(page_data.get("data", []))
                except Exception:
                    break

        for item in all_items:
            company = item.get("company", {})
            symbol = re.sub(r"<[^>]+>", "", company.get("symbol", "")).strip()
            name = re.sub(r"<[^>]+>", "", company.get("companyname", "")).strip()
            sector = ""
            if company.get("sector"):
                sector = company["sector"].get("sectorname", "")

            total_units = safe_int(item.get("total_units", 0))
            amount = safe_float(item.get("amount", 0))

            ipo_data.append({
                "symbol": symbol,
                "name": name or symbol,
                "sector": sector or "Other",
                "type": item.get("displayable_share_type", "IPO"),
                "issuePrice": amount / total_units if total_units > 0 else 0,
                "totalUnits": total_units,
                "amount": amount,
                "ratio": item.get("ratio_value"),
                "openDate": item.get("issue_open_date") or "",
                "closeDate": item.get("issue_close_date") or "",
                "applicationDate": item.get("application_date") or "",
                "priceRange": f"Rs {amount / total_units:.2f}" if total_units > 0 else "TBA",
                "status": "Upcoming",
                "issueManager": item.get("issue_manager", ""),
            })
    except Exception as e:
        print(f"SCRAPER ERROR: {type(e).__name__}: {e}", file=sys.stderr)

    cache_set(cache_key, ipo_data)
    return ipo_data


if __name__ == "__main__":
    data = scrape_ipo(force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
