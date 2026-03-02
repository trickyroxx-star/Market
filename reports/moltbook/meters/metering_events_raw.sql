-- metering_events_raw.sql
-- Raw events store for API metering

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS metering_events_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_time timestamptz NOT NULL,
  request_id text NOT NULL UNIQUE,
  customer_id text NOT NULL,
  account_type text,
  product text,
  endpoint text,
  model text,
  model_version text,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  duration_ms integer,
  cost_estimate_usd numeric(10,6),
  response_status integer,
  tags jsonb,
  metadata jsonb,
  raw_event jsonb NOT NULL,
  inserted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metering_events_raw_customer_time ON metering_events_raw(customer_id, event_time);