# Agent Town Living Town Three.js Inhabitants Implementation - 2026-05-28

## Branch

- Base: `neo/agent-town-long-branch-bugfixes-2026-05-27`
- Working branch: `neo/founders-plot-living-town-threejs-inhabitants-2026-05-28`
- Commit: pending at report creation

## Summary

Implemented a focused Founders Plot Living Town slice on the bridge branch:

- Reused the existing Three.js dependency/build pattern from the V6 branch without merging V6 civic/world-grid mechanics.
- Added a Three.js Founders Plot stage to the current `/founders-plot` page while preserving the existing DOM controls, accessibility labels, tile test hooks, panels, palette, and drawer.
- Bound the scene to server-authoritative `state.visualActors`.
- Rendered visual-only inhabitants for Clover, builder, worker, hauler, and messenger-capable attention actors.
- Added non-mutating actor picking: selecting an inhabitant focuses the source building, Foreman/approval area, quest area, or other action target without calling any mutation endpoint.
- Added stable test hooks through `window.__foundersPlotTest` and hidden DOM actor mirrors.

## Key Files Changed

- `package.json`, `package-lock.json`
  - Added `three`.
  - Added `npm run build:founders-plot-threejs`.
- `scripts/build_founders_plot_threejs_bundle.mjs`
  - Bundles the Founders Plot Three.js renderer.
- `public/experiences/founders-plot/index.html`
  - Adds the Three.js viewport and actor hook container.
  - Loads `scene_state.js`, generated `three_scene_bundle.js`, and the existing controller.
- `public/experiences/founders-plot/founders-plot.js`
  - Normalizes `visualActors`.
  - Builds scene state from server state.
  - Exposes `window.__foundersPlotTest`.
  - Handles scene picks without server mutation.
- `public/experiences/founders-plot/founders-plot.css`
  - Makes the Three.js stage the primary visual surface while keeping the DOM grid as a quiet interactive/test layer.
- `public/experiences/founders-plot/scene_state.js`
  - Pure adapter from Founders Plot state to scene objects and actor projections.
- `public/experiences/founders-plot/three_scene_entry.js`
  - Three.js renderer, picking, canvas info, and visual actor rendering.
- `public/experiences/founders-plot/three_scene_bundle.js`
  - Generated renderer bundle.
- `public/experiences/founders-plot/assets/**`
  - Reconciled the minimal Founders Plot scenes, building sprites, Clover sprites, and lot sprites from the Three.js branch.
  - Large V6 asset manifests and unused alternate Clover sprite folders were left out of this slice.
- `tests-founders-plot/fp-scene-state.test.js`
  - Unit coverage for visual actor scene projection.
- `e2e/214_founders_plot_threejs_playable_slice.spec.js`
  - Playwright coverage for Clover, builder, worker, hauler, non-mutating actor pick, and canvas rendering.

## Demo Steps

1. Run `npm run build:founders-plot-threejs`.
2. Run `npm run dev`.
3. Open `http://localhost:4174/founders-plot` or the configured dev-server port.
4. Place a Lumber Camp on an open pad.
5. Watch the builder actor appear from the construction `visualActor`.
6. Advance/wait for construction, queue production, and watch the worker actor appear.
7. Advance/wait for output readiness and watch the hauler actor appear.
8. Click actors in the scene; the UI focuses the source object or attention target without mutating server state.

## Validation Run

- `npm run build:founders-plot-threejs`
  - Pass
- `npm run test:founders-plot`
  - Pass: 37/37
- `PW_PORT=4175 npx playwright test e2e/214_founders_plot_threejs_playable_slice.spec.js`
  - Pass: 1/1
- `PW_PORT=4176 npx playwright test e2e/200_founders_plot.spec.js`
  - Pass: 9/9
- `node --check public/experiences/founders-plot/founders-plot.js`
  - Pass
- `node --check public/experiences/founders-plot/scene_state.js`
  - Pass
- `node --check public/experiences/founders-plot/three_scene_entry.js`
  - Pass
- `node --check e2e/214_founders_plot_threejs_playable_slice.spec.js`
  - Pass
- `node --check tests-founders-plot/fp-scene-state.test.js`
  - Pass
- `git diff --check`
  - Pass

## Screenshots And Artifacts

- No screenshot artifact was generated in this implementation pass.
- Playwright failure artifacts were not retained because the final targeted runs passed.

## Known Risks

- The renderer uses simple generated marker sprites for builder, worker, hauler, and messenger roles. Clover and buildings use reconciled image assets, but bespoke inhabitant art can be layered later without changing server semantics.
- The current DOM grid remains as a quiet overlay to preserve existing controls and tests. Future cleanup can make the Living Town V2 interface denser and less duplicated, but this slice keeps the tested bridge UI intact.
- `stateHash` can change from time-derived actor progress even when no mutation occurs, so the non-mutating pick test asserts event-count stability instead.

## Boundaries Kept

- No new server mutation tools.
- No autonomous inhabitant simulation.
- No new economy.
- No V6 civic mechanics, Mirofish, Generated Universe gameplay rules, or public multi-user inhabitants.
- Server state remains authoritative; Three.js remains rendering, animation, picking, and feedback only.
