-- daily_customer_usage.sql
-- Aggregated daily usage per customer

CREATE TABLE IF NOT EXISTS daily_customer_usage (
  date date NOT NULL,
  customer_id text NOT NULL,
  account_type text,
  product text,
  calls_count integer DEFAULT 0,
  total_input_tokens bigint DEFAULT 0,
  total_output_tokens bigint DEFAULT 0,
  total_tokens bigint DEFAULT 0,
  total_duration_ms bigint DEFAULT 0,
  cost_usd numeric(12,6) DEFAULT 0,
  billable_amount_usd numeric(12,6) DEFAULT 0,
  primary_model text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (date, customer_id, product)
);

CREATE INDEX IF NOT EXISTS idx_daily_customer_usage_date ON daily_customer_usage(date);