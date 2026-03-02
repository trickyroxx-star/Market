const fs = require('fs');

module.exports = async (req, res) => {
  // Accepts Stripe webhook POSTs. In test mode we accept unsigned payloads if no signing secret provided.
  try {
    const stripeKey = process.env.STRIPE_TEST_KEY || (fs.existsSync('/data/.openclaw/workspace/secrets/stripe_test.key') ? fs.readFileSync('/data/.openclaw/workspace/secrets/stripe_test.key','utf8').trim() : null);
    if (!stripeKey) return res.status(500).send('stripe key missing');
    const body = req.body || {};
    const ev = body;
    // handle checkout.session.completed
    if (ev.type === 'checkout.session.completed' || ev.type === 'payment_intent.succeeded' || ev.object === 'checkout.session') {
      const session = ev.data ? ev.data.object : ev;
      const email = session.customer_email || (session.metadata && session.metadata.email) || 'unknown';
      const sid = session.id || session.payment_intent || 'unknown';
      const ts = new Date().toISOString();
      const line = `${ts},${email},${sid}\n`;
      fs.appendFileSync('outreach/paid_customers.csv', line);
      // notify Slack via webhook if available
      try {
        const webhook = fs.existsSync('/data/.openclaw/workspace/secrets/slack_pilot_webhook.txt') ? fs.readFileSync('/data/.openclaw/workspace/secrets/slack_pilot_webhook.txt','utf8').trim() : null;
        if (webhook) {
          const curl = require('child_process').spawnSync('curl', ['-s','-X','POST','-H','Content-type: application/json','-d',JSON.stringify({text:`Paid pilot: ${email} completed payment (session ${sid}).`}), webhook]);
        }
      } catch (e) {}
      return res.json({ok:true});
    }
    return res.json({received:true});
  } catch (e) {
    console.error(e);
    res.status(500).send('err');
  }
};
