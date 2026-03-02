-- seed_model_pricing.sql
-- Conservative default seeds for model_costs and pricing_models

INSERT INTO model_costs (model_name, cost_per_1k_tokens_usd, compute_cost_per_ms_usd, notes) VALUES
('gpt-4.1', 0.08, 0.000000, 'high-capability model assumed cost'),
('gpt-4o-mini', 0.01, 0.000000, 'lower-cost model for low-value calls');

INSERT INTO pricing_models (name, free_allowance_tokens_per_month, price_per_1k_tokens_usd) VALUES
('free', 10000, 0.00),
('pro', 50000, 0.10),
('pro_plus', 200000, 0.08),
('enterprise', 0, 0.05);
