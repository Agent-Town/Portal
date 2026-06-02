# HQ16R Outpost Next-Frontier Map Beacon

## Verdict

`PASS`.

HQ16R adds a map-native, visual-only next-frontier beacon from a selected founded outpost crew to the nearest eligible server-exposed hinted frontier cell. The cue is rendered in the Three.js Expedition Map as a read-only beacon/ring and connection, not as an outpost command, route, movement path, or executable action.

## What Changed

- Added a renderer-only outpost-to-frontier beacon for selected `outpost_crew` units.
- The target is derived from existing server-owned read-model fields:
  - selected `outpost_crew` unit location
  - visible `owned_outpost` cell
  - visible `hinted` + `frontier_hint` cell
  - preferred `sourceIds.adjacentCellId` backlink, with nearest visible hinted frontier fallback
- Added renderer proof metadata for the beacon count, target, derivation source, visual/read-only status, selectable status, executable action count, route/action authority, and hidden-truth guardrail.
- Extended the focused Playwright outpost-map proof to emit HQ16R desktop/mobile screenshots and proof JSON.

## Files

- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `e2e/205_founders_plot_hq16q_outpost_status_map_surface.spec.js`
- `reports/agent-town-hq16r-outpost-next-frontier-beacon-proof-2026-06-02.json`
- `reports/agent-town-hq16r-outpost-next-frontier-beacon-2026-06-02-desktop.png`
- `reports/agent-town-hq16r-outpost-next-frontier-beacon-2026-06-02-mobile.png`

## Verification

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `node --check e2e/205_founders_plot_hq16q_outpost_status_map_surface.spec.js`
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/205_founders_plot_hq16q_outpost_status_map_surface.spec.js --project=chromium --reporter=line`
- `jq empty reports/agent-town-hq16r-outpost-next-frontier-beacon-proof-2026-06-02.json`
- `file reports/agent-town-hq16r-outpost-next-frontier-beacon-2026-06-02-desktop.png reports/agent-town-hq16r-outpost-next-frontier-beacon-2026-06-02-mobile.png`
- `git diff --check`

## Guardrails

No server route, tool action, API payload, store/engine authority, outpost command, movement command, route/trade/economy/resource/reward/combat/scheduler behavior, Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, cross-plot effect, external effect, push, deploy, merge, public share, or history rewrite.

Scout Sector remains the only fog reveal mutation. Scout movement remains bounded to its existing rules.

## Residual Risk

The beacon depends on the current Expedition Map read model exposing an outpost cell plus at least one hinted frontier cell. If the server omits a hinted frontier cell, the renderer emits no beacon rather than inventing a target.
