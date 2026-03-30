# 002 — Command-Driven Workflows (Slash Commands)

## Context
The goal was to intercept free-form prompts like "run salesforce validation" in the OpenClaw TUI and execute a deterministic workflow instead of sending them to the LLM.

## Decision
Use `api.registerCommand()` with slash commands (`/run-salesforce-validation`) as the workflow trigger. Do not attempt to intercept free-form text prompts.

## Why
After reading the actual Plugin SDK type definitions:
- `message_received` returns `void` — cannot short-circuit the LLM
- `before_prompt_build` / `before_agent_start` can only inject context — cannot replace the agent response
- `registerCommand` is the only hook that fires **before agent invocation** and returns a `ReplyPayload` directly, bypassing the LLM entirely

Free-form prompt interception is not a supported pattern in the Plugin SDK.

## Tradeoffs
- UX changes from free-form text to slash commands: `/run-salesforce-validation` instead of `run salesforce validation`
- Slash commands may only function in messaging channel contexts (Telegram, Discord, etc.) — local TUI support depends on OpenClaw's implementation
- The free-form path still works via `node tui.js` for local development

## Status
Active

## Date
2026-03-29
