# AgentTown HQ14J Full-Screen Expedition Map

Date: 2026-06-01

## Verdict

PASS. The Expedition Map is now the first, full-width Founders Plot surface and the Three.js map is the primary viewport. HUD/control/status elements sit as lightweight overlays/drawers over the map instead of turning the experience into another proof-panel stack.

## Changed Files

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`
- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `reports/agent-town-hq14j-full-screen-expedition-map-2026-06-01.md`
- `reports/agent-town-hq14j-full-screen-expedition-map-proof-2026-06-01.json`
- `reports/agent-town-hq14j-full-screen-expedition-map-desktop-2026-06-01.png`
- `reports/agent-town-hq14j-full-screen-expedition-map-mobile-2026-06-01.png`
- `reports/agent-town-hq14j-full-screen-expedition-map-contact-sheet-2026-06-01.png`

## Implementation

- Mounted the Expedition Map panel at the top of `.fp-main` so it spans the page columns and leads the first screen.
- Kept `expeditionMap.cells` as the only map truth source and kept the existing same-origin runtime map assets.
- Expanded the Three.js host to a viewport-height route/surface with pan, zoom, reset, selection, semantic zoom, and selected-sector overlays.
- Kept selected-sector and Scout Sector affordances map-first through the selected overlay chip/button.
- Moved evidence packet detail into the inspector drawer as a collapsed read-only section so packet/party/receipt details remain available without dominating the map.

## Guardrails

- Frontend/Three.js/CSS/e2e/report/proof only.
- Scout Sector remains the only current Expedition Map mutation path.
- Event Packet, Party, objective/current focus, receipts, selected-sector proof, and ledger remain read-only/buttonless except for lightweight overlay/drawer presentation.
- No server/store/routes/tools/schema authority changes.
- No new mutation route, Atlas execution, public sharing, deploy, merge, Generated Universe rendering, hidden autonomy, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation, external effects, or Wild West/cowboy/saloon/gold-rush drift.

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js` passed.
- `node --check public/experiences/founders-plot/three_scene_entry.js` passed.
- `node --check e2e/200_founders_plot.spec.js` passed.
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js` passed.
- `npm run build:founders-plot-threejs` passed. HQ14J did not edit `three_scene_entry.js`, but that file was already dirty from HQ14A-I, so the bundle check was run conservatively.
- `PW_PORT=4993 npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium --grep "FP-E2E-023" --reporter=line` passed, 1/1.
- `PW_PORT=4994 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022" --reporter=line` passed, 1/1.
- `jq empty reports/agent-town-hq14j-full-screen-expedition-map-proof-2026-06-01.json` passed.
- Guardrail `jq` predicate passed for full-screen viewport, same-origin assets, Scout Sector-only mutation path, hidden-truth suppression, read-only map/evidence state, and no route/Atlas execution.
- `file` and `magick identify` passed for desktop, mobile, and contact-sheet screenshots.
- Focused `git diff --check` passed for touched HQ14J paths, plus the already-dirty Three.js entry/bundle files.

## Proof

- Proof JSON: `reports/agent-town-hq14j-full-screen-expedition-map-proof-2026-06-01.json`
- Desktop screenshot: `reports/agent-town-hq14j-full-screen-expedition-map-desktop-2026-06-01.png`
- Mobile screenshot: `reports/agent-town-hq14j-full-screen-expedition-map-mobile-2026-06-01.png`
- Contact sheet: `reports/agent-town-hq14j-full-screen-expedition-map-contact-sheet-2026-06-01.png`

## Residual Risks

- The full-screen map still lives within the Founders Plot page shell below the existing app header; it is a true first-screen map surface, not a browser Fullscreen API takeover.
- The broader HQ14A-I proof worktree remains intentionally dirty and uncommitted outside this lane.
