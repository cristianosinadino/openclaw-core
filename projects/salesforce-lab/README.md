# Salesforce Lab

Execution entry point for Salesforce-focused work inside `openclaw-core`.

This README is a contract for how initiatives in this folder are run. It defines context, control hierarchy, and execution behavior for both humans and AI agents.

## 1) System Context

`projects/salesforce-lab/` exists to run Salesforce initiatives in isolation while staying compatible with the OpenClaw core operating model.

- Core runtime concerns stay at repository root (`agents/`, `services/`, `scripts/`, `workflows/`).
- Initiative concerns stay local to this lab (`requirements`, `docs`, `rules`, `context`).
- No initiative-specific logic should leak into global core folders.

## 2) Rule Hierarchy (Override Order)

When instructions conflict, apply this precedence top to bottom (higher item wins):

1. Explicit user request for current task
2. Initiative-level `rules/AGENTS.md`
3. Initiative rule packs under `rules/*`
4. Initiative architecture and implementation docs in `docs/`
5. Repository root guidance in `README.md` and root configuration

Operational rules:

- Never violate higher-precedence instructions to satisfy lower-precedence guidance.
- If two sources at the same level conflict, stop and request clarification.
- Record important decisions in initiative docs or ADRs so future runs remain consistent.
- Global baseline precedence is defined in `CORE_RULES.md`; this contract extends it for Salesforce Lab initiative execution.

## 3) Agent Execution Model (OpenClaw-Aligned)

All initiative delivery follows this flow:

`INTAKE -> CONTEXT -> PLAN -> EXECUTE -> VALIDATE -> DOCUMENT -> HANDOFF`

### Intake

- Start from active requirement in `requirements/active/`.
- Confirm scope, acceptance criteria, and dependencies.

### Context

- Read initiative rules first (`rules/AGENTS.md`, then relevant rule packs).
- Read required architecture and design docs before coding.

### Plan

- Select the minimum viable implementation path.
- Identify risks, assumptions, and affected artifacts.

### Execute

- Implement only within initiative boundaries unless explicitly requested.
- Keep changes traceable to requirement/story IDs.

### Validate

- Run relevant checks/tests for touched behavior.
- Confirm acceptance criteria are met before moving status.

### Document

- Update docs, notes, or ADRs when behavior/design changes.
- Keep requirement status synchronized (`backlog` -> `active` -> `completed`).

### Handoff

- Provide clear completion notes: what changed, what was validated, what is next.
- Surface open risks or follow-ups explicitly.

## Current Initiatives

- `initiatives/msb`: Main Street Bank initiative (active documentation and delivery artifacts)

## Structure

```text
projects/salesforce-lab/
├── initiatives/
│   └── <initiative-name>/
│       ├── context/       # Indexed context snapshots and execution reports
│       ├── docs/          # Architecture and implementation documentation
│       ├── requirements/  # Backlog, active stories, completed stories
│       └── rules/         # Initiative-specific execution rules
```

## Getting Started

1. Open `initiatives/msb/rules/AGENTS.md`.
2. Review `initiatives/msb/docs/00-START-HERE.md`.
3. Review `initiatives/msb/docs/IMPLEMENTATION-MASTER.md`.
4. Pick work from `initiatives/msb/requirements/active/`.
