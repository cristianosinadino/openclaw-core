<!-- 
🔴 AI AGENTS: READ FIRST - /docs/01-foundation/data-model.md and docs/01-foundation/field-mappings.csv for correct object names
✅ Correct: ApplicationForm, Applicant, Account (Business), FinancialAccount, NAICS_Code__c
❌ Wrong: Application__c, Applicant__c, Loan__c, Business_Relationship__c
-->

# ST-004: Capture Application Details

**Story ID**: ST-004  
**Work Item**: LWC-004, SVC-004  
**Status**: In Progress  
**Created**: 2025-11-11  
**Last Updated**: 2025-11-11

## 🎫 JIRA Story Mapping

| JIRA Story | Title | Status | Link |
|------------|-------|--------|------|
| MSB-26 | Capture Business Details in Guided Intake | Ready for Dev | [View Story](https://zennify.atlassian.net/browse/MSB-26) |
| TBD | Capture Additional Applicants Details | Not Started | TBD |
| TBD | Capture Product Selection Details | Not Started | TBD |

> **Note**: This requirement encompasses multiple JIRA stories for capturing various application details. Initial implementation focuses on MSB-26 (Business Details).

---

## 📋 Story Overview

**As a** Banker User completing a Deposit Account Opening application  
**I want** to capture complete business, applicant, and product information through guided wizard steps  
**So that** all required data for account opening and KYC/CIP compliance is collected accurately and efficiently

---

## 🎯 Acceptance Criteria

### Business Details Step (MSB-26)
- [ ] Business Intake screen renders with all required fields
- [ ] All validation rules enforce data quality before proceeding
- [ ] Business data persists to Applicant record (Type = 'Organization')
- [ ] Existing business toggle allows linking to existing Account
- [ ] New business data flags Account for creation on submission
- [ ] Tax ID is encrypted in storage
- [ ] NAICS Code lookup integration works correctly
- [ ] Primary Contact can be linked to existing Contact or entered as new
- [ ] All inline validation errors display correctly
- [ ] Step completion updates `ApplicationForm.StepKey__c`

### Additional Applicants Step (Future)
- [ ] Additional applicants can be added dynamically
- [ ] Each applicant creates Applicant + PersonAccount + ACR
- [ ] Typeahead search for existing Contacts works
- [ ] Beneficial ownership percentages tracked
- [ ] Validation ensures ownership totals are logical

### Product Selection Step (Future)
- [ ] Product catalog displays available account types
- [ ] Product selection creates FinancialAccount record
- [ ] Product-specific fields render conditionally
- [ ] Pricing and fee information displays correctly

---

## 🛠️ Tasks and Sub-Tasks

### Phase 1: Business Details Capture (MSB-26) - Current Sprint

#### 1. Create Business Details LWC Component
- [x] 1.1 Create `businessDetails` LWC component
- [x] 1.2 Implement form layout with all required fields
  - Legal Business Name (required)
  - DBA Name (required)
  - Tax ID (required, 9 digits, format: XX-XXXXXXX)
  - Business Type picklist (required)
  - Date Established (required, cannot be future)
  - State of Incorporation picklist (required)
  - Complete Business Address (required)
  - Business Phone (required)
  - NAICS Code lookup (required)
  - Primary Contact Name
  - Primary Contact Title
  - Existing Primary Contact lookup
  - Annual Revenue
- [x] 1.3 Add "Existing Business" toggle with Account lookup
- [x] 1.4 Implement conditional rendering based on toggle state
- [x] 1.5 Style component with SLDS for consistent UI/UX

#### 2. Implement Client-Side Validation
- [x] 2.1 Add required field validation for all mandatory fields
- [x] 2.2 Implement Tax ID format validation (9 digits, XX-XXXXXXX pattern)
- [x] 2.3 Add Date Established validation (cannot be future date)
- [x] 2.4 Validate complete address (all fields populated)
- [x] 2.5 Validate phone number format
- [x] 2.6 Display inline error messages below each field
- [x] 2.7 Show summary error message at top if validation fails
- [x] 2.8 Implement `@api validate()` method for container integration

#### 3. Implement NAICS Code Lookup Integration
- [x] 3.1 Create NAICS Code lookup component or use standard lookup
- [x] 3.2 Query `NAICS_Code__c` object for available codes
- [x] 3.3 Display code + description in search results
- [x] 3.4 Handle selection and populate field
- [x] 3.5 Add validation for required NAICS Code

#### 4. Implement Existing Business Toggle Logic
- [x] 4.1 Add toggle UI element
- [x] 4.2 Show Account lookup when toggle is ON
- [x] 4.3 Pre-populate fields from selected Account
- [x] 4.5 Store Account ID for ApplicationForm linkage
- [x] 4.6 Show manual entry form when toggle is OFF

#### 5. Update WizardPersistenceService for Business Step
- [x] 5.1 Create or update `upsertBusinessStep()` method
- [x] 5.2 Map wizard payload to Applicant fields:
  - `ApplicationFormId` = ApplicationForm.Id
  - `Type` = 'Organization'
  - `BusinessEntityName` = businessName
  - `DBA_Name__c` = dbaName
  - `BusinessEntityType` = businessType
  - `Business_Tax_ID__c` = taxId (encrypted)
  - `Date_Established__c` = dateEstablished
  - `State_of_Incorporation__c` = stateOfIncorporation
  - `NAICS_Code__c` = naicsCode (lookup)
  - `Primary_Contact_Name__c` = primaryContactName
  - `Primary_Contact_Title__c` = primaryContactTitle
  - `Existing_Primary_Contact__c` = existingPrimaryContact (lookup)
  - `Annual_Revenue__c` = annualRevenue
  - Map all address fields
  - Map business phone
- [x] 5.3 Handle existing Account linkage:
  - Set `ApplicationForm.AccountId` = selectedAccountId
  - Set `Applicant.AccountId` = selectedAccountId (reference)
  - Query and cache existing ACRs for Additional Owners step
- [x] 5.4 Handle new business scenario:
  - Flag for Account creation on submission
  - Store business data in Applicant record
- [ ] 5.5 Encrypt Tax ID before storage
- [ ] 5.6 Update `ApplicationForm.StepKey__c` = 'DAO_Business_InBranch_Business'
- [x] 5.7 Enforce CRUD/FLS with `WITH USER_MODE`
- [x] 5.8 Return structured response with saved IDs and any errors

#### 6. Implement Tax ID Encryption
- [ ] 6.1 Verify `Business_Tax_ID__c` field is configured for encryption
- [ ] 6.2 Implement encryption logic in Apex (if not using platform encryption)
- [ ] 6.3 Add decryption logic for display (mask: XX-XXX-1234)
- [ ] 6.4 Test encryption/decryption flow

#### 7. Wire Business Details Component to Container
- [x] 7.1 Add `businessDetails` to `daoWizardStepRouter` conditional branches
- [x] 7.2 Update Wizard_Step__mdt with Business Details step record
- [x] 7.3 Set correct `Order__c` and `ComponentBundle__c`
- [ ] 7.4 Test navigation to/from Business Details step
- [x] 7.5 Verify payload emission on field changes

#### 8. Unit Testing - Business Details
- [ ] 8.1 Test `upsertBusinessStep()` with new business data
- [ ] 8.2 Test `upsertBusinessStep()` with existing Account linkage
- [ ] 8.3 Test Tax ID encryption/decryption
- [ ] 8.4 Test NAICS Code lookup integration
- [ ] 8.5 Test validation rules (all scenarios)
- [ ] 8.6 Test ApplicationForm.AccountId linkage
- [ ] 8.7 Test StepKey__c update
- [ ] 8.8 Test CRUD/FLS enforcement
- [ ] 8.9 Ensure ≥85% code coverage

#### 9. Integration Testing - Business Details
- [ ] 9.1 Test full wizard flow with Business Details step
- [ ] 9.2 Test with existing Account selection
- [ ] 9.3 Test with new business entry
- [ ] 9.4 Test Save & Exit and resume
- [ ] 9.5 Verify Applicant record creation
- [ ] 9.6 Verify ApplicationForm linkage
- [ ] 9.7 Test error handling and display

#### 10. Documentation - Business Details
- [ ] 10.1 Document field mapping decisions
- [ ] 10.2 Update data model documentation
- [ ] 10.3 Document encryption approach
- [ ] 10.4 Add code comments
- [ ] 10.5 Update session notes

---

### Phase 2: Additional Applicants Capture (Future Sprint)

#### 11. Create Additional Applicants LWC Component
- [ ] 11.1 Create `additionalApplicants` LWC component
- [ ] 11.2 Implement dynamic applicant list UI
- [ ] 11.3 Add "Add Applicant" button
- [ ] 11.4 Implement applicant form fields
- [ ] 11.5 Add typeahead search for existing Contacts
- [ ] 11.6 Implement remove applicant functionality
- [ ] 11.7 Add beneficial ownership percentage fields

#### 12. Implement Additional Applicants Validation
- [ ] 12.1 Validate required fields for each applicant
- [ ] 12.2 Validate ownership percentages (if applicable)
- [ ] 12.3 Prevent duplicate applicants
- [ ] 12.4 Implement `@api validate()` method

#### 13. Update WizardPersistenceService for Additional Applicants
- [ ] 13.1 Create or update `upsertAdditionalApplicantsStep()` method
- [ ] 13.2 Handle list of applicants in payload
- [ ] 13.3 For each applicant: create/update Applicant + PersonAccount + ACR
- [ ] 13.4 Link to Business Account via ACR
- [ ] 13.5 Handle bulk DML efficiently
- [ ] 13.6 Update StepKey__c
- [ ] 13.7 Return list of created/updated IDs

#### 14. Testing - Additional Applicants
- [ ] 14.1 Unit tests for additional applicants persistence
- [ ] 14.2 Integration tests for full flow
- [ ] 14.3 Test typeahead search
- [ ] 14.4 Test ACR creation

---

### Phase 3: Product Selection Capture (Future Sprint)

#### 15. Create Product Selection LWC Component
- [ ] 15.1 Create `productSelection` LWC component
- [ ] 15.2 Query and display available products
- [ ] 15.3 Implement product card UI
- [ ] 15.4 Add product comparison functionality
- [ ] 15.5 Implement conditional fields based on product type
- [ ] 15.6 Display pricing and fee information

#### 16. Implement Product Selection Validation
- [ ] 16.1 Validate product selection (required)
- [ ] 16.2 Validate product-specific required fields
- [ ] 16.3 Implement `@api validate()` method

#### 17. Update WizardPersistenceService for Product Selection
- [ ] 17.1 Create or update `upsertProductStep()` method
- [ ] 17.2 Create FinancialAccount record
- [ ] 17.3 Link to ApplicationForm
- [ ] 17.4 Map product-specific fields
- [ ] 17.5 Update StepKey__c
- [ ] 17.6 Return FinancialAccount ID

#### 18. Testing - Product Selection
- [ ] 18.1 Unit tests for product selection persistence
- [ ] 18.2 Integration tests for full flow
- [ ] 18.3 Test product-specific field rendering

---

### Phase 4: Deployment & Verification

#### 19. Deployment Preparation
- [ ] 19.1 Update `package.xml` with all new components
- [ ] 19.2 Update Wizard_Step__mdt records
- [ ] 19.3 Verify NAICS_Code__c object exists in target org
- [ ] 19.4 Verify encryption configuration for Tax ID field
- [ ] 19.5 Create deployment checklist

#### 20. Deployment & Verification
- [ ] 20.1 Deploy to `msb-sbox`
- [ ] 20.2 Verify Business Details step renders correctly
- [ ] 20.3 Test all validation rules in org
- [ ] 20.4 Test existing business toggle
- [ ] 20.5 Test new business entry
- [ ] 20.6 Verify Applicant record creation
- [ ] 20.7 Verify ApplicationForm linkage
- [ ] 20.8 Test Save & Exit and resume
- [ ] 20.9 Verify Tax ID encryption
- [ ] 20.10 Test NAICS Code lookup

---

## 🔧 Technical Implementation

### Objects Involved
- **ApplicationForm** (FSC) – Primary application record
- **Applicant** (FSC) – Business and individual applicant records
- **Account** (Business) – Business Account (IsPersonAccount = false)
- **Account** (PersonAccount) – Individual applicant accounts (for Additional Applicants)
- **AccountContactRelation** (Standard) – Links applicants to business
- **NAICS_Code__c** (Custom) – NAICS code lookup object
- **Contact** (Standard) – For existing primary contact lookup
- **FinancialAccount** (FSC) – Product selection (future)

### Key Relationships

```
ApplicationForm
    ↓ (AccountId lookup - optional, set if existing business)
Account (Business)
    ↓ (Applicant.AccountId reference)
Applicant (Type = 'Organization')
    ↑ (ApplicationFormId lookup)
ApplicationForm

Additional Applicants Flow (Future):
Account (Business)
    ↓ (AccountContactRelation)
Account (PersonAccount) ← Applicant (Type = 'Individual')
    ↑ (ApplicationFormId lookup)
ApplicationForm
```

### Field Mappings

#### Business Details → Applicant (Type = 'Organization')

| Wizard Field | Applicant Field | Type | Notes |
|--------------|-----------------|------|-------|
| businessName | BusinessEntityName | Text | Required |
| dbaName | DBA_Name__c | Text | Required |
| taxId | Business_Tax_ID__c | Text (Encrypted) | Required, 9 digits |
| businessType | BusinessEntityType | Picklist | Required |
| dateEstablished | Date_Established__c | Date | Required |
| stateOfIncorporation | State_of_Incorporation__c | Picklist | Required |
| naicsCode | NAICS_Code__c | Lookup | Required |
| primaryContactName | Primary_Contact_Name__c | Text | Optional |
| primaryContactTitle | Primary_Contact_Title__c | Text | Optional |
| existingPrimaryContact | Existing_Primary_Contact__c | Lookup(Contact) | Optional |
| annualRevenue | Annual_Revenue__c | Currency | Optional |
| addressLine1 | Business_Address_Line_1__c | Text | Required |
| addressLine2 | Business_Address_Line_2__c | Text | Optional |
| city | Business_City__c | Text | Required |
| state | Business_State__c | Picklist | Required |
| postalCode | Business_Postal_Code__c | Text | Required |
| businessPhone | Business_Phone__c | Phone | Required |

> **Note**: Actual field API names should be verified against org schema. See field mapping document for complete details.

### Important Implementation Notes

#### Business Details (MSB-26)
1. **Account Creation Timing**: 
   - DAO Wizard does NOT create Account records during data collection
   - Accounts are either pre-existing (linked) OR created when ApplicationForm.Stage = 'Submitted'
   
2. **Existing Business Flow**:
   - User toggles "Existing Business"
   - Account lookup appears
   - Fields pre-populate from selected Account
   - ApplicationForm.AccountId is set immediately
   - Existing ACRs are queried for Additional Owners step
   
3. **New Business Flow**:
   - User enters business data manually
   - Data stored in Applicant record (Type = 'Organization')
   - ApplicationForm.AccountId remains null during wizard
   - Account created automatically on submission
   
4. **Tax ID Encryption**:
   - Use platform Shield encryption OR custom encryption
   - Display format: XX-XXX-1234 (masked)
   - Store encrypted value in Business_Tax_ID__c
   
5. **NAICS Code**:
   - Required for CIP/KYC compliance
   - Lookup to NAICS_Code__c object
   - Display code + description in search

#### Additional Applicants (Future)
- Each applicant creates: Applicant + PersonAccount + ACR
- ACR links PersonAccount to Business Account
- Beneficial ownership percentages tracked
- Typeahead search for existing Contacts

#### Product Selection (Future)
- Creates FinancialAccount record
- Links to ApplicationForm
- Product-specific fields render conditionally

---

## 🧪 Testing Requirements

### Unit Tests (≥85% coverage)
- [ ] Business Details persistence (new business)
- [ ] Business Details persistence (existing business)
- [ ] Tax ID encryption/decryption
- [ ] NAICS Code lookup integration
- [ ] All validation rules
- [ ] ApplicationForm.AccountId linkage
- [ ] StepKey__c updates
- [ ] CRUD/FLS enforcement
- [ ] Error handling

### Integration Tests
- [ ] Full wizard flow with Business Details
- [ ] Existing business selection and pre-population
- [ ] New business entry and Applicant creation
- [ ] Save & Exit and resume
- [ ] Navigation between steps
- [ ] Error display and recovery

### Manual Testing Checklist
- [ ] UI renders correctly in all browsers
- [ ] Validation messages display inline
- [ ] Toggle behavior works correctly
- [ ] Account lookup searches correctly
- [ ] NAICS Code lookup works
- [ ] Tax ID masking displays correctly
- [ ] Save & Exit preserves data
- [ ] Next button progresses to next step

---

## 📦 Deployment

### Prerequisites
- [ ] Verify `NAICS_Code__c` object exists in target org
- [ ] Verify Applicant custom fields exist
- [ ] Verify encryption configuration for Tax ID field
- [ ] Verify ApplicationForm.AccountId lookup field exists
- [ ] Verify Wizard_Step__mdt records are configured

### Deployment Steps
1. [ ] Update `package.xml` with new components
2. [ ] Deploy Apex classes (WizardPersistenceService updates)
3. [ ] Deploy LWC components (businessDetails)
4. [ ] Deploy Wizard_Step__mdt records
5. [ ] Verify in `msb-sbox`
6. [ ] Run smoke tests
7. [ ] Update documentation

---

## 📝 Implementation Notes

### Phase 1 (Current Sprint): Business Details
- Focus on MSB-26 requirements
- Implement existing business toggle
- Implement Tax ID encryption
- Integrate NAICS Code lookup
- Wire to wizard container

### Phase 2 (Future): Additional Applicants
- Dynamic applicant list
- Typeahead search for existing Contacts
- ACR creation
- Beneficial ownership tracking

### Phase 3 (Future): Product Selection
- Product catalog display
- FinancialAccount creation
- Product-specific fields
- Pricing and fee information

### Reference Documents
- Field Mapping: [Google Sheet](https://docs.google.com/spreadsheets/d/1KmqAUggc-alg3hQPbyHMRDZfLiSJBaHUmajADIO5lAQ/edit?gid=911910661#gid=911910661)
- Data Model: `/docs/01-foundation/data-model.md`
- ADR: `/docs/04-implementation/architecture-decisions/ADR-0001-lwc-architecture.md`

---

## 🔗 Dependencies

- **Depends on**: 
  - ST-001 (Wizard Foundation - must be complete)
  - ST-002 (Persist Application Data - persistence service must exist)
- **Blocks**: 
  - Future stories for Additional Applicants and Product Selection
- **Related**: 
  - ST-003 (Pre-populate Wizard Data - will use business data)

---

## ✅ Definition of Done

### Phase 1: Business Details (MSB-26)
- [ ] Business Details LWC component created and functional
- [ ] All required fields render correctly
- [ ] Client-side validation implemented for all rules
- [ ] Existing business toggle works with Account lookup
- [ ] New business entry creates Applicant record
- [ ] Tax ID encryption implemented and tested
- [ ] NAICS Code lookup integration works
- [ ] WizardPersistenceService.upsertBusinessStep() implemented
- [ ] ApplicationForm.AccountId linkage works correctly
- [ ] StepKey__c updates correctly
- [ ] CRUD/FLS enforced with WITH USER_MODE
- [ ] Unit tests ≥85% coverage
- [ ] Integration tests pass
- [ ] Deployed to `msb-sbox` and verified
- [ ] Session notes added documenting implementation

### Phase 2: Additional Applicants (Future)
- [ ] Additional Applicants component created
- [ ] Dynamic applicant list works
- [ ] Typeahead search functional
- [ ] ACR creation works
- [ ] Tests pass

### Phase 3: Product Selection (Future)
- [ ] Product Selection component created
- [ ] Product catalog displays
- [ ] FinancialAccount creation works
- [ ] Tests pass

---

**Assigned To**: Cristiano Sinadino  
**Related Stories**: ST-001 (Wizard Foundation), ST-002 (Persist Application Data), ST-003 (Pre-populate Wizard Data)
