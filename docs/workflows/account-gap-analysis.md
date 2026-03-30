# Workflow — Account Gap Analysis

## Command
`/run-account-gap` (OpenClaw TUI)
`run account gap analysis` (node tui.js)

## Purpose
Identify gaps between the fields declared in `salesforce_spec.json` and the real Account schema in the target org. Functionally identical to Account validation — the distinction is intent (gap discovery vs. pass/fail validation).

## Inputs
- `salesforce_spec.json` — object name and required fields
- `SF_ORG` env var (default: `sina-fsc`) — target org alias

## Process
Same as Salesforce Account Validation workflow. Reuses `salesforceOrgValidation.js`.

## Output
`salesforce_org_validation.json`
```json
{ "objectExists": true, "missingFields": [], "validFields": ["Name", "Phone", "Industry"] }
```

## Org handling
Resolved from `process.env.SF_ORG` in the script. Never passed to the LLM.

## LLM policy
Used for comparison only. Falls back to deterministic diff if output is malformed.

## Script
`projects/system-validation/initiatives/core-model-control/scripts/salesforceOrgValidation.js`
