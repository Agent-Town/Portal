# Agent Town HQ12M Scout Sector Live Preflight

Date: 2026-06-01 01:38 +07

Verdict: PASS. I found no Scout Sector contract regression after the later Expedition Map, Event Packet, and Expedition Party polish.

This was a bounded report/proof-only QA lane. I did not change runtime code or test harness files.

## Live Proof

I ran a one-off live Node + Playwright preflight against `node server/index.js` with `NODE_ENV=test` and a temporary sqlite store. The browser opened the real `/founders-plot` page, used the real `/api/founders-plot/state` read model, clicked the real Scout Sector button, and observed the real `/api/founders-plot/expedition-map/scout-sector` POST. No Playwright route mocking was used.

Key live evidence is in `reports/agent-town-hq12m-scout-sector-live-preflight-proof-2026-06-01.json`.

- Before Scout Sector: map counts were `discovered=2`, `known=0`, `hinted=2`, `locked_unknown=8`.
- Scout target: `cell_q1_r-1`, `fogState=hinted`, `kind=frontier_hint`, empty resource hints.
- Hidden/locked guardrail: known/discovered cell `cell_origin` had `0` Scout Sector buttons; locked cell `cell_q-3_r0` had `0` Scout Sector buttons.
- UI mutation path: the only observed POST was `POST /api/founders-plot/expedition-map/scout-sector`.
- Successful reveal: `cell_q1_r-1` moved to `fogState=known`, `kind=scouted_sector`, `sourceTruth=expedition_scout_sector`.
- Revealed target guardrail: `cell_q1_r-1` had no Scout Sector button after it became known; remaining Scout Sector buttons were only for newly derived hinted silhouettes.
- Server proof: `newlyKnownOrDiscoveredCellIds` was exactly `["cell_q1_r-1"]`; the hinted count increased because the server derived new read-only frontier silhouettes from the newly known edge.
- Event Packet: `expedition_event_packet_a30713b8c063523e`, `readOnly=true`, `executableActions=[]`, visible in the UI with `0` packet buttons.
- Expedition Party: `expedition_party_current_plot_v1`, `readOnly=true`, `executableActions=[]`, visible in the UI with `0` party buttons.

## Guardrails

Confirmed true in the live proof:

- Scout Sector remains the only Expedition Map mutation path.
- Known/discovered and locked cells do not expose Scout Sector.
- Event Packet and Expedition Party surfaces remain read-only and buttonless.
- No Atlas execution requests or receipt flags.
- No public sharing requests or receipt flags.
- No Generated Universe rendering flags.
- No route, trade, economy, resource, combat, scheduler, hidden autonomy, or cross-plot mutation.
- Inventory, jobs, and settlement claim count stayed unchanged by Scout Sector.
- No Wild West/cowboy/saloon/gold-rush copy surfaced in the proof DOM.

## Checks

- `jq . reports/agent-town-hq12m-scout-sector-live-preflight-proof-2026-06-01.json >/dev/null` - pass
- `node --check public/experiences/founders-plot/founders-plot.js` - pass
- `node --check e2e/200_founders_plot.spec.js` - pass
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js` - pass
- `node --check server/founders_plot/engine.js && node --check server/founders_plot/routes.js` - pass
- `node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-scene-state.test.js` - pass, 92/92
- `git diff --check -- reports/agent-town-hq12m-scout-sector-live-preflight-2026-06-01.md reports/agent-town-hq12m-scout-sector-live-preflight-proof-2026-06-01.json` - pass
- `rg -n "expedition-map/scout-sector|scoutExpeditionSector|getExpeditionMapStatus|fp-btn-scout-sector|fp-expedition-event-packet|fp-expedition-party|renderExpedition" server/founders_plot public/experiences/founders-plot public/progression-atlas.js e2e/200_founders_plot.spec.js e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js` - pass; source scan found the existing Scout Sector route, engine handler, UI button path, and read-only packet/party render surfaces.

I did not rerun the existing `FP-E2E-022` / `FP-E2E-023` specs because those specs write or overwrite prior report screenshots/proof artifacts in this already dirty shared worktree. The custom live proof above was used specifically to reduce the earlier mocked-UI residual without touching those artifacts.

## Artifacts

- `reports/agent-town-hq12m-scout-sector-live-preflight-2026-06-01.md`
- `reports/agent-town-hq12m-scout-sector-live-preflight-proof-2026-06-01.json`
- No screenshots were generated for this lane.
