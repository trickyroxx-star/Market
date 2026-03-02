#!/bin/bash
# Seeds model_costs and pricing_models into the DB (Postgres)
# Usage: PG_URL=postgres://user:pass@host:5432/db ./ci/seed_pricing.sh
set -e
if [ -z "$PG_URL" ]; then echo "Set PG_URL"; exit 1; fi
psql "$PG_URL" <<'SQL'
CREATE TABLE IF NOT EXISTS model_costs(model_name TEXT PRIMARY KEY, cost_per_1k_tokens_usd REAL, compute_cost_per_ms_usd REAL);
CREATE TABLE IF NOT EXISTS pricing_models(name TEXT PRIMARY KEY, free_allowance_tokens_per_month INTEGER, price_per_1k_tokens_usd REAL);
INSERT INTO model_costs (model_name, cost_per_1k_tokens_usd, compute_cost_per_ms_usd) VALUES ('gpt-4.1',0.08,0.0) ON CONFLICT DO NOTHING;
INSERT INTO model_costs (model_name, cost_per_1k_tokens_usd, compute_cost_per_ms_usd) VALUES ('gpt-4o-mini',0.01,0.0) ON CONFLICT DO NOTHING;
INSERT INTO pricing_models (name, free_allowance_tokens_per_month, price_per_1k_tokens_usd) VALUES ('free',10000,0.0) ON CONFLICT DO NOTHING;
INSERT INTO pricing_models (name, free_allowance_tokens_per_month, price_per_1k_tokens_usd) VALUES ('pro',50000,0.10) ON CONFLICT DO NOTHING;
INSERT INTO pricing_models (name, free_allowance_tokens_per_month, price_per_1k_tokens_usd) VALUES ('pro_plus',200000,0.08) ON CONFLICT DO NOTHING;
INSERT INTO pricing_models (name, free_allowance_tokens_per_month, price_per_1k_tokens_usd) VALUES ('enterprise',0,0.05) ON CONFLICT DO NOTHING;
SQL

echo 'Seed complete'
