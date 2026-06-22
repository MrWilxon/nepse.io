"""Main entry point for NEPSE data scrapers."""
import sys
import json

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python -m src.scrapers <scraper_name> [--force]"}))
        return

    scraper_name = sys.argv[1]
    force = "--force" in sys.argv
    symbols = [a for a in sys.argv[2:] if not a.startswith("--")]

    if scraper_name == "fundamentals":
        from .fundamentals import scrape_fundamentals
        data = scrape_fundamentals(symbols=symbols or None, force=force)
    elif scraper_name == "ipo":
        from .ipo import scrape_ipo
        data = scrape_ipo(force=force)
    elif scraper_name == "dividends":
        from .dividends import scrape_dividends
        data = scrape_dividends(symbols=symbols or None, force=force)
    elif scraper_name == "mutual_funds":
        from .mutual_funds import scrape_mutual_funds
        data = scrape_mutual_funds(force=force)
    elif scraper_name == "debentures":
        from .debentures import scrape_debentures
        data = scrape_debentures(force=force)
    elif scraper_name == "insider_trading":
        from .insider_trading import scrape_insider_trading
        data = scrape_insider_trading(force=force)
    elif scraper_name == "earnings":
        from .earnings import scrape_earnings_calendar
        data = scrape_earnings_calendar(force=force)
    elif scraper_name == "brokers":
        from .brokers import scrape_brokers
        data = scrape_brokers(force=force)
    elif scraper_name == "holdings":
        from .holdings import scrape_holdings
        data = scrape_holdings(symbols=symbols or None, force=force)
    elif scraper_name == "announcements":
        from .announcements import scrape_announcements
        data = scrape_announcements(force=force)
    else:
        data = {"error": f"Unknown scraper: {scraper_name}"}

    print(json.dumps(data))

if __name__ == "__main__":
    main()
