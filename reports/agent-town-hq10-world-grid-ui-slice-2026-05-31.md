# Agent Town HQ10 World Grid UI Slice - 2026-05-31

## Summary

Added the smallest useful Founders Plot UI surface for the HQ10A World Grid read model.

The new Founders Plot side panel renders server-owned `state.worldGrid` when present, with a read-only `/api/founders-plot/world-grid` fallback only if the state envelope does not include a World Grid status.

## Changed Files

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `public/experiences/founders-plot/index.html`
- `e2e/200_founders_plot.spec.js`
- `reports/agent-town-hq10-world-grid-ui-proof-2026-05-31.png`
- `reports/agent-town-hq10-world-grid-ui-slice-2026-05-31.md`

## Behavior

- Adds a `World Grid` parchment panel consistent with the current Founders Plot operational UI.
- Shows current status/readiness:
  - `READ_MODEL_READY - read-only`
  - satisfied requirement count
  - HQ6 Settlement Charter, founded outpost, Survey Discipline, and collect-ready work-order requirements
- Shows known scope:
  - known plots
  - founded outposts
  - settlement claim count/status
  - home and active plot ids
- Shows civic readiness signals:
  - multi-plot visibility
  - claim receipts
  - doctrine context
  - bounded work orders
- Shows prohibited capabilities:
  - civic mutation
  - trade routes/routes
  - background scheduling
  - arbitrary tool execution
  - resource spending
  - Atlas-owned execution
  - external/public effects
- Explicitly labels the panel as read-only advisory presentation. It adds no buttons and no mutations.

## Authority Boundary

This is frontend/read-only presentation over existing server truth.

No changes were made to:

- `server/founders_plot/*`
- Progression Atlas engine/source files
- asset-generation directories

The UI does not add civic mutation, routes, scheduling, spending, settlement founding, work-order execution, Atlas execution, or arbitrary tool execution.

## Proof

- `reports/agent-town-hq10-world-grid-ui-proof-2026-05-31.png`

The proof screenshot uses a route-mocked HQ10A read-model state and captures the World Grid panel with status, requirements, scope, civic readiness, and prohibited capability chips.

## Tests Run

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `PW_PORT=4186 npx playwright test e2e/200_founders_plot.spec.js --grep "FP-E2E-014" --project=chromium` - 1/1 passed
- `PW_PORT=4188 npx playwright test e2e/200_founders_plot.spec.js --grep "FP-E2E-002|FP-E2E-014" --project=chromium` - 2/2 passed
- `PW_PORT=4190 npx playwright test e2e/200_founders_plot.spec.js --grep "FP-E2E-002|FP-E2E-014" --project=chromium` - 2/2 passed
- `PW_PORT=4192 npx playwright test e2e/200_founders_plot.spec.js --grep "FP-E2E-014" --project=chromium` - 1/1 passed
- `file reports/agent-town-hq10-world-grid-ui-proof-2026-05-31.png`
- `identify reports/agent-town-hq10-world-grid-ui-proof-2026-05-31.png`
- `git diff --check`

## Residual Risks

- The branch is heavily dirty/shared from many active AgentTown lanes. This slice stayed inside the requested frontend/e2e/report files and did not revert or clean unrelated edits.
- The panel prefers `state.worldGrid`; the fallback endpoint is read-only but still follows the existing Founders Plot session/bootstrap behavior.
- The World Grid panel is intentionally advisory. HQ10B civic proposal creation and any Generated Universe overlay work remain future slices.
