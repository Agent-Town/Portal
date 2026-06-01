# HQ13F Candidate-02 Runtime Map Visual Pass

Date: 2026-06-01

## Verdict

PASS. The Expedition Map Three.js runtime now leans further toward the selected candidate-02 direction while remaining a read-only renderer over server-owned Expedition Map cells.

## What Changed

- Updated the procedural Expedition Map shell to `hq13f_candidate_02_runtime_map_visual_pass_v1`.
- Strengthened the center settlement/home node with a brighter HQ marker, clustered homes, a small signal mast, and a home-ring emphasis.
- Added richer procedural terrain cues: denser woodland clusters, ridge contour/rock shapes, river/river-flat paint across the map base, and cell-local creek strokes for visible cells.
- Added restrained luminous fog-edge strips around the projected map bounds plus existing hidden-cell veils.
- Made survey strokes dashed and explicitly metadata-marked as visual-only/non-authoritative.
- Added generic visual-only signal/ruin cues for hinted/locked states without exposing hidden resources, receipts, routes, or actions.
- Tightened the map host CSS framing for a fuller runtime canvas without adding new mutation controls.

## Authority Boundary

- Renderer input remains the existing `expeditionMap.cells` read model.
- New route-like/survey strokes are adjacency presentation only: `routeAuthority: false`, `visualOnly: true`, and `surveyStrokesVisualOnly: true`.
- Proof metadata keeps `clientAuthority: false`.
- Hidden truth remains suppressed for hinted/locked cells.
- Scout Sector remains the only current Expedition Map mutation path.
- No server, store, routes, tools, spec authority, visual-pack schema/docs, generated concept images, Atlas execution, Generated Universe rendering, autonomous movement, timers, rewards, jobs, combat, route/trade/economy, public sharing, cross-plot mutation, or external effects were changed.

## Proof

- Proof JSON: `reports/agent-town-hq13f-candidate-02-runtime-map-visual-pass-proof-2026-06-01.json`
- Desktop screenshot: `reports/agent-town-hq13f-candidate-02-runtime-map-visual-pass-desktop-2026-06-01.png`
- Mobile screenshot: `reports/agent-town-hq13f-candidate-02-runtime-map-visual-pass-mobile-2026-06-01.png`

Key proof values:

- `visualShell`: `hq13f_candidate_02_runtime_map_visual_pass_v1`
- `candidate02Cues`: `true`
- `homeNodeEmphasis`: `true`
- `riverFlatCues`: `true`
- `woodlandRidgeCues`: `true`
- `ruinSignalCues`: `true`
- `edgeFogCount`: `4`
- `surveyStrokeCount`: `5`
- `surveyStrokesVisualOnly`: `true`
- `clientAuthority`: `false`
- `readOnly`: `true`
- `executableActions`: `[]`
- `routeCreation`: `false`
- `atlasExecution`: `false`
- `hiddenCellResourceTextSuppressed`: `true`
- `hiddenCellReceiptLinksSuppressed`: `true`
- `scoutSectorOnlyMutationPath`: `true`

## Verification

Passed:

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `npm run build:founders-plot-threejs`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --reporter=line`
- `git diff --check -- public/experiences/founders-plot/three_scene_entry.js public/experiences/founders-plot/founders-plot.css public/experiences/founders-plot/three_scene_bundle.js e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js reports/agent-town-hq13f-candidate-02-runtime-map-visual-pass-proof-2026-06-01.json`
- `jq '.ok, .desktop.visualShell, .desktop.visualLayers, .guardrails, .screenshots' reports/agent-town-hq13f-candidate-02-runtime-map-visual-pass-proof-2026-06-01.json`
- `file reports/agent-town-hq13f-candidate-02-runtime-map-visual-pass-desktop-2026-06-01.png reports/agent-town-hq13f-candidate-02-runtime-map-visual-pass-mobile-2026-06-01.png`

## Residual Visual Gaps

- This is still procedural runtime art, not true generated-tile rendering from a visual universe pack.
- Terrain cueing is richer but broad; there is not yet a typed biome/landmark manifest per cell.
- Ruin/signal cues are deliberately generic status markers until the server read model exposes specific safe landmark classes.
- Mobile framing is stable, but the full map panel remains tall because it includes the surrounding legend/sector proof surface.
