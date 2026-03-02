// Minimal Stripe webhook handler (Express) to create invoices from billing_invoices_candidate
// Note: requires stripe npm package and a secure endpoint behind auth

const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(bodyParser.raw({type: 'application/json'}));

app.post('/stripe/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('stripe webhook signature error', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle relevant events: invoice.paid, invoice.payment_failed
  switch (event.type) {
    case 'invoice.paid':
      const invoice = event.data.object;
      // mark billing_invoices_candidate rows as invoiced via backend job
      console.log('invoice.paid', invoice.id);
      break;
    case 'invoice.payment_failed':
      const failed = event.data.object;
      console.log('payment failed', failed.id);
      // notify finance/ops
      break;
    default:
      console.log('Unhandled stripe event', event.type);
  }

  res.json({received: true});
});

module.exports = app;
