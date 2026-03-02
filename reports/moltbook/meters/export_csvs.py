# export_csvs.py - exports daily_customer_usage and billing_invoices_candidate to CSV
import sqlite3, csv, os
DB=os.path.join(os.path.dirname(__file__), 'demo_metering.db')
conn=sqlite3.connect(DB)
c=conn.cursor()
with open(os.path.join(os.path.dirname(__file__),'daily_customer_usage_export.csv'),'w',newline='') as f:
    w=csv.writer(f)
    w.writerow(['date','customer_id','account_type','product','calls_count','total_input_tokens','total_output_tokens','total_tokens','total_duration_ms','cost_usd','primary_model'])
    for row in c.execute('SELECT * FROM daily_customer_usage'):
        w.writerow(row)
with open(os.path.join(os.path.dirname(__file__),'billing_invoices_candidate_export.csv'),'w',newline='') as f:
    w=csv.writer(f)
    w.writerow(['id','date','customer_id','billable_amount_usd','cost_usd','details'])
    for row in c.execute('SELECT * FROM billing_invoices_candidate'):
        w.writerow(row)
print('Exports written to', os.path.dirname(__file__))
conn.close()
