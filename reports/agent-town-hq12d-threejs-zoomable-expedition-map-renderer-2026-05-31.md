# HQ12D Three.js Zoomable Expedition Map Renderer

Status: IMPLEMENTED

## Boundary

- Scope stayed frontend-only: Founders Plot UI, Founders Plot Three.js bundle source, focused e2e proof, screenshots, and proof JSON.
- No server, engine, store, route, tool, spec, session, Atlas execution, scheduler, cross-plot mutation, or external-effect authority changed.
- Renderer consumes only `state.expeditionMap.cells` and read-model metadata already carried by the page bundle.
- Locked and hinted sectors remain visual fog. Locked sectors do not reveal resource hints in selected details.
- Scout Sector remains the existing HQ12C verified UI/backend flow; no second mutation path was added.
- Genre stayed private unknown-world map / map-edge fog. No Wild West cues were added.

## Implementation

- Added a dedicated Three.js Expedition Map renderer in `public/experiences/founders-plot/three_scene_entry.js`.
- Rebuilt `public/experiences/founders-plot/three_scene_bundle.js`.
- Added a canvas surface inside the existing Expedition Map panel from `public/experiences/founders-plot/founders-plot.js`.
- Added bounded wheel zoom, drag pan, pointer/touch drag handling, camera zoom limits, camera pan limits, and selectable sector raycasting.
- Added selected-sector read-model details in the panel, including fog state, status, receipts/links for revealed cells, and suppression copy for hidden cells.
- Kept the static HQ12B DOM board as a hidden fallback/test-contract carrier when Three.js is available, so existing tests and selectors remain stable.
- Added focused Playwright coverage in `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`.

## Proof Artifacts

- Proof JSON: `reports/agent-town-hq12d-threejs-zoomable-expedition-map-renderer-proof-2026-05-31.json`
- Desktop screenshot: `reports/agent-town-hq12d-threejs-zoomable-expedition-map-renderer-desktop-2026-05-31.png`
- Mobile screenshot: `reports/agent-town-hq12d-threejs-zoomable-expedition-map-renderer-mobile-2026-05-31.png`

## Checks Run

- `npm run build:founders-plot-threejs`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --reporter=line`
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --reporter=line`
- `jq empty reports/agent-town-hq12d-threejs-zoomable-expedition-map-renderer-proof-2026-05-31.json`
- `identify reports/agent-town-hq12d-threejs-zoomable-expedition-map-renderer-desktop-2026-05-31.png reports/agent-town-hq12d-threejs-zoomable-expedition-map-renderer-mobile-2026-05-31.png`
- Focused `git diff --check` for touched files and HQ12D artifacts
- Workspace `git diff --check`

## Notes

- The focused HQ12D test verifies nonblank canvas pixels, fog-state counts, selectable known and locked sectors, hidden-resource suppression, desktop zoom/pan bounds, mobile framing, and mobile synthetic touch-drag after zoom.
- The existing HQ12B/HQ12C Expedition Map UI test still passes against the new renderer/fallback arrangement.
