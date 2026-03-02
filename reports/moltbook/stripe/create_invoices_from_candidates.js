const fs = require('fs');
const stripe = require('./node_modules/stripe')(process.env.STRIPE_KEY);
const sqlite3 = require('sqlite3').verbose();
const DB = '/data/.openclaw/workspace/reports/moltbook/meters/demo_metering.db';

(async ()=>{
  const db = new sqlite3.Database(DB);
  db.serialize(()=>{
    db.all("SELECT id, customer_id, billable_amount_usd, details FROM billing_invoices_candidate WHERE billable_amount_usd>0", async (err, rows)=>{
      if(err){ console.error(err); process.exit(1); }
      for(const r of rows){
        try{
          const candidate_id = r.id;
          const amount_usd = parseFloat(r.billable_amount_usd);
          // create test customer in stripe with metadata
          const cust = await stripe.customers.create({description:`candidate_${candidate_id}`, metadata:{candidate_id}});
          // create a test payment method and attach
          let pm=null;
          try{ pm = await stripe.paymentMethods.create({type:'card', card:{number:'4242424242424242', exp_month:12, exp_year:2030, cvc:'123'}}); await stripe.paymentMethods.attach(pm.id,{customer:cust.id}); await stripe.customers.update(cust.id,{invoice_settings:{default_payment_method:pm.id}});}catch(e){console.warn('pm attach failed',e.message)}
          // create invoice item
          const ii = await stripe.invoiceItems.create({customer:cust.id, amount: Math.round(amount_usd*100), currency:'usd', description:'Moltbook billing candidate', metadata:{candidate_id}});
          console.log('created invoice item', ii.id, 'for candidate', candidate_id);
          // create invoice
          const inv = await stripe.invoices.create({customer:cust.id, auto_advance:true, metadata:{candidate_id}});
          console.log('created invoice', inv.id);
          // finalize and pay
          const finalized = await stripe.invoices.finalizeInvoice(inv.id);
          console.log('finalized', finalized.id, 'status', finalized.status);
          try{ const paid = await stripe.invoices.pay(finalized.id); console.log('paid', paid.id, 'status', paid.status); } catch(e){ console.warn('pay failed', e.message); }
        }catch(e){ console.error('error creating invoice for candidate', r.id, e.message); }
      }
      process.exit(0);
    });
  });
})();
