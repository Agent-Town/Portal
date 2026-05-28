# Agent Town Founders Plot - Inhabitants Action-Feel V2

Date: 2026-05-28
Branch: `neo/founders-plot-inhabitants-action-feel-v2-2026-05-28`

## Summary

This slice makes the existing Founders Plot inhabitants read more like useful town activity while keeping them deterministic, visual-only projections of server state.

The server still owns the plot loop. No new economy, civic mechanics, generated-universe gameplay, autonomous simulation, or mutation tools were added.

## Changed Files

- `server/founders_plot/engine.js`
  - Added a small visual projection field, `visualActors[].actionKind`, so the client can distinguish `CONSTRUCT`, `UPGRADE`, `PRODUCE`, `SELL`, `OUTPUT_READY`, `QUEST`, `REWARD`, `APPROVAL`, and Clover's `OBSERVE` state without guessing.
- `public/experiences/founders-plot/scene_state.js`
  - Added deterministic `actionCue` metadata for each visual actor.
  - Builder cues now expose construction/upgrade progress and hammer/wrench accessories.
  - Worker cues expose production/sell work and tools/coin accessories.
  - Hauler cues expose output-ready carry bundles.
  - Messenger cues expose attention markers for quest/reward/approval sources.
- `public/experiences/founders-plot/three_scene_entry.js`
  - Renders small canvas-generated cue sprites beside inhabitants.
  - Renders progress bars for active builder/worker jobs based on server progress.
  - Uses deterministic actor animation phase and respects `prefers-reduced-motion`.
  - Exposes `actionCues` and cue details through the existing Three.js test info.
- `public/experiences/founders-plot/three_scene_bundle.js`
  - Rebuilt from `three_scene_entry.js`.
- `public/experiences/founders-plot/founders-plot.js`
  - Preserves hidden accessibility/test actor hooks and adds cue/action data attributes.
- `tests-founders-plot/fp-scene-state.test.js`
  - Added pure projection coverage for builder, worker, hauler, and messenger action cues.
- `tests-founders-plot/fp-unit.test.js`
  - Covers the new deterministic `actionKind` projection on active construction.
- `e2e/214_founders_plot_threejs_playable_slice.spec.js`
  - Verifies role cue data in the live Three.js scene.
  - Verifies builder and messenger canvas picking remains non-mutating.
  - Captures a Playwright screenshot attachment during the focused slice test.

## Behavior

- Builder actors now read as construction/upgrade workers via hammer/wrench cue badges plus a progress bar tied to server job progress.
- Worker actors now read as production/sell activity via tools/coin cue badges plus a progress bar tied to server job progress.
- Hauler actors now read as output-ready carriers via a bundle cue.
- Messenger actors now read as quest/reward/approval attention markers.
- Clover remains present and visual-only.
- Actor picking remains non-mutating:
  - Builder/worker/hauler actors select their source building.
  - Clover focuses the Foreman panel.
  - Messenger actors route to quest/reward/approval UI as appropriate.

## Validation

Passed:

- `npm run build:founders-plot-threejs`
- `npm run test:founders-plot` - 38/38
- `PW_PORT=4184 npx playwright test e2e/214_founders_plot_threejs_playable_slice.spec.js` - 1/1
- `PW_PORT=4185 npx playwright test e2e/200_founders_plot.spec.js` - 9/9
- `node --check public/experiences/founders-plot/scene_state.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check server/founders_plot/engine.js`
- `node --check e2e/214_founders_plot_threejs_playable_slice.spec.js`
- `node --check tests-founders-plot/fp-scene-state.test.js`
- `node --check tests-founders-plot/fp-unit.test.js`
- `git diff --check`

Screenshot artifact:

- `/Users/robin/Projects/Portal/reports/founders-plot-inhabitants-action-feel-v2-screenshot.png`

## Play Steps

1. Open `/founders-plot`.
2. Place a Lumber Camp on an open pad.
3. Watch the builder appear at the camp with construction cue and progress.
4. Advance/wait until construction completes.
5. Queue production from the Lumber Camp.
6. Watch the worker show production cue and progress.
7. Advance/wait until output is ready.
8. Watch the hauler show the bundle cue, then collect output.
9. Click actors in the Three.js scene to confirm selection/focus changes without changing server event count.

## Known Risks

- The inhabitants are still generated from compact role textures and canvas cue badges, not final character art.
- The background composition is inherited from the existing Three.js slice; this change improves actor readability but does not redesign the stage framing.
- The new `actionKind` field is additive on `visualActors`; existing tests cover determinism and non-mutating boundaries, but downstream consumers should treat unknown future values defensively.
