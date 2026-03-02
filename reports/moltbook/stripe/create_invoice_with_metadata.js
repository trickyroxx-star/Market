const stripe = require('./node_modules/stripe')(process.env.STRIPE_KEY);
const fs = require('fs');
(async()=>{
  try{
    // candidate info passed via env or we pick defaults
    const candidate_id = process.env.CANDIDATE_ID || 'e97fda9a-fb4e-4c70-b161-c69709455bbd';
    const customer_ref = process.env.CUSTOMER_REF || 'cust_01';
    const amount = parseFloat(process.env.AMOUNT) || 0.756; // USD
    // create a Stripe customer and attach metadata pointing to candidate_id
    const customer = await stripe.customers.create({description:`Test customer ${customer_ref}`, metadata:{candidate_id}});
    console.log('created customer', customer.id);
    // create payment method and attach for auto-pay
    const pm = await stripe.paymentMethods.create({type:'card', card:{number:'4242424242424242', exp_month:12, exp_year:2030, cvc:'123'}}).catch(()=>null);
    if(pm){ await stripe.paymentMethods.attach(pm.id, {customer: customer.id}); await stripe.customers.update(customer.id, {invoice_settings:{default_payment_method: pm.id}}); console.log('attached pm',pm.id)}
    // create invoice item with metadata linking to candidate
    const invoiceItem = await stripe.invoiceItems.create({customer: customer.id, amount: Math.round(amount*100), currency:'usd', description:'Moltbook usage (test)', metadata:{candidate_id}});
    console.log('invoice item', invoiceItem.id);
    const invoice = await stripe.invoices.create({customer: customer.id, auto_advance: true, metadata:{candidate_id}});
    console.log('invoice created', invoice.id);
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
    console.log('finalized', finalized.id, 'status', finalized.status);
    const paid = await stripe.invoices.pay(finalized.id);
    console.log('paid', paid.id, 'status', paid.status);
    fs.writeFileSync('reports/moltbook/stripe/created_invoice_with_meta.json', JSON.stringify({candidate_id,customer:customer.id,invoice:paid.id,status:paid.status},null,2));
  }catch(e){ console.error(e); process.exit(1)}
})();
