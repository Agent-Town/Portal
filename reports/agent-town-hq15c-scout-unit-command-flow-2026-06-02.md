# Agent Town HQ15C Scout Unit Command Flow

Date: 2026-06-02

## Result

Implemented the selected Scout-unit command flow as the primary Scout Sector invocation path.

- Selecting the scout in the Map units roster now keeps the scout selected and targets the eligible hinted sector from the existing `scout_sector` command hint.
- The selected unit command bar exposes the primary `Scout Sector` button with `data-unit-id`, `data-cell-id`, `data-command-id`, and the existing idempotency key.
- The command posts through the existing `POST /api/founders-plot/expedition-map/scout-sector` route only. The Playwright route assertion verifies no `unitId`, `targetCellId`, or movement payload is sent.
- Movement remains read-only/preview-only: unit tokens keep `data-movement-mutation="false"`, the command bar shows `Move locked`, and the movement boundary remains `movement pending server slice`.
- The older sector-level Scout Sector row remains visible only as an alias and is marked non-primary copy.

## Files

- `public/experiences/founders-plot/founders-plot.js`
- `e2e/200_founders_plot.spec.js`
- `reports/agent-town-hq15c-scout-unit-command-flow-desktop-2026-06-02.png`
- `reports/agent-town-hq15c-scout-unit-command-flow-mobile-2026-06-02.png`
- `reports/agent-town-hq15c-scout-unit-command-flow-proof-2026-06-02.json`

## Verification

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022"`
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js -g "FP-E2E-023"`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js`
- `git diff --check`
- `jq empty reports/agent-town-hq15c-scout-unit-command-flow-proof-2026-06-02.json`

All checks passed.
