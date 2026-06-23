from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

import httpx

from ..models import Account, Issue
from ..settings import VERIFY_SSL

logger = logging.getLogger(__name__)


class MeroShareService:
    BASE_URL = "https://webbackend.cdsc.com.np/api/meroShare"
    MAX_RETRIES = 3
    RETRY_BASE_DELAY = 1.5

    def __init__(self, account: Account):
        self.account = account
        self._authorization: Optional[str] = None
        self._branch_info: Optional[dict] = None
        self._client = httpx.AsyncClient(verify=VERIFY_SSL, timeout=30.0)

    async def __aenter__(self):
        await self.initialize()
        return self

    async def __aexit__(self, *args):
        await self._client.aclose()

    @property
    def demat(self) -> str:
        return f"130{self.account.dp}{self.account.username}"

    @property
    def authorization_headers(self) -> dict:
        return {"Authorization": self._authorization} if self._authorization else {}

    async def initialize(self):
        await self.create_session()
        await asyncio.sleep(0.3)
        await self.set_branch_info()

    async def create_session(self):
        url = f"{self.BASE_URL}/auth/"
        payload = {
            "clientId": self.account.client_id,
            "username": self.account.username,
            "password": self.account.password,
        }
        try:
            resp = await self._request_with_retry("POST", url, json=payload)
            data = resp.json()
            if resp.status_code != 200 or not data.get("success"):
                msg = data.get("message", "Login failed")
                raise ValueError(f"Login failed for {self.account.user}: {msg}")
            self._authorization = resp.headers.get("authorization") or data.get("data")
            if not self._authorization:
                raise ValueError(f"No authorization token received for {self.account.user}")
        except httpx.HTTPError as e:
            raise ValueError(f"HTTP error during login for {self.account.user}: {e}")

    async def set_branch_info(self):
        url = f"{self.BASE_URL}/bank/"
        try:
            resp = await self._request_with_retry("GET", url)
            data = resp.json()
            banks = data.get("data", [])
            if not banks:
                raise ValueError("No banks found")
            bank_id = banks[0].get("id")
            resp2 = await self._request_with_retry("GET", f"{self.BASE_URL}/bank/{bank_id}")
            branches = resp2.json().get("data", [])
            if not branches:
                raise ValueError("No branches found")
            branch = branches[0]
            self._branch_info = {
                "accountNumber": branch.get("accountNumber", ""),
                "id": branch.get("id"),
                "accountBranchId": branch.get("accountBranchId"),
                "accountTypeId": branch.get("accountTypeId"),
                "bankId": bank_id,
            }
        except (httpx.HTTPError, ValueError) as e:
            logger.warning(f"Branch info error for {self.account.user}: {e}")
            self._branch_info = {}

    async def get_open_issues(self) -> list[Issue]:
        url = f"{self.BASE_URL}/companyShare/applicableIssue/"
        payload = {
            "page": 1,
            "size": 50,
            "searchRoleViewConstants": "VIEW_APPLICABLE_SHARE",
        }
        try:
            resp = await self._request_with_retry("POST", url, json=payload)
            data = resp.json()
            items = data.get("data", [])
            return [Issue(_json_data=item) for item in items]
        except (httpx.HTTPError, ValueError) as e:
            logger.error(f"Error fetching issues for {self.account.user}: {e}")
            return []

    async def can_apply(self, company_share_id: int) -> bool:
        url = f"{self.BASE_URL}/applicantForm/customerType/{company_share_id}/{self.demat}"
        try:
            resp = await self._request_with_retry("GET", url)
            data = resp.json()
            return data.get("message") == "Customer can apply."
        except (httpx.HTTPError, ValueError):
            return False

    async def apply(self, number_of_shares: int, company_share_id: int) -> dict:
        try:
            issues = await self.get_open_issues()
            issue = next((i for i in issues if i.company_share_id == company_share_id), None)
            if not issue:
                return {"success": False, "message": "Issue not found"}
            if not issue.is_unapplied_ordinary_share:
                return {"success": False, "message": "Issue is not an unapplied ordinary share"}

            if not await self.can_apply(company_share_id):
                return {"success": False, "message": "Cannot apply for this issue"}

            payload = {
                "appliedKitta": number_of_shares,
                "companyShareId": company_share_id,
                "crnNumber": self.account.crn,
                "transactionPIN": self.account.pin,
                "accountBranchId": self._branch_info.get("accountBranchId") if self._branch_info else None,
                "accountNumber": self._branch_info.get("accountNumber") if self._branch_info else "",
                "accountTypeId": self._branch_info.get("accountTypeId") if self._branch_info else None,
                "bankId": self._branch_info.get("bankId") if self._branch_info else None,
                "demat": self.demat,
            }

            url = f"{self.BASE_URL}/applicantForm/share/apply"
            resp = await self._request_with_retry("POST", url, json=payload)
            data = resp.json()

            if data.get("success"):
                return {"success": True, "message": f"Applied successfully for {issue.company_name}"}
            else:
                msg = data.get("message", "Application failed")
                return {"success": False, "message": msg}
        except Exception as e:
            return {"success": False, "message": str(e)}

    async def generate_reports(self) -> list[dict]:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=60)
        url = f"{self.BASE_URL}/applicantForm/active/search/"
        payload = {
            "dateRange": f"{start_date.strftime('%Y-%m-%d')}~{end_date.strftime('%Y-%m-%d')}",
            "demat": self.demat,
            "page": 1,
            "size": 50,
        }
        try:
            resp = await self._request_with_retry("POST", url, json=payload)
            data = resp.json()
            results = data.get("data", [])
            reports = []
            for item in results:
                report = await self.with_allotment_status(item)
                reports.append(report)
            return reports
        except (httpx.HTTPError, ValueError) as e:
            logger.error(f"Error generating reports for {self.account.user}: {e}")
            return []

    async def with_allotment_status(self, item: dict) -> dict:
        application_id = item.get("id")
        if not application_id:
            item["allotmentStatus"] = "N/A"
            return item

        url = f"{self.BASE_URL}/applicantForm/report/detail/{application_id}"
        try:
            resp = await self._request_with_retry("GET", url)
            data = resp.json()
            detail = data.get("data", {})
            if detail.get("appliedKitta") == detail.get("allotedKitta") and detail.get("allotedKitta", 0) > 0:
                item["allotmentStatus"] = "ALLOTTED"
            elif detail.get("allotedKitta", 0) == 0 and detail.get("appliedKitta", 0) > 0:
                item["allotmentStatus"] = "NOT_ALLOTTED"
            else:
                item["allotmentStatus"] = "N/A"
            item["allotedKitta"] = detail.get("allotedKitta", 0)
            item["verifyStatus"] = detail.get("statusName", "N/A")
        except (httpx.HTTPError, ValueError):
            item["allotmentStatus"] = "N/A"
        return item

    async def _request_with_retry(self, method: str, url: str, **kwargs) -> httpx.Response:
        last_error = None
        for attempt in range(self.MAX_RETRIES):
            try:
                headers = {**self.authorization_headers, **kwargs.pop("headers", {})}
                resp = await self._client.request(method, url, headers=headers, **kwargs)

                text = resp.text
                if "Request Rejected" in text or "Operation Failed" in text:
                    if attempt < self.MAX_RETRIES - 1:
                        delay = self.RETRY_BASE_DELAY * (2 ** attempt)
                        logger.warning(f"WAF block on {url}, retrying in {delay}s (attempt {attempt + 1})")
                        await asyncio.sleep(delay)
                        continue
                    raise ValueError("WAF block: request rejected after max retries")

                return resp
            except httpx.HTTPError as e:
                last_error = e
                if attempt < self.MAX_RETRIES - 1:
                    delay = self.RETRY_BASE_DELAY * (2 ** attempt)
                    await asyncio.sleep(delay)
                    continue
                raise
        raise last_error or ValueError("Max retries exceeded")
