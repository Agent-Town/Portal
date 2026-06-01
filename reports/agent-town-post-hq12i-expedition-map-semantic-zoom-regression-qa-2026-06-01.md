# Agent Town Post-HQ12I - Expedition Map Semantic Zoom Regression QA

## Status

Pass on 2026-06-01.

The queued QA worker did not leave a usable handoff, so this regression pass was completed directly from the current worktree and the existing HQ12I proof artifacts.

## Scope

- Verify HQ12I semantic-zoom polish still behaves as read-only Expedition Map presentation.
- Re-run the focused Expedition Map DOM and Three.js browser checks.
- Re-run the Founders Plot unit, contract, and HTTP tests that cover the HQ12 server-owned Expedition Map surfaces.
- Preserve the HQ12 guardrails: Scout Sector remains the only Expedition Map mutation path.

## Inputs Reviewed

- `reports/agent-town-hq12i-expedition-map-semantic-zoom-polish-2026-05-31.md`
- `reports/agent-town-hq12i-expedition-map-semantic-zoom-polish-proof-2026-05-31.json`
- `reports/agent-town-hq12i-expedition-map-semantic-zoom-polish-desktop-2026-05-31.png`
- `reports/agent-town-hq12i-expedition-map-semantic-zoom-polish-mobile-2026-05-31.png`
- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`
- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`

## Findings

- Semantic zoom remains present and bounded. The proof records `Survey view` at survey scale and `Detail view` after zoom.
- Hidden cells stay hidden. Locked cells still say no resources, routes, or action data are unlocked by close zoom.
- Mobile proof remains within a 390px viewport with body/document width 390.
- The focused browser checks still pass:
  - `FP-E2E-022` validates the Expedition Map read-model UI, event packet, party flavor, and no packet/party action regressions.
  - `FP-E2E-023` validates the Three.js Expedition Map semantic zoom labels, bounded zoom/pan, selectable sectors, and hidden-cell suppression.

## Verification

- `jq` inspection of the HQ12I proof JSON passed.
- `magick identify` on the HQ12I screenshots passed:
  - `agent-town-hq12i-expedition-map-semantic-zoom-polish-desktop-2026-05-31.png` = `400x401` sRGB.
  - `agent-town-hq12i-expedition-map-semantic-zoom-polish-mobile-2026-05-31.png` = `313x189` sRGB.
- `node --check public/experiences/founders-plot/founders-plot.js` passed.
- `node --check e2e/200_founders_plot.spec.js` passed.
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js` passed.
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js` passed 83/83.
- `PW_PORT=4291 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022" --reporter=line` passed 1/1.
- `PW_PORT=4292 npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium --reporter=line` passed 1/1.
- Focused `git diff --check` over touched HQ12I paths passed.

## Guardrails

- No server, engine, store, route, tool, or spec changes were made by this QA pass.
- No new mutation path was added.
- Scout Sector remains the only Expedition Map UI mutation path.
- Event Packet and Expedition Party surfaces remain read-only with no action buttons.
- No Atlas execution, public sharing, Generated Universe rendering, route/trade/economy hook, combat, scheduler/background behavior, hidden autonomy, cross-plot mutation, external effect, or Wild West/cowboy/saloon/gold-rush drift was introduced.

## Residual Risk

This was a focused HQ12I regression pass, not a full `npm test` or full-browser-suite run.
