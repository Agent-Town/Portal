# HQ11 Progression Atlas Civic Operations UX

Date: 2026-05-31
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Summary

Added a Progression Atlas explanatory surface for HQ11 Civic Operations / Living World readiness around the current HQ10D civic project activation lane.

The new panel is advisory and inspect-only. It reads existing canonical HQ10 World Grid, civic proposal, overlay pack, and civic project nodes when present, then falls back to guarded proposal metadata when backend project/HQ11 fields are absent.

## Changed Files

- `public/progression-atlas.html`
- `public/progression-atlas.js`
- `public/progression-atlas.css`
- `e2e/114_progression_atlas_openclaw_lite.spec.js`
- `reports/agent-town-hq11-progression-atlas-civic-operations-ux-desktop-2026-05-31.png`

## UX Coverage

- Added `HQ11 Civic Operations` panel below the existing authority/work-order/World Grid operation cards.
- Shows HQ10D current public-work state from `world_grid.civic_project_activation`.
- Shows server-owned authority chain for World Grid read model, civic proposal records, and civic project activation.
- Shows lifecycle gates:
  - World Grid read model
  - Civic proposal records
  - Generated Universe overlay records
  - Civic project activation
  - HQ11 readiness as advisory until canonical backend support exists
- Shows world-delta metadata only when the read model reports it:
  - project counts
  - local readiness delta
  - morale markers
  - receipt/project rows
- Explains visual actor roles as presentation/readability roles only:
  - Civic Routekeeper
  - Oracle Adjunct
  - Outpost Keeper
  - Clover/Foreman

## Authority Boundary

Atlas remains non-executable.

Action refs are displayed as metadata only. Founders Plot server routes own mutation, approval, idempotency, audit receipts, and stable gameplay truth. HQ11 copy does not invent routes, workers, schedulers, cross-plot effects, resource spending, public sharing, Generated Universe rendering, or visual actor authority.

If backend HQ11 fields are absent, the panel uses canonical proposal/readiness copy and says so directly.

## Verification

- `node --check public/progression-atlas.js`
- `node --check e2e/114_progression_atlas_openclaw_lite.spec.js`
- `npx playwright test e2e/114_progression_atlas_openclaw_lite.spec.js --project=chromium` passed 2/2
- `file reports/agent-town-hq11-progression-atlas-civic-operations-ux-desktop-2026-05-31.png`
- `identify reports/agent-town-hq11-progression-atlas-civic-operations-ux-desktop-2026-05-31.png`
- `git diff --check -- public/progression-atlas.js public/progression-atlas.css public/progression-atlas.html e2e/114_progression_atlas_openclaw_lite.spec.js reports/agent-town-hq11-progression-atlas-civic-operations-ux-desktop-2026-05-31.png`

## Proof

- Desktop: `reports/agent-town-hq11-progression-atlas-civic-operations-ux-desktop-2026-05-31.png` (`1440x5549`)
