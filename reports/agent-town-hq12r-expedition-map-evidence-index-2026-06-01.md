# Agent Town HQ12R Expedition Map Evidence Index

Date: 2026-06-01
Lane: parent backfill after the bounded HQ12R evidence-index worker timed out without artifacts.
Verdict: COMPLETE_EVIDENCE_INDEX.

## Scope

This is a report/proof-only index of the strongest HQ12 Expedition Map evidence from the overnight sprint. It is meant to make the next session easy to resume without scanning the full dirty report tree.

No app source, tests, server files, assets, package files, or runtime authority files were edited by this index.

## Strongest Evidence Chain

The shortest proof-backed chain for the current playable HQ12 map state is:

1. **HQ12A read model** - `reports/agent-town-hq12a-expedition-map-read-model-slice-2026-05-31.md` and proof JSON.
   Server-owned, read-only fog cells derive from existing Scout Reports, Site Plans, settlement claims, owned plots/outposts, and World Grid/civic readiness.
2. **HQ12B UI** - `reports/agent-town-hq12b-expedition-map-ui-slice-2026-05-31.md` and desktop/mobile proofs.
   Founders Plot shows a private Expedition Map panel over server read-model state.
3. **HQ12C Scout Sector backend/UI** - backend and UI reports under `reports/agent-town-hq12c-*`.
   Scout Sector is the only explicit Expedition Map mutation path and reveals exactly one eligible hinted sector as known.
4. **HQ12D Three.js renderer** - `reports/agent-town-hq12d-threejs-zoomable-expedition-map-renderer-2026-05-31.md` and proof JSON/screenshots.
   Renderer consumes server-owned cells only, with pan, zoom, selection, mobile touch proof, and hidden-truth suppression.
5. **HQ12E/HQ12F Event Packets** - backend/UI reports under `reports/agent-town-hq12e-*` and `reports/agent-town-hq12f-*`.
   Event Packets are read-only receipt/read-model evidence tied to Scout Sector, not executable actions.
6. **HQ12G/HQ12L Expedition Party** - server-owned party metadata plus polished read-only party UI.
   Expedition Party is flavor/read-model metadata only, sourced from `expeditionMap.expeditionParty` and packet `partySnapshot`.
7. **HQ12I/HQ12J/HQ12O map readability** - semantic zoom, legend/card polish, and sector art/readability proofs.
   These improve map scanning without adding gameplay authority.
8. **HQ12M live Scout Sector preflight** - `reports/agent-town-hq12m-scout-sector-live-preflight-2026-06-01.md` and proof JSON.
   Strongest live-click evidence: real local `/founders-plot`, real state route, real Scout Sector button, and real Scout Sector POST with no Playwright route mocking.
9. **HQ12N Current focus strip** - `reports/agent-town-hq12n-expedition-objective-strip-2026-06-01.md` and proof JSON/screenshots.
   Read-only strip derived only from existing map, packet, and party read-model fields; no server objective system was created.
10. **HQ12P fresh progression preflight** - `reports/agent-town-hq12p-fresh-progression-map-preflight-2026-06-01.md` and screenshots.
    Verifies the freshest feasible bridge from canonical progression to current Expedition Map surfaces, while correctly avoiding an invented HQ1-to-HQ12 campaign.
11. **HQ12Q sprint wrap** - `reports/agent-town-hq12q-expedition-map-sprint-wrap-2026-06-01.md`.
    Summarizes the playable state and residual caveats.

## Best Proof Files To Open First

- `reports/agent-town-hq12m-scout-sector-live-preflight-proof-2026-06-01.json`
- `reports/agent-town-hq12o-expedition-sector-art-readability-proof-2026-06-01.json`
- `reports/agent-town-post-hq12o-expedition-sector-readability-regression-qa-proof-2026-06-01.json`
- `reports/agent-town-hq12p-fresh-progression-map-preflight-proof-2026-06-01.json`
- `reports/agent-town-hq12q-expedition-map-sprint-wrap-proof-2026-06-01.json`

Best visual screenshots:

- `reports/agent-town-hq12o-expedition-sector-art-readability-desktop-2026-06-01.png`
- `reports/agent-town-hq12o-expedition-sector-art-readability-mobile-2026-06-01.png`
- `reports/agent-town-hq12p-fresh-progression-map-preflight-threejs-desktop-2026-06-01.png`
- `reports/agent-town-hq12p-fresh-progression-map-preflight-threejs-mobile-2026-06-01.png`

## Current Verdict

HQ12 is ready to hand off as a first playable private Expedition Map slice:

- Server-owned fog-of-war cells exist.
- Founders Plot exposes a private readable map.
- Three.js pan/zoom/select works over server-owned cells.
- Scout Sector is the only reveal mutation.
- Event Packet, Expedition Party, and Current focus surfaces are read-only and buttonless.
- Hidden cells do not leak resources, routes, jobs, timers, rewards, receipts, or outpost truth before server receipt.

The map is not yet a travel simulation, route/trade system, resource-harvesting loop, combat system, public sharing flow, autonomous party system, or real Generated Universe renderer.

## Residual Caveats

- Canonical gameplay progression is still capped around HQ6; HQ12 is a verified private map horizon, not a full HQ1-to-HQ12 campaign.
- The parked HQ12P post-readability live smoke did not complete a fresh browser click replay after HQ12O. The HQ12M live preflight remains the strongest live-click proof.
- The repo remains heavily dirty with intentional AgentTown source, asset, and report changes from the sprint.
- Next implementation should be a new bounded slice, not broad expedition simulation.

## Next Session Recommendations

1. Start from HQ12Q/HQ12R before choosing a next lane.
2. If proof confidence is the priority, rerun a fresh live Scout Sector UI click after HQ12O and save a new proof.
3. If gameplay design is the priority, draft a server-owned next HQ12 objective/readiness receipt slice without routes, trade, resource harvesting, combat, scheduler behavior, public sharing, Atlas execution, or autonomous party state.

## Guardrails

This index preserves the sprint boundary:

- No source edits.
- No server/store/engine/routes/tools/spec authority changes.
- No new mutation paths.
- No packet/party/objective actions.
- No Atlas execution.
- No public sharing.
- No Generated Universe rendering.
- No route/trade/economy/resource/combat/scheduler behavior.
- No hidden autonomy, cross-plot mutation, external effects, or Wild West/cowboy/saloon/gold-rush drift.
