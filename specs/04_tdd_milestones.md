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
- Manage page loads snapshot and shows share URL.
- Public share page is read-only.

## M7 — Dual opt-in
- Human opts in.
- Agent opts in.
- Share page shows “Added to leaderboard”.
- Leaderboard lists the team.

**Tests**: `e2e/03_create_share_leaderboard.spec.js`

(You can add M8 for post URL capture if desired.)
