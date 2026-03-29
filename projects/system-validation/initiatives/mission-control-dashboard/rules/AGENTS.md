# Mission Control Dashboard — Initiative Rules

Version: 1.0 (2026-03-23)

## Required Reading (per task)
1. `context/000-initiative-overview.md`
2. `docs/IMPLEMENTATION-MASTER.md`
3. Relevant requirement under `requirements/active/`
4. `logs/INIT-mission-control-001.md` (latest execution state)

## Execution Standards
- Follow lifecycle **INTAKE → PLAN → ASSIGN → EXECUTE → VALIDATE → STORE → REPORT** for every workflow automation you instrument.
- All code changes must list (a) files read, (b) constraints extracted, (c) design decisions, (d) validation/test evidence, and (e) rollback notes.
- Memory writes must include `timestamp`, `agent`, `project`, `type`, `content`, and optional `metadata` JSON.
- Timeline events should never duplicate existing entries for the same `timestamp + title + what` key.
- Agent logs are authoritative; do not handcraft fake entries.

## Coding Conventions
- Use CommonJS modules (`module.exports`) for services.
- Prefer async/await with `fs/promises` for file IO.
- Keep dependencies zero or limited to already-installed packages; default to Node stdlib.
- Configuration via environment variables where practical (`PORT`, `MAX_LOG_DAYS`).

## Validation Gates
- Unit-level: run the sample pipeline and ensure `timelineService.buildTimeline('system-validation')` returns ≥5 entries spanning each workflow phase.
- Runtime-level: `GET /timeline?project=system-validation` and `GET /memory?project=system-validation` must succeed without crashes even if directories are empty.
