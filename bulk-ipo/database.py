from __future__ import annotations

import asyncio
import logging
import os
import time
from pathlib import Path

import aiosqlite
from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)

DB_PATH = Path(os.environ.get("BULK_IPO_DB", "bulk_ipo.db"))
ENCRYPTION_KEY_PATH = Path(os.environ.get("BULK_IPO_KEY", ".encryption_key"))

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is not None:
        return _fernet
    if ENCRYPTION_KEY_PATH.exists():
        key = ENCRYPTION_KEY_PATH.read_bytes().strip()
    else:
        key = Fernet.generate_key()
        ENCRYPTION_KEY_PATH.write_bytes(key)
        logger.info(f"Generated encryption key at {ENCRYPTION_KEY_PATH}")
    _fernet = Fernet(key)
    return _fernet


def encrypt(plaintext: str) -> str:
    return _get_fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    return _get_fernet().decrypt(ciphertext.encode()).decode()


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS accounts (
                username TEXT PRIMARY KEY,
                user TEXT NOT NULL,
                dp TEXT NOT NULL,
                password_enc TEXT NOT NULL,
                crn_enc TEXT NOT NULL,
                pin_enc TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS apply_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT NOT NULL,
                username TEXT NOT NULL,
                user TEXT NOT NULL,
                company_share_id INTEGER NOT NULL,
                company_name TEXT,
                scrip TEXT,
                kitta INTEGER NOT NULL,
                success INTEGER NOT NULL,
                message TEXT,
                applied_at TEXT DEFAULT (datetime('now'))
            )
        """)
        await db.commit()


async def get_accounts() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM accounts ORDER BY user")
        rows = await cursor.fetchall()
        return [
            {
                "user": r["user"],
                "dp": r["dp"],
                "username": r["username"],
                "password": decrypt(r["password_enc"]),
                "crn": decrypt(r["crn_enc"]),
                "pin": decrypt(r["pin_enc"]),
            }
            for r in rows
        ]


async def get_account_safe(username: str) -> dict | None:
    """Return account without decrypted secrets (for API responses)."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM accounts WHERE username = ?", (username,))
        r = await cursor.fetchone()
        if not r:
            return None
        return {
            "user": r["user"],
            "dp": r["dp"],
            "username": r["username"],
        }


async def get_all_accounts_safe() -> list[dict]:
    """Return all accounts without decrypted secrets."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM accounts ORDER BY user")
        rows = await cursor.fetchall()
        return [{"user": r["user"], "dp": r["dp"], "username": r["username"]} for r in rows]


async def upsert_account(user: str, dp: str, username: str, password: str, crn: str, pin: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO accounts (username, user, dp, password_enc, crn_enc, pin_enc, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
               ON CONFLICT(username) DO UPDATE SET
                 user=excluded.user, dp=excluded.dp,
                 password_enc=excluded.password_enc, crn_enc=excluded.crn_enc,
                 pin_enc=excluded.pin_enc, updated_at=datetime('now')""",
            (username, user, dp, encrypt(password), encrypt(crn), encrypt(pin)),
        )
        await db.commit()


async def delete_account(username: str) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("DELETE FROM accounts WHERE username = ?", (username,))
        await db.commit()
        return cursor.rowcount > 0


async def record_apply(task_id: str, username: str, user: str, company_share_id: int,
                        company_name: str, scrip: str, kitta: int, success: bool, message: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO apply_history (task_id, username, user, company_share_id, company_name, scrip, kitta, success, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (task_id, username, user, company_share_id, company_name, scrip, kitta, int(success), message),
        )
        await db.commit()


async def get_apply_history(limit: int = 100) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM apply_history ORDER BY applied_at DESC LIMIT ?", (limit,))
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
