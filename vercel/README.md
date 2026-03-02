Vercel Slack OAuth handler

Files created:
- vercel/api/slack/oauth.js  -> serverless OAuth callback

How to use
1) Create a new Vercel project and connect to this GitHub repo (https://github.com/trickyroxx-star/Market.git) or deploy the vercel/ folder directly.
2) In the Slack app config (Manage > OAuth & Permissions) add the redirect URL:
   https://<your-vercel-project>.vercel.app/api/slack/oauth
   Replace <your-vercel-project> with the Vercel project name / domain.
3) Add required OAuth scopes in Slack (minimum for installs and token acquisition):
   - oauth.v2.access is used by Slack to exchange code
   - If you want reads: conversations:read, conversations.history
   - If you want posting: chat:write
4) Set environment variables in Vercel (Project Settings > Environment Variables):
   - SLACK_CLIENT_ID
   - SLACK_CLIENT_SECRET

Deploy
- Push to a branch and import to Vercel, or use the Vercel CLI to deploy from this folder.

Notes
- This minimal handler returns JSON/html for quick testing. In production you must store access tokens securely (DB/secret store) and implement state verification and CSRF protection.
- After installing via the OAuth flow, copy the access token into /data/.openclaw/workspace/secrets/slack_read.token if you want the assistant to read channel history programmatically.
