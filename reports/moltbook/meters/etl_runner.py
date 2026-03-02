# etl_runner.py - runs nightly ETL against demo DB (safe mode)
import sqlite3, json, argparse, datetime, uuid, os
parser=argparse.ArgumentParser()
parser.add_argument('--date', type=str, default=None)
parser.add_argument('--db', type=str, default=os.path.join(os.path.dirname(__file__), 'demo_metering.db'))
args=parser.parse_args()
run_date = args.date if args.date else datetime.datetime.utcnow().date().isoformat()
conn=sqlite3.connect(args.db)
c=conn.cursor()
rows=c.execute('SELECT customer_id, account_type, product, model, SUM(input_tokens), SUM(output_tokens), SUM(total_tokens), SUM(duration_ms), COUNT(*) FROM metering_events_raw WHERE event_time >= ? AND event_time < ? GROUP BY customer_id, account_type, product, model', (run_date+'T00:00:00Z', run_date+'T23:59:59Z')).fetchall()
from collections import defaultdict
agg=defaultdict(lambda: {'calls':0,'in':0,'out':0,'tokens':0,'dur':0,'cost':0.0,'models':defaultdict(int)})
for r in rows:
    cust=r[0];acct=r[1];prod=r[2];model=r[3];in_tokens=r[4] or 0;out_tokens=r[5] or 0;tot=r[6] or 0;dur=r[7] or 0;calls=r[8]
    rate=c.execute('SELECT cost_per_1k_tokens_usd FROM model_costs WHERE model_name=?',(model,)).fetchone()
    cost_per_1k=rate[0] if rate else 0.0
    cost=(tot/1000.0)*cost_per_1k
    key=(cust,acct,prod)
    agg[key]['calls']+=calls
    agg[key]['in']+=in_tokens
    agg[key]['out']+=out_tokens
    agg[key]['tokens']+=tot
    agg[key]['dur']+=dur
    agg[key]['cost']+=cost
    agg[key]['models'][model]+=1
for (cust,acct,prod),v in agg.items():
    primary_model=max(v['models'].items(), key=lambda x:x[1])[0] if v['models'] else None
    c.execute('REPLACE INTO daily_customer_usage VALUES (?,?,?,?,?,?,?,?,?,?,?)', (run_date,cust,acct,prod,v['calls'],v['in'],v['out'],v['tokens'],v['dur'],v['cost'],primary_model))
    pm=c.execute('SELECT free_allowance_tokens_per_month, price_per_1k_tokens_usd FROM pricing_models WHERE name=?',(acct,)).fetchone()
    free_allow=pm[0] if pm else 0
    price_per_1k=pm[1] if pm else 0
    billable = max(((v['tokens'] - free_allow)/1000.0)*price_per_1k, 0.0)
    if billable>0:
        c.execute('INSERT OR IGNORE INTO billing_invoices_candidate VALUES (?,?,?,?,?,?)', (str(uuid.uuid4()), run_date, cust, billable, v['cost'], json.dumps({'calls':v['calls'],'tokens':v['tokens']})))
conn.commit()
print('ETL run complete for', run_date)
conn.close()
