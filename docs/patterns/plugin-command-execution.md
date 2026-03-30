# Pattern — Plugin Command Execution

## Summary
Register deterministic workflows as OpenClaw slash commands. Each command calls `executePrompt()` with a fixed prompt string. `workflowResolver` maps that string to a script. No logic lives in `plugin.js` itself.

## Structure

```
OpenClaw TUI
  └── /run-<workflow>                    ← slash command (registerCommand)
        └── plugin.js handler
              └── executePrompt({ prompt })     ← services/promptExecutor.js
                    └── resolveWorkflow(prompt) ← services/workflowResolver.js
                          └── exec(absoluteScriptPath, { cwd: PROJECT_ROOT })
```

## Rules
1. `plugin.js` contains zero script paths — only prompt strings
2. `workflowResolver.js` is the single source of truth for command → script mapping
3. All script paths in `workflowResolver.js` are absolute (`path.join(__dirname, ...)`)
4. `executePrompt` passes `cwd: PROJECT_ROOT` to `exec` as a secondary safety measure
5. Handler returns `{ text: string }` matching the `ReplyPayload` type

## Adding a new workflow
1. Add the script to `projects/system-validation/.../scripts/`
2. Add a mapping to `workflowResolver.js` with a keyword match
3. Add an entry to `OUTPUT_FILE_MAP` in `promptExecutor.js` if the script writes a JSON file
4. Add a `registerCommand` entry in `plugin.js` with a matching prompt string
5. Cold restart OpenClaw: `openclaw stop && openclaw start`
