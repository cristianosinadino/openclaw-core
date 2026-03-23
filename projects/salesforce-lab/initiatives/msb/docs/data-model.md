# Main Street Bank – FSC +  Data Model

> **Legend**  
> 🟦 Standard Salesforce Object  
> 🟧 FSC Object  
> 🟩 Custom Object  

---

## View 1: High-Level Flow

This view shows the entity relationships for deposit account opening workflow.

### Entity Relationship Diagram

```mermaid
erDiagram
    ApplicationForm ||--o{ Applicant : "has"
    ApplicationForm ||--o{ ApplicationFormProduct : "contains"
    ApplicationForm }o--|| Business_Entity : "belongs to"
    ApplicationForm ||--o{ Due_Diligence__c : "requires"
    ApplicationForm ||--o{ Assessment : "has assessments"
    
    Applicant }o--|| PersonAccount : "is"
    Applicant ||--o{ ApplicationProductPartyRole__c : "has roles"
    
    PersonAccount ||--o{ Business_Entity : "has"
    PersonAccount ||--o{ Due_Diligence__c : "subject to"
    PersonAccount ||--o{ AccountContactRelation : "connected via"
    
    Business_Entity ||--o{ AccountContactRelation : "has relationships"
    Business_Entity ||--o{ FinServ__AccountAccountRelation__c : "has business relationships"
    
    FinServ__FinancialAccount__c ||--o{ FinServ__FinancialAccountRole__c : "has roles"
    FinServ__FinancialAccount__c }o--|| Business_Entity : "lookup to"
    FinServ__FinancialAccountRole__c }o--|| PersonAccount : "belongs to"
    
    ApplicationFormProduct }o--|| Product2 : "references"
    ApplicationFormProduct ||--o{ ApplicationProductPartyRole__c : "has role assignments"
    ApplicationForm ||--o{ ApplicationProductPartyRole__c : "has role assignments"
    
    Assessment }o--|| Business_Entity : "belongs to"
    Assessment }o--|| User : "assessed by"
    
    Collateral__c ||--o{ Collateral_Owner__c : "owned by"
    Collateral__c ||--o{ Collateral_Association__c : "associated with"
    Collateral__c ||--o{ Collateral_Assessment__c : "assessed by"
    
    Business_Entity ||--o{ Collateral_Owner__c : "owns"
    Business_Entity ||--o{ Collateral_Association__c : "associated with"
    Business_Entity ||--o{ Assessment : "has assessments"
```

---

## Object Relationships

### Core Objects

| Object | Type | Description | Key Relationships |
|--------|------|-------------|-------------------|
| **ApplicationForm** | 🟧 FSC | Primary deposit application | → Applicant, ApplicationFormProduct, Due_Diligence__c, Assessment, ApplicationProductPartyRole__c |
| **Applicant** | 🟧 FSC | Individual applicants | → PersonAccount, ApplicationForm, ApplicationProductPartyRole__c |
| **PersonAccount** | 🟦 Standard | Customer records | → Business_Entity, Due_Diligence__c, AccountContactRelation |
| **Business_Entity** | 🟦 Standard | Business accounts | → ApplicationForm, FinServ__FinancialAccount__c, Collateral objects, Assessment, AccountContactRelation |
| **AccountContactRelation** | 🟦 Standard | Person-to-Business relationships | → PersonAccount (Contact), Business_Entity (Account) |
| **FinServ__FinancialAccount__c** | 🟧 FSC | Deposit/loan account | → FinServ__FinancialAccountRole__c, Business_Entity |
| **Due_Diligence__c** | 🟩 Custom | Compliance tracking | → ApplicationForm, PersonAccount |
| **Assessment** | 🟩 Custom | Assessment tracking | → ApplicationForm, Business_Entity, User |

###  Integration Objects

| Object | Type | Description | External ID Field |
|--------|------|-------------|-------------------|
| **ApplicationForm** | 🟧 FSC | Application data | `DAOApplicationId__c` |
| **Applicant** | 🟧 FSC | Applicant data | `DAOApplicantId__c` |
| **Account** | 🟦 Standard | Business data | `DAOBusinessId__c` |

### Collateral Objects

| Object | Type | Description | Key Relationships |
|--------|------|-------------|-------------------|
| **Collateral__c** | 🟩 Custom | Collateral items | ← Collateral_Owner__c, Collateral_Association__c, Collateral_Assessment__c |
| **Collateral_Owner__c** | 🟩 Custom | Collateral ownership | → Collateral__c, Business_Entity |
| **Collateral_Association__c** | 🟩 Custom | Collateral associations | → Collateral__c, Business_Entity |
| **Collateral_Assessment__c** | 🟩 Custom | Collateral valuations | → Collateral__c, User |

### Junction/Relationship Objects

| Object | Type | Description | Key Relationships |
|--------|------|-------------|-------------------|
| **AccountContactRelation** | 🟦 Standard | Links PersonAccount to Business Account | → Contact/PersonAccount, Account (Business) |
| **FinServ__FinancialAccountRole__c** | 🟧 FSC | Links PersonAccount to FinancialAccount | → PersonAccount, FinServ__FinancialAccount__c |
| **ApplicationProductPartyRole__c** | 🟩 Custom | Links Applicant to ApplicationFormProduct with role assignments | → Applicant, ApplicationFormProduct, ApplicationForm |

### Product Objects

| Object | Type | Description | Key Relationships |
|--------|------|-------------|-------------------|
| **Product2** | 🟦 Standard | Deposit products | ← ApplicationFormProduct |
| **ApplicationFormProduct** | 🟧 FSC | Product applications | → ApplicationForm, Product2, ApplicationProductPartyRole__c |
| **ApplicationProductPartyRole__c** | 🟩 Custom | Links the Application Form Product with the Applicant and the role the applicant associated with the product | → ApplicationFormProduct__c, 	Applicant__c |

---

## Data Flow

### 1. Application Creation
```
 → ApplicationForm → Applicant → PersonAccount
```

### 2. Compliance Workflow
```
ApplicationForm (Submitted) → Due_Diligence__c → Tasks
```

### 3. Assessment Workflow
```
ApplicationForm (Submitted) → Assessment → Results → ApplicationForm (Updated)
```

### 4. Financial Account Setup
```
ApplicationForm → FinServ__FinancialAccount__c → FinServ__FinancialAccountRole__c
```

### 5. Collateral Management
```
Business_Entity → Collateral_Owner__c → Collateral__c → Collateral_Assessment__c
```

### 6. Relationship Management
```
PersonAccount → AccountContactRelation → Business Account
Business Account → FinServ__AccountAccountRelation__c → Related Business Account
```

### 7. Product Role Assignment
```
ApplicationForm → ApplicationFormProduct → ApplicationProductPartyRole__c ← Applicant
```

---

## Key Fields

### ApplicationForm
- `DAOApplicationId__c` (External ID from )
- `Stage` (Submitted, In Review, Approved, etc.)
- `AccountId` (Lookup to Account Business)

### Applicant
- `DAOApplicantId__c` (External ID from )
- `ApplicationForm` (Master-Detail to ApplicationForm)
- `AccountId` (Lookup to Account)
- `Applicant_Type__c` (Role of applicant)

### Account (Business Record Type)
- `DAOBusinessId__c` (External ID from )
- `Name` (Business Name)
- `Business_Type__c` (Entity Type)
- `NAICS_Code__c` (Industry Code)

### Account (PersonAccount)
- `LastName` 
- `PersonMailingAddress` 
- `PersonOtherAddress`

### Due_Diligence__c
- `ApplicationForm__c` (Lookup to ApplicationForm)
- `Type__c` (SAM, CAIVRS, Affiliate, KYC/KYB)
- `Status__c` (Completed, In Progress, Failed)
- `Completed_Date__c` (Completion timestamp)

### ApplicationProductPartyRole__c
- `ApplicationForm__c` (Lookup to ApplicationForm)
- `ApplicationFormProduct__c` (Lookup to ApplicationFormProduct)
- `Applicant__c` (Lookup to Applicant)
- `Role__c` (Multiselect Picklist: Primary, Joint, Authorized Signer, Beneficiary)
- Stores role assignments defining what role each applicant plays for each product

### Collateral__c
- `Type__c` (Real Estate, Equipment, Vehicle, etc.)
- `Value__c` (Estimated value)
- `Status__c` (Pending, Approved, Rejected)

### AccountContactRelation
- `AccountId` (Lookup to Account/Business)
- `ContactId` (Lookup to Contact/PersonAccount)
- `Roles` (Picklist: CEO, CFO, Owner, etc.)
- `Ownership_Percentage_zen__c` (0-100%)
- `Beneficial_Owner_zen__c` (Checkbox)
- `Authorized_Signer_zen__c` (Checkbox)
- `Controlling_Party_zen__c` (Checkbox)

---

## Notes

- All PII fields are encrypted at rest
- External ID fields enable data deduplication
- Account represents both Business and PersonAccount (via Record Type)
- **ApplicationProductPartyRole__c**: Junction object linking Applicant to ApplicationFormProduct with role information (Primary, Joint, Authorized Signer, Beneficiary). Replaces legacy Assigned_Products__c object which did not store role data.
- **AccountContactRelation**: Standard junction connecting persons to business accounts
- The `entity` field in  API determines which junction object to use
- **Legacy Note**: `Assigned_Products__c` exists in metadata but is not actively used. Use `ApplicationProductPartyRole__c` instead.

---

**Created**: 2025-01-16  
**Last Updated**: 2026-01-15  
**Next Review**: Weekly during implementation  
**Stakeholders**: Development Team, QA Team, Product Team

---

## Recent Updates

**2026-01-15**: Updated to reflect current implementation using `ApplicationProductPartyRole__c` instead of legacy `Assigned_Products__c` object. `ApplicationProductPartyRole__c` includes role information (Primary, Joint, Authorized Signer, Beneficiary) and is actively used in the `daoRelationshipAssignment` step.

