<!-- 
🔴 AI AGENTS: READ FIRST
- /docs/01-foundation/data-model.md
- /docs/04-implementation/session-notes (especially relationship / applicant notes)

✅ Correct objects: ApplicationForm, Applicant, ApplicationFormProduct, ApplicationProductPartyRole__c, Account (Business & PersonAccount), AccountContactRelation, FinServ__FinancialAccount__c, FinServ__FinancialAccountRole__c
❌ Wrong: Application__c, Relationship__c (unless explicitly defined elsewhere)
-->

## ST-007: Populate Account Contact Relationships and Financial Account Roles

**Story ID**: ST-007  
**Work Item**: SVC-007, LWC-007, DATA-007  
**Status**: Proposed  
**Created**: 2026-01-28  
**Last Updated**: 2026-01-28  

### 🎫 JIRA Story Mapping

| JIRA Story | Title                                                             | Status   | Link |
|------------|-------------------------------------------------------------------|----------|------|
| TBD        | Populate Account Contact Relationships and Financial Account Roles | Proposed | TBD  |

> This requirement defines how we derive AccountContactRelation (ACR) and FinancialAccountRole records from the existing relationship matrix based on `ApplicationProductPartyRole__c`.

---

## 📋 Story Overview

**As a** Salesforce Administrator  
**I want** the system to automatically populate Account Contact Relationships (ACRs) and Financial Account Roles based on the selected relationship matrix  
**So that** all linked entities are displayed correctly on account and financial account record pages for Branch Managers and Operations.

---

## 🎯 Acceptance Criteria

1. **Matrix → ACR + FAR generation**
   - When a relationship between an applicant and a product is created (or updated) in the relationship matrix (backed by `ApplicationProductPartyRole__c`), the system can derive:
     - At least one `AccountContactRelation` between the Business Account and the individual (PersonAccount), and
     - At least one `FinServ__FinancialAccountRole__c` record between the FinancialAccount and the individual.

2. **1:1 role alignment between matrix and FinancialAccountRole**
   - The `Role` picklist used in `ApplicationProductPartyRole__c` and `FinServ__FinancialAccountRole__c` is aligned (same values and semantics).
   - For each `ApplicationProductPartyRole__c` record, the corresponding `FinancialAccountRole` uses the **same** `Role` value.

3. **ACR roles capture broader relationship**
   - ACRs are created or updated so that Branch Managers and Operations can see the enduring relationship between a person and the business (e.g., Owner, Authorized Signer, Beneficial Owner), even when roles differ from product-by-product participation.
   - ACR role multi-select values may not be a 1:1 mirror of the matrix/FAR role, but always reflect at least the appropriate owner/signer/beneficial-owner semantics.

4. **PersonAccount reuse**
   - If a PersonAccount already exists for a given applicant (per agreed matching rules), it is reused.
   - If not, a new PersonAccount is created for each individual applicant as part of the materialization process.

5. **No duplicate ACR / FAR records**
   - Re-running the sync process (e.g., editing the matrix, re-submitting the application) does not create duplicate ACRs or FinancialAccountRole records for the same person, account, product, and role combination.

6. **Visibility**
   - Branch Manager and Operations profiles/permission sets can see:
     - ACRs on the Business Account related list, and
     - FinancialAccountRoles on the FinancialAccount related list.

7. **Application Summary reflects relationships**
   - The Application Summary view (or equivalent wizard summary step) reflects the same relationship and role information that is ultimately materialized as ACRs and FinancialAccountRoles.

---

## 🧱 Solution Design (for JIRA)

> **Copy/paste this section into the “Solution Design” field in JIRA.**

### 1. Role Model & Canonical Source

1. Use `ApplicationProductPartyRole__c` as the **canonical source** for the onboarding relationship matrix:
   - Key fields (conceptual):
     - `ApplicationFormProduct__c` – the in-flight product selection.
     - `Applicant__c` – the individual or organization in the application.
     - `Role__c` – the participation role (e.g., Primary Owner, Joint Owner, Authorized Signer, Beneficial Owner).

2. Enforce a **1:1 role alignment** between:
   - `ApplicationProductPartyRole__c.Role__c`, and
   - `FinServ__FinancialAccountRole__c.Role__c`.

   These two picklists should share the same values and meaning, so that “Primary Owner” in the matrix is exactly “Primary Owner” on the FinancialAccountRole.

3. **AccountContactRelation (ACR)** is treated as a more flexible, multi-valued representation of the enduring relationship between the PersonAccount and the Business Account:
   - A single person may have multiple roles at the relationship level (e.g., Owner; Authorized Signer; Beneficial Owner).
   - ACR does **not** have to be in strict 1:1 alignment with the matrix/FAR roles, but the sync logic guarantees that the correct owner/signer/beneficial-owner semantics are present.

---

### 2. Lifecycle & Timing

#### 2.1 When to Materialize ACR & FAR

For MVP, we materialize ACR and FinancialAccountRole records **when the application is submitted / accounts are opened**, not while the wizard is still in progress:

1. On ApplicationForm submission (or equivalent “Ready to Open” stage):
   - Business Account and FinancialAccount records exist or are created.
   - All relevant `ApplicationProductPartyRole__c` records are finalized for that application.
   - We invoke a central service:
     - `RelationshipSyncService.syncForApplicationForm(ApplicationFormId)`.

2. The service:
   - Ensures PersonAccounts exist for all individual Applicants.
   - Creates/updates ACRs between Business Account and PersonAccounts.
   - Creates/updates FinancialAccountRoles between FinancialAccounts and PersonAccounts using the matrix role.

> Future enhancement (if needed): wire the same service to run after changes to `ApplicationProductPartyRole__c` to support near real-time sync while the application is still in the wizard.

---

### 3. PersonAccount Handling

#### 3.1 Ensuring a PersonAccount per Individual Applicant

Implement a shared Apex method:

- `RelationshipSyncService.ensurePersonAccountForApplicant(ApplicantId) → AccountId`

Responsibilities:

1. Attempt to **find an existing PersonAccount**:
   - Primary key should be any existing Applicant-to-PersonAccount reference if present (e.g., `Applicant.PersonAccount__c` or `Applicant.AccountId` where IsPersonAccount = true).
   - Optional secondary matching (if approved by business/security):
     - Exact match on a unique external ID (e.g., core system Party ID), if available.
     - Fallback matches on name + DOB + TaxID, only if business explicitly approves this approach.

2. If a PersonAccount is found:
   - Return the Account Id and update the Applicant-to-PersonAccount reference if missing.

3. If not found:
   - Create a new PersonAccount using the Applicant’s captured data (name, address, contact info, etc.).
   - Store back-link from Applicant to that PersonAccount.

This isolates PersonAccount de-duplication and creation logic in one place so the rest of the sync logic can call it safely.

---

### 4. ACR Creation and Sync

#### 4.1 Input

- Business Account Id (from ApplicationForm or its business step).
- List of `ApplicationProductPartyRole__c` records for the ApplicationForm, each linked to:
  - `Applicant__c` (individual),
  - `ApplicationFormProduct__c` (product), and
  - `Role__c` (canonical participation role).

#### 4.2 Process

1. For each `ApplicationProductPartyRole__c` tied to an individual Applicant:
   - Call `ensurePersonAccountForApplicant(Applicant__c)` to get the PersonAccount Id.

2. For each PersonAccount, determine **desired ACR roles** based on its matrix roles:
   - Example rule set (can live in code initially):
     - If matrix role in {Primary Owner, Joint Owner} → ensure ACR includes `Owner`.
     - If matrix role includes any `Signer` or `Authorized Signer` value → ensure ACR includes `Authorized Signer`.
     - If matrix role includes `Beneficial Owner` → ensure ACR includes `Beneficial Owner`.

3. Query existing `AccountContactRelation` records for the Business Account + PersonAccount pair.
   - If none exist:
     - Insert a new ACR with the appropriate combined roles.
   - If one exists:
     - Merge any missing roles into the ACR’s role multi-select and update (no duplicates).

4. Optionally keep a flag or field to differentiate:
   - ACRs created/managed by the DAO onboarding flow vs pre-existing ACRs from other sources.

This approach is **idempotent**: re-running `syncForApplicationForm` converges the ACR state without creating duplicates.

---

### 5. FinancialAccountRole Creation and Sync

#### 5.1 Input

- FinancialAccounts created from `ApplicationFormProduct` on application submission.
- `ApplicationProductPartyRole__c` list for the ApplicationForm.

#### 5.2 Process

1. For each `ApplicationProductPartyRole__c` row:
   - Resolve:
     - `FinancialAccountId` from the corresponding `ApplicationFormProduct` (using existing product-persistence logic).
     - PersonAccount Id via `ensurePersonAccountForApplicant(Applicant__c)`.
     - `Role` from `ApplicationProductPartyRole__c.Role__c` (canonical participation role).

2. For each `(FinancialAccountId, PersonAccountId, Role)` triple:
   - Query existing `FinServ__FinancialAccountRole__c` records.
   - If not present:
     - Insert a new FinancialAccountRole with:
       - `FinServ__FinancialAccount__c` = FinancialAccountId
       - Party reference (Account/Contact/PersonAccount as per FSC configuration)
       - `Role__c` = matrix role value.
   - If present:
     - Skip (no duplicate insert) or update if any additional fields need syncing.

Result: For each matrix row, there is **at most one** corresponding FinancialAccountRole per FinancialAccount and PersonAccount for that role.

---

### 6. No-Duplicate Guarantees

To prevent duplicates across re-runs:

1. **PersonAccount**
   - Always use `ensurePersonAccountForApplicant` and never create PersonAccounts directly elsewhere during this process.

2. **ACR**
   - Treat the “desired state” as a set of `(BusinessAccountId, PersonAccountId, ACR-role-flags)` and compare against existing ACRs:
     - One ACR per BusinessAccount + PersonAccount pair.
     - Role multi-select is unioned with new roles, never duplicated.

3. **FinancialAccountRole**
   - Treat the “desired state” as a set of `(FinancialAccountId, PersonAccountId, Role)` triples.
   - Query existing FinancialAccountRoles for that FinancialAccount.
   - Only insert missing triples; update if necessary, never insert blind duplicates.

Implementation detail: the triple check can be done by:
   - A `Map<String, FinServ__FinancialAccountRole__c>` keyed on `FinancialAccountId + ':' + PersonAccountId + ':' + Role`.

---

### 7. Visibility & Security

1. Configure Business Account page layout / Lightning Record Page to show:
   - `AccountContactRelation` related list (or equivalent “Related Contacts”).

2. Configure FinancialAccount page layout / Lightning Record Page to show:
   - `FinServ__FinancialAccountRole__c` related list.

3. Ensure Branch Manager and Operations permission sets:
   - Have read access to ACR and FinancialAccountRole objects and key fields.
   - Can see the related lists on both Business Account and FinancialAccount.

---

### 8. Application Summary View

1. Ensure that the Application Summary LWC/component:
   - Reads relationships from the same source as the sync process:
     - Either directly from `ApplicationProductPartyRole__c` and/or
     - From a DTO constructed in `DaoWizardDataService`.

2. Display:
   - Per-product participation (matrix roles).
   - When available, show a simple indication that ACR and FinancialAccountRoles have been created (post-submission).

This keeps the summary screen conceptually aligned with what ultimately appears on the account record pages.

---

## 🛠️ Tasks and Sub-Tasks

1. **SVC-007.1 – Define canonical participation roles**
   - Align the `Role__c` picklist values on `ApplicationProductPartyRole__c` and `FinServ__FinancialAccountRole__c`.
   - Document allowed role values and their meaning (Primary Owner, Joint Owner, Authorized Signer, Beneficial Owner, etc.).

2. **SVC-007.2 – Implement RelationshipSyncService**
   - Create `RelationshipSyncService` Apex class with:
     - `syncForApplicationForm(ApplicationFormId)`
     - `ensurePersonAccountForApplicant(ApplicantId) → AccountId`
   - Implement PersonAccount resolution logic and de-duplication.

3. **SVC-007.3 – ACR sync implementation**
   - In `syncForApplicationForm`, add logic to:
     - Build the desired ACR state from all relevant `ApplicationProductPartyRole__c` rows.
     - Query existing ACRs for the Business Account.
     - Create or update ACRs to reflect correct Owner / Authorized Signer / Beneficial Owner semantics.

4. **SVC-007.4 – FinancialAccountRole sync implementation**
   - Extend `syncForApplicationForm` to:
     - Resolve FinancialAccounts from `ApplicationFormProduct`.
     - For each matrix row, create/update one `FinServ__FinancialAccountRole__c` with aligned `Role__c`.

5. **SVC-007.5 – Wire into submission flow**
   - Identify the existing “Submit Application / Open Accounts” service.
   - Invoke `RelationshipSyncService.syncForApplicationForm` at an appropriate point after:
     - Business Account is available.
     - FinancialAccounts are created for all ApplicationFormProducts.

6. **LWC-007.1 – Application Summary alignment**
   - Ensure the Application Summary view presents the same matrix roles used by `RelationshipSyncService`.
   - Optionally add a post-submission indicator that ACR/FAR materialization has completed.

7. **DATA-007.1 – Backfill (if required)**
   - For existing applications/accounts (if any) created before this story:
     - Run a one-time script to call `syncForApplicationForm` for historical ApplicationForms.
     - Validate that ACRs and FinancialAccountRoles are created without duplicates.

8. **QA-007.1 – Testing**
   - Unit tests:
     - `ensurePersonAccountForApplicant` (existing vs new).
     - `syncForApplicationForm` for:
       - Single applicant / single product.
       - Multiple applicants / multiple products.
       - Re-running sync with changed roles (no duplicates).
   - Integration tests:
     - Full DAO wizard from application creation through submission.
     - Validate ACR and FinancialAccountRole related lists on resulting records.

---

## 🧪 Testing Requirements

- **Unit Tests (≥ 85% coverage)**:
  - RelationshipSyncService (PersonAccount creation/reuse, ACR sync, FinancialAccountRole sync).
- **Integration Tests**:
  - End-to-end application → account opening → ACR/FAR verification in `msb-sbox`.
- **Manual Tests**:
  - Matrix changes reflected correctly after resubmission.
  - No duplicate ACRs or FinancialAccountRoles created on re-run.

---

## 🔗 Dependencies

- Depends on:
  - ST‑001 Wizard Foundation.
  - ST‑002 Persist Application Data (ApplicationFormProduct and product persistence).
  - ST‑004 Capture Application Details (Applicant / Business Account patterns).
- Related to:
  - ST‑006 Ancillary Services (reuses ApplicationFormProduct and Applicant models).

---

## ✅ Definition of Done

- Canonical participation role picklist is aligned between matrix and FinancialAccountRole.
- RelationshipSyncService implemented and invoked on application submission.
- PersonAccounts are created or reused for all relevant Applicants.
- ACRs correctly reflect owner/signer/beneficial-owner semantics without duplicates.
- FinancialAccountRoles exist and mirror matrix roles for each FinancialAccount.
- Branch Manager and Operations can see ACRs and FinancialAccountRoles on standard record pages.
- Unit and integration tests passing; documentation updated in `docs/02-requirements` and JIRA.


