# Agent Town HQ11 Civic Operations Backend Readiness Audit - 2026-05-31

## Scope

This is a report-only code-readiness audit for the next server-owned civic slice after HQ10D. It inspected the current HQ10/HQ10D civic project, World Grid, Progression Atlas, and overlay-pack implementation in the dirty shared worktree.

Boundaries for this audit:

- No source files were edited outside this report.
- No push, merge, deploy, cleanup, public post, external send, scheduler, or background work.
- UI and Atlas surfaces are treated as advisory unless promoted through server-owned Founders Plot contracts.
- The recommended lane stays conservative: no cross-plot mutation, no new economy, no arbitrary tools, no Atlas-owned execution, no public sharing, and no scheduler.

## Executive Summary

The current backend is ready for a small HQ11 follow-on, but only if HQ11 stays as an explicit server-owned civic project operations loop on existing same-plot civic projects.

Recommended next slice: **HQ11A Civic Project Operations V1**.

The smallest safe lane is:

- Extend `founder_civic_projects` with bounded operations state.
- Add explicit manual mutations for progress, completion, and maintenance of already-activated same-plot `civic_beacon` projects.
- Keep `civic_beacon` as the only project type.
- Keep statuses narrow: `ACTIVE`, `COMPLETED`, `ARCHIVED`.
- Use existing `withIdempotency` and event-log patterns.
- Emit World Grid deltas for operation events only.
- Keep Atlas action refs metadata-only with `executableByAtlas: false`.

Do not introduce a scheduler, time-based decay, public sharing, cross-plot operations, route/trade creation, resources, generated rendering, or Atlas-owned execution in HQ11A.

## Exact Current Server-Owned Model And Lifecycle

Current civic server truth has four layers:

- HQ10A `worldGridReadModel`: read-only projection with `status: LOCKED|READ_MODEL_READY`, `readOnly: true`, `executableActions: []`, and readiness gates for HQ6, founded outpost, Survey Discipline, and bounded work-order execution.
- HQ10B `founder_civic_proposals`: persisted advisory records with `status: DRAFT|REVIEWED|ARCHIVED`, category, scope JSON, review JSON, actor/approval timestamps, and `authorityBoundary: server_owned_civic_proposal_record_no_execution_v1`.
- HQ10C `founder_overlay_packs`: persisted presentation-only records with `status: DRAFT|REVIEWED|ARCHIVED`, source proposal, surfaces/nodes/display hints/prompt/provenance JSON, `visualOnly: true`, `presentationOnly: true`, `gameplayMutationPolicy: presentation_only`, and `authorityBoundary: server_owned_generated_universe_overlay_pack_presentation_only_v1`.
- HQ10D `founder_civic_projects`: persisted local public-work records with `status: ACTIVE|ARCHIVED`, `projectType: civic_beacon`, effect JSON, receipt JSON, actor/approval timestamps, and `authorityBoundary: server_owned_civic_project_activation_local_public_work_v1`.

Current lifecycle:

1. A plot reaches HQ10A readiness through server-owned game progression; World Grid stays read-only.
2. A human, or approved agent, records a civic proposal. `REVIEWED` proposals are record-only and still cannot execute.
3. A human, or approved agent, may create overlay-pack records from reviewed proposals; these are presentation metadata only and excluded from stable gameplay hash.
4. A human, or approved agent, activates one same-plot reviewed proposal into a `civic_beacon` civic project. This writes server gameplay truth, creates a `CIVIC_PROJECT_ACTIVATED` event, stores a receipt, and adds a local readiness/morale marker. It still does not spend resources, create routes/trade, schedule work, share publicly, mutate other plots, or grant Atlas execution.
5. Re-using the same activation idempotency key returns the stored response. Activating the same source proposal with a different key returns the existing project with no new world delta.

## Current Implementation By File

### `server/founders_plot/engine.js`

Current civic constants are centralized at the top of the engine:

- `CIVIC_PROPOSAL_STATUSES = ['DRAFT', 'REVIEWED', 'ARCHIVED']`
- `CIVIC_PROPOSAL_CATEGORIES = ['coordination', 'public_work', 'route_study', 'civic_memory']`
- `OVERLAY_PACK_STATUSES = ['DRAFT', 'REVIEWED', 'ARCHIVED']`
- `CIVIC_PROJECT_STATUSES = ['ACTIVE', 'ARCHIVED']`
- `CIVIC_PROJECT_TYPES = ['civic_beacon']`
- `CIVIC_BEACON_EFFECT_ID = 'local_civic_beacon_v1'`

Relevant code: `server/founders_plot/engine.js:8-16`.

The HQ10B proposal model is normalized by `normalizeCivicProposals`, counted by `civicProposalCounts`, and exposed through `civicProposalsReadModel`. Proposal records are locked until `worldGridReadModel(...).civicReadiness.ready === true`. The read model exposes `proposalOnly`, `readOnlyExecution`, allowed statuses/categories, counts, and proposals.

Relevant code: `server/founders_plot/engine.js:653-719`.

The HQ10C overlay model is normalized by `normalizeOverlayPacks`, sanitized through presentation-only helpers, and exposed through `overlayPacksReadModel`. Overlay records require World Grid readiness and at least one same-plot `REVIEWED` proposal. They are explicitly presentation-only, visual-only, stable-gameplay excluded, non-rendering, non-public, and non-executable.

Relevant code: `server/founders_plot/engine.js:721-889`.

The HQ10D civic project model is normalized by `normalizeCivicProjects` and exposed through `civicProjectsReadModel`. Current project state is activation-only: a project is `ACTIVE` or `ARCHIVED`; `civic_beacon` is the only project type; active beacon effects expose `localCivicBeacon`, `activeBeaconCount`, `localReadinessDelta`, and `moraleMarkers`.

Relevant code: `server/founders_plot/engine.js:891-1015`.

`worldGridReadModel` is the key HQ10 read model. It gates readiness on:

- HQ6 Settlement Charter
- founded outpost
- `survey_discipline` selected
- bounded work-order executor available

It summarizes owned plots, settlement claims, doctrine, work orders, civic proposal counts, civic project counts, active beacon state, readiness score, morale markers, bounded capabilities, and prohibited capabilities.

Relevant code: `server/founders_plot/engine.js:1077-1250`.

Important current detail: `worldGridReadModel.civicReadiness.boundedCapabilities` already lists `local_civic_beacon_activation`, while `prohibitedCapabilities` still includes broad `civic_mutation`. That wording made sense in HQ10A, but after HQ10D it is now a bit too broad. HQ11 should either rename that guardrail to `unbounded_civic_mutation` or clearly keep it meaning "no arbitrary civic mutation."

The engine loads civic data into every plot bundle:

- `bundle.civicProposals`
- `bundle.overlayPacks`
- `bundle.civicProjects`

Relevant code: `server/founders_plot/engine.js:1763-1776`, `server/founders_plot/engine.js:1931-1934`.

`publicSummary` and `buildState` expose civic project fields in the state snapshot. `buildState` includes `worldGrid`, `civicProposals`, `overlayPacks`, and `civicProjects` in `state`.

Relevant code: `server/founders_plot/engine.js:2476-2597`.

The core mutation pattern is `withIdempotency`. It:

- verifies plot access
- requires `idempotencyKey`
- hashes `{ actionName, requestPayload }`
- returns the stored response for same-key/same-payload replay
- returns `IDEMPOTENCY_CONFLICT` for same-key/different-payload
- simulates current bundle time before mutation
- builds a mutation response with audit/world-delta state

Relevant code: `server/founders_plot/engine.js:3078-3129`.

HQ10A/HQ10B/HQ10C/HQ10D engine entrypoints are:

- `getWorldGridStatus`
- `listCivicProposalRecords`
- `createCivicProposalRecord`
- `listOverlayPackRecords`
- `createOverlayPackRecord`
- `listCivicProjectRecords`
- `activateCivicProject`

Relevant code: `server/founders_plot/engine.js:4185-4682`.

`activateCivicProject` currently:

- requires World Grid readiness
- requires same-plot `REVIEWED` proposal
- returns existing project if the same source proposal was already activated
- requires human approval for `actor: 'AGENT'`
- creates a `civic_project` record with `status: 'ACTIVE'`
- writes a receipt with route/resource/scheduler/external flags false
- emits `CIVIC_PROJECT_ACTIVATED`
- updates state, World Grid, public summary, and stable gameplay hash

Relevant code: `server/founders_plot/engine.js:4539-4682`.

### `server/founders_plot/store.js`

The store has persisted tables for:

- `founder_civic_proposals`
- `founder_overlay_packs`
- `founder_civic_projects`

`founder_civic_projects` currently has `project_id`, `plot_id`, `source_proposal_id`, `status`, `project_type`, `title`, `summary`, `effect_json`, `receipt_json`, `authority_boundary`, actor/approval fields, timestamps, and a unique index on `(plot_id, source_proposal_id)`.

Relevant code: `server/founders_plot/store.js:252-318`.

Prepared statements exist for listing, lookup, and upsert of proposal, overlay pack, and civic project rows.

Relevant code: `server/founders_plot/store.js:660-768`.

Hydrate/dehydrate helpers exist for proposal, overlay pack, and civic project rows. Civic projects currently hydrate `effect` and `receipt`, but no operations/progress state.

Relevant code: `server/founders_plot/store.js:1177-1311`.

Store accessors exist for:

- `listCivicProposalsByPlot`
- `getCivicProposal`
- `writeCivicProposal`
- `listOverlayPacksByPlot`
- `getOverlayPack`
- `writeOverlayPack`
- `listCivicProjectsByPlot`
- `getCivicProject`
- `getCivicProjectForProposal`
- `writeCivicProject`

Relevant code: `server/founders_plot/store.js:1549-1599`.

### `server/founders_plot/routes.js`

GET routes exist for:

- `/api/founders-plot/world-grid`
- `/api/founders-plot/civic-proposals`
- `/api/founders-plot/overlay-packs`
- `/api/founders-plot/civic-projects`

Relevant code: `server/founders_plot/routes.js:85-126`.

POST routes exist for:

- `/api/founders-plot/civic-proposals`
- `/api/founders-plot/overlay-packs`
- `/api/founders-plot/civic-projects/activate`

Relevant code: `server/founders_plot/routes.js:332-388`.

The route layer follows existing Founders Plot identity handling and sends error envelopes through `statusForErrorCode`.

### `server/founders_plot/tools.js`

Tool specs exist for read endpoints:

- `et.plot.get_world_grid_status`
- `et.plot.list_civic_proposals`
- `et.plot.list_overlay_packs`
- `et.plot.list_civic_projects`

Relevant code: `server/founders_plot/tools.js:95-164`.

Tool specs exist for mutations:

- `et.plot.create_civic_proposal`
- `et.plot.create_overlay_pack`
- `et.plot.activate_civic_project`

Relevant code: `server/founders_plot/tools.js:330-421`.

The schemas already enforce `idempotencyKey` on mutations and reject idempotency on read-only list tools through `additionalProperties: false`.

### `server/founders_plot/progression_atlas.js`

The Atlas HTTP map includes HQ10A/HQ10B/HQ10C routes, but it does not currently include:

- `et.plot.list_civic_projects`
- `et.plot.activate_civic_project`

The HQ10D action ref still has the tool spec and `executableByAtlas: false`, but its `http` metadata is `null`. This is not an execution bug, but it is an inspectability mismatch versus HQ10B/HQ10C and should be fixed before adding HQ11 operation refs.

Relevant code: `server/founders_plot/progression_atlas.js:184-205`, `server/founders_plot/progression_atlas.js:1535-1555`.

The Atlas compacts civic proposal, overlay pack, and civic project records for canonical graph nodes.

Relevant code: `server/founders_plot/progression_atlas.js:473-560`.

The gameplay stable hash includes civic proposals, civic projects, and World Grid state, but does not include overlay packs. That means overlay records remain presentation-only while civic project changes are gameplay truth.

Relevant code: `server/founders_plot/progression_atlas.js:814-887`.

HQ10 canonical nodes currently include:

- `world_grid.read_model`
- `world_grid.civic_readiness`
- `world_grid.civic_proposal_records`
- `generated_universe.overlay_pack_records`
- `world_grid.civic_project_activation`
- per-proposal nodes
- per-overlay-pack nodes
- per-civic-project nodes

All action refs are metadata-only with `executableByAtlas: false`.

Relevant code: `server/founders_plot/progression_atlas.js:3070-3517`, `server/founders_plot/progression_atlas.js:3555-3572`.

### `specs/02_api_contract.md`

The API contract documents:

- HQ10B civic proposal records
- HQ10C overlay pack records
- HQ10D civic project activation

The HQ10D contract states the correct boundaries: same-plot `REVIEWED` proposal, activation unique per proposal, local `civic_beacon` readiness/morale only, no spending/routes/trade/scheduler/public/Atlas execution/external effects, and agent approval required.

Relevant code: `specs/02_api_contract.md:2143-2402`.

### `tests-founders-plot/fp-unit.test.js`

Unit tests cover:

- HQ10A read-only World Grid readiness and no audit event
- HQ10B civic proposal gating, proposal-only state, idempotency, agent approval, same-plot related plot filtering
- HQ10C overlay pack gating, presentation-only behavior, stable gameplay hash exclusion, no event, agent approval
- HQ10D activation gating, same-plot reviewed proposal requirement, local effect, event delta, public summary and World Grid updates, stable gameplay hash change, idempotent replay, duplicate source handling, agent approval

Relevant code: `tests-founders-plot/fp-unit.test.js:1269-1860`.

### `tests-founders-plot/fp-http.test.js`

HTTP tests cover:

- `/api/founders-plot/world-grid`
- `/api/founders-plot/civic-proposals`
- `/api/founders-plot/overlay-packs`
- `/api/founders-plot/civic-projects`
- `/api/founders-plot/civic-projects/activate`
- Progression Atlas visibility and non-executable action refs

Relevant code: `tests-founders-plot/fp-http.test.js:1362-1761`.

### `tests-founders-plot/fp-contract.test.js`

Contract tests cover:

- all current mutation specs require `idempotencyKey`
- read-only HQ10 list/status schemas reject mutation idempotency keys
- HQ10B/HQ10C/HQ10D args schemas validate narrow shapes
- read/list envelopes conform to result schemas

Relevant code: `tests-founders-plot/fp-contract.test.js:137-361`.

### `public/experiences/founders-plot/index.html`

The UI has panels for:

- World Grid
- Civic Proposals
- Generated Universe Overlay Packs

It does not yet have a dedicated Civic Projects panel.

Relevant code: `public/experiences/founders-plot/index.html:155-178`.

### `public/experiences/founders-plot/founders-plot.js`

The Founders Plot browser code knows API routes for World Grid, civic proposals, and overlay packs, but not civic projects.

Relevant code: `public/experiences/founders-plot/founders-plot.js:20-32`.

It renders:

- World Grid readiness and guardrails
- civic proposal recording/listing
- overlay pack recording/listing
- browser-local overlay application preview

Relevant code: `public/experiences/founders-plot/founders-plot.js:665-824`, `public/experiences/founders-plot/founders-plot.js:825-1026`, `public/experiences/founders-plot/founders-plot.js:1030-1148`, `public/experiences/founders-plot/founders-plot.js:1150-1428`.

The overlay application is explicitly local browser UI state. It uses localStorage and does not send a mutation when applying or clearing a preview.

Relevant code: `public/experiences/founders-plot/founders-plot.js:2912-2935`.

State normalization includes `worldGrid`, `civicProposals`, `overlayPacks`, and lists, but not civic project API fallback logic. Since `state.civicProjects` is already emitted server-side, a future UI lane can use the base state without needing a backend change.

Relevant code: `public/experiences/founders-plot/founders-plot.js:2568-2648`.

### `public/experiences/founders-plot/scene_state.js`

Scene state projects server `visualActors` into visual-only scene objects. It carries `generatedOverlayRoleId`, but no civic project or civic beacon actors are emitted by the engine today.

Relevant code: `public/experiences/founders-plot/scene_state.js:736-900`.

No HQ11 backend slice should edit scene state unless the server deliberately emits a new visual actor role in a separate visual-only lane.

## Readiness Findings

### Ready

- The backend already has a clean persisted civic project table.
- Activation is server-owned and has idempotency, same-plot gates, human approval for agents, receipt data, event logging, World Grid deltas, public summary fields, and Atlas visibility.
- `civicProjects` is already included in `state`, World Grid, and gameplay stable hashes.
- Tests already prove that activation does not mutate inventory, jobs, settlement claims, routes, or overlay/server presentation state.
- Overlay records and local overlay application are isolated from gameplay truth.

### Needs Attention Before HQ11

- `server/founders_plot/progression_atlas.js` should add `TOOL_HTTP` entries for `et.plot.list_civic_projects` and `et.plot.activate_civic_project` before adding HQ11 action refs. Current metadata is safe but incomplete.
- `CIVIC_PROJECT_STATUSES` is activation-only. HQ11 needs `COMPLETED` if completion becomes server truth.
- `founder_civic_projects` has no operations/progress field. Do not overload `effect_json` or `receipt_json`; add a separate operations field.
- `worldGridReadModel.civicReadiness.prohibitedCapabilities` still says `civic_mutation` even though HQ10D allows one bounded server-owned civic mutation. HQ11 should tighten this to `unbounded_civic_mutation` or add clearer bounded/unbounded wording.
- There is no Founders Plot UI for civic projects yet. That is acceptable for a backend slice, but do not mistake the overlay UI for civic project execution.

## Gap And Risk Matrix

- Idempotency: Existing `withIdempotency` is strong for explicit mutations, and HQ10D duplicate-source handling prevents double activation. HQ11 risk is introducing multi-step progress without testing same-key replay, same-key conflict, duplicate completion, and maintenance replay.
- Receipts: HQ10D stores one activation receipt. HQ11 needs separate progress/completion/maintenance receipts or an operations receipt history; otherwise `receipt_json` becomes ambiguous and auditability weakens.
- World deltas: HQ10D emits `CIVIC_PROJECT_ACTIVATED`; HQ10C emits no gameplay delta. HQ11 must emit operation deltas only after successful state changes and no deltas on duplicate-source/no-op/read endpoints.
- Local readiness: Current score is capped at one active beacon. HQ11 needs explicit scoring caps so progress/completion cannot stack unbounded morale/readiness.
- Public summaries: Current `publicSummary` includes civic project count, active count, beacon active, and readiness score. HQ11 must add only summary-safe counts and avoid leaking proposal review text, prompt text, hidden operations notes, or public-share semantics.
- Atlas projection: Current HQ10D canonical action ref is safe but has `http: null` because `TOOL_HTTP` is missing civic-project mappings. Fix that metadata gap before adding HQ11 refs, while keeping every action ref non-executable.
- Tests: Unit/HTTP/contract coverage is solid through HQ10D, but there are no HQ11 operation tests yet. Add backend tests before UI. Do not rely on Playwright for server authority.
- Local UI readiness: The Founders Plot UI can list/create proposals and overlay packs, and can apply overlay previews locally. It cannot inspect or operate civic projects yet. Backend HQ11 can proceed without UI, but any demo flow will need a later dedicated civic-project panel.

## Recommended Minimal HQ11 Backend Lane

### Lane Name

`HQ11A Civic Project Operations V1`

### Product Behavior

Let the player explicitly operate an already-activated same-plot `civic_beacon` civic project.

The loop is manual and server-owned:

1. `progress` advances bounded operation progress by one step.
2. `complete` marks the project completed once enough progress exists.
3. `maintain` records a maintenance receipt on a completed project.

No time-based maintenance, no scheduler, no decay, no automatic operations.

### Data Fields

Add one field to `founder_civic_projects`:

```sql
operations_json TEXT NOT NULL DEFAULT '{}'
```

Use a lightweight migration for pre-existing DBs.

Normalize missing operations to:

```json
{
  "version": "civic_project_operations_v1",
  "progress": {
    "current": 0,
    "required": 3,
    "unit": "civic_work_step",
    "completedAt": null,
    "completedBy": null
  },
  "maintenance": {
    "count": 0,
    "lastMaintainedAt": null,
    "lastMaintainedBy": null
  },
  "readiness": {
    "activationDelta": 1,
    "completionDelta": 1,
    "maintenanceDelta": 0,
    "maxLocalReadinessScore": 2
  },
  "lastReceipt": null
}
```

Do not add resource costs or reward fields in HQ11A. If costs are ever added, they need a separate server-owned economy slice.

### Allowed Statuses

Update civic project statuses to:

```js
['ACTIVE', 'COMPLETED', 'ARCHIVED']
```

Semantics:

- `ACTIVE`: activated and eligible for progress.
- `COMPLETED`: required progress reached and completion receipt written.
- `ARCHIVED`: read-only retired record. HQ11A should not add an archive mutation unless explicitly requested.

Avoid `MAINTENANCE_DUE`, `FAILED`, `PAUSED`, or time-derived statuses in HQ11A. They imply scheduler/time semantics that are outside scope.

### Engine Functions

Add helpers:

- `normalizeCivicProjectOperations(value, projectType)`
- `civicProjectProgressReadModel(project)`
- `civicProjectOperationalReadiness(project)`
- `findCivicProjectForOperation(bundle, projectId)`

Add mutations:

- `advanceCivicProjectProgress({ pairId, houseId, plotId, projectId, actor, idempotencyKey, nowMs })`
- `completeCivicProject({ pairId, houseId, plotId, projectId, actor, idempotencyKey, nowMs })`
- `maintainCivicProject({ pairId, houseId, plotId, projectId, actor, idempotencyKey, nowMs })`

All three should call `withIdempotency`.

Gates:

- project must belong to the requested/current plot
- project type must be `civic_beacon`
- project must not be `ARCHIVED`
- progress requires `status === 'ACTIVE'`
- complete requires `status === 'ACTIVE'` and `progress.current >= progress.required`
- maintain requires `status === 'COMPLETED'`
- `actor: 'AGENT'` requires matching approval with the same action name and params

### Routes

Add:

- `POST /api/founders-plot/civic-projects/progress`
- `POST /api/founders-plot/civic-projects/complete`
- `POST /api/founders-plot/civic-projects/maintain`

Request shape:

```json
{
  "plotId": "<optional owned plot id>",
  "projectId": "civic_project_...",
  "actor": "HUMAN|AGENT",
  "idempotencyKey": "<stable caller key>"
}
```

No arbitrary operation text is needed for V1. If note text is later added, cap it and store it only in receipt/event metadata.

### Tool Names

Add tool specs:

- `et.plot.advance_civic_project_progress`
- `et.plot.complete_civic_project`
- `et.plot.maintain_civic_project`

Also add missing `TOOL_HTTP` mappings for current HQ10D:

- `et.plot.list_civic_projects` -> `GET /api/founders-plot/civic-projects`
- `et.plot.activate_civic_project` -> `POST /api/founders-plot/civic-projects/activate`

Then add HQ11 mappings:

- `et.plot.advance_civic_project_progress` -> `POST /api/founders-plot/civic-projects/progress`
- `et.plot.complete_civic_project` -> `POST /api/founders-plot/civic-projects/complete`
- `et.plot.maintain_civic_project` -> `POST /api/founders-plot/civic-projects/maintain`

Every new Atlas action ref must remain:

```json
{
  "executable": false,
  "executableByAtlas": false
}
```

### Audit And Idempotency Behavior

Use existing `withIdempotency` semantics:

- same key and same payload returns the stored response
- same key with different payload returns `IDEMPOTENCY_CONFLICT`
- missing key returns `INVALID_STATE`
- unauthorized plot returns `UNAUTHORIZED`

Emit events:

- `CIVIC_PROJECT_PROGRESS_ADVANCED`
- `CIVIC_PROJECT_COMPLETED`
- `CIVIC_PROJECT_MAINTAINED`

Event data should include:

- `projectId`
- `sourceProposalId`
- `projectType`
- `statusBefore`
- `statusAfter`
- `progress.current`
- `progress.required`
- `maintenance.count`
- `receipt`
- `authorityBoundary`
- explicit false flags for `resourceSpending`, `routeCreation`, `tradeRouteCreation`, `backgroundScheduling`, `externalEffects`, `publicSharing`, and `atlasExecution`

Do not emit events on failed validations.

### World Grid Changes

Update `worldGridReadModel` and `civicProjectsReadModel` with bounded operation fields:

- `civicProjects.completedCount`
- `civicProjects.progressReadyCount`
- `civicProjects.completionReadyCount`
- `civicProjects.maintenanceReadyCount`
- `civicProjects.operationsReadinessScore`
- `civicProjects.latestOperationProjectId`
- `civicReadiness.localProjectReadinessScore`
- `civicReadiness.moraleMarkers`
- `civicReadiness.boundedCapabilities`
- `civicReadiness.nextPromotableSlice`

Suggested readiness semantics:

- Active beacon from HQ10D keeps `activationDelta = 1`.
- Completed beacon adds at most one bounded operations readiness point.
- Maintenance does not stack readiness. It records ongoing care only.
- Cap local operations readiness at `2` for V1.

Suggested next-promotable slice values:

- `HQ11_CIVIC_PROJECT_PROGRESS`
- `HQ11_CIVIC_PROJECT_COMPLETION`
- `HQ11_CIVIC_PROJECT_MAINTENANCE`
- `HQ11_CIVIC_PROJECT_OPERATIONAL`

Suggested World Grid deltas:

- `CIVIC_PROJECT_PROGRESS_ADVANCED`
- `CIVIC_PROJECT_COMPLETED`
- `CIVIC_PROJECT_MAINTAINED`

### Progression Atlas Nodes

Add server-side canonical nodes only:

- `world_grid.civic_project_operations`
- `civic_project.<projectId>.progress`
- `civic_project.<projectId>.complete`
- `civic_project.<projectId>.maintain`

Edges:

- `world_grid.civic_project_activation -> world_grid.civic_project_operations`
- `world_grid.civic_project_operations -> civic_project.<id>.progress`
- `civic_project.<id>.progress -> civic_project.<id>.complete`
- `civic_project.<id>.complete -> civic_project.<id>.maintain`

Atlas nodes can expose metadata-only action refs to the new tools. Do not change public Atlas frontend behavior in HQ11A unless a separate UI lane is requested.

### Tests To Add

Unit tests in `tests-founders-plot/fp-unit.test.js`:

- locked before World Grid/project activation
- cannot progress missing/foreign/archived/completed project
- progress increments exactly one step
- same idempotency key replays stored response
- same idempotency key with different project conflicts
- complete fails before required progress
- complete transitions `ACTIVE -> COMPLETED`
- maintain fails before completion
- maintain increments maintenance count after completion without stacking readiness
- agent progress/complete/maintain require matching human approval
- inventory, jobs, settlement claims, overlay packs, routes, and plot memberships remain unchanged
- gameplay stable hash changes for progress/complete/maintain because civic project operations are server-owned truth

HTTP tests in `tests-founders-plot/fp-http.test.js`:

- new routes reject missing idempotency
- new routes validate same-plot ownership
- progress/complete/maintain responses include state, project, civicProjects read model, and expected world deltas
- Progression Atlas exposes HQ11 nodes/action refs with `executableByAtlas: false`
- `TOOL_HTTP` metadata is present for HQ10D and HQ11 action refs

Contract tests in `tests-founders-plot/fp-contract.test.js`:

- add new mutation specs to the idempotency-required list
- validate args schemas
- validate result schemas
- keep list/read tools rejecting mutation idempotency keys

No Playwright tests are required for HQ11A if the slice is backend-only. Add browser tests only when a Founders Plot UI lane is created.

## Recommended First Implementation Acceptance Criteria

- Store: `founder_civic_projects` gains `operations_json` through create-table and lightweight migration paths; hydrate/dehydrate round-trips existing rows with default operations.
- Engine: `advanceCivicProjectProgress`, `completeCivicProject`, and `maintainCivicProject` use `withIdempotency`, same-plot ownership checks, narrow status gates, and agent approval checks.
- Engine: progress increments by exactly one bounded step, completion transitions `ACTIVE -> COMPLETED` only when ready, and maintenance is allowed only after completion.
- Receipts: every successful HQ11 mutation writes a receipt with explicit false flags for resource spending, route/trade creation, background scheduling, public sharing, external effects, arbitrary tool execution, and Atlas execution.
- World Grid: read models expose bounded operations state and capped local readiness without changing settlement claims, owned plots, routes, jobs, doctrine, overlay packs, or inventory.
- Atlas: HQ10D `TOOL_HTTP` mappings are filled, HQ11 canonical nodes/action refs are metadata-only, and all HQ11 refs report `executable: false` and `executableByAtlas: false`.
- Tests: focused contract, unit, and HTTP tests pass for schema, idempotency, unauthorized plot rejection, duplicate/no-op behavior, world deltas, public summaries, stable hash changes, and Atlas non-execution.
- Verification: `git diff --check -- <touched files>` passes, including the implementation report/proof files.

## Likely Files To Touch

Backend and contracts:

- `server/founders_plot/store.js`
- `server/founders_plot/engine.js`
- `server/founders_plot/routes.js`
- `server/founders_plot/tools.js`
- `server/founders_plot/progression_atlas.js`
- `specs/02_api_contract.md`
- `public/experiences/founders-plot/tools.md`

Tests:

- `tests-founders-plot/fp-unit.test.js`
- `tests-founders-plot/fp-http.test.js`
- `tests-founders-plot/fp-contract.test.js`

Reports/proofs:

- `reports/agent-town-hq11-civic-project-operations-slice-2026-05-31.md`
- optional proof JSON under `reports/`

## Explicit Files To Avoid In HQ11A

Avoid frontend and visual surfaces unless the scope is changed:

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `public/experiences/founders-plot/index.html`
- `public/experiences/founders-plot/scene_state.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `public/experiences/founders-plot/three_scene_entry.js`
- `public/progression-atlas.js`
- `public/progression-atlas.css`
- `public/progression-atlas.html`
- `public/agent-town-icons.js`
- `server/agent_town_icons.js`
- asset directories under `public/assets/` and `public/experiences/founders-plot/assets/`
- `vendors/openclaw-lite-main/**`
- `public/openclaw-lite/**`
- `server/index.js`
- general landing page files such as `public/app.js` and `public/index.html`
- `e2e/200_founders_plot.spec.js` unless a UI lane is explicitly included

Avoid unrelated gameplay systems:

- settlement founding/claims logic
- route/trade mechanics
- resource economy and rewards
- work-order execution internals
- doctrine effects
- scheduler/background loops

## Explicit No-Go Areas

- Scheduler or background automation.
- Public sharing, publishing, external messaging, or external effects.
- Cross-plot mutation, including mutating other owned plots, settlement claims, memberships, routes, or outposts from civic operations.
- Route, trade, market, convoy, settlement founding, or work-order behavior changes.
- Arbitrary tool execution or dynamic operation payloads that can become tool runners.
- Resource spend, resource rewards, buffs, or economy changes unless a later slice defines a server-owned, bounded cost model with separate tests.
- Atlas execution, Atlas-owned mutation, executable Atlas action refs, or frontend-only promotion into gameplay truth.
- Generated Universe render execution or persistent overlay application authority.

## Authority Boundary For HQ11A

Suggested boundary string:

```text
server_owned_civic_project_operations_local_public_work_v1
```

Boundary rules:

- server-owned Founders Plot engine/store/routes/tools are authoritative
- operations mutate only the current plot's own civic project record
- operations do not mutate other owned plots or settlement claims
- operations do not create routes/trade, spend resources, add buffs, alter doctrine, found settlements, schedule background work, run arbitrary tools, render Generated Universe output, share publicly, or call external systems
- Atlas and UI may display metadata but cannot execute
- agent callers require matching human approval

## Final Recommendation

Proceed with HQ11 only as a backend-only civic project operations slice. The existing HQ10D activation record is a good anchor, and the current test stack is already shaped for this kind of additive server-owned mutation. Keep it manual, local, and receipt-backed.

The first implementation should be small enough to review in one pass:

1. Add `operations_json` and normalization.
2. Add progress/complete/maintain engine mutations with idempotency and audit events.
3. Update read models and Progression Atlas canonical metadata.
4. Add contract/unit/http tests.
5. Leave UI, scene, assets, scheduler, economy, and cross-plot systems untouched.

## Verification

Command run:

```bash
git diff --check -- reports/agent-town-hq11-civic-operations-backend-readiness-audit-2026-05-31.md
```

Output summary: passed with exit code 0 and no output.
