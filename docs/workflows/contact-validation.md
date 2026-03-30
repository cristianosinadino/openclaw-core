# Workflow — Contact Org Validation

## Command
`/run-contact-validation` (OpenClaw TUI)
`run contact validation` (node tui.js)

## Purpose
Validate that all fields defined in `contact_spec.json` exist in the real Salesforce Contact object in the target org.

## Inputs
- `contact_spec.json` — object name and required fields (`FirstName`, `LastName`, `Email`, `Phone`)
- `SF_ORG` env var (default: `sina-fsc`) — target org alias

## Process
1. Read `contact_spec.json`
2. Run `sf sobject describe --sobject Contact --json --target-org $SF_ORG`
3. Extract field names from describe output
4. Send spec fields + real fields to LLM via `requestExecutor.execute` (capability: `summarize_cheap`)
5. LLM returns `{ objectExists, missingFields, validFields }`
6. On malformed LLM output: compute result deterministically
7. Write result to `contact_org_validation.json`

## Output
`contact_org_validation.json`
```json
{ "objectExists": true, "missingFields": [], "validFields": ["FirstName", "LastName", "Email", "Phone"] }
```

## Org handling
Resolved from `process.env.SF_ORG` in the script. Never passed to the LLM.

## LLM policy
Used for comparison only. Falls back to deterministic diff if output is malformed.

## Script
`projects/system-validation/initiatives/core-model-control/scripts/contactOrgValidation.js`
