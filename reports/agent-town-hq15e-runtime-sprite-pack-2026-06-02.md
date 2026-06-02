# Agent Town HQ15E Runtime Sprite Pack

Date: 2026-06-02

## Summary

Parent reconciliation found that the HQ15 text-to-gameplay checkpoint now includes a same-origin runtime sprite pack for Expedition Map units and markers, not just the earlier review-only GPT Image 2 sheet.

Runtime pack:

- `public/experiences/founders-plot/assets/expedition-map/hq15e-expedition-unit-marker-sprites-v1/manifest.json`
- eight `512x512` RGBA sprites for scout, settler convoy, surveyor, courier, outpost crew, objective beacon, event packet, and receipt ledger
- contact sheet: `reports/agent-town-hq15e-runtime-sprite-pack-contact-sheet-2026-06-02.png`

Renderer binding:

- `three_scene_entry.js` declares `hq15e_expedition_unit_marker_sprites_v1`
- unit sprites and event/objective markers report their sprite slot/path/readiness through `getExpeditionMapInfo()`
- `FP-E2E-023` proves `generatedSpriteAssetsReady >= 8`, all units use same-origin sprite paths, and event/objective markers remain visual-only/read-only

## Guardrails

- The sprite pack is presentation-only and same-origin.
- It does not add movement, routes, trade, economy, resources, rewards, combat, schedulers, Atlas execution, public sharing, cross-plot mutation, hidden autonomy, external effects, or hidden-truth leakage.
- Server-owned Expedition Map read-model objects still decide which units/markers exist.
- Scout Sector remains the only current Expedition Map mutation path.

## Verification

Parent checks passed:

- `file reports/agent-town-hq15e-runtime-sprite-pack-contact-sheet-2026-06-02.png public/experiences/founders-plot/assets/expedition-map/hq15e-expedition-unit-marker-sprites-v1/*.png`
- `jq empty public/experiences/founders-plot/assets/expedition-map/hq15e-expedition-unit-marker-sprites-v1/manifest.json`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npm run build:founders-plot-threejs`
- `PW_PORT=5075 npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium --grep "FP-E2E-023" --reporter=line`
- `git diff --check`

The existing broad `npm run test:founders-plot` payload-size perf failure remains a separate HQ15 read-model follow-up; focused unit/HTTP/contract checks and focused Playwright proofs passed before this reconciliation.
