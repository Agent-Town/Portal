# AgentTown HQ9 Work Order UI Slice

Date: 2026-05-31
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Summary

Implemented the bounded HQ9 Work Orders UI in Founders Plot. The panel reads the server-owned `cohortPlanner`, `workOrderTemplates`, and `workOrders` read model, shows the `collect_ready_outputs_once` template, and lets a human explicitly create and execute one DRAFT work order through the existing endpoints.

## Implemented

- Added a Founders Plot `Work Orders` side-panel.
- Shows server-read-model locked state before prerequisites are met.
- Shows `collect_ready_outputs_once` template details:
  - allowed action: `et.plot.collect_outputs`
  - max child actions: 2
  - spend cap: 0
  - runtime cap: 2m
  - current-plot-only scope
  - 24h draft expiry copy
  - explicit boundary copy: no scheduler, spending, placement, scouting, founding, or Atlas mutation
- Added human-only `Create Draft` action calling `/api/founders-plot/work-orders/draft`.
- Added human-only `Execute Work Order` action calling `/api/founders-plot/work-orders/execute`.
- Shows pending button states for draft and execute.
- Shows DRAFT, COMPLETED, FAILED, and expired draft states from the read model.
- Uses existing cohort work-order dossier art:
  - `public/experiences/founders-plot/assets/objects/cohort-work-order-dossier.webp`

## Changed Files

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `public/experiences/founders-plot/index.html`
- `e2e/200_founders_plot.spec.js`
- `reports/agent-town-hq9-work-order-ui-proof-2026-05-31.png`
- `reports/agent-town-hq9-work-order-ui-slice-2026-05-31.md`

## Proof

- Work Orders UI screenshot: `reports/agent-town-hq9-work-order-ui-proof-2026-05-31.png`

The proof screenshot shows the available template, `Create Draft`, completed receipt state, executable DRAFT, FAILED, and expired draft state.

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-http.test.js` - 18/18
- `PW_PORT=4213 npx playwright test e2e/200_founders_plot.spec.js --grep "FP-E2E-013" --project=chromium` - 1/1
- `PW_PORT=4213 npx playwright test e2e/200_founders_plot.spec.js --project=chromium` - 13/13
- `git diff --check`

## Boundary

No gameplay authority changed. This is a UI-only slice over already implemented HQ9A/HQ9B server truth. It does not add a scheduler, background execution, arbitrary tool runner, spending, placement, HQ upgrades, doctrine selection, scouting, settlement founding, cross-plot mutation, or Atlas-owned mutation.
