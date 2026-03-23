# OpenClaw Core

> A project-agnostic AI execution layer for running multiple independent workflows.

---

## What This Is

OpenClaw Core is not a single-purpose repository.

It is a reusable infrastructure layer that hosts isolated AI-driven projects, each with its own agents, memory, logs, and logic, without cross-contamination.

Projects that can run inside this system:
- Salesforce autonomous development
- GoHighLevel automation
- Web scraping and parsing pipelines
- Business intelligence agents
- Internal tooling and experimentation

---

## Architecture

Hybrid setup: core runtime on host, support services via Docker only when needed.

### Host (Always Running)
- OpenClaw CLI + Gateway
- Node.js runtime
- AI provider (OpenAI / Anthropic)

### Docker (Optional, On Demand)
- PostgreSQL for structured storage
- Redis for queues, caching, and coordination

> Docker services are enabled only when a project justifies them.

---

## System Rules

These are non-negotiable:

| Rule | Detail |
|------|--------|
| Project isolation | All project logic lives under `/projects/<project-name>/` only |
| No cross-project logic | Core folders never contain project-specific code |
| Secrets via `.env` | No hardcoded credentials anywhere |
| Portable by default | No assumption of persistent local state |
| Minimal tooling | No tools, hooks, or integrations enabled without justification |
| Validate before scaling | Every workflow must pass validation before optimization |

---

## Governance

Use these files as the canonical execution baseline before starting any initiative/task:

- [`CORE_RULES.md`](CORE_RULES.md): hierarchy, precedence, lifecycle, validation, and isolation.
- [`TRACEABILITY.md`](TRACEABILITY.md): ID formats and per-task logging requirements.
- [`ESCALATION.md`](ESCALATION.md): validation-failure triggers, actions, and escalation ownership.

---

## Structure

```text
openclaw-core/
├── agents/
├── config/
├── data/
├── docs/
├── logs/
├── memory/
├── parsers/
├── projects/
│   └── salesforce-lab/
├── scrapers/
├── scripts/
├── services/
├── workflows/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Getting Started

1. Copy `.env.example` to `.env` and fill credentials.
2. Confirm `.env` is ignored by git.
3. Open `projects/salesforce-lab/README.md` for initiative-level contract and flow.
4. Start from an active requirement in an initiative under `projects/salesforce-lab/initiatives/`.
