# AgentTown HQ16J Packet Site Plan Map Object

Date: 2026-06-02 17:31 +07
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Base checkpoint: `dfcdb42`
Verdict: `IMPLEMENTED`

## Summary

HQ16J makes packet-derived Site Plans visible in the Expedition Map read model after the guarded HQ16I packet -> Site Plan action succeeds.

Before this slice, the draft existed in `plot.sitePlans` and the bridge knew `SITE_PLAN_PRESENT`, but the source map cell was still projected as a `SCOUTED` Scout Sector cell. The Site Plan was only discoverable through buried receipts. Now the source cell is re-projected as a `SITE_PLAN_DRAFTED` planned-site cell with a compact read-only `sitePlanObject.kind = "packet_site_plan"`, while preserving the original Scout Sector Event Packet receipt.

## Implementation

- Added a server-owned `sitePlanObject` map object for Site Plan cells.
- Re-applied packet-backed Site Plan cell projection after Scout Sector cell projection so packet plans win the visible map/ledger label without losing `eventPacket` provenance.
- Kept the object planning-only and read-only: no Surveyor, convoy, settlement, route, resource, reward, scheduler, combat, Atlas, Generated Universe runtime, cross-plot, public share, or external effect authority.
- Updated contract, unit, HTTP, and tool-contract coverage to assert the packet Site Plan appears on the source Expedition Map cell.

## Artifacts

- `reports/agent-town-hq16j-packet-site-plan-map-object-proof-2026-06-02.json`

## Verification

Passed:

- `node --check server/founders_plot/engine.js`
- `node --check tests-founders-plot/fp-contract.test.js`
- `node --check tests-founders-plot/fp-unit.test.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `node --check server/founders_plot/routes.js && node --check server/founders_plot/tools.js && node --check server/founders_plot/progression_atlas.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-contract.test.js --test-name-pattern "FP-CT-101b3i"`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js --test-name-pattern "FP-UT-028b"`
- `NODE_ENV=test node --test tests-founders-plot/fp-http.test.js --test-name-pattern "FP-HT-011d3b"`
- `npm run test:founders-plot` (101/101)
- `jq empty reports/agent-town-hq16j-packet-site-plan-map-object-proof-2026-06-02.json`
- `git diff --check`

Playwright and `npm run build:founders-plot-threejs` were not run because this slice did not change frontend JavaScript/CSS or the Three.js renderer bundle. The existing UI consumes the server cell status/source IDs and will now receive a planned-site cell instead of a scouted-sector-only cell.

## Guardrails

- Scout Sector remains the only fog reveal path.
- Scout movement remains same-plot and adjacent discovered/known only.
- The packet Site Plan remains a planning-only record.
- The map object is read-only and carries zero executable actions.
- No Surveyor, convoy, settlement, route, trade, economy, resource, reward, job, timer, scheduler, combat, hidden truth, Atlas execution, Generated Universe runtime behavior, cross-plot mutation, public share, deploy, merge, external message, or external effect was introduced.
