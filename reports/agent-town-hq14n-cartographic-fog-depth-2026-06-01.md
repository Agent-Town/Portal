# Agent Town HQ14N Cartographic Fog Depth - 2026-06-01

## Verdict

PASS

HQ14N adds ambient cartographic contour depth to the Expedition Map's base and fog textures. The pass is renderer-only and intentionally non-cell-specific: it makes the empty fog field feel more authored without revealing hidden terrain truth or adding gameplay authority.

## Changes

- Updated the Expedition Map visual shell to `hq14n_cartographic_fog_depth_v1`.
- Added a deterministic ambient contour field to the base map texture.
- Added low-alpha contour rings inside hinted/locked fog textures.
- Added runtime proof flags for cartographic fog depth, ambient contours, and visual-only fog glyphs.
- Rebuilt `public/experiences/founders-plot/three_scene_bundle.js`.
- Updated focused `FP-E2E-023` proof expectations and artifact names for HQ14N.

Source files changed:

- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`

## Proof Artifacts

- Desktop screenshot: `reports/agent-town-hq14n-cartographic-fog-depth-desktop-2026-06-01.png`
- Mobile screenshot: `reports/agent-town-hq14n-cartographic-fog-depth-mobile-2026-06-01.png`
- Contact sheet: `reports/agent-town-hq14n-cartographic-fog-depth-contact-sheet-2026-06-01.png`
- Proof JSON: `reports/agent-town-hq14n-cartographic-fog-depth-proof-2026-06-01.json`

Proof JSON confirms:

- `visualShell: hq14n_cartographic_fog_depth_v1`
- `cartographicFogDepth: true`
- `ambientContourField: true`
- `fogDepthGlyphsVisualOnly: true`
- hidden underlay cells remain fog-only
- continuous underlay has no action authority
- Scout Sector remains the only mutation path

## Verification

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npm run build:founders-plot-threejs`
- `PW_PORT=4977 npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium --grep "FP-E2E-023" --reporter=line`
- `jq empty reports/agent-town-hq14n-cartographic-fog-depth-proof-2026-06-01.json`
- `file` on HQ14N desktop, mobile, and contact-sheet PNGs
- `git diff --check`

## Guardrails Held

- No server/store/routes/tools/schema authority changes.
- No new Expedition Map mutation path.
- Scout Sector remains the only current map reveal action.
- Hidden/locked cells use fog/cartographic texture only and do not expose resources, routes, jobs, action data, receipts, or specific hidden terrain truth.
- Event Packet, Expedition Party, receipt, selected-sector, objective/current-focus, and ledger surfaces remain read-only/buttonless except the existing eligible Scout Sector UI.
- No Atlas execution, public sharing, deploy, Generated Universe rendering, hidden autonomy, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation, or external effects.

## Residual Visual Gaps

The map now has more cartographic depth in the fog field, but the strongest next leap is still asset quality: a richer generated terrain underlay or a purpose-made world-map art layer that can be safely slot-bound to server-owned fog and public terrain states.
