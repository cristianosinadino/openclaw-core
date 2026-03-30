# 001 — OpenClaw Plugin SDK Integration

## Context
openclaw-core needed to integrate with the real OpenClaw TUI rather than building a parallel interface. The OpenClaw binary is a compiled external product with no patchable source in this repo.

## Decision
Use the OpenClaw Plugin SDK as the integration path. Load the plugin via `plugins.load.paths` in `~/.openclaw/openclaw.json`. Declare the plugin with `openclaw.plugin.json` at the repo root.

## Why
- The Plugin SDK is the only documented, supported extension mechanism
- `plugins.load.paths` allows loading a local directory without publishing to npm
- The plugin manifest + `package.json` `"openclaw"` extension field tells the SDK which file to load

## Tradeoffs
- Plugin runs in-process inside OpenClaw (no sandbox)
- Plugin id must match `package.json` `"name"` — mismatch causes a warning and may prevent loading
- A cold restart (`openclaw stop && openclaw start`) is required after code changes; hot reload is unreliable

## Status
Active

## Date
2026-03-29
