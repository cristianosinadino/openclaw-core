# ST-002 — Core Model Control Layer

**Status**: In Progress  
**Owner**: Mission Control  
**Created**: 2026-03-23

## Story
As Mission Control I need a capability-based model control layer so every agent request is routed, rate-limited, budgeted, logged, and retried consistently across providers.

## Acceptance Criteria
1. Capability Routing
   - Agents request capabilities (e.g., `reasoning_high`, `extract_structured`).
   - `modelRouter` returns ordered provider/model candidates using `config/model-routing.json` and agent defaults.
2. Rate Limiting
   - `rateLimiter` enforces RPM/TPM by provider, model, project, and agent derived from `config/provider-limits.json`.
   - Throttle events are logged and surfaced to the caller.
3. Token Budgets
   - `tokenBudget` tracks tokens per project/agent and consults `config/budgets.json` for ceilings/downgrades.
   - When budgets run out, either downgrade capability per policy or block with a logged event.
4. Provider Health & Fallbacks
   - `providerHealth` tracks failures; unhealthy providers are skipped until cooldown expires.
   - `requestExecutor` tries next candidate with exponential backoff + jitter on rate limit/timeouts.
5. Logging & API
   - `modelControlLogger` writes every routing decision, retry, throttle, fallback, and budget block to `logs/model-control/<date>.jsonl`.
6. Validation Scenario
   - Script under `projects/system-validation` proves: (a) capability routing, (b) throttling, (c) fallback triggered by forced provider failure, (d) budget downgrade to cheaper capability.

## Definition of Done
- Services + config files exist and are required by validation script.
- Validation script exits 0 and prints scenario outcomes.
- Logs show events for routing, throttles, fallbacks, and budget enforcement.
