# 002 Architecture Summary

## Core Design
- Configuration-driven multi-step DAO wizard on Salesforce FSC.
- `daoWizardContainer` orchestrates step sequence and payload state.
- `daoWizardStepRouter` dynamically renders step LWCs from metadata.

## Key Services
- `DaoWizardConfigService`: reads `Wizard_Step__mdt` configuration.
- `DaoWizardDataService`: loads resume/prefill data (`cacheable=false` behavior documented).
- `DaoWizardPersistenceService`: step-based upsert and validation routing.
- `DaoComplianceRules`: metadata-driven compliance logic.

## Data + Config
- Primary objects: `ApplicationForm`, `Applicant`, `ApplicationFormProduct`, `IdentityDocument`.
- Key CMDTs: `Wizard_Step__mdt`, `DAO_Primary_Document__mdt`, `DAO_BusinessType_TaxRule__mdt`, `DAO_ApplicantRoleCompliance__mdt`.

## Decisions Captured
- ADRs copied under `docs/architecture-decisions/` for implementation rationale and patterns.
