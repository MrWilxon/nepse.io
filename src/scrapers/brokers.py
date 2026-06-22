"""Scrape broker trading data from NEPSE."""
import json
import sys
import time
from bs4 import BeautifulSoup
from .config import create_session, cache_get, cache_set, safe_float, safe_int, NEPSE_URL


def scrape_brokers(force=False):
    """Scrape broker-wise trading statistics."""
    cache_key = "brokers"
    if not force:
        cached = cache_get(cache_key, max_age_hours=12)
        if cached:
            return cached

    session = create_session()
    brokers = []

    try:
        # NEPSE broker page
        url = f"{NEPSE_URL}/broker"
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

                broker = {}
                for i, cell in enumerate(cells):
                    if i < len(headers):
                        val = cell.get_text(strip=True)
                        h = headers[i]
                        if "broker" in h and ("no" in h or "number" in h or "#" in h):
                            broker["brokerNo"] = safe_int(val)
                        elif "name" in h:
                            broker["name"] = val
                        elif "buy" in h and ("amount" in h or "turnover" in h):
                            broker["buyAmount"] = safe_float(val)
                        elif "sell" in h and ("amount" in h or "turnover" in h):
                            broker["sellAmount"] = safe_float(val)
                        elif "total" in h and ("amount" in h or "turnover" in h):
                            broker["totalAmount"] = safe_float(val)
                        elif "trans" in h or "trades" in h:
                            broker["transactions"] = safe_int(val)
                        elif "volume" in h or "qty" in h:
                            broker["volume"] = safe_int(val)

                if broker.get("brokerNo") or broker.get("name"):
                    broker.setdefault("brokerNo", len(brokers) + 1)
                    broker.setdefault("name", f"Broker {broker['brokerNo']}")
                    broker.setdefault("buyAmount", 0)
                    broker.setdefault("sellAmount", 0)
                    broker.setdefault("totalAmount", 0)
                    broker.setdefault("transactions", 0)
                    broker.setdefault("volume", 0)
                    brokers.append(broker)

        # Try to get broker detail pages
        for broker in brokers[:10]:  # Limit requests
            try:
                detail_url = f"{NEPSE_URL}/broker/{broker['brokerNo']}"
                resp = session.get(detail_url, timeout=15)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "lxml")
                    # Look for trading history
                    tables = soup.find_all("table")
                    for table in tables:
                        rows = table.find_all("tr")
                        if len(rows) > 2:
                            history = []
                            for row in rows[1:]:
                                cells = row.find_all("td")
                                if len(cells) >= 3:
                                    history.append({
                                        "date": cells[0].get_text(strip=True),
                                        "buyAmount": safe_float(cells[1].get_text(strip=True)),
                                        "sellAmount": safe_float(cells[2].get_text(strip=True)) if len(cells) > 2 else 0,
                                    })
                            if history:
                                broker["history"] = history[-30:]
                time.sleep(0.3)
            except Exception:
                pass

    except Exception as e:
        brokers = [{"error": str(e)}]

    cache_set(cache_key, brokers)
    return brokers


if __name__ == "__main__":
    data = scrape_brokers(force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
