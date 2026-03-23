# Main Street Bank - Development Backlog

**Last Updated**: 2025-11-11  
**Client**: Main Street Bank

## 🎫 Story ID Reference

| Story ID | JIRA Stories | Status |
|----------|--------------|--------|
| ST-001 | [MSB-18](https://zennify.atlassian.net/browse/MSB-18), [MSB-21](https://zennify.atlassian.net/browse/MSB-21) | ✅ Completed |
| ST-002 | TBD | 🔄 In Progress |
| ST-003 | [MSB-24](https://zennify.atlassian.net/browse/MSB-24) | 📋 Up Next |
| ST-004 | TBD | 📋 Backlog |

> **For AI Agents**: Use the JIRA links above to access detailed story information via JIRA MCP when needed.

---

## 🎯 Active Sprint

### In Progress
- [ ] **ST-002** — Persist Application Data ([story file](ST-002-persist-application-data.md))
  - Implement full persistence logic for ApplicationForm, Business Account, Applicant, PersonAccount, and ACRs
  - Handle conditional persistence based on wizard step context
  - Status: Not Started (story created 2025-11-05)

### Up Next
- [ ] **ST-003** — Pre-populate Wizard Data ([story file](ST-003-pre-populate-wizard-data.md))
  - Pre-populate wizard from Opportunity or Account (Business/Person)
  - Supports 3 entry points with field mappings from MSB-24
  - Depends on: ST-002
- [ ] ST-004 — Additional Applicants Typeahead
  - Depends on: ST-003
- [ ] ST-005 — Product Rules & Recommendations

---

## 📋 Backlog

- [ ] **ST-008** — Book to Core (COCC Integration) ([story file](ST-008-book-to-core.md))
  - Salesforce → MuleSoft → COCC integration for approved FinancialAccount booking
  - Depends on: ST-007, COCC credentials and code values from Customer
- [ ] **ST-009** — KYB/KYC Integration (FIS Code Connect) ([story file](ST-009-kyb-kyc-integration.md))
  - Single-provider KYB/KYC and OFAC via FIS Code Connect (BizChex/QualiFile/OFAC), MuleSoft, Salesforce
  - Depends on: ST-001–ST-003, provider design inputs and credentials from Customer
- [ ] **Experience Cloud Compatibility**: Make the `daoWizardContainer` LWC compatible with Experience Cloud. This includes: refactoring Workspace API calls to be environment-aware, updating the component's meta.xml file with community targets, ensuring guest user permissions are handled, and verifying styling works with community themes.
- [ ] **Wizard UI Polish**: Additional UI enhancements beyond high-priority fields (e.g., conditional field visibility, field help text, inline validation messages)

_Track new stories here or link to story files in `docs/02-requirements/`_

---

## ✅ Completed

| ID | Title | Completed Date | Summary |
|----|-------|----------------|---------|
| ST-001 | Wizard Foundation (CMDT + Container/Router + Navigation) | 2025-10-27 | CMDT orchestration, container/router pattern, client-side validation, upsert-on-Next persistence. All components deployed to msb-sbox. |

---

## Notes
- Update this file when stories move state.
- On story completion, add a row to the Completed table with a brief summary.
