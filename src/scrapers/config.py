"""Shared configuration for all scrapers."""
import time
import json
import requests
from pathlib import Path
from datetime import datetime

BASE_URL = "https://www.sharesansar.com"
NEPSE_URL = "https://www.nepalstock.com.np"
DATA_DIR = Path(__file__).parent.parent.parent / "data"
CACHE_DIR = DATA_DIR / "cache"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

API_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9",
    "X-Requested-With": "XMLHttpRequest",
}


def create_session():
    """Create a requests session with cookies from ShareSansar."""
    session = requests.Session()
    session.headers.update(HEADERS)
    try:
        session.get(BASE_URL, timeout=15)
        time.sleep(0.5)
    except Exception:
        pass
    return session


def create_api_session():
    """Create a session for API calls."""
    session = requests.Session()
    session.headers.update(API_HEADERS)
    try:
        session.get(BASE_URL, timeout=15)
        time.sleep(0.5)
    except Exception:
        pass
    return session


def cache_get(key, max_age_hours=24):
    """Get cached data if fresh enough."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE_DIR / f"{key}.json"
    if cache_file.exists():
        try:
            with open(cache_file) as f:
                cached = json.load(f)
            cached_time = datetime.fromisoformat(cached.get("timestamp", "2000-01-01"))
            age_hours = (datetime.now() - cached_time).total_seconds() / 3600
            if age_hours < max_age_hours:
                return cached.get("data")
        except Exception:
            pass
    return None


def cache_set(key, data):
    """Cache data with timestamp."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE_DIR / f"{key}.json"
    with open(cache_file, "w") as f:
        json.dump({"timestamp": datetime.now().isoformat(), "data": data}, f)


def safe_float(val, default=0.0):
    """Safely convert to float."""
    try:
        return float(str(val).replace(",", "").replace("%", "").strip())
    except (ValueError, TypeError):
        return default


def safe_int(val, default=0):
    """Safely convert to int."""
    try:
        return int(float(str(val).replace(",", "").strip()))
    except (ValueError, TypeError):
        return default
