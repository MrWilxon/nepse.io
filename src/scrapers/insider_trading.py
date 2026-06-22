"""Scrape insider trading data from ShareSansar/SEBON."""
import json
import sys
import time
from bs4 import BeautifulSoup
from .config import create_session, cache_get, cache_set, safe_float, safe_int, BASE_URL


def scrape_insider_trading(force=False):
    """Scrape insider trading transactions."""
    cache_key = "insider_trading"
    if not force:
        cached = cache_get(cache_key, max_age_hours=12)
        if cached:
            return cached

    session = create_session()
    transactions = []

    try:
        # Try ShareSansar insider trading page
        url = f"{BASE_URL}/insider-trading"
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

                tx = {}
                for i, cell in enumerate(cells):
                    if i < len(headers):
                        val = cell.get_text(strip=True)
                        h = headers[i]
                        if "symbol" in h or "scrip" in h:
                            tx["symbol"] = val
                        elif "name" in h and ("insider" in h or "person" in h):
                            tx["insiderName"] = val
                        elif "designation" in h or "position" in h:
                            tx["designation"] = val
                        elif "type" in h and ("transaction" in h or "buy" in h or "sell" in h):
                            tx["transactionType"] = val
                        elif "quantity" in h or "qty" in h or "shares" in h:
                            tx["quantity"] = safe_int(val)
                        elif "rate" in h or "price" in h:
                            tx["price"] = safe_float(val)
                        elif "amount" in h or "value" in h:
                            tx["totalValue"] = safe_float(val)
                        elif "date" in h:
                            tx["date"] = val
                        elif "holding" in h and ("after" in h or "total" in h):
                            tx["holdingAfter"] = safe_int(val)

                if tx.get("symbol"):
                    tx.setdefault("insiderName", "Unknown")
                    tx.setdefault("designation", "Director")
                    tx.setdefault("transactionType", "Buy")
                    tx.setdefault("quantity", 0)
                    tx.setdefault("price", 0)
                    tx.setdefault("totalValue", 0)
                    tx.setdefault("date", "")
                    transactions.append(tx)

        # Also try SEBON
        if not transactions:
            try:
                sebon_url = "https://www.sebon.gov.np/insider-trading"
                resp = session.get(sebon_url, timeout=15)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "lxml")
                    tables = soup.find_all("table")
                    for table in tables:
                        rows = table.find_all("tr")
                        for row in rows[1:]:
                            cells = row.find_all("td")
                            if len(cells) >= 5:
                                transactions.append({
                                    "symbol": cells[0].get_text(strip=True),
                                    "insiderName": cells[1].get_text(strip=True),
                                    "designation": cells[2].get_text(strip=True),
                                    "transactionType": cells[3].get_text(strip=True),
                                    "quantity": safe_int(cells[4].get_text(strip=True)),
                                    "price": safe_float(cells[5].get_text(strip=True)) if len(cells) > 5 else 0,
                                    "totalValue": safe_float(cells[6].get_text(strip=True)) if len(cells) > 6 else 0,
                                    "date": cells[7].get_text(strip=True) if len(cells) > 7 else "",
                                })
            except Exception:
                pass

    except Exception as e:
        transactions = [{"error": str(e)}]

    cache_set(cache_key, transactions)
    return transactions


if __name__ == "__main__":
    data = scrape_insider_trading(force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
