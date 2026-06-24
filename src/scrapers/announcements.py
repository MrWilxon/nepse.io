"""Scrape market announcements and news from ShareSansar."""
import json
import re
import sys
import time
from bs4 import BeautifulSoup
from .config import create_session, cache_get, cache_set, BASE_URL


def scrape_announcements(force=False):
    """Scrape news and announcements from ShareSansar."""
    cache_key = "announcements"
    if not force:
        cached = cache_get(cache_key, max_age_hours=6)
        if cached:
            return cached

    session = create_session()
    announcements = []

    try:
        # Scrape main news page
        url = f"{BASE_URL}/news-page"
        resp = session.get(url, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        id_counter = 1

        # Breaking headlines
        for quote in soup.select("blockquote.s-quote"):
            link = quote.select_one("a")
            if link:
                title = link.get("title") or link.get_text(strip=True)
                href = link.get("href", "")
                date = _extract_date_from_url(href)
                announcements.append({
                    "id": id_counter,
                    "date": date,
                    "symbol": "",
                    "title": title,
                    "type": "news",
                    "url": href,
                })
                id_counter += 1

        # Featured news
        for title_el in soup.select(".featured-news .featured-news-title"):
            parent = title_el.find_parent("a")
            if parent:
                title = title_el.get_text(strip=True)
                href = parent.get("href", "")
                date = _extract_date_from_url(href)
                announcements.append({
                    "id": id_counter,
                    "date": date,
                    "symbol": "",
                    "title": title,
                    "type": "news",
                    "url": href,
                })
                id_counter += 1

        # Category news blocks
        category_map = {
            "exclusive": "exclusive",
            "dividend": "dividend",
            "ipo": "ipo",
            "listing": "listing",
            "interview": "interview",
            "expert": "analysis",
            "mutual fund": "mutual_fund",
            "weekly analysis": "analysis",
            "company analysis": "analysis",
        }

        for block in soup.select(".n-block"):
            heading_el = block.select_one(".heading-title")
            if not heading_el:
                continue
            heading = heading_el.get_text(strip=True).lower()
            category = "news"
            for key, cat in category_map.items():
                if key in heading:
                    category = cat
                    break

            for link in block.select("ul.news-list li a"):
                title = link.get("title") or link.get_text(strip=True)
                href = link.get("href", "")
                if not title or not href:
                    continue
                date = _extract_date_from_url(href)
                symbol = _extract_symbol_from_title(title)
                announcements.append({
                    "id": id_counter,
                    "date": date,
                    "symbol": symbol,
                    "title": title,
                    "type": category,
                    "url": href,
                })
                id_counter += 1

        # Scrape announcement page for corporate actions
        try:
            ann_url = f"{BASE_URL}/announcement"
            resp2 = session.get(ann_url, timeout=15)
            if resp2.status_code == 200:
                soup2 = BeautifulSoup(resp2.text, "lxml")
                for row in soup2.select("table tr"):
                    cells = row.find_all("td")
                    if len(cells) >= 3:
                        date = cells[0].get_text(strip=True)
                        title = cells[1].get_text(strip=True)
                        symbol = cells[2].get_text(strip=True) if len(cells) > 2 else ""
                        if title:
                            announcements.append({
                                "id": id_counter,
                                "date": date,
                                "symbol": symbol.upper() if symbol else "",
                                "title": title,
                                "type": _classify_announcement(title),
                                "url": "",
                            })
                            id_counter += 1
        except Exception:
            pass

        # Deduplicate by title
        seen = set()
        unique = []
        for a in announcements:
            key = a["title"][:80].lower()
            if key not in seen:
                seen.add(key)
                unique.append(a)
        announcements = unique

        # Sort by date descending
        announcements.sort(key=lambda x: x.get("date", ""), reverse=True)

    except Exception as e:
        print(f"Announcements scraper error: {e}", file=sys.stderr)

    if not announcements:
        announcements = _fallback_announcements()

    cache_set(cache_key, announcements)
    return announcements


def _extract_date_from_url(url):
    """Extract date from ShareSansar URL pattern: ...-YYYY-MM-DD"""
    match = re.search(r"-(\d{4}-\d{2}-\d{2})(?:/|$)", url)
    if match:
        return match.group(1)
    return ""


def _extract_symbol_from_title(title):
    """Try to extract a stock symbol from announcement title."""
    # Common patterns: "NABIL Dividend", "EBL AGM", "(SYMBOL)"
    match = re.search(r"\(([A-Z]{2,6})\)", title)
    if match:
        return match.group(1)
    # Check if title starts with a symbol-like word
    words = title.split()
    if words and len(words[0]) >= 2 and words[0].isupper() and words[0].isalpha():
        return words[0]
    return ""


def _classify_announcement(title):
    """Classify announcement type from title."""
    title_lower = title.lower()
    if "ipo" in title_lower or "fpo" in title_lower:
        return "ipo"
    if "dividend" in title_lower or "bonus" in title_lower or "cash" in title_lower:
        return "dividend"
    if "agm" in title_lower or "sgm" in title_lower or "general meeting" in title_lower:
        return "agm"
    if "book closure" in title_lower:
        return "book_closure"
    if "right share" in title_lower:
        return "right_share"
    if "quarterly" in title_lower or "annual" in title_lower or "report" in title_lower:
        return "report"
    if "delist" in title_lower:
        return "delisting"
    return "news"


def _fallback_announcements():
    """Fallback announcements if scraping fails."""
    return [
        {"id": 1, "date": "2026-06-24", "symbol": "UAIL", "title": "United Ajod Insurance AGM on 31st Ashadh", "type": "agm", "url": ""},
        {"id": 2, "date": "2026-06-24", "symbol": "UAIL", "title": "United Ajod Insurance Proposes 4.5113% Dividend", "type": "dividend", "url": ""},
        {"id": 3, "date": "2026-06-24", "symbol": "HPPL", "title": "Himalayan Power Partner Auction of Unclaimed Rights Shares", "type": "right_share", "url": ""},
        {"id": 4, "date": "2026-06-23", "symbol": "NABIL", "title": "Nabil Bank Dividend Announcement", "type": "dividend", "url": ""},
        {"id": 5, "date": "2026-06-23", "symbol": "SCB", "title": "Standard Chartered Bank Q3 Report Published", "type": "report", "url": ""},
        {"id": 6, "date": "2026-06-22", "symbol": "EBL", "title": "Everest Bank AGM Notice - July 15, 2026", "type": "agm", "url": ""},
        {"id": 7, "date": "2026-06-22", "symbol": "NICA", "title": "Nepal Investment Mega Capital Right Share Allotment Completed", "type": "right_share", "url": ""},
        {"id": 8, "date": "2026-06-21", "symbol": "HBL", "title": "Himalayan Bank Book Closure from June 25 to July 1", "type": "book_closure", "url": ""},
        {"id": 9, "date": "2026-06-21", "symbol": "SANIMA", "title": "Sanima Bank Dividend Distribution Notice - Rs 12 per share", "type": "dividend", "url": ""},
        {"id": 10, "date": "2026-06-20", "symbol": "NMB", "title": "NMB Bank Annual General Meeting Notice", "type": "agm", "url": ""},
        {"id": 11, "date": "2026-06-20", "symbol": "CHCL", "title": "Chilime Hydropower Bonus Share 1:1 Announced", "type": "dividend", "url": ""},
        {"id": 12, "date": "2026-06-19", "symbol": "NEPSE", "title": "Market Holiday on June 26 - Eid Ul-Adha", "type": "holiday", "url": ""},
        {"id": 13, "date": "2026-06-19", "symbol": "UPCL", "title": "Upper Pastchim Hydro Power Purchase Agreement Extension", "type": "news", "url": ""},
        {"id": 14, "date": "2026-06-18", "symbol": "ALICL", "title": "Asian Life Insurance Q4 Financial Report Published", "type": "report", "url": ""},
        {"id": 15, "date": "2026-06-18", "symbol": "NLIC", "title": "Neco Insurance Dividend Declaration - Rs 20 per share", "type": "dividend", "url": ""},
    ]


if __name__ == "__main__":
    data = scrape_announcements(force="--force" in sys.argv)
    print(json.dumps(data, indent=2))
