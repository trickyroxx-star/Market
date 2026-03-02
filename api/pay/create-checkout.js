const Stripe = require('stripe');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
    const { email, return_url } = req.body || {};
    if (!email) return res.status(400).json({ error: 'missing email' });

    const stripeKey = process.env.STRIPE_TEST_KEY || (require('fs').existsSync('/data/.openclaw/workspace/secrets/stripe_test.key') ? require('fs').readFileSync('/data/.openclaw/workspace/secrets/stripe_test.key','utf8').trim() : null);
    if (!stripeKey) return res.status(500).json({ error: 'stripe key not configured' });

    const stripe = Stripe(stripeKey);

    // Create a one-time price (or reuse if already exists). For simplicity, create a CheckoutSession with amount.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price_data: { currency: 'usd', product_data: { name: 'Agent Market 30-day paid pilot' }, unit_amount: 49900 }, quantity: 1 }],
      customer_email: email,
      success_url: return_url || (req.headers.origin || '') + '/?status=paid',
      cancel_url: (req.headers.origin || '') + '/?status=cancel',
      metadata: { pilot: 'true', email: email }
    });

    return res.json({ checkout_url: session.url, id: session.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
};
