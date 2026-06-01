# Agent Town HQ11 Civic Project Inspection UI Slice - 2026-05-31

## Scope

Implemented a bounded Founders Plot UI slice for the existing HQ11 civic project inspection backend route.

Owned files touched:
- `public/experiences/founders-plot/founders-plot.js`
- `e2e/200_founders_plot.spec.js`
- `reports/agent-town-hq11-civic-project-inspection-ui-proof-2026-05-31.png`
- `reports/agent-town-hq11-civic-project-inspection-ui-mobile-proof-2026-05-31.png`
- this report

No server, Progression Atlas, scene_state, generated Three.js bundle, assets, store, routes, or tools were edited.

## Behavior

- If the read model exposes an `ACTIVE` civic project without a `baseline_readiness` inspection, the Civic Operations panel shows an explicit `Inspect Civic Project` human action.
- The button calls only `POST /api/founders-plot/civic-projects/inspect`.
- The payload uses `actor: "HUMAN"`, `inspectionType: "baseline_readiness"`, current `plotId`, selected `projectId`, a short note, and a generated `idempotencyKey`.
- On success, the UI refreshes Founders Plot state and shows receipt/completed copy.
- If there is no active civic project, or the active project is already inspected, the UI is locked/unavailable and does not show the action button.

## Authority Boundary

This slice is inspection-only UI over the backend route. It does not add a scheduler, background automation, public sharing, route/trade behavior, resource spend, settlement/civic proposal/overlay authority, arbitrary tool execution, Atlas execution, cross-plot mutation, or Generated Universe rendering.

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-021"`
- `file reports/agent-town-hq11-civic-project-inspection-ui-proof-2026-05-31.png reports/agent-town-hq11-civic-project-inspection-ui-mobile-proof-2026-05-31.png`
- `identify reports/agent-town-hq11-civic-project-inspection-ui-proof-2026-05-31.png reports/agent-town-hq11-civic-project-inspection-ui-mobile-proof-2026-05-31.png`
- `git diff --check`

All checks passed.

## Proof

- `reports/agent-town-hq11-civic-project-inspection-ui-proof-2026-05-31.png` - desktop proof, `1280x9329`
- `reports/agent-town-hq11-civic-project-inspection-ui-mobile-proof-2026-05-31.png` - mobile proof, `390x10716`
