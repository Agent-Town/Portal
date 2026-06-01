# Agent Town Current Game to Progression Atlas Editor Gap Audit

Date: 2026-05-29
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`
HEAD: `19ec3b4 Add Progression Atlas editor Lite tools`
Mode: report-only gap audit. No production source edits, commits, pushes, or broad test suites.

## Verdict

The current Progression Atlas and Strategy Editor are a good advisory planning surface for the **known HQ1-HQ3 Founders Plot opening**, but they are not yet a general authoring, gameplay-construction, expansion-planning, or share/remix system.

Cleanly supported today:

- Current-state read model for Founders Plot.
- Canonical advisory strategies for `rush-hq3`, `balanced-food-wood`, and `delegate-outputs-first`.
- Canonical-ish steps for placing Lumber Camp/Farm Plot/Quarry, producing/collecting wood/food/stone, upgrading HQ to 2/3, and recognizing `collectOutputs` / `queueProduction` permission milestones.
- Private saved strategy JSON scoped to the plot.
- Custom editor steps with title, note, before/after links, prompt-backed icon metadata, and optional `et.plot.*` action refs.
- OpenClaw Lite access to open the Atlas modal, read state, draft/save/select/explain strategies, generate icon draft metadata, and save edited strategies.

Not cleanly supported today:

- The full current game through HQ4/HQ5, Workshop, Market Stall, building upgrades, set-priority, sell-surplus, rewards, daily return, storage cap strategy, construction-slot strategy, or output-buffer/overflow planning.
- Real gameplay creation or execution through the editor. The editor saves private advisory plans only; canonical gameplay still runs through server-owned `et.plot.*` routes/tools.
- Future expansion systems like Expedition Board, scouts, settlers, second plot, unit production, territory, research/specialization, or Clover/Atlas Oracle memory. These can only be sketched as custom advisory steps with empty requirements and no canonical storage model.
- Durable sharing/forking/remixing. The current `founder_progression_strategies` table stores a whole private JSON blob, but it has no owner/public field model, revision history, parent/fork lineage, compatibility checks, privacy classifier, import flow, or public-safe template boundary.

Bottom line: **a full strategy for the current HQ1-HQ3 game can be created through the current Atlas/editor without code changes, but only as a private advisory strategy. A full strategy for all gameplay currently implemented in code cannot be represented cleanly without adding more canonical Atlas nodes and plan metadata. Future expansion can be brainstormed in custom steps, not represented/stored well enough for the planning/expansion goals.**

## Current Gameplay Truth Inventory

### Canonical State and Economy

`server/founders_plot/engine.js` is the gameplay authority. It defines:

- Resources: `wood`, `stone`, `food`, `coin`; town XP is tracked separately as `townXp`.
- Seven plot pads: one HQ pad and six build pads.
- HQ rules:
  - HQ1: storage 100/100/100, 1 construction slot, unlocks `LUMBER_CAMP` and `FARM_PLOT`, unlocks `observeAndSuggest`.
  - HQ2: unlocks `QUARRY` and `collectOutputs`.
  - HQ3: 2 construction slots and `queueProduction`.
  - HQ4: storage 160/160/160, unlocks `WORKSHOP` and `setPriority`.
  - HQ5: unlocks `MARKET_STALL` and `sellSurplusFood`.
- HQ upgrade costs/timers:
  - HQ1 -> HQ2: `{ wood: 20, food: 10 }`, XP 25.
  - HQ2 -> HQ3: `{ wood: 20, stone: 16 }`, XP 50.
  - HQ3 -> HQ4 and HQ4 -> HQ5 also exist in code.
- Buildings:
  - `LUMBER_CAMP`: costs coin, produces wood, level 2 output increases.
  - `FARM_PLOT`: costs wood+coin, produces food.
  - `QUARRY`: costs wood+food+coin, produces stone.
  - `WORKSHOP`: HQ4, consumes wood+stone to create a next-build speed buff.
  - `MARKET_STALL`: HQ5, sells food for coin.
- Jobs:
  - `CONSTRUCT`, `UPGRADE`, `PRODUCE`, `SELL`.
  - Jobs have input/output, duration, status, actor, timestamps, and explanation.
- Output collection:
  - Resource output is buffered on buildings.
  - Collection clamps to storage caps and leaves remainder in the buffer.
  - Workshop collection stores `nextBuildBuffPct`.
- Rewards:
  - `quest.first-lumber`, `hq.level-2`, `hq.level-3`, `hq.level-4`, `hq.level-5`, plus daily return XP.
- Quest/current-next-step:
  - A deterministic current quest moves through Lumber Camp, first wood, Farm Plot, HQ2, Quarry, HQ3, and then generic higher-HQ guidance.

### Authority, Tools, Policy, and Receipts

The canonical mutation path is server-owned:

- `et.plot.get_state`
- `et.plot.place_building`
- `et.plot.queue_job`
- `et.plot.collect_outputs`
- `et.plot.upgrade_building`
- `et.plot.set_priority`
- `et.plot.claim_reward`
- `et.plot.request_user_approval`

Every mutation requires idempotency and returns a `worldDelta`. Agent actions are gated by HQ unlocks, policy toggles, approval matching where required, hourly caps, and emergency pause.

The persisted gameplay tables are:

- `founder_plots`
- `founder_buildings`
- `founder_jobs`
- `founder_event_log`
- `founder_permissions`
- `founder_idempotency`
- `founder_approvals`
- `founder_progression_strategies`

Receipts and verification already exist:

- Append-only event log.
- `worldDelta`.
- Recap.
- Replay audit projection.
- `stateHash` from canonical plot/building/job/policy/approval state.
- `gameplayStableHash` in the Atlas read model to prove advisory operations did not mutate gameplay.

### Visual-Only Inhabitants and Three.js Projection

`state.visualActors` is derived in `engine.js` and remains visual-only:

- Clover: source domain `foreman`, observes HQ/current plot.
- Rigger/builder: source domain `job`, represents `CONSTRUCT` / `UPGRADE`.
- Kettle/worker: source domain `job`, represents `PRODUCE` / `SELL`.
- Oona/hauler: source domain `building`, represents `OUTPUT_READY`.
- Rook/messenger: source domain `approval`, `reward`, or `quest`, represents `APPROVAL`, `REWARD`, or `QUEST`.

`public/experiences/founders-plot/scene_state.js` projects these into Three.js objects with assets, sprite sheets, action cues, action animations, routes, ways, and encounters. Routes/ways/encounters are derived client-side and are not gameplay state. Picking actors selects or opens relevant UI drawers and e2e coverage asserts it does not change event count.

## Atlas/Editor Representation Inventory

### Canonical Atlas Read Model

`server/founders_plot/progression_atlas.js` builds `founders-plot-progression-atlas-v1` from the current Founders Plot state.

It returns:

- `plotId`
- `stateHash`
- `gameplayStableHash`
- `gameplaySnapshot`
- `atlas.graphVersion`
- `atlas.iconCatalog`
- `atlas.summary`
- `atlas.nodes`
- `atlas.edges`
- `atlas.strategyTemplates`
- `atlas.strategyOptions`
- `atlas.recommendedStrategy`
- saved private `atlas.strategies`
- `atlas.selectedStrategyId`
- OpenClaw Lite surface metadata.

The gameplay snapshot is compact and useful: plot inventory/HQ/XP/storage/caps, buildings, pads, unlocked buildings, permissions, approvals, rewards, current quest id/action, and event count.

### Built-In Strategy Templates

The Atlas currently has three deterministic templates:

- `rush-hq3`
- `balanced-food-wood`
- `delegate-outputs-first`

All three reuse the same legal early path, with different framing and one added `collectOutputs` checkpoint in the delegate-first variant.

Supported canonical step builders:

- `makePlaceBuildingStep`
- `makeProductionStep`
- `makeHqUpgradeStep`
- `makePermissionStep`

These steps can express:

- status: `done`, `available`, `waiting`, `blocked`
- reason
- icon metadata
- target
- current-state requirements and missing amounts
- blocker
- next action
- `actionRef` to an `et.plot.*` tool for some steps
- unlocks and permission unlocks for HQ upgrades

Limit: this is hand-coded for HQ1-HQ3 strategy templates. It is not a general graph compiler over every `BUILDING_DEFS`/`HQ_LEVEL_RULES` capability.

### Strategy Editor

The browser editor can:

- Open a private strategy editor panel.
- Edit title/note for a selected step.
- Add custom steps.
- Link steps with `beforeStepId` / `afterStepId`.
- Store `connections`.
- Attach prompt-backed icon metadata.
- Save edited strategies through `/api/founders-plot/progression-atlas/strategies`.

Server normalization for edited strategies:

- Caps steps at 24.
- Sanitizes IDs/titles/status/reasons.
- Normalizes before/after links only to known step IDs.
- Converts custom/editor steps to `target.kind = custom_strategy_step`.
- Gives every edited step empty requirements: `{ items: [], affordable: true, missing: {} }`.
- Preserves only action refs whose tool starts with `et.plot.`.
- Stores the entire edited strategy as JSON in `founder_progression_strategies.strategy_json`.

This is good for private planning notes. It is weak for future expansion because custom steps do not carry typed canonical references, formal costs, unit requirements, mission state, assumptions, risks, privacy class, or share/import provenance.

### OpenClaw Lite Tools

Current worker tools include:

- `agent_town_ui_open_progression_atlas`
- `agent_town_progression_get_state`
- `agent_town_progression_draft_strategy`
- `agent_town_progression_save_strategy`
- `agent_town_progression_generate_icon_draft`
- `agent_town_progression_save_edited_strategy`
- `agent_town_progression_select_strategy`
- `agent_town_progression_explain_node`

The e2e coverage proves OpenClaw Lite can open the visible modal, save strategy variants, create prompt-backed icon draft metadata, save custom edited steps, and preserve `gameplayStableHash`, event count, and inventory.

## Mapping Table: Game Fact -> Atlas/Editor Support -> Gap

| Game fact | Atlas/editor support today | Gap |
| --- | --- | --- |
| HQ1-HQ3 canonical path | Clean support through built-in templates and canonical step builders | Mostly limited to this exact path |
| HQ4/HQ5 | Engine supports, Atlas has only generic "Reach HQ N" quest after HQ3 | No canonical steps for Workshop, Market Stall, priority, sell surplus, storage bump strategy |
| Lumber/Farm/Quarry placement | Clean support with requirements and action refs | `place_building` action refs omit coordinates/pad choice, so not executable as-is |
| Production and collection | Clean enough for first collected output per building type | No repeated loop planning, throughput estimates, overflow/cap handling, or "run N cycles" representation |
| Building upgrades | HQ upgrades to 2/3 are supported | Non-HQ upgrades are absent from templates; HQ4/HQ5 absent |
| Resource gates/costs | Current-state requirements show missing amounts for template steps | No predictive resource plan, cumulative costs, production-cycle estimates, or strategy assumptions |
| XP gates | HQ2/HQ3 requirements show XP | No general XP source planning beyond current status |
| Construction slots | Engine supports 1/2 slots and queued construction | Atlas does not model construction-slot contention as a planning dimension |
| Workshop speed buff | Engine supports `nextBuildBuffPct` | Atlas does not represent it |
| Market sell loop | Engine supports `SELL` and sell cap | Atlas/editor has no clean sell strategy node |
| Permissions/policy | `collectOutputs` and `queueProduction` represented; policy rows in snapshot | `setPriority`, `sellSurplusFood`, cap tuning, emergency pause, approvals as strategy steps are not cleanly represented |
| Human approvals | Snapshot includes approvals; messenger visual actor reflects pending approval | Atlas has no approval-card planning nodes or approval burden per specific future action beyond compare copy |
| Rewards | Snapshot includes available/claimed rewards; messenger can reflect rewards | No plan steps for claiming rewards or using rewards in resource strategy |
| Event/audit/receipts | Snapshot includes event count and stable hash; gameplay has event log/replay | Strategy records cannot link to event seqs/receipts or explain "why this plan changed" |
| Visual actors | Snapshot includes visualActors in state, Three.js derives live actors | Atlas does not represent actors/roles/routes/encounters except indirectly as gameplay snapshot facts |
| Routes/ways/encounters | Three.js client derives them visually | Not stored, not canonical, not usable for planning or expansion |
| Icon metadata | Good global icon metadata; editor stores prompt-backed icon draft metadata | No real generated raster pipeline yet; icon metadata is presentation-only |
| Strategy variants | Three private deterministic templates | No user-created branching model beyond separate saved strategies/custom steps |
| Custom editor steps | Supported as private advisory steps | No typed canonical/future node schema, costs, blockers, units, territory, research, privacy, provenance |
| Before/after links | Supported within edited strategy | No cross-strategy dependencies, graph compatibility, or canonical prerequisite validation |
| Action refs | Some canonical template steps include `et.plot.*` refs; edited steps may preserve `et.plot.*` refs | Missing executable params/templates, safety class, approval policy, user confirmation model |
| Sharing/fork/remix | Not implemented | Needs public-safe template model, parent/fork lineage, redaction, revisions, import as private copy |

## Can We Create It Through The Editor?

### What Current Gameplay Can Be Represented Cleanly Today

Clean today means deterministic, typed enough, and anchored to current server state:

- Build Lumber Camp.
- Produce/collect wood for the first time.
- Build Farm Plot.
- Produce/collect food for the first time.
- Upgrade HQ to Level 2.
- Build Quarry.
- Produce/collect stone for the first time.
- Upgrade HQ to Level 3.
- Recognize the HQ2 `collectOutputs` and HQ3 `queueProduction` permission milestones.
- Compare the three built-in HQ3 strategy framings.
- Save/select private strategy records without changing gameplay.
- Explain canonical template nodes and current blockers.

This is enough for a teammate or browser agent to create a private HQ1-HQ3 advisory strategy.

### What Can Be Approximated Only As Advisory/Custom Steps

Approximation means "the editor can store a note/card, but the server cannot verify it as a canonical plan node":

- Scout/settler/second-plot ideas.
- Expedition Board planning.
- Research/specialization tracks.
- Unit production.
- Territory expansion.
- Clover/Atlas Oracle long-term decisions.
- Custom branch choices like "wait for one more wood loop before HQ2".
- Strategy advice around rewards, storage caps, overflow, construction-slot timing, building upgrades, Workshop buffs, Market Stall sell caps.
- Visual actor/routing goals, such as "make Oona's handoff route matter later."
- Generated Universe flavor overlays.

The current custom step model stores title, note, links, nextAction, icon prompt, and optional `et.plot.*` action ref. It does not store formal cost/benefit/blocker/assumption/reversibility/provenance fields.

### What Cannot Yet Be Represented or Stored Enough

These are schema gaps, not merely UI gaps:

- Canonical node IDs for future systems that do not exist yet.
- Formal future-node type: `future_placeholder`, `canonical_gameplay_node`, `strategy_note`, `research_node`, `mission_node`, `unit_node`, `territory_node`.
- Cost/input/output schemas for custom/future steps.
- Unit requirements and assignment state.
- Mission/expedition state.
- Second plot/site/territory references.
- Research prerequisites and specialization choices.
- Time estimates or production-cycle estimates.
- Player-authored assumptions and risk/reversibility warnings.
- Receipts/event links/journal references.
- Strategy revisions.
- Parent/fork/remix lineage.
- Public/private/redacted field policy.
- Import compatibility against a graph version.
- Memory/Library scope for Atlas Oracle.
- Generated Universe display overlays tied to canonical node IDs with zero rule authority.

### Can Existing Gameplay Be Created Through The Current Editor?

No, not as gameplay.

The editor can create and save a private strategy that describes the HQ1-HQ3 route. It cannot create buildings, mutate resources, queue jobs, upgrade HQ, change policy, claim rewards, or define new game content. That is correct and should stay true: gameplay mutations must remain server-owned through `et.plot.*` and future canonical game tools.

### Can A Full Strategy For The Current Game Be Created Without Code Changes?

For the **currently player-important HQ1-HQ3 loop**, yes: the existing templates and Strategy Editor can create a full private advisory plan.

For the **full gameplay implemented in code** through HQ5, no: Workshop, Market Stall, building upgrades, set-priority, sell surplus, reward usage, storage caps, construction slots, and repeated production loops would need custom advisory notes rather than clean canonical nodes.

### Can Future Goals Be Represented With The Current Editor Schema?

Only as loose notes.

- Expedition Board: custom step only. No mission/building/unit/site schema unless gameplay is added.
- Scouts/settlers/second plot: custom step only. No unit or discovered-site table.
- Research/specialization: custom step only. No research graph, prerequisites, effects, or specialization identity.
- Unit production: custom step only. Current game has jobs/buildings, not unit records.
- Territory expansion: custom step only. No territory/site/route/world-grid references.
- Clover/Atlas Oracle planning: current OpenClaw Lite can use Atlas tools, but durable memory/journal/scope is not implemented in this worktree.
- Sharing/forking/remixing: not represented beyond private strategy JSON blobs.

## Storage Sufficiency Assessment

### Enough For

- Private per-plot strategy records.
- Selecting one saved strategy.
- Storing custom editor steps in a JSON blob.
- Saving prompt-backed icon metadata.
- Proving advisory operations do not mutate gameplay with `gameplayStableHash`.
- Short-term OpenClaw Lite co-editing.

### Not Enough For

Player-authored strategy durability at the level Robin is aiming for:

- No revisions: a strategy overwrite is not an auditable planning history.
- No provenance: no `createdBy`, `source`, `parentStrategyId`, `forkedFrom`, `contentHash`, or imported-template metadata.
- No public/private field model: `visibility` exists inside JSON but the table/query model is private plot scope only.
- No share redaction: current records may include plot-specific building IDs, state hashes, prompts, or notes if future code stores them.
- No compatibility handling: strategy graph version exists, but there is no migration/incompatibility status for old nodes.
- No canonical step contract for custom steps: edited steps become `custom_strategy_step` with empty requirements.
- No receipt or memory links: cannot connect a plan to event log, recap, Library item, conversation artifact, or decision note.
- No branch/variant model beyond separate strategies and before/after links.

The current design is fine for v1 private planning. It is not yet enough for sharing/forking/remixing or a memory-backed Atlas Oracle.

## Highest-Priority Gaps

1. **Canonical Atlas coverage stops too early.** The game engine already has HQ4/HQ5, Workshop, Market Stall, set-priority, sell, rewards, and non-HQ building upgrades. The Atlas only cleanly expresses HQ1-HQ3.
2. **Custom editor steps lose planning semantics.** They become generic custom steps with empty requirements and no typed canonical/future references.
3. **Action refs are advisory but look close to executable.** Some steps reference `et.plot.*`, but params are incomplete and there is no approval/safety/execution envelope. Keep them clearly advisory until canonical execution UX exists.
4. **Strategy storage is JSON-only and private-only.** This is not enough for revision history, sharing, forking, remixing, import compatibility, redaction, or memory linkage.
5. **Expansion concepts have no server truth.** Expedition Board/scouts/sites/settlers/territory require canonical gameplay tables and tools before Atlas can represent them as more than notes.
6. **Docs are partially stale.** `public/skill.md` says strategy V1 supports `rush-hq3`, while current code supports three templates. `public/experiences/founders-plot/goals.md` says HQ2 unlocks Farm Plot and HQ3 unlocks Quarry, while current code unlocks Farm Plot at HQ1 and Quarry at HQ2.

## Recommended Next Slice

### P0: Harden The Strategy Step Contract

Smallest high-value implementation slice: add a typed saved-strategy step schema while preserving advisory-only behavior.

Add fields to normalized strategy steps:

- `stepKind`: `canonical_node | custom_note | future_placeholder`
- `canonicalNodeId`: nullable string
- `futureSystem`: nullable string, e.g. `expedition`, `research`, `territory`
- `targetRef`: `{ kind, id, type }`
- `requirements`: allow explicit custom/future requirements, but mark them `advisory: true`
- `estimatedCost`: resource map, nullable
- `expectedBenefit`: string array
- `riskLevel`: `low | medium | high | unknown`
- `reversibility`: `safe | layout_sensitive | irreversible | unknown`
- `assumptions`: string array
- `privacy`: `private | share_redacted | public_template_allowed`
- `actionRef`: keep only `et.plot.*`, add `executable: false` unless a future UX explicitly promotes it.

Add strategy-level fields:

- `createdBy`: `human | openclaw_lite | clover | atlas_oracle`
- `source`: `template | editor | oracle_draft | import | fork`
- `contentHash`
- `parentStrategyId`
- `revision`
- `notes`
- `sharePolicy`

Tests:

- Edited strategy preserves canonical/future/custom step kinds.
- Unknown canonical node becomes `future_placeholder` or `custom_note`, not silently canonical.
- Advisory strategy save still preserves `gameplayStableHash`, event count, and inventory.
- Invalid actionRef tools outside `et.plot.*` are stripped/rejected.

### P1: Expand Canonical Atlas Coverage To Full Current Game

Before new gameplay, represent the game that already exists:

- HQ4 and HQ5 steps.
- Workshop placement, production, and next-build buff.
- Market Stall placement and sell loop.
- Non-HQ building upgrade steps.
- Set-priority permission and sell-surplus permission.
- Reward claim nodes.
- Storage cap/overflow notes.
- Construction-slot contention notes.

Implementation shape:

- Build canonical nodes from `HQ_LEVEL_RULES`, `HQ_UPGRADE_RULES`, and `BUILDING_DEFS` instead of hand-writing only HQ3.
- Keep strategy templates curated, but let their steps reference a broader canonical node registry.
- Add `GET /api/founders-plot/progression-atlas` fields:
  - `canonicalNodes`
  - `canonicalEdges`
  - `availabilityByNode`
  - `actionRefsByNode`
  - `receiptRefs` or bounded event summaries later.

Tests:

- Fresh state shows HQ4/HQ5 nodes locked, not absent.
- HQ3 state shows Workshop path locked behind HQ4.
- HQ4 state shows set-priority and Workshop.
- HQ5 state shows Market Stall and sell-surplus.
- Atlas read remains non-mutating.

### P2: Add Strategy Revisions And Share-Safe Template Boundaries

Do this before public sharing.

Proposed storage:

- `founder_progression_strategy_revisions`
  - `strategy_id`
  - `revision`
  - `content_hash`
  - `strategy_json`
  - `created_by`
  - `created_at`
- Later `founder_progression_strategy_templates`
  - public/importable template payloads with redacted fields only.

Endpoints:

- `GET /api/founders-plot/progression-atlas/strategies/:strategyId`
- `GET /api/founders-plot/progression-atlas/strategies/:strategyId/revisions`
- `POST /api/founders-plot/progression-atlas/strategies/:strategyId/fork`
- Later: `POST /api/founders-plot/progression-atlas/templates/import`

Tests:

- Saving edited strategy creates revision or content-hash lineage.
- Public template export omits plotId, houseId, buildingId, jobId, approvalId, raw stateHash, raw prompts, and private notes.
- Import creates a private copy and does not mutate gameplay.

### P3: Expedition Board V1 After The Strategy Contract

The Expedition Board report's recommended tiny slice is still the right first expansion mechanic, but it needs server truth before Atlas can represent it cleanly:

- Add `EXPEDITION_BOARD` as HQ3 building.
- Add `founder_expeditions`.
- Add discovered-site records.
- Add future canonical tools like `et.plot.start_expedition` / `et.plot.acknowledge_expedition`.
- Extend Atlas with post-HQ3 nodes.
- Keep scouting/returned scout visuals as visual-only projections.

Do not let Progression Atlas create expeditions. It should only explain blockers and reference future canonical tools.

### P4: Atlas Oracle Memory Scope

Reuse House Library concepts later:

- `atlas_strategy_note`
- `atlas_decision`
- `atlas_plan_snapshot`
- `atlas_conversation_artifact`
- selected scope set / Reading Table
- visible prompt context

This should be optional context for the existing OpenClaw Lite browser agent, not a separate hidden Oracle service.

## Commands / Evidence

Commands run:

- `git status --short --branch`
- `git rev-parse --short HEAD`
- `git branch --show-current`
- `git log -1 --oneline`
- `rg --files server public tests e2e reports | rg 'founders_plot|founders-plot|progression|atlas|openclaw|skill|lite|store|route|tool|expedition|oracle|reuse'`
- `find reports -maxdepth 1 -type f | sed 's#^#/#' | rg 'Progression|progression|Expedition|expedition|Atlas|atlas|Oracle|oracle|reuse|sharing|openclaw|strategy'`
- `rg -n 'HQ|Lumber|Farm|Quarry|Foreman|queueProduction|visualActors|ways|encounters|permissions|policy|stateHash|hash|resources|buildings|jobs|outputs|approval|reward|quest|Rigger|Kettle|Oona|Rook|Clover' server/founders_plot/engine.js server/founders_plot/tool_handlers.js server/founders_plot/tools.js server/founders_plot/routes.js server/founders_plot/store.js server/founders_plot/service.js`
- `sed -n` reads of:
  - `server/founders_plot/engine.js`
  - `server/founders_plot/store.js`
  - `server/founders_plot/routes.js`
  - `server/founders_plot/tools.js`
  - `server/founders_plot/replay.js`
  - `server/founders_plot/progression_atlas.js`
  - `public/progression-atlas.html`
  - `public/progression-atlas.js`
  - `public/progression-atlas.css`
  - `public/skill.md`
  - `public/experiences/founders-plot/skill.md`
  - `public/experiences/founders-plot/tools.md`
  - `public/experiences/founders-plot/goals.md`
  - `public/experiences/founders-plot/scene_state.js`
  - `public/experiences/founders-plot/three_scene_entry.js`
  - `public/experiences/founders-plot/founders-plot.js`
  - `public/openclaw-lite/worker.js`
  - `server/index.js`
  - `tests-founders-plot/fp-http.test.js`
  - `tests-founders-plot/fp-unit.test.js`
  - `tests-founders-plot/fp-contract.test.js`
  - `e2e/114_progression_atlas_openclaw_lite.spec.js`
  - `e2e/200_founders_plot.spec.js`
  - `e2e/214_founders_plot_threejs_playable_slice.spec.js`
- Prior reports read:
  - `reports/agent-town-progression-atlas-editor-openclaw-lite-tools-2026-05-29.md`
  - `reports/agent-town-progression-atlas-strategy-variants-compare-v2-2026-05-29.md`
  - `/Users/robin/Projects/Portal/reports/agent-town-progression-control-systems-research-2026-05-29.md`
  - `/Users/robin/Projects/Portal/reports/agent-town-memory-library-atlas-openclawlite-reuse-audit-2026-05-29.md`
  - `/Users/robin/Projects/Portal/reports/agent-town-progression-atlas-strategies-sharing-generated-packs-research-2026-05-29.md`
  - `/Users/robin/Projects/Portal/reports/agent-town-expedition-board-v1-implementation-plan-2026-05-29.md`
  - `/Users/robin/Projects/Portal/reports/agent-town-atlas-oracle-memory-integration-plan-2026-05-29.md`
  - `/Users/robin/Projects/Portal/reports/agent-town-existing-openclaw-lite-agent-planning-model-2026-05-29.md`
- Syntax checks:
  - `node --check server/founders_plot/engine.js`
  - `node --check server/founders_plot/progression_atlas.js`
  - `node --check public/progression-atlas.js`
  - `node --check public/experiences/founders-plot/scene_state.js`
  - `node --check public/openclaw-lite/worker.js`
  - `node --check e2e/114_progression_atlas_openclaw_lite.spec.js`

Syntax checks passed. No broad or slow test suites were run because this was report-only and the requested audit needed focused read-only/syntax verification.

Existing worktree note: `git status --short --branch` showed a pre-existing untracked `test-results/214_founders_plot_threejs_-9ecf9-er-from-server-visualActors-chromium/` directory. It was left untouched.
