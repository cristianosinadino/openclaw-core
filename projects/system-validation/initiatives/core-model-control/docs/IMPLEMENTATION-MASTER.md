# Core Model Control Layer — Implementation Master

## Components
- **modelRouter.js** — maps capability requests to ordered provider/model candidates based on `config/model-routing.json`, provider health, and policy overrides.
- **rateLimiter.js** — sliding-window limiter for provider/model/project/agent keys. Reads thresholds from `config/provider-limits.json` and reports throttle events.
- **tokenBudget.js** — tracks aggregate token usage per project/agent/provider. Persists state in `data/runtime/token-usage.json` and enforces downgrades using `config/budgets.json`.
- **providerHealth.js** — monitors per-provider status, tracks failures/timeouts, exposes `isHealthy`, `reportSuccess`, `reportFailure`, and quarantines unhealthy providers for a cooling period.
- **requestExecutor.js** — orchestrates routing, invokes rateLimiter/budgets/health checks, performs exponential backoff with jitter, advances fallback candidates, and logs every decision, retry, or block.
- **modelControlLogger.js** — shared logger that writes JSONL entries to `logs/model-control/<date>.jsonl`.

## Configuration
- `config/model-routing.json` — capability → candidate definitions + default capabilities per agent.
- `config/provider-limits.json` — RPM/TPM ceilings by provider/model/project/agent.
- `config/budgets.json` — global/project/agent token budgets, downgrade policies, and alert thresholds.

## Validation
`projects/system-validation/initiatives/core-model-control/scripts/runRoutingValidation.js` exercises four scenarios:
1. Capability routing (orchestrator requesting `reasoning_high`).
2. Rate limit enforcement (rapid parser calls).
3. Provider fallback (forcing unhealthy provider).
4. Budget downgrade (exhaust summarizer allowance → switch to `summarize_cheap`).

Each scenario prints outcomes and the logger records events for audit.
