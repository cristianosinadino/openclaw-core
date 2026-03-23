# ST-010 + ST-011: Compliance Rules — Implementation Notes

**Story IDs**: ST-010, ST-011  
**Status**: ✅ Implemented  
**Implemented**: 2026-03  
**Last Updated**: 2026-03-11

> This document combines ST-010 (Business Tax ID Conditional Requirement) and
> ST-011 (Primary/Secondary ID Validation) into a single implementation reference.
> Both stories share the same configuration infrastructure (`DaoComplianceRules`
> and three Custom Metadata Types) and were delivered together.

---

## 1. Business Requirements Summary

### ST-010 — Business Tax ID Conditional Requirement

Not all business entity types require a Federal Tax ID (EIN) at onboarding:

| Business Type | Tax ID Required? |
|---|---|
| LLC, Corporation, Partnership, … | **Yes** |
| DBA (Doing Business As) | **No** |
| Sole Proprietorship | **No** |
| Trust | **No** |

The "not required" list is configurable — admins can add/remove types via
`DAO_BusinessType_TaxRule__mdt` without a code deployment.

### ST-011 — Primary vs Secondary ID Document Validation

CIP requires at least one government-issued primary ID per applicant, with an
exception allowing two secondary IDs for minors, seniors, disabled individuals,
or applicants without a primary ID available.

| Condition | Valid? |
|---|---|
| ≥ 1 Primary ID | ✅ |
| ≥ 2 Secondary IDs | ✅ |
| 1 Secondary ID only | ❌ |
| 0 IDs | ❌ |

### Role-Based Intake Bypass (joint decision from both stories)

Because actual applicant roles (Beneficiary, Tenant-Style, etc.) are only
assigned *after* application submission (pre-booking), users must **self-declare**
at intake that an applicant will occupy a bypass-eligible role. A single checkbox
covers both the Tax ID and ID document requirements simultaneously.

---

## 2. System Design

### 2.1 Architecture Overview

```
Admin configures CMDT records
        │
        ▼
DaoComplianceRules.cls  ◄──── single Apex class, all rule logic
  ├── getPrimaryDocumentTypesList()     → drives LWC banner + validation
  ├── getBypassRolesText()              → drives LWC bypass checkbox label
  ├── getNoTaxIdBusinessTypes()         → drives LWC Tax ID required check
  ├── getPrimaryDocumentTypes()         → internal Set<String> for server validation
  ├── isTaxIdRequiredForBusinessType()  → used by persistence service
  └── validateIdentityDocuments()       → used by persistence service
        │
        ├──► LWC (client-side validation, dynamic UI text)
        │         daoApplicantDetails
        │         daoAdditionalApplicants
        │
        └──► DaoWizardPersistenceService (server-side enforcement)
                  upsertApplicantStep
                  upsertAdditionalStep
```

### 2.2 Key Design Decisions

| Decision | Rationale |
|---|---|
| Single `DaoComplianceRules` class for all rule logic | One place to maintain; no rule duplication between LWC and Apex |
| Custom Metadata (not Apex constants or Custom Settings) | Admins can update rules without a code deployment; no org-wide sharing issues |
| `cacheable=true` on all `@AuraEnabled` compliance methods | These are read-only, rarely changing; safe to cache in LWC |
| One checkbox for both ID and Tax ID bypass | A single "self-declaration" is cleaner UX; both requirements are co-located for the same bypass roles |
| `intakeBypassIdDocs` and `intakeBypassTaxId` stored as separate fields | Allows future decoupling if bypass rules diverge per requirement type |
| Both client-side (LWC) and server-side (Apex) validation | Defense in depth; server prevents bypass of UI validation |

---

## 3. Data Model

### 3.1 New Fields on `Applicant` Object

| Field API Name | Type | Description |
|---|---|---|
| `Intake_Bypass_IdDocs__c` | Checkbox | `true` when user self-declared this applicant is in a bypass-eligible role and does NOT need ID documents |
| `Intake_Bypass_TaxId__c` | Checkbox | `true` when user self-declared this applicant is in a bypass-eligible role and does NOT need Tax ID |

Both default to `false`. Both are set to `true` simultaneously when the bypass
checkbox is checked in the wizard (one UI checkbox controls both fields).

FLS granted via `DAO_Wizard_Access` permission set.

### 3.2 New Custom Metadata Types

#### `DAO_Primary_Document__mdt`

Defines which ID document types qualify as **Primary** (CIP-compliant government-issued IDs).
Any type **not** in this list is treated as Secondary.

| Field | Purpose |
|---|---|
| `IdType__c` (Text) | The `IdDocumentType` picklist value, e.g. `"Driver's License"` |
| `Active__c` (Checkbox) | Only active records are used in validation |

**Default records deployed:**

| Label | `IdType__c` | `Active__c` |
|---|---|---|
| Driver's License | Driver's License | ✅ |
| Passport | Passport | ✅ |
| State ID | State ID | ✅ |

> **How to add a Primary ID type**: Create a new `DAO_Primary_Document__mdt`
> record with `Active__c = true` and the exact `IdType__c` value matching the
> `IdentityDocument.IdDocumentType` picklist value. No code deployment needed.

#### `DAO_BusinessType_TaxRule__mdt`

Defines which business entity types do **not** require Tax ID (EIN).

| Field | Purpose |
|---|---|
| `BusinessType__c` (Text) | The `Applicant.BusinessEntityType` picklist value |
| `TaxIdRequired__c` (Checkbox) | When `false`, Tax ID is optional for this type |

**Default records deployed:**

| Label | `BusinessType__c` | `TaxIdRequired__c` |
|---|---|---|
| DBA | DBA | ❌ |
| Sole Proprietorship | Sole Proprietorship | ❌ |
| Trust | Trust | ❌ |

> **How to add an exempt business type**: Create a new `DAO_BusinessType_TaxRule__mdt`
> record with `TaxIdRequired__c = false` and the exact `BusinessType__c` value
> matching the `Applicant.BusinessEntityType` picklist value.

#### `DAO_ApplicantRoleCompliance__mdt`

Defines which applicant roles allow the intake bypass (bypass both ID documents
and Tax ID requirements).

| Field | Purpose |
|---|---|
| `RoleApiName__c` (Text) | API name of the role (for future programmatic use) |
| `Label__c` (Text) | Display name shown in the bypass checkbox text |
| `RequireIdDocs__c` (Checkbox) | `false` = this role does not require ID docs |
| `RequireTaxId__c` (Checkbox) | `false` = this role does not require Tax ID |
| `AllowIntakeBypass__c` (Checkbox) | `true` = this role's label appears in the bypass checkbox |

**Default records deployed:**

| Label | `AllowIntakeBypass__c` |
|---|---|
| Beneficiary | ✅ |
| Tenant-Style | ✅ |

> **How to add a bypass-eligible role**: Create a new `DAO_ApplicantRoleCompliance__mdt`
> record with `AllowIntakeBypass__c = true` and the desired `Label__c`. The bypass
> checkbox text in the wizard updates automatically at runtime — no code deployment needed.
> Example: Adding "Guardian" produces:
> *"This applicant is expected to be ONLY in one of these roles: Beneficiary, Guardian, Tenant-Style"*

---

## 4. Component Details

### 4.1 `DaoComplianceRules.cls`

Central Apex class. All compliance logic lives here.

```apex
// Returns List<String> of active primary document types for LWC wire + validation
@AuraEnabled(cacheable=true)
public static List<String> getPrimaryDocumentTypesList()

// Returns comma-separated bypass role labels for LWC checkbox text
@AuraEnabled(cacheable=true)
public static String getBypassRolesText()

// Returns List<String> of business types where Tax ID is NOT required
@AuraEnabled(cacheable=true)
public static List<String> getNoTaxIdBusinessTypes()

// Returns true when Tax ID is required for the given business type
public static Boolean isTaxIdRequiredForBusinessType(String businessType)

// Returns error message string if docs fail (1 Primary OR 2 Secondary) rule; null if valid
public static String validateIdentityDocuments(List<Object> identityDocsPayload)
```

### 4.2 `daoApplicantDetails` (Primary Applicant)

**Wires used:**
- `getBypassRolesText` → `_bypassRolesText` → `intakeBypassLabel` getter
- `getPrimaryDocumentTypesList` → `_primaryDocumentTypes` → `cipRequirementMessage` getter

**Key properties:**
- `intakeBypassIdDocs` — boolean, set when bypass checkbox is checked
- `_primaryDocumentTypes` — List from CMDT, used for validation and banner text

**Validation flow (`validate()`):**
1. If `intakeBypassIdDocs` is `true` → skip ID document validation
2. Otherwise call `validateIdentityDocumentRequirement(this.identityDocuments)`
3. `validateIdentityDocumentRequirement` uses `_primaryDocumentTypes` (from CMDT wire) to determine primary vs secondary; falls back to `["driver's license", "passport"]` if wire hasn't resolved

**Bypass checkbox label** (dynamic from CMDT):
```
"This applicant is expected to be ONLY in one of these roles: Beneficiary, Tenant-Style"
```

**CIP banner** (dynamic from CMDT):
```
"CIP Requirement: Provide 1 Primary ID (Driver's License, Passport, State ID) or 2 Secondary IDs"
```

### 4.3 `daoAdditionalApplicants` (Additional Applicants)

Same pattern as `daoApplicantDetails` plus:

**Additional wires:**
- `getNoTaxIdBusinessTypes` → `_noTaxIdBusinessTypes` → `businessTaxIdRequired` getter

**For Individual applicants:**
- Bypass checkbox (`intakeBypassIdDocs`) hides/skips both ID document and Tax ID validation
- `validateIdentityDocumentRequirement` uses `_primaryDocumentTypes` from CMDT

**For Business applicants:**
- `businessTaxIdRequired` getter checks if current `businessType` is in `_noTaxIdBusinessTypes`
- Tax ID `required` attribute on the input is driven by `businessTaxIdRequired`

### 4.4 `DaoWizardPersistenceService.cls`

Server-side enforcement ensures API/bypass cannot submit invalid data.

**`upsertApplicantStep`:**
- Stores `Intake_Bypass_IdDocs__c` and `Intake_Bypass_TaxId__c` from payload
- If `Intake_Bypass_IdDocs__c` is false → calls `DaoComplianceRules.validateIdentityDocuments()` on the payload; throws validation error if invalid

**`upsertAdditionalStep`:**
- Same bypass flag storage and validation per individual applicant
- For business applicants: checks `DaoComplianceRules.isTaxIdRequiredForBusinessType()` before requiring Tax ID

**`DaoWizardDataService.handleApplicationForm`:**
- Loads `Intake_Bypass_IdDocs__c` and `Intake_Bypass_TaxId__c` from Applicant records
- Maps them into `ApplicantInfoDTO.intakeBypassIdDocs` and `intakeBypassTaxId` for resume

---

## 5. Payload Contract

Both LWC components include these fields in their payload:

```json
{
  "intakeBypassIdDocs": true,
  "intakeBypassTaxId": true
}
```

Both are set to the same value (one checkbox controls both). The server stores
each independently in case the rules diverge in a future release.

---

## 6. Configuration How-Tos

### Add a new Primary ID document type
1. Navigate to **Setup → Custom Metadata Types → DAO Primary Document → Manage Records**
2. Click **New**
3. Set `IdType__c` to the exact `IdentityDocument.IdDocumentType` picklist value (case-sensitive match)
4. Check `Active__c`
5. Save — no deployment needed

### Add an exempt business type (no Tax ID required)
1. Navigate to **Setup → Custom Metadata Types → DAO Business Type Tax Rule → Manage Records**
2. Click **New**
3. Set `BusinessType__c` to the exact `Applicant.BusinessEntityType` picklist value
4. Uncheck `TaxIdRequired__c`
5. Save — no deployment needed

### Add a new intake bypass role
1. Navigate to **Setup → Custom Metadata Types → DAO Applicant Role Compliance → Manage Records**
2. Click **New**
3. Set `Label__c` to the display name (appears verbatim in the bypass checkbox text)
4. Set `RoleApiName__c` to the role's API value
5. Check `AllowIntakeBypass__c`
6. Set `RequireIdDocs__c = false` and `RequireTaxId__c = false`
7. Save — the wizard checkbox text updates automatically

---

## 7. Known Constraints

- The bypass checkbox applies to **both** Tax ID and ID document requirements simultaneously. If future requirements need them decoupled, the Apex fields (`Intake_Bypass_IdDocs__c` / `Intake_Bypass_TaxId__c`) already support that — only the single LWC checkbox would need to be split.
- Primary document type matching is **case-insensitive** in validation (both CMDT values and user input are `.toLowerCase()` compared) but the `CMDT.IdType__c` value **must match** the exact picklist label in `IdentityDocument.IdDocumentType`.
- `getWizardData` is intentionally **not** marked `cacheable=true` to ensure every resume fetches fresh data from the server.
