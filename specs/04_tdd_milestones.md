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

## M8 — World map foundation (read-only)
- `/world` renders for visitors.
- `/api/world/snapshot?instance=public` returns deterministic houses/inhabitants.
- Invalid instance values return `400 INVALID_INSTANCE`.

**Tests**: `e2e/13_world_readonly.spec.js`

## M9 — Camera controls + culling + details
- `/world` exposes deterministic pan/zoom controls.
- Clicking a visible house opens its detail card.
- Visible-overlay list contains only houses in camera viewport.

**Tests**: `e2e/14_world_camera_cards.spec.js`

## M10 — Projection refresh + house detail endpoint
- Projection merges fixture + platform records and stays deterministic.
- Client refreshes world projection without hard reload.
- `/api/world/houses/:houseId` returns house details and typed `404 NOT_FOUND`.

**Tests**: `e2e/15_world_inhabitants.spec.js`

## M11 — Realtime multiplayer core
- Two users can join the same realtime world instance.
- State patches broadcast authoritative player positions.
- Invalid move intents are ignored.

**Tests**: `e2e/16_world_realtime.spec.js`

## M12 — Instance assignment and composition
- Assignment enforces instance capacity.
- Player houses are included when available.
- Experience-house floor is enforced by policy.

**Tests**: `e2e/17_world_instancing.spec.js`

## M13 — Special house interactions
- Interactions emit deterministic server events.
- Cooldown prevents rapid spam.
- Unauthorized targets return typed errors.

**Tests**: `e2e/18_world_special_houses.spec.js`

## M14 — Local clip recording/export
- Record button starts/stops capture.
- Exported local clip is downloadable and non-empty.
- Duration stays within configured min/max bounds.

**Tests**: `e2e/19_clip_local_export.spec.js`

## M15 — Clip processing and share
- Uploaded clips transition `uploaded -> processing -> ready`.
- Ready clips expose a share URL and media URLs.
- Upload endpoint is idempotent for repeated completion calls.

**Tests**: `e2e/20_clip_share.spec.js`
