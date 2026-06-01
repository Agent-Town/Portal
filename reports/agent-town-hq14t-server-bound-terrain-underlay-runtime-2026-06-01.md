# Agent Town HQ14T Server-Bound Terrain Underlay Runtime - 2026-06-01

## Verdict

PASS_RUNTIME_PROMOTION_WITH_GUARDRAILS

HQ14T promotes the safest HQ14Q terrain-underlay review samples into a tiny same-origin runtime pack and binds Expedition Map rendering to explicit server-owned public terrain/fog slots.

## What Changed

- Added server-owned Expedition Map cell asset fields in `server/founders_plot/engine.js`:
  - `terrainAssetContractVersion`
  - `publicTerrainAssetSlot`
  - `publicTerrainAssetSlotSource`
  - `publicTerrainAssetSlotReason`
  - `fogAssetSlot`
- Promoted the tiny runtime pack `hq14s_public_terrain_underlay_v1` under `public/experiences/founders-plot/assets/expedition-map/hq14s-public-terrain-underlay-v1/`.
- Added a presentation-only runtime manifest with concrete slots limited to `field`, `forest`, `ridge`, and `settled`; `water`, `coast`, `route`, `resource`, `combat`, and `reward` remain blocked.
- Updated the Three.js Expedition Map renderer so visible terrain assets require `publicTerrainAssetSlot` from the server, while `hinted` and `locked_unknown` cells use only `fogAssetSlot`.
- Extended `FP-E2E-023` proof gates with per-cell asset metadata and a negative hidden-cell fixture that injects an invalid concrete terrain request and verifies the renderer normalizes it back to fog-only.
- Updated API/tool contract docs and focused unit/HTTP/contract assertions for the new terrain/fog slot contract.

## Runtime Pack

Path: `public/experiences/founders-plot/assets/expedition-map/hq14s-public-terrain-underlay-v1/`

Files:

- `manifest.json`
- `public-terrain-underlay-candidate-01-v1.png`
- `fog-only-hidden-edge-overlay-v1.png`
- `field-v1.png`
- `forest-v1.png`
- `ridge-v1.png`
- `settled-v1.png`
- `hinted-frontier-fog-v1.png`
- `locked-unknown-fog-v1.png`

The broad underlay comes from HQ14Q Candidate 01. Slot textures are derived from HQ14Q Candidate 01/03 review samples. No water/coast-specific asset is promoted.

## Proof Artifacts

- `reports/agent-town-hq14t-server-bound-terrain-underlay-runtime-proof-2026-06-01.json`
- `reports/agent-town-hq14t-server-bound-terrain-underlay-runtime-desktop-2026-06-01.png`
- `reports/agent-town-hq14t-server-bound-terrain-underlay-runtime-mobile-2026-06-01.png`
- `reports/agent-town-hq14t-server-bound-terrain-underlay-runtime-contact-sheet-2026-06-01.png`

## Verification

Passed:

- `node --check server/founders_plot/engine.js`
- `node --check server/founders_plot/tools.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `jq empty public/experiences/founders-plot/assets/expedition-map/hq14s-public-terrain-underlay-v1/manifest.json`
- `jq empty reports/agent-town-hq14s-runtime-promotion-implementation-plan-proof-2026-06-01.json`
- `jq empty reports/agent-town-hq14t-server-bound-terrain-underlay-runtime-proof-2026-06-01.json`
- `file` / `magick identify` on runtime PNG assets and proof screenshots/contact sheet
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-contract.test.js` (`83/83`)
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022" --reporter=line` (`1/1`)
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium --reporter=line` (`1/1`)
- `git diff --check`

Noted:

- A broad `npm run test:founders-plot` run still fails the existing `FP-PERF-001` 8 KB observation-payload threshold (`35855` bytes). The focused Expedition Map contract/unit/HTTP tests passed, and this lane did not attempt payload compaction.
- One parallel Playwright attempt hit `EADDRINUSE` on the configured dev-server port because two Playwright web servers were started at once; rerunning the specs separately passed.

## Guardrails

- Scout Sector remains the only Expedition Map mutation path.
- Hidden and hinted cells have no concrete `publicTerrainAssetSlot`.
- Hidden cells use only `hinted_frontier_fog` / `locked_unknown_fog` fog assets.
- Visible concrete assets require the matching server-owned public terrain slot.
- Water/coast assets remain blocked until explicit public water/coast truth exists.
- No route/trade/economy/resource/reward/combat/scheduler behavior was added.
- No Atlas execution, public sharing, Generated Universe rendering, hidden autonomy, cross-plot mutation, external effects, deploy, merge, commit, or push occurred.
