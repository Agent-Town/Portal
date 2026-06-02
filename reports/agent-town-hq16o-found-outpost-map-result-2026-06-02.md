# HQ16O Found Outpost -> Outpost Map Result Bridge

Date: 2026-06-02
Branch: `neo/progression-atlas-editor-next-2026-05-29`
HEAD at start: `a108e89 Add AgentTown paperwork-to-play sweep`
Verdict: PASS

## Summary

After the existing guarded `found_settlement` flow succeeds, the Expedition Map now reloads from server state and focuses the server-owned founded result when that result is exposed by existing read-model fields.

The primary player surface stays map-native:

- The selected map unit becomes the server-owned `outpost_crew` unit for the founded claim.
- The selected cell remains the owned outpost result cell.
- The outcome chip pulses as `Founded` with the outpost icon.
- The old Settler Convoy `Found` command disappears after founding.

Approval, endpoint, packet, proof, and report wording remains outside the primary visible map UI, in existing aria/title/dataset/proof/report detail.

## Implementation

Changed `public/experiences/founders-plot/founders-plot.js`:

- Added a small read-model resolver for founded outpost results using existing `expeditionMap.cells`, `expeditionMap.units.items`, `sourceIds.claimId`, `sourceIds.originClaimId`, and `foundedPlotId`.
- Moved Found Outpost outcome feedback to after `loadState()`, so the result is based on the post-mutation server read model.
- If an `outpost_crew` unit is exposed, the UI selects it and renders the result pulse against that unit. If not exposed, the older target-cell fallback remains.

Changed focused coverage:

- `tests-founders-plot/fp-unit.test.js` now proves an arrived claim that is founded projects as a discovered owned-outpost cell plus an `outpost_crew` unit.
- `tests-founders-plot/fp-http.test.js` proves the same through the existing `/api/founders-plot/expedition-map` route after the guarded Found Settlement endpoint.
- `e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js` now extends the existing HQ16M map bridge proof through the Found Outpost result.

## Proof

Generated proof JSON:

- `reports/agent-town-hq16o-found-outpost-map-result-proof-2026-06-02.json`

Generated screenshots:

- `reports/agent-town-hq16o-found-outpost-map-result-2026-06-02-desktop.png`
- `reports/agent-town-hq16o-found-outpost-map-result-2026-06-02-mobile.png`

Key proof guardrails passed:

- `foundEndpointUsed: true`
- `reloadSelectedServerOwnedOutpostCrew: true`
- `focusedOwnedOutpostCell: true`
- `outcomePulseServerOwnedOutpostResult: true`
- `oldConvoyCommandGoneAfterFounding: true`
- `primarySurfacePaperworkHidden: true`
- no route/trade/resource/reward/combat/scheduler/Atlas/Generated Universe/external effects

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js`
- `node --check server/founders_plot/engine.js`
- `node --check tests-founders-plot/fp-unit.test.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-http.test.js`
- `npx playwright test e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js --reporter=line`
- `jq` parse/guardrail check for the HQ16O proof JSON
- screenshot file checks for desktop/mobile HQ16O screenshots
- `git diff --check`

## Boundaries

No new server route, tool action, API payload, movement behavior, Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden truth leakage, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation beyond the existing Found Settlement contract, external effect, push, merge, deploy, public share, or commit.

Residual risk: the fallback path still depends on the server exposing either an owned-outpost cell or `outpost_crew` unit in the post-foundation read model. Current unit, HTTP, and browser proof confirm that contract for the covered flow.
