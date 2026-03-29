# Salesforce Lab — Domain Rules

These rules apply to every initiative under `projects/salesforce-lab/initiatives/`.

They inherit from `CORE_RULES.md` and may only add stricter constraints — never weaker ones.

---

## Layer Context

- Layer: Domain
- Inherits: `CORE_RULES.md`
- Overridden by: individual initiative `rules/AGENTS.md`

---

## Salesforce-Specific Constraints

- All Salesforce metadata changes must go through versioned deployment artifacts (`package.xml` or equivalent).
- Never hard-code object or field API names — always verify against `force-app/main/default/objects/` or the initiative data model doc.
- Salesforce org authentication must use named credentials or environment-scoped aliases. No inline credentials.
- All Apex and LWC changes must include a defined test/validation step before HANDOFF.

---

## Domain Execution Additions

In addition to the core `INTAKE → CONTEXT → PLAN → EXECUTE → VALIDATE → DOCUMENT → HANDOFF` lifecycle:

- Before EXECUTE: confirm target Salesforce org alias and confirm it is not a production org unless explicitly authorized.
- Before HANDOFF: confirm deployment artifact is updated and deployment is reversible.

---

## Domain Pre-flight Requirements

Before any Salesforce initiative task begins, verify:

- Initiative `context/000-initiative-overview.md` exists and is current.
- Initiative `docs/IMPLEMENTATION-MASTER.md` exists.
- At least one file in `requirements/active/`.

If any are missing → stop and request them before proceeding.
