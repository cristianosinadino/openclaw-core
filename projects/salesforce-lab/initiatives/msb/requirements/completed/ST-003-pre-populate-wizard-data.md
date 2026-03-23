<!-- 
🔴 AI AGENTS: READ FIRST - /docs/01-foundation/data-model.md for correct object names
✅ Correct: ApplicationForm, Applicant, Account (Business), AccountContactRelation, Opportunity
❌ Wrong: Application__c, Applicant__c, Loan__c, Business_Relationship__c
-->

# ST-003: Populate Existing Data from Entry Points

**Story ID**: ST-003  
**Work Item**: SVC-003, LWC-003  
**Status**: ✅ Complete (QA Pending)  
**Created**: 2025-11-05  
**Last Updated**: 2025-11-12  
**Implementation Notes**: See `docs/04-implementation/session-notes/2025-11-12-st-003-prepopulation-complete.md`

## 🎫 JIRA Story Mapping

| JIRA Story | Title | Status | Link |
|------------|-------|--------|------|
| MSB-24 | Pre-populate Wizard Data from Entry Points | In Progress | [View Story](https://zennify.atlassian.net/browse/MSB-24) |

> **Note**: Use the JIRA links above for detailed acceptance criteria, comments, and status updates. This document provides technical implementation details.

---

## 📋 Story Overview

**As a** User  
**I want** to be able to start an application form from an Opportunity or Account record and have the system pre-fill information based on the linked account data  
**So that** I can have a seamless experience in entering information without re-entering data that already exists in Salesforce

---

## 🎯 Acceptance Criteria

### Entry Point Detection
- [x] Wizard identifies the source object type (Opportunity, Account) from `recordId`
- [x] Wizard identifies if Account is Business or Person Account type

### Entry Point 1: Opportunity → Business Account
- [x] Query Business Account via `Opportunity.AccountId`
- [x] Populate Business Information step from Account data using field mappings
- [x] Query Primary Contact via `Account.FinServ__PrimaryContact__c` lookup (ContactId from PersonAccount)
- [x] If Primary Contact exists, populate Personal Information step from Contact/PersonAccount data
- [x] If no Primary Contact, skip primary applicant population
- [x] **Do NOT populate Additional Applicants** (deferred to future story)

### Entry Point 2: Opportunity → Person Account
- [x] Query Person Account via `Opportunity.AccountId`
- [x] Skip Business Information step (not applicable)
- [x] Populate Personal Information step directly from Person Account data
- [x] **Do NOT populate Additional Applicants** (deferred to future story)

### Entry Point 3: Account → Direct Launch
- [x] If Business Account:
  - [x] Populate Business Information step from Account data
  - [x] Query Primary Contact via `Account.FinServ__PrimaryContact__c` (ContactId from PersonAccount)
  - [x] Populate Personal Information step from Primary Contact if exists
- [x] If Person Account:
  - [x] Skip Business Information step
  - [x] Populate Personal Information step from Person Account data
- [x] **Do NOT populate Additional Applicants** (deferred to future story)


### Technical Requirements
- [x] All queries enforce CRUD/FLS with `WITH USER_MODE`
- [x] Service method returns structured DTO with Business, Primary Applicant, and Additional Applicants data
- [x] Handle errors gracefully with user-friendly messages
- [x] Unit tests ≥85% coverage on new Apex service
- [ ] Deployed to `msb-sbox` and verified with test records (QA in progress)

### Important Notes
- **Additional Applicants**: Only populated from ApplicationForm entry point (Entry Point 4)
- **Primary Contact Field**: `Account.FinServ__PrimaryContact__c` contains the ContactId from a PersonAccount record (PersonAccount has both AccountId and ContactId)
- **Account vs Opportunity vs ApplicationForm**: Each entry point has different data availability and population rules

---

## 🛠️ Tasks and Sub-Tasks

1. [x] Design Data Transfer Objects (DTOs)
   - [x] 1.1 Create `WizardDataDTO` with nested structures:
     - `BusinessInfoDTO` (Account fields - nullable for Person Account scenarios)
     - `ApplicantInfoDTO` (Contact/PersonAccount fields - nullable if no primary contact)
     - Additional Applicants (deferred to future story)
   - [x] 1.2 Map DTO fields to wizard step field names using field mappings
   - [x] 1.3 Document field mappings in code comments
   - [x] 1.4 Add metadata fields: `entryPointType`, `accountType`, `hasPrimaryContact`, `hasBusinessInfo`, `hasApplicantInfo`

2. [x] Implement Apex: `WizardDataService`
   - [x] 2.1 Create `@AuraEnabled` method `getWizardData(Id recordId, String wizardApiName)`
   - [x] 2.2 Determine object type from `recordId` (Opportunity vs Account)
   - [x] 2.3 If Opportunity:
     - [x] 2.3.1 Query Opportunity with AccountId
     - [x] 2.3.2 Determine if Account is Business or Person Account
     - [x] 2.3.3 Route to appropriate handler method
     - [x] 2.3.4 Do NOT populate Additional Applicants
   - [x] 2.4 If Account:
     - [x] 2.4.1 Determine if Business or Person Account
     - [x] 2.4.2 Route to appropriate handler method
     - [x] 2.4.3 Do NOT populate Additional Applicants
   - [x] 2.6 Enforce CRUD/FLS on all queries with `WITH USER_MODE`
   - [x] 2.7 Handle errors and return structured error messages

3. [x] Implement Business Account handler
   - [x] 3.1 Query Account with all fields from field mapping documents
   - [x] 3.2 Query Primary Contact via `FinServ__PrimaryContact__c` lookup
   - [x] 3.3 Map Account fields to BusinessInfoDTO
   - [x] 3.4 Map Contact/PersonAccount fields to ApplicantInfoDTO (if exists)
   - [x] 3.5 Handle null Primary Contact gracefully

4. [x] Implement Person Account handler
   - [x] 4.1 Query Person Account with all fields from Primary Applicant mapping
   - [x] 4.2 Map PersonAccount fields to ApplicantInfoDTO
   - [x] 4.3 Return null BusinessInfoDTO (not applicable)

5. [x] Implement field mapping logic
   - [x] 5.1 Map Account fields to Business Information step fields
   - [x] 5.2 Map PersonAccount fields to Personal Information step fields
   - [x] 5.3 Handle compound address fields (BillingStreet, PersonMailingStreet)
   - [x] 5.4 Document unmapped fields and reasons in code comments

6. [x] Update `WizardPersistenceService` (if needed)
   - [x] 6.1 Review current persistence logic for Business and Personal Information steps
   - [x] 6.2 Ensure compatibility with pre-populated data
   - [x] 6.3 Add logic to handle partial updates vs. full creates

7. [x] Update LWC: Wizard Container
   - [x] 7.1 On component initialization, call `WizardDataService.getWizardData(recordId)`
   - [x] 7.2 Store returned DTO in component state
   - [x] 7.3 Conditionally show/hide Business Information step based on `accountType`
   - [x] 7.4 Pass Business data to Business Information step (if applicable)
   - [x] 7.5 Pass Primary Applicant data to Personal Information step (if exists)

8. [x] Update step LWCs to accept pre-populated data
   - [x] 8.1 Update Business Information step to accept and bind pre-populated Account data
   - [x] 8.2 Update Personal Information step to accept and bind pre-populated PersonAccount data
   - [x] 8.3 Handle null/empty data gracefully (show empty form)

9. [x] Unit testing
    - [x] 9.1 Test Entry Point 1: Opportunity → Business Account (with Primary Contact)
    - [x] 9.2 Test Entry Point 1: Opportunity → Business Account (without Primary Contact)
    - [x] 9.3 Test Entry Point 2: Opportunity → Person Account
    - [x] 9.4 Test Entry Point 3: Business Account direct launch
    - [x] 9.5 Test Entry Point 3: Person Account direct launch
    - [x] 9.6 Test CRUD/FLS enforcement (via WITH USER_MODE)
    - [x] 9.7 Test error handling (invalid recordId, no Account, etc.)
    - [x] 9.8 Ensure ≥85% code coverage (100% achieved)

10. [x] Documentation
    - [x] 10.1 Document field mapping decisions in session notes
    - [x] 10.2 Update data model documentation if needed
    - [x] 10.3 Add code comments explaining entry point routing logic
    - [x] 10.4 Document Additional Applicants population (ApplicationForm only)

---

## 🔧 Technical Implementation

### Objects Involved
- **Opportunity** (Standard) – Entry point source record
- **Account** (Business) – Business information source
- **Account** (PersonAccount) – Personal information source for individual customers
- **Contact** (Standard) – Primary Contact for Business Accounts (via `FinServ__PrimaryContact__c`) // Note the field will have the ContactId from the PersonAccount record which is composed by both AccountId and ContactId
- **ApplicationForm** (FSC) – Target for wizard data (no changes in this story)

### Key Fields

#### Opportunity
- `Id`
- `AccountId` (lookup to Account - Business or Person)

#### Account (Business)
- `Id`
- `IsPersonAccount` (false)
- `Type` (Business Type: Corporation, LLC, Partnership, etc.)
- `FinServ__PrimaryContact__c` (lookup to Contact)
- **All fields from ST-004 Business Details mapping**:
  - `Name`, `Type`, `YearStarted`, `NumberOfEmployees`, `Industry`, `Website`, `Description`
  - `Phone`, `BillingStreet`, `BillingCity`, `BillingState`, `BillingPostalCode`, `BillingCountry`
  - `FinServ__TaxID__c`, `Business_Email__c`, `Business_Home_Phone__c`, `Business_Mobile_Phone__c`, `Business_Tax_ID_Type__c`

#### Account (PersonAccount)
- `Id`
- `IsPersonAccount` (true)
- **All fields from ST-004 Primary Applicant mapping**:
  - `FirstName`, `LastName`, `PersonEmail`, `PersonMobilePhone`, `PersonBirthdate`
  - `FinServ__TaxID__pc`, `PersonMailingStreet`, `PersonMailingCity`, `PersonMailingState`, `PersonMailingPostalCode`, `PersonMailingCountry`

#### Contact (Primary Contact for Business) // Note the Account.Finserv__PrimaryContact__c  field will have the ContactId from the PersonAccount record which is composed by both AccountId and ContactId
- `Id`
- **All fields from ST-004 Primary Contact mapping**:
  - `FirstName`, `LastName`, `Email`, `MobilePhone`, `Birthdate`
  - `MailingStreet`, `MailingCity`, `MailingState`, `MailingPostalCode`

### Apex Classes
- `WizardDataService.cls` (new)
- `WizardDataDTO.cls` (new - inner classes for nested structure)
- `WizardDataServiceTest.cls` (new)
- `WizardPersistenceService.cls` (potential updates)

### LWC Components
- Wizard Container (updates to fetch and pass data, conditionally show steps)
- Business Information step (updates to accept pre-populated data)
- Personal Information step (updates to accept pre-populated data)

### Query Strategy

```apex
// Pseudo-code for WizardDataService
public static WizardDataDTO getWizardData(Id recordId) {
    // 1. Determine object type
    String objectType = recordId.getSObjectType().getDescribe().getName();
    
    if (objectType == 'Opportunity') {
        // 2. Query Opportunity to get AccountId
        Opportunity opp = [SELECT AccountId FROM Opportunity WHERE Id = :recordId WITH USER_MODE];
        
        // 3. Query Account to determine type
        Account acc = [SELECT Id, IsPersonAccount FROM Account WHERE Id = :opp.AccountId WITH USER_MODE];
        
        if (acc.IsPersonAccount) {
            // Entry Point 2: Opportunity → Person Account
            return handlePersonAccount(acc.Id);
        } else {
            // Entry Point 1: Opportunity → Business Account
            return handleBusinessAccount(acc.Id);
        }
    }
    
    if (objectType == 'Account') {
        // 4. Query Account to determine type
        Account acc = [SELECT Id, IsPersonAccount FROM Account WHERE Id = :recordId WITH USER_MODE];
        
        if (acc.IsPersonAccount) {
            // Entry Point 3: Person Account direct
            return handlePersonAccount(acc.Id);
        } else {
            // Entry Point 3: Business Account direct
            return handleBusinessAccount(acc.Id);
        }
    }
    
    // ApplicationForm or other - return empty DTO
    return new WizardDataDTO();
}

private static WizardDataDTO handleBusinessAccount(Id accountId) {
    // Query Business Account with all fields from ST-004 mapping
    Account businessAccount = [
        SELECT Id, Name, Type, YearStarted, NumberOfEmployees, Industry, Website, Description,
               Phone, BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry,
               FinServ__TaxID__c, Business_Email__c, Business_Home_Phone__c, 
               Business_Mobile_Phone__c, Business_Tax_ID_Type__c,
               FinServ__PrimaryContact__c
        FROM Account 
        WHERE Id = :accountId 
        WITH USER_MODE
    ];
    
    // Query Primary Contact if exists
    Contact primaryContact = null;
    if (businessAccount.FinServ__PrimaryContact__c != null) {
        primaryContact = [
            SELECT Id, FirstName, LastName, Email, MobilePhone, Birthdate,
                   MailingStreet, MailingCity, MailingState, MailingPostalCode
            FROM Contact 
            WHERE Id = :businessAccount.FinServ__PrimaryContact__c 
            WITH USER_MODE
        ];
    }
    
    return new WizardDataDTO(businessAccount, primaryContact);
}

private static WizardDataDTO handlePersonAccount(Id accountId) {
    // Query Person Account with all fields from ST-004 mapping
    Account personAccount = [
        SELECT Id, FirstName, LastName, PersonEmail, PersonMobilePhone, PersonBirthdate,
               FinServ__TaxID__pc, PersonMailingStreet, PersonMailingCity, 
               PersonMailingState, PersonMailingPostalCode, PersonMailingCountry
        FROM Account 
        WHERE Id = :accountId 
        WITH USER_MODE
    ];
    
    return new WizardDataDTO(personAccount);
}
```

### Field Mapping Tables (from ST-004)

#### Business Account → Business Details

| Account Field API | Business Details Component Field | Notes |
|------------------|----------------------------------|-------|
| `Name` | `businessName` | Organization name |
| `Type` | `businessType` | LLC, Corp, Partnership, etc. |
| `FinServ__TaxID__c` | `taxId` | EIN (encrypted) |
| `Phone` | `businessPhone` | Primary business phone |
| `BillingStreet` | `businessStreet` | Combine Line 1 + Line 2 |
| `BillingCity` | `businessCity` | |
| `BillingState` | `businessState` | |
| `BillingPostalCode` | `businessPostalCode` | |
| `Industry` | `industryType` | Industry picklist |
| `Website` | `businessWebsite` | |

#### Person Account → Primary Applicant

| Account Field API | Applicant Details Component Field | Notes |
|------------------|-----------------------------------|-------|
| `FirstName` | `firstName` | |
| `LastName` | `lastName` | |
| `PersonEmail` | `email` | |
| `PersonMobilePhone` | `phone` | Prefer mobile over home |
| `PersonBirthdate` | `dateOfBirth` | |
| `FinServ__TaxID__pc` | `ssn` | Masked display |
| `PersonMailingStreet` | `mailingStreet` | |
| `PersonMailingCity` | `mailingCity` | |
| `PersonMailingState` | `mailingState` | |
| `PersonMailingPostalCode` | `mailingPostalCode` | |

#### Contact → Primary Applicant // Note th Account.Finserv__PrimaryContact__c field will have the ContactId from the PersonAccount record which is composed by both AccountId and ContactId

| Contact Field API | Applicant Details Component Field | Notes |
|------------------|-----------------------------------|-------|
| `FirstName` | `firstName` | |
| `LastName` | `lastName` | |
| `Email` | `email` | |
| `MobilePhone` | `phone` | |
| `Birthdate` | `dateOfBirth` | |
| `MailingStreet` | `mailingStreet` | |
| `MailingCity` | `mailingCity` | |
| `MailingState` | `mailingState` | |
| `MailingPostalCode` | `mailingPostalCode` | |

### Implementation Notes
- Use `WITH USER_MODE` for all SOQL queries to enforce CRUD/FLS
- Handle compound address fields (BillingStreet, PersonMailingStreet, MailingStreet) by splitting on newline
- `FinServ__PrimaryContact__c` is a standard FSC lookup field on Account
- If Primary Contact is null, return DTO with null PrimaryApplicantDTO
- Wizard container should conditionally show Business Information step based on account type

---

## 🧪 Testing Requirements

### Apex Unit Tests (≥85% coverage on `WizardDataService`)

**Entry Point 1: Opportunity → Business Account**
- [x] Test with Business Account and Primary Contact populated
- [x] Test with Business Account but no Primary Contact (null `FinServ__PrimaryContact__c`)
- [x] Verify all Business Details fields are mapped correctly
- [x] Verify Primary Contact fields are mapped correctly

**Entry Point 2: Opportunity → Person Account**
- [x] Test with Person Account
- [x] Verify BusinessInfoDTO is null
- [x] Verify Person Account fields are mapped to ApplicantInfoDTO correctly

**Entry Point 3: Account Direct Launch**
- [x] Test with Business Account (with Primary Contact)
- [x] Test with Business Account (without Primary Contact)
- [x] Test with Person Account
- [x] Verify correct routing and field mapping

**Error Handling**
- [x] Test with null recordId (returns message)
- [x] Test CRUD/FLS enforcement (via WITH USER_MODE)
- [x] Test null/missing Account scenarios

**LWC Tests**
- [x] Data binding implemented in wizard container
- [x] Conditional Business Information step visibility implemented

---

## 📦 Deployment

- [x] Add new Apex classes to `package.xml`
- [ ] Deploy to `msb-sbox` (in progress)
- [ ] Create test data for all entry points:
  - **Entry Point 1**: Business Account with `FinServ__PrimaryContact__c` populated → Opportunity
  - **Entry Point 2**: Person Account → Opportunity
  - **Entry Point 3**: Business Account (standalone)
  - **Entry Point 3**: Person Account (standalone)
- [ ] Verify wizard pre-populates correctly for each scenario (QA testing)
- [ ] Verify Business Information step is hidden for Person Account scenarios (QA testing)

---

## 📝 Implementation Notes

### Current Phase
- This story focuses on **data retrieval and population**, not persistence
- Field mappings use **ST-004 as source of truth**
- Primary Contact determined via `FinServ__PrimaryContact__c` lookup field
- Business Information step is **conditionally shown** based on account type
- ST-002 handles data persistence; this story focuses on pre-population

### Deferred to Future Phase 🔮
- **AccountContactRelations (ACRs)**: Not used in this phase
- **Additional Applicants**: Will be handled via ACRs in future story
- **ACR Role-based identification**: Deferred for future implementation
- Keep ACR references in code comments for future development

### Field Mapping Reference
- All field mappings documented in ST-004 Solution Design section
- Compound address fields (BillingStreet, PersonMailingStreet, MailingStreet) require special handling
- See `/docs/01-foundation/business-account-field-mapping.md` for Business Account details
- See `/docs/01-foundation/personaccount-address-mapping.md` for Person Account details

---

## 🔗 Dependencies

- **Depends on**: ST-001 (Wizard Foundation), ST-002 (Persist Application Data)
- **Merged from**: ST-004 (MSB-24 - Create New Application Form)
- **Future**: Additional Applicants functionality via ACRs

---

## ✅ Definition of Done

- [x] `WizardDataService` implemented and tested
- [x] DTOs created with proper field mappings from ST-004
- [x] All 3 entry points supported and tested
- [x] Wizard container fetches and passes data to steps
- [x] Business Information step pre-populates from Business Account (when applicable)
- [x] Personal Information step pre-populates from Primary Contact or Person Account
- [x] Business Information step is hidden for Person Account scenarios
- [x] All queries enforce CRUD/FLS with `WITH USER_MODE`
- [x] Unit tests ≥85% coverage for all entry points (100% achieved)
- [ ] Deployed to `msb-sbox` and verified with test data for all scenarios (QA in progress)
- [x] Session notes added documenting field mappings and design decisions
- [x] ACR functionality documented as deferred to future phase

---

## 🔗 Related Issues

**Epic**: Application Framework & User Experience  
**JIRA Link**: https://zennify.atlassian.net/browse/MSB-24  
**Related Stories**: ST-001 (Wizard Foundation), ST-002 (Persist Application Data)  
**Assigned To**: [Developer Name]
