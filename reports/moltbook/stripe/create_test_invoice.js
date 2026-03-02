const stripe = require('stripe')(process.env.STRIPE_KEY);
const fs = require('fs');
(async()=>{
  // read a billing candidate from demo DB via sqlite3 spawn (we'll pass values via env as fallback)
  const customer_ref = process.env.CUSTOMER_REF || 'cust_01';
  const amount_cents = Math.round(parseFloat(process.env.AMOUNT)||0*100);
  try{
    const customer = await stripe.customers.create({description: `Moltbook test customer ${customer_ref}`, metadata:{customer_ref}});
    console.log('created customer', customer.id);
    // attach test payment method (pm_card_visa) by creating PaymentMethod and attaching
    const pm = await stripe.paymentMethods.create({type:'card', card:{number:'4242424242424242', exp_month:12, exp_year:2030, cvc:'123'}}).catch(e=>null);
    if(pm){
      await stripe.paymentMethods.attach(pm.id, {customer: customer.id});
      await stripe.customers.update(customer.id, {invoice_settings:{default_payment_method:pm.id}});
      console.log('attached payment method', pm.id);
    }
    const invoiceitem = await stripe.invoiceItems.create({customer: customer.id, amount: amount_cents, currency:'usd', description:'Moltbook usage invoice (test)'});
    console.log('invoiceitem', invoiceitem.id);
    const invoice = await stripe.invoices.create({customer: customer.id, auto_advance:true});
    console.log('invoice created', invoice.id);
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
    console.log('finalized', finalized.id, 'status', finalized.status);
    // pay the invoice
    const paid = await stripe.invoices.pay(finalized.id);
    console.log('paid invoice', paid.id, 'status', paid.status);
    fs.writeFileSync('reports/moltbook/stripe/test_invoice_result.json', JSON.stringify({customer:customer.id, invoice:paid.id, status:paid.status}, null,2));
  }catch(e){ console.error(e); process.exit(1)}
})();
