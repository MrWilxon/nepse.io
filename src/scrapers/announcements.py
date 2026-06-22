"""Scrape corporate announcements from NEPSE."""
import json
import sys
import time
from bs4 import BeautifulSoup
from .config import create_session, cache_get, cache_set, NEPSE_URL


def scrape_announcements(force=False):
    """Scrape corporate announcements and notices."""
    cache_key = "announcements"
    if not force:
        cached = cache_get(cache_key, max_age_hours=6)
        if cached:
            return cached

    session = create_session()
    announcements = []

    try:
        # NEPSE announcements page
        url = f"{NEPSE_URL}/announcement"
        resp = session.get(url, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        # Look for announcement items
        items = soup.select(".announcement-item, .notice-item, .news-item, article, .list-group-item")
        for item in items:
            title_el = item.select_one("h3, h4, h5, .title, .heading, a")
            date_el = item.select_one(".date, .time, time, .meta")
            type_el = item.select_one(".type, .category, .badge")

            if title_el:
                announcements.append({
                    "title": title_el.get_text(strip=True),
                    "date": date_el.get_text(strip=True) if date_el else "",
                    "type": type_el.get_text(strip=True) if type_el else "General",
                    "source": "NEPSE",
                })

        # Also try ShareSansar news/announcements
        if not announcements:
            try:
                url2 = f"{BASE_URL}/news"
                resp2 = session.get(url2, timeout=15)
                if resp2.status_code == 200:
                    soup2 = BeautifulSoup(resp2.text, "lxml")
                    items2 = soup2.select(".news-item, article, .list-group-item")
                    for item in items2:
                        title_el = item.select_one("h3, h4, h5, .title, a")
                        date_el = item.select_one(".date, time, .meta")
                        if title_el:
                            announcements.append({
                                "title": title_el.get_text(strip=True),
                                "date": date_el.get_text(strip=True) if date_el else "",
                                "type": "News",
                                "source": "ShareSansar",
                            })
            except Exception:
                pass

    except Exception as e:
        announcements = [{"error": str(e)}]

    cache_set(cache_key, announcements)
    return announcements


if __name__ == "__main__":
    data = scrape_announcements(force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
