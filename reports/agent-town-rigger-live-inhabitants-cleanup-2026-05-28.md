# Agent Town Rigger Live Inhabitants Cleanup

Date: 2026-05-28
Branch: `neo/founders-plot-rigger-live-inhabitants-cleanup-2026-05-28`
Starting context: `neo/founders-plot-builder-proper-sprite-2026-05-28` at `9d0b65f`

## Summary

Cleaned the local Rigger Slate v2 plus live inhabitants/ways/encounters work into a reviewable branch without changing Founders Plot gameplay authority.

The invariant is preserved: inhabitants, ways, routes, and encounters are deterministic visual-only projections of Founders Plot server state, especially `state.visualActors`. This branch does not add fake simulation, new mutation tools, V6 civic mechanics, Mirofish gameplay, or Generated Universe gameplay truth.

## Commits

- `d39ba9e` - `Clean up Founders Plot live inhabitants slice`
- Report commit - adds this teammate handoff report after the implementation commit so the implementation SHA is stable.

## What Changed

- Added Rigger Slate AI-builder v2 as the active builder sprite sheet:
  - `rigger-slate-builder-v2.png`
  - `rigger-slate-builder-v2.source.png`
  - `rigger-slate-builder-v2.json`
  - `rigger-slate-builder-v2.prompt.md`
- Wired worker and hauler to the accepted authored sheets:
  - `kettle-37-worker-v1`
  - `oona-tallpack-hauler-v1`
- Added the no-hole Clover `v1_4_4/` reference/runtime set and pointed Clover rendering at `v1_4_4/clover-*.webp`.
- Kept messenger on the current tracked `messenger-agentfolk-v1` sheet.
- Added visual-only route metadata on scene actors:
  - `routeId`
  - `wayId`
  - `routeMode`
  - `routeProgress`
  - `routeTargetId`
- Added deterministic visual-only `ways` and `encounters` projections to `scene_state.js`.
- Rendered dirt-way tubes and encounter cues in the Three.js stage.
- Exposed ways, encounters, rendered ways, rendered encounters, and actor route metadata through `getThreeSceneInfo`.
- Preserved hidden DOM actor hooks and added route metadata there for deterministic e2e access.
- Rebuilt `three_scene_bundle.js`.
- Updated Founders Plot scene/unit and Playwright assertions for Rigger v2, Kettle, Oona, Clover `v1_4_4`, ways, routes, and encounters.

## Files Changed

Scene/runtime:

- `public/experiences/founders-plot/scene_state.js`
- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `public/experiences/founders-plot/founders-plot.js`

Tests:

- `tests-founders-plot/fp-scene-state.test.js`
- `e2e/214_founders_plot_threejs_playable_slice.spec.js`

Assets:

- `public/experiences/founders-plot/assets/characters/README.md`
- `public/experiences/founders-plot/assets/characters/v1_4_4/`
- `public/experiences/founders-plot/assets/characters/inhabitants/builder/rigger-slate-builder-v2.*`
- `public/experiences/founders-plot/assets/characters/inhabitants/worker/kettle-37-worker-v1.*`
- `public/experiences/founders-plot/assets/characters/inhabitants/hauler/oona-tallpack-hauler-v1.*`

Reports and proof artifacts:

- `reports/agent-town-rigger-slate-ai-agent-builder-v2-2026-05-28.md`
- `reports/rigger-slate-builder-v2-checker-preview.png`
- `reports/founders-plot-live-inhabitants-*.png`
- `reports/founders-plot-live-inhabitants-screenshot-proof-2026-05-28.json`
- `reports/founders-plot-ways-encounters-*.png`
- `reports/founders-plot-ways-encounters-proof-2026-05-28.json`

## Local Files Left Unstaged

These were identified as unrelated local workspace noise or not part of this cleanup slice and were not deleted:

- `.openclaw/`
- `HEARTBEAT.md`
- `IDENTITY.md`
- `SOUL.md`
- `TOOLS.md`
- `USER.md`
- `docs/design/agent-town-design-pack.zip`
- `docs/specs/agent-town-founders-plot-living-town-roadmap.md`
- `public/experiences/founders-plot/assets/characters/inhabitants/builder/mara-boltwick-builder-v1.*`
- `public/experiences/founders-plot/assets/characters/inhabitants/messenger/vell-quill-messenger-v1.prompt.md`
- `reports/agent-town-living-inhabitants-design-lineage-2026-05-27.md`
- `tmp/`

## Validation

Requested focused validation passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check public/experiences/founders-plot/scene_state.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `node --check tests-founders-plot/fp-scene-state.test.js`
- `node --check e2e/214_founders_plot_threejs_playable_slice.spec.js`
- JSON parse checks for Rigger, Kettle, and Oona metadata
- ImageMagick alpha/dimension checks:
  - `rigger-slate-builder-v2.png 2048x2048 srgba 4.0 alpha=0..1`
  - `kettle-37-worker-v1.png 2048x2048 srgba 4.0 alpha=0..1`
  - `oona-tallpack-hauler-v1.png 2048x2048 srgba 4.0 alpha=0..1`
- `npm run build:founders-plot-threejs`
- `npm run test:founders-plot` - 38/38 passed
- `PW_PORT=4200 npx playwright test e2e/214_founders_plot_threejs_playable_slice.spec.js` - 1/1 passed
- `PW_PORT=4201 npx playwright test e2e/200_founders_plot.spec.js` - 9/9 passed
- `git diff --check`
- `git diff --cached --check`

No requested focused validation was skipped. Full `npm test` was not run because the requested scope was Founders Plot-focused validation and this repo has known broader-suite churn from unrelated areas.

## Proof Artifacts

- Rigger v2 checker preview: `reports/rigger-slate-builder-v2-checker-preview.png`
- Live inhabitants browser proof JSON: `reports/founders-plot-live-inhabitants-screenshot-proof-2026-05-28.json`
- Live inhabitants scene montage: `reports/founders-plot-live-inhabitants-scene-montage-2026-05-28.png`
- Ways/encounters proof JSON: `reports/founders-plot-ways-encounters-proof-2026-05-28.json`
- Ways/encounters montage: `reports/founders-plot-ways-encounters-montage-2026-05-28.png`

The proof JSON confirms Three.js rendering, no sprite fallback for Rigger/Kettle/Oona/messenger, and visual-only route/way/encounter metadata.

## Known Caveats

- Rigger v2 still has faint purple/magenta edge pixels from chroma-key removal.
- Rigger v2 source was generated at 1254x1254 and normalized locally to 2048x2048 before alpha removal.
- Messenger remains on the current tracked `messenger-agentfolk-v1` sheet. The untracked `vell-quill-messenger-v1.prompt.md` was left out because it is only a prompt fragment and not a coherent accepted messenger asset set.
- The ways and encounters are deliberately cosmetic: they are not pathfinding, scheduling, simulation, or authority-bearing game state.

## Next PR Recommendation

Open this branch as the cleanup PR for the current Rigger Slate v2 plus live inhabitants/ways/encounters slice. Use `neo/founders-plot-builder-proper-sprite-2026-05-28` or the current sprite-lane review branch as the compare base, depending on where Robin wants the art-review stack to land.

Review focus:

- Confirm Rigger Slate v2 reads as adult AI-builder machinefolk in the live scene.
- Confirm Kettle and Oona remain the accepted worker/hauler sheets.
- Confirm Clover uses `v1_4_4` without alpha-hole artifacts.
- Confirm ways/routes/encounters improve legibility without implying gameplay authority.
