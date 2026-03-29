# INIT-mission-control-001 — Mission Control Dashboard build-out

## Scope / Objective
Design and implement a Mission Control Dashboard for OpenClaw Core covering memory, timeline, agent instrumentation, API exposure, and a minimal UI.

## Intake Notes
- Requester: Cristiano (2026-03-23)
- Drivers: Need centralized visibility, project-scoped memory, and agent orchestration monitoring.
- Constraints: Enforce project isolation, avoid fake data, prefer modular services over monoliths.

## Pre-flight Status
- Domain `system-validation` created 2026-03-23 but still needs `rules/AGENTS.md`, `model-policy.yaml`, and initiative context/docs/requirements before execution.
- Action: author domain + initiative scaffolding as part of this task prior to any code implementation. ✅ Completed (2026-03-23).

## Plan
1. Author governance scaffolding for the new domain/initiative (rules, context overview, baseline requirements file).
2. Implement memory infrastructure (directory layout + `memoryService.js`) supporting global & project stores with journaling and metadata.
3. Implement `agentLogger.js` and `timelineService.js` to capture agent events and convert them into a deduped timeline feed.
4. Build backend access surface: REST server exposing `/memory`, `/timeline`, `/projects`, `/agents/status` and serving static assets.
5. Build a minimal web UI (vanilla JS) that renders project list, memory panes, agent status, and the timeline with search.
6. Stand up `projects/system-validation` sample pipeline (INPUT→PROCESS→VALIDATE→STORE→ACTION) that exercises the instrumentation and persists entries.
7. Validate (API smoke tests + timeline/memory output) and document usage.

## Execution Log
1. **Governance scaffolding** — Created `projects/system-validation` domain README, `rules/AGENTS.md`, `model-policy.yaml`, and initiative-level context, docs, and `requirements/active/ST-001-mission-control-dashboard.md`. Logged task ID before implementation and ensured directories existed.
2. **Service layer** — Authored `services/memoryService.js`, `agentLogger.js`, `timelineService.js` with filesystem-backed memory stores, log persistence, and deduped timeline generation.
3. **Backend + UI** — Added `server.js` plus `public/index.html`, `styles.css`, `app.js` for the Mission Control dashboard. Server handles `/memory`, `/timeline`, `/projects`, `/agents/status`, `/healthz`, and static assets.
4. **Sample pipeline** — Built `projects/system-validation/initiatives/mission-control-dashboard/scripts/runSamplePipeline.js` to emit INPUT → PROCESS → VALIDATE → STORE → ACTION telemetry. Executed via `node .../runSamplePipeline.js` to seed logs/memory as requested ("Re-run previous task" directive satisfied by full pipeline rerun).
5. **API smoke tests** — Temporarily launched `PORT=4242 node server.js`, then `curl`ed `/projects`, `/timeline?project=system-validation`, `/memory?project=system-validation&type=journal`, and `/agents/status` to confirm live data. Process terminated after verification.

## Validation
- `node projects/system-validation/initiatives/mission-control-dashboard/scripts/runSamplePipeline.js` → produced 11 timeline events covering INPUT→PROCESS→VALIDATE→STORE→ACTION.
- `node -e "const timeline=require('./services/timelineService');timeline.buildTimeline('system-validation').then(...);"` → confirmed 11 deduped events with error + decision mirroring.
- `curl http://127.0.0.1:4242/projects` → returned both `salesforce-lab` and new `system-validation` domain.
- `curl "http://127.0.0.1:4242/timeline?project=system-validation"` → returned timeline payload containing each workflow stage.
- `curl "http://127.0.0.1:4242/memory?project=system-validation&type=journal&limit=5"` → showed mirrored journal entries with timestamps & metadata.
- `curl http://127.0.0.1:4242/agents/status` → surfaced orchestrator/builder/validator/action states with last stages + timestamps.

## Artifacts / Outputs
- Domain + initiative scaffolding under `projects/system-validation/`.
- Services: `services/memoryService.js`, `services/agentLogger.js`, `services/timelineService.js`.
- REST/API server: `server.js` plus `public/` assets.
- Sample pipeline + telemetry: `projects/system-validation/initiatives/mission-control-dashboard/scripts/runSamplePipeline.js` and generated data in `/logs/agents` + `/memory/projects/system-validation`.

## Risks / Follow-ups
- Server currently uses Node stdlib HTTP; consider Express/Fastify if routing grows.
- No persistent DB adapter yet; future work may require PostgreSQL integration for higher scale.
- UI is static; hot-reload/dev tooling not configured.
