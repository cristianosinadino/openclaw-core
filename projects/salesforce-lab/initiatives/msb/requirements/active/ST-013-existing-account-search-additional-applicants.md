# ST-013: Existing Account Search for Additional Applicants

**Story ID**: ST-013  
**Work Item**: LWC-013, SVC-013  
**Status**: Proposed  
**Created**: 2026-03-02  
**Last Updated**: 2026-03-02

## JIRA Story Mapping

| JIRA Story | Title | Status | Link |
|------------|-------|--------|------|
| TBD | Additional Applicants – Existing Account search & prefill | Proposed | TBD |

> **Relation to ST-004:** This story refines the “Additional Applicants” future work in ST-004 (typeahead search and ACR creation) by defining focused requirements for reusing **existing Person Accounts and Business Accounts** in the `daoAdditionalApplicants` step.

---

## Story Overview

**As a** Banker User adding additional applicants to an application  
**I want** to search for and select an existing Person Account (for individuals) or Business Account (for organizational applicants) in the Additional Applicants step  
**So that** I can quickly reuse accurate, KYC-compliant customer data instead of re-entering it manually, while still allowing new applicants when needed.

---

## Acceptance Criteria

- [ ] **AC1 – Individual tab: search existing Person Accounts**
  - On the **Individual** tab of `daoAdditionalApplicants`, the form exposes a search input (e.g. record picker) labeled **“Search Existing Person Account”**.
  - Search results only include `Account` records where `IsPersonAccount = true`, respecting existing org sharing and FLS.
  - Results show at least **Name**, **Primary Phone**, and **Primary Email** (or similar) so bankers can disambiguate.

- [ ] **AC2 – Business tab: search existing Business Accounts**
  - On the **Business** tab of `daoAdditionalApplicants`, the form exposes a search input labeled **“Search Existing Business Account”**.
  - Search results only include `Account` records where `IsPersonAccount = false` (business accounts), optionally filtered to relevant record types if configured in the org.
  - Results show **Legal Business Name**, **Doing Business As (DBA)**, and **Business Phone** (or similar) for disambiguation.

- [ ] **AC3 – Individual prefill mapping (Person Account → additional applicant)**
  - When the banker selects an existing Person Account on the **Individual** tab:
    - The additional applicant form is **auto-populated** using the same mapping as `DaoWizardDataService.buildApplicantFromPersonAccount` (subject to FLS and sharing), including:
      - Name information (salutation, first, last, suffix where applicable).
      - Tax ID and Tax ID Type (when present and the org’s CIP rules allow re-use).
      - **Primary Email** and **Primary Phone** from the Person Account.
      - Physical / mailing address using the ST-012 fields (`physicalStreetLine1/2`, `physicalCity/State/PostalCode/Country`, `mailing*`, `mailingSameAsPhysical`) derived from the Person Account billing/mailing address.
    - The banker can still edit any prefilled field before saving the additional applicant.

- [ ] **AC4 – Business prefill mapping (Business Account → additional business applicant)**
  - When the banker selects an existing Business Account on the **Business** tab:
    - The additional **Business applicant** sub-form is auto-populated using the same mapping as the Business Details step (`daoBusinessDetails` / `DaoWizardDataService`), including at minimum:
      - `businessName`, `dbaName`, `businessType`, `taxId`, `dateEstablished`, `stateOfIncorporation` (where present on the Account / Applicant record).
      - `primaryEmail`, `primaryPhone`, and any configured “business” email/phone custom fields (e.g. `Business_Email__c`, `Business_Phone__c`, `Business_Mobile_Phone__c`).
      - Business physical and mailing address, mapped into the ST-012 fields (`businessStreetLine1/2`, `businessCity/State/PostalCode/Country`, `mailing*`, `mailingSameAsPhysical`).
    - The banker can override any of the prefilled values prior to saving.

- [ ] **AC5 – New vs existing applicants, and clearing selection**
  - Search is **optional**: bankers can still create new additional applicants by leaving search empty and entering data manually.
  - When a search result is selected:
    - The component visibly indicates that the applicant is **linked to an existing Account** (e.g. an icon or helper text with the Account name and link).
  - When the banker clears the selection (e.g. via an “X” in the picker or “Clear selection” link):
    - The Account link is removed.
    - The form remains with the last field values (no silent wipe), but subsequent save is treated as a **new** applicant (no Account linkage) unless another existing Account is selected.

- [ ] **AC6 – Persistence & Account linkage semantics**
  - For **existing Person Accounts**:
    - The additional **Applicant** record uses `Type = 'Individual'` and stores a reference to the Person Account via `Applicant.AccountId`.
    - No new Person Account is created for that additional applicant.
    - An `AccountContactRelation` (or equivalent relationship pattern defined in ST-004) is created/updated to link the Person Account back to the primary Business Account for ownership/relationship tracking, consistent with ST-004 Additional Applicants design.
  - For **existing Business Accounts**:
    - The additional Applicant record uses `Type = 'Organization'` and `Applicant.AccountId` is set to the selected Business Account Id.
    - No duplicate Business Account is created.
  - For **new** additional applicants (no selection made):
    - Behavior remains as defined in ST-004: create new Applicant + PersonAccount (and ACR) as specified there.

- [ ] **AC7 – Validation & PO Box rules compatibility**
  - Existing validation on the `daoAdditionalApplicants` step (including ST-012 physical vs mailing and PO Box handling) continues to apply after prefill.
  - If a prefilled mailing address from the existing Account is a PO Box, the wizard still enforces the “physical address required” rule for the additional applicant before allowing Next/Save.

- [ ] **AC8 – Resume & edit behavior**
  - When resuming an application with additional applicants that were **linked to existing Accounts**, the `daoAdditionalApplicants` UI:
    - Shows the applicant rows as usual, and
    - When opening an applicant in the edit modal, shows the linked Account in the search input (so the banker can see and, if needed, clear or change the link).
  - Editing fields does **not** automatically break the Account link; clearing or changing the selection is the explicit control for changing linkage.

- [ ] **AC9 – Auditability & security**
  - All lookups and prefill operations respect org-level sharing & FLS; bankers only see Accounts they are allowed to see.
  - The implementation avoids exposing any sensitive fields that are out of scope (e.g. encrypted Tax IDs that shouldn’t be displayed in clear text).

---

## Recommended Approach

### 1. UI – Search & selection patterns in `daoAdditionalApplicants`

- Reuse the existing lookup/record-picker patterns already in the wizard (`lightning-record-picker` usage in `daoBusinessDetails` and NAICS Code search) to provide:
  - A Person Account search input on the **Individual** tab.
  - A Business Account search input on the **Business** tab.
- Apply filters:
  - Individual tab: `Account` where `IsPersonAccount = true`.
  - Business tab: `Account` where `IsPersonAccount = false` (and optional record type filters if required by MSB).
- Surface minimal but useful columns in the result template (name, DBA, phone, email), leaning on standard record picker display if possible.

### 2. Mapping logic – reuse DataService patterns

- For Individuals:
  - Reuse or factor out the existing `buildApplicantFromPersonAccount(Account)` logic in `DaoWizardDataService` so we don’t duplicate mapping rules.
  - Expose a new Apex method (e.g. `getApplicantFromPersonAccount(Id accountId)`) that returns an `ApplicantInfoDTO` for the selected Account.
- For Business applicants:
  - Reuse the same mapping used by the Business Details step (from business Account/Applicant into `BusinessInfoDTO` / `ApplicantInfoDTO`), exposed via a new Apex method (e.g. `getBusinessApplicantFromAccount(Id accountId)`).
- In `daoAdditionalApplicants`, when a record is selected in the picker:
  - Call the appropriate Apex method.
  - Merge the returned DTO into the current applicant model, preserving any transient UI-only fields.

### 3. Persistence – existing vs new applicant flows

- Extend `DaoWizardPersistenceService` additional applicants handler to:
  - Accept an optional `existingAccountId` (or equivalent) for each applicant in the payload.
  - When present:
    - Set `Applicant.AccountId` to that Id.
    - Skip PersonAccount/Account creation for the additional applicant.
    - Ensure creation or update of the relevant `AccountContactRelation` (or equivalent link) between the primary Business Account and the existing Account.
  - When absent:
    - Preserve the current behavior from ST-004: create Applicant + PersonAccount + ACR.

### 4. DataService – resume behavior

- Extend `DaoWizardDataService` DTOs for additional applicants to carry:
  - The linked Account Id.
  - A subset of Account display fields (e.g. name, DBA) so the UI can show the current link without another roundtrip.
- When building DTOs for resume:
  - Populate these fields when `Applicant.AccountId` is present.
  - Allow the LWC to initialize the record picker with the existing selection.

### 5. Error handling & UX

- When an Account becomes inaccessible between sessions (e.g. permission change), the UI should:
  - Gracefully fall back to showing a warning and treat the applicant as “new” (no Account link), **without** blocking the user from editing/saving.
- Log Apex errors with enough context (applicant index, Account Id) but avoid logging PII.

---

## Tasks and Sub-Tasks

### Phase 1: UI – Search and Prefill

- [ ] **1.1** Add Person Account search input to Individual tab in `daoAdditionalApplicants`.
- [ ] **1.2** Add Business Account search input to Business tab in `daoAdditionalApplicants`.
- [ ] **1.3** Configure filters and display fields for each search.
- [ ] **1.4** Wire selection events to client-side handlers that call new Apex methods and merge DTO data into the current applicant model.
- [ ] **1.5** Add clear/change-selection affordances and linked Account indicator in the UI.

### Phase 2: Apex – Mapping and Persistence

- [ ] **2.1** Refactor `DaoWizardDataService` mapping for PersonAccount → `ApplicantInfoDTO` into a reusable Apex method callable from LWCs.
- [ ] **2.2** Implement analogous mapping for Business Account → additional Business applicant DTO.
- [ ] **2.3** Extend `DaoWizardPersistenceService` for additional applicants to:
  - Accept `existingAccountId` (and type, if needed) per applicant.
  - Use `existingAccountId` to set `Applicant.AccountId` and skip account creation.
  - Create/update `AccountContactRelation` (or equivalent) according to ST-004 design.
- [ ] **2.4** Extend DataService DTOs and SOQL to support resume/edit with existing Account links.

### Phase 3: Validation, Security, and Compatibility

- [ ] **3.1** Ensure new flows respect existing ST-012 validation (physical vs mailing, PO Box handling).
- [ ] **3.2** Confirm no new required fields are introduced; additional applicants can still be created without selecting an existing Account.
- [ ] **3.3** Enforce CRUD/FLS and sharing checks on all Account and Applicant queries (use `WITH USER_MODE` where appropriate).
- [ ] **3.4** Add unit tests for new Apex mappings and persistence logic for:
  - Existing PersonAccount-linked additional applicant.
  - Existing Business Account-linked additional applicant.
  - New applicants (no link) – regression tests.

### Phase 4: QA and UAT

- [ ] **4.1** UI tests: search, select, clear, and re-select Accounts on both tabs.
- [ ] **4.2** Regression tests: ensure manual entry still works as before.
- [ ] **4.3** Resume tests: verify existing Account selections persist across Save & Exit.
- [ ] **4.4** Permissions tests: verify that users without access to some Accounts do not see them in search and can still add applicants.

---

## Objects and Relationships (Context)

- **Applicant** – captures both business and individual applicants; stores `AccountId` when linked to an existing Account.
- **Account (Business)** – primary business entity; can be selected on Business tab as an additional organizational applicant and via the Business Details step (ST-004).
- **Account (PersonAccount)** – represents individuals; can be selected on Individual tab as an additional applicant.
- **AccountContactRelation** (or equivalent) – maintains the relationship between the primary Business Account and additional Person Accounts, used for beneficial ownership and relationship tracking as outlined in ST-004.

---

## Test Plan (High Level)

- **Unit Tests (Apex)**
  - PersonAccount mapping method: full field coverage, null/partial data, and FLS-aware tests.
  - Business Account mapping method: same as above.
  - Additional applicants persistence: create/update with and without `existingAccountId`.

- **LWC Jest / UI Tests (if used)**
  - Record picker renders with correct filters on both tabs.
  - Selection triggers Apex call and pre-populates fields.
  - Clear selection removes Account link but keeps field values.

- **Integration / UAT**
  - Full end-to-end flows:
    - Add additional individual from existing PersonAccount.
    - Add additional individual as new PersonAccount.
    - Add additional business applicant from existing Business Account.
    - Resume application and edit linked applicants.

---

## Toggle / Rollback Considerations

- **Feature toggle (optional):**
  - Consider gating the existing-account search behind a metadata or custom setting flag so the feature can be turned off without redeploying.
- **Rollback plan:**
  - If issues are found, revert the LWC and Apex changes that:
    - Add the search UI.
    - Introduce new Apex mapping and persistence paths.
  - Since this story does **not** add new fields or objects, rollback is code-only: existing additional applicant flows (manual entry + account creation) continue to function as defined in ST-004.

