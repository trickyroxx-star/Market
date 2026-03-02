#!/bin/bash
# Run alert runner dry-run
python3 /data/.openclaw/workspace/reports/moltbook/alerts/alert_runner.py --threshold ${1:-100}
