<!-- 
🔴 AI AGENTS: READ FIRST
- /docs/01-foundation/data-model.md
- /docs/04-implementation/session-notes/2026-01-28-cocc-core-booking-integration-analysis.md
- /docs/04-implementation/architecture-decisions/ADR-0004-bidirectional-integration-pattern.md
- /docs/02-requirements/ST-007-relationships-and-roles.md
- /docs/07-api-docs-txt/Core API Transaction Set Format 2022.2.0.txt
- /docs/07-api-docs-txt/COCC data dictionary export.csv

✅ Correct objects: ApplicationForm, Applicant, ApplicationFormProduct, ApplicationProductPartyRole__c, Account (Business & PersonAccount), FinServ__FinancialAccount__c, FinServ__FinancialAccountRole__c
-->

## ST-008: Book to Core (COCC Integration)

**Story ID**: ST-008  
**Work Item**: SVC-008, MULE-008, CFG-008, DATA-008  
**Status**: Proposed  
**Created**: 2026-02-04  
**Last Updated**: 2026-02-04  

### 🎫 JIRA Story Mapping

| JIRA Story | Title                       | Status   | Link |
|------------|----------------------------|----------|------|
| TBD        | Integration - Book to Core | Proposed | TBD  |

> This story defines the end-to-end integration to book approved FinancialAccount records from Salesforce to COCC Core Banking System via MuleSoft.

---

## 📋 Story Overview

**As a** Operations user (or automated process)  
**I want** approved FinancialAccount records to be automatically booked to COCC Core  
**So that** the Core account number is returned, stored in Salesforce, and the booking status is tracked for audit and operations.

---

## 📜 SOW Requirements (Summary)

### Zennify Will

1. **Confirm COCC API usage and integration patterns** for person, organization, product catalog, account creation, and FA return, based on Customer-provided documentation.
2. **Design and implement a single MuleSoft booking orchestration flow** to validate data, synchronize entities, book the account, and return the FA number. Scope limited to one standard flow; excludes advanced exception handling, reversals, and post-booking lifecycle events.
3. **Implement MuleSoft COCC system APIs** for person, organization, account, and inquiry. Limited to one (1) API per entity, synchronous request/response processing, and standard error handling.
4. **Implement one MuleSoft process API** to orchestrate the booking flow and FA return. Excludes multiple account types per transaction, retries, and asynchronous processing.
5. **Implement a Salesforce Apex booking wrapper** to map application data and party roles to COCC entities and initiate booking via MuleSoft. Limited to one (1) application and one (1) booked account per transaction.

### Assumptions

- Customer will provide and validate the COCC API catalog, integration patterns, FA return behavior, and required mappings between application data, party roles, and COCC entities **prior to implementation**.
- Required environments, credentials, and connectivity for Salesforce, MuleSoft, and COCC will be available to support development and testing.

---

## 🎯 Acceptance Criteria

### AC1 – API Confirmation

- COCC API usage and integration patterns for person, organization, product catalog, account creation, and FA return are documented and confirmed with Customer.

### AC2 – MuleSoft Booking Flow

- A single orchestration flow validates data, synchronizes entities (person/org), books the account, and returns the FA number.
- Standard error handling; excludes reversals, retries, and post-booking lifecycle events.

### AC3 – MuleSoft System APIs

- One system API per entity: person, organization, account, inquiry.
- Synchronous request/response; standard error handling.

### AC4 – MuleSoft Process API

- One process API orchestrates the booking flow and FA return.
- One application, one booked account per transaction.

### AC5 – Salesforce Apex Booking Wrapper

- Apex maps ApplicationForm, Applicant, Account, FinancialAccount, and FinancialAccountRole data to COCC entities.
- Initiates booking via MuleSoft.
- One application, one booked account per transaction.

### AC6 – FA Number Storage

- COCC-generated account number (FA number) is returned and stored on FinancialAccount.
- Booking status and errors are tracked for audit.

---

## 🧱 Solution Design

### Architecture Overview

```
Salesforce (Apex)  →  MuleSoft (Process API)  →  MuleSoft (COCC System APIs)  →  COCC Core (TCP/IP + XML)
     │                           │                           │
     │  REST/HTTP callout        │  Orchestration            │  TCP/IP socket
     │  (JSON or XML)            │  Validate → Sync → Book   │  XML (ReqTypCd 7719, 7707, 7759)
     │                           │  Return FA number         │  CMC Server
     └───────────────────────────┴───────────────────────────┘
```

### Integration Pattern (from ADR-0004)

- **Trigger**: `FinServ__FinancialAccount__c` when `Stage__c == 'Approved'` AND `Booked_To_Core__c == false`
- **Adapter**: `COCCCoreAdapter` implements `IOutboundProvider`
- **Flow**: Transform FinancialAccount + related data → Call MuleSoft Process API → Receive FA number → Update FinancialAccount

### COCC API Summary (from Session Note)

| Entity      | ReqTypCd | Purpose                               |
|-------------|----------|----------------------------------------|
| Account     | 7719     | Account Maintenance (create/book)      |
| Person      | 7707     | Person Maintenance (if separate)       |
| Organization| 7759     | Organization Maintenance (if separate) |
| Inquiry     | 7702     | Account Detail Inquiry                 |

**Note**: Person and Organization can be created **within** the Account Maintenance (7719) transaction; separate system APIs may wrap the same COCC calls.

### Salesforce Data Model Additions

| Object                    | Field                     | Type         | Purpose                          |
|---------------------------|---------------------------|--------------|----------------------------------|
| FinServ__FinancialAccount__c | COCC_Account_Number__c  | Text         | COCC-generated account number    |
| FinServ__FinancialAccount__c | COCC_Booking_Status__c  | Picklist     | Pending, Success, Failed, Retry  |
| FinServ__FinancialAccount__c | COCC_Booking_Error__c   | Long Text    | Error message from COCC          |
| FinServ__FinancialAccount__c | COCC_Booking_Date__c    | DateTime     | Timestamp of successful booking  |
| Account (PersonAccount)   | COCC_Person_Number__c    | Text         | COCC persNbr                     |
| Account (Business)        | COCC_Organization_Number__c | Text      | COCC orgNbr                      |
| Custom Metadata           | COCC_Product_Mapping__mdt  | Metadata  | Product2 → COCC Major/Minor Type |
| Custom Metadata           | COCC_Role_Mapping__mdt     | Metadata  | FinServ__Role__c → AcctRoleCd    |

### Transaction Flow (One Application, One Account)

1. Apex collects: ApplicationForm, Applicant(s), Account (Business), PersonAccount(s), FinancialAccount, FinancialAccountRole(s).
2. Apex maps to MuleSoft payload (JSON or XML).
3. MuleSoft Process API validates payload.
4. MuleSoft calls COCC (via TCP/IP + XML): Person/Org creation (if needed) + Account Maintenance (7719).
5. COCC returns account number (`acctNbr`).
6. MuleSoft returns FA number to Apex.
7. Apex updates FinancialAccount: `COCC_Account_Number__c`, `Booked_To_Core__c = true`, `COCC_Booking_Status__c = Success`, `COCC_Booking_Date__c`.

---

## ✅ Immediate Steps / Actions We CAN Take

These can be started now with available documentation (Core API doc, session note, COCC data dictionary CSV).

### Design & Documentation

- [ ] **Document COCC API Usage & Integration Patterns** – Create a short doc summarizing person, org, product catalog, account creation, and FA return for Customer confirmation.
- [ ] **Define Salesforce → MuleSoft contract** – Request schema (application/FA/party data), response schema (FA number + status).
- [ ] **Design single MuleSoft booking flow** – Validate → Sync entities → Book → Return FA; document flow steps.
- [ ] **Use COCC data dictionary CSV** – Document field-level mappings (PERS, ACCT* columns) for required fields and lengths; create mapping tables.

### Salesforce Implementation

- [ ] **Create custom fields** – `COCC_Account_Number__c`, `COCC_Booking_Status__c`, `COCC_Booking_Error__c`, `COCC_Booking_Date__c` on FinancialAccount; `COCC_Person_Number__c` on PersonAccount; `COCC_Organization_Number__c` on Business Account.
- [ ] **Create Custom Metadata Types** – `COCC_Product_Mapping__mdt`, `COCC_Role_Mapping__mdt` (structure only; records need code values).
- [ ] **Implement Apex booking wrapper** – Interface, DTOs, mapping logic from ApplicationForm/Applicant/Account/FinancialAccount/FinancialAccountRole to MuleSoft payload. Use mock MuleSoft endpoint for unit tests.
- [ ] **Implement trigger/adapter** – Per ADR-0004: trigger on FinancialAccount when `Stage__c == 'Approved'` and `Booked_To_Core__c == false`; call Apex wrapper.

### MuleSoft Design (Contract Only)

- [ ] **Design Process API contract** – One operation: `bookToCore` (request/response).
- [ ] **Design System API contracts** – One per entity (person, org, account, inquiry) – request/response schemas.

---

## ⏸️ Pending Tasks We CANNOT Take (Blocked)

These require Customer/COCC input before implementation.

### Credentials & Connectivity

- [ ] **Obtain COCC credentials** – ApplNbr, SignonId, Password.
- [ ] **Obtain CMC server endpoint** – TCP/IP address and port.
- [ ] **Obtain test environment** – connectId, credentials for test/training database.
- [ ] **Establish connectivity** – Salesforce ↔ MuleSoft, MuleSoft ↔ COCC (TCP/IP).

### Code Values & Validation

- [ ] **Obtain code values** – Major Account Type (MJACCTTYP), Minor Account Type / Product codes (MJMIACCTTYP), Account Role (ACCTROLE), Ownership Type (OWNTYP), Account Status (ACCTSTAT). Institution-specific; must come from COCC or Customer.
- [ ] **Customer validation** – Confirm COCC API catalog, integration patterns, FA return behavior, and mappings (application data + party roles → COCC entities).

### MuleSoft Implementation (COCC Side)

- [ ] **Implement TCP/IP socket connection** – MuleSoft flow to connect to CMC server and send/receive XML.
- [ ] **Implement XML transformation** – Build COCC request XML from MuleSoft payload; parse COCC response XML.
- [ ] **Implement COCC System APIs** – Actual calls to COCC (blocked until credentials and connectivity).

### End-to-End Testing

- [ ] **Integration testing** – Salesforce → MuleSoft → COCC with live COCC (blocked until credentials and connectivity).
- [ ] **Create mapping metadata records** – Populate `COCC_Product_Mapping__mdt` and `COCC_Role_Mapping__mdt` with actual code values (blocked until code values obtained).

---

## 📋 Everything We Still Need (Master List)

### From Customer / COCC

| # | Item | Description | Blocking |
|---|------|-------------|----------|
| 1 | COCC API Catalog validation | Customer confirms Core API doc + data dictionary represent correct API usage | Design sign-off |
| 2 | Integration patterns validation | Customer confirms: one flow, one API per entity, sync, FA = returned account number | Design sign-off |
| 3 | FA return behavior confirmation | Customer confirms FA number is in 7719 response `acctNbr` | Design sign-off |
| 4 | Mappings validation | Customer confirms application data + party roles → COCC person/org/account/roles mapping | Design sign-off |
| 5 | COCC credentials | ApplNbr, SignonId, Password | E2E, production |
| 6 | CMC server endpoint | TCP/IP address and port | E2E, production |
| 7 | Test environment credentials | connectId, ApplNbr, SignonId, Password for test/training | Integration testing |
| 8 | Code values (product) | MJACCTTYP, MJMIACCTTYP – Major/Minor account type codes for Main Street Bank | Booking accuracy |
| 9 | Code values (role) | ACCTROLE – Account role codes | Booking accuracy |
| 10 | Code values (ownership) | OWNTYP – Ownership type codes | Booking accuracy |
| 11 | Code values (status) | ACCTSTAT – Account status codes | Booking accuracy |
| 12 | Environments & connectivity | Salesforce, MuleSoft, COCC dev/test/prod environments and network connectivity | Development, testing |

### Internal (Zennify) – After Unblocked

| # | Item | Description |
|---|------|-------------|
| 13 | MuleSoft TCP/IP flow | Implement socket connection to CMC, XML send/receive |
| 14 | MuleSoft XML transformation | Build 7719 (and 7707/7759 if used) request; parse response |
| 15 | Mapping metadata population | Populate COCC_Product_Mapping__mdt, COCC_Role_Mapping__mdt with code values |
| 16 | Integration testing | End-to-end: SF → MuleSoft → COCC |
| 17 | Error handling & audit | Store request/response XML; handle COCC errors; retry (if in scope) |

---

## 🔗 Dependencies

- **Depends on**: ST-007 (Relationships and Roles) – FinancialAccount and FinancialAccountRole creation
- **Related**: ADR-0004 (Bidirectional Integration Pattern)
- **Documentation**: `docs/04-implementation/session-notes/2026-01-28-cocc-core-booking-integration-analysis.md`

---

## ✅ Definition of Done

- [ ] COCC API usage and integration patterns documented and Customer-confirmed
- [ ] Salesforce custom fields and metadata types created
- [ ] Apex booking wrapper implemented (with mock for unit tests)
- [ ] Trigger/adapter implemented per ADR-0004
- [ ] MuleSoft Process API and System APIs implemented (when unblocked)
- [ ] FA number stored on FinancialAccount; booking status tracked
- [ ] Documentation updated; story mapped in JIRA
