#!/usr/bin/env python3
"""Create DNS CNAME records for toptechreviews.org → Cloudflare Pages."""

from __future__ import annotations

import json
import pathlib
import sys
import urllib.error
import urllib.request

try:
    import tomllib
except ImportError:
    import tomli as tomllib  # type: ignore

ROOT = pathlib.Path(__file__).resolve().parents[1]
WRANGLER_CFG = pathlib.Path.home() / "AppData/Roaming/xdg.config/.wrangler/config/default.toml"
ZONE_ID = "15f6a24dcd19a1fc7dbe338ead207dac"
TARGET = "toptechreviews-asz.pages.dev"
VAULT_SCRIPT = ROOT.parent / "vantyxstack" / "scripts"


def oauth_token() -> str:
    if not WRANGLER_CFG.is_file():
        raise SystemExit("Run: npx wrangler login")
    cfg = tomllib.loads(WRANGLER_CFG.read_text(encoding="utf-8"))
    return cfg["oauth_token"]


def resolve_token() -> tuple[str, str]:
    import os

    if os.environ.get("TOPTECHREVIEWS_DNS_TOKEN"):
        return os.environ["TOPTECHREVIEWS_DNS_TOKEN"].strip(), "env"
    sys.path.insert(0, str(VAULT_SCRIPT))
    try:
        from vault_kv_util import read_kv  # noqa: WPS433

        data = read_kv("toptechreviews/platform")
        if data.get("CLOUDFLARE_DNS_API_TOKEN"):
            return data["CLOUDFLARE_DNS_API_TOKEN"], "vault"
    except Exception:
        pass
    return oauth_token(), "oauth"


def cf_request(token: str, method: str, path: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4{path}",
        method=method,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        data=json.dumps(body).encode() if body is not None else None,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        err = exc.read().decode(errors="replace")
        raise RuntimeError(f"Cloudflare HTTP {exc.code}: {err[:400]}") from exc


def upsert_cname(token: str, name: str, content: str) -> None:
    existing = cf_request(token, "GET", f"/zones/{ZONE_ID}/dns_records?type=CNAME&name={name}")
    records = existing.get("result") or []
    payload = {"type": "CNAME", "name": name, "content": content, "proxied": True, "ttl": 1}
    if records:
        rid = records[0]["id"]
        cf_request(token, "PUT", f"/zones/{ZONE_ID}/dns_records/{rid}", payload)
        print(f"updated CNAME {name} -> {content}")
        return
    cf_request(token, "POST", f"/zones/{ZONE_ID}/dns_records", payload)
    print(f"created CNAME {name} -> {content}")


def main() -> None:
    token, source = resolve_token()
    print(f"Using {source} token")

    try:
        cf_request(token, "GET", f"/zones/{ZONE_ID}/dns_records?per_page=1")
    except RuntimeError as exc:
        if "403" in str(exc):
            raise SystemExit(
                "Token lacks DNS Edit for toptechreviews.org. "
                "Create a zone token with permission: DNS → Edit, then rerun."
            ) from exc
        raise

    for name in ("toptechreviews.org", "www.toptechreviews.org"):
        upsert_cname(token, name, TARGET)

    print("Done. DNS may take 1–5 minutes to propagate.")


if __name__ == "__main__":
    main()
