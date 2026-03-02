Support Triage Pro — Engineering Ticket List (priority order)

Overview
These tickets represent the 30-day MVP plan broken into actionable developer tasks. Each ticket includes a short description, acceptance criteria, owner suggestion, and estimate (days).

T0. Repo & CI setup
- T0.1: Create feature branch `feat/support-triage` + repo skeleton
  - Description: Add folders (connectors/, backend/, frontend/, ml/, infra/), package.json, Python venv tooling, and CI (lint, unit tests).
  - Acceptance: CI pipeline runs on PR and passes lint on baseline.
  - Owner: Backend
  - Est: 1 day

Ingest & Storage
- T1.1: IMAP Email connector (polling)
  - Description: Service that polls configured IMAP mailbox, extracts message_id, subject, body, attachments, sender; normalizes to ticket JSON and POSTs to collector endpoint.
  - Acceptance: Ingests sample 100 emails (provided) and writes events to metering_events_raw; logs request_id per message.
  - Owner: Backend
  - Est: 4 days

- T1.2: Slack webhook receiver + CSV uploader
  - Description: Endpoint to receive Slack events (messages), normalize and create ticket; CSV upload UI to import multiple tickets.
  - Acceptance: Slack message -> ticket; CSV with 100 rows imports with no errors.
  - Owner: Backend + Frontend
  - Est: 3 days

- T1.3: Ticket DB schema + minimal API
  - Description: Create tickets table (id, request_id, source, source_id, subject, body, status, created_at, metadata) and simple REST API endpoints (list, get, update).
  - Acceptance: Tickets persist; API returns JSON; unit tests cover CRUD.
  - Owner: Backend
  - Est: 2 days

LLM Pipeline
- T2.1: Intent classifier service
  - Description: Service that accepts ticket text and returns intent labels + confidence. Implement as prompt + fallback to local rule-based classifier for edge cases.
  - Acceptance: Classifies 100 labeled samples with >=85% macro F1 (initial target).
  - Owner: ML/Prompt engineer
  - Est: 4 days

- T2.2: Priority scoring and SLA recommendation
  - Description: Rule-based/ML scoring using intent, keywords, and account tier to produce P0/P1/P2 and suggested SLA route.
  - Acceptance: Produces sensible priority for pilot dataset; unit-tested rules.
  - Owner: ML/Backend
  - Est: 2 days

- T2.3: Reply-draft generator
  - Description: Prompt template to generate short summary + suggested reply and a confidence score; include token count estimation.
  - Acceptance: Produces draft for 100 sample tickets; human review acceptance >=30% in pilot.
  - Owner: ML/Prompt engineer
  - Est: 4 days

Frontend & UX
- T3.1: Inbox UI (list + detail)
  - Description: React-based list of tickets with filters (unprocessed, priority), detail view with suggested reply and send/accept/edit buttons.
  - Acceptance: Can accept draft and send (simulate send), show audit trail and token usage per ticket.
  - Owner: Frontend
  - Est: 6 days

- T3.2: CSV import UI
  - Description: Simple UI to upload CSV and show import results; call T1.2 backend.
  - Acceptance: Upload 100-row CSV -> tickets created; errors displayed.
  - Owner: Frontend
  - Est: 2 days

Ops, Metering & Alerts
- T4.1: Metering emission per ticket
  - Description: Ensure each processed ticket emits a metering event to metering_events_raw with model, tokens, duration, request_id.
  - Acceptance: 100 sample tickets show metering rows; reflected in daily_customer_usage after ETL.
  - Owner: Backend
  - Est: 2 days

- T4.2: Cost-control & model routing
  - Description: Implement model selection config: cheap_model for drafts, expensive_model for summaries; enforce per-customer quotas and alert on >threshold cost/day.
  - Acceptance: Routing works via config; alerts fire when synthetic threshold breached.
  - Owner: Backend/DevOps
  - Est: 3 days

QA & Pilot
- T5.1: End-to-end QA and load test
  - Description: Synthetic load runner that posts 1k tickets/day and validates pipeline stability and metering correctness.
  - Acceptance: No critical failures; basic SLA (success rate) met.
  - Owner: QA
  - Est: 3 days

- T5.2: Pilot onboarding docs
  - Description: Short guide for pilot customers: setup email/Slack connectors, expected results, privacy notes.
  - Acceptance: Pilot guide reviewed and uploaded.
  - Owner: Product
  - Est: 2 days

Total estimated effort (core): ~32 dev-days across roles (parallelizable).

Next steps (immediate)
- Create GitHub issues from this list (I can scaffold PR/issue templates). 
- I’ll also produce the initial prompt templates and 3 prompt variants for classification and reply generation (next task per your choice).

Saved: /data/.openclaw/workspace/reports/moltbook/support-triage-ticketlist.md
