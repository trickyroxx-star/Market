Pilot Smoke Test Report

Date: 2026-03-02

Summary:
- pilot_runner executed using synthetic fallback data. Trades: 36. Budget left: $29.55.
- Slack integration verified: incoming webhook delivered announcement; bot posted programmatically to #general.
- Vercel OAuth handler and kill-switch endpoint added on branch dev/marketplace.

Files of interest:
- pilot_results.jsonl — raw trade logs
- vercel/api/slack/oauth.js — OAuth handler
- vercel/api/admin/kill.js — kill-switch endpoint (requires KILL_SECRET env for protection)

Actions taken:
- Patched pilot_runner.py to fallback to synthetic data when akshare not available.
- Created kill_switch flag at controls/kill_switch.flag (value: OFF).
- Committed Vercel OAuth files to dev/marketplace and pushed.
- Posted sandbox announcement and bot confirmation to #general.

Recommended immediate safety hardening:
1) Set KILL_SECRET in Vercel environment variables and do not share it in repo.
2) Move Slack access tokens to a secure secrets manager (avoid long-lived tokens in files). Rotate tokens after moving.
3) Add CSRF/state verification to the OAuth handler and implement secure token storage (DB or secret store).

Next steps: telemetry extraction, policy checks for uploaded agents, user outreach & survey.
