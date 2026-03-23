<!-- 
🔴 AI AGENTS: READ FIRST
- /docs/01-foundation/data-model.md
- /docs/01-foundation/msb-deposit-products.csv
- /docs/01-foundation/msb-standardized-services-picklist.csv
- /docs/01-foundation/msb-product-available-services-upload.csv
- /docs/04-implementation/session-notes/2026-01-19-additional-services-persistence-issue.md

✅ Correct objects: ApplicationForm, ApplicationFormProduct, Product2
❌ Wrong: Application__c, Deposit_Product__c, Ancillary__c (unless explicitly defined elsewhere)
-->

## ST-006: Ancillary Services

**Story ID**: ST-006  
**Work Item**: LWC-006, SVC-006, CFG-006, DATA-006  
**Status**: Proposed  
**Created**: 2026-01-28  
**Last Updated**: 2026-02-04

---

## 🏛️ Key Principle: Product Drives Configuration

> **Product drives the required Roles, Documents, and available Services.**  
> This principle applies to all stories. For ST-006, available services are derived from the selected Product(s).

### 🎫 JIRA Story Mapping

| JIRA Story | Title                       | Status   | Link |
|------------|----------------------------|----------|------|
| TBD        | Ancillary Services Capture | Proposed | TBD  |

> This requirements doc defines the end-to-end behavior for capturing, persisting, and resuming ancillary services (debit cards, online banking, etc.) tied to selected deposit products.

---

## 📋 Story Overview

**As a** Banker User completing a Deposit Account Opening application  
**I want** to capture which additional (ancillary) services a customer wants per selected deposit product  
**So that** Operations can act on a single, consolidated view of services after the account is opened, without duplicate follow-up.

---

## 🔍 Business Context & Inputs

- Ancillary products today include debit cards, check orders (Harland Clark), and digital banking among others.
- Source of truth for current offerings is `docs/01-foundation/msb-deposit-products.csv` (“Ancillaries Offered?” column).
- Operations requested that **all ancillary services be captured once in Salesforce**, not re-keyed in downstream systems.
- Bankers can select **one or more ancillary services per chosen deposit product** (or none; services are optional).
- Available services must be **product-specific** and **configurable by admins** without code changes.
- Existing analysis and architecture decision:  
  `docs/04-implementation/session-notes/2026-01-19-additional-services-persistence-issue.md`

---

## 🎯 Acceptance Criteria

### AC1 – Capture per-product services

- Given a new application with multiple deposit products selected,  
  When I reach the Services step and choose ancillary services for each product,  
  Then each `ApplicationFormProduct` has its selected services stored, and the step can be completed successfully.

### AC2 – Resume shows previous selections

- Given an in-progress application with previously selected services,  
  When I resume the application and navigate back to the Services step,  
  Then all previously selected services are displayed as checked for each product.

### AC3 – Review & Submit summary

- When I reach the Review & Submit step,  
  Then the selected ancillary services appear in the summary, clearly associated with the relevant products.

### AC4 – Edit and re-save

- When I modify service selections (add/remove) and then click **Next** or **Save & Exit**,  
  Then the new selections are persisted and correctly reflected when I resume the application or return to the Services step.

### AC5 – Configuration by admins

- When an admin updates the services available for a given product,  
  Then the Services step reflects the updated list (via configuration only, no code changes needed).

### AC6 – No-selection behavior

- When no services are selected for a given product,  
  Then the application still saves successfully, the Services step shows an appropriate empty state, and no erroneous data is created.

### AC7 – Product removal clears services

- When a user removes a product from the Product Selection step,  
  Then all associated services and product references in the Services step are cleared.

### AC8 – Services grouped by product

- Services are displayed and stored **grouped by product** in both the UI and backend.

---

## 🧱 Solution Design (High-Level)

1. **Product configuration (Product2)**  
   - Add `Product2.Available_Services__c` (Multi-Select Picklist) to define which services each product can offer.  
   - Normalize free-text “Ancillaries Offered?” values from CSV into a canonical picklist set.

2. **Per-product selection (ApplicationFormProduct)**  
   - Add `ApplicationFormProduct.Selected_Services__c` (Multi-Select Picklist) to store selected services for each product in the application.  
   - Use **three** Record Types on `ApplicationFormProduct`: Checking, Savings, Certificates (Time Deposit). Retirement is out of scope.

3. **Persistence service updates**  
   - Implement `DaoWizardPersistenceService.upsertServicesStep()` to read `perProductSelections` payload and map to `ApplicationFormProduct.Selected_Services__c` for each product.

4. **Data loading for resume**  
   - Implement services loading in `DaoWizardDataService.handleApplicationForm()` to rebuild a Services DTO from `ApplicationFormProduct` rows (grouped by product).

5. **LWC behavior (`daoAdditionalServices`)**  
   - Display services grouped by product; show only services available for selected products. When a product is removed in Product Selection, clear all services and products in Services step. Services are optional; allow proceeding without selection. Integrate with `daoWizardContainer` via `currentStepValue`.

6. **Data migration**  
   - Client developer uploads records before build using provided CSV files.

---

## 🛠️ Tasks and Sub-Tasks

### Phase 1 – Data Model & Configuration (CFG-006)

1. **Create Product2 field**
   - Create `Product2.Available_Services__c` (Multi-Select Picklist).
   - Define standardized service values (e.g., Online Banking, Mobile Banking, Debit/ATM, Pre-Authorized Transfer, Direct Deposit, Sweep, CM Products, Check Orders).
   - Document final picklist values and their meaning.

2. **Create ApplicationFormProduct field**
   - Create `ApplicationFormProduct.Selected_Services__c` (Multi-Select Picklist).
   - Configure record-type–specific picklist values:
     - Checking
     - Savings
     - Time Deposit (Certificates)

3. **Record Types**
   - Create/use **three** `ApplicationFormProduct` Record Types only:
     - Checking
     - Savings
     - Certificates (Time Deposit)
   - Mapping from `Product2.Category__c` to Record Type:
     - Checkings → Checking
     - Savings → Savings
     - Certificates → Time Deposit
   - **Retirement**: Out of scope. Product2 Record Types are not required.

---

### Phase 2 – Backend Persistence & Loading (SVC-006)

4. **Update upsertProductStep (if needed)**
   - Ensure new `ApplicationFormProduct` records have `RecordTypeId` set based on `Product2.Category__c`.
   - Reuse/extend existing logic documented in the 2026‑01‑19 session notes.

5. **Implement upsertServicesStep**
   - Update `DaoWizardPersistenceService.upsertServicesStep()` to:
     - Read payload with **`perProductSelections`** (map of ApplicationFormProduct.Id → List&lt;String&gt;):
       ```json
       {
         "perProductSelections": {
           "a01xx000000001AAA": ["Online Banking", "Debit/ATM"],
           "a01xx000000002AAA": ["Pre-Authorized Transfer"]
         },
         "selectedServices": ["Online Banking", "Debit/ATM", "Pre-Authorized Transfer"]
       }
       ```
     - Query all `ApplicationFormProduct` records for the given `ApplicationForm`.
     - Update `Selected_Services__c` for each product using semi-colon–delimited picklist values.
     - Optionally validate selections against `Product2.Available_Services__c` and log mismatches.

6. **Implement handleApplicationForm services loading**
   - In `DaoWizardDataService.handleApplicationForm()`:
     - Query `ApplicationFormProduct` records (Id, Selected_Services__c, Product2 fields as needed).
     - Build a DTO, e.g.:
       - `services.selectedServices` (flattened list across all products).
       - `services.perProductSelections` (map of ApplicationFormProduct.Id → List<String>).
     - Return `dto.services` so `daoWizardContainer.initializeWizardData()` can seed the Services step.

---

### Phase 3 – LWC & Wizard Integration (LWC-006)

7. **Enhance daoAdditionalServices**
   - Update `daoAdditionalServices` to:
     - Initialize from `value.selectedServices` and `value.perProductSelections`.
     - Display services **grouped by product**; show **only** services available for selected products.
     - When product is removed in Product Selection, clear all services and products in Services step.
     - Services optional; allow proceeding without selection.
     - Emit payload with `perProductSelections` and `selectedServices`.

8. **Wizard container wiring**
   - Ensure `daoWizardContainer`:
     - Stores the Services payload in `payloadByStep` under the correct step key.
     - Provides that payload via `currentStepValue` when the Services step is displayed.
     - Includes `result.services` in `initializeWizardData()` prefill logic.

9. **Review & Submit integration**
   - Review & Submit displays **grouped by product**, **selected services only** (products with or without services).

---

### Phase 4 – Data Migration from CSV (DATA-006)

10. **Upload standardized services (client-owned, before build)**
    - Use `docs/01-foundation/msb-standardized-services-picklist.csv` for picklist value definitions.
    - Use `docs/01-foundation/msb-product-available-services-upload.csv` to populate `Product2.Available_Services__c`.
    - Client developer uploads records before build starts. Ensure all columns are accounted for. Only active products and services.

---

### Phase 5 – Testing & Documentation

12. **Unit tests**
    - `DaoWizardPersistenceService.upsertServicesStep()`:
      - New selections, updates, empty selections.
    - `DaoWizardDataService.handleApplicationForm()`:
      - Loads services correctly for single and multiple products.
    - LWC tests for `daoAdditionalServices`:
      - Initialization, selection, and payload emission.

13. **Integration tests**
    - New application: select products + services, complete wizard.
    - Save & Exit then resume; verify services reload correctly.
    - Edit services after resume; verify updated selection persists.
    - Validate Review & Submit summary.

14. **Documentation**
    - Update:
      - `docs/01-foundation/data-model.md` with new fields and relationships.
      - Requirements backlog (`docs/02-requirements/backlog.md`) to reference ST-006.
      - Implementation/session notes for the actual build and any deviations.

---

## 🔧 Technical Implementation (Reference)

### Objects

- **ApplicationForm** – overall application.
- **ApplicationFormProduct** – selected deposit products for the application.
- **Product2** – product catalog (includes `MinorCode__c`, `Category__c`).
- **(Future display/use)**: any operations or workflow objects that consume selected services.

### Key Fields

- `Product2.Available_Services__c` (Multi-Select Picklist)  
  – Configurable list of services per product.

- `ApplicationFormProduct.Selected_Services__c` (Multi-Select Picklist)  
  – User-selected services per product instance in the wizard.

---

## 🧪 Testing Requirements

- **Unit Tests (≥ 85% coverage)**:
  - Persistence and loading logic for services.
  - LWC behavior for `daoAdditionalServices`.
- **Integration Tests**:
  - Full wizard flow including Services step, Save & Exit, and resume.
  - Manual validation of admin configuration changes reflected in UI.

---

## 🔗 Dependencies

- Depends on:
  - ST‑001 Wizard Foundation.
  - ST‑002 Persist Application Data (services layer and DTO patterns).
  - ST‑003 Pre-populate Wizard Data (resume behavior).
- Related to:
  - Product data mapping from `msb-deposit-products.csv` (field mapping analysis).

---

## ✅ Definition of Done

- Fields and record types created and documented.
- Services persistence and loading implemented and covered by tests.
- LWC correctly captures, displays, and resumes services per product.
- Product2 records populated with available services from CSV.
- Review & Submit presents accurate service information.
- Documentation updated in `docs/01-foundation` and `docs/02-requirements`, and story mapped in JIRA.


