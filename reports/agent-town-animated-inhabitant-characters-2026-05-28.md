# Agent Town Founders Plot Animated Inhabitant Characters

Date: 2026-05-28
Branch: `neo/founders-plot-animated-inhabitant-characters-2026-05-28`
Base: `neo/founders-plot-inhabitants-action-feel-v2-2026-05-28` at `efc925b`

## Summary

Turned the compact role/cue inhabitants into procedural Three.js character sprites while preserving the existing server-authoritative `state.visualActors` projection model. The inhabitants are still visual-only: no hidden simulation, no new economy, no new mutation tools, no V6 civic mechanics, and no Generated Universe gameplay.

## What Changed

- Replaced the letter-marker role textures with code-native canvas character textures:
  - `builder`: squat hardhat worker with hammer.
  - `worker`: apron/tool character.
  - `hauler`: backpack/bundle carrier.
  - `messenger`: satchel/flag attention runner.
- Kept Clover on the existing authored sprite assets.
- Added deterministic `actionAnimation` metadata to scene actor projections:
  - `work_swing`
  - `busy_work`
  - `carry_wobble`
  - `attention_wave`
  - `clover_watch`
- Updated the Three.js render loop to use the metadata for visual-only motion:
  - idle bob on actors
  - builder work swing
  - worker busy jitter
  - hauler carry wobble/waddle
  - messenger attention bounce/wave
  - reduced-motion users get static actor positions
- Preserved action cue sprites and progress bars as secondary readable affordances.
- Preserved actor picking behavior: clicking visual-only inhabitants still dispatches scene-pick metadata and focuses the source object/drawer without mutating server state.
- Regenerated `public/experiences/founders-plot/three_scene_bundle.js`.

## Files Touched

- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/scene_state.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `tests-founders-plot/fp-scene-state.test.js`
- `e2e/214_founders_plot_threejs_playable_slice.spec.js`
- `reports/founders-plot-animated-inhabitant-characters-2026-05-28.png`

## Play Steps

1. Open `/founders-plot`.
2. Confirm Clover and the initial messenger are visible in the Three.js stage.
3. Place a Lumber Camp to see the builder hardhat character and construction cue.
4. Advance/finish construction, queue production, and confirm the worker apron/tool character appears.
5. Advance/finish production and confirm the hauler appears with carry/bundle behavior.
6. Click builder/hauler/messenger in the canvas and confirm no new audit event is written.

## Validation

- `npm run build:founders-plot-threejs`
- `npm run test:founders-plot` - 38/38 passed
- `PW_PORT=4186 npx playwright test e2e/214_founders_plot_threejs_playable_slice.spec.js` - 1/1 passed
- `PW_PORT=4187 npx playwright test e2e/200_founders_plot.spec.js` - 9/9 passed
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/scene_state.js`
- `node --check e2e/214_founders_plot_threejs_playable_slice.spec.js`
- `node --check tests-founders-plot/fp-scene-state.test.js`
- Screenshot artifact: `reports/founders-plot-animated-inhabitant-characters-2026-05-28.png`

## Known Risks / Next Pass

- The sprites are intentionally procedural and small; they read much better than role badges, but final art direction could still use authored sprite sheets or generated bitmap variants later.
- Limb motion is currently whole-sprite/secondary-cue motion, not true frame-by-frame skeletal animation.
- The current screenshot captures the ready-output state with Clover, messenger, and hauler. Builder/worker behavior is covered by tests and during the play flow, but a future visual QA pass could capture one contact sheet per actor state.
