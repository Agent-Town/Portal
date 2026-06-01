# Agent Town HQ11 Civic Operations / Living World Systems Plan - 2026-05-31

Report-only lane for `/Users/robin/Projects/Portal-atlas-editor`.

This report proposes the next bounded vertical slice after HQ10D. It does not edit gameplay source, routes, UI, tests, assets, public docs, deployment state, or external channels.

## Source Context

Founders Plot is the playable city-builder core. Gameplay authority belongs in the server engine, store, routes, tool contracts, specs, and tests. Progression Atlas and editor-authored proposals stay advisory until promoted through that authority path.

Current completed spine:

- HQ1-HQ5: resource buildings, StarCraft-style HQ gates, functional building loop, rewards, Foreman clarity.
- HQ3-HQ7: scouting, Scout Reports, Site Plans, Settlement Charter review, Settler Convoy, second plot/outpost membership.
- HQ8-HQ9: Research Lodge doctrine, first bounded doctrine effect, Work Order planner and single executor.
- HQ10A: World Grid server-owned read model.
- HQ10B: civic proposal records/UI.
- HQ10C: Generated Universe overlay-pack records/UI and browser-local overlay preview.
- HQ10D: server-owned civic project activation. A same-plot `REVIEWED` civic proposal can activate a bounded `civic_beacon` public-work record with receipt, `CIVIC_PROJECT_ACTIVATED` world delta, local readiness +1, and `civic_beacon_lit` morale marker.

The remaining gap is feel: civic projects are real server records now, but not yet a game system the player can repeatedly read, act on, and watch in the living town.

## HQ11 Vertical Slice

HQ11 should make an active civic project produce explicit, player-triggered civic operations. The smallest safe playable slice is:

`Active Civic Beacon -> Run Beacon Round -> Civic Operation receipt -> World Grid / Living World update -> visual-only civic actors -> Atlas memory`

The first operation type should be only `beacon_round`.

It is a neighborly civic check-in around the active Civic Beacon. The player explicitly runs it from a Civic Operations panel. The server validates that the plot has HQ10A readiness and an active same-plot `civic_beacon` project. The server then writes a completed civic-operation record, a `CIVIC_OPERATION_COMPLETED` world delta, and a capped local living-world score. The scene projects Civic Routekeeper / Oracle Adjunct activity as visual-only inhabitants.

No timer is needed for this first slice. Avoid a scheduler, background job, or autonomous operation loop. If a later slice wants timed civic work, it should be a separately scoped server-owned job contract with tests.

## Gameplay Loop

1. Player reaches HQ10D and activates one `civic_beacon` from a reviewed civic proposal.
2. Civic Operations panel becomes available.
3. Panel shows:
   - active public work: Civic Beacon
   - operation available: Beacon Round
   - current `localCareScore`, completed rounds, latest receipt, and World Grid readiness markers
   - clear guardrail copy: no routes, trade, resource spend, scheduler, public sharing, or Atlas execution
4. Player clicks `Run Beacon Round`.
5. Server writes one operation record and world delta.
6. World Grid updates `civicOperations` and `civicReadiness.signals`.
7. UI shows a new receipt and the living-world score.
8. Scene shows a Civic Routekeeper marking the beacon and an Oracle Adjunct consulting the World Grid. These are visual projections only.
9. Progression Atlas shows HQ11 Civic Operations nodes and operation receipt nodes, with metadata-only action refs.

The repeatable fun is capped and bounded:

- first operation: unlocks visible Routekeeper activity and `civic_rounds_started`
- second operation: adds Oracle Adjunct consult cue and `civic_rounds_observed`
- third operation: reaches local care cap and `civic_rounds_stable`
- further runs can be idempotent/blocked or allowed as receipts with no additional score, but the conservative default is cap at 3 and return `alreadyAtCap: true`

## Server-Owned State

Add a new persisted record type, not an Atlas/editor-owned execution path.

Suggested table in `server/founders_plot/store.js`:

```text
founder_civic_operations
- operation_id TEXT PRIMARY KEY
- plot_id TEXT NOT NULL
- project_id TEXT NOT NULL
- operation_type TEXT NOT NULL
- status TEXT NOT NULL
- title TEXT NOT NULL
- summary TEXT NOT NULL
- effect_json TEXT NOT NULL
- receipt_json TEXT NOT NULL
- authority_boundary TEXT NOT NULL
- created_by TEXT NOT NULL
- approved_by TEXT
- created_at INTEGER NOT NULL
- updated_at INTEGER NOT NULL
```

Initial allowed values:

- `operationType`: `beacon_round`
- `status`: `COMPLETED`
- `authorityBoundary`: `server_owned_civic_operation_local_living_world_v1`
- `effect.effectId`: `local_beacon_round_v1`
- `effect.kind`: `local_living_world_care`
- `effect.localCareDelta`: `1`
- `effect.maxLocalCareScore`: `3`
- `effect.resourceDelta`: `{}`
- `effect.routeCreation`: `false`
- `effect.tradeRouteCreation`: `false`
- `effect.backgroundScheduling`: `false`
- `effect.externalEffects`: `false`

Add `civicOperationsReadModel(bundle)` in `server/founders_plot/engine.js`:

```text
civicOperations: {
  status: "AVAILABLE" | "LOCKED" | "CAPPED",
  implementation: "hq11_server_owned_civic_operations_v1",
  authorityBoundary: "server_owned_civic_operation_local_living_world_v1",
  operationAllowed: true | false,
  allowedOperationTypes: ["beacon_round"],
  counts: {
    total,
    completedCount,
    beaconRoundCount
  },
  activeEffects: {
    localCareScore,
    maxLocalCareScore: 3,
    moraleMarkers: [...]
  },
  requirements: {
    activeCivicBeacon: true | false,
    worldGridReady: true | false
  },
  operations: [...]
}
```

Add to `worldGridReadModel(bundle)`:

```text
worldGrid.civicOperations: {
  localOnly: true,
  operationAllowed,
  total,
  completedBeaconRounds,
  localCareScore,
  maxLocalCareScore: 3,
  latestOperationId,
  authorityBoundary
}
```

Add to `worldGrid.civicReadiness`:

- signal: `local_civic_operations`
- bounded capability: `local_beacon_round_operation`
- morale markers derived from capped progress:
  - `civic_beacon_lit` from HQ10D remains
  - `civic_rounds_started`
  - `civic_rounds_observed`
  - `civic_rounds_stable`

Do not add resources, inventory, route/trade objects, settlement mutations, public share state, external destinations, or arbitrary tool execution fields.

## Routes And Tools

Add only two narrow routes in `server/founders_plot/routes.js`:

- `GET /api/founders-plot/civic-operations`
- `POST /api/founders-plot/civic-operations/run`

Add only two tool contracts in `server/founders_plot/tools.js`:

- `et.plot.list_civic_operations`
- `et.plot.run_civic_operation`

Suggested run args:

```json
{
  "plotId": "optional current plot id",
  "projectId": "required active civic project id",
  "operationType": "beacon_round",
  "title": "Beacon Round",
  "summary": "Neighborly local check-in around the Civic Beacon.",
  "actor": "HUMAN",
  "idempotencyKey": "required"
}
```

Tool behavior:

- list is read-only and returns empty `worldDelta`.
- run requires HQ10A readiness and an active same-plot `civic_beacon`.
- run is idempotent by request key.
- agent callers require matching human approval for `run_civic_operation`.
- repeated run after cap returns a safe success envelope with `alreadyAtCap: true` and no new effect.
- response includes `operation`, `civicOperations`, `state`, `stateHash`, and `worldDelta`.

## World Grid Deltas

New event type:

- `CIVIC_OPERATION_COMPLETED`

Event payload should include:

```text
operationId
projectId
operationType
effectId
localCareDelta
localCareScore
maxLocalCareScore
receipt
authorityBoundary
```

Expected hash behavior:

- `GET /civic-operations` does not change state hash.
- successful `POST /civic-operations/run` changes gameplay stable hash.
- local overlay preview remains stable-gameplay excluded.
- Atlas action refs remain metadata-only and do not mutate anything.

## Progression Atlas Nodes

Add canonical visibility in `server/founders_plot/progression_atlas.js`:

- `world_grid.civic_operations`
- `civic_operation.<operationId>`

Edges:

- `world_grid.civic_project_activation -> world_grid.civic_operations`
- `world_grid.civic_operations -> civic_operation.<operationId>`

Node copy:

- title: `Civic Operations`
- summary: `Run explicit local civic rounds from active public works. Server-owned, local-only, no scheduler.`
- status:
  - `locked` until HQ10D active civic beacon exists
  - `available` while below operation cap
  - `complete` or `capped` at local care cap
- actionRef:
  - name: `et.plot.run_civic_operation`
  - `executableByAtlas: false`
  - boundary: `server_owned_civic_operation_local_living_world_v1`

Progression Atlas may show operation receipts and projected status. It must not execute the operation, bypass route/tool gates, or promote editor-authored nodes into gameplay.

## Founders Plot UI

Add a new panel in `public/experiences/founders-plot/index.html`, `founders-plot.js`, and `founders-plot.css`:

- panel title: `Civic Operations`
- active public work card: Civic Beacon
- operation card: Beacon Round
- run button: `Run Beacon Round`
- progress meter: `Local care 0/3`
- receipt log: latest operation receipts
- actor cue strip:
  - Civic Routekeeper: marks local readiness
  - Oracle Adjunct: interprets read-only signals
  - Outpost Keeper: welcomes founded outpost context when present

UI constraints:

- Create no hidden automation.
- Do not include public share buttons.
- Do not include route/trade/spend controls.
- Do not expose arbitrary tool names as executable buttons except the one server-owned route-backed operation.
- Keep forms stable across the existing 5s polling loop.
- Preserve mobile 390px readability and no horizontal overflow.

## Visual-Only Living World Actors

Use the existing Batch C civic assets after server state justifies them:

- Civic Routekeeper: `public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.png`
- Oracle Adjunct: `public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.png`
- Outpost Keeper: `public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.png`
- Civic Beacon prop: `public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.webp`

Add scene projection only after a server-owned operation/project exists:

- `civic_routekeeper`
  - sourceDomain: `civic_project` or `civic_operation`
  - actionKind: `CIVIC_BEACON_ACTIVE` / `BEACON_ROUND`
  - state: `marking` or `ready`
- `oracle_adjunct`
  - sourceDomain: `civic_operation`
  - actionKind: `WORLD_GRID_CONSULT`
  - state: `consulting` or `ready`
- `outpost_keeper`
  - sourceDomain: `settlement_claim` plus active civic operation context
  - actionKind: `OUTPOST_WELCOME`
  - state: `tending` or `ready`

Scene-state guardrail:

- actors are `visualOnly: true`
- actors do not create operations
- actors do not choose operations
- actors do not change resources, jobs, routes, trades, claims, doctrine, Atlas nodes, overlay packs, or public state
- routekeeper visuals are not trade routes or pathfinding authority
- oracle visuals are not surveillance, all-seeing authority, or autonomous decision making

This follows the character direction: visible human-plus-agent society, with neighborly synthetic civic roles. The robotic/synthetic roles should feel like assistants and neighbors, not drones, security tools, or faceless automation.

## Tests

Server unit tests in `tests-founders-plot/fp-unit.test.js`:

- locked without active HQ10D Civic Beacon
- success with active same-plot `civic_beacon`
- idempotency returns same operation/effect
- local care score caps at 3
- repeated run at cap does not add effect/world delta
- agent caller requires matching human approval
- foreign plot/project ids fail closed
- no inventory/resource/job/route/trade/settlement mutation
- World Grid `civicOperations` and `civicReadiness` update deterministically
- stable gameplay hash changes only on successful run

Contract tests in `tests-founders-plot/fp-contract.test.js`:

- `et.plot.list_civic_operations` args/result schema
- `et.plot.run_civic_operation` args/result schema
- `operationType` enum only allows `beacon_round`
- result envelope includes operation/read model/world delta fields

HTTP tests in `tests-founders-plot/fp-http.test.js`:

- list route is read-only
- run route validates active project and same plot
- run route writes `CIVIC_OPERATION_COMPLETED`
- unauthorized/foreign plot access is rejected
- agent approval path is enforced

Scene-state tests in `tests-founders-plot/fp-scene-state.test.js`:

- active beacon projects can project Civic Routekeeper visual-only actor
- completed Beacon Round can project Oracle Adjunct visual-only actor
- outpost context can project Outpost Keeper visual-only actor
- actor sprite sheet metadata maps actions to rows
- actor projections never appear as authoritative gameplay objects

Playwright tests in `e2e/200_founders_plot.spec.js`:

- HQ11 Civic Operations panel appears after active civic beacon
- user can run one Beacon Round and see receipt/log/progress
- mobile 390px panel has no overflow/occlusion
- poll refresh preserves operation state
- no public/share/route/trade/spend/scheduler controls appear

Progression Atlas tests in `e2e/114_progression_atlas_openclaw_lite.spec.js`:

- HQ11 Civic Operations node appears after HQ10D state
- operation receipt nodes are visible
- action refs are metadata-only with `executableByAtlas: false`
- Atlas cannot execute the route/tool

Adversarial checks:

- direct route call with `operationType` other than `beacon_round` fails
- direct route call with inactive project fails
- direct route call with foreign project fails
- direct route call with source proposal only, no active project, fails
- no operation can create route/trade/spend/scheduler/public/external effects

## Proof Artifacts

Each implementation lane should write a report under `reports/`. Suggested proof artifacts:

- `reports/agent-town-hq11-civic-operations-core-proof-2026-06-01.json`
- `reports/agent-town-hq11-civic-operations-ui-desktop-2026-06-01.png`
- `reports/agent-town-hq11-civic-operations-ui-mobile-2026-06-01.png`
- `reports/agent-town-hq11-living-world-actors-proof-2026-06-01.json`
- `reports/agent-town-hq11-living-world-actors-scene-proof-2026-06-01.png`
- `reports/agent-town-hq11-atlas-civic-operations-proof-2026-06-01.png`

Core proof JSON should include:

```text
beforeStateHash
afterStateHash
worldDeltaTypes: ["CIVIC_OPERATION_COMPLETED"]
operation.operationType: "beacon_round"
effect.localCareDelta: 1
civicOperations.activeEffects.localCareScore
worldGrid.civicOperations.localCareScore
worldGrid.civicReadiness.moraleMarkers
inventoryUnchanged: true
routesUnchanged: true
tradeUnchanged: true
jobsUnchanged: true
settlementClaimsUnchanged: true
externalEffects: false
atlasActionExecutable: false
```

## Conservative Implementation Sequence

### Lane 1 - HQ11A Server Civic Operations Core

Ownership:

- `server/founders_plot/store.js`
- `server/founders_plot/engine.js`
- `server/founders_plot/routes.js`
- `server/founders_plot/tools.js`
- `specs/02_api_contract.md`
- `public/experiences/founders-plot/tools.md`
- `tests-founders-plot/fp-unit.test.js`
- `tests-founders-plot/fp-contract.test.js`
- `tests-founders-plot/fp-http.test.js`

Deliver:

- `founder_civic_operations`
- `civicOperationsReadModel`
- list/run route and tool specs
- `CIVIC_OPERATION_COMPLETED`
- World Grid civic operation projection
- proof JSON and report

Do not touch UI or scene rendering in this lane.

### Lane 2 - HQ11B Founders Plot Civic Operations UI

Ownership:

- `public/experiences/founders-plot/index.html`
- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`

Deliver:

- Civic Operations panel
- Run Beacon Round action
- receipt/progress rendering
- mobile proof
- no route/trade/spend/share/scheduler buttons

Do not change server authority in this lane except for test fixtures/mocks as needed.

### Lane 3 - HQ11C Visual-Only Living World Actor Projection

Ownership:

- `server/founders_plot/engine.js` for server-emitted visual actor facts
- `public/experiences/founders-plot/scene_state.js`
- `public/experiences/founders-plot/three_scene_entry.js` only if renderer needs a sprite-sheet mapping adjustment
- `tests-founders-plot/fp-scene-state.test.js`
- `e2e/200_founders_plot.spec.js` focused scene proof if needed

Deliver:

- scene roles for `civic_routekeeper`, `oracle_adjunct`, `outpost_keeper`
- mapping to existing Batch C sprite sheets
- visual-only tests and screenshots

Do not let actors execute tools, mutate state, create routes, or become gameplay authority.

### Lane 4 - HQ11D Atlas, Documentation, And Guardrail QA

Ownership:

- `server/founders_plot/progression_atlas.js`
- `public/progression-atlas.js`
- `public/progression-atlas.css`
- `e2e/114_progression_atlas_openclaw_lite.spec.js`
- focused reports/proofs

Deliver:

- HQ11 Atlas nodes/edges/receipt nodes
- metadata-only action refs
- no Atlas execution
- adversarial proof that Atlas/editor proposals cannot run operations
- final regression report over HQ10D -> HQ11

Do not add editor-owned promotion, external sharing, Generated Universe rendering, or public publishing.

## Exact Guardrails

Preserve these boundaries in every HQ11 lane:

- No Atlas-owned execution.
- No editor/proposal-owned gameplay promotion without engine, store, routes, tools, specs, and tests.
- No public or external sharing.
- No scheduler, cron, background autonomy, autonomous civic operations, or polling-triggered mutation.
- No arbitrary tool runner or generic operation executor.
- No route creation, trade route creation, market/trade expansion, or path authority.
- No resource spending or economy expansion unless a later lane explicitly scopes it as server-owned with tests.
- No settlement founding, plot creation, plot switching, or cross-plot mutation.
- No Generated Universe rendering/share authority.
- No scene actor authority; actors are visual-only projections of server state.
- Agent callers require matching human approval for mutation tools.
- Same-plot access checks must hold for every project/operation id.
- Read/list endpoints must remain read-only and return empty `worldDelta`.
- All new user-facing capability must be backed by deterministic tests and proof artifacts.

## Recommended Next Step

Start with Lane 1 only. HQ11A should make one operation type real in server truth before any UI or actor work. Once the server proof shows a safe `beacon_round` receipt and stable guardrails, the UI and living-world actors can make it feel alive without smuggling in authority.
