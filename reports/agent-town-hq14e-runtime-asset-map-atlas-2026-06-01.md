# AgentTown HQ14E Runtime Asset Map Atlas

Date: 2026-06-01

## Verdict

PASS. The Expedition Map now uses the generated GPT Image 2 region atlas as same-origin runtime map tiles, with every tile assignment gated by the server-owned Expedition Map read model.

## What Changed

- Promoted the HQ14A review atlas into a runtime asset pack under `public/experiences/founders-plot/assets/expedition-map/`.
- Cropped six runtime `512x512` tile assets:
  - discovered/known settled civic ground
  - known woodland
  - known ridge/ruin
  - known water edge
  - hinted frontier fog
  - locked unknown fog
- Added a runtime manifest describing presentation-only authority, server-owned region truth requirements, and allowed fog/terrain slots.
- Updated the Three.js Expedition Map renderer to prefer generated tile art only when the cell's public fog/terrain truth allows that slot.
- Enlarged the map cells and strengthened generated-tile opacity so the map art carries the screen more visibly.

## Region Truth Rules

- `discovered` and `known` cells may use concrete generated terrain only when their public server-owned region text supports it.
- `hinted` cells can use only the hinted fog-edge tile.
- `locked_unknown` cells can use only the locked fog tile.
- Field-like cells without a matching public terrain slot fall back to procedural rendering.
- If an image asset is still loading, the renderer falls back procedurally and rebuilds when the asset arrives.

## Guardrails

- Scout Sector remains the only Expedition Map mutation path.
- No server, store, route, tool, schema, Atlas, public sharing, Generated Universe, scheduler, combat, route/trade/economy, cross-plot, or external-effect changes.
- No hidden truth leakage: hidden cells remain fog-state assets only.
- Water/river visuals remain gated to explicit server-owned water/river terrain.
- Locked unknown cells do not draw ruin, landmark, resource, or receipt specificity.

## Verification

- `node --check public/experiences/founders-plot/three_scene_entry.js` passed.
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js` passed.
- `npm run build:founders-plot-threejs` passed.
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --reporter=line` passed, 1/1.
- `npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022" --reporter=line` passed, 1/1.
- `jq` guardrail predicate passed on `reports/agent-town-hq14e-runtime-asset-map-atlas-proof-2026-06-01.json`.
- `file` and `magick identify` passed for runtime atlas tiles, desktop/mobile screenshots, and contact sheet.
- `git diff --check` passed.

## Artifacts

- Runtime atlas: `public/experiences/founders-plot/assets/expedition-map/hq14a-region-faithful-terrain-fog-atlas-v1.png`
- Runtime manifest: `public/experiences/founders-plot/assets/expedition-map/hq14a-region-faithful-terrain-fog-atlas-v1.manifest.json`
- Runtime tiles: `public/experiences/founders-plot/assets/expedition-map/tiles/`
- Proof JSON: `reports/agent-town-hq14e-runtime-asset-map-atlas-proof-2026-06-01.json`
- Desktop screenshot: `reports/agent-town-hq14e-runtime-asset-map-atlas-desktop-2026-06-01.png`
- Mobile screenshot: `reports/agent-town-hq14e-runtime-asset-map-atlas-mobile-2026-06-01.png`
- Contact sheet: `reports/agent-town-hq14e-runtime-asset-map-atlas-contact-sheet-2026-06-01.png`

## Residual

The map is now clearly moving toward the north-star look, but the next slice should keep reducing text weight: collapse legacy audit cards behind a single inspector and make selection, receipts, and party context feel more like direct map affordances than documentation panels.
