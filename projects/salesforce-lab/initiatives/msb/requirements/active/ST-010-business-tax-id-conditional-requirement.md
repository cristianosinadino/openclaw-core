# ST-010: Business Tax ID Conditional Requirement

**Story ID**: ST-010  
**Work Item**: LWC-010, SVC-010  
**Status**: Proposed  
**Created**: 2026-02-04  
**Last Updated**: 2026-02-04

## JIRA Story Mapping

| JIRA Story | Title | Status | Link |
|------------|-------|--------|------|
| TBD | Business Tax ID conditional on Business Type | Proposed | TBD |

---

## Story Overview

**As a** Banker User completing a Deposit Account Opening application for a business  
**I want** Federal Tax ID (EIN) to be required only when the entity type requires it  
**So that** valid onboarding scenarios (e.g. DBA, Trust, Sole Proprietorship) are not blocked by a universal Tax ID requirement, since in some cases the tax identifier is associated with an individual rather than the organization.

---

## Discussion Context

- **Michelle (MSB)** clarified that not all entity types require a Tax ID at the time of onboarding.
- **Examples where Tax ID is not required:** DBA, Trust, Sole Proprietorship. In some cases the tax identifier is associated with an individual rather than the organization.
- **Current behavior:** The system treats Business Tax ID as universally required for all businesses, which would block valid onboarding for these entity types.
- **Final determination:** Make Business Tax ID requirement **conditional based on Business Type**.

---

## Acceptance Criteria

- [ ] **AC1** Federal Tax ID (EIN) is **required** for Business step when Business Type is **not** one of: **DBA**, **Trust**, **Sole Proprietorship**.
- [ ] **AC2** Federal Tax ID (EIN) is **optional** when Business Type is **DBA**, **Trust**, or **Sole Proprietorship** (no validation error if blank).
- [ ] **AC3** Conditional requirement applies in **daoBusinessDetails** (Business step) for both new and existing business account flows.
- [ ] **AC4** Conditional requirement applies in **daoAdditionalApplicants** for **Business** applicant type (same rules as Business step).
- [ ] **AC5** Server-side validation in **DaoWizardPersistenceService** enforces the same rules (required vs optional) so that API or bypass cannot submit invalid data.
- [ ] **AC6** When optional, Tax ID field remains visible and editable; when provided, format validation (9 digits) still applies.
- [ ] **AC7** Picklist API values for Business Type (e.g. `Applicant.BusinessEntityType` / `Account.Business_Type__c`) are used so that label changes do not break logic; exception list is configurable or documented.

---

## Recommended Approach

### 1. Single source of truth for “Tax ID not required” types

- **Recommendation:** Define the list of Business Types for which Tax ID is **not** required in **one place** and reuse everywhere.
- **Options:**
  - **A (recommended):** **Custom Metadata Type** or **Custom Label** holding the comma-separated list (e.g. `DBA,Trust,Sole Proprietorship`). Apex reads it; LWC can call a small **Apex method** that returns whether Tax ID is required for a given business type (or returns the list of optional types). This keeps the rule configurable without code deploys.
  - **B (simpler, less flexible):** **Apex constant** in a single class (e.g. `DaoWizardConstants.BUSINESS_TYPES_TAX_ID_OPTIONAL`) and the **same list duplicated in LWC** for client-side validation. No server call needed for validation; server still enforces in PersistenceService using the same Apex list.
- Use the **API values** of the Business Type picklist (e.g. from `Applicant.BusinessEntityType`), not display labels, so that picklist changes are safe.

### 2. Front-end (LWC)

- **daoBusinessDetails**
  - **Validation:** In `validate()` (or equivalent), require Federal Tax ID only when `businessType` is **not** in the “Tax ID optional” list. When it is in the list, skip the “Federal Tax ID (EIN) is required” check; still run format validation (9 digits) when a value is present.
  - **UI:** Keep the Federal Tax ID field always visible; remove the `required` attribute from the input when Business Type is in the optional list (e.g. `required={isTaxIdRequired}` where `isTaxIdRequired` is a getter that checks `businessType` against the exception list). Optionally show helper text like “Optional for DBA, Trust, Sole Proprietorship” when applicable.
- **daoAdditionalApplicants**
  - For **Business** applicant form only: apply the same rule using `currentApplicant.businessType`. Require Tax ID only when business type is not DBA, Trust, or Sole Proprietorship; when optional, still validate format if provided. Use the same exception list as daoBusinessDetails (either from Apex or duplicated in JS).

### 3. Back-end (Apex)

- **DaoWizardPersistenceService**
  - In the method that persists the **Business** step (e.g. `upsertBusinessStep` or equivalent): before validating/saving, resolve Business Type from the payload. If Business Type is **in** the “Tax ID optional” list, do **not** add an error when `taxId` is blank; if Business Type is **not** in that list, require `taxId` and existing format validation.
  - In the method that persists **Additional Applicants** (business type): apply the same conditional requirement for `taxId` on Business applicants. Reuse a single Apex helper (e.g. `isTaxIdRequiredForBusinessType(String businessType)`) so the rule lives in one place in code.

### 4. Testing

- **Unit (Apex):** Test PersistenceService with Business Type = DBA, Trust, Sole Proprietorship and blank Tax ID (expect success); test with other types and blank Tax ID (expect validation error); test format validation when Tax ID is provided for optional types.
- **Unit (LWC):** Test daoBusinessDetails validation when Business Type is DBA/Trust/Sole Proprietorship (Tax ID optional) vs LLC/Corporation etc. (Tax ID required). Same for daoAdditionalApplicants Business applicant.
- **Integration:** Run through wizard with each exception type (DBA, Trust, Sole Proprietorship) and confirm step can complete without Tax ID; run with e.g. LLC and confirm Tax ID required and format validation still works.

### 5. Edge cases

- **Existing business account:** When pre-filling from Account, Business Type comes from the account; apply the same rule (Tax ID required/optional) so that existing DBAs/Trusts/Sole Props are not forced to enter a Tax ID.
- **Resume:** On resume, Business Type is loaded from Applicant; conditional requirement is applied the same way so behavior is consistent.
- **Picklist value changes:** If MSB adds or renames entity types, only the exception list (metadata/label or constant) and picklist values need to stay in sync; no change to control flow.

---

## Tasks and Sub-Tasks

### Phase 1: Define rule and back-end

- [ ] 1.1 Define “Tax ID optional” list (DBA, Trust, Sole Proprietorship) and where it will live (Custom Metadata / Label vs Apex constant).
- [ ] 1.2 Add Apex helper e.g. `isTaxIdRequiredForBusinessType(String businessType)` and use it in PersistenceService for Business step and for Business applicants in Additional Applicants.
- [ ] 1.3 In PersistenceService Business step persistence: require `taxId` only when `isTaxIdRequiredForBusinessType(businessType)` is true; otherwise allow blank.
- [ ] 1.4 In PersistenceService Additional Applicants persistence: for Type = Business, apply same conditional requirement for `taxId`.
- [ ] 1.5 Unit tests for PersistenceService (optional types vs required types; format validation when provided).

### Phase 2: Business step LWC

- [ ] 2.1 In daoBusinessDetails, add logic (getter or method) so “Tax ID required” is true only when `businessType` is not in the exception list.
- [ ] 2.2 Remove or make conditional the `required` attribute on the Federal Tax ID input based on that logic.
- [ ] 2.3 In `validate()`, require Federal Tax ID only when business type requires it; when optional, still validate 9-digit format if value is present.
- [ ] 2.4 (Optional) Show helper text when Tax ID is optional (e.g. “Optional for DBA, Trust, Sole Proprietorship”).
- [ ] 2.5 Unit/test flow: Business Type DBA/Trust/Sole Proprietorship with blank Tax ID passes; other types with blank Tax ID fail; format validation when value provided.

### Phase 3: Additional Applicants LWC (Business applicants)

- [ ] 3.1 In daoAdditionalApplicants, for Business applicant form, add same “Tax ID required” logic based on `currentApplicant.businessType`.
- [ ] 3.2 Require Tax ID in validation only when business type is not in the exception list; validate format when value is provided.
- [ ] 3.3 (Optional) Reflect optional state in UI (helper text or required indicator).
- [ ] 3.4 Unit/test flow: same as Business step for Business applicant type.

### Phase 4: Documentation and QA

- [ ] 4.1 Document the conditional rule and exception list in solution docs or ST-004/ST-010.
- [ ] 4.2 QA: full wizard with DBA, Trust, Sole Proprietorship (no Tax ID); with LLC/Corp (Tax ID required); resume and existing-account scenarios.

---

## Reference

- **Business Type field:** `Applicant.BusinessEntityType` (FSC standard), `Account.Business_Type__c` (custom). Use same API values for both where applicable.
- **Tax ID field:** `Applicant.SSN_Tax_Id__c` (business and individual); Business step and Business applicants use this for EIN.
- **Related:** ST-004 (Capture Application Details – Business Details step); current implementation has Tax ID universally required in daoBusinessDetails and PersistenceService.
