# Main Street Bank Salesforce Project — AI Agent Instructions

**Version**: 3.0  
**Last Updated**: 2026-03-11  
**Applies to**: Any AI coding assistant (Cursor, Claude, Copilot, Codex, Windsurf, etc.)

> This is the canonical, IDE-agnostic entry point for all AI agents.  
> Detailed rules live in `docs/rules-global.md`.  
> Full implementation reference lives in `docs/IMPLEMENTATION-MASTER.md`.

---

## Mandatory Read Sequence (every prompt)

Load these files in order before proposing any solution:

1. `docs/IMPLEMENTATION-MASTER.md` — full implementation history, design decisions, component inventory, configuration how-tos  
2. `docs/rules-global.md` — project objective, canonical object/field names, coding standards, SOP  
3. `docs/02-requirements/backlog.md` — active sprint scope and priorities  
4. The specific story file in `docs/02-requirements/` relevant to the current task  
5. `force-app/main/default/objects/` — verify field/object API names before writing any code  
6. The specific LWC and Apex source files the task will touch  

> If any required file is inaccessible, **STOP and ask the user before proceeding**.

---

## Project Overview

Salesforce Financial Services Cloud (FSC) — Deposit Account Opening (DAO) wizard.  
LWC-based step wizard backed by Apex services, Custom Metadata-driven configuration, and fflib patterns.

Key components:
- `daoWizardContainer` / `daoWizardStepRouter` — wizard shell and routing
- `daoBusinessDetails`, `daoApplicantDetails`, `daoAdditionalApplicants` — applicant intake steps
- `daoProductSelection`, `daoFundingAmountModal` — product/account title steps
- `daoReviewAndSubmit` — final review step
- `DaoWizardPersistenceService`, `DaoWizardDataService`, `DaoComplianceRules` — Apex services

Configuration CMDTs: `DAO_Primary_Document__mdt`, `DAO_BusinessType_TaxRule__mdt`, `DAO_ApplicantRoleCompliance__mdt`, `Wizard_Step__mdt`

---

## PR Hygiene

Every code-change response must include:

- **Files read** — paths loaded before writing code
- **Constraints extracted** — bulleted list from docs
- **Design decisions** — what was chosen and why
- **Test plan** — what to verify after deployment
- **Toggle / rollback notes** — how to revert if needed
