# Agent Town HQ15H Expedition Unit Coverage and Zoom Sync

Date: 2026-06-02

## Goal

Continue the text-to-gameplay conversion after Scout movement by making the remaining relevant out-of-city role coverage more concrete on the Expedition Map, without widening mutation authority.

## Result

- Reviewed Site Plans now project a selectable `surveyor` Expedition Map unit.
- Surveyor units sit on their server-owned known cell and expose a read-only `Inspect survey` command.
- Existing generated sprite wiring already included the surveyor asset; the roster now emits the actual server read-model unit that uses it.
- The Three.js fallback token style now includes a surveyor/tripod silhouette for asset-loading fallback.
- Semantic zoom overlays now refresh from renderer zoom/pan/reset view-change events, so programmatic map movement and UI controls keep selected-cell copy synchronized.

## Boundaries

- Scout movement remains the only current Expedition unit movement mutation.
- Surveyor, Courier, Settler Convoy, and Outpost Crew units are selectable/read-model units only in this slice.
- Surveyor units do not move, reveal fog, gather resources, create routes/trade, schedule background work, start combat, mutate other plots, execute Atlas, publish/share, render Generated Universe content, or call external systems.
- Scout Sector remains the only reveal/fog mutation path.

## Verification

- `node --check server/founders_plot/engine.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check e2e/200_founders_plot.spec.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npm run build:founders-plot-threejs`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js` passed 86/86
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --reporter=line` passed 1/1
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js -g "FP-E2E-023" --reporter=line` passed 1/1
- `npm run test:founders-plot` passed 98/98
