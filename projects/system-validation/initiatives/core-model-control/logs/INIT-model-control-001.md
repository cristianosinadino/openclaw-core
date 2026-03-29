# INIT-model-control-001 — Core Model Control Layer

## Scope / Objective
Build a capability-based control layer (routing, rate limiting, budgets, provider health, retries, logging) plus validation scenario proving the controls.

## Intake Notes
- Requester: Cristiano (2026-03-23)
- Constraints: No direct model calls from agents, no hardcoded credentials, code must stay project-agnostic.

## Plan
1. Author initiative scaffolding (context/docs/requirements/rules) ✅.
2. Create configs: `config/model-routing.json`, `config/provider-limits.json`, `config/budgets.json`.
3. Implement services: `modelRouter.js`, `rateLimiter.js`, `tokenBudget.js`, `providerHealth.js`, `modelControlLogger.js`, `requestExecutor.js`.
4. Add validation script under `projects/system-validation/.../core-model-control/scripts` covering routing + throttling + fallback + budget downgrade.
5. Execute validation script, capture logs, and document results.

## Execution Log
_Pending_

## Validation
_Pending_
