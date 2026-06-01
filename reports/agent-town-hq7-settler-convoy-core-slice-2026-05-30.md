# AgentTown HQ7 Settler Convoy Core Slice

Date: 2026-05-30
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Worktree: `/Users/robin/Projects/Portal-atlas-editor`

## Summary

Implemented the first bounded HQ7 Settler Convoy / second plot core slice from Mill's plan.

The playable server-owned path is:

1. An HQ6-reviewed Site Plan is claim-ready planning state.
2. `et.plot.prepare_settler_convoy` spends `{ wood: 32, food: 20, stone: 12, coin: 8 }`, creates one `founder_settlement_claims` row, and starts one timed `SETTLER_CONVOY` job.
3. Simulation marks the claim `CONVOY_ARRIVED` when the convoy timer completes.
4. `et.plot.found_settlement` explicitly creates one owned outpost plot and one membership row.

This slice deliberately does not add a new HQ7 upgrade rule. It treats the HQ6-reviewed Site Plan as the bridge into the first HQ7 expansion mechanic, matching Mill's recommended narrow checkpoint.

## Implemented

- Added `founder_settlement_claims` for canonical claim/convoy/founding state.
- Added `founder_plot_memberships` for real pair-owned access to home and outpost plots while preserving the existing `founder_plots.pair_id UNIQUE` constraint.
- Reused `founder_plots` for the outpost by assigning a synthetic unique plot `pair_id` of `settlement:<claimId>`.
- Added membership checks to private plot reads and test time-advance paths.
- Added `GET /api/founders-plot/plots`.
- Added `POST /api/founders-plot/prepare-settler-convoy`.
- Added `POST /api/founders-plot/found-settlement`.
- Added tool specs for `et.plot.list_plots`, `et.plot.prepare_settler_convoy`, and `et.plot.found_settlement`.
- Added Atlas canonical HQ7 nodes/edges/action refs/receipt refs for claim-ready plans, prepared convoys, arrived convoys, founding, outpost plots, and receipts.
- Added state exposure for `settlementClaims`, `ownedPlots`, `activePlotId`, and `homePlotId`.
- Added visual-only settler actor projection from server claim state.
- Updated Founders Plot tool/skill docs and the top-level Agent Town skill policy.

## Intentionally Deferred

- No broad world map, public territory grid, shared coordinates, trade route system, doctrine effects, Generated Universe overlays, public cross-player mutation, or autonomous expansion loop.
- No production art or sprite pack wiring for the convoy/outpost assets.
- No broad Founders Plot UI plot switcher in this core slice; the HTTP/state/tool surface is ready for the next UI lane.
- No HQ7 upgrade rule or HQ6 -> HQ7 upgrade cost yet.
- No site trait mechanical bonuses; traits are persisted as claim/outpost metadata only.

## Data Model And Authority Boundary

- Gameplay truth lives in `engine.js`, `store.js`, routes, tools, and tests.
- Progression Atlas action refs remain non-executable metadata with `executableByAtlas: false`.
- Editor strategy steps, generated icons, draft gates, route prose, and alternate costs remain advisory until promoted into engine code.
- Outpost privacy is enforced through `founder_plot_memberships`; direct reads of unowned `plotId`s return `UNAUTHORIZED`.
- Idempotency remains per `(plot_id, action_name, idempotency_key)`. Preparing the same Site Plan with a different key returns the existing active/founded claim, and founding the same claim with a different key returns the existing outpost.
- Agent callers must have matching approvals for `prepare_settler_convoy` and `found_settlement`.

## Changed Files

- `server/founders_plot/engine.js`
- `server/founders_plot/store.js`
- `server/founders_plot/routes.js`
- `server/founders_plot/tools.js`
- `server/founders_plot/progression_atlas.js`
- `tests-founders-plot/fp-unit.test.js`
- `tests-founders-plot/fp-http.test.js`
- `tests-founders-plot/fp-contract.test.js`
- `public/experiences/founders-plot/tools.md`
- `public/experiences/founders-plot/skill.md`
- `public/skill.md`
- `reports/agent-town-hq7-settler-convoy-core-slice-2026-05-30.md`

## Validation

- `node --check server/founders_plot/engine.js && node --check server/founders_plot/store.js && node --check server/founders_plot/routes.js && node --check server/founders_plot/tools.js && node --check server/founders_plot/progression_atlas.js` - passed.
- `node --check tests-founders-plot/fp-unit.test.js && node --check tests-founders-plot/fp-http.test.js && node --check tests-founders-plot/fp-contract.test.js` - passed.
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js` - passed 45/45.
- `git diff --check` - passed.

## Risks / Follow-Ups

- The next UI lane should add the small plot switcher and Site Plan/Settlement Claim card actions on top of the server routes.
- Scene projection only emits a visual-only settler actor from claim state; full route/object/outpost marker rendering and asset checks belong in a graphics/UI slice.
- A future HQ7 upgrade rule should be added only when the progression economy is ready; this slice keeps the current HQ6 cap test intact.
- Site Plan JSON now stores claim linkage fields for the first slice. If many plans/claims accumulate, moving Site Plans fully out of plot JSON should be revisited.
