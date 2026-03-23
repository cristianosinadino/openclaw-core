<!-- 
🔴 AI AGENTS: READ FIRST - /docs/01-foundation/data-model.md for correct object names
✅ Correct: ApplicationForm, Applicant, Account (Business), AccountContactRelation, Opportunity
❌ Wrong: Application__c, Applicant__c, Loan__c, Business_Relationship__c
-->

# ST-002: Persist Application Data

**Story ID**: ST-002  
**Work Item**: SVC-002, LWC-002  
**Status**: Not Started  
**Created**: 2025-11-05  
**Last Updated**: 2025-11-11

## 🎫 JIRA Story Mapping

| JIRA Story | Title | Status | Link |
|------------|-------|--------|------|
| TBD | Persist Application Data | Not Started | TBD |

> **Note**: JIRA story not yet created. Please create and update this section with the JIRA link for agent reference.

---

## 📋 Story Overview

**As a** Salesforce user completing a Deposit Account Opening wizard  
**I want** my application data to be persisted to Salesforce when I click Save & Exit, Next, or Submit  
**So that** my progress is saved and I can resume later or complete the application

---

## 🎯 Acceptance Criteria

### ApplicationForm Management
- [ ] Create ApplicationForm record on first step if `applicationId` is null
- Depending on the Parent Object entry point:
  - [ ] Link ApplicationForm to Opportunity via `OpportunityId` lookup field
  - [ ] Link ApplicationForm to Business Account via `AccountId` lookup field
- [ ] Update ApplicationForm fields from wizard payload as applicable

### Business Information Step Persistence
- [ ] When Business Information step is saved:
  - [ ] Upsert Business Account (Account object with `IsPersonAccount = false`)
  - [ ] Map all 20 wizard fields to Account fields (see field mapping docs)
  - [ ] Handle compound address field (`BillingStreet` = Line1 + '\n' + Line2)
  - [ ] Link Account to ApplicationForm via `ApplicationForm.AccountId`
  - [ ] If Business Account( `IsPersonAccount = false`) exists (from Opportunity), update it; otherwise create new

### Personal Information Step Persistence
- [ ] When Personal Information step is saved:
  - [ ] Create or update Applicant record
  - [ ] Create or update PersonAccount (Account with `IsPersonAccount = true`)
  - [ ] Map all 27 wizard fields to Applicant and PersonAccount fields
  - [ ] Handle compound address field (`PersonMailingStreet` = Line1 + '\n' + Line2)
  - [ ] Link Applicant to ApplicationForm via `Applicant.ApplicationFormId`
  - [ ] Link Applicant to PersonAccount via `Applicant.AccountId`

### Additional Applicants Step Persistence
- [ ] When Additional Applicants step is saved:
  - [ ] For each additional applicant in payload:
    - [ ] Create or update Applicant record
    - [ ] Create or update PersonAccount
    - [ ] Map applicant fields to Applicant and PersonAccount
    - [ ] Link Applicant to ApplicationForm
    - [ ] Link Applicant to PersonAccount

### Conditional Persistence
- [ ] Handle partial data scenarios:
  - [ ] If Business Information not yet completed, skip Business Account upsert
  - [ ] If Personal Information not yet completed, skip Primary Applicant creation
  - [ ] If Additional Applicants not yet completed, skip additional applicant creation
- [ ] Persist only the data available up to the current step

### Error Handling & Security
- [ ] All DML operations enforce CRUD/FLS with `WITH USER_MODE` or `Security.stripInaccessible()`
- [ ] Return structured error messages for DML failures
- [ ] Handle duplicate detection for PersonAccounts (by email or external ID)
- [ ] Handle relationship integrity (e.g., can't create ACR without both Account and Contact)

### Testing & Deployment
- [ ] Unit tests ≥85% coverage on `WizardPersistenceService`
- [ ] Integration tests for full wizard flow (all steps)
- [ ] Deployed to `msb-sbox` and verified end-to-end

---

## 🛠️ Tasks and Sub-Tasks

### 1. Update ApplicationForm Creation Logic
- [ ] 1.1 Modify `WizardPersistenceService.createApplicationForm()` to accept Opportunity ID Or Account ID
- [ ] 1.2 Set `ApplicationForm.OpportunityId` from wizard context
- [ ] 1.3 Set `ApplicationForm.AccountId` from wizard context orafter Business Account is created/updated
- [ ] 1.4 Add error handling for missing Opportunity

### 2. Implement Business Information Step Persistence
- [ ] 2.1 Update `upsertBusinessStep()` to create/update Account
- [ ] 2.2 Map all 20 wizard fields to Account fields
- [ ] 2.3 Handle compound address field (combine Line1 + '\n' + Line2)
- [ ] 2.4 Query existing Account by `Id` (from Opportunity) or create new
- [ ] 2.5 Upsert Account with CRUD/FLS checks
- [ ] 2.6 Update `ApplicationForm.AccountId` after Account upsert
- [ ] 2.7 Return Account ID in `PersistenceResponse.savedIds`

### 3. Implement Personal Information Step Persistence
- [ ] 3.1 Update `upsertApplicantStep()` to create/update Applicant + PersonAccount + ACR
- [ ] 3.2 Map wizard fields to Applicant object
- [ ] 3.3 Map wizard fields to PersonAccount object
- [ ] 3.4 Handle compound address field for PersonAccount
- [ ] 3.5 Query existing PersonAccount by email or external ID, or create new
- [ ] 3.6 Upsert PersonAccount with CRUD/FLS checks
- [ ] 3.7 Create/update Applicant record and link to PersonAccount
- [ ] 3.8 Upsert Applicant with CRUD/FLS checks
- [ ] 3.9 Return Applicant ID, PersonAccount ID

### 4. Implement Additional Applicants Step Persistence
- [ ] 4.1 Update `upsertAdditionalStep()` to handle list of additional applicants
- [ ] 4.2 For each applicant: create/update PersonAccount, Applicant, and ACR
- [ ] 4.3 Handle bulk DML operations efficiently
- [ ] 4.4 Return list of created/updated IDs

### 5. Implement Conditional Persistence Logic
- [ ] 5.1 Add step dependency checks
- [ ] 5.2 Store step completion status
- [ ] 5.3 Skip dependent operations if prerequisite data is missing
- [ ] 5.4 Log warnings for skipped operations

### 6. Enhance Error Handling
- [ ] 6.1 Add try-catch blocks for each DML operation
- [ ] 6.2 Return detailed error messages with field names
- [ ] 6.3 Handle CRUD/FLS violations gracefully
- [ ] 6.4 Add logging for debugging

### 7. Update Frontend Integration
- [ ] 7.1 Update `daoWizardContainer.js` to pass Opportunity ID to backend
- [ ] 7.2 Handle `PersistenceResponse.savedIds` and update component state
- [ ] 7.3 Display success/error messages to user
- [ ] 7.4 Update ApplicationForm ID after first step persistence

### 8. Unit Testing
- [ ] 8.1 Test ApplicationForm creation with Opportunity link
- [ ] 8.2 Test Business Account upsert (create and update scenarios)
- [ ] 8.3 Test Primary Applicant creation (Applicant + PersonAccount + ACR)
- [ ] 8.4 Test Additional Applicants creation
- [ ] 8.5 Test conditional persistence
- [ ] 8.6 Test error handling
- [ ] 8.7 Test compound address field handling
- [ ] 8.8 Ensure ≥85% code coverage

### 9. Integration Testing
- [ ] 9.1 Test full wizard flow
- [ ] 9.2 Test Save & Exit and resume
- [ ] 9.3 Test with existing Opportunity and Account
- [ ] 9.4 Test with new Opportunity
- [ ] 9.5 Verify all relationships

### 10. Documentation
- [ ] 10.1 Document field mapping decisions
- [ ] 10.2 Update data model documentation
- [ ] 10.3 Add code comments
- [ ] 10.4 Document error handling patterns

### 11. Deployment & Verification
- [ ] 11.1 Update `package.xml`
- [ ] 11.2 Deploy to `msb-sbox`
- [ ] 11.3 Create test Opportunity
- [ ] 11.4 Complete wizard end-to-end
- [ ] 11.5 Verify all relationships

---

## 🔧 Technical Implementation

### Objects Involved
- **ApplicationForm** (FSC) – Primary application record
- **Opportunity** (Standard) – Source context for wizard launch
- **Account** (Business) – Business information
- **Account** (PersonAccount) – Personal information for applicants
- **Applicant** (FSC) – Applicant records linked to ApplicationForm
- **AccountContactRelation** (Standard) – Links PersonAccounts to Business Account

### Key Relationships

```
Opportunity
    ↓ (OpportunityId lookup)
ApplicationForm
    ↓ (AccountId lookup)
Account (Business)
    ↓ (AccountContactRelation)
Account (PersonAccount) ← Applicant (AccountId lookup)
    ↑ (ApplicationFormId lookup)
ApplicationForm
```

### Field Mappings

#### Business Information → Account
See `/docs/01-foundation/business-account-field-mapping.md`

#### Personal Information → Applicant + PersonAccount
See `/docs/01-foundation/personaccount-address-mapping.md`

### Important Notes
- **Always have a Business Account** tied to Opportunity
- **May or may not have ACRs** on Business Account (Personal/Additional Applicants data may be empty)
- When Business Account exists, **upsert it**
- When Primary/Additional Applicants exist (via ACRs), **upsert Applicant, PersonAccount, and ACRs**
- **Depending on step, data may be missing** (e.g., if Save & Exit from Business step, Additional Applicant data is missing)
- Use `WITH USER_MODE` for all SOQL queries
- Use `Security.stripInaccessible()` for DML operations
- Handle compound address fields by combining Line1 + '\n' + Line2

---

## 🧪 Testing Requirements

### Unit Tests (≥85% coverage)
- [ ] ApplicationForm creation with Opportunity link
- [ ] Business Account upsert (create and update)
- [ ] Primary Applicant creation with and without Business Account
- [ ] Additional Applicants creation
- [ ] Conditional persistence with missing prerequisites
- [ ] Error handling (CRUD/FLS, DML exceptions)
- [ ] Compound address field handling

### Integration Tests
- [ ] End-to-end wizard completion
- [ ] Save & Exit and resume at each step
- [ ] Wizard from Opportunity with existing Account
- [ ] Wizard from Opportunity without existing Account

---

## 📦 Deployment

- [ ] Update `package.xml` with modified Apex classes
- [ ] Deploy to `msb-sbox`
- [ ] Create test data (Opportunity with/without Business Account)
- [ ] Verify wizard creates all records and relationships correctly

---

## 📝 Implementation Notes

- This story implements the core persistence logic for the wizard
- Field mappings are documented in `/docs/01-foundation/` folder
- Compound address fields require special handling (Line1 + '\n' + Line2)
- ACR creation is conditional on Business Account existence
- PersonAccount duplicate detection should use email or external ID
- Consider using Database.upsert with external ID fields for idempotency

---

## 🔗 Dependencies

- **Depends on**: ST-001 (Wizard Foundation must be complete)
- **Blocks**: ST-003 (Pre-populate Wizard Data - will use the persistence logic from this story)

---

## ✅ Definition of Done

- [ ] ApplicationForm creation logic updated with Opportunity link
- [ ] Business Account upsert implemented and tested
- [ ] Primary Applicant creation implemented (Applicant + PersonAccount + ACR)
- [ ] Additional Applicants creation implemented
- [ ] Conditional persistence logic implemented
- [ ] All queries enforce CRUD/FLS with `WITH USER_MODE`
- [ ] Error handling returns structured error messages
- [ ] Unit tests ≥85% coverage
- [ ] Integration tests pass for full wizard flow
- [ ] Deployed to `msb-sbox` and verified end-to-end
- [ ] Session notes added documenting persistence logic and design decisions

---

**Assigned To**: [Developer Name]  
**Related Stories**: ST-001 (Wizard Foundation), ST-003 (Pre-populate Wizard Data), ST-004 (Additional Applicants Typeahead)
