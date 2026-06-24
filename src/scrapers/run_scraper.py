"""Standalone scraper runner - avoids python -m module issues."""
import sys
import os
import json

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

SCRAPER_MAP = {
    "dividends": ("src.scrapers.dividends", "scrape_dividends"),
    "brokers": ("src.scrapers.brokers", "scrape_brokers"),
    "ipo": ("src.scrapers.ipo", "scrape_ipo"),
    "nepse_index": ("src.scrapers.nepse_index", "scrape_nepse_index"),
    "announcements": ("src.scrapers.announcements", "scrape_announcements"),
    "fundamentals": ("src.scrapers.fundamentals", "scrape_fundamentals"),
    "earnings": ("src.scrapers.earnings", "scrape_earnings_calendar"),
    "holdings": ("src.scrapers.holdings", "scrape_holdings"),
}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python run_scraper.py <name> [--force]"}))
        sys.exit(1)

    name = sys.argv[1]
    force = "--force" in sys.argv

    if name not in SCRAPER_MAP:
        print(json.dumps({"error": f"Unknown scraper: {name}"}))
        sys.exit(1)

    try:
        module_path, func_name = SCRAPER_MAP[name]
        import importlib
        mod = importlib.import_module(module_path)
        func = getattr(mod, func_name)
        data = func(force=force)
        print(json.dumps(data))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
