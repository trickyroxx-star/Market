const fs = require('fs');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const data = JSON.parse(fs.readFileSync('reports/moltbook/stripe/stripe_products.json'));

async function run(){
  const result = {products:[], prices:[], usage_pricing: data.usage_pricing};
  for(const p of data.products){
    const prod = await stripe.products.create({name: p.name, description: p.description, metadata: p.metadata});
    let price;
    if(p.price_cents===0){
      // create a free one-time price for reference (not recurring)
      price = await stripe.prices.create({unit_amount: 0, currency: p.currency, product: prod.id});
    } else {
      price = await stripe.prices.create({unit_amount: p.price_cents, currency: p.currency, recurring: {interval: 'month'}, product: prod.id});
    }
    result.products.push({name: p.name, id: prod.id});
    result.prices.push({name: p.name, id: price.id});
    console.log('Created', p.name, prod.id, price.id);
  }
  // create metered price for usage (per 1k tokens)
  const usagePrice = await stripe.prices.create({unit_amount: Math.round(data.usage_pricing.per_1k_tokens_usd*100), currency: 'usd', recurring: {usage_type: 'licensed', interval: 'month'}, product: result.products[1].id});
  result.usage_price = {id: usagePrice.id, per_1k: data.usage_pricing.per_1k_tokens_usd};
  fs.writeFileSync('reports/moltbook/stripe/created_test_products.json', JSON.stringify(result, null, 2));
  console.log('Created usage price', usagePrice.id);
}

run().catch(err=>{console.error(err); process.exit(1)});
