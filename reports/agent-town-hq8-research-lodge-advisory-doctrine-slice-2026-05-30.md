# Agent Town HQ8A Research Lodge Advisory Doctrine Slice

Date: 2026-05-30
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Worktree: `/Users/robin/Projects/Portal-atlas-editor`

## Summary

Implemented the bounded HQ8A slice: a server-owned Research Lodge advisory doctrine stance.

This slice intentionally does not add a physical `RESEARCH_LODGE` building or any gameplay buff. The current canonical HQ ladder tops out at HQ6, and the verified HQ7 slice is a second-plot/outpost boundary rather than a real HQ7/HQ8 upgrade chain. Adding building art, pad pressure, construction costs, and HQ8 upgrade rules would make this slice too large. Instead, HQ8A is implemented as a server-owned research read model gated by existing canonical state: HQ6 plus at least one founded outpost.

The first doctrine is `survey_discipline`, defined in the engine catalog as advisory-only. Selecting it persists doctrine state, emits a `DOCTRINE_SELECTED` receipt event, exposes state in `/api/founders-plot/state`, and adds Progression Atlas canonical Research Lodge/doctrine nodes. It does not change inventory, production, scout duration, construction, settlement, route, cohort, or cross-plot math.

## Changed Files

- `server/founders_plot/engine.js`
  - Added `DOCTRINE_CATALOG` with `survey_discipline`.
  - Added persisted doctrine normalization/read model.
  - Added `selectDoctrine` mutation with idempotency, gating, human/agent approval boundary, and receipt event.
  - Exposed `research`, `doctrineCatalog`, and `doctrineState` in state.
- `server/founders_plot/store.js`
  - Added `doctrine_state_json` to `founder_plots`.
  - Added lightweight migration, hydrate, and dehydrate support.
- `server/founders_plot/routes.js`
  - Added `POST /api/founders-plot/select-doctrine`.
- `server/founders_plot/tools.js`
  - Added `et.plot.select_doctrine` tool spec.
- `server/founders_plot/progression_atlas.js`
  - Added canonical Research Lodge and doctrine nodes.
  - Added non-executable Atlas action ref for `et.plot.select_doctrine`.
  - Included doctrine state in gameplay snapshot and summary.
- `tests-founders-plot/fp-unit.test.js`
  - Added HQ8A gating, unknown doctrine rejection, idempotency, advisory/no-inventory-math, and agent approval tests.
- `tests-founders-plot/fp-http.test.js`
  - Added route/state/Atlas coverage for advisory doctrine selection.
- `tests-founders-plot/fp-contract.test.js`
  - Added tool schema coverage for `et.plot.select_doctrine`.
- `public/experiences/founders-plot/tools.md`
  - Documented `et.plot.select_doctrine`.
- `public/experiences/founders-plot/skill.md`
  - Documented the Research Lodge authority boundary for agent callers.
- `public/skill.md`
  - Added the HQ8A advisory doctrine rule to the Progression Atlas authority notes.

## Authority Boundaries

- Canonical doctrine truth lives in `server/founders_plot/engine.js` and persisted store state.
- The Progression Atlas only exposes advisory canonical nodes and non-executable action refs.
- Editor-created JSON cannot create, rename, stack, or buff doctrines.
- `survey_discipline` has `effectKind: advisory_only`, `gameplayBuff: false`, and empty `cost`.
- Human callers may select the doctrine directly once unlocked.
- Agent callers must have a matching human approval for `select_doctrine`.
- Doctrine selection is replaceable/reversible by explicit server rule because HQ8A is advisory-only.
- No production math, resource spending, scout duration, construction timing, settlement, route, work-order, cohort, world-grid, or cross-plot effect was added.

## Tests Run

- `node --check server/founders_plot/store.js`
- `node --check server/founders_plot/engine.js`
- `node --check server/founders_plot/routes.js`
- `node --check server/founders_plot/tools.js`
- `node --check server/founders_plot/progression_atlas.js`
- `node --check tests-founders-plot/fp-unit.test.js && node --check tests-founders-plot/fp-http.test.js && node --check tests-founders-plot/fp-contract.test.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js` — 24/24 passing
- `NODE_ENV=test node --test tests-founders-plot/fp-contract.test.js` — 11/11 passing
- `NODE_ENV=test node --test tests-founders-plot/fp-http.test.js` — 15/15 passing
- `git diff --check` — clean

Playwright was not run because this slice did not change browser UI behavior.

## Follow-Up Gaps

- HQ8B can promote the first tiny engine-owned doctrine effect, but should be a separate slice with explicit math tests.
- A physical Research Lodge building should wait until the HQ7/HQ8 upgrade/building ladder, art, pad pressure, and construction cost model are deliberately introduced.
- UI affordance for selecting doctrine is not included here; the route/tool/read model are ready for a small UI lane.
- Additional doctrine catalog entries should remain engine-owned and test-backed, not editor-authored gameplay.
