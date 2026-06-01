# Agent Town Post-HQ11 Expedition / Fog-of-War Next Stage Plan - 2026-05-31

Report-only task for `/Users/robin/Projects/Portal-atlas-editor`.

No source files were edited. This plan is grounded in the current Founders Plot reports and code paths around Scout Reports, Site Plans, Settler Convoys, World Grid, Civic Projects, HQ11 inspection, and visual-only civic actors.

## Current Answer

Can the player leave the base today?

**Yes, but only through bounded server-owned abstractions. No, not as a free-roaming avatar or fully navigable outside world.**

The current playable outward path is:

1. HQ3 unlocks `EXPEDITION_BOARD`.
2. The player builds the Expedition Board and runs a `SCOUT` job.
3. Collecting the job creates a persisted Scout Report receipt with site type, risk, traits, and resource hints.
4. The player drafts a canonical Site Plan from a collected Scout Report.
5. HQ6 Settlement Charter review marks that Site Plan as claim-ready planning only.
6. `et.plot.prepare_settler_convoy` spends resources and starts one timed Settler Convoy claim.
7. After arrival, `et.plot.found_settlement` explicitly creates one owned outpost plot.
8. Owned plots are shown in the Founders Plot UI and World Grid read model, but the UI still labels them read-only for this slice and says full plot switching is deferred.

That means the game already has **exploration receipts, planning dossiers, convoy claims, founded outposts, and private owned-plot scope**. It does not yet have:

- a strategic map the player can pan around
- fog-of-war cells or reveal state
- route/trade economy
- repeated expedition mission choices
- hazardous travel simulation
- public/shared territory
- Generated Universe rendering as real world geometry
- autonomous expedition operations
- Atlas-owned execution

The closest current "outside the base" visuals are visual-only route/actor projections from server state: scout/messenger behavior, Settler Convoy route projection, outpost keeper, civic routekeeper, and oracle adjunct. They make the base feel connected to a wider world, but they are not authority.

## Decisive Recommendation

Build the next playable layer as:

**Civilization-style private strategic expansion on top, Origin Trails / Oregon Trail-style expeditions as bounded missions/events, and light Heroes-style named operator flavor for parties.**

Do not make it a full Oregon Trail game. Do not make it a full Heroes of Might and Magic adventure map. Do not jump to a public shared Civilization world. The current server model wants a **private/local strategic map** first: a small owner-scoped grid around the home plot, revealed through explicit expedition receipts, where sectors become Site Plans, claims, outposts, civic markers, and later routes.

The strongest product shape is:

- **Civilization layer:** a private World Grid map with revealed sectors, known resources, risks, outposts, and civic readiness.
- **Expedition layer:** bounded missions from the Expedition Board that reveal or update one sector at a time.
- **Operator layer:** named scouts/settlers/routekeepers add party flavor and story receipts, but they do not become autonomous agents with hidden authority.
- **Receipt layer:** every reveal, hazard, claim, outpost, inspection, and civic action is server-owned, idempotent, auditable, and approval-gated for agent callers.
- **Fog-of-war layer:** local/private by default, never public truth until a future explicit sharing/redaction slice.

## Why This Fits The Current Game

The current implementation already points here:

- `SCOUT` reports are deterministic nearby-site receipts, not loose narrative text.
- Site Plans turn reports into canonical planning records without claiming land.
- Settler Convoy creates a claim, timed travel, and one outpost only after explicit founding.
- World Grid reads existing server facts and is intentionally read-only.
- Civic proposals and overlay packs distinguish advisory/presentation records from gameplay truth.
- Civic Projects and HQ11 inspections show the correct promotion pattern: one narrow server-owned effect, receipt, read-model update, and non-executable Atlas metadata.
- Visual actors are already used correctly as projections of real state, not state creators.

The next layer should extend that pattern, not replace it with a renderer-first world.

## Recommended Post-HQ11 Shape

### Map / Exploration Model

Add a new server-owned private map model:

- Home plot sits at `(0, 0)`.
- Outposts get coordinates from their originating claim or sector.
- The first playable radius should be tiny: 3x3 or 5x5 around home.
- Each sector has stable deterministic metadata, but most of it is hidden until revealed.
- Sector records are owner-scoped, not public.
- The map should be a read/write gameplay surface only through explicit routes/tools, not through Atlas graph interactions.

Suggested sector fields:

```text
founder_world_sectors
- sector_id TEXT PRIMARY KEY
- owner_pair_id TEXT NOT NULL
- origin_plot_id TEXT NOT NULL
- x INTEGER NOT NULL
- y INTEGER NOT NULL
- status TEXT NOT NULL              -- HIDDEN, SCOUTED, PLANNED, CLAIMED, OUTPOST
- terrain TEXT NOT NULL             -- woodland_ridge, river_flat, ruin_signal, etc.
- risk TEXT NOT NULL                -- low, medium, high, unknown
- resource_hints_json TEXT NOT NULL
- hazard_hints_json TEXT NOT NULL
- traits_json TEXT NOT NULL
- source_report_id TEXT
- site_plan_id TEXT
- settlement_claim_id TEXT
- founded_plot_id TEXT
- visibility_json TEXT NOT NULL
- receipt_json TEXT NOT NULL
- created_at INTEGER NOT NULL
- updated_at INTEGER NOT NULL
```

This should initially mirror the existing Scout Report / Site Plan / Settlement Claim facts rather than inventing a second truth source. In the first slice, a Scout Report can reveal or update one sector. A reviewed Site Plan can link that sector to claim-ready planning. A founded outpost can mark the sector as `OUTPOST`.

### Fog Of War

Fog should be **private/local, server-owned, and conservative**.

Use sector visibility states:

- `HIDDEN`: known only as unrevealed terrain silhouette; no exact resource/risk facts.
- `SCOUTED`: Scout Report revealed terrain, risk, traits, and resource hints.
- `PLANNED`: Site Plan exists.
- `CLAIM_READY`: HQ6 review completed.
- `CONVOY_ACTIVE`: Settler Convoy claim is preparing/arrived.
- `OUTPOST`: founded player-owned outpost exists.

Do not render public fog-of-war yet. Do not sync it across players. Do not let Generated Universe overlays create revealed sectors. Overlay packs can style known nodes later, but they must not create knowledge.

### Expedition Missions

Expeditions should feel like Origin Trails / Oregon Trail in bounded packets:

- one mission card
- one operator/party assignment
- one cost
- one duration
- one destination sector or direction
- one result receipt
- one possible hazard/event outcome

First mission types:

- `SCOUT_SECTOR`: reveal one adjacent hidden sector.
- `RESURVEY_SECTOR`: improve confidence on an already scouted sector.
- `TRACE_APPROACH`: add safer convoy path metadata to a planned sector, with no route/trade creation.

Do not add continuous travel simulation yet. The Expedition Board can run a timed job and create a receipt, exactly like current `SCOUT`.

### Named Operators / Party Flavor

Use light Heroes-style flavor without Heroes-style tactical play.

Operators should be named party members attached to an expedition receipt:

- Pathfinder Scout: reads terrain and records first visibility.
- Settler Convoy Crew: handles founding travel.
- Outpost Keeper: tends founded outposts.
- Civic Routekeeper: marks local civic readiness.
- Oracle Adjunct: interprets World Grid signals.

Operator fields should stay presentation/read-model oriented at first:

```text
party: {
  operatorIds: ["pathfinder_scout"],
  displayNames: ["Mira Trailmark"],
  roles: ["scout"],
  visualOnly: true
}
```

Do not add leveling, equipment, combat, inventory, or autonomous behavior yet. Named operators give receipts a face and make expeditions feel alive, but authority remains in the server route/tool.

### Outposts

Current outposts are real but shallow. Keep the next outpost layer simple:

- outpost belongs to the same owner pair through `founder_plot_memberships`
- outpost appears on the private sector map
- outpost stores inherited site metadata: terrain, risk, traits, resource hints
- outpost starts as HQ1 with limited local loop
- outpost can be read as a plot, but broad UI plot switching remains a separate lane

Do not make outposts trade with home yet. Do not create route economics. Do not create public territory.

### Hazards / Resources

Hazards should be receipt metadata first, mechanics second.

Initial hazard/resource model:

- resource hints: `wood`, `stone`, `food`, `coin`
- terrain traits: `wood-rich`, `water access`, `old road`, `signal marker`
- hazards: `flood_watch`, `rough_grade`, `old_signal_unknown`
- risk: `low`, `medium`, `high`, `unknown`
- confidence: `low`, `medium`, `high`

First mechanical effect should be tiny and local:

- A successful `RESURVEY_SECTOR` may improve confidence.
- A `TRACE_APPROACH` receipt may reduce a future Settler Convoy duration by a small fixed amount for that one sector.

Do not let hazards damage buildings, consume random resources, kill operators, or block the base loop in the first slice.

### Approvals / Receipts

Use the existing authority pattern:

- Human callers can run explicit expedition actions.
- Agent callers require matching human approval.
- Mutations require idempotency keys.
- List/read routes return empty `worldDelta`.
- Every successful mutation writes an event and receipt.
- Atlas action refs remain `executableByAtlas: false`.
- UI buttons call only explicit server routes.

Receipts should include negative boundary fields like the HQ11 inspection receipts:

```text
resourceDelta
routeCreation: false
tradeRouteCreation: false
backgroundScheduling: false
externalEffects: false
atlasExecution: false
publicSharing: false
crossPlotMutation: false
generatedUniverseRendering: false
```

## First Minimal Vertical Slice

Build **HQ12A Private Sector Map + Scout Sector Reveal**.

This is the smallest slice that makes the player feel like the world exists beyond the base without creating public world complexity.

### Server-Owned Records

Add:

```text
founder_world_sectors
founder_expedition_missions
```

`founder_world_sectors` stores private owner-scoped fog and sector facts.

`founder_expedition_missions` stores one completed or running mission envelope:

```text
- mission_id TEXT PRIMARY KEY
- plot_id TEXT NOT NULL
- owner_pair_id TEXT NOT NULL
- mission_type TEXT NOT NULL          -- SCOUT_SECTOR only in v1
- status TEXT NOT NULL                -- RUNNING, COMPLETED
- target_sector_id TEXT
- direction TEXT                      -- north, east, south, west, etc.
- cost_json TEXT NOT NULL
- duration_ms INTEGER NOT NULL
- party_json TEXT NOT NULL
- result_json TEXT NOT NULL
- receipt_json TEXT NOT NULL
- authority_boundary TEXT NOT NULL
- created_by TEXT NOT NULL
- approved_by TEXT
- created_at INTEGER NOT NULL
- updated_at INTEGER NOT NULL
```

First authority boundary:

```text
server_owned_private_sector_reveal_no_public_world_v1
```

### Engine / Read Model

Add:

- `worldSectorReadModel(bundle)`
- `expeditionMissionReadModel(bundle)`
- `revealWorldSector(...)`
- `completeExpeditionMission(...)` only if using a timed job envelope

The read model should expose:

```text
worldSectors: {
  status: "LOCKED" | "AVAILABLE",
  authorityBoundary,
  mapRadius,
  home: { x: 0, y: 0, plotId },
  sectors: [...],
  fog: {
    hiddenCount,
    scoutedCount,
    plannedCount,
    outpostCount
  },
  nextAvailableMissionTypes: ["SCOUT_SECTOR"],
  prohibitedCapabilities: [...]
}
```

### Routes

Add only:

- `GET /api/founders-plot/world-sectors`
- `POST /api/founders-plot/expeditions/scout-sector`

The list route is read-only.

The scout route:

- requires HQ11 baseline civic readiness or a current simpler prerequisite such as HQ6 + Expedition Board ready
- accepts `plotId`, `direction` or `targetSectorId`, `actor`, `idempotencyKey`
- validates adjacency and unrevealed/eligible target
- spends a small bounded cost or uses existing `SCOUT` cost
- writes mission + sector receipt
- does not create Site Plan automatically in v1
- does not create route/trade/public world state

### Tools

Add:

- `et.plot.list_world_sectors`
- `et.plot.scout_world_sector`

Tool specs should state:

- private map only
- one sector reveal only
- agent callers require matching approval
- no public sharing, trade, route creation, scheduler, Atlas execution, Generated Universe rendering, or autonomous operations

### UI

Add a compact `World Map` or `Frontier Map` panel in Founders Plot:

- 3x3 private sector grid
- home plot at center
- hidden sectors shown as fogged cells
- scouted sectors show terrain/risk/resource hints
- outpost sector badge if linked to founded plot
- one `Scout Sector` action for an adjacent hidden cell
- latest expedition receipt row
- named operator strip for the assigned scout

Do not make it a full-screen world game yet. Keep it in the operational Founders Plot surface so it feels like the next layer of the existing game.

### Progression Atlas

Add canonical nodes:

- `world_grid.private_sector_map`
- `expedition.scout_sector`
- `world_sector.<sectorId>`
- `expedition_mission.<missionId>`

Action refs are metadata-only:

```text
tool: et.plot.scout_world_sector
executableByAtlas: false
```

### Proofs

Required report artifacts:

- `reports/agent-town-hq12a-private-sector-map-proof-2026-06-01.json`
- `reports/agent-town-hq12a-private-sector-map-ui-desktop-2026-06-01.png`
- `reports/agent-town-hq12a-private-sector-map-ui-mobile-2026-06-01.png`
- `reports/agent-town-hq12a-private-sector-map-atlas-proof-2026-06-01.png`

Proof JSON should show:

```text
beforeHiddenCount
afterHiddenCount
afterScoutedCount
worldDeltaTypes: ["WORLD_SECTOR_SCOUTED"]
mission.missionType: "SCOUT_SECTOR"
sector.status: "SCOUTED"
sector.visibility.privateToOwner: true
inventoryChangedOnlyByCost: true
sitePlansUnchanged: true
settlementClaimsUnchanged: true
ownedPlotsUnchanged: true
routesUnchanged: true
tradeUnchanged: true
publicSummaryUnchangedExceptCounts: true
atlasActionExecutable: false
generatedUniverseRendering: false
publicSharing: false
externalEffects: false
```

### Tests

Server unit tests:

- locked before prerequisite
- rejects non-adjacent sector
- rejects unknown target sector
- first scout reveals one hidden sector
- repeat idempotency returns same mission/sector
- different key for same target returns existing reveal safely or a clear duplicate result
- agent caller requires matching approval
- no Site Plan, Settlement Claim, route, trade, civic project, public share, or Atlas mutation

Contract tests:

- `et.plot.list_world_sectors`
- `et.plot.scout_world_sector`
- result schema includes sector, mission, receipt, read model, world delta

HTTP tests:

- `GET /world-sectors` read-only with empty `worldDelta`
- `POST /expeditions/scout-sector` writes `WORLD_SECTOR_SCOUTED`
- foreign plot/sector access rejected
- agent approval path enforced

Scene-state tests:

- scouted sector can project a visual-only frontier marker if desired
- scout operator projection remains visual-only
- no map cell becomes a trade route/path authority object

Playwright tests:

- private map panel appears after prerequisite
- hidden/scouted/outpost cells render
- scouting one adjacent cell updates the grid and receipt row
- 390px mobile has no horizontal overflow
- no public/share/route/trade/Generated Universe render controls appear

Atlas tests:

- private sector map nodes visible
- mission receipt nodes visible
- action refs are non-executable
- private strategy/editor saves cannot reveal sectors

## What Not To Do Yet

Do not implement these in the next slice:

- **Public sharing:** no shared world, published fog, external map URL, public territory, or social reveal.
- **Real Generated Universe rendering:** overlay packs may style known records later; they must not create sectors, reveal fog, or render authoritative world geometry.
- **Autonomous operations:** no background expeditions, scheduler, cron, idle exploration, or agent-running missions without explicit approval.
- **Route/trade economy:** no trade routes, route capacities, caravan economics, pathfinding authority, or inter-plot logistics.
- **Atlas execution:** Atlas can explain and show metadata only; it cannot scout, reveal, claim, found, inspect, or run expeditions.
- **Combat / survival punishment:** no operator death, random resource loss, hostile encounters, or fail states that derail the base loop.
- **Full plot switching:** keep outpost summaries and map links separate unless a dedicated plot-switching lane owns the UX and access tests.
- **Generic expedition executor:** no arbitrary mission JSON, custom scripts, hidden tool runner, or editor-authored mission effects.

## Implementation Sequence

### Lane 1 - HQ12A Private Sector Map Core

Owns:

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

- private sector records
- `list_world_sectors`
- `scout_world_sector`
- one-sector reveal receipt
- no public/shared world

### Lane 2 - Founders Plot Frontier Map UI

Owns:

- `public/experiences/founders-plot/index.html`
- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`

Deliver:

- 3x3 fog grid
- Scout Sector action
- expedition receipt row
- named operator strip
- desktop/mobile proofs

### Lane 3 - Atlas And Read-Only Strategy Projection

Owns:

- `server/founders_plot/progression_atlas.js`
- `public/progression-atlas.js`
- `public/progression-atlas.css`
- `e2e/114_progression_atlas_openclaw_lite.spec.js`

Deliver:

- private map/sector/mission nodes
- non-executable action refs
- receipt visibility
- adversarial proof that private editor proposals cannot reveal fog

### Lane 4 - Expedition Flavor And Visual-Only Scene Cues

Owns:

- `server/founders_plot/engine.js` visual actor descriptors only if backed by mission/sector state
- `public/experiences/founders-plot/scene_state.js`
- sprite metadata if existing scout/routekeeper/outpost assets need row mapping
- `tests-founders-plot/fp-scene-state.test.js`

Deliver:

- scout/routekeeper/outpost cue projections from real state
- visual-only proof
- no actor authority

### Lane 5 - Outpost Link / Plot-Switching Decision Report

Report-first lane only unless explicitly promoted.

Decide whether the next UI step should be:

- open an outpost as a separate plot view using existing `plotId` membership gates
- keep outposts summarized on the strategic map
- or add a compare/inspect panel before true switching

This should not be folded into the first fog-of-war slice.

## Product Call

The next stage should answer Robin's question this way:

**After HQ11, the player should leave the base by revealing and acting on a private strategic frontier map. The moment-to-moment expedition feel should come from bounded Oregon-Trail-style mission receipts and named operators, while the strategic structure should be Civilization-like expansion from home to outposts.**

This keeps the promise of a bigger world while staying compatible with the current Agent Town authority model: server-owned facts, explicit user action, approvals for agents, receipts for memory, Atlas as explanation, and fog-of-war as private local knowledge until a later public-world slice earns it.
