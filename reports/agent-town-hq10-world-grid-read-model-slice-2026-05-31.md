# Agent Town HQ10A World Grid Read-Model Slice - 2026-05-31

## Implementation Summary

Implemented the smallest safe HQ10A World Grid slice as a server-owned read model.

- Added `worldGridReadModel` to `server/founders_plot/engine.js`.
- Exposed `state.worldGrid` and `state.publicSummary.worldGridReady/worldGridStatus`.
- Added read-only `engine.getWorldGridStatus` and `GET /api/founders-plot/world-grid`.
- Added read-only tool documentation for `et.plot.get_world_grid_status`.
- Added Progression Atlas canonical nodes:
  - `world_grid.read_model`
  - `world_grid.civic_readiness`
- Added focused unit, contract, and HTTP coverage for the read model, read-only tool schema, route, and Atlas nodes.

The read model summarizes current server-owned facts:

- HQ6 Settlement Charter readiness
- founded outpost count and known plot scope
- settlement claim status counts
- selected Research Lodge doctrine and active effects
- bounded HQ9 work-order readiness and counts
- civic readiness for the next promotable slice

## Authority Boundary

HQ10A is read-only.

Authority boundary string: `server_owned_read_only_world_grid_projection_no_civic_mutation_v1`.

This slice does not add:

- civic mutation
- scheduling/background execution
- trade routes
- arbitrary tool execution
- resource spending
- settlement founding
- public/external effects
- Atlas-owned execution
- store schema migration

Progression Atlas projects the read model and requirements only. Its World Grid nodes have no executable action refs.

## Files Changed

- `server/founders_plot/engine.js`
- `server/founders_plot/routes.js`
- `server/founders_plot/tools.js`
- `server/founders_plot/progression_atlas.js`
- `tests-founders-plot/fp-unit.test.js`
- `tests-founders-plot/fp-contract.test.js`
- `tests-founders-plot/fp-http.test.js`
- `reports/agent-town-hq10-world-grid-read-model-proof-2026-05-31.json`
- `reports/agent-town-hq10-world-grid-read-model-slice-2026-05-31.md`

## Proof Path

- `reports/agent-town-hq10-world-grid-read-model-proof-2026-05-31.json`

The proof shows `READ_MODEL_READY`, `readOnly: true`, empty `executableActions`, all four readiness requirements satisfied, and Atlas World Grid nodes with `actionRef: null`.

## Tests Run

- `node --check server/founders_plot/engine.js`
- `node --check server/founders_plot/routes.js`
- `node --check server/founders_plot/tools.js`
- `node --check server/founders_plot/progression_atlas.js`
- `node --check tests-founders-plot/fp-unit.test.js`
- `node --check tests-founders-plot/fp-contract.test.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js` - 30/30 passed
- `NODE_ENV=test node --test tests-founders-plot/fp-contract.test.js` - 15/15 passed
- `NODE_ENV=test node --test tests-founders-plot/fp-http.test.js` - 19/19 passed
- `git diff --check`

## Residual Risks

- The worktree is heavily dirty from other active lanes; this slice only made additive, bounded changes in the requested files.
- `GET /api/founders-plot/world-grid` follows existing Founders Plot identity/bootstrap behavior. It is read-only for civic/gameplay authority, but a brand-new session may still create the normal initial Founders Plot record through shared bootstrap code.
- The read model reports readiness from existing HQ6-HQ9 server facts. It does not yet persist civic proposal records or model public works.

## Remaining HQ10B/C Work

HQ10B should add server-owned civic proposal records only:

- proposal schema and persistence
- proposal read/write endpoints with idempotency and approval boundaries
- no execution, no spending, no routes, no scheduling
- Atlas proposal visibility with non-executable refs

HQ10C should add Generated Universe overlay packs only:

- visual projection packs for World Grid/Atlas presentation
- no gameplay truth changes
- no resource, route, civic, doctrine, or work-order authority
- deterministic proof screenshots/assets
