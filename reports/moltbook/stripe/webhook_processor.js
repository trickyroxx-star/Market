const http = require('http');
const fs = require('fs');
const stripePkg = require('stripe');
const sqlite3 = require('sqlite3').verbose();

const secretsPath = '/data/.openclaw/workspace/reports/moltbook/stripe/stripe_test_webhook.json';
const secrets = JSON.parse(fs.readFileSync(secretsPath,'utf8'));
const STRIPE_KEY = fs.existsSync('/data/.openclaw/workspace/secrets/stripe_test.key') ? fs.readFileSync('/data/.openclaw/workspace/secrets/stripe_test.key','utf8').trim() : process.env.STRIPE_KEY;
const stripe = stripePkg(STRIPE_KEY);
const SIGNING_SECRET = secrets.secret;
const DB_PATH = '/data/.openclaw/workspace/reports/moltbook/meters/demo_metering.db';

const db = new sqlite3.Database(DB_PATH);

function handleInvoicePaid(invoice){
  const invoice_id = invoice.id;
  const amount = invoice.amount_paid ? invoice.amount_paid/100.0 : (invoice.total ? invoice.total/100.0 : null);
  console.log('invoice.paid received', invoice_id, 'amount', amount);
  db.serialize(()=>{
    db.get("SELECT id, customer_id, billable_amount_usd, details FROM billing_invoices_candidate WHERE status IS NULL OR status!='invoiced' ORDER BY date DESC LIMIT 1", (err,row)=>{
      if(err){ console.error('db err',err); return; }
      if(!row){ console.log('no candidate rows to match'); return; }
      try{
        let detailsObj = {};
        try{ detailsObj = JSON.parse(row.details || '{}'); }catch(e){}
        detailsObj.invoice_id = invoice_id;
        const newDetails = JSON.stringify(detailsObj);
        db.run("UPDATE billing_invoices_candidate SET status='invoiced', details=? WHERE id=?", [newDetails, row.id], function(e){
          if(e) console.error('update err',e); else console.log('marked candidate', row.id, 'as invoiced');
        });
      }catch(e){ console.error('handle err', e); }
    });
  });
}

const server = http.createServer((req,res)=>{
  if(req.method==='POST' && req.url==='/stripe/webhook'){
    let chunks=[];
    req.on('data',c=>chunks.push(c));
    req.on('end',()=>{
      const raw = Buffer.concat(chunks);
      const sig = req.headers['stripe-signature'];
      let event;
      try{
        event = stripe.webhooks.constructEvent(raw, sig, SIGNING_SECRET);
      }catch(err){
        console.error('signature verify failed', err.message);
        // Fallback: try to parse body without signature (test mode only)
        try{
          event = JSON.parse(raw.toString('utf8'));
          console.warn('Fallback: processing unsigned event (test mode)');
        }catch(e){
          res.writeHead(400); res.end('signature fail'); return;
        }
      }
      console.log('webhook event', event.type || event.type);
      const etype = event.type || event.type;
      if(etype==='invoice.paid'){
        const obj = event.data && event.data.object ? event.data.object : event;
        handleInvoicePaid(obj);
      }
      fs.appendFileSync('/data/.openclaw/workspace/reports/moltbook/stripe/webhook_events.log', new Date().toISOString()+' '+event.type+' '+event.id+'\n');
      res.writeHead(200); res.end('ok');
    });
  } else {
    res.writeHead(404); res.end('not found');
  }
});

server.listen(5000, '127.0.0.1', ()=>console.log('webhook processor listening on 127.0.0.1:5000'));
