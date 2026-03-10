from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib import parse, request
from urllib.error import HTTPError


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_EMAIL = "admin.demo@inopnc.com"
DEFAULT_PASSWORD = "1234qwer!"
ROLE_RESERVATIONS = [
    {"name": "김재형", "email": "ceo@inopnc.com", "role": "admin", "note": "운영 발급 admin 예약"},
    {"name": "김혜영", "email": "khy972@inopnc.com", "role": "admin", "note": "운영 발급 admin 예약"},
    {"name": "송용호", "email": None, "role": "manager", "note": "계정 생성 전 manager 예약"},
    {"name": "권용호", "email": None, "role": "manager", "note": "계정 생성 전 manager 예약"},
]


@dataclass
class SessionClient:
    base_url: str
    anon_key: str
    access_token: str

    @property
    def headers(self) -> dict[str, str]:
        return {
            "apikey": self.anon_key,
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def rest(
        self,
        path: str,
        method: str = "GET",
        payload: Any | None = None,
        extra_headers: dict[str, str] | None = None,
    ):
        url = f"{self.base_url}/rest/v1/{path}"
        headers = self.headers.copy()
        if extra_headers:
            headers.update(extra_headers)
        data = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
        req = request.Request(url, data=data, method=method, headers=headers)
        with request.urlopen(req) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else None

    def rpc(self, fn_name: str, payload: dict[str, Any] | None = None):
        url = f"{self.base_url}/rest/v1/rpc/{fn_name}"
        req = request.Request(
            url,
            data=json.dumps(payload or {}, ensure_ascii=False).encode("utf-8"),
            method="POST",
            headers=self.headers,
        )
        with request.urlopen(req) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else None


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    env_path = ROOT / ".env.local"
    for line in env_path.read_text(encoding="utf-8").splitlines():
        if not line or line.strip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip()
    return env


def login(email: str, password: str, env: dict[str, str]) -> SessionClient:
    base_url = env["VITE_SUPABASE_URL"].rstrip("/")
    anon_key = env["VITE_SUPABASE_ANON_KEY"]
    req = request.Request(
        f"{base_url}/auth/v1/token?grant_type=password",
        data=json.dumps({"email": email, "password": password}).encode("utf-8"),
        headers={"apikey": anon_key, "Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return SessionClient(base_url=base_url, anon_key=anon_key, access_token=payload["access_token"])


def service_role_key(env: dict[str, str]) -> str | None:
    return env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SERVICE_ROLE_KEY") or None


def list_admin_auth_accounts(client: SessionClient) -> list[dict[str, Any]]:
    try:
        rows = client.rpc("list_admin_auth_accounts")
        return rows if isinstance(rows, list) else []
    except HTTPError:
        return []


def build_email_account_index(accounts: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    indexed: dict[str, list[dict[str, Any]]] = {}
    for account in accounts:
        email = str(account.get("email") or "").strip().lower()
        if not email:
            continue
        indexed.setdefault(email, []).append(account)
    return indexed


def fetch_roles(client: SessionClient) -> dict[str, list[str]]:
    rows = client.rest("user_roles?select=user_id,role")
    role_map: dict[str, list[str]] = {}
    for row in rows or []:
        role_map.setdefault(row["user_id"], []).append(row["role"])
    return role_map


def highest_role(roles: list[str] | None) -> str | None:
    if not roles:
        return None
    priority = {"admin": 4, "manager": 3, "partner": 2, "worker": 1}
    return sorted(roles, key=lambda value: priority.get(value, 0), reverse=True)[0]


def find_existing_reservation(client: SessionClient, name: str, email: str | None, role: str):
    filters = [
        f"reserved_name=eq.{parse.quote(name)}",
        f"reserved_role=eq.{role}",
        f"reserved_email={'is.null' if not email else f'eq.{parse.quote(email)}'}",
        "select=id,reserved_name,reserved_email,reserved_role,linked_user_id,status,note,created_at,updated_at",
    ]
    rows = client.rest(f"pending_role_assignments?{'&'.join(filters)}")
    return (rows or [None])[0]


def upsert_reservation(client: SessionClient, row: dict[str, Any]) -> dict[str, Any]:
    existing = find_existing_reservation(client, row["name"], row["email"], row["role"])
    payload = {
        "reserved_name": row["name"],
        "reserved_email": row["email"],
        "reserved_role": row["role"],
        "note": row["note"],
    }
    if existing:
        updated = client.rest(
            f"pending_role_assignments?id=eq.{existing['id']}",
            method="PATCH",
            payload=payload,
            extra_headers={"Prefer": "return=representation"},
        )
        return updated[0]
    created = client.rest(
        "pending_role_assignments",
        method="POST",
        payload=payload,
        extra_headers={"Prefer": "return=representation"},
    )
    return created[0]


def create_service_user(base_url: str, key: str, name: str, email: str) -> dict[str, Any]:
    req = request.Request(
        f"{base_url}/auth/v1/admin/users",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        data=json.dumps(
            {
                "email": email,
                "email_confirm": True,
                "user_metadata": {"name": name},
            },
            ensure_ascii=False,
        ).encode("utf-8"),
        method="POST",
    )
    with request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))


def apply_profile_and_role(base_url: str, key: str, user_id: str, name: str, role: str):
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation",
    }
    profile_req = request.Request(
        f"{base_url}/rest/v1/profiles?on_conflict=user_id",
        headers=headers,
        data=json.dumps([{"user_id": user_id, "name": name}], ensure_ascii=False).encode("utf-8"),
        method="POST",
    )
    with request.urlopen(profile_req):
        pass
    role_req = request.Request(
        f"{base_url}/rest/v1/user_roles?on_conflict=user_id,role",
        headers=headers,
        data=json.dumps([{"user_id": user_id, "role": role}], ensure_ascii=False).encode("utf-8"),
        method="POST",
    )
    with request.urlopen(role_req):
        pass


def build_dry_run_rows(client: SessionClient, env: dict[str, str]) -> list[dict[str, Any]]:
    accounts = list_admin_auth_accounts(client)
    email_accounts = build_email_account_index(accounts)
    role_map = fetch_roles(client)
    service_key = service_role_key(env)
    rows: list[dict[str, Any]] = []

    for reservation in ROLE_RESERVATIONS:
        email = reservation["email"]
        matches = email_accounts.get(str(email or "").strip().lower(), []) if email else []
        match_count = len(matches)
        existing_user_id = matches[0]["user_id"] if match_count == 1 else None
        current_role = highest_role(role_map.get(existing_user_id))
        blockers: list[str] = []

        if email and not accounts:
            blockers.append("auth_email_lookup_unavailable")
        if email and match_count == 0 and not service_key:
            blockers.append("service_role_unavailable")
        if match_count > 1:
            blockers.append("duplicate_email_match")

        if email and match_count == 1:
            planned_action = "auto_link_exact_email_match"
        elif email and service_key:
            planned_action = "create_user_then_apply_role"
        elif email:
            planned_action = "pending_only"
        else:
            planned_action = "create_pending_manager_reservation"

        rows.append(
            {
                "name": reservation["name"],
                "email": email,
                "existing_user_id": existing_user_id,
                "current_role": current_role,
                "planned_action": planned_action,
                "blocker": ", ".join(blockers) if blockers else None,
            }
        )

    return rows


def apply(env: dict[str, str], client: SessionClient) -> dict[str, Any]:
    base_url = env["VITE_SUPABASE_URL"].rstrip("/")
    service_key = service_role_key(env)
    accounts = list_admin_auth_accounts(client)
    email_accounts = build_email_account_index(accounts)

    applied = []
    for reservation in ROLE_RESERVATIONS:
        current_row = upsert_reservation(client, reservation)
        email = reservation["email"]
        if email:
            matches = email_accounts.get(email.lower(), [])
            if len(matches) == 1:
                linked = client.rpc("auto_link_pending_role_assignment", {"_assignment_id": current_row["id"]})
                applied.append(
                    {
                        "name": reservation["name"],
                        "action": "linked_existing_account",
                        "linked_user_id": linked["linked_user_id"],
                    }
                )
                continue

            if len(matches) == 0 and service_key:
                created = create_service_user(base_url, service_key, reservation["name"], email)
                user_id = created["user"]["id"]
                apply_profile_and_role(base_url, service_key, user_id, reservation["name"], reservation["role"])
                linked = client.rpc(
                    "link_pending_role_assignment",
                    {
                        "_assignment_id": current_row["id"],
                        "_target_user_id": user_id,
                    },
                )
                applied.append(
                    {
                        "name": reservation["name"],
                        "action": "created_and_linked_account",
                        "linked_user_id": linked["linked_user_id"],
                    }
                )
                continue

        applied.append(
            {
                "name": reservation["name"],
                "action": "pending_only",
                "linked_user_id": current_row.get("linked_user_id"),
            }
        )

    return {"rows": applied}


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed and reconcile pending role assignments.")
    parser.add_argument("--email", default=DEFAULT_EMAIL)
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    env = load_env()
    client = login(args.email, args.password, env)
    dry_run = build_dry_run_rows(client, env)
    result: dict[str, Any] = {
        "mode": "apply" if args.apply else "dry-run",
        "service_role_available": bool(service_role_key(env)),
        "dry_run": dry_run,
    }

    if args.apply:
        result["apply"] = apply(env, client)

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
