from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from .settings import CAPITALS


@dataclass
class Account:
    user: str
    dp: str
    username: str
    password: str
    crn: str
    pin: str

    @property
    def client_id(self) -> int:
        capital = next((c for c in CAPITALS if c["code"] == str(self.dp)), None)
        if not capital:
            raise ValueError(f"Invalid DP Code '{self.dp}'")
        return capital["id"]

    @property
    def dp_name(self) -> str:
        capital = next((c for c in CAPITALS if c["code"] == str(self.dp)), None)
        return capital["name"] if capital else "Unknown"

    def to_dict(self) -> dict:
        return {
            "user": self.user,
            "dp": self.dp,
            "username": self.username,
            "password": self.password,
            "crn": self.crn,
            "pin": self.pin,
        }


@dataclass
class Issue:
    _json_data: dict = field(repr=False)

    @property
    def company_share_id(self) -> int:
        return self._json_data.get("companyShareId", 0)

    @property
    def company_name(self) -> str:
        return self._json_data.get("companyName", "")

    @property
    def subgroup(self) -> str:
        return self._json_data.get("subgroup", "")

    @property
    def scrip(self) -> str:
        return self._json_data.get("scrip", "")

    @property
    def share_type_name(self) -> str:
        return self._json_data.get("shareTypeName", "")

    @property
    def share_group_name(self) -> str:
        return self._json_data.get("shareGroupName", "")

    @property
    def status_name(self) -> str:
        return self._json_data.get("statusName", "")

    @property
    def action(self) -> str:
        return self._json_data.get("action", "")

    @property
    def issue_open_date(self) -> Optional[str]:
        return self._json_data.get("issueOpenDate")

    @property
    def issue_close_date(self) -> Optional[str]:
        return self._json_data.get("issueCloseDate")

    @property
    def is_applied(self) -> bool:
        return self.action == "edit"

    @property
    def is_ordinary_shares(self) -> bool:
        return self.share_group_name == "Ordinary Shares"

    @property
    def is_ipo(self) -> bool:
        return self.share_type_name.upper() == "IPO"

    @property
    def is_fpo(self) -> bool:
        return self.share_type_name.upper() == "FPO"

    @property
    def is_unapplied_ordinary_share(self) -> bool:
        return self.is_ordinary_shares and not self.is_applied

    @property
    def status(self) -> str:
        if self.is_applied:
            return "Applied"
        return self.status_name

    def to_dict(self) -> dict:
        return {
            "company_share_id": self.company_share_id,
            "company_name": self.company_name,
            "subgroup": self.subgroup,
            "scrip": self.scrip,
            "share_type_name": self.share_type_name,
            "share_group_name": self.share_group_name,
            "status_name": self.status_name,
            "action": self.action,
            "issue_open_date": self.issue_open_date,
            "issue_close_date": self.issue_close_date,
            "is_applied": self.is_applied,
            "is_ordinary_shares": self.is_ordinary_shares,
            "is_ipo": self.is_ipo,
            "is_fpo": self.is_fpo,
            "is_unapplied_ordinary_share": self.is_unapplied_ordinary_share,
            "status": self.status,
        }
