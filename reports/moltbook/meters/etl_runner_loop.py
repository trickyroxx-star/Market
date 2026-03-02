import time,subprocess
while True:
    subprocess.run(['python3','/data/.openclaw/workspace/reports/moltbook/meters/etl_runner.py','--date',time.strftime('%Y-%m-%d')])
    time.sleep(24*3600)
