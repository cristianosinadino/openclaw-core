# Pattern — Deterministic-First Workflows

## Summary
For any workflow that involves external systems (Salesforce CLI, file I/O, schema inspection), keep the deterministic steps outside the LLM. Only send the LLM what it needs to reason about — never ask it to perform actions it cannot perform.

## Structure

```
Deterministic layer (script)
  1. Read spec file (salesforce_spec.json / contact_spec.json)
  2. Resolve org alias from process.env.SF_ORG (default: sina-fsc)
  3. Execute sf CLI to fetch real schema
  4. Extract field list

LLM reasoning layer (requestExecutor.execute)
  5. Send: spec fields + real schema fields
  6. Ask: compare and return structured JSON
  7. Do NOT mention org alias in the prompt
  8. Do NOT ask the LLM to call Salesforce

Result layer (script)
  9. Parse LLM response safely
  10. Fall back to deterministic result if LLM output is malformed
  11. Write output JSON file
  12. Print completion message
```

## Rules
- The org alias is resolved in the script layer, not in the LLM prompt
- LLM receives only the data needed for comparison — no infrastructure details
- LLM output is always validated before use; malformed output falls back to a local computation
- The LLM layer is optional — the deterministic layer produces a correct result on its own

## Why
- LLMs hallucinate infrastructure state (org availability, plugin status, gateway config)
- Deterministic steps are cheaper, faster, and more reliable
- Keeping the LLM focused on reasoning reduces prompt injection surface
