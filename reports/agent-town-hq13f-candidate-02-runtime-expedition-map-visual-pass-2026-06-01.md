# HQ13F Candidate-02 Runtime Expedition Map Visual Pass

Date: 2026-06-01

## Verdict

PASS. The runtime Expedition Map shell now has a candidate-02 retry pass with correct required artifact names and a small bounded visual improvement, while remaining a read-only Three.js renderer over existing server-owned `expeditionMap.cells`.

## What Changed

- Renamed the visual shell metadata to `hq13f_candidate_02_runtime_expedition_map_visual_pass_v1`.
- Updated the focused Playwright proof artifact prefix to `agent-town-hq13f-candidate-02-runtime-expedition-map-visual-pass`.
- Added softer hidden-cell fog veils so locked/hinted fog reads as clouded map mist instead of a hard square patch.
- Added procedural dashed frontier boundary lines to the map-paper base texture, matching candidate-02 world-map cues without creating route authority.
- Exposed `frontierBoundaryDashes: true` in renderer proof metadata.

## Authority Boundary

- Renderer input remains the existing `expeditionMap.cells` read model only.
- Frontier dashes, fog, marker pins, and survey strokes are presentation-only runtime layers.
- Survey strokes remain visual-only/non-authoritative: `routeAuthority: false`, `visualOnly: true`, and proof `surveyStrokesVisualOnly: true`.
- Proof metadata keeps `clientAuthority: false`.
- Hidden truth remains suppressed for hinted/locked cells.
- Scout Sector remains the only current Expedition Map mutation path.
- No server, store, routes, tools, specs, Atlas execution, Generated Universe rendering, sharing, routes, trades, economy, resources, combat, scheduler, autonomy, cross-plot mutation, or external effects were added.

## Proof

- Proof JSON: `reports/agent-town-hq13f-candidate-02-runtime-expedition-map-visual-pass-proof-2026-06-01.json`
- Desktop screenshot: `reports/agent-town-hq13f-candidate-02-runtime-expedition-map-visual-pass-desktop-2026-06-01.png`
- Mobile screenshot: `reports/agent-town-hq13f-candidate-02-runtime-expedition-map-visual-pass-mobile-2026-06-01.png`

Key proof values:

- `visualShell`: `hq13f_candidate_02_runtime_expedition_map_visual_pass_v1`
- `candidate02Cues`: `true`
- `homeNodeEmphasis`: `true`
- `riverFlatCues`: `true`
- `woodlandRidgeCues`: `true`
- `ruinSignalCues`: `true`
- `frontierBoundaryDashes`: `true`
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
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npm run build:founders-plot-threejs`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --reporter=line`
- `jq '.ok, .desktop.visualShell, .desktop.visualLayers, .guardrails, .screenshots' reports/agent-town-hq13f-candidate-02-runtime-expedition-map-visual-pass-proof-2026-06-01.json`
- `git diff --check -- public/experiences/founders-plot/three_scene_entry.js public/experiences/founders-plot/three_scene_bundle.js`
- `rg -n "[ \t]+$" public/experiences/founders-plot/three_scene_entry.js e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js reports/agent-town-hq13f-candidate-02-runtime-expedition-map-visual-pass-2026-06-01.md reports/agent-town-hq13f-candidate-02-runtime-expedition-map-visual-pass-proof-2026-06-01.json` (no matches)
- `file reports/agent-town-hq13f-candidate-02-runtime-expedition-map-visual-pass-desktop-2026-06-01.png reports/agent-town-hq13f-candidate-02-runtime-expedition-map-visual-pass-mobile-2026-06-01.png`

## Final Note

This pass intentionally stays procedural and same-origin. Candidate-02 remains the north-star generated-map reference, but runtime authority still belongs to the server read model and Scout Sector remains the only Expedition Map mutation path.
