# ADR-0002: Configuration-Driven Wizard Pattern

**Status**: Accepted  
**Date**: 2025-11-03  
**Decision Makers**: Development Team  
**Related ADRs**: ADR-0001

---

## Context

The DAO wizard implementation needs to support multiple future projects with different workflows, steps, and business logic. The initial implementation was specific to the "Business In-Branch" wizard, but we need a framework that can be reused across different DAO types (e.g., Consumer Unsecured, Commercial Lending) without duplicating code.

Key requirements:
- Support multiple wizard types in the same org
- Minimize code changes when adding new wizards
- Maintain a single, generic container component
- Enable configuration-driven step definitions

---

## Decision

We will implement a **configuration-driven wizard pattern** where:

1. The `daoWizardContainer` LWC is a generic "player" that accepts a `wizardApiName` property
2. All wizard steps are defined in `Wizard_Step__mdt` custom metadata records
3. Steps are grouped by `WizardApiName__c` field to create distinct wizards
4. The container dynamically loads and renders steps based on metadata configuration
5. No hardcoded wizard logic exists in the container component

---

## Rationale

### Pros
- **Reusability**: One container serves all wizards
- **Maintainability**: New wizards require only metadata records, not code changes
- **Scalability**: Can support unlimited wizard types
- **Testability**: Each wizard can be tested independently
- **Deployment**: Metadata-driven changes are safer than code deployments

### Cons
- **Initial complexity**: Requires more upfront design
- **Metadata management**: Teams must understand custom metadata patterns
- **Debugging**: Configuration issues may be harder to trace than code issues

### Alternatives Considered

**Option A: Separate Container per Wizard**
- Rejected because: Would duplicate 95% of container logic across components

**Option B: Single Hardcoded Wizard**
- Rejected because: Not scalable; every new wizard requires code changes

---

## Consequences

### Positive
- Future DAO projects can be launched with minimal development effort
- Container logic is tested once and reused everywhere
- Business users can modify wizard flows via metadata (with proper training)
- Clear separation between framework (container) and configuration (metadata)

### Negative
- Developers must understand the metadata-driven pattern
- Initial setup requires more planning than a hardcoded approach
- Metadata records must be carefully managed across environments

### Neutral
- Documentation becomes critical for onboarding new developers
- Custom metadata deployment must be part of standard CI/CD

---

## Implementation

### Step 1: Container Refactoring
- Ensure `daoWizardContainer` accepts `@api wizardApiName` property
- Wire `getSteps` Apex method with dynamic `wizardApiName` parameter
- Remove any hardcoded step references

### Step 2: Metadata Schema
- `Wizard_Step__mdt` fields:
  - `WizardApiName__c` (Text, required) - Groups steps into wizards
  - `Order__c` (Number, required) - Defines step sequence
  - `ComponentBundle__c` (Text, required) - LWC name to render
  - `StepLabel__c` (Text) - User-facing label
  - `Skippable__c` (Checkbox) - Optional step flag
  - `ValidatorClasses__c` (Text) - Comma-delimited Apex validators
  - `HelpText__c` (Long Text Area) - User guidance

### Step 3: Documentation
- Create `ARCHITECTURE.md` in `docs/01-foundation/`
- Document the pattern for creating new wizards
- Provide examples of metadata records

**Affected Components:**
- `daoWizardContainer` (LWC)
- `WizardConfigService` (Apex)
- `Wizard_Step__mdt` (Custom Metadata Type)

**Migration Required**: No (existing wizard continues to work)

---

## Compliance

Does this decision affect:
- [ ] Security policies
- [ ] Data privacy (PII)
- [ ] Regulatory requirements
- [ ] Audit trails

---

## References

- `/docs/01-foundation/ARCHITECTURE.md` - Implementation guide
- `/force-app/main/default/lwc/daoWizardContainer/` - Container component
- `/force-app/main/default/objects/Wizard_Step__mdt/` - Metadata type definition

---

**Created**: 2025-11-03  
**Last Updated**: 2025-11-03  
**Review Date**: 2026-02-03
