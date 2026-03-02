<#
stripe_listen_and_trigger.ps1
PowerShell helper to run Stripe CLI listen and optionally trigger a test invoice event.

Usage (PowerShell):
1) Open PowerShell as the user who installed stripe CLI.
2) cd to the workspace folder (optional).
3) Run: .\stripe_listen_and_trigger.ps1

The script will:
- Check that `stripe` CLI is available.
- Start `stripe listen --forward-to http://127.0.0.1:4000/stripe/webhook` in a new window (so it keeps running).
- Print instructions and wait for you to confirm when stripe listen has printed the whsec_ secret.
- Optionally run `stripe trigger invoice.paid` to create a test invoice event forwarded to your local webhook.

Notes:
- You must have stripe CLI installed and logged in (run `stripe login` beforehand).
- Your local collector must be running and listening on http://127.0.0.1:4000/stripe/webhook
- After stripe listen prints the whsec_ signing secret, copy it and either paste it to me or save it to the workspace secrets file:
  C:\data\.openclaw\workspace\secrets\stripe_webhook_signing_secret.txt
#>

function Assert-CommandExists {
    param([string]$cmd)
    $err = $null
    try {
        $p = Get-Command $cmd -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

if (-not (Assert-CommandExists -cmd 'stripe')) {
    Write-Host "ERROR: stripe CLI not found in PATH. Install it and run 'stripe login' first." -ForegroundColor Red
    exit 1
}

Write-Host "Stripe CLI found." -ForegroundColor Green
Write-Host "Make sure your local collector is running on http://127.0.0.1:4000/stripe/webhook" -ForegroundColor Yellow

# Start stripe listen in a new PowerShell window so it remains running
$listenCmd = 'stripe listen --forward-to http://127.0.0.1:4000/stripe/webhook'
Write-Host "About to start: $listenCmd" -ForegroundColor Cyan
Write-Host "A new PowerShell window will open for stripe listen. Leave it running." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit","-Command","$listenCmd"

Write-Host "When the new window shows: 'Ready! Your webhook signing secret is whsec_...' copy that whsec_ value and either:" -ForegroundColor Green
Write-Host "  1) Save it into the workspace secrets file path: C:\data\.openclaw\workspace\secrets\stripe_webhook_signing_secret.txt" -ForegroundColor Green
Write-Host "     Example: Set-Content -Path 'C:\data\.openclaw\workspace\secrets\stripe_webhook_signing_secret.txt' -Value 'whsec_XXXXX'" -ForegroundColor Green
Write-Host "  2) Or paste the whsec_ value into this chat and I will store it for you." -ForegroundColor Green

# Ask user whether to trigger a sample event
$trigger = Read-Host "When ready, do you want me to trigger a sample invoice.paid event now? (y/n)"
if ($trigger -eq 'y' -or $trigger -eq 'Y') {
    Write-Host "Triggering stripe trigger invoice.paid ..." -ForegroundColor Cyan
    stripe trigger invoice.paid
    Write-Host "Triggered. Check the stripe listen window and your local collector for delivery logs." -ForegroundColor Green
} else {
    Write-Host "Skipping trigger. You can run 'stripe trigger invoice.paid' later in a terminal." -ForegroundColor Yellow
}

Write-Host "Done. Keep the stripe listen window running while you test webhooks." -ForegroundColor Green
