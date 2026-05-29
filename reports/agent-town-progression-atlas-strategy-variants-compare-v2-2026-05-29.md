# Agent Town Progression Atlas Strategy Variants + Compare V2

Date: 2026-05-29
Branch: `neo/founders-plot-rigger-live-inhabitants-cleanup-2026-05-28`
Baseline: `e04a264` (`Add Founders Plot Progression Atlas`)
Mode: implementation patch only; no commit, push, cleanup, or unrelated-file edits.

## Summary

Implemented the bounded Strategy Variants + Compare V2 slice for Founders Plot Progression Atlas.

The Atlas now exposes three deterministic private strategy templates:

- `rush-hq3` / Rush HQ3
- `balanced-food-wood` / Balanced Food-Wood
- `delegate-outputs-first` / Delegate Outputs First

All three are advisory planning state only. They reference canonical progression nodes and `et.plot.*` action refs, but they do not execute gameplay, mutate resources, place buildings, collect outputs, queue jobs, or bypass approvals.

## Behavior

- `rush-hq3` remains the recommended default strategy.
- `balanced-food-wood` gives the same legal HQ3 route a steadier early-economy framing around wood and food readability.
- `delegate-outputs-first` adds an explicit HQ2 `collectOutputs` Foreman checkpoint before continuing toward HQ3 `queueProduction`.
- The Atlas API now returns `strategyTemplates` plus `strategyOptions` for all three strategies.
- Each strategy includes compact compare data:
  - goal
  - step count
  - focus tags
  - rough blockers
  - current-state resource shortfalls
  - permission checkpoints
  - tradeoff copy
  - approval/delegation burden
- The iframe UI now shows a Strategy Compare section with Draft buttons for each option.
- The selected/drafted strategy still renders in the existing research-map/tree and detail-card view.
- Saving/selecting strategies remains private planning state scoped to the current plot.

## Files Changed

- `server/founders_plot/progression_atlas.js`
  - Added server-side strategy template registry.
  - Added strategy builders for `balanced-food-wood` and `delegate-outputs-first`.
  - Added compare metadata and multi-template draft support.
  - Kept `gameplayStableHash` no-mutation contract.

- `public/progression-atlas.html`
  - Added visible strategy template draft controls.
  - Added Strategy Compare panel.

- `public/progression-atlas.js`
  - Added active strategy selection state.
  - Rendered compare cards and template controls.
  - Draft/save messages now use the selected strategy title.

- `public/progression-atlas.css`
  - Added compare-card, focus-tag, and active-template styles.

- `tests-founders-plot/fp-http.test.js`
  - Expanded Progression Atlas HTTP coverage to assert templates/options, compare metadata, private save/select behavior, explain-node coverage for `collectOutputs`, and no gameplay mutation.

- `e2e/114_progression_atlas_openclaw_lite.spec.js`
  - Extended visible modal coverage for compare cards and the added variant metadata.

## Verification

Passed:

- `node --check server/founders_plot/progression_atlas.js`
- `node --check public/progression-atlas.js`
- `node --check e2e/114_progression_atlas_openclaw_lite.spec.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `node --test tests-founders-plot/fp-http.test.js` — 10/10
- `npm run test:founders-plot` — 41/41
- `PW_PORT=4362 npx playwright test e2e/114_progression_atlas_openclaw_lite.spec.js` — 1/1

## Caveats

- Compare shortfalls are current-state blockers, not predictive simulation. This is intentional for V2.
- Balanced Food-Wood is mostly a strategy framing variant over the same legal path, not a fake economy simulation.
- Delegate Outputs First is the first variant with an extra strategic checkpoint because `collectOutputs` is a real HQ2 permission.
- OpenClaw Lite worker code was not changed; existing progression tools already pass `strategyKey` through to the server.
- No commit or push was performed.

## Parent Review Follow-Up

Parent review kept this patch but fixed one UI-state issue before final verification: when a non-Rush option was visible from the compare panel, Save could still fall back to Rush HQ3 unless the draft endpoint had already been called. The UI now initializes from the iframe `strategyKey`, keeps the active option aligned after Atlas state loads, and saves the visible active strategy.

The browser test now drafts `delegate-outputs-first`, verifies the `collectOutputs` checkpoint node, saves that strategy through the visible iframe UI, and asserts the selected saved strategy is `delegate-outputs-first` while `gameplayStableHash`, inventory, and event count remain stable.

Additional parent verification after that fix:

- `node --check public/progression-atlas.js`
- `node --check e2e/114_progression_atlas_openclaw_lite.spec.js`
- `node --check server/founders_plot/progression_atlas.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `node --test tests-founders-plot/fp-http.test.js` — 10/10
- `PW_PORT=4363 npx playwright test e2e/114_progression_atlas_openclaw_lite.spec.js` — 1/1
- `npm run test:founders-plot` — 41/41
- `PW_PORT=4364 npx playwright test e2e/108_experience_intent_open_modal.spec.js e2e/109_experience_intent_atlas_search.spec.js e2e/113_experience_intent_tool_registry.spec.js e2e/114_progression_atlas_openclaw_lite.spec.js e2e/200_founders_plot.spec.js e2e/214_founders_plot_threejs_playable_slice.spec.js` — 14/14
- `git diff --check`
