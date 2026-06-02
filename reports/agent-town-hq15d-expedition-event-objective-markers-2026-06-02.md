# Agent Town HQ15D Expedition Event and Objective Markers

Date: 2026-06-02

## Result

Converted the Expedition Map's event packet and current-focus text into visible map markers.

- Expedition Event Packets now render as receipt/packet markers on revealed map cells when the server read model exposes packet metadata.
- Current Focus now renders as a visual objective marker on the target sector, including the Scout objective on an eligible hinted sector.
- Markers are Three.js sprites only. They can select/inspect the underlying cell, but they are not commands, routes, movement, or executable actions.
- Marker proof metadata is exposed through `getExpeditionMapInfo()` so tests can assert read-only/visual-only behavior.
- The Founders Plot UI passes the computed objective model into the Three.js renderer, keeping the inspector text and the map marker aligned.

## Guardrails

- Server-owned `expeditionMap.cells`, `eventPackets`, and `objective` data are the only marker sources.
- Event packet markers render only when their target cell is already `discovered` or `known`.
- Objective markers can point at a server-eligible hinted Scout target but do not reveal resources, routes, or hidden truth.
- `eventObjectiveMarkerAuthority` is `false`; every event/objective marker reports `visualOnly: true`, `readOnly: true`, `selectable: true`, `inspectable: true`, `routeAuthority: false`, `actionAuthority: false`, and `executableActions: 0`.
- Scout Sector remains the only current Expedition Map mutation path.

## Files

- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `public/experiences/founders-plot/founders-plot.js`
- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `reports/agent-town-hq15d-expedition-event-objective-markers-proof-2026-06-02.json`

## Verification

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npm run build:founders-plot-threejs`
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js -g "FP-E2E-023" --reporter=line`
- `npx playwright test e2e/200_founders_plot.spec.js -g "FP-E2E-022" --reporter=line`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js`
- `jq empty reports/agent-town-hq15d-expedition-event-objective-markers-proof-2026-06-02.json`
- `git diff --check`

All focused checks passed.
