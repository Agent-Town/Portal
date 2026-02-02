# Working agreements for coding agents

This repo is a **minimal** Agent Town landing page.

## Primary goals

1. **Minimal UI** (no clutter) — keep it single-purpose.
2. **Human + agent co-op** — the unlock flow requires both participants.
3. **Session-token identity** — do not add external identity providers.
4. **Deterministic testability** — every milestone must be verifiable with Playwright.

## Non-goals / constraints

- Do **not** add point systems, token farming, or engagement hacks.
- Do **not** add heavy frameworks unless absolutely necessary.
- Do **not** introduce real API keys. The Team Code is the only token.

## Commands

Install:
```bash
npm install
```

Dev server:
```bash
npm run dev
```

E2E tests:
```bash
npm test
```

Run a single test file:
```bash
npx playwright test e2e/02_match_unlock.spec.js
```

## Where to change things

- `public/` — HTML/CSS/JS
- `server/` — Express API + session logic
- `e2e/` — Playwright tests (acceptance criteria)
- `specs/` — product + API specifications

## Definition of done

- All Playwright tests pass (`npm test`).
- UX remains minimal.
- API contract stays documented in `specs/02_api_contract.md`.
- Skill remains correct and readable at `/skill.md`.
