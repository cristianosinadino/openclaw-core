<!-- 
🔴 AI AGENTS: READ FIRST - /docs/01-foundation/data-model.md for correct object names
✅ Correct: ApplicationForm, Applicant, Account (Business), FinancialAccount
❌ Wrong: Application__c, Applicant__c, Loan__c, Business_Relationship__c
-->

# ST-001: Wizard Foundation (CMDT + Container/Router + Navigation)

**Story ID**: ST-001  
**Work Item**: LWC-001, SVC-001, DM-001  
**Status**: Completed  
**Created**: 2025-10-24  
**Last Updated**: 2025-11-11

## 🎫 JIRA Story Mapping

| JIRA Story | Title | Status | Link |
|------------|-------|--------|------|
| MSB-18 | Wizard Foundation - CMDT Orchestration | Completed | [View Story](https://zennify.atlassian.net/browse/MSB-18) |
| MSB-21 | Wizard Container & Navigation | Completed | [View Story](https://zennify.atlassian.net/browse/MSB-21) |

> **Note**: Use the JIRA links above for detailed acceptance criteria, comments, and status updates. This document provides technical implementation details.

---

## 📋 Story Overview

**As a** Salesforce user completing Deposit Account Opening (DAO)  
**I want** a multi-step guided wizard that renders steps in the correct order and validates input  
**So that** I can complete applications consistently with proper navigation, validation, and orchestration

---

## 🎯 Acceptance Criteria

- [ ] CMDT exists to orchestrate wizard steps
  - `Wizard_Step__mdt` with fields: `WizardApiName__c`, `Order__c`, `ComponentBundle__c`, `StepLabel__c`, `ValidatorClasses__c`, `Skippable__c`, `HelpText__c`
  - At least 3 records for a sample wizard (e.g., DAO_Business_InBranch: Applicant, Product, Review)
- [ ] Container LWC renders a progress indicator and active step via a router child
  - Container: `daoWizardContainer`
  - Router: `daoWizardStepRouter`
  - Progress shows step labels from CMDT (`StepLabel__c` or DeveloperName)
- [ ] Navigation implemented: Previous, Next, Save & Exit
  - Next triggers client-side validate from step only (no server-side validators in Iteration 1)
  - Save & Exit emits an event with current step
- [ ] On Next, persist data via Apex upsert for the active step and surface any DML/CRUD/FLS errors to the UI
- [ ] Conditional rendering of child LWCs works via router
  - Router chooses child by `ComponentBundle__c` and exposes `validate()`
- [ ] Step sequence honors CMDT `Order__c`
- [ ] Supporting Apex implemented
  - `WizardConfigService.getSteps(wizardApiName)` (cacheable) returns ordered DTOs
  - `WizardPersistenceService.upsertStep(applicationId, stepDeveloperName, payload)` persists step data with CRUD/FLS checks
- [ ] Unit tests ≥85% coverage on Apex
- [ ] Deployed to `msb-sbox` and verified in App Builder

---

## 🛠️ Tasks and Sub-Tasks

1. [x] Define Custom Metadata Type `Wizard_Step__mdt`
   - [x] 1.1 Create CMDT object metadata with required fields (`WizardApiName__c`, `Order__c`, `ComponentBundle__c`, `StepLabel__c`, `ValidatorClasses__c`, `Skippable__c`, `HelpText__c`)
   - [x] 1.2 Add sample records for `DAO_Business_InBranch` (Applicant, Product, Review)
   - [x] 1.3 Add CMDT to `package.xml` (or ensure wildcard covers CMDT) and deploy
   - [x] 1.4 Verify via SOQL that records are retrievable and ordered by `Order__c`

2. [x] Implement Apex: `WizardConfigService`
   - [x] 2.1 Create `WizardStepDTO` and `getSteps(wizardApiName)` with `@AuraEnabled(cacheable=true)`
   - [x] 2.2 SOQL orders by `Order__c`; maps fields to DTO; returns list
   - [x] 2.3 Unit tests for ordering, labeling defaulting, and null/blank inputs

3. [x] Implement Apex: `WizardPersistenceService`
   - [x] 3.1 Implement `upsertStep(applicationId, stepDeveloperName, payload)`
   - [x] 3.2 Enforce CRUD/FLS and return structured DML errors (code/message/fieldApiName)
   - [x] 3.3 Unit tests for success and failure paths (CRUD/FLS failure, DML exceptions)

4. [x] Scaffold LWCs (container, router, steps)
   - [x] 4.1 `daoWizardContainer` with progress indicator, event handlers, `lwc:ref` access to child
   - [x] 4.2 `daoWizardStepRouter` with explicit conditional branches per `ComponentBundle__c` and `@api validate()` pass-through
   - [x] 4.3 Minimal step shells: `applicantDetails`, `productSelection`, `reviewAndSubmit` with `validate()` and `payloadchange`

5. [x] Implement navigation & validation wiring
   - [x] 5.1 Previous/Next handlers, Save & Exit event
   - [x] 5.2 Client-side validation by invoking child `validate()`
   - [x] 5.3 Persist on Next via `WizardPersistenceService.upsertStep(...)` and surface DML/CRUD/FLS errors

6. [x] Sequence and progress UI
   - [x] 6.1 Use `WizardConfigService.getSteps` results to set order and labels
   - [x] 6.2 Progress indicator reflects current and upcoming steps

7. [x] App Builder wiring
   - [x] 7.1 Expose container to App Page; set `wizardApiName`
   - [x] 7.2 Verify rendering and step transitions in org

8. [x] Documentation & notes
   - [x] 8.1 Update `docs/04-implementation/session-notes/` with progress and lessons
   - [x] 8.2 Ensure `/examples/` remain in sync with implemented pattern

9. [x] Deployment & verification
   - [x] 9.1 Update `package.xml` as needed
   - [x] 9.2 Deploy to `msb-sbox` and validate in UI

---

## 🔧 Technical Implementation

### Objects Involved
- ApplicationForm (FSC) – downstream orchestration target (no schema changes in this story)
- Custom Metadata Types – `Wizard_Step__mdt`

### Fields Required (Wizard_Step__mdt)
- `WizardApiName__c` (Text, Required)
- `Order__c` (Number, Required)
- `ComponentBundle__c` (Text, Required)
- `StepLabel__c` (Text)
- `ValidatorClasses__c` (Text)
- `Skippable__c` (Checkbox, default false)
- `HelpText__c` (Long Text)

### Apex Classes
- `WizardConfigService.cls`
- `WizardValidationService.cls`
- `OfacNameScreeningValidator.cls` (example stub)
- Tests: `WizardConfigServiceTest.cls`, `WizardValidationServiceTest.cls`, `OfacNameScreeningValidatorTest.cls`

### LWC Components
- `daoWizardContainer` (container: progress, routing, navigation, save/exit)
- `daoWizardStepRouter` (router: conditional rendering, pass-through `validate()`)
- Step examples/scaffolds: `applicantDetails`, `productSelection`, `reviewAndSubmit` (minimal shells with `validate()` and `payloadchange`)

### Notes
- Use `@AuraEnabled(cacheable=true)` for `getSteps` (supports `@wire` in LWC)
- LWC will be hosted in a Tab, and it will take a recordId as a parameter. The tab can be hosted both on the Opportunity or ApplicationForm record page.
- Prefer imperative Apex for validate/mutation calls
- Router branches are explicit `<template if:true>` blocks; can be code-generated later

---

## 🧪 Testing Requirements

- [ ] Apex unit tests ≥85% coverage across new classes
- [ ] Negative tests for validator resolution (class not found / wrong type)
- [ ] LWC tests for navigation state and router rendering (at least smoke tests)

---

## 📦 Deployment

- [ ] Add CMDT object/records, Apex classes, and LWCs to [package.xml](cci:7://file:///Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/package.xml:0:0-0:0)
- [ ] Deploy to `msb-sbox`
- [ ] Verify container on an App Page with `wizardApiName = DAO_Business_InBranch`

---

## 📝 Implementation Notes

- Examples for CMDT, Apex services, and LWCs are available under [/examples/](cci:7://file:///Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/examples:0:0-0:0)
- ADR reference: [docs/04-implementation/architecture-decisions/ADR-0001-lwc-architecture.md](cci:7://file:///Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/docs/04-implementation/architecture-decisions/ADR-0001-lwc-architecture.md:0:0-0:0)

---

## ✅ Definition of Done

- [ ] CMDT defined and sample records in place
- [ ] Container + Router LWCs functional with Next/Prev/Save & Exit
- [ ] Router renders correct child by `ComponentBundle__c` and honors `Order__c`
- [ ] Server validators invoked from CMDT list
- [ ] Tests and deployment complete
- [ ] Session notes added under [docs/04-implementation/session-notes/](cci:7://file:///Users/cristianosinadino/Workspace/Salesforce/Pro/zennify/msb/docs/04-implementation/session-notes:0:0-0:0)

---

**Assigned To**: [Developer Name]  
**Related Stories**: ST-002 (Persist Application Data), ST-003 (Pre-populate Wizard Data)