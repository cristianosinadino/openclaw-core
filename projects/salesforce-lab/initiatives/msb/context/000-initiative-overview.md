# 000 Initiative Overview — Main Street Bank (MSB)

## Identity

- Initiative: `msb`
- Domain: `salesforce-lab`
- Layer: Initiative
- Client: Main Street Bank
- Org alias: `msb-sbox`

## Purpose

Implement a Deposit Account Opening (DAO) integration for Main Street Bank using Salesforce Financial Services Cloud (FSC).

Ingest application data and create/update Salesforce records for:
- Business and Person Accounts
- Application Forms
- Applicants
- Products
- Due Diligence
- Financial Accounts

## Rule Inheritance

This initiative follows the full rule stack:

1. `CORE_RULES.md` — baseline
2. `projects/salesforce-lab/rules/AGENTS.md` — Salesforce domain constraints
3. `initiatives/msb/rules/AGENTS.md` — MSB-specific constraints (highest precedence)

## Status

- Active requirements: 9
- Completed requirements: 3
- Backlog: 2

See `context/001-requirements-index.md` for full breakdown.

## Key Artifacts

| Artifact | Path |
|---|---|
| Agent entry point | `rules/AGENTS.md` |
| Implementation reference | `docs/IMPLEMENTATION-MASTER.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Data model | `docs/data-model.md` |
| Active requirements | `requirements/active/` |
| Architecture decisions | `docs/architecture-decisions/` |

## Pre-flight Validation

Before executing any task in this initiative, confirm:

- [ ] This file (`000-initiative-overview.md`) exists and is current
- [ ] `rules/AGENTS.md` has been read
- [ ] At least one active requirement exists in `requirements/active/`
- [ ] `docs/IMPLEMENTATION-MASTER.md` has been reviewed for current task scope
