# AgentTown HQ10B Civic Proposal Records Slice - 2026-05-31

## Summary

Implemented the next smallest safe server-owned HQ10B lane after HQ10A World Grid readiness: persisted civic proposal records.

This is a bounded record/review surface only. It creates and lists advisory records; it does not execute civic changes.

## Changed Files

- `server/founders_plot/store.js`
- `server/founders_plot/engine.js`
- `server/founders_plot/routes.js`
- `server/founders_plot/tools.js`
- `server/founders_plot/progression_atlas.js`
- `tests-founders-plot/fp-unit.test.js`
- `tests-founders-plot/fp-contract.test.js`
- `tests-founders-plot/fp-http.test.js`
- `specs/02_api_contract.md`
- `reports/agent-town-hq10b-civic-proposal-records-proof-2026-05-31.json`
- `reports/agent-town-hq10b-civic-proposal-records-slice-2026-05-31.md`

## Behavior

- Added persisted `founder_civic_proposals` records with `DRAFT`, `REVIEWED`, and `ARCHIVED` statuses.
- Added server-owned read model `state.civicProposals` and public summary counts.
- Added World Grid civic proposal summary counts under `state.worldGrid.civicProposals`.
- Added `GET /api/founders-plot/civic-proposals` and tool spec `et.plot.list_civic_proposals`.
- Added `POST /api/founders-plot/civic-proposals` and tool spec `et.plot.create_civic_proposal`.
- Creation is idempotent and gated behind HQ10A readiness: HQ6, founded outpost, Survey Discipline, and the bounded work-order executor.
- Human callers can create explicit records.
- Agent callers must have a matching human approval for `create_civic_proposal`.
- Progression Atlas now exposes:
  - `world_grid.civic_proposal_records`
  - one non-executing `civic_proposal.*` node per persisted record
  - metadata-only create action ref with `executableByAtlas: false`

## Authority Boundary

Boundary string: `server_owned_civic_proposal_record_no_execution_v1`.

HQ10B explicitly does not add:

- civic mutation or public-work execution
- trade routes or route creation
- scheduling/background work
- arbitrary tool execution
- resource spending
- Atlas-owned execution
- settlement founding
- cross-plot mutation
- external/public effects

## HQ10A Stable Hash Follow-Up

Investigated the residual HQ10A note about volatile World Grid projection fields affecting stable gameplay hashes.

Small safe fix made: `worldGridReadModel().plots` no longer includes `updatedAt`. The read model still exposes stable gameplay-significant plot identity/scope fields, and the proof confirms `plotProjectionHasUpdatedAt: false`.

## Proof

- `reports/agent-town-hq10b-civic-proposal-records-proof-2026-05-31.json`

The proof shows:

- proposal creation succeeds only after World Grid readiness setup;
- created records are `proposalOnly: true` and `executionAllowed: false`;
- list route is read-only with empty `worldDelta`;
- World Grid summarizes one proposal record;
- Atlas exposes the records node as available with `executableByAtlas: false`;
- proposal record nodes have `actionRef: null`.

## Tests Run

- `node --check server/founders_plot/store.js`
- `node --check server/founders_plot/engine.js`
- `node --check server/founders_plot/routes.js`
- `node --check server/founders_plot/tools.js`
- `node --check server/founders_plot/progression_atlas.js`
- `node --check tests-founders-plot/fp-unit.test.js`
- `node --check tests-founders-plot/fp-contract.test.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js` - 68/68 passed
- `git diff --check`

## Residual Risks

- The branch remains heavily dirty from other active AgentTown lanes; this slice stayed inside the requested server/test/spec/report files.
- Civic proposal review is represented by record status and metadata only. There is no separate review/update endpoint yet.
- `relatedPlotIds` are filtered to currently known owned plot ids; proof data that writes only a founded claim without materializing the outpost plot produces an empty related list by design.
- Existing Founders Plot read endpoints still share normal bootstrap behavior for brand-new sessions.
