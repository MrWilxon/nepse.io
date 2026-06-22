"""
NEPSE Data Scraper - Robust version with session-based cookies.
Fetches daily and historical stock data from ShareSansar.
Uses Playwright for daily data (JavaScript-rendered page) and requests for historical API.
"""

import sys
import time
import json
import requests
import pandas as pd
from pathlib import Path
from datetime import datetime
from bs4 import BeautifulSoup

BASE_URL = "https://www.sharesansar.com"
HISTORY_URL = f"{BASE_URL}/company-price-history"
DAILY_URL = f"{BASE_URL}/today-share-price"

DATA_DIR = Path(__file__).parent.parent / "data" / "company-wise"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": f"{BASE_URL}/today-share-price",
    "X-Requested-With": "XMLHttpRequest",
}

COMPANY_ID_MAP = {
    "NMB": 1, "SBL": 2, "NCCB": 3, "KBL": 5, "LBL": 6, "MBL": 7, "EBL": 10,
    "NBB": 11, "SBI": 12, "HBL": 13, "SCB": 14, "NIB": 15, "NABIL": 16,
    "CZBIL": 18, "PCBL": 22, "SRBL": 23, "ADBL": 24, "SANIMA": 166, "MEGA": 301,
    "CBL": 325, "CCBL": 335, "NBL": 341, "GBIME": 404, "NICA": 446, "PRVU": 509,
    "BOKL": 634, "CORBL": 309, "EDBL": 182, "GBBL": 150, "GRDBL": 487,
    "JBBL": 151, "KRBL": 155, "KSBBL": 657, "LBBL": 668, "MDB": 149,
    "MLBL": 637, "MNBBL": 306, "NABBC": 167, "SADBL": 298, "SAPDBL": 999,
    "SHBL": 343, "SHINE": 440, "SINDU": 313, "BFC": 40, "CFCL": 54, "CFL": 88,
    "CMB": 66, "GFCL": 43, "GMFIL": 71, "GUFL": 603, "ICFC": 77, "JFL": 59,
    "MFIL": 337, "MPFL": 318, "NFS": 25, "PFL": 47, "PROFL": 323, "RLFL": 491,
    "SFCL": 64, "SIFC": 53, "CGH": 872, "OHL": 97, "SHL": 95, "TRH": 96,
    "AHPC": 121, "AKJCL": 590, "AKPL": 514, "API": 527, "BARUN": 493,
    "BNHC": 782, "BPCL": 119, "CHCL": 120, "CHL": 628, "DHPL": 542,
    "GHL": 579, "GLH": 755, "HDHPC": 722, "HPPL": 618, "HURJA": 584,
    "JOSHI": 665, "KKHC": 578, "KPCL": 701, "LEC": 874, "MBJC": 505,
    "MEN": 844, "MHNL": 678, "MKJC": 535, "NGPL": 570, "NHDL": 612,
    "NHPC": 118, "NYADI": 544, "PMHPL": 681, "PPCL": 720, "RADHI": 574,
    "RHPC": 468, "RHPL": 474, "RRHP": 654, "RURU": 742, "SAHAS": 656,
    "SHEL": 832, "SHPC": 432, "SJCL": 380, "SPC": 1008, "SPDL": 617,
    "SSHL": 740, "TPC": 968, "UMHL": 585, "UMRH": 956, "UNHPL": 683,
    "UPCL": 610, "UPPER": 498, "CHDC": 518, "CIT": 33, "HIDCL": 513,
    "NIFRA": 896, "NRN": 972, "ALICL": 143, "GLICL": 305, "JLI": 741,
    "LICN": 138, "NLIC": 137, "NLICL": 128, "PLI": 758, "PLIC": 144,
    "RLI": 764, "SLI": 736, "SLICL": 145, "ULI": 717,
}


def create_session():
    """Create a requests session with fresh cookies from ShareSansar."""
    session = requests.Session()
    session.headers.update(HEADERS)
    try:
        session.get(BASE_URL, timeout=15)
        time.sleep(1)
    except Exception as e:
        print(f"Warning: Could not fetch homepage for cookies: {e}")
    return session


def build_history_params(start, length, company_id):
    """Build DataTables-compatible query parameters."""
    params = {
        "draw": "2",
        "start": str(start),
        "length": str(length),
        "company": str(company_id),
        "search[value]": "",
        "search[regex]": "false",
    }
    for i, col in enumerate(["DT_Row_Index", "published_date", "open", "high", "low", "close", "per_change", "traded_quantity", "traded_amount"]):
        params[f"columns[{i}][data]"] = col
        params[f"columns[{i}][name]"] = ""
        params[f"columns[{i}][searchable]"] = "true" if col == "published_date" else "false"
        params[f"columns[{i}][orderable]"] = "false"
        params[f"columns[{i}][search][value]"] = ""
        params[f"columns[{i}][search][regex]"] = "false"
    params["_"] = str(int(time.time() * 1000))
    return params


def scrape_daily(session=None):
    """Scrape today's share price using Playwright for JavaScript-rendered page."""
    print("Fetching daily share prices with Playwright...", file=sys.stderr)

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return {"updated": 0, "skipped": 0, "errors": 0, "date": "", "error": "Playwright not installed. Run: pip install playwright && python -m playwright install chromium"}

    today = datetime.now().strftime("%Y-%m-%d")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(DAILY_URL, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(3000)

            date_el = page.query_selector("span.text-org")
            if date_el:
                today = date_el.inner_text().strip()
            print(f"Trading date: {today}", file=sys.stderr)

            html = page.content()
            browser.close()

        bs = BeautifulSoup(html, "lxml")
        tables = pd.read_html(html)

        dataTable = None
        for t in tables:
            cols = [str(c).lower() for c in t.columns]
            if any("symbol" in c for c in cols) and any("open" in c for c in cols):
                dataTable = t
                break

        if dataTable is None:
            return {"updated": 0, "skipped": 0, "errors": 0, "date": today, "error": "Stock table not found in rendered HTML"}

        updated = 0
        skipped = 0
        errors = 0

        for file in DATA_DIR.glob("*.csv"):
            try:
                symbol = file.stem
                existingDf = pd.read_csv(file)
                lastDate = str(existingDf.iloc[-1]["published_date"])

                if lastDate == today:
                    skipped += 1
                    continue

                row = dataTable.loc[dataTable["Symbol"] == symbol]
                if len(row) == 0:
                    errors += 1
                    continue

                data = row.iloc[0]
                status = 1 if float(data["Close"]) > float(data["Open"]) else (-1 if float(data["Close"]) < float(data["Open"]) else 0)
                newRow = pd.DataFrame([{
                    "published_date": today,
                    "open": float(data["Open"]),
                    "high": float(data["High"]),
                    "low": float(data["Low"]),
                    "close": float(data["Close"]),
                    "per_change": float(data["Diff %"]),
                    "traded_quantity": float(data["Vol"]),
                    "traded_amount": float(data["Turnover"]),
                    "status": status,
                }])
                newRow.to_csv(file, mode="a", header=False, index=False)
                updated += 1
            except Exception as e:
                errors += 1

        result = {"updated": updated, "skipped": skipped, "errors": errors, "date": today}
        print(f"Daily scrape complete: {updated} updated, {skipped} skipped, {errors} errors", file=sys.stderr)
        return result

    except Exception as e:
        print(f"Playwright scrape failed: {e}", file=sys.stderr)
        return {"updated": 0, "skipped": 0, "errors": 0, "date": today, "error": str(e)}


def scrape_history(session=None, symbols=None, max_retries=3):
    """Scrape full historical data for specified companies."""
    if session is None:
        session = create_session()

    targets = symbols or list(COMPANY_ID_MAP.keys())
    results = {"success": [], "failed": []}

    for symbol in targets:
        if symbol not in COMPANY_ID_MAP:
            results["failed"].append({"symbol": symbol, "error": "Unknown symbol"})
            continue

        company_id = COMPANY_ID_MAP[symbol]
        print(f"Scraping {symbol} (ID: {company_id})...", file=sys.stderr)

        for attempt in range(max_retries):
            try:
                params = build_history_params(0, 1, company_id)
                resp = session.get(HISTORY_URL, params=params, timeout=30)
                resp.raise_for_status()
                total = resp.json().get("recordsTotal", 0)

                if total == 0:
                    print(f"  No records for {symbol}", file=sys.stderr)
                    break

                all_data = []
                page_size = 50
                pages = (total // page_size) + 1

                for page in range(pages):
                    start = page * page_size
                    params = build_history_params(start, page_size, company_id)
                    resp = session.get(HISTORY_URL, params=params, timeout=30)
                    resp.raise_for_status()
                    page_data = resp.json().get("data", [])
                    all_data.extend(page_data)
                    time.sleep(0.3)

                all_data.reverse()

                df = pd.DataFrame(all_data)
                if "DT_Row_Index" in df.columns:
                    df = df.drop(columns=["DT_Row_Index"])

                filepath = DATA_DIR / f"{symbol}.csv"
                df.to_csv(filepath, index=False)
                print(f"  Saved {len(df)} records", file=sys.stderr)
                results["success"].append(symbol)
                break

            except Exception as e:
                print(f"  Attempt {attempt + 1} failed: {e}", file=sys.stderr)
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    session = create_session()
                else:
                    results["failed"].append({"symbol": symbol, "error": str(e)})

    return results


FLOORSHEET_URL = "https://www.nepalstock.com.np/floor-sheet"
FLOORSHEET_DATA_DIR = Path(__file__).parent.parent / "data"


def scrape_floorsheet():
    """Scrape today's floor sheet from NEPSE using Playwright."""
    print("Fetching floor sheet from NEPSE...", file=sys.stderr)

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return {"error": "Playwright not installed. Run: pip install playwright && python -m playwright install chromium", "records": []}

    today = datetime.now().strftime("%Y-%m-%d")
    records = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(FLOORSHEET_URL, wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(5000)

            html = page.content()
            browser.close()

        bs = BeautifulSoup(html, "lxml")
        tables = pd.read_html(html)

        dataTable = None
        for t in tables:
            cols = [str(c).lower().strip() for c in t.columns]
            if any("contract" in c for c in cols) or any("symbol" in c for c in cols):
                dataTable = t
                break

        if dataTable is None and len(tables) > 0:
            dataTable = tables[0]

        if dataTable is None or len(dataTable) == 0:
            return {"error": "Floor sheet table not found", "records": [], "date": today}

        col_map = {}
        for col in dataTable.columns:
            c = str(col).lower().strip()
            if "sn" in c or "s.n" in c:
                col_map["sn"] = col
            elif "contract" in c:
                col_map["contractNo"] = col
            elif "symbol" in c or "stock" in c:
                col_map["symbol"] = col
            elif "buyer" in c and "broker" in c:
                col_map["buyerBroker"] = col
            elif "seller" in c and "broker" in c:
                col_map["sellerBroker"] = col
            elif "qty" in c or "quantity" in c:
                col_map["quantity"] = col
            elif "rate" in c or "price" in c:
                col_map["rate"] = col
            elif "amount" in c or "turnover" in c:
                col_map["amount"] = col

        for _, row in dataTable.iterrows():
            try:
                record = {
                    "sn": int(row[col_map["sn"]]) if "sn" in col_map else 0,
                    "contractNo": str(row[col_map["contractNo"]]) if "contractNo" in col_map else "",
                    "symbol": str(row[col_map["symbol"]]).strip() if "symbol" in col_map else "",
                    "buyerBroker": int(row[col_map["buyerBroker"]]) if "buyerBroker" in col_map else 0,
                    "sellerBroker": int(row[col_map["sellerBroker"]]) if "sellerBroker" in col_map else 0,
                    "quantity": int(float(str(row[col_map["quantity"]]).replace(",", ""))) if "quantity" in col_map else 0,
                    "rate": float(str(row[col_map["rate"]]).replace(",", "")) if "rate" in col_map else 0,
                    "amount": float(str(row[col_map["amount"]]).replace(",", "")) if "amount" in col_map else 0,
                }
                if record["symbol"]:
                    records.append(record)
            except Exception:
                continue

        # Save to JSON
        floorsheet_file = FLOORSHEET_DATA_DIR / "floorsheet.json"
        output = {"date": today, "records": records, "totalRecords": len(records)}
        with open(floorsheet_file, "w") as f:
            json.dump(output, f, indent=2)

        print(f"Floor sheet scraped: {len(records)} records", file=sys.stderr)
        return {"date": today, "totalRecords": len(records), "records": records[:5]}

    except Exception as e:
        print(f"Floor sheet scrape failed: {e}", file=sys.stderr)
        return {"error": str(e), "records": [], "date": today}


if __name__ == "__main__":
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    mode = sys.argv[1] if len(sys.argv) > 1 else "daily"
    if mode == "daily":
        result = scrape_daily()
        print(json.dumps(result))
    elif mode == "history":
        symbols = sys.argv[2:] if len(sys.argv) > 2 else None
        result = scrape_history(symbols=symbols)
        print(json.dumps(result))
    elif mode == "floorsheet":
        result = scrape_floorsheet()
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "Usage: python scraper.py [daily|history|floorsheet] [symbols...]"}))
