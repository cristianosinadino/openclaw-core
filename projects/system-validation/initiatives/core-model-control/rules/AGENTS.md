# Core Model Control Layer — Agent Rules

## Required Reading
1. `context/000-initiative-overview.md`
2. `docs/IMPLEMENTATION-MASTER.md`
3. Applicable requirement in `requirements/active/`
4. Task log under `logs/`

## Execution Constraints
- Agents **must not** call provider APIs directly; only `requestExecutor` mediates requests.
- Capability-first: every call specifies `capability`, `project`, `agent`, and `estimatedTokens`.
- Update `config/*.json` instead of changing code when adjusting routing/policies.
- Logs are immutable audit trails. Never edit `logs/model-control/*.jsonl` manually.
- All code uses CommonJS, async/await, and no external runtime dependencies.

## Validation Gates
- `runRoutingValidation.js` must demonstrate capability routing, rate limiting, fallback, and budget downgrade without crashing.
- Unit scripts must exit 0; failures require escalation with log references.
