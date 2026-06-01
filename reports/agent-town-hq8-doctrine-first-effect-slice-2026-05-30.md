# Agent Town HQ8B Doctrine First Effect Slice

Date: 2026-05-30
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Worktree: `/Users/robin/Projects/Portal-atlas-editor`

## Summary

Promoted `survey_discipline` from the HQ8A advisory doctrine stance into the first tiny engine-owned doctrine effect.

When `survey_discipline` is selected through the existing server-owned `et.plot.select_doctrine` path, Expedition Board `SCOUT` jobs now complete slightly faster. This is implemented in `server/founders_plot/engine.js` at the SCOUT job-spec/queueing boundary, so the gameplay truth stays server-owned, deterministic, idempotent, and reversible by selecting/replacing doctrine state through the existing doctrine rules.

No physical Research Lodge building, Research Lodge art, multi-slot doctrine system, general research system, resource payout, inventory math, settlement math, route mechanic, cohort mechanic, world-grid mechanic, or arbitrary editor execution was added.

## Changed Files

- `server/founders_plot/engine.js`
  - Changed `survey_discipline` catalog metadata from advisory-only to one engine-owned `scout_duration_modifier`.
  - Added the deterministic doctrine effect formula and helper that applies it only to Expedition Board `SCOUT` specs.
  - Applied the effective SCOUT duration in `queueJob()` while preserving input/output/cost behavior.
  - Updated Research Lodge read model wording/status and active effect exposure.
- `server/founders_plot/progression_atlas.js`
  - Atlas production nodes now show `baseDurationMs`, effective `durationMs`, and selected doctrine effect metadata.
  - Doctrine nodes now describe an engine-owned effect and link selected `survey_discipline` to `production.EXPEDITION_BOARD.SCOUT`.
  - Atlas action refs remain non-executable metadata.
- `server/founders_plot/tools.js`
  - Updated `et.plot.select_doctrine` description to document the narrow SCOUT duration effect.
- `public/skill.md`
- `public/experiences/founders-plot/skill.md`
- `public/experiences/founders-plot/tools.md`
  - Updated agent/tool guidance so future workers know this is one bounded server-owned effect, not general research freedom.
- `tests-founders-plot/fp-unit.test.js`
  - Added focused coverage for locked effect before doctrine selection, exact 5% SCOUT duration reduction after selection, unchanged inputs/outputs/inventory/settlement state, and idempotency.
- `tests-founders-plot/fp-http.test.js`
  - Updated doctrine/Atlas assertions and added editor-created strategy JSON hardening checks for invented doctrine effects.
- `tests-founders-plot/fp-contract.test.js`
  - Renamed the doctrine contract test to HQ8B.
- `reports/agent-town-hq8-doctrine-first-effect-slice-2026-05-30.md`
  - This handoff report.

## Exact Effect Formula

Only when the selected doctrine is `survey_discipline` and the queued job is:

- `buildingType: "EXPEDITION_BOARD"`
- `jobKind: "SCOUT"`

The engine computes:

```text
effectiveDurationMs = max(1, round(baseDurationMs * 0.95))
```

For the current Expedition Board SCOUT spec:

```text
baseDurationMs = 90000
effectiveDurationMs = round(90000 * 0.95) = 85500
```

Inputs stay `{ food: 6, wood: 4 }`. Output stays `{ scout_report: 1 }`.

## Boundaries Preserved

- Doctrine catalog and effect truth remain in `server/founders_plot/engine.js`.
- Doctrine selection still uses `et.plot.select_doctrine` and the existing route/tool/idempotency/agent-approval path.
- Atlas action refs stay `executableByAtlas: false`.
- Strategy Editor JSON cannot invent doctrine effects; malicious `doctrineEffect`, `effects`, `gameplayBuff`, and `engineOwnedEffect` fields are dropped from saved edited strategy steps.
- No inventory, resource, storage, construction, settlement, route, cohort, world-grid, cross-plot, or public projection mechanics were added.
- No physical Research Lodge building or UI lane was added.
- Playwright was not run because this slice changes server/read-model/docs/tests only, not browser UI behavior.

## Validation Results

- `node --check server/founders_plot/engine.js` - passed
- `node --check server/founders_plot/progression_atlas.js` - passed
- `node --check server/founders_plot/tools.js` - passed
- `node --check tests-founders-plot/fp-unit.test.js` - passed
- `node --check tests-founders-plot/fp-http.test.js` - passed
- `node --check tests-founders-plot/fp-contract.test.js` - passed
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js` - 25/25 passing
- `NODE_ENV=test node --test tests-founders-plot/fp-contract.test.js` - 11/11 passing
- `NODE_ENV=test node --test tests-founders-plot/fp-http.test.js` - 15/15 passing
- `git diff --check` - clean

## Follow-Up Gaps

- A visible doctrine selection UI remains a separate lane; this slice only promotes engine truth and read-model metadata.
- A physical Research Lodge building/art/UI should wait for a deliberate construction/art/pad-pressure slice.
- Additional doctrines should remain engine-owned and individually test-backed; do not let the editor define effects.
- A future clear-doctrine action can be added if product wants explicit clearing rather than replacement semantics.
