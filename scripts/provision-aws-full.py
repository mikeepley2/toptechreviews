#!/usr/bin/env python3
"""One-shot AWS cutover: ACM (DNS validate via Cloudflare) → CloudFormation → deploy → DNS."""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import pathlib
import subprocess
import sys
import time
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
VAULT_SCRIPT = ROOT.parent / "vantyxstack" / "scripts"
ZONE_ID = "15f6a24dcd19a1fc7dbe338ead207dac"
DOMAIN = "toptechreviews.org"
WWW = f"www.{DOMAIN}"
STACK_NAME = "toptechreviews"
OIDC_STACK = "toptechreviews-github-oidc"
AWS_REGION = "us-east-1"
GITHUB_REPO = "mikeepley2/toptechreviews"
AWS_EXE = os.environ.get(
    "AWS_CLI",
    r"C:\Program Files\Amazon\AWSCLIV2\aws.exe"
    if sys.platform == "win32"
    else "aws",
)


def load_setup_dns():
    spec = importlib.util.spec_from_file_location("setup_dns", ROOT / "scripts" / "setup-dns.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def resolve_aws_credentials() -> None:
    if os.environ.get("AWS_ACCESS_KEY_ID") and os.environ.get("AWS_SECRET_ACCESS_KEY"):
        return
    sys.path.insert(0, str(VAULT_SCRIPT))
    try:
        from vault_kv_util import read_kv  # noqa: WPS433

        data = read_kv("toptechreviews/platform")
        key = data.get("AWS_ACCESS_KEY_ID", "").strip()
        secret = data.get("AWS_SECRET_ACCESS_KEY", "").strip()
        token = data.get("AWS_SESSION_TOKEN", "").strip()
        if key and secret:
            os.environ["AWS_ACCESS_KEY_ID"] = key
            os.environ["AWS_SECRET_ACCESS_KEY"] = secret
            if token:
                os.environ["AWS_SESSION_TOKEN"] = token
            return
    except Exception:
        pass
    raise SystemExit(
        "AWS credentials required. Set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY in env "
        "or add them to kv/toptechreviews/platform, then rerun."
    )


def aws_cmd(*args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    cmd = [AWS_EXE, *args]
    env = os.environ.copy()
    env.setdefault("AWS_DEFAULT_REGION", AWS_REGION)
    result = subprocess.run(cmd, check=False, capture_output=True, text=True, env=env, cwd=ROOT)
    if check and result.returncode != 0:
        err = (result.stderr or result.stdout or "").strip()
        raise RuntimeError(f"AWS command failed ({result.returncode}): {' '.join(cmd)}\n{err}")
    return result


def aws_json(*args: str) -> dict:
    result = aws_cmd(*args, "--output", "json")
    return json.loads(result.stdout or "{}")


def resolve_marketing_key() -> str:
    key = os.environ.get("MARKETING_CLICK_API_KEY", "").strip()
    if key:
        return key
    sys.path.insert(0, str(VAULT_SCRIPT))
    from vault_kv_util import read_kv  # noqa: WPS433

    return read_kv("toptechreviews/platform").get("MARKETING_CLICK_API_KEY", "").strip()


def find_existing_cert() -> str | None:
    data = aws_json("acm", "list-certificates", "--region", AWS_REGION)
    for summary in data.get("CertificateSummaryList") or []:
        if summary.get("DomainName") != DOMAIN:
            continue
        arn = summary["CertificateArn"]
        detail = aws_json(
            "acm",
            "describe-certificate",
            "--region",
            AWS_REGION,
            "--certificate-arn",
            arn,
        )
        cert = detail.get("Certificate") or {}
        names = {cert.get("DomainName", "")} | set(cert.get("SubjectAlternativeNames") or [])
        if DOMAIN in names and WWW in names and cert.get("Status") in ("ISSUED", "PENDING_VALIDATION"):
            return arn
    return None


def request_acm_cert(setup_dns) -> str:
    existing = os.environ.get("ACM_CERTIFICATE_ARN", "").strip() or find_existing_cert()
    if existing:
        print(f"Using ACM certificate: {existing}")
        return existing

    print("Requesting ACM certificate (us-east-1)...")
    resp = aws_json(
        "acm",
        "request-certificate",
        "--region",
        AWS_REGION,
        "--domain-name",
        DOMAIN,
        "--subject-alternative-names",
        WWW,
        "--validation-method",
        "DNS",
    )
    arn = resp["CertificateArn"]
    print(f"Requested: {arn}")

    token, source = setup_dns.resolve_token()
    print(f"Cloudflare DNS token from {source}")

    for attempt in range(12):
        detail = aws_json(
            "acm",
            "describe-certificate",
            "--region",
            AWS_REGION,
            "--certificate-arn",
            arn,
        )
        options = (detail.get("Certificate") or {}).get("DomainValidationOptions") or []
        if options and all(opt.get("ResourceRecord") for opt in options):
            break
        time.sleep(5)
    else:
        raise RuntimeError("ACM validation records not ready")

    for opt in options:
        rec = opt["ResourceRecord"]
        name = rec["Name"].rstrip(".")
        value = rec["Value"].rstrip(".")
        upsert_dns_cname(setup_dns, token, name, value, proxied=False)
        print(f"ACM validation CNAME: {name} -> {value}")

    print("Waiting for ACM validation (up to 30 min)...")
    for _ in range(60):
        detail = aws_json(
            "acm",
            "describe-certificate",
            "--region",
            AWS_REGION,
            "--certificate-arn",
            arn,
        )
        status = (detail.get("Certificate") or {}).get("Status")
        if status == "ISSUED":
            print("Certificate issued.")
            return arn
        if status not in ("PENDING_VALIDATION", None):
            raise RuntimeError(f"Unexpected ACM status: {status}")
        time.sleep(30)

    raise RuntimeError("ACM validation timed out")


def upsert_dns_cname(setup_dns, token: str, name: str, content: str, *, proxied: bool) -> None:
    existing = setup_dns.cf_request(
        token, "GET", f"/zones/{ZONE_ID}/dns_records?type=CNAME&name={name}"
    )
    records = existing.get("result") or []
    payload = {
        "type": "CNAME",
        "name": name,
        "content": content,
        "proxied": proxied,
        "ttl": 1 if proxied else 300,
    }
    if records:
        rid = records[0]["id"]
        setup_dns.cf_request(token, "PUT", f"/zones/{ZONE_ID}/dns_records/{rid}", payload)
        return
    setup_dns.cf_request(token, "POST", f"/zones/{ZONE_ID}/dns_records", payload)


def deploy_main_stack(cert_arn: str, marketing_key: str) -> dict[str, str]:
    identity = aws_json("sts", "get-caller-identity")
    account = identity["Account"]
    bucket = os.environ.get("SITE_BUCKET", f"toptechreviews-org-site-{account}")

    print(f"Deploying CloudFormation stack {STACK_NAME}...")
    aws_cmd(
        "cloudformation",
        "deploy",
        "--stack-name",
        STACK_NAME,
        "--region",
        AWS_REGION,
        "--template-file",
        str(ROOT / "infra/aws/template.yaml"),
        "--parameter-overrides",
        f"SiteBucketName={bucket}",
        f"DomainName={DOMAIN}",
        f"WwwDomainName={WWW}",
        f"AcmCertificateArn={cert_arn}",
        f"MarketingClickApiKey={marketing_key}",
        "--capabilities",
        "CAPABILITY_IAM",
    )

    stacks = aws_json(
        "cloudformation",
        "describe-stacks",
        "--region",
        AWS_REGION,
        "--stack-name",
        STACK_NAME,
    )
    outputs = {
        o["OutputKey"]: o["OutputValue"]
        for o in (stacks.get("Stacks") or [{}])[0].get("Outputs") or []
    }
    print(f"Stack outputs: {outputs}")
    return outputs


def package_lambda() -> pathlib.Path:
    zip_path = ROOT / "build" / "lambda-click.zip"
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    src = ROOT / "infra/aws/lambda/click/index.mjs"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.write(src, "index.mjs")
    return zip_path


def build_and_deploy(outputs: dict[str, str]) -> None:
    print("Building site...")
    subprocess.run(["npm", "run", "seed"], check=True, cwd=ROOT, shell=sys.platform == "win32")
    subprocess.run(["npm", "run", "build"], check=True, cwd=ROOT, shell=sys.platform == "win32")

    zip_path = package_lambda()
    bucket = outputs["SiteBucketName"]
    dist_id = outputs["CloudFrontDistributionId"]

    print("Updating Lambda...")
    aws_cmd(
        "lambda",
        "update-function-code",
        "--function-name",
        "toptechreviews-click",
        "--region",
        AWS_REGION,
        "--zip-file",
        f"fileb://{zip_path.as_posix()}",
    )

    print(f"Syncing S3 ({bucket})...")
    aws_cmd(
        "s3",
        "sync",
        str(ROOT / "dist"),
        f"s3://{bucket}/",
        "--delete",
        "--cache-control",
        "public,max-age=3600",
    )

    print(f"Invalidating CloudFront ({dist_id})...")
    aws_cmd(
        "cloudfront",
        "create-invalidation",
        "--distribution-id",
        dist_id,
        "--paths",
        "/*",
    )


def find_github_oidc_provider_arn() -> str:
    data = aws_json("iam", "list-open-id-connect-providers")
    for arn in data.get("OpenIDConnectProviderList") or []:
        provider_arn = arn.get("Arn", "")
        if not provider_arn:
            continue
        detail = aws_json("iam", "get-open-id-connect-provider", "--open-id-connect-provider-arn", provider_arn)
        if "token.actions.githubusercontent.com" in (detail.get("Url") or ""):
            return provider_arn
    return ""


def deploy_oidc_stack(outputs: dict[str, str]) -> str:
    bucket = outputs["SiteBucketName"]
    dist_id = outputs["CloudFrontDistributionId"]
    existing_oidc = find_github_oidc_provider_arn()
    if existing_oidc:
        print(f"Using existing GitHub OIDC provider: {existing_oidc}")

    print(f"Deploying GitHub OIDC stack {OIDC_STACK}...")
    overrides = [
        f"GitHubRepo={GITHUB_REPO}",
        f"SiteBucketName={bucket}",
        f"CloudFrontDistributionId={dist_id}",
        "LambdaFunctionName=toptechreviews-click",
    ]
    if existing_oidc:
        overrides.append(f"ExistingOidcProviderArn={existing_oidc}")
    aws_cmd(
        "cloudformation",
        "deploy",
        "--stack-name",
        OIDC_STACK,
        "--region",
        AWS_REGION,
        "--template-file",
        str(ROOT / "infra/aws/github-oidc.yaml"),
        "--parameter-overrides",
        *overrides,
        "--capabilities",
        "CAPABILITY_NAMED_IAM",
    )

    oidc = aws_json(
        "cloudformation",
        "describe-stacks",
        "--region",
        AWS_REGION,
        "--stack-name",
        OIDC_STACK,
    )
    for out in (oidc.get("Stacks") or [{}])[0].get("Outputs") or []:
        if out.get("OutputKey") == "DeployRoleArn":
            return out["OutputValue"]
    raise RuntimeError("DeployRoleArn not found in OIDC stack outputs")


def configure_github(outputs: dict[str, str], role_arn: str) -> None:
    bucket = outputs["SiteBucketName"]
    dist_id = outputs["CloudFrontDistributionId"]
    cmds = [
        ["gh", "secret", "set", "AWS_DEPLOY_ROLE_ARN", "-R", GITHUB_REPO, "-b", role_arn],
        ["gh", "variable", "set", "AWS_SITE_BUCKET", "-R", GITHUB_REPO, "-b", bucket],
        ["gh", "variable", "set", "AWS_CLOUDFRONT_DISTRIBUTION_ID", "-R", GITHUB_REPO, "-b", dist_id],
        ["gh", "variable", "set", "AWS_DEPLOY_ENABLED", "-R", GITHUB_REPO, "-b", "true"],
    ]
    for cmd in cmds:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    print("GitHub Actions AWS variables/secrets configured.")


def cutover_dns(setup_dns, cf_domain: str) -> None:
    token, source = setup_dns.resolve_token()
    print(f"Cutting over DNS via {source} token -> {cf_domain} (grey cloud)")
    for name in (DOMAIN, WWW):
        upsert_dns_cname(setup_dns, token, name, cf_domain, proxied=False)
        print(f"CNAME {name} -> {cf_domain} (DNS only)")


def write_vault(outputs: dict[str, str], role_arn: str, cert_arn: str) -> None:
    sys.path.insert(0, str(VAULT_SCRIPT))
    from vault_kv_util import read_kv, write_kv  # noqa: WPS433

    existing = read_kv("toptechreviews/platform")
    existing.update(
        {
            "AWS_SITE_BUCKET": outputs["SiteBucketName"],
            "AWS_CLOUDFRONT_DISTRIBUTION_ID": outputs["CloudFrontDistributionId"],
            "AWS_CLOUDFRONT_DOMAIN": outputs["CloudFrontDomainName"],
            "AWS_DEPLOY_ROLE_ARN": role_arn,
            "ACM_CERTIFICATE_ARN": cert_arn,
        }
    )
    write_kv("toptechreviews/platform", existing)
    print("Vault kv/toptechreviews/platform updated with AWS outputs.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Full AWS provision + DNS cutover for TopTechReviews")
    parser.add_argument("--skip-dns", action="store_true", help="Skip Cloudflare apex/www cutover")
    parser.add_argument("--skip-github", action="store_true", help="Skip gh secret/variable setup")
    parser.add_argument("--skip-vault", action="store_true", help="Skip writing outputs to Vault")
    args = parser.parse_args()

    setup_dns = load_setup_dns()
    resolve_aws_credentials()
    marketing_key = resolve_marketing_key()
    if not marketing_key:
        raise SystemExit("MARKETING_CLICK_API_KEY required (env or vault)")

    identity = aws_json("sts", "get-caller-identity")
    print(f"AWS account: {identity['Account']} ({identity.get('Arn', '')})")

    cert_arn = request_acm_cert(setup_dns)
    outputs = deploy_main_stack(cert_arn, marketing_key)
    build_and_deploy(outputs)
    role_arn = deploy_oidc_stack(outputs)

    if not args.skip_github:
        configure_github(outputs, role_arn)
    if not args.skip_dns:
        cutover_dns(setup_dns, outputs["CloudFrontDomainName"])
    if not args.skip_vault:
        write_vault(outputs, role_arn, cert_arn)

    print("\nDone.")
    print(f"  Site:     https://{DOMAIN}/")
    print(f"  Bucket:   {outputs['SiteBucketName']}")
    print(f"  CloudFront: {outputs['CloudFrontDomainName']}")
    print(f"  CI role:  {role_arn}")


if __name__ == "__main__":
    main()
