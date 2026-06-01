# AgentTown Inhabitant / Building Coverage Audit

Date: 2026-05-31
Repo: `/Users/robin/Projects/Portal-atlas-editor`
Branch observed: `neo/progression-atlas-editor-next-2026-05-29`
Mode: report-only audit
Source/gameplay/UI/assets edited: no

## Authority Note

This is a visual and story coverage audit only. It is not gameplay authority. The server-owned gameplay truth remains in `server/founders_plot/engine.js`, related store/routes/tools, and tests. Inhabitant sprites and scene projections should make existing state legible; they must not add hidden mechanics, scheduler behavior, route/trade authority, public effects, or Atlas execution.

## Short Answer

No, not every gameplay building/surface has dedicated inhabitant/operator coverage yet.

Current coverage is good for the newer HQ3-HQ11 inhabited surfaces: Expedition Board/scout, Workshop, Market, Settler Convoy, Outpost, Civic Beacon, and World Grid now have dedicated runtime actors or operators. But HQ, Lumber Camp, Farm Plot, and Quarry still rely on generic builder/worker/hauler coverage. Settlement Charter, Research Lodge, and Cohort Hall have production-ready inhabitant assets, but they are not yet runtime scene-wired.

No, not every current inhabitant sprite role is fully ready for the game. Every role listed in runtime `ACTOR_SPRITE_SHEETS` has a 2048x2048 PNG, JSON metadata, source image, prompt, 4x4 runtime frame contract, and scene mapping. But three current asset roles, `charter_clerk`, `research_doctrine_keeper`, and `cohort_hall_coordinator`, remain asset-ready only and need server/scene projection before they are game-ready. Older runtime roles `builder`, `worker`, `hauler`, and `messenger` are runtime-ready, but do not have `.generated.png` provenance files in the current repo.

## Building / Surface Matrix

| Building or surface | Status | Runtime role coverage | Asset status | Gap |
| --- | --- | --- | --- | --- |
| `HQ` | Generic worker/hauler coverage only | Clover presence plus builder/worker/hauler/messenger routes | HQ level art present | No HQ-specific operator sheet or runtime role |
| `LUMBER_CAMP` | Generic worker/hauler coverage only | `builder`, `worker`, `hauler` | Building art present | No dedicated lumber worker/woodcutter asset or mapping |
| `FARM_PLOT` | Generic worker/hauler coverage only | `builder`, `worker`, `hauler` | Building art present | No dedicated farmer/grower asset or mapping |
| `QUARRY` | Generic worker/hauler coverage only | `builder`, `worker`, `hauler` | Building art present | No dedicated quarry mason/stonecutter asset or mapping |
| `EXPEDITION_BOARD` | Dedicated inhabitant wired | `scout` | Building, scout, and scout-report assets present | Covered |
| `WORKSHOP` | Dedicated inhabitant wired | `workshop_specialist` | Building and Workshop Specialist assets present | Covered |
| `MARKET_STALL` | Dedicated inhabitant wired | Engine emits `market_trader`; scene normalizes to `trader` | Building and Market Trader assets present | Covered |
| Settlement Charter / Site Plan Review | Asset-ready but not wired | none | Charter board/document/site-plan/claim-ready assets plus `charter_clerk` sheet present | Missing server visual actor and `ACTOR_SPRITE_SHEETS` role |
| Research Lodge / Doctrine | Asset-ready but not wired | none | Research Lodge building art plus `research_doctrine_keeper` sheet present | Missing server visual actor and `ACTOR_SPRITE_SHEETS` role |
| Cohort Hall / Work Orders | Asset-ready but not wired | none | Work-order dossier plus `cohort_hall_coordinator` sheet present | Missing physical Cohort Hall building art and runtime scene wiring |
| World Grid | Dedicated inhabitant wired | `oracle_adjunct` | Oracle Adjunct present; World Grid Civic Beacon prop present | Prop exists but is not itself a scene object |
| Civic Beacon | Dedicated inhabitant wired | `civic_routekeeper` | Civic Routekeeper present; World Grid Civic Beacon prop present | Covered as active civic project actor |
| Outpost / Second Plot | Dedicated inhabitant wired | `outpost_keeper` | Outpost core/marker/receipt plus Outpost Keeper present | Covered after founded outpost state |
| Workshop | Dedicated inhabitant wired | `workshop_specialist` | Building and sprite assets present | Covered |
| Market | Dedicated inhabitant wired | `trader` | Building and sprite assets present | Covered |
| Scout / Expedition | Dedicated inhabitant wired | `scout` | Expedition Board, Scout Report, Pathfinder Scout present | Covered |
| Convoy | Dedicated inhabitant wired | `settler` | Convoy wagon/route/claim assets and Settler Convoy Crew present | Covered |

## Explicit Requested Surfaces

- Farm: generic worker/hauler only; missing dedicated farmer/grower asset and scene mapping.
- Quarry: generic worker/hauler only; missing dedicated quarry mason/stonecutter asset and scene mapping.
- Lumber Camp: generic worker/hauler only; missing dedicated lumber worker/woodcutter asset and scene mapping.
- HQ: generic/operator-adjacent coverage only; no HQ-specific inhabitant role.
- Settlement Charter: asset-ready with `charter_clerk`, but not scene-wired.
- Research Lodge: asset-ready with `research_doctrine_keeper`, but not scene-wired.
- Cohort Hall: asset-ready with `cohort_hall_coordinator`, but not scene-wired and no physical Cohort Hall building art.
- World Grid: covered by wired `oracle_adjunct`; prop art exists but is not projected as a scene object.
- Civic Beacon: covered by wired `civic_routekeeper` from active `civic_beacon` project state.
- Outpost: covered by wired `outpost_keeper` from founded settlement claim/outpost state.
- Workshop: covered by wired `workshop_specialist`.
- Market: covered by wired `trader`, with `market_trader` accepted as engine alias.
- Scout/Expedition: covered by wired `scout`.
- Convoy: covered by wired `settler`.

## Runtime Actor Sprite Sheet Matrix

Every runtime `ACTOR_SPRITE_SHEETS` role resolves to a 2048x2048 sRGBA PNG, 4 columns x 4 rows, 512px frame cells in scene state. Row coverage below uses the runtime action rows.

| Runtime role | Sheet id | png | json | source | generated | prompt | Rows/actions | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `builder` | `rigger-slate-builder-v2` | yes | yes | yes | no | yes | build/ready via runtime rows | Runtime-ready, older provenance incomplete |
| `worker` | `kettle-37-worker-v1` | yes | yes | yes | no | yes | idle/walk/work/ready | Runtime-ready, older provenance incomplete |
| `hauler` | `oona-tallpack-hauler-v1` | yes | yes | yes | no | yes | idle/walk/work/ready | Runtime-ready, older provenance incomplete |
| `messenger` | `rook-signalpost-messenger-v1` | yes | yes | yes | no | yes | idle/walk/work/ready; runtime maps approval/reward/quest to ready | Runtime-ready, older provenance incomplete |
| `scout` | `pathfinder-scout-v1` | yes | yes | yes | yes | yes | idle/walk/scout/ready | Fully runtime-ready |
| `workshop_specialist` | `workshop-specialist-v1` | yes | yes | yes | yes | yes | idle/walk/tune/ready | Fully runtime-ready |
| `trader` | `market-trader-v1` | yes | yes | yes | yes | yes | idle/walk/sell/ready | Fully runtime-ready |
| `settler` | `settler-convoy-crew-v1` | yes | yes | yes | yes | yes | idle/walk/prepare/ready | Fully runtime-ready |
| `civic_routekeeper` | `civic-routekeeper-v1` | yes | yes | yes | yes | yes | idle/walk/mark/ready | Fully runtime-ready |
| `oracle_adjunct` | `oracle-adjunct-v1` | yes | yes | yes | yes | yes | idle/walk/consult/ready | Fully runtime-ready |
| `outpost_keeper` | `outpost-keeper-v1` | yes | yes | yes | yes | yes | idle/walk/tend/ready | Fully runtime-ready |

## Asset-Only Inhabitant Roles

These are current inhabitant sprite roles in the repo, but not runtime `ACTOR_SPRITE_SHEETS` roles yet:

| Asset role | Sheet id | png/json/source/generated/prompt | Dimensions | Row coverage | Game readiness |
| --- | --- | --- | --- | --- | --- |
| `charter_clerk` | `charter-clerk-v1` | all present | 2048x2048 sRGBA | idle/walk/review/ready | Asset-ready, missing scene wiring |
| `research_doctrine_keeper` | `research-doctrine-keeper-v1` | all present | 2048x2048 sRGBA | idle/walk/research/ready | Asset-ready, missing scene wiring |
| `cohort_hall_coordinator` | `cohort-hall-coordinator-v1` | all present | 2048x2048 sRGBA | idle/walk/coordinate/ready | Asset-ready, missing scene wiring |
| `market_trader` | `market-trader-v1` alias copy | all present | 2048x2048 sRGBA | idle/walk/sell/ready | Compatibility alias; runtime normalizes to `trader` |

## Highest-Value Missing Next

1. Dedicated `farmer` / `grower` for `FARM_PLOT`.
2. Dedicated `quarry_mason` / `stonecutter` for `QUARRY`.
3. Dedicated `lumber_worker` / `woodcutter` for `LUMBER_CAMP`.
4. Runtime scene projection for `charter_clerk` on Settlement Charter / Site Plan Review state.
5. Runtime scene projection for `research_doctrine_keeper` on Research Lodge doctrine state.
6. Runtime scene projection plus physical building art for `cohort_hall_coordinator` / Cohort Hall.

This should stay an audit-only queue. The next implementation lane should still preserve server authority and should only project real server/read-model state.

## Evidence

Primary code paths inspected:

- `public/experiences/founders-plot/assets/characters/inhabitants/**`
- `public/experiences/founders-plot/assets/buildings/**`
- `public/experiences/founders-plot/assets/objects/**`
- `public/experiences/founders-plot/scene_state.js`
- `server/founders_plot/engine.js`
- `tests-founders-plot/fp-scene-state.test.js`
- `reports/agent-town-functional-building-inhabitants-production-matrix-2026-05-31.md`
- `reports/agent-town-batch-a-functional-inhabitants-sprite-integration-2026-05-31.md`
- `reports/agent-town-batch-b-functional-inhabitants-sprite-integration-2026-05-31.md`
- `reports/agent-town-batch-c-civic-world-grid-inhabitants-sprite-integration-2026-05-31.md`
- `reports/agent-town-hq11-civic-actors-scene-wiring-2026-05-31.md`

Checks run during audit:

```sh
git status --short --branch
rg --files public/experiences/founders-plot/assets/characters/inhabitants public/experiences/founders-plot/assets/buildings public/experiences/founders-plot/assets/objects
rg -n "ACTOR_SPRITE_SHEETS|canonicalRoleId|EXPEDITION_BOARD|WORKSHOP|MARKET_STALL|WORLD_GRID|CIVIC|OUTPOST" public/experiences/founders-plot/scene_state.js server/founders_plot/engine.js tests-founders-plot/fp-scene-state.test.js
jq -c '{id,role,displayName,columns,rows,frameWidth,frameHeight,rowOrder,actions,actionMapping}' <inhabitant metadata files>
identify -format '%wx%h %[channels]\n' <inhabitant runtime png files>
```

Validation for this report output is recorded separately by the final assistant turn:

```sh
jq empty reports/agent-town-inhabitant-building-coverage-matrix-2026-05-31.json
git diff --check -- reports/agent-town-inhabitant-building-coverage-audit-2026-05-31.md reports/agent-town-inhabitant-building-coverage-matrix-2026-05-31.json
```
