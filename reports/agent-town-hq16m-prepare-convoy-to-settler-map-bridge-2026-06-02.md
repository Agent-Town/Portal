# AgentTown HQ16M - Prepare Convoy To Settler Map Bridge

Date: 2026-06-02

Verdict: PASS

## Summary

HQ16M makes the guarded Prepare Convoy result legible as a map event. After the existing `et.plot.prepare_settler_convoy` endpoint returns a server-owned settlement claim, the Expedition Map reload now selects the projected `settler_convoy` unit for that claim and shows the outcome as a short map-native `Rolling` event.

The immediate Prepare result is intentionally not a Found Outpost command yet. Existing server rules require the timed convoy to arrive first; the focused server and browser proofs now cover both states: `CONVOY_PREPARING` creates a read-only Settler Convoy map unit, and `CONVOY_ARRIVED` exposes the existing `found_settlement` command hint.

## What Changed

- `loadState()` now returns the normalized bundle it rendered.
- After Prepare Convoy succeeds, the frontend finds the returned server-owned `settler_convoy` unit by `sourceClaimId`, selects it, and anchors the outcome pulse to that unit/cell.
- The visible Prepare success label is map-native (`Rolling`) instead of document/review oriented.
- Primary objective/bridge copy now uses player-facing labels like `Surveyed`, `Ready`, `Send Convoy`, `Convoy Rolling`, and `Pick Found to place the outpost`; endpoint/review/form language stays in proof, title/aria, and Ledger-style detail instead of the main play surface.
- The Expedition Map cell merge rule now lets stronger server truth such as `settlement_claim` win over older Scout/Site Plan projections for the same known cell while preserving receipts/sources.
- Focused unit, HTTP, and browser proofs now cover the Prepare Convoy -> Settler Convoy map bridge.
- Browser proof records both the pre-arrival player-facing `Rolling` result and the arrived `Found Outpost` command state.

## Guardrails

- No new server route, tool action, mutation authority, or browser-created settler was added.
- Prepare Convoy still calls only the existing guarded endpoint with the existing payload shape.
- Found Outpost remains locked until the server-owned convoy arrival state exposes the existing `found_settlement` hint.
- Receipts and approval facts stay in server/test/proof/aria/title detail, not as the primary player-facing result.
- No Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, route/trade/economy/resource/reward/combat/scheduler/cross-plot behavior, external effects, deploy, merge, push, or public share.

## Verification

Passed:

- `node --check server/founders_plot/engine.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js` (`37/37`)
- `NODE_ENV=test node --test tests-founders-plot/fp-http.test.js` (`26/26`)
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js --reporter=line`
- `npm run test:founders-plot` (`101/101`)
- `jq empty reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-proof-2026-06-02.json`
- `jq -e` guardrail check over the proof JSON
- `file reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-2026-06-02-desktop.png reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-2026-06-02-mobile.png`
- `git diff --check`

## Artifacts

- `reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-proof-2026-06-02.json`
- `reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-2026-06-02-desktop.png`
- `reports/agent-town-hq16m-prepare-convoy-to-settler-map-bridge-2026-06-02-mobile.png`
- `e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js`
