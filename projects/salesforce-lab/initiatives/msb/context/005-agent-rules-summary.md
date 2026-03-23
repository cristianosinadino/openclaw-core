# 005 Agent Rules Summary

Source: legacy hidden rules file from `msb-fsc-main` (normalized to IDE-agnostic rules in this initiative)

Key guidance captured:
- Read order before implementation: `docs/IMPLEMENTATION-MASTER.md`, `docs/rules-global.md`, backlog, relevant story, object metadata, then touched LWC/Apex code.
- Treat `docs/rules-global.md` and `docs/IMPLEMENTATION-MASTER.md` as canonical sources of truth.
- Verify object and field API names in `force-app/main/default/objects` before coding.
- Follow PR hygiene: report files read, constraints, design decisions, test plan, and rollback notes.
- Keep rules maintained in canonical docs, not duplicated ad hoc.
