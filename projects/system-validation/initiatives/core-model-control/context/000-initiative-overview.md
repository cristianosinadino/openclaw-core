# Core Model Control Layer — Initiative Overview

**Initiative**: core-model-control  
**Domain**: system-validation  
**Owner**: Mission Control  
**Status**: Active (2026-03-23)

## Objective
Implement a centralized model control layer so OpenClaw agents request high-level capabilities (reasoning, extraction, validation, etc.) instead of raw model names. The layer must govern routing, rate limits, provider health, token budgets, retries, fallbacks, and audit logging.

## Key Deliverables
- Capability routing config + runtime (`modelRouter.js`).
- Rate limiting + throttling service covering provider/model/project/agent.
- Token budget tracking with downgrade/fallback rules.
- Provider health monitor with failure thresholds and recovery.
- Request executor that orchestrates routing, retries with exponential backoff+jitter, and logging.
- Validation scenario under `projects/system-validation` proving routing, rate limiting, fallback, and budget downgrade.

## Success Criteria
1. Agents ask for capabilities; modelRouter resolves provider/model per policy.
2. Config files in `/config` define routing, provider limits, budgets, and can be updated without code changes.
3. Rate limiter enforces provider, model, project, and agent windows; logs throttle events.
4. Token budget blocks or downgrades requests once limits are hit, logging each decision.
5. Request executor retries with exponential backoff + jitter on throttles/timeouts and steps through fallback chain when needed.
6. Validation script demonstrates capability routing, rate limiting, fallback, and budget downgrade.
