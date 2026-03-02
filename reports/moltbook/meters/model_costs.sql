-- model_costs.sql
-- Configured provider/model costs used to estimate inference expense

CREATE TABLE IF NOT EXISTS model_costs (
  model_name text PRIMARY KEY,
  cost_per_1k_tokens_usd numeric(10,6) NOT NULL,
  compute_cost_per_ms_usd numeric(12,9) DEFAULT 0, -- optional
  notes text,
  updated_at timestamptz DEFAULT now()
);

-- Example seed
-- INSERT INTO model_costs (model_name, cost_per_1k_tokens_usd) VALUES
-- ('gpt-4.1', 0.08),
-- ('gpt-4o-mini', 0.01);
