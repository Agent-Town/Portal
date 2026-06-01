# AgentTown HQ8-HQ10 Slice Plan: Research, Cohorts, World Grid

Date: 2026-05-30
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Mode: read-only systems exploration plus this report. No source edits.

## Executive Recommendation

After HQ7, keep shipping in three playable-but-bounded slices:

1. **HQ8A Research Lodge: advisory doctrine stance**
2. **HQ8B First engine-owned doctrine**
3. **HQ9A Cohort planner: scoped work-order drafts**
4. **HQ9B Single safe cohort executor**
5. **HQ10A World Grid read model and public-safe projection**
6. **HQ10B First civic proposal, no cross-player mutation**
7. **HQ10C Generated Universe overlay packs, presentation-only**

The core rule should not change: **Founders Plot engine/store/routes/tools own gameplay truth; Progression Atlas and OpenClaw Lite may plan, explain, draft, and request approval, but they must not become arbitrary editors or hidden executors.**

## Current Authority Baseline

Implemented truth observed in this worktree:

- `server/founders_plot/engine.js` owns resources, HQ rules through HQ5, buildings, jobs, policies, approvals, scout reports, Site Plans, public summaries, replay/audit, and state hashes.
- `server/founders_plot/store.js` persists canonical plot/building/job/event/policy/approval/idempotency/strategy records; Scout Reports and Site Plans are currently JSON fields on `founder_plots`.
- `server/founders_plot/tools.js` exposes typed `et.plot.*` tool specs. Mutators require `idempotencyKey` and return `worldDelta`.
- `server/founders_plot/routes.js` maps explicit routes to engine/progression operations. There is no generic route that executes editor JSON.
- `server/founders_plot/progression_atlas.js` emits canonical graph fields, non-executable action refs, private strategy saves, draft gates, future placeholders, HQ10 Horizon, and no-gameplay-mutation hashes.
- `public/skill.md` and `public/experiences/founders-plot/skill.md` tell OpenClaw Lite to use visible tools, preserve modal continuity, and treat Atlas/editor proposals as advisory.

Recently implemented post-HQ3 truth:

- HQ3 unlocks `EXPEDITION_BOARD`.
- `SCOUT` jobs create persisted Scout Report receipts.
- `et.plot.draft_site_plan` creates one canonical Site Plan draft from a collected Scout Report.
- Site Plans explicitly do not claim territory, reserve land, create routes, or create a second plot.

Active adjacent lanes:

- HQ6 Settlement Charter core is being handled elsewhere.
- HQ7 second plot planning is being handled elsewhere.
- Graphics/inhabitant/assets planning is being handled elsewhere.

This report assumes HQ8 begins only after HQ7 gives the engine at least one owner-scoped multi-plot concept or a reviewed second-plot boundary.

## HQ8: Research Lodge / First Doctrine

### Product Goal

Research should introduce strategic divergence without letting the editor invent buffs. The player should feel they are choosing a town philosophy, but the first release should make only one tiny, auditable gameplay effect canonical.

### Minimal Engine-Owned Model

Add the smallest model that can support future doctrine growth:

- `researchLodge` as either:
  - a real `RESEARCH_LODGE` building unlocked after HQ7, or
  - an HQ-gated research state if building art/pad pressure is not ready.
- `doctrineCatalog` in engine code, with stable IDs:
  - `doctrineId`
  - `title`
  - `unlockHqLevel`
  - `requiresBuildingType` or `requiresPlotCount`
  - `cost`
  - `effectKind`
  - `effectValue`
  - `reversibility`
  - `riskLevel`
  - `privacyDefault`
  - `summary`
- Persisted selected doctrine state:
  - `selectedDoctrines` or `doctrineState`
  - `doctrineId`
  - `status`
  - `selectedAt`
  - `selectedBy`
  - `revision`
  - `sourceReceiptEventSeq`
- Event log receipt:
  - `DOCTRINE_SELECTED`
  - later, `DOCTRINE_UNSELECTED` or `DOCTRINE_LOCKED`

For v1, avoid stacking bonuses, cross-plot effects, and multiple simultaneous doctrine slots.

### First Doctrine Shape

Recommended first canonical doctrine:

- `survey_discipline`
- Unlock: HQ8, Research Lodge or second plot prerequisite.
- Cost: modest wood/stone/food or a Site Plan/Scout Report prerequisite.
- Effect v1: advisory-only in Atlas recommendations, or a tiny reversible engine effect such as `SCOUT` duration -5%.
- Reversibility: `safe` if advisory-only; `layout_sensitive` or `cooldown_reversible` if it changes real durations.
- Receipt: selected doctrine appears in state, canonical Atlas, and event log.

Best first implementation is **advisory doctrine stance**:

- Player selects a doctrine.
- The engine persists the choice.
- Atlas changes recommendation framing and strategy comparison.
- No production/scout/building math changes yet.

Then promote one tiny effect in a second slice.

### Reversible vs Permanent Choices

Use three levels:

- **Advisory stance:** reversible any time; affects Atlas copy/sorting only.
- **Operational doctrine:** reversible with cooldown or cost; affects one narrow engine-owned formula.
- **Civic doctrine:** permanent or season-locked; only later, after World Grid/civic systems exist.

Do not make the first doctrine permanent. Permanent choices need visible warnings, receipts, and probably a public/share impact.

### What Starts Advisory Only

Keep these in Atlas/editor strategy JSON until engine promotion:

- Doctrine names beyond the first catalog entry.
- AI-generated doctrine descriptions, icons, generated art, lore, and tradeoff copy.
- Claimed benefits such as "+20% logistics" unless engine implements them.
- Doctrine trees, prerequisites, synergies, incompatibilities, civic ideologies, cross-plot bonuses.
- Any Generated Universe pack that reskins doctrine visuals.

### Tools and Routes

Recommended new narrow tool surface:

- `GET /api/founders-plot/research` or include research in `/state`.
- `POST /api/founders-plot/select-doctrine`
- Tool spec: `et.plot.select_doctrine`
- Later: `et.plot.clear_doctrine` only if reversibility is shipped.

Rules:

- Requires `idempotencyKey`.
- Human-only for first slice, or agent may only call `et.plot.request_user_approval`.
- Server validates catalog ID, unlocks, resources, current doctrine status, and reversibility.
- Atlas action refs remain `executableByAtlas: false`.

### Tests

Focused tests:

- Cannot select doctrine before HQ8/research prerequisite.
- Cannot select unknown doctrine.
- Cannot select unaffordable doctrine.
- Idempotency returns same response for same payload and rejects conflicting payload.
- Selecting advisory doctrine changes doctrine state/event log but not inventory math beyond explicit cost.
- Atlas canonical graph emits doctrine availability/selected nodes only from engine state.
- OpenClaw Lite can draft doctrine strategy notes without changing `gameplayStableHash`.
- Public projection redacts private doctrine strategy notes and exposes only approved doctrine summary.

## HQ9: Agent Cohorts / Scoped Work Orders

### Product Goal

Cohorts should make delegation feel like a team, not give agents a shell inside the game. A cohort is a server-owned work-order envelope around existing legal actions.

### Reusing `et.plot.*` Safely

HQ9 should not create a generic executor that accepts arbitrary tool names or editor-authored steps. Instead:

- Work-order templates are engine-defined.
- Each template has an allowlisted set of child `et.plot.*` actions.
- Child actions are executed by server-owned code using the same engine mutators or route logic that direct tools use.
- Every child action gets:
  - its own idempotency key,
  - policy check,
  - current-state revalidation,
  - event log receipt,
  - parent work-order receipt link.

Safe first template:

- `collect_ready_outputs_once`
- Allowed children: `et.plot.collect_outputs`
- Scope: selected building IDs or all ready buildings on one plot.
- Cap: max 2 collections in v1.
- No spending.
- Obeys `collectOutputs` policy and emergency pause before every child action.

Second template:

- `scout_once_if_affordable`
- Allowed children: `et.plot.queue_job` with `kind: SCOUT` on `EXPEDITION_BOARD`.
- Cap: one scout job.
- Requires resource cap and `queueProduction` policy or explicit approval.

Avoid as v1:

- building placement,
- HQ upgrades,
- policy changes,
- reward claiming,
- doctrine selection,
- second-plot founding,
- public/civic actions.

### Minimal Engine-Owned Model

Add a `work_orders` store model rather than stuffing cohorts into strategy JSON:

- `workOrderId`
- `plotId`
- `ownerPairId` or owner identity reference
- `templateId`
- `status`: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `RUNNING`, `COMPLETED`, `CANCELLED`, `BLOCKED`
- `scope`
- `allowedActions`
- `caps`
- `policySnapshot`
- `createdBy`
- `approvedBy`
- `createdAt`, `updatedAt`
- `expiresAt`
- `childReceipts`
- `failureReason`

Optional later:

- `cohortId`
- `memberRoleIds`
- `visualRoster`
- `assignedPlotIds`

Keep visual cohort membership separate from execution authority.

### Caps

Hard caps should exist at creation and execution time:

- max child actions per work order,
- max resource spend,
- allowed building IDs,
- allowed job kinds,
- allowed plot IDs,
- max runtime,
- max autonomous actions per hour,
- daily sell caps,
- emergency pause,
- no irreversible actions in v1.

Never rely only on a policy snapshot. Re-check live policy before every child action.

### Approvals

Approval model:

- Creating a draft work order is safe.
- Approving execution must be explicit if any child action mutates state.
- Spending or irreversible actions need a human approval card.
- Agents can request approval; they cannot approve their own work orders.
- Approval body must show template, scope, max actions, max spend, affected plot/buildings, expiration, and rollback limits.

### Receipts

Each work order should produce:

- `WORK_ORDER_CREATED`
- `WORK_ORDER_APPROVED`
- `WORK_ORDER_STARTED`
- child event refs
- `WORK_ORDER_COMPLETED` or `WORK_ORDER_BLOCKED`

Atlas should show parent/child receipt chains.

### No Arbitrary Editor Execution

Explicitly forbid:

- executing saved Atlas strategy steps,
- executing `canonicalProposal` JSON,
- executing arbitrary `actionRef.params`,
- accepting tool names outside an engine template,
- accepting custom JS/expression conditions,
- letting OpenClaw Lite call hidden batch routes with raw action arrays.

Editor-created work-order templates should remain `future_placeholder` or `custom_note` until promoted into engine-defined templates.

### Tools and Routes

Recommended tool surface:

- `et.plot.create_work_order`
- `et.plot.request_work_order_approval`
- `et.plot.approve_work_order` or reuse approval resolution with action `et.plot.run_work_order`
- `et.plot.run_work_order`
- `et.plot.cancel_work_order`
- `et.plot.get_work_orders`

Start with `create` + `cancel` + read-only status, then add one executor.

### Tests

Focused tests:

- Editor strategy save cannot create executable work orders.
- Unknown template rejected.
- Unknown child action rejected.
- Disallowed child action in a valid template rejected.
- Work order cannot bypass direct `et.plot.*` policy rejection.
- Emergency pause blocks a running work order before each child action.
- Caps stop execution mid-order and record `BLOCKED`, not partial silent success.
- Child idempotency is stable and replay-safe.
- Approval cannot be self-approved by an agent.
- Atlas displays work order nodes only from engine-owned work order state.
- OpenClaw Lite worker traffic shows create/approval/run/status calls.

## HQ10: World Grid / Civic Layer

### Product Goal

HQ10 should make multiple settlements feel like a civilization, but it must not leak private strategy or make public visuals into gameplay truth.

### Public-Safe Projection Contracts

Define a separate projection contract before any civic mutation:

- `worldGridProjectionVersion`
- `viewerScope`: `owner_private`, `friend_redacted`, `public`
- `worldId`
- `ownerHouseId` or redacted owner handle
- `plotSummaries`
- `routeSummaries`
- `civicProjectSummaries`
- `publicReceipts`
- `privacyRedactions`
- `generatedOverlay`

Public-safe plot summary should include only:

- plot ID or public alias,
- HQ level,
- broad specialization,
- public doctrine title if player opted in,
- public project participation,
- public-safe visual state,
- coarse updated time.

Do not expose:

- exact inventory,
- private strategy titles/notes,
- pending claim targets,
- unclaimed Scout Reports,
- Site Plan details before sharing,
- approval text that contains private intent,
- OpenClaw Lite transcript/memory,
- generated prompts that contain private strategy.

### Multi-Plot and World State Boundaries

Separate state layers:

- **Plot state:** resources, buildings, jobs, local reports, Site Plans, local policies.
- **Player world state:** owned plot IDs, private routes, private civic plans, private strategies.
- **World Grid state:** public or opted-in civic graph, route/project summaries, public receipts.
- **Generated overlay state:** visual skins/layout overlays with no mechanics.

HQ10 should not mutate individual plot resources directly from a world-grid editor. Any cross-plot project should compile into explicit per-plot engine actions or a new civic engine model with receipts.

### Civic Layer Minimal Model

First civic slice should be read-only:

- world grid read model from owner-scoped plots,
- public-safe projection endpoint,
- Atlas lane that shows plots and possible civic projects as locked/advisory nodes.

First mutation should be only a proposal:

- `et.world_grid.create_civic_proposal` or owner-scoped `et.plot.create_civic_proposal`
- Stores a proposal record.
- Does not consume resources.
- Does not transfer resources.
- Does not alter public projection until explicitly shared.

Delay:

- resource transfers,
- trade routes,
- public works with shared costs,
- cross-player participation,
- automatic civic execution.

### Generated Universe Overlay Separation

Generated Universe should be a renderer/skin layer:

- `overlayPackId`
- `source`
- `prompt/provenance`
- `assetManifest`
- `compatibleProjectionVersion`
- `presentationOnly: true`
- `gameplayMutationPolicy: presentation_only`
- `redactionLevel`

Overlay packs may:

- reskin Atlas nodes,
- change map layout presentation,
- swap building/civic icons,
- add decorative route visuals,
- generate public-safe screenshots.

Overlay packs must not:

- alter costs,
- alter unlocks,
- add resources,
- change doctrine effects,
- change plot topology,
- expose hidden reports/plans,
- mark public/private state,
- become the source of civic truth.

### Sharing and Privacy Concerns

Sharing must be opt-in and copy-based:

- Private strategy remains private by default.
- Public templates should be redacted forks, not live strategy records.
- Generated overlays should scrub prompts and metadata before public display.
- World Grid public projection should be generated server-side from allowlisted fields.
- Any share link should carry `projectionVersion`, redaction rules, and source state hash.

Add privacy classes:

- `private`
- `share_redacted`
- `public_template_allowed`
- `public_civic`

Avoid "share current world" until redaction tests exist.

### Tests

Focused tests:

- Public projection excludes inventory, private strategy notes, unshared reports, Site Plan internals, approvals, and transcripts.
- Owner projection includes private fields only when authenticated as owner.
- Generated overlay cannot change gameplay stable hash.
- Public share of overlay uses redacted prompt/provenance.
- Multi-plot read model cannot include plots not owned by the session.
- Civic proposal creation is idempotent and non-mutating for plot resources.
- Atlas public view renders from projection contract, not private state.

## Progression Atlas Visualization

### HQ8

Visualize as a research lane that is visibly split from canonical gameplay:

- `Research Lodge` building/research unlock node.
- `Doctrine Catalog` availability node.
- `First Doctrine` selected node.
- Advisory doctrine cards with:
  - effect status: `advisory`, `engine_effect`, or `locked`,
  - reversibility badge,
  - risk badge,
  - receipt link.

Canonical doctrine nodes should appear only after engine state exists. Editor doctrine ideas should remain future placeholders with `requires_engine_promotion`.

### HQ9

Visualize as a delegation lane:

- `Cohort Planner` advisory area.
- `Work Order Draft` nodes from private strategy/editor.
- `Engine Work Order` nodes from canonical work-order state.
- Child receipt chain as collapsible rows under the parent work order.
- Caps and approvals as first-class blockers.

Atlas should never show a saved strategy step as "running." Only engine work orders can run.

### HQ10

Visualize as a World Grid layer with zoom levels:

- Plot-level canonical nodes.
- World-level projection nodes.
- Civic proposal nodes.
- Public/private/redacted badges.
- Generated Universe overlay toggle clearly labeled as visual.

Use different lanes or tabs for:

- `Truth`: engine/world-grid projection.
- `Plans`: private Atlas strategies.
- `Civic`: proposals/receipts.
- `Overlay`: Generated Universe presentation.

## OpenClaw Lite and Browser Agent Boundaries

### Should Do

OpenClaw Lite/browser agent should:

- open Founders Plot and Progression Atlas through modal UI intents,
- read server-owned Atlas and plot state,
- explain blockers from current state,
- draft private strategies,
- save edited advisory strategies,
- generate prompt/provenance icon drafts,
- request user approval for sensitive actions,
- create advisory doctrine/work-order/civic proposals once routes exist,
- run only explicitly allowed tools,
- show all tool calls in Worker Traffic/Session Context,
- preserve `gameplayStableHash` expectations for advisory tools.

### Should Not Do

OpenClaw Lite/browser agent should not:

- navigate to standalone Atlas routes when a modal intent exists,
- use arbitrary DOM selectors as gameplay controls,
- execute saved Atlas action refs,
- execute editor-authored JSON as a workflow,
- call generic `http_request` to bypass visible Agent Town tools for gameplay,
- approve its own requests,
- mutate policies secretly,
- invent current resources/buildings/reports not in `get_state`,
- expose private strategies or transcripts in public projections,
- call wallet or network tools for gameplay unless the game has a specific reviewed tool and approval flow.

Browser-level `web_fetch`, `http_request`, and wallet tools are powerful platform tools. For Agent Town gameplay, they should be treated as debugging/platform utilities, not first-choice gameplay routes. Product skills should prefer typed Agent Town tools and explicit `et.plot.*` contracts.

## Recommended Implementation Order After HQ7

1. **HQ8A Research Lodge advisory stance**
   - Persist one doctrine stance with no mechanical effect.
   - Atlas shows selected doctrine and recommendation framing.

2. **HQ8B First engine-owned doctrine effect**
   - Promote one tiny reversible effect after tests prove doctrine truth is engine-owned.

3. **HQ9A Cohort/work-order planner**
   - Private drafts, templates, caps, approval copy, no executor.

4. **HQ9B Single safe work-order executor**
   - `collect_ready_outputs_once`; no spending; strict caps; receipt chain.

5. **HQ9C Scout work-order executor**
   - One `SCOUT` job if affordable and approved; no claim/found/route mutation.

6. **HQ10A World Grid read model**
   - Owner-scoped multi-plot projection plus public-safe redacted contract.

7. **HQ10B Civic proposal records**
   - Create/view/cancel proposals; no resource transfer or public mutation by default.

8. **HQ10C Generated Universe overlay packs**
   - Visual overlays for private/public-safe projections; presentation-only.

## Pitfalls to Avoid

- Letting Atlas become an executable graph editor.
- Treating `actionRef` metadata as permission to run a tool.
- Letting editor-authored resource gates become real costs.
- Letting doctrine copy imply a buff before engine code applies it.
- Making the first doctrine permanent without warning, receipt, and undo policy.
- Reusing `et.plot.*` through a generic batch executor.
- Checking policy only at work-order creation instead of before every child action.
- Allowing agents to approve their own work.
- Letting work orders place buildings, upgrade HQ, found plots, or change policies in v1.
- Mixing visual cohort rosters with execution authority.
- Letting Generated Universe overlays change mechanics or leak private strategy.
- Exposing exact inventories, pending claims, unshared Scout Reports, Site Plans, approvals, or transcript memory in public World Grid views.
- Letting public share links point at live private strategy records.
- Creating cross-plot/civic writes before ownership and projection contracts exist.
- Making OpenClaw Lite use arbitrary `http_request` calls instead of visible typed Agent Town tools.
- Duplicating gameplay truth between engine, Atlas, frontend, and generated packs.

## Bottom Line

HQ8-HQ10 can keep shipping after HQ7 if every slice first adds a narrow server-owned model, then lets Atlas/OpenClaw Lite visualize and advise around it. The correct rhythm is:

**engine truth -> receipt -> canonical Atlas projection -> private strategy variants -> optional visual overlays.**

Any reversal of that order will make the editor too powerful and gameplay truth ambiguous.
