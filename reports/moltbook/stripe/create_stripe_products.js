// create_stripe_products.js - create products and prices in Stripe from stripe_products.json
// Usage: STRIPE_KEY=sk_test_xxx node create_stripe_products.js --dry-run

const fs = require('fs');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const data = JSON.parse(fs.readFileSync('reports/moltbook/stripe/stripe_products.json'));

async function run(dryRun){
  for(const p of data.products){
    console.log('Product:', p.name, p.price_cents/100, p.currency);
    if(dryRun) continue;
    const prod = await stripe.products.create({name: p.name, description: p.description, metadata: p.metadata});
    const price = await stripe.prices.create({unit_amount: p.price_cents, currency: p.currency, recurring: {interval: 'month'}, product: prod.id});
    console.log('Created', prod.id, price.id);
  }
  console.log('Usage pricing:', data.usage_pricing);
}

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
run(dry).catch(err=>{console.error(err); process.exit(1)});
