# openclaw-core — Claude Code Context

## Knowledge layers

| Layer | Path | Purpose |
|---|---|---|
| Durable decisions | `docs/decisions/` | Finalized architecture and integration choices |
| Patterns | `docs/patterns/` | Repeatable implementation patterns |
| Workflow contracts | `docs/workflows/` | Inputs, outputs, and LLM policy per workflow |
| Index | `docs/index.md` | Entry point — update when adding new durable knowledge |
| Operational memory | `memory/` | Chronological session logs — not canonical for architecture |

**`memory/` is not the source of truth for finalized decisions. Use `docs/` for that.**

## Key decisions already made

- OpenClaw Plugin SDK (`plugins.load.paths`) is the supported integration path — see [001](docs/decisions/001-openclaw-plugin-sdk-integration.md)
- Free-form prompt interception is not supported by the Plugin SDK; slash commands (`registerCommand`) are the correct trigger — see [002](docs/decisions/002-command-driven-workflows.md)
- All workflow script paths must be absolute (`path.join(__dirname, ...)`); runtime `cwd` is unreliable — see [003](docs/decisions/003-absolute-path-resolution.md)
- Deterministic steps (CLI calls, file I/O) belong in scripts, not in the LLM prompt
- OpenClaw plugin runtime requires a cold restart after code changes: `openclaw stop && openclaw start`

## Workflow entry points

- `services/workflowResolver.js` — keyword → script mapping (single source of truth for paths)
- `services/promptExecutor.js` — executes workflows, handles logging and fallback
- `plugin.js` — OpenClaw plugin registration (slash commands only, no paths)
- `tui.js` — local REPL for development (free-form prompts, LLM fallback)
- `server.js` — HTTP gateway (`POST /prompt`)
