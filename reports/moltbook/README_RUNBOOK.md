Moltbook Metering & Billing — Runbook (staging/dry-run)

Overview
This runbook describes how to run the local metering collector, emitter demo, ETL, alerts, and staging docker-compose stack. Everything is safe-by-default (dry-run), does not call live Stripe or production DBs, and uses a demo SQLite DB unless you configure Postgres.

Paths
- Project root: /data/.openclaw/workspace/reports/moltbook
- Metering SQL: meters/*.sql
- Instrumentation examples: meters/instrumentation/
- Demo DB: meters/demo_metering.db
- Synthetic events: meters/synthetic/sample_events.jsonl
- ETL spec: meters/etl_spec.sql
- Stripe templates & script: stripe/
- Alerts: alerts/

Local demo: quick start
1) Regenerate demo DB and seed (optional):
   python3 meters/synthetic/generate_sample_events.py > meters/synthetic/sample_events.jsonl
   (then run the provided demo loader scripts or ETL runner)

2) Start local collector (HTTP) that writes to demo DB:
   python3 meters/collector_server.py
   - Collector listens on 127.0.0.1:4000 by default.

3) Post events to collector (example test client):
   Use meters/instrumentation/node_express_event_emitter.js in a running Express app, or post JSON to http://127.0.0.1:4000

4) Run ETL (nightly simulation):
   python3 meters/etl_runner.py --date YYYY-MM-DD
   - This runs dedupe, cost computation, aggregates daily_customer_usage, and writes billing_invoices_candidate.

5) Run alerts (dry-run):
   python3 alerts/alert_runner.py --threshold 100
   - Prints alert payloads; to enable real notifications wire webhook/telegram config (see below).

Files provided
- meters/collector_server.py: Simple HTTP collector that writes to demo DB.
- meters/etl_runner.py: Runs ETL logic against demo DB (safe mode).
- meters/export_csvs.py: Exports daily_customer_usage and billing candidates CSVs.
- stripe/create_stripe_products.js: Dry-run capable script to create Stripe products/prices.
- alerts/alert_runner.py: Dry-run alert generator.
- docker/: Dockerfiles and docker-compose.yml for staging stack (collector, worker, Postgres).

Docker-compose (staging) notes
- Uses Postgres container for persistent data. Default DB config lives in docker/.env. Do not point to production DB.
- Collector and worker containers mount /data/.openclaw/workspace/reports/moltbook for code and will write to Postgres using PG_ env vars.

CI / Run scripts
- ci/seed_pricing.sh: seeds model_costs and pricing_models into configured DB.
- ci/run_etl.sh: runs ETL for a date and exports CSVs.
- ci/alerts_dryrun.sh: runs alert runner and prints payloads.

Safety & rollback
- All write scripts support a --dry-run flag where applicable.
- Before writing to a Postgres DB: take a pg_dump of affected tables: pg_dump -t metering_events_raw -t daily_customer_usage -t billing_invoices_candidate
- ETL runner wraps writes in transactions and can be reverted by restoring from backup.

Secrets required for live mode
- POSTGRES_URL (for staging DB)
- STRIPE_KEY (test or live) — prefer test key for initial runs
- ALERT_WEBHOOK (Slack/HTTP) or TELEGRAM_TOKEN + CHAT_ID

Preflight tests (staging switch checklist)
1) Run all scripts in dry-run mode and validate CSVs.
2) Seed pricing and model costs into staging DB.
3) Send synthetic high-volume event to ensure alert triggers and throttles work.
4) Confirm billing_invoices_candidate matches expected pricing for sample customers.
5) Confirm Stripe product/prices exist in test account and map plan IDs into pricing_models if you want automated invoices.

Support
Contact: Tricky (workspace USER.md) for approval to run destructive or live actions.
