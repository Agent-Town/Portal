# Agent Town HQ12E Expedition Event Packets Backend Slice

Date: 2026-05-31

## Outcome

Implemented the smallest safe HQ12E slice: successful Scout Sector receipts now expose deterministic, read-only Expedition Event Packet metadata for the newly known sector.

The packet is server-owned flavor/read-model metadata only. It is linked to the Scout Sector receipt and includes discovery flavor, terrain explanation, risk explanation, operator note, receipt link, and explicit boundary flags. It does not add movement, damage, combat, route/trade economy, resources, scheduler behavior, public sharing, Atlas execution, Generated Universe rendering, cross-plot mutation, or external effects.

## Implementation

- Added `EXPEDITION_EVENT_PACKET_AUTHORITY_BOUNDARY` and deterministic event packet templates in `server/founders_plot/engine.js`.
- Added event packet construction from stable scout/cell coordinates and persisted scout receipt fields.
- Exposed the packet in:
  - `scoutSector.eventPacket`
  - top-level `eventPacket` on the Scout Sector response
  - the revealed Expedition Map cell
  - `expeditionMap.eventPackets`
  - `expeditionMap.sourceSummary.eventPacketIds`
- Added `eventPacketId` to Scout Sector proof and receipt metadata.
- Updated the worker/tool contract description and schema for `et.plot.scout_sector`.
- Updated API contract docs for the new read-only packet shape.

## Verification

- `node --check server/founders_plot/engine.js`
- `node --check server/founders_plot/tools.js`
- `node --check tests-founders-plot/fp-unit.test.js`
- `node --check tests-founders-plot/fp-contract.test.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js`
  - Result: 83 passing tests.
- `git diff --check -- server/founders_plot/engine.js server/founders_plot/tools.js tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js specs/02_api_contract.md`
- `git diff --check`
- `jq empty reports/agent-town-hq12e-expedition-event-packets-backend-proof-2026-05-31.json`

## Files Changed

- `server/founders_plot/engine.js`
- `server/founders_plot/tools.js`
- `tests-founders-plot/fp-unit.test.js`
- `tests-founders-plot/fp-contract.test.js`
- `tests-founders-plot/fp-http.test.js`
- `specs/02_api_contract.md`
- `reports/agent-town-hq12e-expedition-event-packets-backend-slice-2026-05-31.md`
- `reports/agent-town-hq12e-expedition-event-packets-backend-proof-2026-05-31.json`

## Residual Risk

The shared branch was already dirty before this slice, including the same server/test/doc areas from earlier HQ lanes. I kept the slice bounded to additive read-model/receipt metadata and did not run the full Playwright suite (`npm test`) because the assigned checks asked for focused Founders Plot unit/contract/http coverage.
