# ST-011: Primary vs Secondary ID Categorization and Two-Secondary-IDs Exception

**Story ID**: ST-011  
**Work Item**: LWC-011, SVC-011, CFG-011  
**Status**: Proposed  
**Created**: 2026-02-04  
**Last Updated**: 2026-02-04

## JIRA Story Mapping

| JIRA Story | Title | Status | Link |
|------------|-------|--------|------|
| TBD | Primary/Secondary ID categorization and 1 Primary OR 2 Secondaries validation | Proposed | TBD |

---

## Story Overview

**As a** Banker User completing a Deposit Account Opening application  
**I want** identity document requirements to align with CIP and MSB policy: either one government-issued primary ID or two secondary IDs when a primary is not available  
**So that** applicants who are minors, seniors, disabled, or otherwise without a primary ID (e.g. headshot ID only) can still onboard when they provide two acceptable secondary IDs, without the system applying strict DOB-based senior logic.

---

## Combined Requirements (Source)

### 4. Two Secondary IDs Exception

- Allow applicants to proceed with:
  - **1 Primary ID**, OR
  - **2 Secondary IDs** (for exceptions: minor, senior, disabled, or no primary ID available). Example: Headshot ID.
- Avoid strict DOB-based senior logic.

**Discussion context (Michelle):** CIP requires one government-issued ID, but exceptions exist (e.g. minor without driver’s license, senior citizen, disabled individual, individual without primary ID). The system should accept two secondary IDs in these cases.

### 5. Primary vs Secondary Categorization

- Categorize ID types as **Primary** and **Secondary** to support validation logic that enforces:
  - **1 Primary ID** OR **2 Secondary IDs**.

---

## Acceptance Criteria

- [ ] **AC1** Every identity document type (e.g. Driver License, State ID, Passport, Military ID, Tribal ID, Headshot ID) is classified as either **Primary** or **Secondary** in a single, configurable place.
- [ ] **AC2** For each applicant (Primary Applicant and Additional Applicants), validation allows the step to complete if and only if:
  - The applicant has **at least one Primary ID**, OR
  - The applicant has **at least two Secondary IDs**.
- [ ] **AC3** Validation runs in **daoApplicantDetails** (primary applicant) and **daoAdditionalApplicants** (each individual applicant with identity documents) before “Next”/“Save”; and in **DaoWizardPersistenceService** before persisting identity documents, so API or bypass cannot submit invalid data.
- [ ] **AC4** When the rule is not met, the user sees a clear message (e.g. “Provide one primary ID (e.g. Driver License, Passport) or two secondary IDs (e.g. Headshot ID).”).
- [ ] **AC5** No DOB-based logic is used to change the rule (e.g. no “if over 65, require only 2 secondaries”); the rule is purely “1 Primary OR 2 Secondaries” for all applicants.
- [ ] **AC6** Optional: A “Reason for using secondary IDs” (Minor, Senior, Disabled, No primary ID available) may be captured for audit/compliance; it does not drive validation or DOB-based behavior.
- [ ] **AC7** Existing IdentityDocument model (Applicant → IdentityDocument, IdDocumentType, etc.) is used; categorization is additive (e.g. metadata or mapping from IdDocumentType to Primary/Secondary).

---

## Recommended Approach

### 1. Single source of truth: Primary vs Secondary

- **Recommendation:** Define which **IdDocumentType** (or equivalent) values are **Primary** vs **Secondary** in one place, reused by Apex and LWC.
- **Options:**
  - **A (recommended):** **Custom Metadata Type** (e.g. `ID_Type_Classification__mdt`) with records per ID type: `IdDocumentType__c`, `Classification__c` (Primary | Secondary). Apex queries it; LWC calls an **Apex method** that returns the list of Primary types and/or the classification per type, so the UI and validation use the same rule. New ID types (e.g. Headshot ID) can be added without code deploy.
  - **B (simpler):** **Apex constant** (e.g. `DaoWizardConstants.PRIMARY_ID_TYPES`) and the **same list in LWC** for client-side validation. Server enforces in PersistenceService using the Apex list. ID type values must match exactly (e.g. `Driver License` vs `Driver's License` – standardize in one place).
- **Canonical ID types:** Align with **IdentityDocument.IdDocumentType** (or the picklist used in the wizard). Current wizard options include Driver License, Passport, State ID, Military ID, Tribal ID; add **Headshot ID** (and any other secondaries) to the picklist/options and classify them as Secondary. Primary typically: Driver License, State ID, Passport, Military ID (per MSB/CIP). Secondary: e.g. Tribal ID, Headshot ID, School ID – to be confirmed with MSB.

### 2. Validation logic (same everywhere)

- **Rule:** For a given list of identity documents:
  - Map each document’s type to Primary or Secondary using the shared classification.
  - Count Primary count and Secondary count.
  - **Valid** if `(Primary count >= 1) OR (Secondary count >= 2)`.
  - **Invalid** otherwise (show AC4 message).
- Implement this in:
  - **LWC (daoApplicantDetails):** In `validate()` or before emitting “step complete”, run the rule on `this.identityDocuments`; if invalid, return error and block Next.
  - **LWC (daoAdditionalApplicants):** For each applicant that has identity documents, run the same rule on `applicant.identityDocuments`; if any applicant is invalid, block Save/Next and show which applicant(s) need correction.
  - **Apex (DaoWizardPersistenceService):** Before upserting IdentityDocuments for an applicant, run the same rule on the payload list; if invalid, add a structured error (e.g. `ID_VALIDATION`, message, field `identityDocuments`) and do not save.

### 3. No DOB-based senior logic

- Do **not** use Applicant (or Contact) date of birth to:
  - Classify the applicant as “senior” or “minor” for validation.
  - Change the rule (e.g. “seniors only need 2 secondaries”).
- The rule is **always** “1 Primary OR 2 Secondaries” for every applicant. Exceptions (minor, senior, disabled, no primary available) are reflected by the **user’s choice** to submit 2 Secondary IDs, not by system logic based on age.

### 4. Optional: “Reason for secondary IDs”

- If MSB wants an audit trail when 2 Secondary IDs are used, add an optional field (e.g. on Applicant or on the step payload): “Reason for using secondary IDs” with values such as **Minor**, **Senior**, **Disabled**, **No primary ID available**. This is for reporting/compliance only; it does **not** gate validation and is **not** derived from DOB.

### 5. UI and picklist

- **ID type dropdown:** Ensure both daoApplicantDetails and daoAdditionalApplicants use the **same** list of ID types (and, if using option B, the same Primary/secondary lists as in Apex). Add any new types (e.g. Headshot ID) to the picklist/options and to the Primary vs Secondary mapping.
- **Helper text:** In the Identity Documents section, show short guidance: “Provide one primary ID (e.g. Driver License, Passport) or two secondary IDs (e.g. Headshot ID).”
- **Error message:** When validation fails, use AC4 message and, in Additional Applicants, indicate which applicant(s) do not meet the rule.

### 6. Testing

- **Unit (Apex):** Test PersistenceService: 1 Primary → success; 2 Secondaries → success; 0 IDs → error; 1 Secondary only → error; 2 Primaries → success.
- **Unit (LWC):** Test daoApplicantDetails and daoAdditionalApplicants validation for the same combinations; test that error message appears and Next/Save is blocked when invalid.
- **Integration:** Run wizard with primary applicant having 1 Primary ID; then with 2 Secondary IDs; then with 1 Secondary only (expect error). Repeat for an additional applicant. Confirm no DOB-based behavior.

---

## Tasks and Sub-Tasks

### Phase 1: Define classification and backend

- [ ] 1.1 Define which IdDocumentType values are Primary vs Secondary (with MSB); add any new types (e.g. Headshot ID) to IdentityDocument / picklist if needed.
- [ ] 1.2 Implement single source of truth (Custom Metadata recommended, or Apex constant + LWC list).
- [ ] 1.3 Add Apex helper e.g. `meetsIdRequirement(List<Map<String,Object>> identityDocumentsPayload)` that returns true if (Primary count >= 1) OR (Secondary count >= 2); use shared classification.
- [ ] 1.4 In DaoWizardPersistenceService, before processing identity documents for an applicant, call the helper on the payload; if false, add validation error and do not save. Apply to both primary applicant and additional applicants flows.
- [ ] 1.5 Unit tests for Apex helper and PersistenceService (1 Primary, 2 Secondaries, 0 IDs, 1 Secondary only).

### Phase 2: Applicant Details LWC (primary applicant)

- [ ] 2.1 In daoApplicantDetails, add validation that runs on `this.identityDocuments`: require (1 Primary OR 2 Secondaries) using the same classification as Apex (from Apex method or duplicated list).
- [ ] 2.2 Block “Next” when validation fails; show AC4 message.
- [ ] 2.3 Add helper text in Identity Documents section per section 5 above.
- [ ] 2.4 (Optional) Add “Reason for using secondary IDs” when user has 2 Secondaries and no Primary; store in payload only, no validation change.
- [ ] 2.5 Unit/test: 1 Primary passes; 2 Secondaries pass; 1 Secondary only fails with message.

### Phase 3: Additional Applicants LWC

- [ ] 3.1 In daoAdditionalApplicants, for each applicant with identity documents, run same rule (1 Primary OR 2 Secondaries) in `validate()`.
- [ ] 3.2 When invalid, show which applicant(s) fail and block Save/Update; use same error message as AC4.
- [ ] 3.3 Ensure ID type options (and Primary/secondary list if option B) match daoApplicantDetails and Apex.
- [ ] 3.4 (Optional) “Reason for using secondary IDs” for additional applicants when 2 Secondaries used.
- [ ] 3.5 Unit/test: same combinations as Phase 2 for an additional applicant.

### Phase 4: Documentation and QA

- [ ] 4.1 Document Primary vs Secondary list and rule in solution docs and in this story.
- [ ] 4.2 Confirm with MSB: list of Primary types, list of Secondary types, and whether “Reason for using secondary IDs” is required.
- [ ] 4.3 QA: full wizard with 1 Primary; with 2 Secondaries; with 1 Secondary only (expect error); confirm no DOB-based logic.

---

## Reference

- **Identity documents:** Stored as **IdentityDocument** (FSC) linked to **Applicant** via `Applicant__c`; type in **IdDocumentType**. Wizard payload uses `identityDocuments` (list of objects with `idType`, `idNumber`, dates, etc.).
- **Components:** daoApplicantDetails (primary applicant), daoAdditionalApplicants (additional applicants with identity document modal); DaoWizardPersistenceService (primary and additional applicant persistence, including `processIdentityDocuments`).
- **CIP:** One government-issued ID standard; MSB allows exception of 2 Secondary IDs for minor, senior, disabled, or no primary ID available. No strict DOB-based senior logic.
