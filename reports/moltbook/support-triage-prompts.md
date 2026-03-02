Support Triage Pro — Prompt Templates (3 variants each)

1) Intent classification

Prompt base (instructions):
You are an assistant that classifies support tickets into one of: [bug, feature_request, billing, account, usability, cancellation, other]. Reply as JSON: {"intent":..., "confidence":0.0, "notes": ""}

Variant A (concise):
- Few-shot: Provide 3 short examples (ticket -> intent). Keep system instructions minimal. Good for speed.

Variant B (contextual):
- Provide 6 examples including edge cases and include customer metadata (plan, previous interactions). Ask for rationale in notes when confidence < 0.7.

Variant C (conservative):
- Ask for two-step: first extract key facts (product, error code), then classify. Lower false positives; prefer explicit "other" when unsure.

2) Priority scoring (prompt + rules)
- Inputs: intent, keywords, account_tier (free/pro/enterprise), time_since_created
- Output: {"priority":"P0|P1|P2","reason":"...","sla_hours":4}
- Rules: billing issues for enterprise -> P0; refund requests -> P1; feature_request -> P2 by default.

3) Reply-draft generator

Prompt base:
You are a helpful support assistant. Given the ticket text and extracted facts, produce:
  - a 1-sentence executive summary
  - a suggested reply (2-4 sentences)
  - a confidence score (0-1)
  - a short list of recommended next actions
Return JSON {"summary":"...","reply":"...","confidence":0.0,"actions":[...]}

Variant A (concise, cheap):
- Use a smaller model prompt focusing on brevity. Add instruction: "Prefer short replies; avoid legal language." Keep token footprint low.

Variant B (high-quality):
- Include: context from customer history, include suggested SLA and optional escalation template. Use higher-capability model.

Variant C (safety-first):
- Redact PII by default: detect names, emails, SSNs, and replace with [REDACTED] in the reply; include original_text in a private field only.

4) Token estimation helper (prompt snippet)
- "Estimate input_tokens and output_tokens for the given text using heuristic: 1 token per 4 characters. Return integers."

5) Example prompt (classification + reply together - full flow)
System: "You are Moltbook Support Assistant. Classify the ticket, score priority, and draft a reply. Output JSON with fields: intent, priority, summary, reply, confidence, token_estimate." 

Testing & A/B plan
- For each variant (A/B/C) run 200 labeled tickets and measure: classification accuracy, reply accept rate (human), average tokens, latency.
- Choose default variant after 1 week of pilot.

Saved: /data/.openclaw/workspace/reports/moltbook/support-triage-prompts.md
