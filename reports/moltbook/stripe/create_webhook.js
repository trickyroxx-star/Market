const fs=require('fs'); const stripe=require('stripe')(process.env.STRIPE_KEY);
(async()=>{
  // Use FORWARD_URL env if provided, otherwise try to read /tmp/lt_out.txt for localtunnel
  let forward = process.env.FORWARD_URL || null;
  if(!forward){
    try{ const txt = fs.readFileSync('/tmp/lt_out.txt','utf8'); const m = txt.match(/https?:\/\/\S+/); if(m) forward = m[0].trim(); }catch(e){}
  }
  if(!forward) forward = 'http://127.0.0.1:4000/stripe/webhook';
  console.log('Using forward URL:', forward);
  const we=await stripe.webhookEndpoints.create({url: forward, enabled_events:['invoice.created','invoice.finalized','invoice.paid','invoice.payment_failed']});
  console.log(we.id, we.secret);
  fs.writeFileSync('stripe_test_webhook.json', JSON.stringify({id:we.id, secret:we.secret,url:we.url, events:we.enabled_events}, null,2));
})();
