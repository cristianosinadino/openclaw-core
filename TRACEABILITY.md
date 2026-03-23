# Traceability Rules

## Allowed Identifier Patterns
Use one of the following formats when referencing requirements/tasks:
- `INIT-<initiative>-<NNN>` (e.g. `INIT-governance-001`)
- `OPS-<YYYYMMDD>-<NN>` for operational tasks (e.g. `OPS-20260321-01`)
- External ticket IDs (JIRA/Linear/etc.) are allowed verbatim if provided by the requester.

## Logging Requirements
- Create a log file for each ID at `projects/salesforce-lab/initiatives/<initiative>/logs/<id>.md`.
- Each log must include: scope summary, steps executed, validation evidence, unresolved risks, and handoff notes.
- Reference the ID in commit messages, pull requests, and documentation updates.

## Enforcement
No execution begins until a valid ID is recorded and its log file exists (even if initially empty).
