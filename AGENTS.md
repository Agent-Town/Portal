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

## Skill Contract Convention (mandatory)

To keep future skill and worker work safe, preserve this convention:

- `public/skill.md` is the source of truth for the external-agent playbook.
- `e2e/55_phase3_skill_contract_line.spec.js` is the baseline contract line for skill compatibility.
- `docs/internal-skill-testline.md` tracks capability-to-test mapping and planned expansions.

When changing skill behavior:

- Update `public/skill.md`.
- Update or extend `e2e/55_phase3_skill_contract_line.spec.js` (or add `e2e/56+` tests).
- Update `docs/internal-skill-testline.md` with the new capability row and coverage.

When changing worker behavior required by skill files (`skill.md` / `SKILL.md`):

- Add deterministic Playwright coverage first (test-first).
- Keep tests API-first and behavior-focused so UI reshuffles do not break contract validation.
- Do not merge worker-skill changes unless the full suite passes (`npm test`).
