# Agent Town HQ15G Scout Unit Move and Payload Reconciliation

Date: 2026-06-02

## Goal

Promote the next text-to-gameplay slice from "move locked" into one narrow server-authoritative Scout movement command while also clearing the broad Founders Plot observation-payload perf guard that the HQ15 read-model expansion had broken.

## Result

- Added `et.plot.move_expedition_unit` and `POST /api/founders-plot/expedition-map/move-unit`.
- Movement is limited to the selected Scout unit moving between adjacent discovered/known cells on the same plot.
- Movement writes a server-owned receipt and `EXPEDITION_UNIT_MOVED` event, updates the unit read model location, and is idempotent by request key.
- Agent callers require matching human approval.
- Movement does not reveal fog, gather resources, create routes/trade, schedule background work, start combat, mutate another plot, execute Atlas, publish/share, render Generated Universe content, or call external systems.
- Added compact-observation options to `getFoundersPlotState` so heavy advanced read models and visual actors can be omitted when measuring or serving small observations; full read models remain available by default and through their dedicated routes.

## Files

- `server/founders_plot/engine.js`
- `server/founders_plot/routes.js`
- `server/founders_plot/store.js`
- `server/founders_plot/progression_atlas.js`
- `server/founders_plot/tools.js`
- `public/experiences/founders-plot/founders-plot.js`
- `tests-founders-plot/fp-unit.test.js`
- `tests-founders-plot/fp-http.test.js`
- `tests-founders-plot/fp-contract.test.js`
- `tests-founders-plot/fp-perf.test.js`
- `specs/02_api_contract.md`

## Verification

- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js` passed 86/86.
- `NODE_ENV=test node --test tests-founders-plot/fp-perf.test.js` passed 3/3.
- `npm run test:founders-plot` passed 98/98.
- `node --check server/founders_plot/engine.js`
- `node --check server/founders_plot/routes.js`
- `node --check tests-founders-plot/fp-perf.test.js`
- `git diff --check`

## Boundary

This is the first explicit Expedition Map mutation beyond Scout Sector, but it is scoped to Scout movement between already revealed adjacent cells. Scout Sector remains the only reveal/fog mutation path. Hidden/hinted/locked truth stays sealed, and movement creates no route, economy, combat, scheduler, Atlas, public, cross-plot, or external effect.
