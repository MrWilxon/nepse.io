from __future__ import annotations

import asyncio
import logging
import time
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from . import database as db
from .models import Account
from .services.meroshare import MeroShareService
from .settings import CAPITALS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

tasks_status: dict[str, dict] = {}
TASK_TTL = 600


# --- Pydantic request models ---

class AccountCreate(BaseModel):
    user: str
    dp: str
    username: str
    password: str
    crn: str
    pin: str


class ApplyRequest(BaseModel):
    usernames: list[str]
    company_share_id: int
    kitta: int = 10
    dry_run: bool = False


# --- Helpers ---

def _dict_to_account(d: dict) -> Account:
    return Account(
        user=d["user"],
        dp=d["dp"],
        username=d["username"],
        password=d["password"],
        crn=d["crn"],
        pin=d["pin"],
    )


async def _run_staggered(coros, delay=1.5):
    results = []
    for i, coro in enumerate(coros):
        if i > 0:
            await asyncio.sleep(delay)
        result = await coro
        results.append(result)
    return results


def _cleanup_tasks():
    now = time.time()
    expired = [k for k, v in tasks_status.items() if now - v.get("timestamp", 0) > TASK_TTL]
    for k in expired:
        del tasks_status[k]


# --- Health ---

@router.get("/health")
async def health():
    try:
        accounts = await db.get_all_accounts_safe()
        return {"status": "ok", "accounts": len(accounts)}
    except Exception:
        return {"status": "error", "accounts": 0}


# --- Capital list ---

@router.get("/capitals")
async def get_capitals():
    return CAPITALS


# --- Account endpoints ---

@router.get("/accounts")
async def get_accounts():
    return await db.get_all_accounts_safe()


@router.post("/accounts")
async def create_or_update_account(account: AccountCreate):
    try:
        acc = _dict_to_account(account.model_dump())
        _ = acc.client_id  # validate DP code
    except ValueError as e:
        return {"success": False, "message": str(e)}
    await db.upsert_account(account.user, account.dp, account.username, account.password, account.crn, account.pin)
    return {"success": True, "message": f"Account '{account.user}' saved."}


@router.delete("/accounts/{username}")
async def delete_account(username: str):
    deleted = await db.delete_account(username)
    if not deleted:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"success": True, "message": f"Account '{username}' deleted."}


@router.post("/accounts/verify")
async def verify_account(account: AccountCreate):
    try:
        acc = _dict_to_account(account.model_dump())
    except Exception as e:
        return {"success": False, "message": f"Invalid account data: {e}"}
    try:
        _ = acc.client_id
    except ValueError as e:
        valid_codes = ", ".join(c["code"] for c in CAPITALS[:5])
        return {
            "success": False,
            "message": f"{e}. Use a 5-digit DP code from the dropdown (e.g. {valid_codes}, ...)."
        }
    try:
        async with MeroShareService(acc) as svc:
            return {"success": True, "message": f"Login successful for {acc.user}"}
    except Exception as e:
        return {"success": False, "message": str(e)}


# --- Issue endpoints ---

@router.get("/issues")
async def get_issues():
    accounts = await db.get_accounts()
    if not accounts:
        return {"issues": [], "account_errors": []}

    account_errors = []
    all_issues = []

    async def fetch_for_account(acc_dict: dict):
        try:
            acc = _dict_to_account(acc_dict)
            async with MeroShareService(acc) as svc:
                issues = await svc.get_open_issues()
                return issues
        except Exception as e:
            account_errors.append({"username": acc_dict["username"], "error": str(e)})
            return []

    coros = [fetch_for_account(a) for a in accounts]
    results = await _run_staggered(coros)

    seen_ids = set()
    for issues in results:
        for issue in issues:
            if issue.company_share_id not in seen_ids:
                seen_ids.add(issue.company_share_id)
                all_issues.append(issue.to_dict())

    return {"issues": all_issues, "account_errors": account_errors}


# --- Bulk apply ---

async def _bulk_apply_task(task_id: str, usernames: list[str], company_share_id: int, kitta: int, dry_run: bool):
    accounts = await db.get_accounts()
    selected = [a for a in accounts if a["username"] in usernames]

    tasks_status[task_id]["total"] = len(selected)
    tasks_status[task_id]["completed"] = 0
    tasks_status[task_id]["results"] = []

    async def apply_for_account(acc_dict: dict):
        try:
            acc = _dict_to_account(acc_dict)
            async with MeroShareService(acc) as svc:
                if dry_run:
                    result = await svc.dry_run_apply(company_share_id)
                    result = {"success": result["can_apply"], "message": result["reason"], "dry_run": True}
                else:
                    result = await svc.apply(kitta, company_share_id)
                    # Record in history
                    issues = await svc.get_open_issues()
                    issue = next((i for i in issues if i.company_share_id == company_share_id), None)
                    await db.record_apply(
                        task_id, acc.username, acc.user, company_share_id,
                        issue.company_name if issue else "Unknown",
                        issue.scrip if issue else "Unknown",
                        kitta, result["success"], result["message"],
                    )
                result["username"] = acc.username
                result["user"] = acc.user
                return result
        except Exception as e:
            return {"success": False, "message": str(e), "username": acc_dict["username"], "user": acc_dict["user"]}

    coros = [apply_for_account(a) for a in selected]
    for i, coro in enumerate(coros):
        if i > 0:
            await asyncio.sleep(1.5)
        result = await coro
        tasks_status[task_id]["results"].append(result)
        tasks_status[task_id]["completed"] = i + 1

    tasks_status[task_id]["status"] = "completed"


@router.post("/apply")
async def bulk_apply(req: ApplyRequest):
    _cleanup_tasks()
    task_id = str(uuid.uuid4())
    tasks_status[task_id] = {
        "status": "queued",
        "total": 0,
        "completed": 0,
        "results": [],
        "timestamp": time.time(),
    }
    asyncio.create_task(_bulk_apply_task(task_id, req.usernames, req.company_share_id, req.kitta, req.dry_run))
    return {"task_id": task_id, "status": "queued", "dry_run": req.dry_run}


@router.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    _cleanup_tasks()
    task = tasks_status.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# --- Reports ---

@router.get("/reports")
async def get_reports(usernames: Optional[str] = None):
    if not usernames:
        all_accs = await db.get_accounts()
        username_list = [a["username"] for a in all_accs]
    else:
        username_list = [u.strip() for u in usernames.split(",")]

    all_accounts = await db.get_accounts()
    selected = [a for a in all_accounts if a["username"] in username_list]

    results = {}

    async def fetch_reports(acc_dict: dict):
        try:
            acc = _dict_to_account(acc_dict)
            async with MeroShareService(acc) as svc:
                reports = await svc.generate_reports()
                results[acc.username] = {"reports": reports, "user": acc.user, "error": None}
        except Exception as e:
            results[acc_dict["username"]] = {"reports": [], "user": acc_dict["user"], "error": str(e)}

    coros = [fetch_reports(a) for a in selected]
    await _run_staggered(coros)
    return results


# --- History ---

@router.get("/history")
async def get_history(limit: int = 100):
    return await db.get_apply_history(limit)
