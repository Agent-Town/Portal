# HQ11 Civic Operations Backend Slice - 2026-05-31

## Result

Implemented the smallest safe HQ11 follow-on after HQ10D civic project activation: a server-owned same-plot baseline civic project inspection.

The new operation records one `baseline_readiness` inspection for an `ACTIVE` civic project on the current plot. It updates the civic project receipt/effect JSON, writes a `CIVIC_PROJECT_INSPECTED` audit event, updates the World Grid/local readiness read model, and exposes Progression Atlas metadata through a non-executable action reference.

## Changed Files

- `server/founders_plot/engine.js`
- `server/founders_plot/routes.js`
- `server/founders_plot/tools.js`
- `server/founders_plot/progression_atlas.js`
- `tests-founders-plot/fp-unit.test.js`
- `tests-founders-plot/fp-contract.test.js`
- `tests-founders-plot/fp-http.test.js`
- `reports/agent-town-hq11-civic-operations-backend-slice-2026-05-31.md`
- `reports/agent-town-hq11-civic-operations-backend-proof-2026-05-31.json`

## Behavior

- New tool/API: `et.plot.inspect_civic_project` via `POST /api/founders-plot/civic-projects/inspect`.
- Requires `projectId` and `idempotencyKey`; optional `inspectionType` is bounded to `baseline_readiness`.
- Only works on an existing `ACTIVE` civic project in the current plot bundle.
- Reusing the same idempotency key returns the original receipt.
- Using a different idempotency key after baseline inspection returns the existing inspection with `alreadyInspected: true` and no new world delta.
- Agent callers require matching human approval.

## Read Model Updates

- Civic project effect now includes inspection metadata: baseline completion, inspection count, latest inspection timestamp, and inspection readiness delta.
- World Grid now reports civic project inspection count, latest inspection time, inspection readiness delta, and a `civic_project_baseline_inspection` readiness signal.
- Local project readiness score can move from `1` after beacon activation to `2` after baseline inspection.
- Progression Atlas exposes `et.plot.inspect_civic_project` only as metadata with `executableByAtlas: false`; after inspection the action ref disappears and the receipt remains visible on the project node.

## Authority Boundary

This slice does not add scheduler/background automation, route/trade behavior, cross-plot mutation, arbitrary tool execution, Atlas execution, resource spend, settlement founding, public sharing, or external effects.

Inspection receipts explicitly record:

- `resourceDelta: {}`
- `routeCreation: false`
- `tradeRouteCreation: false`
- `backgroundScheduling: false`
- `externalEffects: false`
- `atlasExecution: false`
- `crossPlotMutation: false`

## Verification

- `node --check server/founders_plot/engine.js`
- `node --check server/founders_plot/store.js` (checked, not changed by this slice)
- `node --check server/founders_plot/routes.js`
- `node --check server/founders_plot/tools.js`
- `node --check server/founders_plot/progression_atlas.js`
- `node --check tests-founders-plot/fp-unit.test.js`
- `node --check tests-founders-plot/fp-contract.test.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js` passed `77/77`
- Proof JSON parse: passed
- `git diff --check`: passed
