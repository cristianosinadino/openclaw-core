# Mission Control Dashboard — Implementation Master

## Architecture
- **Memory Service (`services/memoryService.js`)** — writes/query/summarizes memory entries stored under `/memory`. Supports global + project scopes, entry typing (journal, decision, error, insight, long-term), timestamps, and metadata.
- **Agent Logger (`services/agentLogger.js`)** — canonical entry point for agents to record lifecycle events. Emits JSONL logs under `/logs/agents/` and can optionally mirror high-signal events into memory.
- **Timeline Service (`services/timelineService.js`)** — consumes agent logs + high priority memory entries and produces deduped timeline items grouped by date/project.
- **API Server (`server.js`)** — lightweight HTTP server exposing memory/timeline/project/agent status endpoints and serving the Mission Control UI (`/public`).
- **Dashboard UI (`/public/index.html`)** — vanilla JS SPA that renders project list, memory panes, agent status cards, and the timeline feed with search and expand/collapse.
- **Sample Pipeline (`projects/system-validation/initiatives/mission-control-dashboard/scripts/runSamplePipeline.js`)** — exercises the system by running INPUT→PROCESS→VALIDATE→STORE→ACTION, emitting logs + memory entries for validation.

## Data Layout
```
memory/
  global/<type>/<yyyy-mm-dd>.jsonl
  projects/<project>/<type>/<yyyy-mm-dd>.jsonl
logs/
  agents/<yyyy-mm-dd>.jsonl
projects/system-validation/
  initiatives/mission-control-dashboard/
    requirements/
    context/
    docs/
    logs/
    scripts/
public/
  index.html
  styles.css
  app.js
```

## Operational Notes
- All write helpers auto-create directories and dedupe by hashing `timestamp+title+what` where applicable.
- API server defaults to port 4141 (configurable via `PORT`).
- Timeline queries cap at the 30 most recent log files to protect latency; adjust via `MAX_LOG_DAYS` env if needed.
- Memory summaries are heuristic (no model calls) to avoid dependencies.
- Use `node projects/system-validation/initiatives/mission-control-dashboard/scripts/runSamplePipeline.js` to seed data before UI testing.
