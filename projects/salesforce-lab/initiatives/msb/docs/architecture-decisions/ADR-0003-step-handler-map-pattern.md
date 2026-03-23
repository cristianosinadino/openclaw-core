# ADR-0003: Step Handler Map Pattern

**Status**: Accepted  
**Date**: 2025-11-03  
**Decision Makers**: Development Team  
**Related ADRs**: ADR-0002

---

## Context

The `WizardPersistenceService` originally used a brittle `if/else if` chain with `.contains()` checks to route step names to their persistence logic. This approach had several problems:

1. **Fragile matching**: `.contains('Applicant')` could incorrectly match `Additional_Applicant_Info`
2. **Not scalable**: Every new step required modifying the central routing logic
3. **Maintenance burden**: Risk of breaking existing steps when adding new ones
4. **Missing handlers**: Three steps (Additional, Services, Documents) had no handlers and would fail

The service needed a more robust, maintainable pattern for routing step names to their persistence logic.

---

## Decision

We will refactor `WizardPersistenceService` to use a **handler map pattern**:

1. Define a private `IStepHandler` interface for step logic
2. Create inner handler classes that implement `IStepHandler`
3. Register all step handlers in a static `Map<String, IStepHandler>`
4. Route step names via exact map lookup instead of `.contains()` checks
5. Provide clear inline documentation for adding new handlers

---

## Rationale

### Pros
- **Exact matching**: No risk of partial string matches
- **Single responsibility**: Each handler class has one job
- **Easy to extend**: Adding a new step requires only 3 steps (method, class, map entry)
- **Self-documenting**: The map serves as a registry of all supported steps
- **Type-safe**: Interface ensures consistent handler signatures

### Cons
- **More code**: Requires inner classes instead of just methods
- **Boilerplate**: Each handler class is small but repetitive

### Alternatives Considered

**Option A: Full Interface-Based Handler Classes**
- Rejected because: Over-engineered for current needs; handlers are simple stubs

**Option B: Keep if/else if with Exact Matching**
- Rejected because: Still requires modifying central logic for every new step

**Option C: Reflection-Based Dynamic Routing**
- Rejected because: Adds complexity and runtime overhead; harder to debug

---

## Consequences

### Positive
- New steps can be added without touching existing routing logic
- Clear, obvious place to register new handlers (the map)
- Eliminates risk of incorrect partial matches
- All 7 current steps now have proper handlers (including previously missing ones)

### Negative
- Slightly more verbose than the original approach
- Developers must remember to add entries to the map

### Neutral
- Pattern is well-documented with inline comments
- Follows common Java/Apex design patterns

---

## Implementation

### Step 1: Define Handler Interface
```apex
private interface IStepHandler {
    PersistenceResponse handle(Id applicationId, Map<String, Object> payload, PersistenceResponse response);
}
```

### Step 2: Create Handler Map
```apex
private static final Map<String, IStepHandler> stepHandlers = new Map<String, IStepHandler>{
    'DAO_Business_InBranch_Applicant' => new ApplicantStepHandler(),
    'DAO_Business_InBranch_Business' => new BusinessStepHandler(),
    // ... etc
};
```

### Step 3: Implement Handler Classes
```apex
private class ApplicantStepHandler implements IStepHandler {
    public PersistenceResponse handle(Id applicationId, Map<String, Object> payload, PersistenceResponse response) {
        return upsertApplicantStep(applicationId, payload, response);
    }
}
```

### Step 4: Update Routing Logic
```apex
IStepHandler handler = stepHandlers.get(stepDeveloperName);
if (handler != null) {
    return handler.handle(applicationId, payload, response);
}
```

### Step 5: Add Missing Handlers
- Created `upsertAdditionalStep`, `upsertServicesStep`, `upsertDocumentsStep` methods
- Added corresponding handler classes
- Registered in the map

**Affected Components:**
- `WizardPersistenceService.cls` (Apex)

**Migration Required**: No (functionally equivalent to original code)

---

## Compliance

Does this decision affect:
- [ ] Security policies
- [ ] Data privacy (PII)
- [ ] Regulatory requirements
- [ ] Audit trails

---

## References

- `/force-app/main/default/classes/WizardPersistenceService.cls` - Implementation
- Deployment: `0AfWE00000ElN9B0AV` (msb-sbox, 2025-11-03)

---

**Created**: 2025-11-03  
**Last Updated**: 2025-11-03  
**Review Date**: 2026-02-03
