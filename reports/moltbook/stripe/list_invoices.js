const fs = require('fs');
const stripe = require('./node_modules/stripe')(process.env.STRIPE_KEY);
(async ()=>{
  try{
    const inv = await stripe.invoices.list({limit:50});
    const out = inv.data.map(i=>({id:i.id,status:i.status,amount_paid:i.amount_paid,customer:i.customer,created:i.created,lines: (i.lines && i.lines.data)? i.lines.data.map(l=>({desc:l.description,amount:l.amount,price: l.price? l.price.id : null})):[]}));
    fs.writeFileSync('reports/moltbook/stripe/stripe_test_invoices.json', JSON.stringify(out,null,2));
    console.log('saved invoices');
  }catch(e){ console.error(e); process.exit(1)}
})();
