# 003 — Absolute Path Resolution for Workflow Scripts

## Context
Workflow script commands were defined as relative paths (`node projects/system-validation/...`). When executed via the OpenClaw plugin runtime, the process `cwd` is `/` (root), causing Node to resolve these as `/projects/system-validation/...` — a path that does not exist.

## Decision
All workflow script paths must be constructed as absolute paths at module load time using `path.join(__dirname, '...')`. The single source of truth is `services/workflowResolver.js`.

```js
const SCRIPTS = path.join(__dirname, '../projects/system-validation/initiatives/core-model-control/scripts');
// produces: /Users/.../openclaw-core/projects/system-validation/.../scripts
```

## Why
- `__dirname` is always the absolute directory of the loaded file, regardless of process `cwd`
- Relative paths in `exec()` are resolved against `cwd`, which is environment-dependent and unreliable in plugin runtimes
- Setting `cwd` in `execAsync` options is insufficient if the command string itself contains a relative path that Node resolves first

## Tradeoffs
- Paths are tied to the physical location of the repo on disk
- Moving the repo requires no code change — `__dirname` resolves dynamically at runtime

## Status
Active

## Date
2026-03-29
