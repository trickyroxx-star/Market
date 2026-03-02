Alerts playbook — cost & usage

1) Alert types
- High daily cost per customer: cost_usd > $100/day -> notify ops
- High single-call cost: single call estimated_cost > $10 -> flag for review
- Rapid traffic spike: calls_count increases > 5x day-over-day -> notify SRE
- Billing candidate anomaly: billable_amount_usd > 3x rolling 30-day average for customer -> finance review

2) Notification channels
- Ops/SRE: Telegram (chat id), Slack channel #ops, PagerDuty for critical
- Finance: Email to finance@company and Slack #finance

3) Example Telegram alert payload (send via openclaw message tool)
- Title: [ALERT] High daily cost: {customer_id}
- Body: Customer {customer_id} incurred ${cost_usd} on {date}. Calls: {calls_count}, tokens: {total_tokens}. Please investigate.

4) Integration examples
- Simple webhook: POST JSON to /alerts with {type, date, customer_id, metric, value, link}
- Alert runner: nightly job runs SELECT ... WHERE cost_usd > threshold and POSTS to webhook

5) Escalation
- Ops checks within 30 minutes for > $500/day
- Finance notified within 24h for billing anomalies > $1000

6) Runbook: Investigating a spike
- Query metering_events_raw for request_id and inspect raw_event
- Check primary_model and model version
- If customer is on free/pro, check plan and usage patterns
- If malicious or runaway, throttle API key and notify customer
