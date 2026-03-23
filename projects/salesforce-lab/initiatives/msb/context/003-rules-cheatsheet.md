# 003 Rules Cheatsheet

## Mandatory Pre-Work
1. Read `docs/IMPLEMENTATION-MASTER.md`
2. Read `docs/rules-global.md`
3. Read `docs/02-requirements/backlog.md`
4. Read relevant story file(s)
5. Verify object/field API names in `force-app/main/default/objects`
6. Scan touched LWC/Apex source files

## Non-Negotiables
- Use canonical FSC object names (for example `ApplicationForm`, `Applicant`).
- Enforce security patterns (`with sharing`, CRUD/FLS awareness).
- Keep implementation metadata-driven where defined (Wizard and compliance CMDTs).
- Use minimal diffs and follow existing repository patterns.

## Delivery Hygiene
- Update docs when schema/behavior changes.
- Use branch-based workflow and conventional commit style.
- Include rollback strategy for changes.
