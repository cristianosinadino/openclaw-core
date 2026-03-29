# System Validation Domain

This domain captures cross-initiative validation tooling for OpenClaw Core. It hosts mission-control level services that monitor agents, persist memory, and surface operational telemetry across projects.

## Structure
- `rules/AGENTS.md` — domain-specific guardrails for any AI agent operating in this domain.
- `initiatives/mission-control-dashboard/` — current initiative delivering the Mission Control Dashboard.
- `model-policy.yaml` — model overrides (inherits from `config/models/core-model-policy.yaml`).

All execution artifacts, memory, and logs that originate from this domain must stay within this directory tree.
