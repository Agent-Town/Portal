# TDD milestones (RALPH-ready)

Each milestone has a measurable “done” state validated by Playwright.

## M0 — Server boots
- `/api/health` returns `{ ok: true }`.

## M1 — Home basics
- Home renders.
- Team Code appears.
- `/skill.md` is reachable.

**Tests**: `e2e/01_home.spec.js`

## M2 — Agent connect
- Agent can call `/api/agent/connect`.
- UI shows “Agent connected”.

## M3 — Match unlock
- Human selects a sigil.
- Agent selects same.
- UI shows UNLOCKED and enables Open button.

**Tests**: `e2e/02_match_unlock.spec.js`

## M4 — Co-press Open
- Human presses Open.
- Agent presses.
- Browser navigates to `/create`.

## M5 — Co-create
- Human paints pixels.
- Agent paints pixels via API.
- Human sees agent changes.

## M6 — Share link
- Human generates share link.
- House page shows share URL.
- Public share page is read-only.

## M7 — Leaderboard
- Creating a share link adds the team.
- Leaderboard lists the team.

**Tests**: `e2e/03_create_share_leaderboard.spec.js`

(You can add M8 for post URL capture if desired.)

## M8 — Avatar upload pipeline (deterministic)
- Human can upload an avatar image.
- Server creates a job and reaches terminal state.
- Completed job returns a deterministic atlas package and preview assets.
- Avatar jobs/packages are session-scoped.

**Tests**: `e2e/20_avatar_contract.spec.js` through `e2e/29_worldmap_avatar_runtime.spec.js` (see `specs/07_avatar_pipeline_option1.md`)

## M9 — Static asset pipeline (deterministic)
- Human can upload a static asset image.
- Server creates a job and reaches terminal state.
- Completed job returns `sprite.png`, `sprite@2x.png`, and `manifest.json`.
- Static asset jobs/packages are session-scoped.

**Tests**: `e2e/30_static_asset_contract.spec.js` through `e2e/32_static_asset_determinism.spec.js` (see `specs/08_static_asset_pipeline.md`)
