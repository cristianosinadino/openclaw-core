# openclaw-core Knowledge Index

## docs/ vs memory/

| | `docs/` | `memory/` |
|---|---|---|
| Purpose | Canonical, curated, stable | Chronological, operational, raw |
| When to write | After a decision is finalized | During/after a session |
| Audience | Future developers, Claude Code | Active session context |
| Format | Structured markdown templates | JSONL logs, daily journals |
| Changes | Intentional edits | Append-only |

**Rule**: finalized architecture decisions belong in `docs/`. `memory/` is not the canonical place for decisions — it is an operational log.

---

## Decisions

| # | Title | Status |
|---|---|---|
| [001](decisions/001-openclaw-plugin-sdk-integration.md) | OpenClaw Plugin SDK Integration | Active |
| [002](decisions/002-command-driven-workflows.md) | Command-Driven Workflows (Slash Commands) | Active |
| [003](decisions/003-absolute-path-resolution.md) | Absolute Path Resolution for Workflow Scripts | Active |

---

## Patterns

- [plugin-command-execution.md](patterns/plugin-command-execution.md) — How slash commands wire to workflow scripts
- [deterministic-first-workflows.md](patterns/deterministic-first-workflows.md) — Keep deterministic steps outside the LLM

---

## Workflow Contracts

| Workflow | Command | Output file |
|---|---|---|
| [Salesforce Validation](workflows/salesforce-validation.md) | `/run-salesforce-validation` | `salesforce_org_validation.json` |
| [Contact Validation](workflows/contact-validation.md) | `/run-contact-validation` | `contact_org_validation.json` |
| [Account Gap Analysis](workflows/account-gap-analysis.md) | `/run-account-gap` | `salesforce_org_validation.json` |

---

## Maintenance

When adding durable knowledge:
1. Create the appropriate file under `docs/decisions/`, `docs/patterns/`, or `docs/workflows/`
2. Add a row to the relevant table above
3. Do not write finalized decisions only to `memory/`
