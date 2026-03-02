const fs = require('fs');
const KILL_PATH = '/data/.openclaw/workspace/controls/kill_switch.flag';
module.exports = async (req, res) => {
  const { action, secret } = req.query;
  // Note: In production protect this endpoint with a secret/auth. For pilot, use simple secret check via env KILL_SECRET
  if (process.env.KILL_SECRET && secret !== process.env.KILL_SECRET) {
    return res.status(403).send('forbidden');
  }
  if (!action) return res.status(400).send('missing action');

  // Priority 1: explicit S3/DB-backed implementation (not configured for now)
  // Priority 2: Vercel env override (KILL_FALLBACK) - useful for preview deployments
  // Priority 3: local host file (best-effort, not shared with Vercel runtimes)

  const readLocal = () => {
    try {
      if (fs.existsSync(KILL_PATH)) return fs.readFileSync(KILL_PATH,'utf8').trim();
    } catch (e) {}
    return null;
  };

  if (action === 'status') {
    // 1) Vercel env override
    if (process.env.KILL_FALLBACK) return res.json({kill: process.env.KILL_FALLBACK === 'ON', source: 'env'});
    // 2) local file
    const local = readLocal();
    if (local) return res.json({kill: local === 'ON', source: 'local-file'});
    // 3) unknown
    return res.json({kill: null, source: 'unknown'});
  }

  if (action === 'on' || action === 'off') {
    // Only allow mutation if KILL_SECRET matches (checked above)
    const val = action === 'on' ? 'ON' : 'OFF';
    // 1) If KILL_FALLBACK is set in env, advise user to change it in Vercel dashboard
    if (process.env.KILL_FALLBACK) {
      return res.status(400).json({error:'KILL_FALLBACK is controlled via Vercel env; update Vercel project settings to change this value'});
    }
    // 2) Fallback: update local file on host (best-effort)
    try {
      fs.writeFileSync(KILL_PATH, val);
      return res.json({ok:true, written: KILL_PATH, value: val});
    } catch (e) {
      return res.status(500).json({error:'failed to write local kill file', detail: String(e)});
    }
  }
  return res.status(400).send('unknown');
};
