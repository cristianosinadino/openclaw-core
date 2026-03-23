# Core Governance Rules

## Hierarchy & Precedence
1. Explicit user instructions for the active task
2. Initiative execution contract (initiative README + initiative rules)
3. Core/global rules (this document, SOUL.md, USER.md)
4. Default OpenClaw behavior

Lower layers cannot weaken higher layers. If conflicts appear, halt and request clarification.

## Lifecycle (applies to every workflow)
INTAKE → CONTEXT → PLAN → EXECUTE → VALIDATE → DOCUMENT → HANDOFF. No stage may be skipped.

## Validation Controls
- Define input contract, validation criteria, completion criteria, and failure handling before EXECUTE.
- Validation gates must be explicit and auditable; evidence is stored with the initiative artifact.

## Isolation
- Keep work inside `projects/<initiative>/` unless explicitly authorized.
- Cross-initiative changes require written approval and validation showing no regressions.

## Traceability
- Every execution references a requirement/story/task ID (see TRACEABILITY.md).
- Logs must capture what changed, validation evidence, and unresolved risks.

## Missing Artifacts
If any required artifact (rules, acceptance criteria, validation plan, trace log) is absent, stop and request clarification before continuing.
