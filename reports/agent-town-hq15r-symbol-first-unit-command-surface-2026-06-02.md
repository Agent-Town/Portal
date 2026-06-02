# AgentTown HQ15R - Symbol-First Unit Command Surface

Date: 2026-06-02

## Result

PASS. The Expedition Map unit roster and selected-unit command bar are now materially less text-heavy while preserving the existing command behavior, test IDs, server routes, and guarded payload paths.

## Changes

- Converted the unit roster from wide text cards into a compact sprite/icon rail.
- Kept full unit names, cell ids, and command context in `aria-label`, `title`, and data attributes while primary visible text now uses role/location badges such as `SCT`, `SVY`, `Q1 R0`, and ready-count chips.
- Shortened command buttons to symbol/verb labels: `Move`, `Scout`, `Convoy`, `Found`.
- Replaced visible `Target cell_*`, `Move cell_*`, `move target(s)`, and `server movement active` prose with compact target/count/authority chips such as `◎ HINT`, `↦ DISC`, `2 ↦`, and `SRV`.
- Updated focused `FP-E2E-022` assertions to prove the same Move, Scout Sector, Prepare Convoy, and Found Outpost paths still hit their existing guarded endpoints and preserve target IDs in attributes.
- Raised the focused test's in-test timeout from 60s to 90s because the existing `FP-E2E-022` proof path writes many screenshots and was timing out in the legacy event-packet tail after the command-path assertions.

## Guardrails

- No server routes, payload shapes, command IDs, mutation authority, unit read model, renderer target rings, assets, or hidden-truth rules were changed.
- Scout Sector still posts through the existing `/api/founders-plot/expedition-map/scout-sector` route.
- Scout Move still posts through the existing `/api/founders-plot/expedition-map/move-unit` route.
- Surveyor Prepare Convoy and Settler Found Outpost still use the existing guarded endpoints.
- Command target ids remain available via `data-cell-id`, `data-plan-id`, `data-claim-id`, `aria-label`, and `title`, not primary visible text.

## Verification

- PASS: `node --check public/experiences/founders-plot/founders-plot.js e2e/200_founders_plot.spec.js`
- PASS: `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --reporter=line` (1 passed, 1.2m)
- PASS: HQ15R screenshots exist:
  - `reports/agent-town-hq15r-symbol-first-unit-command-surface-desktop-2026-06-02.png` (`1232 x 625`)
  - `reports/agent-town-hq15r-symbol-first-unit-command-surface-mobile-2026-06-02.png` (`366 x 757`)
- PASS: `jq empty reports/agent-town-hq15r-symbol-first-unit-command-surface-proof-2026-06-02.json`
- PASS: `git diff --check`

## Files Changed

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`
- `reports/agent-town-hq15r-symbol-first-unit-command-surface-2026-06-02.md`
- `reports/agent-town-hq15r-symbol-first-unit-command-surface-proof-2026-06-02.json`
- `reports/agent-town-hq15r-symbol-first-unit-command-surface-desktop-2026-06-02.png`
- `reports/agent-town-hq15r-symbol-first-unit-command-surface-mobile-2026-06-02.png`
