# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                # install dependencies
npm run dev                # start Express dev server on port 4173
npm test                   # run full Playwright e2e suite (headless)
npm run test:headed        # run tests with visible browser
npm run test:ui            # Playwright interactive UI mode
npx playwright test e2e/02_match_unlock.spec.js   # run a single test file
npm run build:openclaw-lite   # rebuild OpenClaw Lite worker (auto-runs before dev/test)
npm run build:agent0-sdk      # rebuild Agent0 SDK bundle
```

Tests run single-worker mode against a fresh Express server with a test-only SQLite DB (`data/store.e2e.sqlite`). State is reset between tests via `POST /__test__/reset`.

## Architecture

Full-stack vanilla JavaScript app: Express backend + plain HTML/CSS/JS frontend. No React, no TypeScript, no bundler for the main app.

**Backend** (`server/`): Express serves static files from `public/` and mounts API routes at `/api/*`. Core modules:
- `index.js` — route definitions, middleware, CSP headers
- `sessions.js` — co-op session state machine (in-memory)
- `store.js` — SQLite persistence (`data/store.sqlite`)
- `atlas.js` — agent atlas snapshot and search
- `houseVaultBackend.js` — E2EE house vault (server stores ciphertext only)
- `ponyTransport.js` — Pony Express message relay

**Frontend** (`public/`): Vanilla JS pages with modal-first navigation from the town hub (`index.html`). Key files:
- `app.js` — town hub logic, district hotspots, modal management
- `create.js` — 16x16 co-op pixel canvas
- `house.js` — house unlock, encrypted log viewer
- `privy_bridge.js` — Privy wallet integration
- `skill.md` — external agent playbook (source of truth for agent behavior)

**Agent runtime**: OpenClaw Lite runs in a Web Worker scoped to the page. All agent decisions happen in the worker + LLM, never server-side.

**Vendor submodules** (`vendors/`): `openclaw-lite-main` and `agent0-ts` SDKs. After modifying vendor source under `vendors/openclaw-lite-main/src/`, rebuild with `npm run build:openclaw-lite`.

## Key Constraints (from AGENTS.md)

- **Worker-first architecture**: the browser OpenClaw Lite worker is authoritative for agent behavior. Do not move agent decision logic to the server or fake co-op outcomes in server routes.
- **Modal-first navigation**: experience surfaces (Atlas, Pony, etc.) must be modals on the town hub, not full-page navigations. Full-page nav tears down the Web Worker runtime.
- **Shared-state co-op model**: human and agent operate against the same state machine. Co-op actions requiring both participants must remain two-party flows.
- **Skill contract convention**: when changing skill behavior, update `public/skill.md`, extend `e2e/55_phase3_skill_contract_line.spec.js`, and update `docs/internal-skill-testline.md`.
- **Definition of done**: all Playwright tests pass, UX stays minimal, API contract stays documented in `specs/02_api_contract.md`.
- **No heavy frameworks** unless absolutely necessary. No point systems, token farming, or engagement hacks.

## Testing

Tests are in `e2e/` (145+ Playwright specs). They share an in-memory session map via a single Playwright worker for determinism. The test server uses IPv6 loopback (`http://[::1]:PORT`).

When adding new worker/runtime capabilities, add deterministic Playwright coverage first (test-first). Keep tests API-first and behavior-focused.

## ZHC1 Iterate Prototype (`zhc1-iterate-prototype` branch)

Standalone experience at `/iterate` where human + agent solve a problem through iterative experimentation. All LLM calls go through the OpenClaw Lite browser worker (user's own API key). Server stores state only.

**Frontend**: `public/iterate.html` + `iterate.js` + `iterate.css`
**Agent skill**: `public/skill_iterate.md`
**Backend API** (from `zhc1-iteration-feed`): problem stories, evaluation, experiments, feedback, iteration loop, save games, publication, discovery
**Tests**: `e2e/500_iterate_smoke.spec.js`
**Specs**: `specs/45_zhc1_iterate_prototype_spec.md`, `specs/46_zhc1_iterate_prototype_tdd_spec.md`

## Specs & Documentation

- `specs/02_api_contract.md` — comprehensive HTTP API reference (canonical)
- `specs/01_experience_flow.md` — product UX flow
- `specs/04_tdd_milestones.md` — TDD acceptance criteria
- `public/skill.md` — external agent HTTP playbook
- `public/skill_iterate.md` — iterate loop agent skill
- `docs/providers/README.md` — LLM provider setup guides
