# ST-012: PO Box Handling – Require Physical Address When Mailing Is PO Box

**Story ID**: ST-012  
**Work Item**: LWC-012, SVC-012, OBJ-012  
**Status**: Proposed  
**Created**: 2026-02-04  
**Last Updated**: 2026-02-04

## JIRA Story Mapping

| JIRA Story | Title | Status | Link |
|------------|-------|--------|------|
| TBD | PO Box handling – Physical address required when mailing is PO Box | Proposed | TBD |

---

## Story Overview

**As a** Banker User capturing applicant address information  
**I want** the wizard to require a physical (street) address when the mailing address is a PO Box  
**So that** compliance is met (mailing may be PO Box, but a physical address is required) while still allowing PO Box as mailing address.

---

## Requirement (Source)

**17. PO Box Handling**

- If **Mailing Address = PO Box** → **Require Physical Address**.
- **Suggested approach:**
  - Capture **Physical first**.
  - **Checkbox:** “Mailing same as Physical”.
  - **Validation rule** for PO Box detection.

**Discussion context (Michelle):** Mailing address may be a PO Box, but compliance requires a physical address. The system must detect when mailing is a PO Box and require the applicant to provide a physical address.

---

## Acceptance Criteria

- [ ] **AC1** Applicant (primary and additional individual applicants) can enter a **Physical Address** (street line 1, line 2, city, state, postal code, country) in addition to Mailing Address.
- [ ] **AC2** **Physical Address** is captured **before** or in the same step as Mailing Address, with a **“Mailing same as Physical”** checkbox. When checked, Mailing is pre-filled from Physical and can be locked or editable; when unchecked, Mailing is entered separately.
- [ ] **AC3** **PO Box detection:** The system treats mailing as a PO Box when street line 1 (or line 2) matches a defined pattern (e.g. “PO Box”, “P.O. Box”, “P O Box”, “Post Office Box”, “POBox” with optional number/suite). Detection is case-insensitive and tolerant of common abbreviations.
- [ ] **AC4** **Validation:** When mailing address is detected as a PO Box, the step cannot be completed unless a **valid Physical Address** is provided (all required physical fields populated and Physical address is **not** itself a PO Box). “Mailing same as Physical” checked with a non–PO Box physical satisfies the rule.
- [ ] **AC5** Validation runs in **daoApplicantDetails** (primary) and **daoAdditionalApplicants** (each individual applicant) before Next/Save, and in **DaoWizardPersistenceService** before persisting, so API or bypass cannot submit without physical when mailing is PO Box.
- [ ] **AC6** Clear error message when mailing is PO Box and physical is missing or invalid (e.g. “Mailing address is a PO Box. Please provide a physical (street) address.”).
- [ ] **AC7** Physical address is persisted to Applicant (new or existing Physical Address fields); resume and existing-account flows load and display both Mailing and Physical.

---

## Recommended Approach

### 1. Data model – Physical Address on Applicant

- **Current state:** Applicant has **Mailing** fields only (e.g. `Mailing_Street_Line_1__c`, `Mailing_Street_Line_2__c`, `Mailing_City__c`, `Mailing_State__c`, `Mailing_Postal_Code__c`, `Mailing_Country__c`). No Physical address fields in repo.
- **Recommendation:** Add **Physical Address** fields on Applicant (e.g. `Physical_Street_Line_1__c`, `Physical_Street_Line_2__c`, `Physical_City__c`, `Physical_State__c`, `Physical_Postal_Code__c`, `Physical_Country__c`) and a checkbox `Mailing_Different_Than_Physical_Address__c` (when true, mailing differs from physical). If FSC/org already has a standard or custom “Physical Address” compound or set of fields, use those instead.
- **Scope:** Physical address is required only in the **applicant** flow (primary applicant and additional individual applicants). Business address (daoBusinessDetails) is out of scope unless MSB explicitly requires physical vs mailing for the business entity as well.

### 2. UI order and “Mailing same as Physical”

- **Capture Physical first:** In daoApplicantDetails and daoAdditionalApplicants, present **Physical Address** section **above** Mailing Address. Use the same field set as mailing (street 1, street 2, city, state, postal code, country). Optionally use individual `lightning-input` / `lightning-combobox` fields (instead of `lightning-input-address`) so that:
  - Address Line 2 can be placed between Street and City if desired (see “Address Line 2” discussion in project notes).
  - Street lines are available for PO Box detection without parsing a compound value.
- **Checkbox “Mailing same as Physical”:** Below Physical Address, add a checkbox. When **checked:** copy Physical → Mailing (and optionally show Mailing as read-only or hide it); when **unchecked:** show Mailing Address section for separate entry. On load/resume, set checkbox from stored value and sync or show mailing accordingly.
- **Mailing section:** When checkbox is unchecked, keep current Mailing Address UI (or replace with same individual-field layout for consistency and PO Box detection). When checked, either hide mailing or show it read-only with physical values.

### 3. PO Box detection

- **Single source of truth:** Implement a small helper used by LWC and Apex: `isPoBox(streetLine1, streetLine2)`.
- **Logic:** Normalize (trim, collapse spaces, optional lowercase). Return true if either line matches a pattern such as:
  - Starts with or equals (allowing optional digits/suffix): `po box`, `p.o. box`, `p o box`, `post office box`, `pobox`.
- **Apex:** Static method e.g. `DaoWizardValidationUtil.isMailingPoBox(String streetLine1, String streetLine2)`. Use for server-side validation and, if needed, when building DTOs for resume.
- **LWC:** Same logic in JS (e.g. `isPoBox(streetLine1, streetLine2)`) for client-side validation so the user gets immediate feedback. Consider an Apex method that returns “is PO Box” for a given mailing payload so the rule can be tuned server-side without redeploying LWC.

### 4. Validation rule

- **Rule:** If mailing is a PO Box (using the helper above), then:
  - Physical address is **required**: all required physical fields must be populated.
  - Physical address must **not** be a PO Box (run same `isPoBox` on physical street lines).
- **When “Mailing same as Physical” is checked:** Mailing equals Physical; if Physical is not a PO Box, mailing is not a PO Box, so no extra requirement. If for some reason Physical were a PO Box, validation would fail (physical cannot be PO Box when it’s the only address).
- **When “Mailing same as Physical” is unchecked:** Run PO Box detection on mailing. If PO Box, require full Physical and that Physical is not PO Box.
- **Place of validation:** daoApplicantDetails `validate()` (or equivalent); daoAdditionalApplicants `validate()` per applicant; DaoWizardPersistenceService before saving applicant + addresses. Return structured error (e.g. `PO_BOX_REQUIRES_PHYSICAL`) and message per AC6.

### 5. Persistence and resume

- **Persistence:** Map Physical Address fields from payload to Applicant. Save `Mailing_Different_Than_Physical_Address__c` (true when mailing differs). When “Mailing same as Physical” was checked, application may store only Physical and set Mailing = Physical at save time, or store both; either way, resume must show Physical and Mailing (and checkbox) correctly.
- **Resume:** DataService loads Applicant; populate Physical and Mailing in DTO. If `Mailing_Different_Than_Physical_Address__c` is false or null, pre-fill mailing from physical in the UI and set "same as physical" (checkbox unchecked by default).
- **Permission set:** Grant FLS on new Physical fields and checkbox for DAO_Wizard_Access.

### 6. Relation to “Address Line 2” placement

- **Optional enhancement:** If the project implements the earlier “Address Line 2 between Street and City” change (ST or backlog), use the **same** individual-field layout for both Physical and Mailing in this story so that:
  - PO Box detection has explicit Street Line 1 / Line 2.
  - Ordering (Street → Address Line 2 → City) is consistent.  
  If that change is deferred, ST-012 can still be implemented with the current `lightning-input-address` + separate Address Line 2 for Mailing, and add a separate Physical section with the same structure; PO Box detection would use the mailing street value(s) from the component and any line 2 field.

### 7. Testing

- **Unit (Apex):** `isPoBox` with various inputs (PO Box, P.O. Box, 123 Main St, empty). PersistenceService: mailing is PO Box and physical missing → error; mailing PO Box and physical provided and not PO Box → success; “Mailing same as Physical” checked with non–PO Box physical → success.
- **Unit (LWC):** Validation blocks Next/Save when mailing is PO Box and physical empty or physical is PO Box; allows completion when physical is valid; checkbox copies physical to mailing and validates correctly.
- **Integration:** Run wizard with mailing = PO Box only → error; add physical (non–PO Box) → success; check “Mailing same as Physical” and complete → success; resume and edit → physical and mailing and checkbox behave correctly.

---

## Tasks and Sub-Tasks

### Phase 1: Data model and shared PO Box logic

- [ ] 1.1 Add **Physical Address** fields on Applicant (Street 1, Street 2, City, State, Postal Code, Country) and **Mailing_Different_Than_Physical_Address__c** (checkbox), or document use of existing org fields.
- [ ] 1.2 Add **DaoWizardValidationUtil.isPoBox(String streetLine1, String streetLine2)** (or equivalent) in Apex; define pattern list (PO Box, P.O. Box, etc.); unit tests.
- [ ] 1.3 Expose optional Apex method for LWC: e.g. `isMailingAddressPoBox(streetLine1, streetLine2)` for consistency.
- [ ] 1.4 Add FLS for new Applicant fields to DAO_Wizard_Access.

### Phase 2: Applicant Details LWC (primary applicant)

- [ ] 2.1 Add **Physical Address** section above Mailing Address; same fields as mailing (street 1, street 2, city, state, zip, country). Use individual inputs (or lightning-input-address if preferred; ensure street lines available for PO Box check).
- [ ] 2.2 Add **“Mailing same as Physical”** checkbox; when checked, copy Physical → Mailing and optionally show Mailing read-only or hide.
- [ ] 2.3 Implement **isPoBox** in JS (or call Apex) for mailing street lines.
- [ ] 2.4 In **validate():** If mailing is PO Box, require full Physical and that Physical is not PO Box; else show AC6 message and block Next.
- [ ] 2.5 Emit Physical and checkbox in payload; handle prefill/resume (set Physical and Mailing and checkbox from DTO).

### Phase 3: Additional Applicants LWC (individual applicants)

- [ ] 3.1 Add **Physical Address** section and **“Mailing same as Physical”** checkbox for each individual applicant (same UX as Phase 2).
- [ ] 3.2 Reuse same PO Box detection and validation: when mailing is PO Box, require valid Physical; block Save/Next with AC6 message when invalid.
- [ ] 3.3 Payload and resume: include Physical fields and checkbox per applicant; load from Applicant on resume.

### Phase 4: Persistence and DataService

- [ ] 4.1 **DaoWizardPersistenceService:** Map Physical Address fields and checkbox from payload to Applicant (primary and additional applicants). When “Mailing same as Physical” is true, ensure Mailing is stored same as Physical (or persist both from payload).
- [ ] 4.2 **Validation in PersistenceService:** Before saving applicant, if mailing is PO Box, require physical fields and that physical is not PO Box; return structured error otherwise.
- [ ] 4.3 **DaoWizardDataService:** In Applicant SOQL and DTO mapping, include Physical fields and Mailing_Different_Than_Physical_Address__c; build Physical and Mailing in ApplicantInfoDTO for resume (map checkbox to mailingSameAsPhysical for LWC).

### Phase 5: Documentation and QA

- [ ] 5.1 Document PO Box patterns and validation rule in solution docs.
- [ ] 5.2 QA: Mailing = PO Box without Physical → error; Mailing = PO Box with valid Physical → success; “Mailing same as Physical” checked → success; resume and edit; confirm no regression for non–PO Box mailing.

---

## Reference

- **Applicant address fields:** `Mailing_Street_Line_1__c`, `Mailing_Street_Line_2__c`, `Mailing_City__c`, `Mailing_State__c`, `Mailing_Postal_Code__c`, `Mailing_Country__c`. Physical fields to be added (or use existing org fields).
- **Components:** daoApplicantDetails (primary applicant), daoAdditionalApplicants (individual applicants). Both use mailing address today; no physical address or PO Box handling.
- **Related:** Earlier “Address Line 2 between Street and City” discussion (deferred). ST-012 can be implemented with current address UI; optional later alignment with individual-field layout and Address Line 2 placement.
