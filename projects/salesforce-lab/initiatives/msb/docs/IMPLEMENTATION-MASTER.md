# Main Street Bank — DAO Wizard: Master Implementation Reference

**Project**: Deposit Account Opening (DAO) Wizard  
**Platform**: Salesforce FSC (Financial Services Cloud)  
**Last Updated**: 2026-03-11  
**Maintained By**: Development Team

> This document is the single, consolidated reference for everything built in the
> DAO Wizard project. For each story it covers: purpose, status, system design,
> data model, custom components, configuration, and how-tos.

---

## Quick Reference: Story Status

| Story | Title | Status |
|---|---|---|
| [ST-001](#st-001-wizard-foundation) | Wizard Foundation & Configuration-Driven Architecture | ✅ Implemented |
| [ST-002](#st-002-persist-application-data) | Persist Application Data | ✅ Implemented |
| [ST-003](#st-003-resume-application) | Pre-populate / Resume Application | ✅ Implemented |
| [ST-004](#st-004-capture-application-details) | Capture Application Details (Business) | ✅ Implemented |
| [ST-005](#st-005-capture-individual-details) | Capture Individual Details (Primary Applicant) | ✅ Implemented |
| [ST-006](#st-006-ancillary-services) | Ancillary Services | ✅ Implemented |
| [ST-007](#st-007-relationships-and-roles) | Relationships and Product Party Roles | ✅ Implemented |
| [ST-008](#st-008-book-to-core) | Book to Core | 🔲 Planned |
| [ST-009](#st-009-kyb-kyc-integration) | KYB/KYC Integration (ChexSystems / FIS) | 🔲 Planned |
| [ST-010](#st-010--st-011-compliance-rules) | Business Tax ID Conditional Requirement | ✅ Implemented |
| [ST-011](#st-010--st-011-compliance-rules) | Primary / Secondary ID Document Validation | ✅ Implemented |
| [ST-012](#st-012-mailing-address--physical-address) | Mailing Address & Physical Address (PO Box) | ✅ Implemented |
| [ST-013](#st-013-existing-account-search) | Existing Account Search for Additional Applicants | 🔲 Planned |
| [Account Title](#account-title-multi-line-generation) | Multi-Line Account Title Generation | ✅ Implemented |

---

## Architecture Overview

### Core Pattern

The DAO Wizard follows a **configuration-driven, container + step-router** pattern:

```
┌──────────────────────────────────────────────────────────────┐
│ daoWizardContainer (LWC)                                     │
│  • Reads Wizard_Step__mdt records for step sequence          │
│  • Calls DaoWizardDataService on load (resume/prefill)        │
│  • Calls DaoWizardPersistenceService on Next/Save & Exit     │
│  • Passes step payload via @api value prop                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ daoWizardStepRouter (LWC)                              │  │
│  │  • Dynamically renders the correct step component      │  │
│  │  • Delegates validate() and reset() to active step     │  │
│  │   ┌──────────────────────────────────────────────────┐ │  │
│  │   │ Step LWCs (one per wizard step)                  │ │  │
│  │   │  daoBusinessDetails / daoApplicantDetails        │ │  │
│  │   │  daoAdditionalApplicants / daoProductSelection   │ │  │
│  │   │  daoAncillaryServices / daoReviewAndSubmit …     │ │  │
│  │   └──────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
         │  Apex                   │  Apex
         ▼                         ▼
DaoWizardDataService      DaoWizardPersistenceService
  (read / prefill)          (write / validate)
```

### Key Architectural Decisions

| Decision | Why |
|---|---|
| Configuration-driven step sequence via `Wizard_Step__mdt` | Add/reorder steps without code changes |
| Container holds all step payloads in `payloadByStep` Map | Single source of truth; steps receive their slice as `@api value` |
| Each step emits `payloadchange` events | Loose coupling; container doesn't know step internals |
| `DaoWizardDataService` is always non-cacheable (`@AuraEnabled` without `cacheable=true`) | Resume must always return fresh DB state; stale cache caused missing applicants |
| Compliance rules in `DaoComplianceRules.cls` with CMDT backing | Admins configure without code deployment |
| `deletedApplicantIds` explicit tracking (not set-difference reconciliation) | Prevents accidental deletion when a step isn't fully loaded |

### Salesforce Objects Used

| Object | Purpose |
|---|---|
| `ApplicationForm` | The root record for one DAO application |
| `Applicant` | Each person/entity on the application |
| `ApplicationFormProduct` | Product(s) being opened |
| `IdentityDocument` | ID documents attached to an Applicant |
| `ApplicationProductPartyRole__c` | Links Applicant to Product with a Role |
| `NAICS__c` | Industry code lookup |
| `Opportunity` | Entry-point for starting a new application |
| `Account` (PersonAccount/Business) | Pre-populates business/individual details |

---

## ST-001: Wizard Foundation

**Status**: ✅ Implemented

### Purpose
Establish the configuration-driven wizard framework that all other stories build on.

### Components Built

| Component | Type | Description |
|---|---|---|
| `daoWizardContainer` | LWC | Generic container; reads step config, manages payload Map, calls Apex |
| `daoWizardStepRouter` | LWC | Dynamically renders the active step LWC by `componentBundle` name |
| `DaoWizardConfigService` | Apex | Queries `Wizard_Step__mdt` records for a given `wizardApiName` |
| `Wizard_Step__mdt` | Custom Metadata | Defines each step: label, order, component bundle, wizard API name |

### Configuration

**To add a new step:**
1. Create a `Wizard_Step__mdt` record
2. Set `WizardApiName__c = 'DAO_Business_InBranch'` (or your wizard name)
3. Set `Order__c` to control position
4. Set `ComponentBundle__c` to the LWC name (e.g. `daoMyNewStep`)
5. No code deployment needed for re-ordering or adding steps

---

## ST-002: Persist Application Data

**Status**: ✅ Implemented

### Purpose
Save each wizard step's data to Salesforce when the user clicks Next or Save & Exit.

### Components

| Component | Type | Description |
|---|---|---|
| `DaoWizardPersistenceService` | Apex | Routes each step payload to the correct handler method |
| `upsertStep()` | Apex method | Entry point; dispatches to `upsertBusinessStep`, `upsertApplicantStep`, etc. |

### How It Works
1. Container calls `upsertStep({ applicationId, stepKey, payload })` on Next/Save & Exit
2. `PersistenceService` reads `stepKey` and routes to the appropriate private method
3. Each method performs upsert + validation and returns a `PersistenceResponse` with saved IDs
4. Container receives the response; on first save, stores the returned `ApplicationForm.Id`

### Key Behaviors
- All DML runs `WITH USER_MODE` / `as user` to enforce FLS and sharing
- Validation errors are returned as structured messages (not exceptions) so the UI can display them
- `deletedApplicantIds` in the Additional Applicants payload allows explicit deletion of removed applicants without risking accidental deletion of un-loaded records

---

## ST-003: Resume Application

**Status**: ✅ Implemented

### Purpose
Pre-populate all wizard steps when resuming an existing `ApplicationForm` record.

### Components

| Component | Type | Description |
|---|---|---|
| `DaoWizardDataService` | Apex | Reads all saved data and returns a single `WizardDataDTO` |
| `getWizardData()` | Apex method | Entry point; routes to `handleApplicationForm` or `handleOpportunity` |
| `ApplicantInfoDTO` | Inner class | Carries all applicant fields to LWC |
| `ProductDTO` | Inner class | Carries product/account-title fields to LWC |

### How It Works
1. `daoWizardContainer` calls `getWizardData({ recordId })` on mount
2. Service detects `recordId` type (ApplicationForm vs Opportunity) and routes accordingly
3. `handleApplicationForm` queries all related records and builds DTOs
4. Container distributes DTOs into `payloadByStep` Map
5. Each step LWC receives its DTO via `@api value` setter and populates fields

### Important: `cacheable=false`
`getWizardData` is intentionally **not** marked `cacheable=true`. When called
imperatively with `await`, a cacheable method resolves twice (once from stale
cache, once from server). The `await` only captures the first resolution, so
applicants added after the first visit would silently be missing on resume. The
non-cacheable approach always fetches fresh data.

### Resume Entry Points
- **From ApplicationForm record page** → `recordId` is ApplicationForm ID → loads all saved data, navigates to last saved step
- **From Opportunity** → `recordId` is Opportunity ID → prefills business/contact data from Account and `OpportunityContactRole` but no saved ApplicationForm yet

---

## ST-004: Capture Application Details

**Status**: ✅ Implemented

### Purpose
Capture business entity details (name, type, address, tax ID, etc.) in the Business step.

### Components

| Component | Type | Description |
|---|---|---|
| `daoBusinessDetails` | LWC | Business step UI |
| `daoFundingAmountModal` | LWC | Product nickname, funding amount, account title lines |

### Data Captured
- Legal business name, DBA, Business Type, Date Established, State of Incorporation
- NAICS code / Industry Type, Business Description, Annual Revenue, # Employees
- Business address (street 1, street 2, city, state, zip, country)
- Federal Tax ID (EIN) — conditional, see ST-010
- Primary contact name/title
- Mailing address (with "Mailing different than Business address" checkbox)
- Account Title lines (see Account Title feature)

---

## ST-005: Capture Individual Details

**Status**: ✅ Implemented

### Purpose
Capture the primary individual applicant's personal details.

### Component: `daoApplicantDetails`

**Data captured:**
- Name (salutation, first, middle, last, suffix), DOB, Mother's maiden name
- Tax ID type + SSN/Tax ID
- Citizenship (US Citizen, US Resident, Country of Residence)
- Employer, Occupation
- Contact info (primary/secondary email, phone)
- Physical address + Mailing address (with checkbox)
- Government ID (type, number, issuing authority, state, issue/expiration dates)
- Identity Documents (multiple, with file upload)
- CIP bypass checkbox (see ST-011)

---

## ST-006: Ancillary Services

**Status**: ✅ Implemented

### Purpose
Capture additional services (e.g. debit card, online banking, e-statements) the applicant wants alongside the deposit account.

### Component: `daoAncillaryServices`

---

## ST-007: Relationships and Roles

**Status**: ✅ Implemented

### Purpose
Assign roles (signer, beneficiary, authorized user, etc.) to each applicant for each product being opened.

### Components

| Component | Type | Description |
|---|---|---|
| `daoRelationshipManagement` | LWC | Maps applicants to products with roles |
| `ApplicationProductPartyRole__c` | Object | Junction: Applicant × ApplicationFormProduct × Role |

---

## ST-008: Book to Core

**Status**: 🔲 Planned

### Purpose
Submit the completed application to the core banking system (COCC) to open the account.

### Notes
- Integration design documented in `docs/04-implementation/session-notes/2026-01-28-cocc-core-booking-integration-analysis.md`

---

## ST-009: KYB/KYC Integration

**Status**: 🔲 Planned

### Purpose
Integrate with ChexSystems (BizChex for KYB, ID Verification for KYC) and FIS for compliance screening.

### Notes
- Solution design documented in `docs/04-implementation/session-notes/2026-01-28-fis-chexsystems-kyb-kyc-integration-solution-design.md`

---

## ST-010 + ST-011: Compliance Rules

**Status**: ✅ Implemented  
**Full notes**: [`ST-010-011-compliance-implementation-notes.md`](./02-requirements/ST-010-011-compliance-implementation-notes.md)

### Purpose

**ST-010**: Make Federal Tax ID (EIN) conditional based on business entity type.  
**ST-011**: Enforce "1 Primary ID OR 2 Secondary IDs" per CIP requirements, with a configurable role-based intake bypass.

### Custom Metadata Types (admin-configurable, no code deploy needed)

| CMDT | Purpose | Key Field |
|---|---|---|
| `DAO_Primary_Document__mdt` | Defines which ID types are Primary | `IdType__c`, `Active__c` |
| `DAO_BusinessType_TaxRule__mdt` | Defines which business types skip Tax ID | `BusinessType__c`, `TaxIdRequired__c` |
| `DAO_ApplicantRoleCompliance__mdt` | Defines bypass-eligible roles | `Label__c`, `AllowIntakeBypass__c` |

### New Apex: `DaoComplianceRules.cls`

```
getPrimaryDocumentTypesList()     @AuraEnabled cacheable — LWC wire for banner + validation
getBypassRolesText()              @AuraEnabled cacheable — LWC wire for bypass checkbox label
getNoTaxIdBusinessTypes()         @AuraEnabled cacheable — LWC wire for Tax ID conditional
isTaxIdRequiredForBusinessType()  internal — used by PersistenceService
validateIdentityDocuments()       internal — used by PersistenceService
```

### New Fields on `Applicant`

| Field | Type | Purpose |
|---|---|---|
| `Intake_Bypass_IdDocs__c` | Checkbox | Self-declared bypass for ID documents |
| `Intake_Bypass_TaxId__c` | Checkbox | Self-declared bypass for Tax ID |

### How the Bypass Checkbox Works

The checkbox in the wizard says (dynamically, from CMDT):
> *"This applicant is expected to be ONLY in one of these roles: Beneficiary, Tenant-Style"*

When checked:
- `intakeBypassIdDocs = true` (skips ID document validation)
- `intakeBypassTaxId = true` (skips Tax ID validation)
- Both are stored on the `Applicant` record

To add a new bypass role → create a `DAO_ApplicantRoleCompliance__mdt` record. The checkbox text updates at runtime automatically.

### How the CIP Banner Works

The banner in the Identity Documents section (dynamic, from CMDT):
> *"CIP Requirement: Provide 1 Primary ID (Driver's License, Passport, State ID) or 2 Secondary IDs"*

The listed types come from `DAO_Primary_Document__mdt`. To add Military ID to the primary list: create a CMDT record with `IdType__c = "Military ID"` and `Active__c = true` — the banner and validation both update automatically.

---

## ST-012: Mailing Address & Physical Address

**Status**: ✅ Implemented

### Purpose
- Capture a separate **Physical Address** for applicants (required when mailing is a PO Box)
- Change the mailing address checkbox behavior: **unchecked by default**, shown as "Mailing address different than Physical/Business address"; when checked, mailing fields appear

### Scope
Applies to: `daoBusinessDetails`, `daoApplicantDetails`, `daoAdditionalApplicants`

### Data Model

New fields on `Applicant`:

| Field | Type | Purpose |
|---|---|---|
| `Physical_Street_Line_1__c` | Text | Physical street |
| `Physical_Street_Line_2__c` | Text | Physical street line 2 |
| `Physical_City__c` | Text | Physical city |
| `Physical_State__c` | Text | Physical state |
| `Physical_Postal_Code__c` | Text | Physical ZIP |
| `Physical_Country__c` | Text | Physical country |
| `Mailing_Different_Than_Physical_Address__c` | Checkbox | `true` when mailing differs from physical; stored inverse of the old "same as" semantics |

### Checkbox Behavior

| Component | Label | Default | When Checked |
|---|---|---|---|
| `daoBusinessDetails` | "Mailing address different than business address" | Unchecked | Mailing fields appear |
| `daoApplicantDetails` | "Mailing address different than Physical address" | Unchecked | Mailing fields appear |
| `daoAdditionalApplicants` | "Mailing address different than Physical address" | Unchecked | Mailing fields appear |

**Note on field naming**: The DB field `Mailing_Different_Than_Physical_Address__c = true` means the addresses ARE different (mailing fields should show). The old field `Mailing_Same_As_Physical__c` had the opposite semantics.

### PO Box Validation

Implemented in `DaoWizardValidationUtil.cls`:
```apex
isPoBox(String streetLine1, String streetLine2)
```

Detects: "PO Box", "P.O. Box", "P O Box", "Post Office Box", "POBox" (case-insensitive).

**Rule**: If mailing is a PO Box → Physical address is required and must not itself be a PO Box.

---

## ST-013: Existing Account Search

**Status**: 🔲 Planned

### Purpose
Allow bankers to search for and link existing Salesforce Accounts/Contacts when adding additional applicants, rather than creating duplicates.

---

## Account Title: Multi-Line Generation

**Status**: ✅ Implemented  
**Feature introduced**: 2026-02 (no dedicated ST number)

### Purpose
Automatically compose a structured account title across up to 6 lines on `ApplicationFormProduct` when a product nickname/funding amount is saved.

### Line Composition Rules

| Line | Content | Source |
|---|---|---|
| Line 1 | Legal Business Name | `Applicant.BusinessEntityName` (always first) |
| Lines 2–4 | User-entered lines (0 to 3) | Entered via "Generate Account Title" UI |
| Next available line | Mailing Street Address | `Applicant` mailing street |
| Next available line | Mailing City, State, Postal Code | `Applicant` mailing address fields |

**Examples:**

*0 user lines:* Line 1 = Name, Line 2 = Street, Line 3 = City/State/Zip  
*2 user lines:* Line 1 = Name, Line 2/3 = user text, Line 4 = Street, Line 5 = City/State/Zip

### New Fields on `ApplicationFormProduct`

`Account_Title_Line_1__c` through `Account_Title_Line_6__c` (Text 255)

### UI Behavior
- Account Title inputs are **hidden by default**
- Clicking **"Generate Account Title"** reveals the section
- Only Line 1 (business name, read-only) and user-entered lines (2–4) are shown in the intake UI
- Lines 5–6 (address) are composed server-side and not displayed during intake

---

## Additional Applicants: Key Implementation Notes

### Resume Flow

1. `DaoWizardDataService.handleApplicationForm` queries all applicants for the `ApplicationForm`
2. Applicants with `Application_Role__c = 'Primary Applicant'` → `ApplicantInfoDTO.applicantInfo`
3. All others (Co-Applicants, Business applicants, etc.) → `ApplicantInfoDTO.additionalApplicants`
4. `hasAppliedInitialValue` in the LWC gates re-application; **only locks after a non-empty list is applied** to avoid locking on an empty-array call before async data arrives
5. The `Tax_ID__c` legacy field **must be in the SELECT** alongside `SSN_Tax_Id__c` — omitting it causes `SObjectException` for applicants with null SSN, silently truncating the returned list

### Deletion Tracking

When an applicant is removed in the UI:
1. If the applicant has a real Salesforce ID (not `applicant-{timestamp}-{n}`), its ID is added to `deletedApplicantIds`
2. `deletedApplicantIds` is included in the payload sent to `upsertAdditionalStep`
3. Apex only deletes records in `deletedApplicantIds` that belong to the current `ApplicationForm` (safety check)
4. Applicants absent from the payload but **not** in `deletedApplicantIds` are left untouched

This prevents accidental deletion when the Additional Applicants step was not fully loaded before saving.

### ID Lookup on Update (Resume)

When upserting additional applicants, the persistence service:
1. Tries to match by Salesforce record ID (from `applicantPayload.get('id')`) first
2. Falls back to email match only if no valid Salesforce ID is present
3. This prevents duplicates when resuming and editing existing applicants

---

## Permission Set: `DAO_Wizard_Access`

All wizard users need this permission set. It grants:
- Object access: `ApplicationForm`, `Applicant`, `ApplicationFormProduct`, `IdentityDocument`, `ApplicationProductPartyRole__c`, `NAICS__c`
- FLS on all wizard-relevant fields including:
  - `Applicant.Physical_*__c` fields
  - `Applicant.Mailing_Different_Than_Physical_Address__c`
  - `Applicant.Intake_Bypass_IdDocs__c`
  - `Applicant.Intake_Bypass_TaxId__c`
  - `ApplicationFormProduct.Account_Title_Line_1__c` through `_6__c`
- Apex class access: `DaoWizardPersistenceService`, `DaoWizardDataService`, `DaoWizardConfigService`, `DaoComplianceRules`, `DaoWizardValidationUtil`
- CMDT access: `DAO_Primary_Document__mdt`, `DAO_BusinessType_TaxRule__mdt`, `DAO_ApplicantRoleCompliance__mdt`

---

## Deployment Notes

### Scratch Org Setup
See `docs/04-implementation/setup-instructions/fsc-scratch-org-setup.md`

### Deploy Order for New Orgs
1. Custom objects and fields (including new `Applicant` physical address fields)
2. Custom Metadata Type objects and their custom fields  
3. Custom Metadata records (after fields exist in target org)
4. Apex classes (`DaoWizardValidationUtil`, `DaoComplianceRules`, then services)
5. LWC bundles
6. Permission sets and FLS
7. FlexiPages

> **Important**: CMDT records must be deployed *after* their custom fields. Deploy CMDT object+fields first, then deploy records in a separate step.

### Known Deploy Conflicts
The `Application_Form_Product_Record_Page` FlexiPage references `CurrencyIsoCode` which requires multi-currency enabled in the target org. Either enable multi-currency or remove that field from the FlexiPage before deployment to orgs without it.

---

## Testing Checklist

### Compliance Rules (ST-010/ST-011)

- [ ] Add business applicant with type DBA, no Tax ID → should save without error
- [ ] Add business applicant with type LLC, no Tax ID → should show validation error
- [ ] Add individual applicant with 1 Primary ID (Driver's License) → should pass
- [ ] Add individual applicant with 2 Secondary IDs (Tribal ID + School ID) → should pass
- [ ] Add individual applicant with 1 Secondary ID only → should fail with CIP message
- [ ] Add individual applicant with bypass checkbox checked, no IDs → should pass
- [ ] Resume application → bypass flag preserved, checkbox pre-checked
- [ ] Add new bypass role via CMDT → checkbox text updates at runtime

### Resume Flow

- [ ] Create application with 5+ applicants, save, navigate away, resume → all applicants displayed
- [ ] Resume, edit an existing applicant, Save & Exit → changes persist (no new duplicate record)
- [ ] Resume, delete an applicant, Save & Exit → applicant removed from DB
- [ ] Resume, navigate away without changes, return → no applicants deleted

### Mailing Address (ST-012)

- [ ] New applicant: checkbox unchecked by default, no mailing fields shown
- [ ] Check "Mailing different than Physical" → mailing fields appear
- [ ] Enter PO Box as mailing → physical address becomes required
- [ ] Resume: checkbox and addresses load correctly
