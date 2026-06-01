# Agent Town HQ14J Route Alias Fix - 2026-06-01

## Trigger

Robin reported that `http://localhost:4173/experiences/founders-plot/` showed the obsolete Agent Town town map instead of the new HQ14J full-screen Expedition Map.

## Root Cause

The HQ14J implementation and assets were present, but the advertised experience URL was not routed to the Founders Plot HTML.

`server/index.js` serves `public/` with `express.static(..., { index: false })`. That means `/experiences/founders-plot/index.html` worked, but `/experiences/founders-plot/` did not serve the directory index. It fell through to the default `app.get('*')` handler, which returned the old home/town hub HTML.

`/founders-plot` worked, but the manifest `indexPath` and Robin's URL were `/experiences/founders-plot/`.

## Fix

- Added explicit server routes for `/experiences/founders-plot` and `/experiences/founders-plot/`, using the same Founders Plot HTML as `/founders-plot`.
- Added those same paths to the same-origin frame allowance so the experience alias is not treated like an unrelated fallback page.
- Updated `FP-E2E-023` to load `/experiences/founders-plot/` directly, so the full-screen Expedition Map proof covers the exact advertised route.
- Restarted the local `4173` server in screen session `portal-atlas-editor-4173`.

## Live Proof

Live desktop check at `http://localhost:4173/experiences/founders-plot/`:

- Title: `Founders Plot - Agent Town`
- Founders Plot root present: `true`
- Old town hub selectors present: `false`
- Expedition panel: `1232x788`
- Three.js canvas: `1228x784`
- Renderer: `three.js`
- Surface: `expedition-map`
- Visual shell: `hq14e_region_faithful_runtime_asset_atlas_v1`
- Runtime atlas loaded: `/experiences/founders-plot/assets/expedition-map/hq14a-region-faithful-terrain-fog-atlas-v1.png`

Live mobile check:

- Founders Plot root present: `true`
- Old town hub selectors present: `false`
- No horizontal overflow: `documentScrollWidth` equals `390`
- Expedition canvas: `362x752`
- Renderer: `three.js`

Artifacts:

- `reports/agent-town-hq14j-live-route-check-2026-06-01.json`
- `reports/agent-town-hq14j-live-route-check-desktop-2026-06-01.png`
- `reports/agent-town-hq14j-live-route-check-mobile-2026-06-01.json`
- `reports/agent-town-hq14j-live-route-check-mobile-2026-06-01.png`

## Verification

- `curl http://localhost:4173/experiences/founders-plot/` now returns the Founders Plot HTML, not the town hub fallback.
- `node --check server/index.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `npm run build:founders-plot-threejs`
- `PW_PORT=4973 npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium --grep "FP-E2E-023" --reporter=line`
- `PW_PORT=4974 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022" --reporter=line`
- `jq empty` on live proof JSON and HQ14J proof JSON
- `file` on live desktop/mobile screenshots
- `git diff --check`

## Guardrails

This fix changes route serving and proof coverage only. It does not add server gameplay authority, new Expedition Map mutation paths, Atlas execution, public sharing, deployment, Generated Universe rendering, hidden autonomy, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation, external effects, or Wild West drift.
