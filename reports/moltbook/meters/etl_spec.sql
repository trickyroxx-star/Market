-- etl_spec.sql
-- Example ETL SQL pseudocode to compute daily_customer_usage and billing candidates.
-- Run this as a nightly job for date D (replace :run_date with the target date)

-- 1) Deduplicate and compute per-event cost
WITH events AS (
  SELECT DISTINCT ON (request_id)
    id, event_time, request_id, customer_id, account_type, product, endpoint, model, model_version,
    COALESCE(total_tokens, (COALESCE(input_tokens,0) + COALESCE(output_tokens,0))) AS total_tokens,
    duration_ms, response_status, raw_event
  FROM metering_events_raw
  WHERE event_time >= (:run_date::date)::timestamptz
    AND event_time <  ((:run_date::date) + INTERVAL '1 day')::timestamptz
  ORDER BY request_id, inserted_at DESC
),
model_rates AS (
  SELECT model_name, cost_per_1k_tokens_usd, compute_cost_per_ms_usd FROM model_costs
),
event_costs AS (
  SELECT
    e.*,
    COALESCE(m.cost_per_1k_tokens_usd, 0) AS cost_per_1k,
    (COALESCE(e.total_tokens,0)::numeric / 1000.0) * COALESCE(m.cost_per_1k_tokens_usd,0) AS token_cost,
    (COALESCE(e.duration_ms,0)::numeric * COALESCE(m.compute_cost_per_ms_usd,0)) AS compute_cost,
    ((COALESCE(e.total_tokens,0)::numeric / 1000.0) * COALESCE(m.cost_per_1k_tokens_usd,0)) +
      ((COALESCE(e.duration_ms,0)::numeric * COALESCE(m.compute_cost_per_ms_usd,0))) AS estimated_cost
  FROM events e
  LEFT JOIN model_rates m ON e.model = m.model_name
),
agg AS (
  SELECT
    (:run_date::date) AS date,
    customer_id,
    account_type,
    product,
    COUNT(*) AS calls_count,
    SUM(COALESCE(input_tokens,0))::bigint AS total_input_tokens,
    SUM(COALESCE(output_tokens,0))::bigint AS total_output_tokens,
    SUM(COALESCE(total_tokens,0))::bigint AS total_tokens,
    SUM(COALESCE(duration_ms,0))::bigint AS total_duration_ms,
    SUM(estimated_cost)::numeric(12,6) AS cost_usd,
    (array_agg(model ORDER BY (CASE WHEN model IS NULL THEN 1 ELSE 0 END) DESC))[1] AS primary_model
  FROM event_costs
  GROUP BY customer_id, account_type, product
)
-- 2) Upsert into daily_customer_usage
INSERT INTO daily_customer_usage (date, customer_id, account_type, product, calls_count, total_input_tokens, total_output_tokens, total_tokens, total_duration_ms, cost_usd, primary_model)
SELECT date, customer_id, account_type, product, calls_count, total_input_tokens, total_output_tokens, total_tokens, total_duration_ms, cost_usd, primary_model
FROM agg
ON CONFLICT (date, customer_id, product) DO UPDATE
  SET calls_count = EXCLUDED.calls_count,
      total_input_tokens = EXCLUDED.total_input_tokens,
      total_output_tokens = EXCLUDED.total_output_tokens,
      total_tokens = EXCLUDED.total_tokens,
      total_duration_ms = EXCLUDED.total_duration_ms,
      cost_usd = EXCLUDED.cost_usd,
      primary_model = EXCLUDED.primary_model,
      created_at = now();

-- 3) Apply pricing rules to compute billable_amount_usd
-- This pseudocode assumes a simple per-1k pricing lookup from pricing_models by customer account_type
WITH computed AS (
  SELECT d.*,
    COALESCE(pm.price_per_1k_tokens_usd, 0) AS price_per_1k,
    COALESCE(pm.free_allowance_tokens_per_month, 0) AS free_allowance
  FROM daily_customer_usage d
  LEFT JOIN pricing_models pm ON d.account_type = pm.name
  WHERE d.date = (:run_date::date)
)
INSERT INTO billing_invoices_candidate (id, date, customer_id, billable_amount_usd, cost_usd, details)
SELECT gen_random_uuid(), date, customer_id,
  GREATEST( ( (total_tokens - free_allowance) / 1000.0) * price_per_1k, 0) AS billable_amount_usd,
  cost_usd,
  jsonb_build_object('calls_count', calls_count, 'total_tokens', total_tokens, 'price_per_1k', price_per_1k, 'free_allowance', free_allowance)
FROM computed
WHERE ( (total_tokens - free_allowance) > 0 )
ON CONFLICT DO NOTHING;

-- 4) Alerts (example): flag high cost customers
-- SELECT customer_id, cost_usd FROM daily_customer_usage WHERE date = :run_date::date AND cost_usd > 100.00; -- hook into alerting system
