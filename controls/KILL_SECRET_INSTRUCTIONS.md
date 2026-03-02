Kill-switch instructions

The kill endpoint (vercel/api/admin/kill.js) checks env KILL_SECRET for simple protection.

To harden:
1) In Vercel Project Settings > Environment Variables, add: KILL_SECRET = <strong_random_secret>
2) Do NOT commit the secret to git. Use Vercel UI to set it.
3) Example usage (to turn ON):
   https://<your-vercel-domain>/api/admin/kill?action=on&secret=<your_secret>
4) Check status:
   https://<your-vercel-domain>/api/admin/kill?action=status&secret=<your_secret>

Note: For production use a proper auth layer (JWT or OAuth) rather than a query-secret.
