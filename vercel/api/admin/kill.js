const fs = require('fs');
const KILL_PATH = '/data/.openclaw/workspace/controls/kill_switch.flag';
module.exports = async (req, res) => {
  const { action, secret } = req.query;
  // Note: In production protect this endpoint with a secret/auth. For pilot, use simple secret check via env KILL_SECRET
  if (process.env.KILL_SECRET && secret !== process.env.KILL_SECRET) {
    return res.status(403).send('forbidden');
  }
  if (!action) return res.status(400).send('missing action');
  if (action === 'status') {
    const v = fs.existsSync(KILL_PATH) ? fs.readFileSync(KILL_PATH,'utf8') : 'UNKNOWN';
    return res.send('kill_switch=' + v.trim());
  }
  if (action === 'on') {
    fs.writeFileSync(KILL_PATH,'ON');
    return res.send('ok');
  }
  if (action === 'off') {
    fs.writeFileSync(KILL_PATH,'OFF');
    return res.send('ok');
  }
  return res.status(400).send('unknown');
};
