# AgentTown HQ7 Settler Convoy / Second Plot Implementation Plan

Date: 2026-05-30
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Mode: codebase/product exploration only. No gameplay or source files were edited.

## Executive Recommendation

Build HQ7 as a narrow, playable "claim one reviewed Site Plan with one settler convoy" slice. Do not introduce a general territory map, world grid, multiple convoy types, public sharing, Generated Universe rules, or autonomous multi-step agent expansion yet.

The slice should produce this player story:

1. The player has a collected Scout Report.
2. HQ6 has promoted one Site Plan to reviewed/claim-ready planning state.
3. In Founders Plot, the player selects that claim-ready Site Plan and prepares a Settler Convoy.
4. The convoy spends resources, runs as a timed job from the origin plot, and appears as a visual-only route leaving Founders Plot.
5. When the convoy arrives, the player explicitly founds a second plot.
6. The server creates a second plot record, links it to the originating claim, emits receipts, and the UI lets the player switch between the home plot and the new outpost.

The important product boundary: HQ7 creates a second player-owned plot, not territory simulation. The second plot can initially be a starter outpost with HQ level 1 and the existing 3x3 grid model. Local site traits should be visible and persisted, but should not modify production until a later specialization slice promotes those effects.

## Current System Facts

Inspected implementation points:

- Store: `server/founders_plot/store.js`
- Engine: `server/founders_plot/engine.js`
- Routes: `server/founders_plot/routes.js`
- Tool specs: `server/founders_plot/tools.js`
- Atlas graph: `server/founders_plot/progression_atlas.js`
- Founders Plot UI: `public/experiences/founders-plot/founders-plot.js`
- Scene projection: `public/experiences/founders-plot/scene_state.js`
- Tests: `tests-founders-plot/*.test.js`, `e2e/200_founders_plot.spec.js`, `e2e/214_founders_plot_threejs_playable_slice.spec.js`, `e2e/114_progression_atlas_openclaw_lite.spec.js`
- Relevant reports:
  - `reports/agent-town-scout-report-site-plan-slice-implementation-2026-05-30.md`
  - `reports/agent-town-next-slices-editor-vs-engine-boundary-2026-05-30.md`
  - `reports/agent-town-next-slices-graphics-ux-test-audit-2026-05-30.md`

Current constraints that matter for HQ7:

- `founder_plots.pair_id` is `UNIQUE`. The current store assumes one primary plot per identity when using `readPlotBundleByPairId`.
- `GET /api/founders-plot/state?plotId=...` can read by plot id first, then only verifies that the returned bundle matches the requested plot id. Multi-plot access control should be fixed before plot switching exposes second plot ids.
- All current gameplay mutations use `withIdempotency`, record events, build a state response, and write an idempotency record per `(plot_id, action_name, idempotency_key)`.
- Agent-sensitive actions use policy checks or explicit approval records in `founder_approvals`.
- Scout Reports and Site Plans are JSON arrays on the primary plot row. Site Plans currently have `promotionStatus: "draft"` and `authorityBoundary: "requires_engine_promotion_for_settlement"`.
- Progression Atlas canonical action refs are metadata only: `executable: false`, `executableByAtlas: false`.
- Scene actors are visual projections from server state and are marked `visualOnly: true`. They do not mutate gameplay.

## Minimal Engine Model

### Design Shape

Use two new server-owned concepts:

- **Settlement Claim**: the canonical expansion record that binds one claim-ready Site Plan to one timed convoy and, eventually, one founded plot.
- **Plot Membership**: an ownership/access table that tells the engine which plot ids belong to the current player identity.

Keep actual per-plot gameplay in the existing `founder_plots`, `founder_buildings`, `founder_jobs`, `founder_event_log`, and policy tables. A second settlement can reuse the existing plot bundle model once created.

This avoids inventing a territory engine while still making "second plot" real.

### Settlement Claim Statuses

Recommended statuses:

- `CLAIM_READY`: HQ6-reviewed Site Plan is eligible for convoy preparation.
- `CONVOY_PREPARING`: resources were spent and the convoy job is running.
- `CONVOY_ARRIVED`: timed convoy job completed; second plot can be founded.
- `FOUNDED`: second plot exists and is linked to this claim.
- `REJECTED`: human rejected or cancelled before founding.

Do not use `RESERVED` unless a later world-map coordinate system exists. For this slice, a Site Plan is eligible or founded; it does not reserve public territory.

### Convoy Cost and Duration

Use explicit engine constants, not editor draft gates:

```js
const SETTLER_CONVOY_DEF = Object.freeze({
  unlockHqLevel: 7,
  requiresSitePlanPromotionStatus: 'claim_ready',
  cost: { wood: 32, food: 20, stone: 12, coin: 8 },
  durationMs: 180_000,
  output: { settlement_claim: 1 }
});
```

If HQ levels still stop at HQ5 while HQ6 is under review, this can be temporarily gated by claim-ready Site Plan state rather than an actual `hqLevel >= 7` check. The Atlas can still label it HQ7, but the engine rule should be one named function:

```js
function canPrepareSettlerConvoy(bundle, sitePlan) {
  return sitePlan.promotionStatus === 'claim_ready';
}
```

When real HQ6/HQ7 upgrade rules land, add the level requirement inside this function without rewriting the route surface.

### Second Plot Creation

When founding succeeds:

- Create a new `founder_plots` row using the existing initial plot shape, but with:
  - `plotKind: "OUTPOST"` if a column exists, or a linked metadata row if not.
  - starter inventory lower than the home plot, for example `{ wood: 8, stone: 0, food: 8, coin: 4 }`.
  - `hqLevel: 1`, one HQ building, existing pads.
  - site metadata copied from the Site Plan into claim/plot metadata, not into production formulas yet.
- Add a membership row linking the real player `pairId` to the new `plotId`.
- Update the Settlement Claim with `foundedPlotId`, `status: "FOUNDED"`, `foundedAt`.
- Emit event log entries on both origin and child plots:
  - origin: `SETTLER_CONVOY_FOUNDED`
  - child: `PLOT_CREATED_FROM_CONVOY`

Do not consume the Scout Report or delete the Site Plan. Instead, mark the Site Plan as linked/claimed if it still lives in JSON:

```json
{
  "promotionStatus": "claimed",
  "claimId": "claim_...",
  "foundedPlotId": "plot_..."
}
```

## Proposed Store Additions

### New Table: `founder_settlement_claims`

```sql
CREATE TABLE IF NOT EXISTS founder_settlement_claims (
  claim_id TEXT PRIMARY KEY,
  owner_pair_id TEXT NOT NULL,
  origin_plot_id TEXT NOT NULL,
  site_plan_id TEXT NOT NULL,
  report_id TEXT NOT NULL,
  founded_plot_id TEXT,
  convoy_job_id TEXT,
  approval_id TEXT,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  focus TEXT NOT NULL,
  site_type TEXT NOT NULL,
  risk TEXT NOT NULL,
  traits_json TEXT NOT NULL DEFAULT '[]',
  resource_hints_json TEXT NOT NULL DEFAULT '{}',
  route_json TEXT NOT NULL DEFAULT '{}',
  cost_json TEXT NOT NULL DEFAULT '{}',
  receipt_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  convoy_started_at INTEGER,
  convoy_ends_at INTEGER,
  founded_at INTEGER
);
CREATE INDEX IF NOT EXISTS founder_settlement_claims_owner_idx
  ON founder_settlement_claims (owner_pair_id, status, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS founder_settlement_claims_plan_unique_idx
  ON founder_settlement_claims (origin_plot_id, site_plan_id)
  WHERE status IN ('CLAIM_READY', 'CONVOY_PREPARING', 'CONVOY_ARRIVED', 'FOUNDED');
```

### New Table: `founder_plot_memberships`

```sql
CREATE TABLE IF NOT EXISTS founder_plot_memberships (
  pair_id TEXT NOT NULL,
  plot_id TEXT NOT NULL,
  role TEXT NOT NULL,
  origin_claim_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (pair_id, plot_id)
);
CREATE INDEX IF NOT EXISTS founder_plot_memberships_plot_idx
  ON founder_plot_memberships (plot_id, pair_id);
```

Membership roles:

- `HOME`
- `OUTPOST`

### Existing Table Changes

Avoid dropping the `founder_plots.pair_id UNIQUE` constraint in this slice. SQLite cannot drop that unique constraint cleanly without a table rebuild, and this branch already has many local/test DBs.

For second plots, use a synthetic unique `pair_id` value in `founder_plots`, such as:

```txt
settlement:<claimId>
```

Then enforce real access through `founder_plot_memberships`.

Optional additive columns on `founder_plots`:

```sql
ALTER TABLE founder_plots ADD COLUMN plot_kind TEXT NOT NULL DEFAULT 'HOME';
ALTER TABLE founder_plots ADD COLUMN origin_claim_id TEXT;
ALTER TABLE founder_plots ADD COLUMN site_profile_json TEXT NOT NULL DEFAULT '{}';
```

If avoiding table alteration, put `plotKind`, `originClaimId`, and `siteProfile` in a small `founder_plot_metadata` table instead. The table approach is cleaner if multi-plot will keep expanding.

### Migration Risks

- **Access control**: plot-id reads must check membership. Current `plotId` reads are not enough for a multi-plot switcher.
- **Unique `pair_id`**: do not try to insert a second plot with the same `pair_id`; it will violate the existing unique constraint.
- **JSON arrays on `founder_plots`**: updating `sitePlans` JSON to add `claimId`/`foundedPlotId` is acceptable for HQ7, but this will get awkward if many plans/claims accumulate.
- **Event logs**: events are plot-scoped. Founding should write origin and child events so both timelines explain what happened.
- **Idempotency scope**: founding writes multiple tables and creates a new plot. The whole mutation must run in one transaction before writing the idempotency record.

## Proposed Engine Functions

Add to `server/founders_plot/engine.js`:

```js
function listOwnedPlots({ pairId, houseId = null, nowMs }) {}

function prepareSettlerConvoy({
  pairId,
  houseId = null,
  plotId = null,
  sitePlanId,
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {}

function foundSettlement({
  pairId,
  houseId = null,
  plotId = null,
  claimId,
  actor = 'HUMAN',
  idempotencyKey,
  nowMs
}) {}
```

Internal helpers:

```js
function ensurePlotMembership({ pairId, plotId }) {}
function readOwnedPlotIds(pairId) {}
function normalizeSettlementClaims(value) {}
function buildSettlementClaimFromSitePlan(bundle, sitePlan, nowMs) {}
function markCompletedSettlerConvoyJob(bundle, claim, job, pendingEvents, nowMs) {}
function createSecondPlotFromClaim({ pairId, claim, nowMs }) {}
```

The existing `simulateBundleTo` loop should recognize `job.kind === 'SETTLER_CONVOY'` and mark the claim `CONVOY_ARRIVED`. The job should be associated with the origin plot's Expedition Board if one exists; otherwise reject preparation.

## Exact Route and Tool Names

### Read Routes

Add:

- `GET /api/founders-plot/plots`
  - Tool: `et.plot.list_plots`
  - Returns `homePlotId`, `activePlotId`, `plots`, and shallow claim/route summaries.
  - Read-only; no idempotency key.

Extend existing:

- `GET /api/founders-plot/state?plotId=<plotId>`
  - Must enforce `founder_plot_memberships(pairId, plotId)` before returning a private plot.
  - Include `ownedPlots`, `settlementClaims`, `activePlotId`, `homePlotId`.

### Mutation Routes

Add:

- `POST /api/founders-plot/prepare-settler-convoy`
  - Tool: `et.plot.prepare_settler_convoy`
  - Body:
    ```json
    {
      "plotId": "plot_home",
      "sitePlanId": "site_plan_scout_report_1_forest_ridge",
      "actor": "HUMAN",
      "idempotencyKey": "..."
    }
    ```
  - Creates or returns an existing active claim for the Site Plan.
  - Spends `SETTLER_CONVOY_DEF.cost`.
  - Creates a `founder_jobs` row with `kind: "SETTLER_CONVOY"`.
  - Emits `SETTLER_CONVOY_PREPARED`.
  - Human direct action is allowed.
  - Agent action requires matching human approval for `prepare_settler_convoy`.

- `POST /api/founders-plot/found-settlement`
  - Tool: `et.plot.found_settlement`
  - Body:
    ```json
    {
      "plotId": "plot_home",
      "claimId": "claim_...",
      "actor": "HUMAN",
      "idempotencyKey": "..."
    }
    ```
  - Requires claim `CONVOY_ARRIVED`.
  - Creates the second plot exactly once.
  - Emits `SETTLEMENT_FOUNDED` on origin and `PLOT_CREATED_FROM_CONVOY` on child.
  - Direct human action should show a confirm/approval UI.
  - Agent action requires matching human approval for `found_settlement`.

Do not add `et.plot.claim_site` yet unless there is a separate claim reservation state. In this slice, `prepare_settler_convoy` plus `found_settlement` is enough and avoids implying a broader territory system.

### Tool Spec Additions

Add to `FOUNDERS_PLOT_TOOL_SPECS`:

- `et.plot.list_plots`
- `et.plot.prepare_settler_convoy`
- `et.plot.found_settlement`

Result schemas should follow `worldDeltaResultSchema`, with extras:

```js
settlementClaim: { type: ['object', 'null'] }
ownedPlots: { type: 'array', items: { type: 'object' } }
foundedPlot: { type: ['object', 'null'] }
existing: { type: 'boolean' }
```

### Idempotency Rules

- Same action name + same `idempotencyKey` + same request returns the stored response.
- Same action name + same key + different request returns `IDEMPOTENCY_CONFLICT`.
- Preparing the same Site Plan with a different idempotency key should return the existing active/founded claim with `existing: true`, not create a duplicate.
- Founding the same arrived claim with a different idempotency key should return the already-created `foundedPlotId` with `existing: true`.

### Approval Boundaries

Use the existing approval table and hash matching:

- Agent `prepare_settler_convoy` requires `consumeActionApproval(bundle, 'prepare_settler_convoy', { sitePlanId })`.
- Agent `found_settlement` requires `consumeActionApproval(bundle, 'found_settlement', { claimId })`.
- Human founding should still use a visible confirm step because it creates a new plot, but it does not need to create a `founder_approvals` row unless the UI wants a uniform approval card.
- The Atlas must never execute either action from a canonical node. It can expose action refs only as non-executable metadata.

## Progression Atlas Canonical Graph

### New Canonical Node IDs

Generic/static nodes:

- `unit.SETTLER_CONVOY.prepare`
- `action.prepare_settler_convoy`
- `action.found_settlement`

Per Site Plan nodes:

- `planning.site_plan.<planSlug>.claim_ready`
- `settlement.claim.<planSlug>.prepare_convoy`

Per claim nodes:

- `settlement.claim.<claimSlug>.convoy`
- `settlement.claim.<claimSlug>.arrived`
- `settlement.claim.<claimSlug>.found`

Per founded plot nodes:

- `plot.outpost.<plotSlug>`

Receipt nodes:

- `receipt.settlement_claim.<claimSlug>`
- `receipt.second_plot_founded.<plotSlug>`

### New Canonical Edge IDs

Recommended edge flow:

- `planning.site_plan.<planSlug>->planning.site_plan.<planSlug>.claim_ready:promotes_plan_to_claim_ready`
- `planning.site_plan.<planSlug>.claim_ready->settlement.claim.<planSlug>.prepare_convoy:unlocks_convoy`
- `settlement.claim.<planSlug>.prepare_convoy->settlement.claim.<claimSlug>.convoy:creates_claim`
- `settlement.claim.<claimSlug>.convoy->settlement.claim.<claimSlug>.arrived:convoy_arrives`
- `settlement.claim.<claimSlug>.arrived->settlement.claim.<claimSlug>.found:unlocks_found_settlement`
- `settlement.claim.<claimSlug>.found->plot.outpost.<plotSlug>:creates_second_plot`
- `settlement.claim.<claimSlug>.found->receipt.settlement_claim.<claimSlug>:records_receipt`
- `settlement.claim.<claimSlug>.found->receipt.second_plot_founded.<plotSlug>:records_receipt`

### Action Refs

Add to `TOOL_HTTP`:

```js
'et.plot.list_plots': { method: 'GET', path: '/api/founders-plot/plots' },
'et.plot.prepare_settler_convoy': { method: 'POST', path: '/api/founders-plot/prepare-settler-convoy' },
'et.plot.found_settlement': { method: 'POST', path: '/api/founders-plot/found-settlement' }
```

Attach action refs:

- `settlement.claim.<planSlug>.prepare_convoy`
  - tool `et.plot.prepare_settler_convoy`
  - params template `{ sitePlanId, actor: "HUMAN", idempotencyKey: "$idempotencyKey" }`
  - `executable: false`
  - `executableByAtlas: false`

- `settlement.claim.<claimSlug>.found`
  - tool `et.plot.found_settlement`
  - params template `{ claimId, actor: "HUMAN", idempotencyKey: "$idempotencyKey" }`
  - `executable: false`
  - `executableByAtlas: false`
  - metadata `requiresHumanConfirmation: true`

### Receipt Refs

Extend `receiptRefs` generation beyond `records_receipt` from production collect:

```js
if (edge.kind === 'records_receipt') receiptRefs[edge.from].push(edge.to);
```

Then emit:

- `receiptRefs['settlement.claim.<claimSlug>.found'] = ['receipt.settlement_claim.<claimSlug>', 'receipt.second_plot_founded.<plotSlug>']`

### Atlas Summary Fields

Add:

```json
{
  "claimReadySitePlanCount": 1,
  "settlementClaimCount": 1,
  "outpostCount": 1,
  "activeConvoyCount": 0,
  "currentPlotId": "plot_...",
  "homePlotId": "plot_..."
}
```

### HQ10 Horizon Update

Once HQ7 lands, update future horizon semantics:

- HQ6: Settlement Charter, reviewed/claim-ready Site Plans.
- HQ7: Settler Convoy, second plot founding.
- HQ8: Research Lodge/doctrines.
- HQ9: Agent Cohorts/work orders.
- HQ10: World Grid/civic layer.

## Founders Plot Frontend and Plot Switching UX

### Header

Add a compact plot switcher next to the HQ/report/plan pills:

- Current label: `Founders Plot` or the outpost title.
- Dropdown/list: home plot plus founded outposts.
- Each row: title, HQ level, status, claim/site type chip.

Test IDs:

- `fp-plot-switcher`
- `fp-plot-option-<plotIdSlug>`
- `fp-active-plot-label`

When a user selects a plot:

- update URL query `?plotId=<plotId>`
- call `GET /api/founders-plot/state?plotId=<plotId>`
- rerender the existing 3x3 grid from that plot's bundle
- keep Atlas modal scoped to active plot but show `ownedPlots`

### Site Plans Panel

Extend Site Plan cards:

- `DRAFT`: existing copy, no claim button.
- `CLAIM_READY`: show "Prepare Settler Convoy".
- `CONVOY_PREPARING`: show convoy progress and route summary.
- `CONVOY_ARRIVED`: show "Found Settlement".
- `FOUNDED`: show "Open Outpost".

Test IDs:

- `fp-btn-prepare-convoy-<planIdSlug>`
- `fp-btn-found-settlement-<claimIdSlug>`
- `fp-btn-open-outpost-<plotIdSlug>`
- `fp-settlement-claim-<claimIdSlug>`

### New Side Panel: Settlement Claims

Add a small panel below Site Plans:

- no claims state
- active convoy state
- arrived/foundable state
- founded outpost summary

This keeps expansion legible without turning the main grid into a world map.

### Confirmation UX

Use a modal or approval card before founding:

- Title: `Found second plot?`
- Body: summarize Site Plan, route, cost already spent, and that a new plot will be created.
- Buttons: `Found Settlement`, `Cancel`

Do not bury this inside the Atlas. The founding action belongs to Founders Plot.

## Three.js Scene-State Projection

### Projection Principle

The scene must only project engine state. It should never derive or mutate claims from visuals.

Server state should expose:

```json
{
  "settlementClaims": [
    {
      "claimId": "claim_...",
      "originPlotId": "plot_home",
      "sitePlanId": "site_plan_...",
      "status": "CONVOY_PREPARING",
      "title": "Forest Ridge First Outpost",
      "route": {
        "routeId": "route_claim_...",
        "from": { "kind": "plot", "id": "plot_home" },
        "to": { "kind": "site_plan", "id": "site_plan_..." },
        "direction": "east",
        "progress": 0.42
      },
      "visualOnly": false
    }
  ]
}
```

`scene_state.js` should convert that into visual-only objects:

- `kind: "route"`
- `kind: "convoy"`
- `kind: "plot_marker"` for founded or prospective outpost

### New Actor Roles

Add canonical roles:

- `settler`
- `convoy`

Projection examples:

```js
{
  actorId: `actor:settler:settlement_claim:${claim.claimId}`,
  canonicalRoleId: 'settler',
  generatedOverlayRoleId: 'inhabitant.settler',
  sourceDomain: 'settlement_claim',
  sourceObjectId: claim.claimId,
  actionKind: claim.status === 'CONVOY_PREPARING' ? 'SETTLER_CONVOY' : 'SETTLEMENT_READY',
  visualState: claim.status.toLowerCase(),
  target: { kind: 'settlement_claim', id: claim.claimId },
  route,
  visualOnly: true
}
```

### Route Layout

Do not squeeze the second plot into the 3x3 grid.

Minimum projection:

- Origin plot remains primary.
- A route leaves the right or lower edge of the scene.
- The convoy moves along a short path toward a small outpost marker outside the build-pad area.
- Clicking visual actor/marker opens the Settlement Claims panel, not a mutation.

Scene objects:

- `WAY:HQ:SETTLEMENT_CLAIM:<claimId>`
- `ROUTE:settler:settlement_claim:<claimId>`
- `MARKER:SETTLEMENT_CLAIM:<claimId>`

### Visual Mutation Boundary

Click handling:

- convoy actor -> scroll/focus claim card
- route marker -> scroll/focus claim card
- founded outpost marker -> switch plot only through a normal UI action

No click on a Three.js object should call `prepare-settler-convoy` or `found-settlement` directly.

## Graphics, Units, Inhabitants, Sprites, and Stories

### Required Production Assets

For HQ7 to feel real:

- `public/experiences/founders-plot/assets/characters/inhabitants/settler/<settler-id>.png`
- matching JSON metadata
- `public/experiences/founders-plot/assets/objects/settler-convoy.webp`
- `public/experiences/founders-plot/assets/objects/claim-stake.webp`
- `public/experiences/founders-plot/assets/objects/outpost-marker.webp`
- `public/assets/icons/agent-town/settler-convoy-*.png`
- `public/assets/icons/agent-town/second-plot-*.png`
- `public/assets/icons/agent-town/settlement-claim-receipt-*.png`

Sprite sheet format should match current inhabitants:

- 4 columns x 4 rows
- 512 x 512 frames
- rows:
  - row 0: idle
  - row 1: walk
  - row 2: work/prepare
  - row 3: ready/celebrate

### New Character/Unit Roles

Recommended first named settler:

- **Mara Knotline**
  - Role: convoy lead / first settler
  - Visual: canvas coat, brass survey case, rolled Site Plan, red claim ribbon
  - Story: Mara does not "conquer" a site; she carries the town's consent trail. Her job is to make sure the new plot starts with a receipt, a plan, and a way back.
  - Sprite actions: idle with plan case, walking with pack, preparing claim stake, ready/arrival wave.

Recommended support unit:

- **Settler Convoy**
  - Role: unit/vehicle rather than citizen
  - Visual: small frontier-tech wagon with crates, lantern, rolled canvas, subtle circuit-inlay compass
  - States: preparing, en route, arrived, founded
  - Function: visual representation of the timed job and claim record.

Optional second inhabitant later:

- **Ila Wells**
  - Role: outpost steward after founding
  - Visual: simple field ledger, seed box, survey flags
  - Story: Ila appears on the second plot once founded and explains that local traits are promises to study, not automatic bonuses yet.

### Icon Registry Needs

Add global icon specs:

- `unit.settler_convoy`
- `action.prepare_settler_convoy`
- `action.found_settlement`
- `settlement.claim`
- `plot.outpost`
- `receipt.settlement_claim`
- `receipt.second_plot_founded`

These should get raster assets before or with the HQ7 slice. The current post-HQ3 lane already has symbol-only gaps for Expedition Board, scout, Scout Report, and Site Plan; HQ7 should not add another major lane that is only text initials.

## Tests Needed

### Unit Tests

Add to `tests-founders-plot/fp-unit.test.js` or a new focused unit file:

- `prepareSettlerConvoy` rejects missing Site Plan.
- `prepareSettlerConvoy` rejects `promotionStatus !== "claim_ready"`.
- `prepareSettlerConvoy` rejects missing Expedition Board.
- `prepareSettlerConvoy` deducts exact resources and creates one claim/job.
- `prepareSettlerConvoy` is idempotent for same key/same payload.
- preparing the same Site Plan twice returns existing claim, not duplicate.
- `foundSettlement` rejects before convoy arrival.
- `foundSettlement` creates exactly one second plot and membership after arrival.
- repeat `foundSettlement` returns existing founded plot.
- agent prepare/found without approval returns `FORBIDDEN_POLICY`.
- agent prepare/found with matching approval consumes approval and records `usedAt`.
- state hash remains deterministic with settlement claim summaries.

### HTTP Tests

Add to `tests-founders-plot/fp-http.test.js`:

- `GET /api/founders-plot/tools` returns the three new tool specs.
- `GET /api/founders-plot/plots` returns home plot for a fresh player.
- `GET /api/founders-plot/state?plotId=<ownedOutpost>` works after founding.
- `GET /api/founders-plot/state?plotId=<unownedPlot>` rejects after membership check.
- `POST /api/founders-plot/prepare-settler-convoy` covers happy path and idempotency.
- `POST /api/founders-plot/found-settlement` covers happy path and duplicate prevention.
- settlement founding writes origin and child plot events.
- public summary includes outpost count but does not leak private Site Plan details beyond existing policy.

### Scene-State Tests

Add to `tests-founders-plot/fp-scene-state.test.js`:

- active claim projects `settler` or `convoy` visual actor.
- convoy route and outpost marker are `visualOnly: true`.
- route leaves grid bounds visually but does not create build pads.
- actor click metadata points to settlement claims drawer, not a mutation route.
- founded outpost marker uses `plot_switch` drawer/action metadata only.
- sprite mapping resolves settler asset metadata.

### Atlas Tests

Extend `tests-founders-plot/fp-http.test.js` Atlas section:

- claim-ready Site Plan emits `planning.site_plan.<plan>.claim_ready`.
- available claim-ready Site Plan emits non-executable `et.plot.prepare_settler_convoy` action ref.
- active claim emits `settlement.claim.<claim>.convoy`.
- arrived claim emits `settlement.claim.<claim>.found` with non-executable `et.plot.found_settlement`.
- founded claim emits `plot.outpost.<plot>` and receipt refs.
- editor `canonicalProposal` for HQ7 remains advisory before engine nodes exist.

### E2E Tests

Extend `e2e/200_founders_plot.spec.js`:

- Build/seed to a claim-ready Site Plan.
- Prepare Settler Convoy from the Site Plan panel.
- Advance test time.
- Found settlement.
- See plot switcher and switch to outpost.
- Verify outpost has HQ/grid and does not share selected state incorrectly with home.

Extend `e2e/214_founders_plot_threejs_playable_slice.spec.js`:

- Active convoy renders a nonblank visual route and settler/convoy actor.
- Actor hooks expose `data-visual-only="true"`, `data-source-domain="settlement_claim"`, and no mutation endpoint.

Extend `e2e/114_progression_atlas_openclaw_lite.spec.js`:

- Atlas iframe shows HQ7 canonical nodes after engine implementation.
- HQ10 Horizon shows HQ7 as implemented/partially implemented once a second plot exists.
- Strategy saves with future HQ7 proposals do not mutate gameplay.

## Advisory vs Engine-Authoritative Boundary

### Advisory / Editor-Only

These remain safe for the Progression Atlas editor, Codex, generated packs, and private strategy JSON:

- alternate convoy costs
- site ranking explanations
- generated outpost descriptions
- generated icons before registry promotion
- Site Plan copy variants
- route/story prose
- character backstory drafts
- strategy steps proposing future settlement effects
- resource gate drafts with `gameplayAuthority: "strategy_editor_advisory"`
- `canonicalProposal` records with `authorityBoundary: "requires_engine_promotion"`

### Engine-Authoritative

These must only come from reviewed server/store/tool implementation:

- Site Plan claim readiness
- convoy cost and duration
- resource deduction
- claim status
- convoy job lifecycle
- second plot creation
- plot ownership/membership
- founded plot id
- event log and receipts
- plot switching access control
- any site trait mechanical effect
- any future specialization bonus
- all mutation idempotency responses

### Explicit Non-Goals for HQ7

- no public territory map
- no shared/global coordinates
- no Generated Universe gameplay rule changes
- no automatic production bonuses from Site Plan traits
- no autonomous agent founding without human approval
- no work-order executor
- no cross-plot trade routes
- no Civic Mind/World Grid mutation

## Recommended Implementation Order

1. Add membership/claim store tables and owner-check helpers.
2. Extend `getFoundersPlotState` and add `listOwnedPlots`.
3. Implement `prepareSettlerConvoy` with resources, idempotency, claim row, and timed job.
4. Implement convoy completion in simulation.
5. Implement `foundSettlement` as one transaction that creates child plot, membership, claim receipt, and events.
6. Add route/tool specs and docs.
7. Add Atlas canonical nodes/edges/action refs/receipt refs from engine state.
8. Add Founders Plot Site Plan/claim panel actions and plot switcher.
9. Add scene-state convoy/route/outpost projections as visual-only.
10. Add raster assets/sprites or at minimum wire placeholder ids with explicit asset TODOs.
11. Add unit/http/scene/e2e coverage.

## Top Risks

1. Multi-plot access control must be fixed before exposing plot switching.
2. `founder_plots.pair_id UNIQUE` makes naive second-plot insertion fail.
3. If Site Plan JSON becomes the source of all claim state, duplicate prevention and querying will become brittle.
4. Atlas action refs can make users think the Atlas executes gameplay; keep execution in Founders Plot UI/tools.
5. Convoy visuals can accidentally imply a world map; keep them as route projections until World Grid exists.

## Final Call

The clean HQ7 slice is:

- one claim-ready Site Plan
- one prepared settler convoy
- one arrived convoy
- one explicit found-settlement action
- one second plot in the existing plot engine
- one plot switcher
- visual-only convoy route and outpost marker
- canonical Atlas graph generated from engine state

That is enough to make expansion real while preserving the current architecture's best property: gameplay truth lives in the engine, and the Atlas/editor explains or proposes rather than silently mutating the world.
