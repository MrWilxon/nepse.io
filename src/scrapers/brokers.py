"""Scrape broker trading data from ShareSansar DataTable API."""
import json
import sys
import urllib.request
import urllib.parse
from datetime import datetime
from .config import cache_get, cache_set, safe_float, safe_int, BASE_URL, HEADERS

PAGE_SIZE = 50


def _fetch_page(start=0):
    params = {
        "draw": "1", "start": str(start), "length": str(PAGE_SIZE),
        "order[0][column]": "5", "order[0][dir]": "desc",
        "columns[0][data]": "DT_Row_Index", "columns[0][orderable]": "false",
        "columns[1][data]": "number", "columns[1][orderable]": "true",
        "columns[2][data]": "name", "columns[2][orderable]": "true",
        "columns[3][data]": "buyerAmount", "columns[3][orderable]": "true",
        "columns[4][data]": "sellerAmount", "columns[4][orderable]": "true",
        "columns[5][data]": "totalAmount", "columns[5][orderable]": "true",
        "columns[6][data]": "volume", "columns[6][orderable]": "true",
        "columns[7][data]": "transactions", "columns[7][orderable]": "true",
    }
    query = urllib.parse.urlencode(params)
    url = f"{BASE_URL}/top-brokers?{query}"
    req = urllib.request.Request(url, headers={
        "User-Agent": HEADERS["User-Agent"],
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": f"{BASE_URL}/top-brokers",
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def scrape_brokers(force=False):
    cache_key = "brokers"
    if not force:
        cached = cache_get(cache_key, max_age_hours=12)
        if cached:
            return cached

    brokers = []
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
            broker = {
                "brokerNo": safe_int(item.get("number", 0)),
                "name": item.get("name", ""),
                "buyAmount": safe_float(item.get("buyerAmount", 0)),
                "sellAmount": safe_float(item.get("sellerAmount", 0)),
                "totalAmount": safe_float(item.get("totalAmount", 0)),
                "volume": safe_int(item.get("volume", 0)),
                "transactions": safe_int(item.get("transactions", 0)),
                "turnover": safe_float(item.get("totalAmount", 0)),
            }
            if broker["name"] or broker["brokerNo"]:
                brokers.append(broker)
    except Exception as e:
        print(f"SCRAPER ERROR: {type(e).__name__}: {e}", file=sys.stderr)

    result = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "totalTurnover": sum(b["buyAmount"] + b["sellAmount"] for b in brokers),
        "totalVolume": sum(b["volume"] for b in brokers),
        "totalTransactions": sum(b["transactions"] for b in brokers),
        "brokers": brokers,
    }
    cache_set(cache_key, result)
    return result


if __name__ == "__main__":
    data = scrape_brokers(force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
