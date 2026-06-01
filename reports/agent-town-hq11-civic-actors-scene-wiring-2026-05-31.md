# Agent Town HQ11 Civic Actors Scene Wiring — 2026-05-31

## Result

Wired Civic Routekeeper, Oracle Adjunct, and Outpost Keeper into the Founders Plot scene as visual-only actors backed by existing server-owned state.

The server now emits bounded visual actor descriptors from real state:

- `outpost_keeper` appears from a founded settlement claim / owned outpost.
- `civic_routekeeper` appears from an active `civic_beacon` civic project.
- `oracle_adjunct` appears from the World Grid read model after the active civic beacon exists.

The scene renderer now maps those roles to the existing Batch C sprite sheets, route modes, cue metadata, and animation rows.

## Visual-Only Boundary

This lane does not create civic actors from client-only guesses or proof fixtures. The proof path builds the state through engine mutations: reviewed Site Plan, Settler Convoy, founded outpost, selected doctrine, work-order draft, reviewed civic proposal, and active civic beacon. No proof input injects `visualActors`.

The new projections are display descriptors only:

- no resource spending
- no route or trade-route creation
- no scheduler/background work
- no Atlas execution
- no public sharing or external effects
- no new civic mutation beyond reading existing HQ10D `civic_beacon` truth

## Proof

Proof JSON:

- `reports/agent-town-hq11-civic-actors-scene-state-proof-2026-05-31.json`

Key proof facts:

- `realServerState.civicBeaconActive: true`
- `realServerState.worldGridReady: true`
- `serverVisualActors.civic_routekeeper.sourceDomain: civic_project`
- `serverVisualActors.oracle_adjunct.sourceDomain: world_grid`
- `serverVisualActors.outpost_keeper.sourceDomain: settlement_claim`
- all three server and scene actors have `visualOnly: true`

## Changed Paths

- `server/founders_plot/engine.js`
- `public/experiences/founders-plot/scene_state.js`
- `tests-founders-plot/fp-scene-state.test.js`
- `public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.json`
- `reports/agent-town-hq11-civic-actors-scene-state-proof-2026-05-31.json`
- `reports/agent-town-hq11-civic-actors-scene-wiring-2026-05-31.md`

## Tests Run

- `node --check public/experiences/founders-plot/scene_state.js` — pass
- `node --check server/founders_plot/engine.js` — pass
- `node --check tests-founders-plot/fp-scene-state.test.js` — pass
- `NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js` — pass, 8/8
- `node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('reports/agent-town-hq11-civic-actors-scene-state-proof-2026-05-31.json','utf8')); console.log('proof json ok')"` — pass
- `git diff --check` — pass

## Notes

- No push, merge, deploy, external message, branch rewrite, or destructive cleanup was performed.
- The worktree was already dirty and shared; unrelated changes were left alone.
