# ADR-0001: LWC Architecture for DAO (Main Street Bank)

**Status**: Accepted  
**Date**: 2025-01-16  
**Decision Makers**: Main Street Bank Development Team  
**Related ADRs**: N/A

---

## Context

We need a scalable, testable, and user-friendly Lightning Web Component (LWC) architecture for the Deposit Account Opening (DAO) solution. The application requires a guided, multi-step user experience with validation, auto-save, and integration with backend services for products, validation, and submission.

- Background: DAO requires collecting applicant data, selecting products, optionally capturing collateral, and final review/submit.
- Current situation: No standardized LWC architecture across steps; need consistent patterns for state, navigation, and services.
- Why a decision is needed: Ensure consistent component boundaries, event flows, state management, and integration patterns to improve maintainability and onboarding.

---

## Decision

Adopt a container-child multi-step architecture with a single orchestrator component, `daoApplicationFlow`, responsible for navigation, state, and rendering step components.

- Use `daoApplicationFlow` as the stateful container and step navigator.
- Render step components dynamically per step: `applicantDetails`, `productSelection`, `collateralEntry`, `reviewAndSubmit`.
- Standardize events for step navigation and persistence: `next`, `back`, `save`, `submit`.
- Implement auto-save at each step and full validation before progression and on submit.
- Integrate with services for validation, product data, and application persistence.

What we won't do:
- We won't build a monolithic single LWC with all steps in one file.
- We won't rely on Aura for orchestration.
- We won't use Salesforce Screen Flows for the primary UI of DAO.

---

## Rationale

This pattern cleanly separates orchestration concerns from step-specific concerns, improving testability and change isolation while supporting responsive UX and future feature expansion.

### Pros
- Clear separation of concerns (container vs. step components).
- Predictable event and data flow with standardized events.
- Easier unit and integration testing per component.
- Supports progressive disclosure and responsive layouts.
- Facilitates save/resume and state rehydration.

### Cons
- Requires explicit state synchronization across steps.
- More boilerplate for event wiring and data contracts between components.

### Alternatives Considered

**Option A: Monolithic LWC**  
- Rejected because: Harder to maintain, test, and scale; poor separation of concerns.

**Option B: Salesforce Screen Flows**  
- Rejected because: Limited flexibility for custom UI/UX and complex client-side logic.

**Option C: Aura-based orchestration**  
- Rejected because: Legacy framework, less alignment with modern LWC best practices.

---

## Consequences

### Positive
- Consistent developer experience across steps.
- Improved maintainability and onboarding.
- Clear extension points for adding/removing steps.

### Negative
- Slightly higher upfront setup for container/child scaffolding.
- Requires disciplined event contracts and state typing.

### Neutral
- Choice of state storage (in-memory vs. Lightning Data Service) remains flexible and can evolve.

---

## Implementation

- Container: `daoApplicationFlow` manages navigation, state, and rendering.
- Steps: `applicantDetails`, `productSelection`, `collateralEntry`, `reviewAndSubmit`.
- Standard events: `next`, `back`, `save`, `submit`.
- Auto-save at each step; full validation before progression and on submit.
- Services used:
  - `DAOValidationService` for validation
  - `DAOProductService` for product data and recommendations
  - `DAOApplicationService` for save/submit

**Affected Components:**
- `force-app/main/default/lwc/daoApplicationFlow`
- `force-app/main/default/lwc/applicantDetails`
- `force-app/main/default/lwc/productSelection`
- `force-app/main/default/lwc/collateralEntry`
- `force-app/main/default/lwc/reviewAndSubmit`

**Migration Required**: No (new pattern for DAO; future components should align).

---

## Iteration Notes (2025-10-26)

- For Iteration 1 (ST-001), we are keeping validation client-side only.
- On Next, the container will persist the active step via an Apex upsert and surface any DML/CRUD/FLS errors to the UI.
- Server-side business validators (e.g., OFAC/KYC/KYB hooks) are deferred to a later story and will be reintroduced behind a pluggable validator seam.

## Compliance

Does this decision affect:
- [ ] Security policies
- [x] Data privacy (PII) — e.g., SSN must be encrypted and handled securely
- [ ] Regulatory requirements
- [ ] Audit trails

---

## References

- Component overview and details originally documented in `docs/04-implementation/lwc-architecture.md`
- Data Model: `/docs/01-foundation/data-model.md`
- User Workflows: `/docs/03-workflows/salesforce-user-workflow.md`
- API Integration: `/docs/04-implementation/dao-api-quickstart.md`
- Field Mappings: `/docs/01-foundation/field-mappings.md`

---

**Created**: 2025-01-16  
**Last Updated**: 2025-01-16  
**Review Date**: 2025-03-31
