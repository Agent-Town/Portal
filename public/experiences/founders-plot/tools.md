---
name: founders-plot.tools
phase: 1
---

# Founders Plot — Tool Contract

All tools are exposed under `/api/founders-plot/tools/<name>` as POST. All
bodies are JSON, all responses are JSON. Every mutation tool requires an
`idempotencyKey` (UUID-shaped string) and returns `worldDelta`.

## Error codes

| code                   | retryable | meaning                                                     |
| ---------------------- | --------- | ----------------------------------------------------------- |
| `UNAUTHORIZED`         | false     | Session not attached to a plot.                             |
| `FORBIDDEN_POLICY`     | after approval | Permission flag disabled or cap exceeded.              |
| `INVALID_STATE`        | false     | Action does not apply to current state.                     |
| `OUT_OF_RESOURCES`     | true      | Inventory cannot cover input cost.                          |
| `OUT_OF_BOUNDS`        | false     | Tile coordinate not on the plot grid.                       |
| `BUILD_SLOT_OCCUPIED`  | false     | Tile already occupied or slots at cap.                      |
| `JOB_ALREADY_RUNNING`  | true      | Building already has an active job.                         |
| `RATE_LIMITED`         | true      | Too many autonomous actions in the window.                  |
| `IDEMPOTENCY_CONFLICT` | false     | Different payload used with existing key.                   |
| `SIMULATION_DESYNC`    | false     | Event log cannot reproduce state; manual repair needed.     |
| `SERVER_ERROR`         | true      | Unhandled internal error.                                   |

## Tools

### `et.plot.get_state`

Read-only. Returns the observation payload. No idempotency key.

### `et.plot.list_plots`

Read-only. Returns the player's home plot, active plot, owned outpost plot
summaries, and shallow settlement claim summaries. It must not expose plots that
are not linked through `founder_plot_memberships`.

### `et.plot.place_building`

Body: `{ plotId, type, x, y, idempotencyKey }`.
Always requires human approval in Phase 1 — this route is gated to `HUMAN`
callers; agent attempts return `FORBIDDEN_POLICY` with `retryable:false`.

### `et.plot.queue_job`

Body: `{ plotId, buildingId, kind, idempotencyKey }`.
`kind` is one of `PRODUCE`, `SCOUT`, or `SELL`. Policy requires `queueProduction`
at HQ 3 for PRODUCE/SCOUT or `sellSurplusFood` at HQ 5 for SELL. Also enforces
daily coin cap for SELL.

### `et.plot.collect_outputs`

Body: `{ plotId, buildingId, idempotencyKey }`.
Agent requires `collectOutputs`. Clamps to storage caps and logs overflow.

### `et.plot.draft_site_plan`

Body: `{ plotId, reportId, title, focus, idempotencyKey }`.
Drafts one canonical Site Plan from a collected Scout Report. This records
planning intent only; it does not claim territory, create a second plot, or
promote editor-authored variants into engine truth.

### `et.plot.review_site_plan`

Body: `{ plotId, planId, reviewNote, idempotencyKey }`.
HQ6 Settlement Charter action. Reviews an existing canonical Site Plan into
claim-ready planning state. It requires a collected Scout Report-backed Site
Plan and does not create territory, routes, convoys, resources, or a second
plot.

### `et.plot.select_doctrine`

Body: `{ plotId, doctrineId, actor, idempotencyKey }`.
HQ8B Research Lodge doctrine stance action. Selects one engine-owned doctrine
from the server catalog, currently `survey_discipline`. Its only operational
effect is a 5% Expedition Board `SCOUT` duration reduction
(`durationMs = round(baseDurationMs * 0.95)`). It does not alter job input,
output, inventory math, settlement math, stacked doctrines, routes, cohorts,
world-grid state, or cross-plot rules. Agent callers require a matching human
approval for `select_doctrine`.

### `et.plot.create_work_order_draft`

Body: `{ plotId, templateId, scope, actor, idempotencyKey }`.
HQ9 Cohort Work Orders action. Creates one server-owned draft from an engine
template, currently `collect_ready_outputs_once`. Drafts record allowed child
actions, caps, policy snapshot, and scope. Drafting does not execute anything,
spend resources, collect outputs, queue jobs, approve work, or widen agent
authority.

### `et.plot.execute_work_order`

Body: `{ plotId, workOrderId, actor, idempotencyKey }`.
HQ9B explicit executor. The only executable template is
`collect_ready_outputs_once`. It revalidates live state, collects at most two
ready output buildings on the same plot, writes child receipts with child
idempotency keys, marks the parent work order complete, and spends nothing. It
requires at least one ready output and does not place buildings, queue jobs,
upgrade HQ, scout, found settlements, select doctrines, mutate another plot, or
run on a scheduler. Agent callers need matching human approval for
`execute_work_order` and the child collections must still satisfy
`collectOutputs` policy.

### `et.plot.get_world_grid_status`

Read-only. Returns the HQ10A server-owned World Grid projection for owned plots,
claims, doctrine, work orders, and civic readiness. No idempotency key. It does
not mutate civic state, routes, resources, schedulers, Atlas actions, or
external systems.

### `et.plot.list_civic_proposals`

Read-only. Lists HQ10B civic proposal records for the current plot. No
idempotency key. These records are proposal-only and do not execute civic work.

### `et.plot.create_civic_proposal`

Body: `{ plotId, title, category, summary, status, relatedPlotIds, reviewNote,
actor, idempotencyKey }`. Creates one server-owned advisory civic proposal after
HQ10A World Grid readiness. It records review intent only: no civic mutation,
routes, scheduling, resource spending, Atlas execution, public effects, or
external effects. Agent callers require a matching human approval for
`create_civic_proposal`.

### `et.plot.list_overlay_packs`

Read-only. Lists HQ10C Generated Universe overlay pack records for the current
plot. No idempotency key. Overlay packs are presentation-only metadata and do
not render assets, share publicly, or alter gameplay.

### `et.plot.create_overlay_pack`

Body: `{ plotId, sourceProposalId, title, theme, summary, status,
targetSurfaceIds, targetNodeIds, displayHints, prompt, provenance, actor,
idempotencyKey }`. Creates one server-owned Generated Universe overlay pack
record after HQ10A readiness and a same-plot reviewed civic proposal. The record
can hold labels, skins, display hints, and sanitized prompt/provenance only. It
does not change costs, resources, buffs, doctrine effects, routes, topology,
schedulers, Atlas execution, public sharing, rendering, or external systems.
Agent callers require a matching human approval for `create_overlay_pack`.

### `et.plot.list_civic_projects`

Read-only. Lists HQ10D civic project/public-work records for the current plot.
No idempotency key. These records are bounded local gameplay truth and expose
their applied readiness markers without creating routes, schedulers, spending,
Atlas execution, public sharing, or external effects.

### `et.plot.activate_civic_project`

Body: `{ plotId, sourceProposalId, projectType, title, summary, actor,
idempotencyKey }`. Promotes one same-plot `REVIEWED` civic proposal into a
server-owned civic project. The first project type is `civic_beacon`, which
adds a deterministic local civic readiness/morale marker and writes an audit
receipt. It does not spend resources, create routes or trade, schedule work,
found settlements, mutate other plots, share publicly, execute from Atlas, or
call external systems. Agent callers require a matching human approval for
`activate_civic_project`.

### `et.plot.prepare_settler_convoy`

Body: `{ plotId, sitePlanId, actor, idempotencyKey }`.
HQ7 Settler Convoy action. Requires an HQ6-reviewed claim-ready Site Plan, a
ready Expedition Board, and the engine cost `{ wood: 32, food: 20, stone: 12,
coin: 8 }`. It creates one settlement claim and a timed convoy job. It does not
found a plot yet. Agent callers require a matching human approval for
`prepare_settler_convoy`.

### `et.plot.found_settlement`

Body: `{ plotId, claimId, actor, idempotencyKey }`.
Founds one second plot from an arrived Settler Convoy claim. This creates a new
owned outpost record and membership. It does not create a world map, trade route,
doctrine effect, Generated Universe overlay, or public cross-player mutation.
Agent callers require a matching human approval for `found_settlement`.

### `et.plot.upgrade_building`

Body: `{ plotId, buildingId, idempotencyKey }`.
Upgrading HQ always requires human approval; agent attempts return
`FORBIDDEN_POLICY`.

### `et.plot.set_priority`

Body: `{ plotId, buildingId, priority, idempotencyKey }`.
Policy requires `setPriority`. `priority` in `WOOD | STONE | FOOD | BALANCED`.

### `et.plot.claim_reward`

Body: `{ plotId, rewardId, idempotencyKey }`.
Claims quest/level rewards recorded in the event log.

### `et.plot.request_user_approval`

Body: `{ plotId, action, reason, idempotencyKey }`.
Creates a visible approval card. No state mutation.

## World delta format

Every mutation returns `worldDelta: Array<Event>` containing the newly
appended event log entries from this action, in order. The client can merge
these into its local view without re-fetching full state.
