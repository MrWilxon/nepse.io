"""Scrape NEPSE index and sub-indices data from ShareSansar."""
import json
import sys
import time
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from .config import create_session, create_api_session, cache_get, cache_set, safe_float, safe_int, BASE_URL

# Index IDs from the ShareSansar index-history-data dropdown
INDEX_IDS = {
    "Banking SubIndex": 1,
    "Development Bank Index": 2,
    "Finance Index": 3,
    "Float Index": 4,
    "Hotels And Tourism": 5,
    "HydroPower Index": 6,
    "Insurance": 7,
    "Investment": 18,
    "Life Insurance": 8,
    "Manufacturing And Processing": 9,
    "Microfinance Index": 10,
    "Mutual Fund": 11,
    "NEPSE Index": 12,
    "Non Life Insurance": 13,
    "Others Index": 14,
    "Sensitive Float Index": 15,
    "Sensitive Index": 16,
    "Trading Index": 17,
}


def _parse_index_table_row(row):
    """Parse a single row from the index tables on datewise-indices."""
    cells = row.find_all("td")
    if len(cells) < 5:
        return None
    name = cells[0].get_text(strip=True).rstrip(" ")
    return {
        "name": name,
        "value": safe_float(cells[1].get_text(strip=True)),
        "change": safe_float(cells[2].get_text(strip=True)),
        "changePct": safe_float(cells[3].get_text(strip=True)),
        "turnover": safe_float(cells[4].get_text(strip=True)),
    }


def scrape_nepse_index(force=False):
    """Scrape current NEPSE index, sub-indices, and historical data."""
    cache_key = "nepse_index"
    if not force:
        cached = cache_get(cache_key, max_age_hours=12)
        if cached:
            return cached

    session = create_session()
    result = {
        "nepseIndex": {
            "value": 0,
            "change": 0,
            "changePct": 0,
            "volume": 0,
            "turnover": 0,
            "date": "",
        },
        "subIndices": [],
        "history": [],
    }

    # Step 1: Get current indices from datewise-indices page (default = latest)
    try:
        resp = session.get(f"{BASE_URL}/datewise-indices", timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        tables = soup.find_all("table")
        for table in tables:
            rows = table.find_all("tr")
            for row in rows:
                parsed = _parse_index_table_row(row)
                if not parsed:
                    continue

                name = parsed["name"]
                if name == "NEPSE Index":
                    result["nepseIndex"]["value"] = parsed["value"]
                    result["nepseIndex"]["change"] = parsed["change"]
                    result["nepseIndex"]["changePct"] = parsed["changePct"]
                    result["nepseIndex"]["turnover"] = parsed["turnover"]

                    # Try to get the date from the "As of" span
                    date_span = soup.find("span", class_="text-org")
                    if date_span:
                        result["nepseIndex"]["date"] = date_span.get_text(strip=True)

                    # Estimate volume from turnover / value
                    if parsed["value"] > 0:
                        result["nepseIndex"]["volume"] = int(parsed["turnover"] / parsed["value"])
                else:
                    result["subIndices"].append(parsed)

        time.sleep(0.5)
    except Exception as e:
        result["nepseIndex"]["error"] = str(e)

    # Step 2: Get historical data from index-history-data (NEPSE Index = 12)
    try:
        api_session = create_api_session()
        to_date = datetime.now().strftime("%Y-%m-%d")
        from_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

        resp = api_session.get(
            f"{BASE_URL}/index-history-data",
            params={
                "index_id": 12,
                "from": from_date,
                "to": to_date,
                "draw": 1,
                "start": 0,
                "length": 50,
            },
            timeout=20,
        )
        resp.raise_for_status()

        data = resp.json()
        records = data.get("data", [])
        for rec in records:
            result["history"].append({
                "date": rec.get("published_date", ""),
                "open": safe_float(rec.get("open")),
                "high": safe_float(rec.get("high")),
                "low": safe_float(rec.get("low")),
                "close": safe_float(rec.get("current")),
                "volume": 0,
            })

        time.sleep(0.5)
    except Exception:
        pass  # History is best-effort; current data is primary

    # Fill in defaults
    result["nepseIndex"].setdefault("date", datetime.now().strftime("%Y-%m-%d"))
    result["nepseIndex"].setdefault("volume", 0)
    result["nepseIndex"].setdefault("turnover", 0)

    cache_set(cache_key, result)
    return result


if __name__ == "__main__":
    force = "--force" in sys.argv
    data = scrape_nepse_index(force=force)
    print(json.dumps(data, indent=2))
