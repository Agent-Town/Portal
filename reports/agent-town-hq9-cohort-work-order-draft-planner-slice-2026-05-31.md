# Agent Town HQ9A Cohort Work-Order Draft Planner Slice

Date: 2026-05-31
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Summary

Implemented the first HQ9 cohort/work-order slice as a draft-only planner. The new path creates bounded, server-owned work-order draft records from an engine template, exposes them in Founders Plot state and the Progression Atlas canonical graph, and deliberately does not execute any child actions.

This continues the HQ6-HQ8 line:

- HQ6: Site Plans can be reviewed into claim-ready planning state.
- HQ7: Settler Convoys can found one outpost/second plot through server-owned actions.
- HQ8: Survey Discipline can be selected and applies only a 5% Expedition Board SCOUT duration reduction.
- HQ9A: Cohort Work Orders can now be drafted against that engine truth, but execution remains unavailable.

## Implemented

- Added `founder_work_orders` persistence in `server/founders_plot/store.js`.
- Added one engine-owned template in `server/founders_plot/engine.js`:
  - `collect_ready_outputs_once`
  - Unlocks after HQ6, a founded outpost, and selected `survey_discipline`.
  - Allows only `et.plot.collect_outputs`.
  - Caps child actions at 2, resource spend at zero, runtime at 120000ms, and scope to the current plot.
- Added `createWorkOrderDraft` engine mutation.
- Added `POST /api/founders-plot/work-orders/draft`.
- Added `et.plot.create_work_order_draft` tool schema.
- Added `cohortPlanner`, `workOrderTemplates`, and `workOrders` to Founders Plot state.
- Added work-order draft count to public summary.
- Added Progression Atlas canonical nodes for:
  - `cohort.work_order_planner`
  - `work_order.template.collect_ready_outputs_once`
  - persisted `work_order.*` draft nodes
- Added Atlas summary fields:
  - `workOrderDraftCount`
  - `workOrderExecutionAvailable: false`
- Updated Founders Plot skill/tool docs with the HQ9A boundary.

## Behavior

Draft creation rejects until all requirements are true:

- HQ level >= 6
- At least one founded outpost exists
- `survey_discipline` is selected

Successful drafts persist:

- `status: DRAFT`
- selected/current-plot scope
- allowed child action list
- hard caps
- policy snapshot at draft time
- empty `childReceipts`
- 24 hour expiry timestamp

The mutation emits a `WORK_ORDER_DRAFTED` event and returns `executionAvailable: false`.

## Explicit Boundaries

This slice does not add:

- a work-order executor
- automatic collection
- child action dispatch
- approval consumption
- cross-plot automation
- resource spending
- scheduler behavior
- new autonomous authority

The Atlas action refs remain metadata; Founders Plot owns the real mutation.

## Validation

Passed:

- `node --check server/founders_plot/store.js`
- `node --check server/founders_plot/engine.js`
- `node --check server/founders_plot/routes.js`
- `node --check server/founders_plot/tools.js`
- `node --check server/founders_plot/progression_atlas.js`
- `node --check tests-founders-plot/fp-contract.test.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `node --check e2e/200_founders_plot.spec.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js` - 28/28
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js` - 25/25
- `npx playwright test e2e/200_founders_plot.spec.js e2e/114_progression_atlas_openclaw_lite.spec.js --project=chromium` - 14/14
- `git diff --check`

## Next

The next natural bounded slice is either:

1. HQ9B safe work-order executor for the single `collect_ready_outputs_once` template, with approval and cap checks, or
2. HQ9 UI for reviewing and creating work-order drafts inside Founders Plot before adding execution.

The safer product order is UI first if Robin wants to inspect the planning surface; executor first if the priority is proving the agent loop.
