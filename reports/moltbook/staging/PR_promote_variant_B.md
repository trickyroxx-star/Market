Title: Promote Variant B prompt → staging

Summary:
We ran a 600-call A/B test across three prompt variants for support ticket classification. Variant B showed the highest average confidence with moderate token usage. This PR promotes Variant B to the staging prompt config.

Files changed:
- prompts/prompt_staging_B.txt
- staging/prompt_config.json

Testing:
- Promoted prompt will run in staging with gpt-4o; monitor support-triage-ab-summary.json and daily ETL.

Approval:
- Merge to staging once CI passes. Do NOT merge to main without additional approval.