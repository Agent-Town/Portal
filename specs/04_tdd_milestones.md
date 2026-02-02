# TDD milestones (RALPH-ready)

Each milestone has a measurable “done” state validated by Playwright.

## M0 — Server boots
- `/api/health` returns `{ ok: true }`.

## M1 — Home basics
- Home renders.
- Pair Code appears.
- `/skill.md` is reachable.

**Tests**: `e2e/01_home.spec.js`

## M2 — Agent pairing
- Agent can call `/api/agent/connect`.
- UI shows “Agent connected”.

## M3 — Match unlock
- Human selects a sigil.
- Agent selects same.
- UI shows UNLOCKED and enables beta button.

**Tests**: `e2e/02_match_unlock.spec.js`

## M4 — Co-press beta
- Human enters email and presses.
- Agent presses.
- Browser navigates to `/create`.

## M5 — Co-create
- Human paints pixels.
- Agent paints pixels via API.
- Human sees agent changes.

## M6 — Share link
- Human generates share link.
- Share page loads snapshot and shows share URL.

## M7 — Dual opt-in
- Human opts in.
- Agent opts in.
- Share page shows “Added to wall”.
- Wall lists the pair.

**Tests**: `e2e/03_create_share_wall.spec.js`

(You can add M8 for post URL capture if desired.)
