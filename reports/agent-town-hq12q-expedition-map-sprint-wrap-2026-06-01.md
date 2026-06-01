# Agent Town HQ12Q Expedition Map Sprint Wrap

Date: 2026-06-01
Lane: parent backfill after the bounded HQ12Q wrap worker failed without report/proof artifacts.
Verdict: READY_FOR_NEXT_BOUNDED_SLICES.

## Scope

This is a report/proof-only sprint wrap for the HQ12 Expedition Map sequence. It summarizes the current playable state, verified evidence, residual caveats, and next bounded lanes for tomorrow.

No app source, tests, server files, assets, HEARTBEAT, or memory files were edited by this wrap report.

## Current Playable State

The HQ12 Expedition Map is now a coherent first playable private unknown-world map slice:

- Server-owned fog-of-war read model with `discovered`, `known`, `hinted`, and `locked_unknown` cells.
- Founders Plot Expedition Map panel with selected-sector detail, fog legend, sector readability polish, and hidden-truth suppression.
- Bounded Three.js map surface with pan, zoom, selectable sectors, semantic zoom labels, and mobile touch proof.
- Scout Sector as the only explicit Expedition Map mutation path, revealing exactly one eligible hinted sector as known.
- Read-only Expedition Event Packet evidence tied to Scout Sector receipts.
- Read-only Expedition Party flavor from server-owned `expeditionMap.expeditionParty` and Event Packet `partySnapshot`.
- Read-only Current focus strip derived from existing map, packet, and party state.

The slice is playable as reveal, evidence, receipt, and map-reading gameplay. It is not yet a travel, route, resource-harvesting, combat, autonomous party, public sharing, or real Generated Universe rendering system.

## Verified Evidence

Recent proof-backed lanes reviewed for this wrap:

- HQ12M live Scout Sector preflight: real local `/founders-plot` page, real `/api/founders-plot/state`, real Scout Sector UI click, and real `/api/founders-plot/expedition-map/scout-sector` POST with no Playwright route mocking.
- HQ12O sector art/readability pass: fog states, legend swatches, selected-sector framing, and sector-card scanability improved with frontend/CSS/e2e/report/proof only.
- Post-HQ12O regression QA: no regressions found; `FP-E2E-022`, `FP-E2E-023`, and Founders Plot unit/contract/HTTP/scene-state checks passed in recorded evidence.
- HQ12P fresh progression map preflight: fresh HTTP progression/Expedition Board path, canonical Expedition Map route, Scout Sector route, browser Expedition Map/Event Packet/Party/Current focus/readability surfaces, and Three.js map selection verified.
- HQ12P Scout Sector post-readability smoke: parked with notes; real Scout Sector HTTP route still passed after readability polish, but it did not replace the earlier HQ12M live UI click proof.

Parent wrap checks also re-read proof JSON and image evidence for the above artifacts.

## Guardrails

The sprint wrap preserves the current authority boundary:

- Scout Sector remains the only Expedition Map UI mutation path.
- Event Packet, Expedition Party, and Current focus surfaces remain read-only and buttonless.
- Hidden/hinted/locked sectors do not reveal hidden resources, routes, jobs, timers, rewards, receipts, or outpost truth before server receipt.
- Progression Atlas remains advisory and non-executable.
- No server/store/engine/routes/tools/spec authority changes were made by this wrap.
- No packet actions, party management, assignments, autonomous movement, resource harvesting, route/trade/economy hooks, combat, scheduler/background behavior, public sharing, Generated Universe rendering, cross-plot mutation, external effects, hidden autonomy, or Wild West/cowboy/saloon/gold-rush drift was introduced.

## Residual Caveats

- Canonical playable progression is still capped around HQ6; later HQ12 surfaces are a verified private map horizon rather than a full HQ1-to-HQ12 campaign.
- The parked HQ12P post-readability live-smoke lane did not complete a fresh browser click replay after HQ12O. The earlier HQ12M live UI proof remains the stronger live-click evidence.
- The map is currently a reveal/receipt/read-model loop, not a travel simulation.
- The repo remains heavily dirty with intentional AgentTown source, asset, and report changes from the wider sprint.

## Recommended Next Bounded Lanes

1. **Post-wrap evidence index.** Produce a tiny report-only index of HQ12 Expedition Map reports/proofs/screenshots so the next session can find the strongest evidence without scanning the whole dirty tree.
2. **Live click rerun after readability polish.** If useful, rerun a fresh browser Scout Sector click after HQ12O/HQ12P and save proof, explicitly building on the earlier HQ12M live UI proof.
3. **Next gameplay design note.** Draft the next server-owned HQ12 gameplay slice proposal, likely around bounded expedition objective receipts or readiness records, without adding routes/trade/resource/combat/autonomy.

## Verdict

HQ12 is ready to hand off as a first playable private Expedition Map slice with strong guardrails. The safest next work is documentation/evidence consolidation or another narrow live proof, not broad new gameplay authority.
