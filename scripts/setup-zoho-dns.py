#!/usr/bin/env python3
"""Add Zoho Mail DNS records for toptechreviews.org in Cloudflare."""

from __future__ import annotations

import os
import pathlib
import sys
import importlib.util

ROOT = pathlib.Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location("setup_dns", ROOT / "scripts" / "setup-dns.py")
_setup_dns = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_setup_dns)
cf_request = _setup_dns.cf_request
resolve_token = _setup_dns.resolve_token

ZONE_ID = "15f6a24dcd19a1fc7dbe338ead207dac"
MX_RECORDS = [(10, "mx.zoho.com"), (20, "mx2.zoho.com"), (50, "mx3.zoho.com")]
SPF_TXT = "v=spf1 include:zoho.com ~all"


def upsert_mx(token: str, priority: int, host: str) -> None:
    name = "toptechreviews.org"
    existing = cf_request(token, "GET", f"/zones/{ZONE_ID}/dns_records?type=MX&name={name}&content={host}")
    payload = {"type": "MX", "name": name, "content": host, "priority": priority, "ttl": 3600}
    records = existing.get("result") or []
    if records:
        cf_request(token, "PUT", f"/zones/{ZONE_ID}/dns_records/{records[0]['id']}", payload)
        print(f"updated MX {priority} {host}")
        return
    cf_request(token, "POST", f"/zones/{ZONE_ID}/dns_records", payload)
    print(f"created MX {priority} {host}")


def upsert_txt(token: str, name: str, content: str) -> None:
    existing = cf_request(token, "GET", f"/zones/{ZONE_ID}/dns_records?type=TXT&name={name}")
    for rec in existing.get("result") or []:
        if rec.get("content") == content:
            print(f"TXT already exists: {content[:60]}...")
            return
    cf_request(token, "POST", f"/zones/{ZONE_ID}/dns_records", {"type": "TXT", "name": name, "content": content, "ttl": 3600})
    print(f"created TXT {name}: {content[:60]}...")


def main() -> None:
    token, source = resolve_token()
    print(f"Using {source} token")
    verify = os.environ.get("ZOHO_VERIFY_TXT", "").strip()
    if verify:
        upsert_txt(token, "toptechreviews.org", verify)
    for priority, host in MX_RECORDS:
        upsert_mx(token, priority, host)
    upsert_txt(token, "toptechreviews.org", SPF_TXT)
    print("Done. See docs/INQUIRIES.md for Zoho filter setup.")


if __name__ == "__main__":
    main()
