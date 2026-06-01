# Agent Town Post-HQ12L Expedition Party Visual Regression QA

Date: 2026-06-01
Lane: bounded report/proof-only regression QA after HQ12L Expedition Party visual polish.
Verdict: PASS.

## Scope

- Reviewed HQ12L proof artifact and screenshot dimensions.
- Inspected nearby Expedition Map, Event Packet, Party, and Scout Sector UI/test surfaces.
- Ran focused syntax and Playwright checks for FP-E2E-022 and FP-E2E-023.
- Ran optional Founders Plot unit/contract/HTTP/scene-state checks.
- No source edits were made.

## Evidence Reviewed

- `reports/agent-town-hq12l-expedition-party-visual-polish-2026-06-01.md`
- `reports/agent-town-hq12l-expedition-party-visual-polish-proof-2026-06-01.json`
- `reports/agent-town-hq12l-expedition-party-visual-polish-desktop-2026-06-01.png`
- `reports/agent-town-hq12l-expedition-party-visual-polish-mobile-2026-06-01.png`

HQ12L proof declares:

- source fields: `expeditionMap.expeditionParty`, `eventPacket.partySnapshot`
- roster text: Mira Trailmark, Rook Signalpost, Vale-Desk 7
- packet buttons: `0`
- party actions: `0`
- Event Packet read-only: `true`
- Party read-only: `true`
- Scout Sector as only mutation path: `true`
- route/trade/resources/combat/scheduler/public sharing/Generated Universe/Atlas/cross-plot/external effects: all false or empty
- mobile horizontal overflow: `0`

Screenshot identification:

- desktop: PNG, 465 x 5229, sRGB
- mobile: PNG, 366 x 3780, sRGB

## Guardrails

Confirmed from proof, code inspection, and tests:

- Expedition Party rendering is derived from server-owned `expeditionMap.expeditionParty` and Event Packet `partySnapshot`.
- No frontend-invented static party fallback is visible in the rendered party model.
- Event Packet and Expedition Party surfaces remain read-only and buttonless.
- Scout Sector remains the only Expedition Map UI mutation path.
- No new party management/actions were found.
- No packet action controls were found.
- No new mutation route/tool was introduced by HQ12L.
- No server/store/engine/routes/tools/spec edits were needed or made by this QA lane.
- No Atlas execution, public sharing, Generated Universe rendering, route/trade/economy hooks, combat, scheduler/background behavior, cross-plot mutation, or external effects were observed.
- No Wild West/cowboy/saloon/gold-rush genre drift was found in the bounded party/event packet surfaces.

## Checks

- `jq` on HQ12L proof: PASS.
- `identify` on HQ12L desktop/mobile screenshots: PASS.
- `node --check public/experiences/founders-plot/founders-plot.js`: PASS.
- `node --check public/experiences/founders-plot/scene_state.js`: PASS.
- `node --check public/experiences/founders-plot/three_scene_entry.js`: PASS.
- `node --check e2e/200_founders_plot.spec.js`: PASS.
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`: PASS.
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --grep "FP-E2E-023"`: PASS, 1 passed.
- `npx playwright test e2e/200_founders_plot.spec.js --grep "FP-E2E-022"`: first attempt hit `EADDRINUSE` because the paired parallel run already held port 4174; serial rerun PASS, 1 passed.
- `node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-scene-state.test.js`: PASS, 92 passed.

## Changed Files

- Added `reports/agent-town-post-hq12l-expedition-party-visual-regression-qa-2026-06-01.md`
- Added `reports/agent-town-post-hq12l-expedition-party-visual-regression-qa-proof-2026-06-01.json`

No production, test, spec, skill, server, route, store, engine, tool, Atlas, or frontend source files were edited by this QA lane.

## Residual Risk

- The worktree was already heavily dirty before this QA lane, including many source/test/spec changes owned by other agents.
- This was a bounded regression lane, not a full `npm test` pass.
- The HQ12L proof screenshots are tall cropped panel captures rather than a full fresh visual review across every surrounding page state.
