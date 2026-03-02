#!/bin/bash
# Run ETL and export CSVs
# Usage: ./ci/run_etl.sh --date 2026-03-01 --db sqlite:///path
set -e
DATE=${1:-$(date -u +%F)}
DB=${2:-/data/.openclaw/workspace/reports/moltbook/meters/demo_metering.db}
python3 /data/.openclaw/workspace/reports/moltbook/meters/etl_runner.py --date $DATE --db $DB
python3 /data/.openclaw/workspace/reports/moltbook/meters/export_csvs.py
echo 'ETL+export complete'
