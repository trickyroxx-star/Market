# alert_runner.py - dry-run alert generation from demo DB
# Usage: python alert_runner.py --threshold 100
import sqlite3, json, argparse
parser=argparse.ArgumentParser()
parser.add_argument('--threshold', type=float, default=100.0)
args=parser.parse_args()
conn=sqlite3.connect('reports/moltbook/meters/demo_metering.db')
c=conn.cursor()
rows=c.execute('SELECT date, customer_id, cost_usd, calls_count, total_tokens FROM daily_customer_usage WHERE cost_usd > ?', (args.threshold,)).fetchall()
for r in rows:
    date, customer_id, cost_usd, calls, tokens = r
    payload = {
        'title': f'[ALERT] High daily cost: {customer_id}',
        'body': f'Customer {customer_id} incurred ${cost_usd:.2f} on {date}. Calls: {calls}, tokens: {tokens}.'
    }
    print('DRY-RUN Alert payload:', json.dumps(payload))
conn.close()
