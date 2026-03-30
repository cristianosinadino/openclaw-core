# Workflow — Salesforce Account Validation

## Command
`/run-salesforce-validation` (OpenClaw TUI)
`run salesforce validation` (node tui.js)

## Purpose
Validate that all fields defined in `salesforce_spec.json` exist in the real Salesforce Account object in the target org.

## Inputs
- `salesforce_spec.json` — object name and required fields
- `SF_ORG` env var (default: `sina-fsc`) — target org alias

## Process
1. Read `salesforce_spec.json`
2. Run `sf sobject describe --sobject Account --json --target-org $SF_ORG`
3. Extract field names from describe output
4. Send spec fields + real fields to LLM via `requestExecutor.execute` (capability: `summarize_cheap`)
5. LLM returns `{ objectExists, missingFields, validFields }`
6. On malformed LLM output: compute result deterministically
7. Write result to `salesforce_org_validation.json`

## Output
`salesforce_org_validation.json`
```json
{ "objectExists": true, "missingFields": [], "validFields": ["Name", "Phone", "Industry"] }
```

## Org handling
Resolved from `process.env.SF_ORG` in the script. Never passed to the LLM.

## LLM policy
Used for comparison only. Cannot be asked to call Salesforce. Falls back to deterministic diff if output is malformed.

## Script
`projects/system-validation/initiatives/core-model-control/scripts/salesforceOrgValidation.js`
