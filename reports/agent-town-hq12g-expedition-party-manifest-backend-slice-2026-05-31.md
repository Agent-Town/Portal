# AgentTown HQ12G Expedition Party Manifest Backend Slice

Date: 2026-05-31

## Summary

Implemented the bounded HQ12G backend slice as server-owned read-only Expedition Party metadata.

The Expedition Map read model now includes an `expeditionParty` manifest with three existing named operator assets:

- Mira Trailmark (`pathfinder-scout-v1`) as scout.
- Rook Signalpost (`rook-signalpost-messenger-v1`) as messenger.
- Vale-Desk 7 (`hq-civic-operator-vale-desk-7-v1`) as HQ civic operator.

Scout Sector Event Packets now include a tiny denormalized `partyId` and `partySnapshot` so packets remain readable without creating party state or action authority.

## Changed Files

- `server/founders_plot/engine.js`
  - Added `EXPEDITION_PARTY_MANIFEST_AUTHORITY_BOUNDARY`.
  - Added deterministic `EXPEDITION_PARTY_MEMBERS`.
  - Added party manifest/snapshot builders and boundary flags.
  - Attached `expeditionMap.expeditionParty`.
  - Attached `eventPacket.partyId` and `eventPacket.partySnapshot`.
- `server/founders_plot/tools.js`
  - Updated `et.plot.get_expedition_map` and `et.plot.scout_sector` descriptions to mention read-only party metadata and no operator assignment.
- `specs/02_api_contract.md`
  - Documented the Expedition Party manifest and Event Packet party snapshot.
  - Added explicit boundary language that party members are presentation metadata only.
- `tests-founders-plot/fp-unit.test.js`
  - Added manifest and party snapshot assertions to HQ12A/HQ12C coverage.
- `tests-founders-plot/fp-contract.test.js`
  - Added schema-envelope assertions for party metadata.
- `tests-founders-plot/fp-http.test.js`
  - Added HTTP assertions for manifest and snapshot stability.

## Guardrail Result

All requested guardrails held.

- No autonomous movement.
- No operator assignment or party management route/tool.
- No hidden operator state.
- No resource harvesting, payout, loss, or stat effects.
- No route, trade, economy, combat, scheduler, background behavior, public sharing, Generated Universe rendering, Atlas execution, cross-plot mutation, or external effects.
- No frontend UI changes.
- No store migration or new persistence shape beyond the existing Scout Sector packet metadata.

## Verification

Passed:

```bash
node --check server/founders_plot/engine.js
node --check server/founders_plot/tools.js
NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js
```

The focused Founders Plot test run passed 83 tests.

Proof JSON:

- `reports/agent-town-hq12g-expedition-party-manifest-backend-proof-2026-05-31.json`
