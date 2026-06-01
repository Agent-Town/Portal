# Agent Town HQ10D Civic Project Activation Slice — 2026-05-31

## Result

Implemented the next playable HQ10 civic layer: a server-owned `activate_civic_project` mutation that promotes a same-plot `REVIEWED` civic proposal into a persisted bounded public-work record.

The first project type is intentionally small: `civic_beacon`. It applies one deterministic local gameplay effect:

- `local_civic_beacon_v1`
- `readinessDelta: 1`
- `moraleMarker: civic_beacon_lit`
- visible in `state.publicSummary`, `state.worldGrid.civicProjects`, `state.worldGrid.civicReadiness`, `state.civicProjects`, and Progression Atlas canonical nodes

## Gameplay Boundary

HQ10D is no longer advisory-only. It writes real server-owned gameplay truth and a `CIVIC_PROJECT_ACTIVATED` audit event, but stays narrow:

- requires HQ10A World Grid readiness
- requires a same-plot `REVIEWED` HQ10B civic proposal
- unique per source proposal and idempotent by request key
- agent callers require matching human approval
- no resource spending, cost changes, buffs, doctrine changes, route/trade creation, settlement founding, scheduler/background work, Atlas-owned execution, public sharing, cross-plot mutation, or external effects

HQ10C overlay records remain presentation-only and stable-gameplay excluded. HQ10D civic projects are intentionally included in gameplay truth/hash surfaces.

## API And Tool Surface

Added:

- `GET /api/founders-plot/civic-projects`
- `POST /api/founders-plot/civic-projects/activate`
- `et.plot.list_civic_projects`
- `et.plot.activate_civic_project`

Activation response includes the project record, applied effect, receipt, current state, and world delta. Repeating the same idempotency key returns the stored response; activating the same source proposal with a new key returns the existing project with `alreadyActivated: true` and no new world delta.

## Progression Atlas

Added canonical HQ10D visibility:

- `world_grid.civic_project_activation`
- `civic_project.<projectId>` record nodes
- summary fields for `civicProjectCount`, `civicProjectActiveCount`, and `civicBeaconActive`
- metadata-only action ref for `et.plot.activate_civic_project` with `executableByAtlas: false`

## Proof

Proof JSON:

- `reports/agent-town-hq10d-civic-project-activation-proof-2026-05-31.json`

Key proof facts:

- `worldDeltaTypes: ["CIVIC_PROJECT_ACTIVATED"]`
- `eventDelta: 1`
- `publicSummary.civicBeaconActive: true`
- `worldGrid.civicReadiness.localProjectReadinessScore: 1`
- `worldGrid.civicReadiness.moraleMarkers: ["civic_beacon_lit"]`
- `gameplayStableHashChanged: true`
- Atlas activation action ref remains `executableByAtlas: false`

## Changed Paths

- `server/founders_plot/store.js`
- `server/founders_plot/engine.js`
- `server/founders_plot/routes.js`
- `server/founders_plot/tools.js`
- `server/founders_plot/progression_atlas.js`
- `tests-founders-plot/fp-unit.test.js`
- `tests-founders-plot/fp-contract.test.js`
- `tests-founders-plot/fp-http.test.js`
- `public/experiences/founders-plot/tools.md`
- `specs/02_api_contract.md`
- `reports/agent-town-hq10d-civic-project-activation-proof-2026-05-31.json`
- `reports/agent-town-hq10d-civic-project-activation-slice-2026-05-31.md`

## Tests Run

- `node --check server/founders_plot/store.js && node --check server/founders_plot/engine.js && node --check server/founders_plot/routes.js && node --check server/founders_plot/tools.js && node --check server/founders_plot/progression_atlas.js && node --check tests-founders-plot/fp-unit.test.js && node --check tests-founders-plot/fp-contract.test.js && node --check tests-founders-plot/fp-http.test.js` — pass
- `NODE_ENV=test node --test tests-founders-plot/fp-contract.test.js` — pass, 21/21
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js` — pass, 33/33
- `NODE_ENV=test node --test tests-founders-plot/fp-http.test.js` — pass, 22/22
- `jq . reports/agent-town-hq10d-civic-project-activation-proof-2026-05-31.json >/dev/null` — pass
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js` — pass, 76/76
- `git diff --check -- server/founders_plot/store.js server/founders_plot/engine.js server/founders_plot/routes.js server/founders_plot/tools.js server/founders_plot/progression_atlas.js tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js public/experiences/founders-plot/tools.md specs/02_api_contract.md reports/agent-town-hq10d-civic-project-activation-proof-2026-05-31.json reports/agent-town-hq10d-civic-project-activation-slice-2026-05-31.md` — pass

## Notes

- No push, merge, deploy, external message, broad scheduler, public sharing, or cleanup was performed.
- The worktree was already dirty and shared; unrelated files were left untouched.
