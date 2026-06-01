# Agent Town HQ14K North-Star Map Composition Pass - 2026-06-01

## Trigger

Robin flagged a live screenshot where the Expedition Map still looked structurally wrong: project/inspector cards dominated the surface, region tiles read like misplaced proof thumbnails, and mobile stacked controls/cards over the map instead of feeling like the north-star world-map direction.

## Result

HQ14K is a bounded composition correction pass over the existing HQ14J full-screen Expedition Map route.

- The Three.js Expedition Map now uses larger region-scale hex plates instead of tiny proof-like cells.
- Runtime map textures now use explicit UV-mapped hex geometry, fixing the stretched/misplaced tile feel from the screenshot.
- Locked/unknown regions are lighter sealed fog silhouettes rather than heavy dark blocks.
- The desktop inspector is narrower and the board title no longer competes with the app-level Expedition Map title.
- On mobile, the inspector is reduced to a compact tab and moved away from the selected-sector drawer so it no longer stacks over the bottom context.
- `FP-E2E-023` now expects the new visual shell: `hq14k_north_star_region_composition_v1`.

This is still not the final north-star image. It is a meaningful step toward it: the live route now reads more like a map-first world surface and less like a proof board, while preserving server-owned fog truth and Scout Sector-only mutation.

## Artifacts

- Live desktop screenshot: `reports/agent-town-hq14k-north-star-map-composition-desktop-2026-06-01.png`
- Live mobile screenshot: `reports/agent-town-hq14k-north-star-map-composition-mobile-2026-06-01.png`
- North-star/current contact sheet: `reports/agent-town-hq14k-north-star-map-composition-contact-sheet-2026-06-01.png`
- Proof JSON: `reports/agent-town-hq14k-north-star-map-composition-proof-2026-06-01.json`
- Focused e2e proof/screenshots: `reports/agent-town-hq14k-north-star-map-composition-e2e-proof-2026-06-01.json`, desktop PNG, and mobile PNG

Proof assertions passed:

- exact route `/experiences/founders-plot/`
- Founders Plot root present
- obsolete town-map fallback absent
- Three.js Expedition Map renderer present
- visual shell `hq14k_north_star_region_composition_v1`
- runtime map asset tiles loaded
- no horizontal overflow
- nonblank desktop/mobile canvas
- compact mobile inspector
- mobile inspector does not overlap the selected-sector context

## Verification

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `node --check e2e/200_founders_plot.spec.js`
- `npm run build:founders-plot-threejs`
- `PW_PORT=4973 npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium --grep "FP-E2E-023" --reporter=line`
- `PW_PORT=4974 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022" --reporter=line`
- `jq empty reports/agent-town-hq14k-north-star-map-composition-proof-2026-06-01.json`
- `file` on HQ14K desktop/mobile/contact-sheet screenshots

## Guardrails

No server gameplay authority changed. No new Expedition Map mutation path was added. Scout Sector remains the only current map reveal action. Hidden/locked regions still suppress resources, routes, and action data. Event Packet, Party, receipt, and selected-sector surfaces remain read-only except for the existing eligible Scout Sector action. No Atlas execution, public sharing, deploy, push, Generated Universe rendering, autonomous movement, resource harvesting, trade/route/economy/combat/scheduler behavior, cross-plot mutation, external effects, or Wild West drift.
