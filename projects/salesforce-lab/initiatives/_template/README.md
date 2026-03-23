# Initiative Template

Execution contract for a Salesforce initiative inside `projects/salesforce-lab/initiatives/`.

Copy this folder to create a new initiative. Replace placeholder names and keep the control model intact.

## 1) System Context

This initiative exists to deliver Salesforce scope in isolation while following OpenClaw operating constraints.

- Keep initiative-specific artifacts local to this initiative folder.
- Keep reusable, repository-wide concerns in root-level core folders.
- Do not mix initiative behavior into unrelated initiatives.

## 2) Rule Hierarchy (Override Order)

When instructions conflict, apply this precedence top to bottom:

1. Explicit user request for current task
2. This initiative's `rules/AGENTS.md`
3. This initiative's rule packs in `rules/*`
4. This initiative's architecture/implementation docs in `docs/`
5. `projects/salesforce-lab/README.md`
6. Repository root guidance (`README.md` and root config)

If conflict remains unresolved, pause and request clarification before execution.

## 3) Agent Execution Model

Use this flow for all requirement delivery:

`INTAKE -> CONTEXT -> PLAN -> EXECUTE -> VALIDATE -> DOCUMENT -> HANDOFF`

- `INTAKE`: start from `requirements/active/` and confirm acceptance criteria.
- `CONTEXT`: read `rules/` and required `docs/` before edits.
- `PLAN`: choose minimal viable path; identify risks and dependencies.
- `EXECUTE`: implement scoped changes mapped to requirement ID.
- `VALIDATE`: run checks/tests for touched behavior.
- `DOCUMENT`: update docs and requirement status.
- `HANDOFF`: publish concise completion notes and open risks.

## 4) Required Structure

```text
_template/
├── context/
├── docs/
├── requirements/
│   ├── backlog/
│   ├── active/
│   └── completed/
└── rules/
```

## 5) New Initiative Bootstrap

1. Copy `_template` to `<initiative-name>`.
2. Create `rules/AGENTS.md` for initiative-specific constraints.
3. Add `docs/00-START-HERE.md` and `docs/IMPLEMENTATION-MASTER.md`.
4. Add first stories under `requirements/backlog/`.
5. Move stories to `active/` only when implementation-ready.
