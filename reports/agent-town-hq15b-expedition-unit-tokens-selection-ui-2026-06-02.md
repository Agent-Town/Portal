# AgentTown HQ15B Expedition Unit Tokens Selection UI

Date: 2026-06-02

## Verdict

PASS - the Expedition Map now renders server-owned units as selectable map tokens and adds a compact read-only unit roster/command bar in the map surface.

## What changed

- Three.js Expedition Map renderer now consumes `expeditionMap.units.items`.
- Unit tokens render at their server-owned `location.cellId`, above the terrain/fog cells.
- Clicking a unit token selects the unit and its map cell via a dedicated `founders-plot-expedition-unit-select` event.
- The Founders Plot map UI renders a `Map units` roster with unit-type chips, selected unit state, command hints, and the movement boundary.
- The unit command bar shows existing server command hints such as `Scout Sector`, but movement stays pending/disabled.
- Existing sector selection and Scout Sector behavior remain intact.

## Authority Boundary

- Unit positions come from the server read model.
- Unit selection is local UI state only.
- No unit movement mutation was added.
- Scout Sector remains the only current Expedition Map mutation path.
- No autonomous movement, operator assignment, resource harvesting, routes, trade, economy, reward, combat, scheduler/background behavior, Atlas execution, public sharing, Generated Universe rendering, cross-plot mutation, external effects, deploy, merge, commit, or push.

## Files

- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`
- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`

## Verification

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --reporter=line`
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --reporter=line`
- `git diff --check`

Note: the first parallel `FP-E2E-023` attempt hit the existing `EADDRINUSE` web-server port race because another focused Playwright proof was already starting. It passed when rerun separately.

## Next Slice

HQ15C should turn the selected Scout token into the primary way to invoke Scout Sector:

- selecting the Scout should highlight eligible hinted target sectors;
- command bar should enable Scout Sector only for valid target cells;
- the server route remains the existing `et.plot.scout_sector`;
- all movement remains preview-only until a later explicit movement mutation exists.
