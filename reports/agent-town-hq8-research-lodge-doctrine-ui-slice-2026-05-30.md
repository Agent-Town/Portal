# Agent Town HQ8 Research Lodge Doctrine UI Slice

Date: 2026-05-30
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Worktree: `/Users/robin/Projects/Portal-atlas-editor`

## Summary

Implemented the smallest player-facing Founders Plot UI surface for the already server-owned HQ8 Research Lodge doctrine truth.

The new panel reads `research`, `doctrineCatalog`, and `doctrineState` from `/api/founders-plot/state`, shows locked/available/selected doctrine state, and lets a human select `survey_discipline` through the existing `/api/founders-plot/select-doctrine` route. After selection, the UI reloads state and displays the exact bounded effect: Expedition Board `SCOUT` duration is reduced by 5%. It explicitly does not claim changes to costs, outputs, inventory, settlement, or cross-plot rules.

## Changed Files

- `public/experiences/founders-plot/index.html`
  - Added a compact `Research Lodge` panel with `fp-doctrine-body`.
- `public/experiences/founders-plot/founders-plot.js`
  - Added `selectDoctrine` API wiring.
  - Normalized `research`, `doctrineCatalog`, and `doctrineState` into the client bundle.
  - Added doctrine rendering for locked/available/selected states.
  - Added `Select Doctrine` action for `survey_discipline` with `plotId`, `doctrineId`, `actor: "HUMAN"`, and a fresh idempotency key.
- `public/experiences/founders-plot/founders-plot.css`
  - Added doctrine card styling consistent with existing Scout Report/Site Plan/Settlement Claim cards.
- `e2e/200_founders_plot.spec.js`
  - Added focused Playwright route-stub coverage for locked, available, pending, payload, and selected-effect UI.
  - Included `et.plot.select_doctrine` in the current tools smoke expectation.
- `reports/agent-town-hq8-research-lodge-doctrine-ui-slice-2026-05-30.md`
  - This report.

## Boundaries Preserved

- No server gameplay changes were made.
- No new routes, tools, or Atlas executable actions were added.
- Atlas action refs remain non-executable metadata.
- No physical Research Lodge building, broad research tree, stacked doctrines, cohorts, work orders, world-grid mechanics, generated-lore rule changes, settlement changes, route changes, inventory math, input/output changes, or cross-plot effects were added.
- The UI claims only the existing HQ8B effect: `survey_discipline` applies a 0.95 duration multiplier to Expedition Board `SCOUT` jobs.

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js` - passed
- `node --check e2e/200_founders_plot.spec.js` - passed
- `NODE_ENV=test node --test tests-founders-plot/fp-http.test.js` - 15/15 passing
- `npx playwright test e2e/200_founders_plot.spec.js --project=chromium` - 12/12 passing
- `git diff --check` - passed before report write; rerun after report write expected

## Follow-Up Gaps

- The panel is intentionally compact and text-first; no Research Lodge art/building treatment exists yet.
- Additional doctrines should stay engine-owned and receive dedicated server and UI coverage before exposure.
- A future clear/reselect doctrine UX can be added only after the server exposes that product rule explicitly.
