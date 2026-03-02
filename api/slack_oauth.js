const fetch = require('node-fetch');

// Minimal Vercel Serverless OAuth callback for Slack
// Expects env: SLACK_CLIENT_ID, SLACK_CLIENT_SECRET

module.exports = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error) return res.status(400).send('OAuth error: ' + error);
    if (!code) return res.status(400).send('Missing code');

    // Exchange code for token
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', process.env.SLACK_CLIENT_ID);
    params.append('client_secret', process.env.SLACK_CLIENT_SECRET);
    const resp = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      body: params
    });
    const data = await resp.json();
    if (!data.ok) {
      console.error('Slack OAuth failed', data);
      return res.status(500).json(data);
    }

    // You should store data.access_token and team info securely (DB / secrets store).
    // For this minimal demo we just show a success page with team and bot/user info masked.
    const team = data.team || {};
    const bot = data.bot || {};

    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <h1>Slack app installed</h1>
      <p>Team: ${team.name || team.id}</p>
      <p>App ID: ${data.app_id}</p>
      <p>Authed user: ${data.authed_user && data.authed_user.id}</p>
      <pre style="white-space:pre-wrap;word-break:break-word">${JSON.stringify({team, bot}, null, 2)}</pre>
      <p>Important: copy the returned access token from your server logs or implement secure storage.</p>
    `);
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal error');
  }
};
