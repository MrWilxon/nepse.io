"""Scrape dividend data from ShareSansar DataTable API."""
import json
import re
import sys
import urllib.request
import urllib.parse
from .config import cache_get, cache_set, safe_float, BASE_URL, HEADERS

PAGE_SIZE = 50


def _fetch_page(start=0):
    params = {
        "draw": "1",
        "start": str(start),
        "length": str(PAGE_SIZE),
        "type": "LATEST",
        "duration": "1Year",
        "columns[0][data]": "DT_Row_Index",
        "columns[0][orderable]": "false",
        "columns[1][data]": "symbol",
        "columns[2][data]": "companyname",
        "columns[3][data]": "bonus_share",
        "columns[4][data]": "cash_dividend",
        "columns[5][data]": "total_dividend",
        "columns[6][data]": "announcement_date",
        "order[0][column]": "6",
        "order[0][dir]": "desc",
    }
    query = urllib.parse.urlencode(params)
    url = f"{BASE_URL}/proposed-dividend?{query}"
    req = urllib.request.Request(url, headers={
        "User-Agent": HEADERS["User-Agent"],
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": f"{BASE_URL}/proposed-dividend",
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def scrape_dividends(symbols=None, force=False):
    cache_key = "dividends"
    if not force:
        cached = cache_get(cache_key, max_age_hours=24)
        if cached:
            return cached

    all_dividends = {}
    try:
        first_page = _fetch_page(0)
        total = first_page.get("recordsTotal", 0)
        if total == 0:
            cache_set(cache_key, all_dividends)
            return all_dividends

        pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
        all_items = first_page.get("data", [])
        for page in range(1, pages):
            try:
                page_data = _fetch_page(page * PAGE_SIZE)
                all_items.extend(page_data.get("data", []))
            except Exception:
                break

        for item in all_items:
            symbol_html = item.get("symbol", "")
            symbol = re.sub(r"<[^>]+>", "", symbol_html).strip()
            if not symbol:
                continue
            if symbols and symbol not in symbols:
                continue
            if symbol not in all_dividends:
                all_dividends[symbol] = []

            bonus = safe_float(item.get("bonus_share", 0))
            cash = safe_float(item.get("cash_dividend", 0))
            total = safe_float(item.get("total_dividend", 0))

            entry = {
                "fiscalYear": item.get("year", ""),
                "cashDividend": cash,
                "bonusDividend": bonus,
                "rightsDividend": 0,
                "totalDividend": total,
                "announcementDate": item.get("announcement_date", ""),
                "bookCloseDate": item.get("bookclose_date") or "",
                "distributionDate": item.get("distribution_date") or "",
                "bonusListingDate": item.get("bonus_listing_date") or "",
                "ltp": safe_float(item.get("close")) if item.get("close") else None,
            }

            status = item.get("status", -1)
            if status == -1:
                entry["status"] = "upcoming"
            elif status == 0:
                entry["status"] = "open"
            else:
                entry["status"] = "closed"

            all_dividends[symbol].append(entry)
    except Exception as e:
        import traceback
        print(f"SCRAPER ERROR: {type(e).__name__}: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)

    cache_set(cache_key, all_dividends)
    return all_dividends


if __name__ == "__main__":
    symbols = sys.argv[1:] if len(sys.argv) > 1 else None
    data = scrape_dividends(symbols=symbols, force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
