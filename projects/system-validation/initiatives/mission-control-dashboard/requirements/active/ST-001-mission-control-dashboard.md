# ST-001 — Mission Control Dashboard

**Status**: In Progress  
**Created**: 2026-03-23  
**Owner**: Mission Control

## Story
As an OpenClaw operator I need a Mission Control Dashboard that unifies memory, agent logs, and timelines so I can trust cross-project automations.

## Acceptance Criteria
1. **Memory System**
   - Supports global + project scopes stored under `/memory/`.
   - Each entry records timestamp, agent, project, type (`journal|decision|error|insight|long-term`), content, metadata JSON.
   - Provides APIs to write, query, and summarize memories.

2. **Agent Instrumentation**
   - All agents log start/end, decisions, validation, and errors through a shared logger writing to `/logs/agents/<date>.jsonl`.
   - High-signal events can optionally mirror into memory.

3. **Timeline Engine**
   - Consumes agent logs + memory to produce deduped timeline items per project (format: `[time] — [event title] / What: details`).
   - Handles malformed log entries gracefully and deduplicates repeated events.

4. **Backend Services**
   - Implement `services/memoryService.js`, `services/timelineService.js`, `services/agentLogger.js`.
   - REST endpoints: `GET /memory`, `GET /memory?project=`, `GET /timeline?project=`, `GET /projects`, `GET /agents/status`.
   - Serve static dashboard assets from `/public`.

5. **UI**
   - Minimal web UI showing Projects (left), Memory (long-term + journal), Agents, and a searchable timeline feed.

6. **Sample Pipeline**
   - `projects/system-validation` includes a runnable script that executes INPUT→PROCESS→VALIDATE→STORE→ACTION, logging each step and writing memory entries.
   - After running, timeline + memory endpoints return non-empty scoped data.

## Definition of Done
- Services + UI committed, sample pipeline executed, validation evidence captured in the initiative log.
- README / docs updated to describe how to run the dashboard + pipeline.
- No lint errors, and commands succeed on a clean checkout (`node server.js`, pipeline script, API curl smoke tests).
