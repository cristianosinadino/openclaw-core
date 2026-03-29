# Core Governance Rules

## Hierarchy & Precedence

Rules are applied in this order (lowest to highest specificity):

1. Core rules — this document; baseline for every layer; cannot be overridden silently
2. Domain rules — `projects/<domain>/rules/`; inherits Core, may add stricter constraints
3. Initiative rules — `projects/<domain>/initiatives/<name>/rules/`; most specific; overrides Domain and Core

Conflict resolution:
- More specific layers (Initiative > Domain > Core) take precedence.
- Overrides must be explicit. Silent override is not allowed.
- If a conflict cannot be resolved, halt and request clarification before continuing.

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
