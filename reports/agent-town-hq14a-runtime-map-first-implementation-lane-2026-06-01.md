# Agent Town HQ14A Runtime Map-First Implementation Lane

Date: 2026-06-01
Lane: HQ14A Runtime Map-First Implementation
Verdict: PASS_WITH_CONCURRENT_HQ14C_HQ14D_INTEGRATION

## Summary

Turned the Expedition Map runtime toward a player-facing map surface instead of a proof-dashboard stack. The map is now the lead playable surface, with zoom/reset controls, hover and selected-state affordances, a concise visual HUD, and compact inspector cards below the map. The implementation keeps the newer concurrent HQ14C visual shell, `hq14c_runtime_region_consistency_v1`, because that lane tightened the exact authority guardrail Robin requested: known/discovered cells can show server-owned terrain truth, while hinted and locked cells stay abstract fog/silhouette only.

## Changed Runtime

- `public/experiences/founders-plot/three_scene_entry.js`
  - Added non-mutating Expedition Map zoom/reset renderer helpers.
  - Added hover affordance and selected-sector outline metadata.
  - Shrank center markers so the terrain surface remains visually readable.
  - Preserved HQ14C region consistency metadata: `regionVisuals` and `regionConsistency`.

- `public/experiences/founders-plot/founders-plot.js`
  - Reordered the Expedition Map panel into a map-first runtime shell.
  - Added compact map controls and HUD/inspector placement.
  - Kept Scout Sector as the only map mutation path.

- `public/experiences/founders-plot/founders-plot.css`
  - Promoted the Three.js surface to a large map-first composition.
  - Added visual HUD styling, icon-like zoom controls, compact cards, hover focus affordances, and responsive mobile sizing.
  - Prevented HUD overlays from blocking canvas sector selection, except for the explicit Scout Sector button.

- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
  - Verifies map-first controls, HUD presence, renderer visual-layer flags, and HQ14C region consistency.
  - Keeps hidden-cell resource/receipt suppression and Scout Sector-only mutation checks.

Concurrent HQ14D playability assertions also updated `e2e/200_founders_plot.spec.js` and produced map-first screenshots.

## Artifacts

- Parent proof: `reports/agent-town-hq14a-runtime-map-first-implementation-lane-proof-2026-06-01.json`
- Region consistency proof: `reports/agent-town-hq14c-runtime-region-consistency-fix-proof-2026-06-01.json`
- Map-first playability proof: `reports/agent-town-hq14d-map-first-ui-playability-slice-proof-2026-06-01.json`
- Review media:
  - `reports/media/agent-town-hq14a-region-faithful-terrain-fog-atlas-2026-06-01/agent-town-hq14a-region-faithful-terrain-fog-atlas-1024-review.png`
  - `reports/media/agent-town-hq14b-region-visual-consistency-qa-2026-06-01/contact-sheet.png`
- Region screenshots:
  - `reports/agent-town-hq14c-runtime-region-consistency-fix-desktop-2026-06-01.png`
  - `reports/agent-town-hq14c-runtime-region-consistency-fix-mobile-2026-06-01.png`
- Map-first UI screenshots:
  - `reports/agent-town-hq14d-map-first-ui-playability-slice-desktop-2026-06-01.png`
  - `reports/agent-town-hq14d-map-first-ui-playability-slice-mobile-2026-06-01.png`

## Verification

Passed:

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium --grep "FP-E2E-023"` (1/1)
- `npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022"` (1/1)
- `file` and `magick identify` on HQ14C/HQ14D screenshots

## Guardrails

- Server-owned `expeditionMap.cells` remain the only map visual truth source.
- Hidden hinted/locked cells are fog/silhouette only; no hidden terrain, resources, receipts, routes, or actions are exposed.
- Scout Sector remains the only current Expedition Map mutation path.
- No server/store/routes/tools/schema authority changes.
- No Atlas execution, public sharing, Generated Universe rendering, hidden autonomy, routes, trade, economy, resources, rewards, combat, scheduler behavior, cross-plot mutation, or external effects.
- No cowboy/saloon/gold-rush/Wild West genre drift.

## Residual Risks

- The current UI still lives inside the existing Founders Plot panel/drawer width, so this is a map-first panel composition rather than a whole-page game screen.
- Positive water/river terrain coverage would benefit from a future fixture containing an explicit known/discovered water cell.
- Repo-owned terrain assets are still absent under `public/experiences/founders-plot/assets/expedition-map/`, so the runtime uses improved procedural textures.
