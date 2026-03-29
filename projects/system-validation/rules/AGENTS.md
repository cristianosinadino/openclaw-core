# System Validation — Domain Rules

Layer: Domain  
Inherits: `/CORE_RULES.md`  
Overrides: initiative-specific `rules/AGENTS.md`

## Mission
Deliver monitoring and validation capabilities for OpenClaw Core without impacting product initiatives. This domain handles runtime governance, auditing, and telemetry pipelines.

## Domain Constraints
- **Isolation**: Never read/write assets from other domains directly. Use the provided APIs or exported artifacts.
- **Deterministic Outputs**: Logs, memory entries, and API payloads must be structured JSON to support downstream ingestion.
- **Auditability**: Every automated write must include a traceable task ID and agent attribution.
- **Safety**: No persistent secrets in source files; load sensitive values via environment variables or `.env.local` that is git-ignored.

## Required References (per task)
Before implementing any change in this domain, agents must load:
1. `initiatives/<name>/context/000-initiative-overview.md`
2. Relevant requirement in `initiatives/<name>/requirements/active/`
3. `initiatives/<name>/docs/IMPLEMENTATION-MASTER.md`

If any artifact is missing, halt and add/create it before proceeding.
