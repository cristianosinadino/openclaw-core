# Migration Plan

## Goal
Move this hybrid workspace from one machine to another with minimal rebuild work.

## Before migration
- Run `scripts/export_state.sh`
- Copy the repo folder and the newest export bundle
- Note your OpenClaw provider/integration settings

## On the new machine
1. Install Docker
2. Clone or copy this repo
3. Restore exported files
4. Start Docker services with `docker compose up -d`
5. Install OpenClaw on host
6. Re-run onboarding only as needed

## Risk controls
- Keep `.env` backed up securely
- Keep raw data separate from processed outputs
- Never depend on random host folders outside this repo
