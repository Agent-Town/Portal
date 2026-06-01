# Agent Town HQ12C Scout Sector Backend Slice

Date: 2026-05-31

## Result

Implemented the smallest bounded HQ12C backend slice.

The new explicit action is:

- Route: `POST /api/founders-plot/expedition-map/scout-sector`
- Tool: `et.plot.scout_sector`

It reveals exactly one eligible same-plot `hinted` Expedition Map frontier sector as `known` read-model truth. It persists only a minimal server-owned `expeditionScouts` receipt list on the current plot, then the existing HQ12A Expedition Map read model projects that sector on later reads.

## Scope

Changed:

- `server/founders_plot/store.js`
- `server/founders_plot/engine.js`
- `server/founders_plot/routes.js`
- `server/founders_plot/tools.js`
- `tests-founders-plot/fp-unit.test.js`
- `tests-founders-plot/fp-contract.test.js`
- `tests-founders-plot/fp-http.test.js`
- `specs/02_api_contract.md`
- `reports/agent-town-hq12c-scout-sector-backend-proof-2026-05-31.json`
- `reports/agent-town-hq12c-scout-sector-backend-slice-2026-05-31.md`

No frontend UI, Atlas execution, generated visuals, GitHub issue updates, push/merge/deploy, scheduler, roaming, harvesting, economy, combat, public sharing, or cross-plot mutation was added.

## Behavior

- Validates session plot ownership through the existing `withIdempotency` and `verifyPlotAccess` path.
- Requires an idempotency key and rejects reused keys with different arguments.
- If `cellId` is provided, it must be a current `hinted` Expedition Map cell unless it was already scouted.
- If `cellId` is omitted, the server deterministically selects the first eligible hinted frontier cell.
- Human calls can scout directly.
- Agent calls using `actor` or `actorType` = `AGENT` require a matching approved `request_user_approval` record for `scout_sector` with `{ "cellId": "<target cell>" }`.
- Duplicate calls for an already scouted cell return the existing sector without a new world delta.

## Receipt Boundary

Each new scout-sector receipt records:

- before/after Expedition Map projection hashes
- before/after fog counts
- target before/after fog state
- newly known/discovered cell ids
- same-plot/current-plot flags
- `routeCreation: false`
- `tradeRouteCreation: false`
- `backgroundScheduling: false`
- `atlasExecution: false`
- `crossPlotMutation: false`
- `externalEffects: false`
- `autonomousMovement: false`
- `resourceHarvesting: false`

Proof artifact:

- `reports/agent-town-hq12c-scout-sector-backend-proof-2026-05-31.json`

## Verification

Passed:

```bash
node --check server/founders_plot/store.js
node --check server/founders_plot/engine.js
node --check server/founders_plot/routes.js
node --check server/founders_plot/tools.js
node --check tests-founders-plot/fp-unit.test.js
node --check tests-founders-plot/fp-contract.test.js
node --check tests-founders-plot/fp-http.test.js
NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js
NODE_ENV=test node --test tests-founders-plot/fp-contract.test.js
NODE_ENV=test node --test tests-founders-plot/fp-http.test.js
```

Focused results:

- Unit: 35/35 passed, including `FP-UT-028`.
- Contract: 24/24 passed, including `FP-CT-101b3`.
- HTTP: 24/24 passed, including `FP-HT-011d3`.

Also passed:

```bash
node -e "JSON.parse(require('fs').readFileSync('reports/agent-town-hq12c-scout-sector-backend-proof-2026-05-31.json', 'utf8')); console.log('proof json ok')"
git diff --check -- server/founders_plot/store.js server/founders_plot/engine.js server/founders_plot/routes.js server/founders_plot/tools.js tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js specs/02_api_contract.md reports/agent-town-hq12c-scout-sector-backend-proof-2026-05-31.json reports/agent-town-hq12c-scout-sector-backend-slice-2026-05-31.md
git diff --no-index --check -- /dev/null reports/agent-town-hq12c-scout-sector-backend-slice-2026-05-31.md; rc=$?; test "$rc" -eq 1
git diff --no-index --check -- /dev/null reports/agent-town-hq12c-scout-sector-backend-proof-2026-05-31.json; rc=$?; test "$rc" -eq 1
```
