<!-- 
🔴 AI AGENTS: READ FIRST
- /docs/01-foundation/data-model.md
- /docs/04-implementation/session-notes/2026-01-28-fis-chexsystems-kyb-kyc-integration-solution-design.md
- /docs/06-api-docs-md/ (BizChex, Discovery Chex Combo, IDV User Guide)

✅ Correct objects: ApplicationForm, Applicant, Account (Business & PersonAccount), Assessment (FSC)
-->

## ST-009: KYB/KYC Integration (FIS Code Connect / ChexSystems)

**Story ID**: ST-009  
**Work Item**: SVC-009, MULE-009, CFG-009, LWC-009  
**Status**: Proposed  
**Created**: 2026-02-04  
**Last Updated**: 2026-02-04  

### 🎫 JIRA Story Mapping

| JIRA Story | Title                       | Status   | Link |
|------------|----------------------------|----------|------|
| TBD        | Integration - KYB/KYC      | Proposed | TBD  |

> This story defines the single-provider KYB/KYC and OFAC integration using FIS Code Connect (BizChex/QualiFile/OFAC), MuleSoft, and Salesforce.

---

## 📋 Story Overview

**As a** Banker User completing a Deposit Account Opening application  
**I want** to run KYB/KYC and OFAC screening on applicants via FIS Code Connect  
**So that** screening outcomes (Approve/Refer/Decline) are persisted, displayed in the wizard, and can be manually overridden before booking to Core.

---

## 📜 SOW Requirements (Summary)

### Zennify Will

1. **Design and implement a single-provider KYB/KYC and OFAC integration** using FIS Code Connect, MuleSoft, and Salesforce. Limited to one (1) API contract per service and synchronous request/response processing.

2. **Implement MuleSoft system and process APIs** for BizChex, QualiFile, and OFAC only, with standard error handling. Scope excludes multi-provider orchestration, retries, monitoring, or non-KYC integrations.

3. **Implement a Salesforce Apex service layer** to initiate KYB/KYC requests, persist one (1) screening result per Applicant (tied to ApplicationForm), and surface outcomes in the application flow.

4. **Configure Approve/Refer/Decline decision mapping** and basic audit logging using Customer-defined rules. Scope excludes dynamic rules, re-screening, case management, SLA tracking, or regulatory interpretation.

### Assumptions

- Customer will provide and approve all provider design inputs (endpoints, schemas, SLAs, error patterns) prior to implementation.
- Customer is responsible for provider credentials, connectivity, configuration, and ongoing vendor support.
- Provider APIs are assumed stable and available; changes may require a change order.
- Customer will define and approve all decision-mapping rules. Zennify implements rules as provided and will not interpret regulatory intent.
- Required screening data is available at runtime. Data enrichment, remediation, and regulatory validation are out of scope.

---

## 🎯 Acceptance Criteria

### AC1 – Single-Provider Integration

- One API contract per service (BizChex, QualiFile, OFAC); synchronous request/response only.

### AC2 – MuleSoft System and Process APIs

- MuleSoft system APIs for BizChex, QualiFile, OFAC (one per service).
- MuleSoft process API to orchestrate screening flow.
- Standard error handling; no multi-provider orchestration, retries, or monitoring.

### AC3 – Salesforce Apex Service Layer

- Apex initiates KYB/KYC requests.
- One Assessment record per Applicant (tied to ApplicationForm).
- Outcomes surfaced in application flow (wizard step).

### AC4 – Decision Mapping

- Approve/Refer/Decline mapping using Customer-defined rules.
- Basic audit logging (request/response payloads in Assessment).

### AC5 – Wizard Step

- New screening step after daoAdditionalApplicants.
- "Run Screening" button (per Applicant or all).
- Display results with override capability.

---

## 🧱 Solution Design

### Architecture Overview

```
Salesforce (Apex)  →  MuleSoft (Process API)  →  MuleSoft (System APIs)  →  FIS Code Connect
     │                           │                           │
     │  HTTP POST (JSON)         │  Orchestration            │  BizChex / QualiFile / OFAC
     │  Named Credential         │  Validate → Screen        │  OAuth 2.0
     │                           │  Return normalized result │  REST APIs
     └───────────────────────────┴───────────────────────────┘
```

### Integration Flow

1. User navigates to Screening step → `daoKycScreening` LWC loads.
2. User clicks "Run Screening" → `DaoScreeningService.initiateScreening(applicationFormId, applicantIds)`.
3. Apex extracts data from ApplicationForm, Applicants, Account (NOT existing Assessments).
4. Apex builds JSON payload → HTTP POST to MuleSoft.
5. MuleSoft calls FIS (BizChex for business, QualiFile/OFAC for individuals).
6. MuleSoft returns normalized response.
7. Apex applies decision mapping (Approve/Refer/Decline).
8. Apex creates/updates Assessment records (one per Applicant) with request/response payloads for audit.
9. Wizard displays results; user can override decision.

### API Summary (from docs/06-api-docs-md/)

| API | Document | Purpose |
|-----|----------|---------|
| **BizChex** | ChexSystems BizChex Communication Specification (OAuth v2) v2.3 | Business entity verification (KYB) |
| **Discovery Chex Combo** | Discovery Chex Combo REST API Service Integration Guide v1.5 | Consumer combo: ChexSystems + QualiFile + OFAC (KYC) |

### Required Screening Data (from Discovery Chex Combo)

| Field | QualiFile | IDV | OFAC |
|-------|-----------|-----|------|
| First Name | Yes | Yes | Yes |
| Last Name | Yes | Yes | Yes |
| Birth Date | No (QF-only) | Yes | Yes |
| SSN | Conditional (recommended) | Conditional (recommended) | Conditional (recommended) |
| Street, City, State, Postal | Yes | Yes | **No** |

### Salesforce Data Model (Assessment)

- One Assessment per Applicant; Assessment fields for Status, Decision, DecisionOverride, ScreeningRequestPayload, ScreeningResponsePayload, RiskScore, Flags, ErrorMessage, timestamps, override metadata. (See session note for full field list.)

---

## ✅ Immediate Steps / Actions We CAN Take

These can be started now with the session note and API docs.

### Design & Documentation

- [ ] **Document FIS/ChexSystems API usage** – BizChex, Discovery Combo (QualiFile/OFAC), required fields, request/response structure for Customer confirmation.
- [ ] **Define Salesforce → MuleSoft contract** – Request schema (applicants, business context); response schema (screening results, decision).
- [ ] **Design MuleSoft process API** – One operation: `/screening/kyb-kyc` (or similar); validate → call system APIs → return normalized result.
- [ ] **Design MuleSoft system API contracts** – One per service (BizChex, QualiFile, OFAC) – request/response schemas.

### Salesforce Implementation

- [ ] **Add Assessment fields** – ApplicantId, AssessmentType, Status, Decision, DecisionOverride, IsManuallyOverridden, OverrideReason, Provider, ProviderTransactionId, ScreeningRequestPayload, ScreeningResponsePayload, RiskScore, Flags, ErrorMessage, ScreeningInitiatedDate, ScreeningCompletedDate, OverrideDate, OverrideBy.
- [ ] **Create DaoScreeningService.cls skeleton** – Methods: `initiateScreening()`, `getAssessments()`, `updateAssessmentDecision()`, `extractScreeningData()`, `applyDecisionMapping()`.
- [ ] **Implement extractScreeningData()** – Query ApplicationForm, Applicants, Account; map to DTO (no callout).
- [ ] **Implement applyDecisionMapping() placeholder** – Default or simple rule; Customer rules TBD.
- [ ] **Create daoKycScreening LWC** – Wizard step UI, "Run Screening" button, results display, override UI.
- [ ] **Create Wizard_Step__mdt** – `DAO_Business_InBranch_KycScreening` step after daoAdditionalApplicants.
- [ ] **Create ScreeningDataDTO, ScreeningResponseDTO** – DTO classes for request/response.
- [ ] **Implement HTTP callout skeleton** – Call MuleSoft with mock endpoint or test class; parse response structure.

---

## ⏸️ Pending Tasks We CANNOT Take (Blocked)

These require Customer/FIS input before implementation.

### Provider Design Inputs (per SOW)

- [ ] **Endpoints** – Base URL(s) for BizChex, Discovery Chex Combo (or FIS Code Connect gateway).
- [ ] **Schemas** – Formal request/response schemas (if different from docs).
- [ ] **SLAs** – Timeouts, response expectations.
- [ ] **Error patterns** – Standard error response format, retry behavior (if any).

### Credentials & Connectivity

- [ ] **OAuth configuration** – Token endpoint, client credentials, grant type.
- [ ] **Source-Id, Application-Id** – ChexSystems/FIS identifiers.
- [ ] **Named Credential** – Configure for MuleSoft or FIS endpoint.

### Decision Mapping Rules

- [ ] **Customer-defined rules** – Exact Approve/Refer/Decline logic (e.g., risk score thresholds, flag handling, OFAC match handling).
- [ ] **Rule implementation** – Implement rules in `applyDecisionMapping()` once provided.

### MuleSoft Implementation (FIS Side)

- [ ] **Implement MuleSoft process API** – Orchestration flow (blocked until endpoints/credentials).
- [ ] **Implement MuleSoft system APIs** – BizChex, QualiFile, OFAC (blocked until FIS connectivity).
- [ ] **OAuth to FIS** – MuleSoft → FIS authentication (blocked until credentials).

### End-to-End Testing

- [ ] **Integration testing** – Salesforce → MuleSoft → FIS (blocked until connectivity).
- [ ] **FIS Code Connect confirmation** – Confirm relationship to ChexSystems Discovery / BizChex; validate API choice.

---

## 📋 Everything We Still Need (Master List)

### From Customer / FIS (per SOW)

| # | Item | Description | Blocking |
|---|------|-------------|----------|
| 1 | Provider design inputs | Endpoints, schemas, SLAs, error patterns | Implementation |
| 2 | Credentials and connectivity | OAuth config, Source-Id, Application-Id; Customer responsible | E2E, production |
| 3 | Decision mapping rules | Approve/Refer/Decline logic; Customer will define and approve | Decision logic |
| 4 | FIS Code Connect confirmation | Relationship to ChexSystems Discovery / BizChex / QualiFile / OFAC APIs | Architecture |
| 5 | Base URL(s) | BizChex, Discovery Chex Combo, or FIS Code Connect gateway | MuleSoft, Apex callout |
| 6 | OAuth token endpoint | Token acquisition for FIS/ChexSystems | Authentication |
| 7 | Environments | Dev, test, prod for Salesforce, MuleSoft, FIS | Development, testing |

### Internal (Zennify) – After Unblocked

| # | Item | Description |
|---|------|-------------|
| 8 | MuleSoft process API | Implement orchestration flow |
| 9 | MuleSoft system APIs | Implement BizChex, QualiFile, OFAC calls |
| 10 | Apex HTTP callout | Configure Named Credential; implement callout |
| 11 | Decision mapping implementation | Implement Customer-approved rules in applyDecisionMapping() |
| 12 | Integration testing | End-to-end: SF → MuleSoft → FIS |
| 13 | Audit validation | Confirm Assessment fields sufficient for audit |

---

## 📊 What's There vs What's Not (Documentation)

### What's There

| Source | Content |
|--------|---------|
| **Session note** | Full solution design, architecture, data model, Apex methods, MuleSoft contract, wizard step design, error handling, implementation phases |
| **BizChex Communication Spec** | BizChex Inquiry API, JSON request/response, OAuth v2, business/principal/authorized signer structure |
| **Discovery Chex Combo Guide** | chex-combo-service, PersonQuery, PersonReplyV001, ChexSystemsResponse, QualiFileResponse, OfacResponse; Consumer input elements; Required/conditional per service; QualiFile Reason Codes, Error Codes, State Codes |
| **IDV User Guide** | IDV required fields (name, address, DOB, SSN recommended); OFAC with IDV |

### What's Not There

| Gap | Impact |
|-----|--------|
| FIS Code Connect vs ChexSystems | SOW says "FIS Code Connect"; docs say ChexSystems Discovery. Need Customer confirmation. |
| Base URL / Endpoint | Not in docs; "work with Implementations Project Manager" |
| OAuth token flow | Security-Token-Type referenced; token endpoint/flow not documented |
| BizChex + Discovery orchestration | Separate APIs; MuleSoft orchestration design TBD |
| Decision mapping rules | Customer-defined; pending |

---

## 🔗 Dependencies

- **Depends on**: Wizard foundation (ST-001), Persist Application Data (ST-002), Pre-populate Wizard Data (ST-003); Applicant and ApplicationForm data model
- **Related**: `docs/04-implementation/session-notes/2026-01-28-fis-chexsystems-kyb-kyc-integration-solution-design.md`
- **API Docs**: `docs/06-api-docs-md/`

---

## ✅ Definition of Done

- [ ] FIS/ChexSystems API usage documented and Customer-confirmed
- [ ] Assessment fields and DaoScreeningService implemented
- [ ] daoKycScreening wizard step implemented
- [ ] MuleSoft process and system APIs implemented (when unblocked)
- [ ] Decision mapping implemented per Customer rules
- [ ] One Assessment per Applicant; audit logging via Assessment
- [ ] Documentation updated; story mapped in JIRA
