# Simple collector server for staging/demo
from http.server import BaseHTTPRequestHandler, HTTPServer
import sqlite3, json, os
DB=os.path.join(os.path.dirname(__file__), 'demo_metering.db')
class CollectorHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        length=int(self.headers.get('content-length',0))
        body=self.rfile.read(length)
        try:
            ev=json.loads(body)
        except Exception as e:
            self.send_response(400); self.end_headers(); self.wfile.write(b'bad json'); return
        conn=sqlite3.connect(DB)
        c=conn.cursor()
        try:
            c.execute('INSERT OR IGNORE INTO metering_events_raw VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', (
                ev.get('request_id'), ev.get('timestamp'), ev.get('customer_id'), ev.get('account_type'), ev.get('product'), ev.get('endpoint'), ev.get('model'), ev.get('model_version'), ev.get('input_tokens'), ev.get('output_tokens'), ev.get('total_tokens'), ev.get('duration_ms'), ev.get('response_status'), json.dumps(ev.get('raw_event'))
            ))
            conn.commit(); self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
        except Exception as e:
            conn.rollback(); self.send_response(500); self.end_headers(); self.wfile.write(str(e).encode())
        finally:
            conn.close()
if __name__=='__main__':
    server=HTTPServer(('0.0.0.0',4000), CollectorHandler)
    print('Collector running on 0.0.0.0:4000')
    server.serve_forever()
