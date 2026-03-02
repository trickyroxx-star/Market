Device & Account Onboarding Spec — Moltbook / OpenClaw

Objective
- Securely authorize and register two devices (phone and computer) for Control UI and agent operations. Ensure least-privilege device access and auditable onboarding.

Overview
- We use OpenClaw's device auth and gateway.allowedOrigins to control which devices can access the Control UI.
- Each device will be registered with a device ID, public key (optional), allowed origins, and a human-friendly label.
- Onboarding includes: pairing flow, token issuance, device metadata, and revocation steps.

Steps
1) Prepare
   - Ensure gateway config has controlUi.deviceAuth enabled (dangerouslyDisableDeviceAuth=false) and allowedOrigins restricted to known hosts.
   - Ensure TLS or local-only loopback is enforced (we currently allow localhost origins).

2) Generate device identities
   - Computer:
     - Create a device ID: "comp-<username>-<date>".
     - Generate an SSH keypair or RSA keypair on the computer: `ssh-keygen -t ed25519 -f ~/.moltbook_device_comp_key`.
     - Copy public key to the OpenClaw device registry during pairing.
   - Phone:
     - Create a device ID: "phone-<user>-<date>".
     - Use the OpenClaw mobile pairing QR flow (or generate a short-lived pairing token) to register the phone.

3) Pairing flow (computer)
   - From the computer, run the OpenClaw pairing CLI or visit the Control UI on localhost.
   - Present the generated public key; verify the fingerprint locally and accept.
   - On success, OpenClaw will store the device entry and mark it as active; the device will get a device token scoped to allowed actions.

4) Pairing flow (phone)
   - Open the Control UI on a trusted machine and use the "Pair Device" → QR code option.
   - Scan QR from phone app or browser; confirm device label and allowed origins.
   - Phone gets a short-lived device token; store it in the phone's secure storage (Keychain / Android Keystore).

5) Device scoping & permissions
   - Default scope: read-only control UI + agent monitoring.
   - Elevated scope (require manual approval): device actions that can run agents, send messages, or execute trades.
   - For phone: default to alerting/monitoring scope only; for computer: grant monitoring + developer ops if needed.

6) Token lifecycle & rotation
   - Issue short-lived tokens (TTL 30d) and require refresh via pairing flow or token refresh API.
   - Maintain device last-seen timestamps and rotate tokens on suspicious activity.

7) Auditing & logging
   - Log every pairing, token issue, and revocation event with timestamp, device ID, user, and source IP.
   - Store pairing evidence (public key fingerprint / QR session id) for audits.

8) Revocation & emergency
   - Provide immediate revocation API/CLI: `openclaw devices revoke <device-id>`.
   - In emergency, rotate gateway token and revoke all devices; have a recovery procedure.

9) User guidance (phone & computer)
   - Computer: keep private key in secure location; do not share. Use OS keychain or encrypted file.
   - Phone: store device token in secure storage. If phone lost, revoke immediately from Control UI.

10) Follow-up hardening
   - Restrict allowedOrigins to exact hostnames when remote access is needed.
   - Enable HTTPS/Tailscale Serve for remote device access.
   - Enable MFA for critical operations and device revocations.

Saved: /data/.openclaw/workspace/reports/moltbook/device_onboarding_spec.md
