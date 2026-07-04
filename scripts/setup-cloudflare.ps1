#!/usr/bin/env pwsh
# One-time Cloudflare setup for TopTechReviews.org (D1 + Worker secret)
# Requires a Cloudflare API token with: Account D1 Edit, Workers Scripts Edit, Pages Edit
# Or run after: npx wrangler login

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Get-VaultPlatform {
    $vaultToken = (wsl bash -lc 'cat ~/.vault-token').Trim()
    if (-not $vaultToken) { throw "No ~/.vault-token in WSL — run vault login" }
    $env:VAULT_ADDR = if ($env:VAULT_ADDR) { $env:VAULT_ADDR } else { "http://127.0.0.1:8200" }
    $env:VAULT_TOKEN = $vaultToken
    $json = python -c @"
import json, sys
sys.path.insert(0, r'$((Resolve-Path '..\vantyxstack\scripts').Path -replace '\\','\\')')
from vault_kv_util import read_kv
print(json.dumps(read_kv('toptechreviews/platform')))
"@
    return $json | ConvertFrom-Json
}

function Get-PlatformCloudflare {
    $vaultToken = (wsl bash -lc 'cat ~/.vault-token').Trim()
    $env:VAULT_ADDR = if ($env:VAULT_ADDR) { $env:VAULT_ADDR } else { "http://127.0.0.1:8200" }
    $env:VAULT_TOKEN = $vaultToken
    $json = python -c @"
import json, sys
sys.path.insert(0, r'$((Resolve-Path '..\vantyxstack\scripts').Path -replace '\\','\\')')
from vault_kv_util import read_kv
print(json.dumps({k: read_kv('vantyxstack/platform').get(k,'') for k in ['CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID']}))
"@
    return $json | ConvertFrom-Json
}

Write-Host "== TopTechReviews Cloudflare setup ==" -ForegroundColor Cyan

$ttr = Get-VaultPlatform
$cf = Get-PlatformCloudflare

if (-not $env:CLOUDFLARE_API_TOKEN) {
    $env:CLOUDFLARE_API_TOKEN = $cf.CLOUDFLARE_API_TOKEN
}
if (-not $env:CLOUDFLARE_ACCOUNT_ID) {
    $env:CLOUDFLARE_ACCOUNT_ID = if ($ttr.CLOUDFLARE_ACCOUNT_ID) { $ttr.CLOUDFLARE_ACCOUNT_ID } else { $cf.CLOUDFLARE_ACCOUNT_ID }
}

Write-Host "Account ID: $($env:CLOUDFLARE_ACCOUNT_ID)"

# Create D1 if wrangler.toml still has placeholder
$toml = Get-Content wrangler.toml -Raw
if ($toml -match 'REPLACE_AFTER_D1_CREATE') {
    Write-Host "Creating D1 database toptechreviews-clicks..."
    $out = npx wrangler d1 create toptechreviews-clicks 2>&1 | Out-String
    Write-Host $out
    if ($out -match 'database_id = "([a-f0-9-]+)"') {
        $dbId = $Matches[1]
        $toml = $toml -replace 'REPLACE_AFTER_D1_CREATE', $dbId
        Set-Content wrangler.toml $toml -NoNewline
        Write-Host "Updated wrangler.toml with database_id $dbId" -ForegroundColor Green
    } elseif ($out -match 'already exists') {
        Write-Host "Database may already exist — run: npx wrangler d1 list" -ForegroundColor Yellow
    } else {
        Write-Host "D1 create failed. Run: npx wrangler login" -ForegroundColor Red
        Write-Host "Then re-run this script with a token that has Account D1 Edit." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Applying D1 schema..."
npx wrangler d1 execute toptechreviews-clicks --file=workers/schema.sql --remote

Write-Host "Setting Worker secret MARKETING_CLICK_API_KEY..."
$key = $ttr.MARKETING_CLICK_API_KEY
if (-not $key) { throw "MARKETING_CLICK_API_KEY missing from kv/toptechreviews/platform" }
$key | npx wrangler secret put MARKETING_CLICK_API_KEY

Write-Host "Deploying click tracker Worker..."
npx wrangler deploy --config wrangler.worker.toml

Write-Host "Done. Add Worker route: toptechreviews.org/api/click*" -ForegroundColor Green
