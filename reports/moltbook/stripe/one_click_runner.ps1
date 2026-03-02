<#
one_click_runner.ps1
One-click PowerShell runner to set up local dev for Moltbook webhook testing.

What it does:
- Creates a Python venv if missing and installs Flask
- Starts the collector (collector_server.py) in a new window
- Starts stripe listen --forward-to http://127.0.0.1:4000/stripe/webhook in a new window
- Prompts to copy/paste the printed webhook signing secret (whsec_...) and can save it to the workspace secrets path
- Optionally triggers stripe trigger invoice.paid

Usage:
- Open PowerShell as Administrator (if you need to write secrets into protected folder)
- cd to C:\data\.openclaw\workspace\reports\moltbook\stripe
- Run: .\one_click_runner.ps1

Notes:
- Requires Python on PATH (python3 or python) and stripe CLI installed and logged in (stripe login).
- Collector path assumed: C:\data\.openclaw\workspace\reports\moltbook\meters\collector_server.py
- Secrets path: C:\data\.openclaw\workspace\secrets\stripe_webhook_signing_secret.txt
#>

param(
    [switch]$TriggerInvoice
)

function Write-Log { param($m) Write-Host "[runner] $m" -ForegroundColor Cyan }

# Resolve paths
$workspace = "C:\data\.openclaw\workspace"
$collector = Join-Path $workspace "reports\moltbook\meters\collector_server.py"
$secretsDir = Join-Path $workspace "secrets"
$secretPath = Join-Path $secretsDir "stripe_webhook_signing_secret.txt"

# 1) Ensure Python venv & Flask
Write-Log "Checking Python..."
$python = (Get-Command python -ErrorAction SilentlyContinue) -or (Get-Command python3 -ErrorAction SilentlyContinue)
if (-not $python) {
    Write-Host "Python not found in PATH. Please install Python 3 and ensure 'python' is on PATH." -ForegroundColor Red
    exit 1
}
$pyExe = if ((Get-Command python -ErrorAction SilentlyContinue)) { 'python' } else { 'python3' }

$venvDir = Join-Path $workspace "venv_moltbook"
if (-not (Test-Path $venvDir)) {
    Write-Log "Creating venv at $venvDir"
    & $pyExe -m venv $venvDir
}

$pip = Join-Path $venvDir "Scripts\pip.exe"
if (-not (Test-Path $pip)) { $pip = Join-Path $venvDir "bin/pip" }

Write-Log "Upgrading pip and installing Flask in venv"
& $pip install --upgrade pip > $null 2>&1
& $pip install flask > $null 2>&1

# 2) Start collector in new window
if (-not (Test-Path $collector)) { Write-Host "Collector not found at $collector" -ForegroundColor Red; exit 1 }
Write-Log "Starting collector in new PowerShell window..."
$collectorCmd = "& `$env:PYTHON_EXE = '$pyExe'; `"$venvDir\Scripts\python.exe`" `"$collector`""
# Use Start-Process to open new window; Windows PowerShell requires -NoNewWindow absence to open new
Start-Process powershell -ArgumentList "-NoExit","-Command","`"$venvDir\Scripts\python.exe`" `"$collector`""

Start-Sleep -Seconds 1

# 3) Start stripe listen in new window
if (-not (Get-Command stripe -ErrorAction SilentlyContinue)) {
    Write-Host "stripe CLI not found in PATH. Install and run 'stripe login' beforehand, then re-run this script." -ForegroundColor Yellow
    $stripeAvailable = $false
} else {
    $stripeAvailable = $true
    Write-Log "Starting stripe listen in new PowerShell window..."
    Start-Process powershell -ArgumentList "-NoExit","-Command","stripe listen --forward-to http://127.0.0.1:4000/stripe/webhook"
}

Write-Host "\nIf stripe listen started, wait for it to print: 'Ready! Your webhook signing secret is whsec_...'" -ForegroundColor Green
Write-Host "When you see the whsec_ value, copy it and paste it below. If you skipped or stripe CLI not installed, press Enter to skip." -ForegroundColor Green

$whsec = Read-Host "Paste the whsec_ signing secret (or press Enter to skip)"
if ($whsec -ne "") {
    if (-not (Test-Path $secretsDir)) { New-Item -ItemType Directory -Path $secretsDir -Force | Out-Null }
    Write-Log "Saving signing secret to $secretPath"
    Set-Content -Path $secretPath -Value $whsec
    Write-Log "Saved. Restricting ACLs to current user"
    try {
        icacls $secretPath /inheritance:r /grant:r "$($env:USERNAME):(R)" | Out-Null
    } catch { Write-Host "Failed to adjust ACLs; ensure file is protected manually." -ForegroundColor Yellow }
}

# 4) Optionally trigger a test event
if (-not $stripeAvailable) { Write-Host "stripe CLI not available; skipping trigger." -ForegroundColor Yellow; exit 0 }
if ($TriggerInvoice) {
    Write-Log "Triggering stripe trigger invoice.paid"
    stripe trigger invoice.paid
} else {
    $resp = Read-Host "Trigger invoice.paid now? (y/n)"
    if ($resp -eq 'y' -or $resp -eq 'Y') { stripe trigger invoice.paid }
}

Write-Log "Runner finished. Keep the stripe listen and collector windows open while testing." 
