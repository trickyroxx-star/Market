-- pricing_models.sql
-- Pricing and plan definitions

CREATE TABLE IF NOT EXISTS pricing_models (
  id serial PRIMARY KEY,
  name text NOT NULL,
  free_allowance_tokens_per_month bigint DEFAULT 0,
  price_per_1k_tokens_usd numeric(10,6) DEFAULT 0,
  tier_rules jsonb, -- e.g. [{"upto":100000,"price_per_1k":0.02}, ...]
  created_at timestamptz DEFAULT now()
);

-- Example rows to seed (uncomment to insert)
-- INSERT INTO pricing_models (name, free_allowance_tokens_per_month, price_per_1k_tokens_usd) VALUES
-- ('free', 10000, 0.00),
-- ('pro', 50000, 0.10);
