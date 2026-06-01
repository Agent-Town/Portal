# Agent Town Progression Atlas Full Current-Game Coverage Plan

Date: 2026-05-29
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`
HEAD observed: `19ec3b4` (`Add Progression Atlas editor Lite tools`)
Mode: report-only explorer. No production/source/test files edited.

## Verdict

P1 should turn Progression Atlas from an HQ1-HQ3 hand-authored strategy surface into a canonical read model for every Founders Plot gameplay capability already implemented in the engine.

The engine already supports HQ4/HQ5, Workshop, Market Stall, non-HQ building upgrades, set-priority, sell-surplus-food, rewards, storage caps, construction slots, output overflow, approvals, receipts/event log, policy gates, and repeat production/sell loops. The Atlas currently exposes only the HQ1-HQ3 opening templates plus private strategy/editor metadata.

Do this as a read-only graph compiler over `engine.HQ_LEVEL_RULES`, `engine.HQ_UPGRADE_RULES`, `engine.BUILDING_DEFS`, state permissions/rewards/approvals, and `FOUNDERS_PLOT_TOOL_SPECS`. Keep the mutation boundary bright: Atlas explains, plans, references actions, and saves private advisory strategy JSON; actual gameplay remains exclusively under `et.plot.*` routes/tools.

## Source-Grounded Gameplay Inventory

### Canonical Rules Already In Founders Plot

`server/founders_plot/engine.js` is the gameplay authority.

- HQ rules cover levels 1-5: HQ1 unlocks `LUMBER_CAMP`/`FARM_PLOT`, HQ2 unlocks `QUARRY` + `collectOutputs`, HQ3 adds a second construction slot + `queueProduction`, HQ4 increases storage caps to 160 and unlocks `WORKSHOP` + `setPriority`, HQ5 unlocks `MARKET_STALL` + `sellSurplusFood` (`engine.js:29-60`).
- HQ upgrade rules already exist for 1->2, 2->3, 3->4, and 4->5 with resource costs, XP gates, and durations (`engine.js:62-67`).
- `BUILDING_DEFS` already covers `LUMBER_CAMP`, `FARM_PLOT`, `QUARRY`, `WORKSHOP`, and `MARKET_STALL`, including construction cost/duration, level-2 upgrade rules, and production/sell specs (`engine.js:69-152`).
- Fresh plots start at HQ1 with 20 coin, 100 storage caps, one construction slot, HQ placed, and no claimed rewards (`engine.js:402-430`).
- Policy availability is derived from HQ level, not from Atlas: `collectOutputs` at HQ2, `queueProduction` at HQ3, `setPriority` at HQ4, `sellSurplusFood` at HQ5 (`engine.js:377-385`).
- Current state already returns buildings, jobs, permissions, approvals, rewards, pads, unlocks, `hqUpgrade`, public `buildingDefs`, visual actors, and audit fields (`engine.js:956-1001`).

### Implemented Mechanics Atlas Does Not Fully Represent

- **HQ4/HQ5 progression:** engine supports upgrades and unlocks, but Atlas templates stop at HQ3 (`progression_atlas.js:691-855`) and `buildAtlasEnvelope` returns graph nodes from `buildRushHq3Strategy` only (`progression_atlas.js:1235-1261`).
- **Workshop:** HQ4 building consumes `{ wood: 8, stone: 4 }`, completes as a special Workshop job, and collection applies `nextBuildBuffPct` for the next construction (`engine.js:121-135`, `engine.js:1158-1180`, `engine.js:1860-1864`).
- **Market Stall / sell surplus:** HQ5 building queues a `SELL` job, consuming food and outputting coin; agent sell is gated by `sellSurplusFood` policy and `sellDailyCoinCap` (`engine.js:137-150`, `engine.js:1749-1768`, `engine.js:1810-1815`).
- **Non-HQ building upgrades:** all resource buildings plus Workshop/Market Stall have level-2 upgrade rules, and `upgradeBuilding` handles HQ and non-HQ upgrades through the same route/tool (`engine.js:76-150`, `engine.js:1942-2018`).
- **Set-priority:** `setPriority` supports `WOOD`, `STONE`, `FOOD`, `BALANCED`; agent use is HQ4/policy gated (`engine.js:2022-2078`).
- **Rewards:** reward definitions include first lumber and HQ2-HQ5 rewards; claiming resources uses storage caps and claiming XP uses `town_xp` (`engine.js:154-186`, `engine.js:2083-2132`).
- **Storage caps and output overflow:** resource collection transfers only up to storage caps and leaves remainder in `building.outputBuffer`; coins bypass caps (`engine.js:294-319`, `engine.js:1865-1872`).
- **Construction slots and queued construction:** construction/upgrade jobs are queued and started only while open construction slots exist; Workshop buff modifies the next started construction duration (`engine.js:1095-1129`).
- **Approvals:** approval requests, approval resolution, matching, and approved-unused consumption are implemented in engine/store/routes (`engine.js:1028-1040`, `engine.js:1450-1578`, `store.js:153-169`, `store.js:328-345`, `routes.js:246-289`).
- **Receipts:** every mutation creates event-log rows and `worldDelta`; idempotency stores full responses (`store.js:116-150`, `store.js:305-327`, `engine.js:1289-1330`).
- **Repeat loops:** `queueJob`/`collectOutputs` support repeated produce/sell cycles, but current Atlas production steps are "first collection proven" and then `done` forever (`progression_atlas.js:529-584`).

`tool_handlers.js` is currently a no-op compatibility export, so no P1 implementation should look there for live handlers.

## Current Atlas Limitations

Current Atlas v1 is useful but too narrow.

- `STRATEGY_TEMPLATES` are static HQ3 narratives (`progression_atlas.js:22-50`).
- The step builders can express place-building, produce/collect, HQ upgrade, and permission milestones, but only as explicitly called by the three templates (`progression_atlas.js:476-689`).
- Icons already include Workshop and Market Stall fallback metadata, but no canonical nodes use them yet (`progression_atlas.js:407-426`).
- `buildGameplaySnapshot` already captures enough non-mutating proof fields for P1: storage caps, construction slots, buildings, output buffers, permissions, approvals, rewards, quest, and event count (`progression_atlas.js:327-380`).
- `atlas.nodes`/`atlas.edges` are currently the recommended Rush HQ3 graph, not the full canonical capability graph (`progression_atlas.js:1235-1261`).
- Saved strategies are private advisory JSON in `founder_progression_strategies`; that is correct for strategy variants/editor, but canonical gameplay coverage should be returned from the server read model, not inferred from saved strategy blobs (`store.js:171-178`, `store.js:826-835`).

## Canonical Node/Edge Model

Add a P1 canonical graph builder, separate from strategy templates:

```js
atlas: {
  graphVersion,
  summary,
  canonicalNodes: [],
  canonicalEdges: [],
  availabilityByNode: {},
  actionRefsByNode: {},
  receiptRefs: {},
  nodes,               // backwards-compatible alias for recommended strategy graph during transition
  edges,               // backwards-compatible alias
  strategyOptions,
  recommendedStrategy,
  strategies
}
```

Keep `nodes`/`edges` for UI compatibility, but make new consumers use `canonicalNodes`/`canonicalEdges`.

### Node Types To Add

Use stable node ids and typed payloads:

- `hq.level.N` for HQ levels 1-5.
- `hq.upgrade.N` for upgrade action from N-1 to N.
- `building.TYPE.unlock` for HQ-gated unlocks.
- `building.TYPE.place` for placement capability/current placement status.
- `building.TYPE.upgrade.2` for non-HQ level-2 upgrade rules.
- `production.TYPE.KIND` for repeatable production/sell capability. Examples: `production.LUMBER_CAMP.PRODUCE`, `production.MARKET_STALL.SELL`.
- `production.TYPE.collect` for output collection readiness and overflow/cap status.
- `permission.KEY.unlock` for permission availability by HQ.
- `policy.KEY.enable` for current toggle/cap state. Example: `policy.sellSurplusFood.enable`, `policy.sellDailyCoinCap`.
- `reward.REWARD_ID.claim` for available/claimed/locked rewards.
- `constraint.storage.RESOURCE` for storage cap and current usage.
- `constraint.construction_slots` for slot count, running jobs, queued jobs, and contention.
- `effect.workshop.next_build_buff` for Workshop buff availability/applied state.
- `approval.APPROVAL_ID` for pending/approved/rejected/used approval records.
- `receipt.EVENT_SEQ` only in `receiptRefs`, not as visible graph nodes by default.

### Edge Types To Add

Canonical edges should describe prerequisites and effects, not a single strategy order:

- `requires_hq_level`: building/permission/action requires an HQ level.
- `requires_building`: production/upgrade/sell requires a placed building.
- `requires_resource`: action requires resource input/cost.
- `requires_xp`: HQ upgrade requires town XP.
- `unlocks_building`: HQ level unlocks building type.
- `unlocks_permission`: HQ level unlocks permission.
- `enables_action`: permission/policy enables an agent action.
- `produces_resource`: production/sell produces resource/coin or Workshop buff.
- `consumes_resource`: construction/upgrade/production/sell consumes inputs.
- `fills_storage`: output collection applies to storage caps.
- `leaves_overflow`: collection blocked/partial due to cap and output buffer remainder.
- `uses_construction_slot`: construction/upgrade competes for slots.
- `applies_buff_to_next_build`: Workshop collection affects next construction/upgrade start.
- `requires_approval`: agent placement/HQ upgrade and policy-gated actions need approval or policy state.
- `has_receipt`: node/action has matching event log/worldDelta/idempotency evidence.
- `strategy_sequence`: keep this for saved/recommended strategies only.

## Canonical vs Strategy Annotation vs Placeholder

### Canonical Atlas Nodes Now

Make these canonical because the engine currently implements them:

- HQ1-HQ5 levels and HQ2-HQ5 upgrades.
- Building unlock/place/upgrade nodes for Lumber Camp, Farm Plot, Quarry, Workshop, Market Stall.
- Repeatable production/collect loops for Lumber/Farm/Quarry/Workshop and sell/collect loop for Market Stall.
- Permission unlocks for `observeAndSuggest`, `collectOutputs`, `queueProduction`, `setPriority`, `sellSurplusFood`.
- Policy state nodes for enabled/disabled toggles, `sellDailyCoinCap`, `maxAutonomousActionsPerHour`, `emergencyPause`.
- Reward claim nodes for current reward definitions.
- Storage cap nodes per capped resource and output-overflow facts per building.
- Construction-slot node with active/queued construction and upgrade jobs.
- Approval nodes for real `state.approvals`.
- Receipt references for real event log/worldDelta/idempotency state.

### Strategy-Step Annotations

Keep these as annotations on strategy steps, not canonical gameplay truth:

- Player priority like "rush", "balanced", "delegate first".
- `reason`, `tradeoff`, `approvalDelegationBurden`, focus tags.
- Suggested repeat counts such as "run 3 wood loops" unless P1 computes them from exact current deficits.
- Preferred pad choice for a building. `et.plot.place_building` requires x/y, but Atlas should not pick layout automatically without a strategy planner.
- Custom editor steps and prompt-backed icon drafts.
- Risk/reversibility/privacy metadata already introduced in constants should annotate authored strategy/editor steps, not define engine capabilities.

### Future Placeholders

Keep these as explicit `future_placeholder` nodes only inside saved/editor strategies until gameplay exists:

- Expedition Board, scouts, settlers, second plots, territories.
- Research/specialization/doctrines.
- Units, routes/trade, World Grid writes.
- Atlas Oracle memory, sharing/forking/remixing public templates.
- Generated Universe pack-specific progression overlays.

These should never appear as canonical available gameplay until `et.plot.*` or a future authoritative gameplay namespace implements them.

## Canonical Builder Design

Add a new internal builder in `server/founders_plot/progression_atlas.js`:

- `buildCanonicalAtlasGraph(state, toolSpecs)`
- `buildHqNodes(state)`
- `buildBuildingNodes(state)`
- `buildProductionNodes(state)`
- `buildPermissionPolicyNodes(state)`
- `buildRewardNodes(state)`
- `buildConstraintNodes(state)`
- `buildApprovalNodes(state)`
- `buildReceiptRefs(state, events?)`

Use existing public state first:

- `state.hqUpgrade` for immediate upgrade rule.
- `state.buildingDefs` for construction/upgrade/canProduce.
- `state.unlockedBuildings` for current unlocks.
- `state.permissions` for unlocked/enabled/requiresApproval.
- `state.rewards` for available rewards.
- `state.approvals` for approval cards.
- `state.jobs` and `state.buildings[].activeJob/outputBuffer/canQueue/canCollect/canUpgrade` for availability.
- `state.plot.storageCaps`, `state.plot.inventory`, `state.plot.constructionSlots`, `state.plot.nextBuildBuffPct`, `state.plot.dailySoldCoin`, `state.plot.claimedRewards`, `state.plot.seenBuildingTypes`, `state.plot.collectedBuildingTypes`.

Use engine constants for full coverage beyond current state:

- `engine.HQ_LEVEL_RULES` and `engine.HQ_UPGRADE_RULES` for every HQ node/upgrade, not only current `state.hqUpgrade`.
- `engine.BUILDING_DEFS` for every buildable type, construction/upgrade rules, and `produces(level)`.
- `FOUNDERS_PLOT_TOOL_SPECS` for `actionRef.toolSpec`, argument shape, and result-shape metadata.

Do not hard-code only HQ1-HQ3 strategy arrays for canonical coverage. The strategy templates may continue to present HQ3 player routes, but `canonicalNodes` must be generated by iterating rules.

## Exact API Shape

Suggested node shape:

```json
{
  "nodeId": "building.WORKSHOP.place",
  "kind": "building_place",
  "canonical": true,
  "title": "Build Workshop",
  "status": "locked|blocked|available|waiting|done",
  "availability": {
    "state": "locked",
    "hqLevelRequired": 4,
    "unlocked": false,
    "affordable": false,
    "blockedBy": ["hq.level.4", "resource.wood", "resource.stone", "resource.coin"],
    "readyAction": null
  },
  "target": { "kind": "building", "type": "WORKSHOP", "buildingId": null, "level": 1 },
  "requirements": {
    "items": [
      { "kind": "hq", "resource": "HQ", "have": 3, "required": 4, "missing": 1 },
      { "kind": "resource", "resource": "wood", "have": 12, "required": 24, "missing": 12 }
    ],
    "affordable": false,
    "missing": { "HQ": 1, "wood": 12 }
  },
  "effects": [
    { "kind": "unlocks_action", "action": "production.WORKSHOP.PRODUCE" }
  ],
  "icon": {},
  "ui": { "tier": "HQ4", "lane": "Workshop", "sort": 410 }
}
```

Suggested edge shape:

```json
{
  "edgeId": "hq.level.4->building.WORKSHOP.unlock",
  "from": "hq.level.4",
  "to": "building.WORKSHOP.unlock",
  "kind": "unlocks_building",
  "canonical": true,
  "label": "HQ4 unlocks Workshop"
}
```

Suggested `availabilityByNode`:

```json
{
  "building.WORKSHOP.place": {
    "status": "locked",
    "unlocked": false,
    "done": false,
    "available": false,
    "waiting": false,
    "blockedBy": ["hq.level.4"],
    "nextAction": "Reach HQ Level 4 first",
    "blocker": "Requires HQ Level 4."
  }
}
```

Suggested `actionRefsByNode`:

```json
{
  "production.MARKET_STALL.SELL": {
    "tool": "et.plot.queue_job",
    "http": { "method": "POST", "path": "/api/founders-plot/queue-job" },
    "paramsTemplate": { "buildingId": "$buildingId", "kind": "SELL" },
    "requiresIdempotencyKey": true,
    "actorSupport": ["HUMAN", "AGENT"],
    "agentPolicy": {
      "permissionKey": "sellSurplusFood",
      "requiredHqLevel": 5,
      "requiresPolicyEnabled": true,
      "dailyCapField": "sellDailyCoinCap"
    },
    "authority": "et.plot.*",
    "executableByAtlas": false
  }
}
```

Suggested `receiptRefs`:

```json
{
  "hq.level.4": [
    {
      "kind": "event",
      "eventType": "HQ_UPGRADED",
      "eventSeq": 42,
      "summary": "Headquarters reached Level 4.",
      "createdAt": 1700000000000
    }
  ],
  "building.WORKSHOP.place": [
    { "kind": "worldDelta", "type": "BUILDING_PLACED", "target": "bldg_..." }
  ]
}
```

P1 can ship `receiptRefs` as empty arrays plus event-count stable proof if exposing event seqs requires an engine/store read helper. P1.1 should add a safe `listEventsForPlot` read inside the Atlas builder or reuse `store.listEvents(plotId)` through the current state-envelope path.

## Proposed File Changes

Primary implementation:

- `server/founders_plot/progression_atlas.js`
  - Add canonical graph builders and maps.
  - Return `canonicalNodes`, `canonicalEdges`, `availabilityByNode`, `actionRefsByNode`, and `receiptRefs`.
  - Keep old `nodes`/`edges` and strategy fields stable for UI/tests.
  - Use `FOUNDERS_PLOT_TOOL_SPECS` or a local tool-spec map imported from `tools.js`.
  - Add node kinds/status normalization constants if P0 schema hardening does not already land them.

Focused UI after API passes:

- `public/progression-atlas.js`
  - Render canonical map/tree from `canonicalNodes` when available.
  - Keep `recommendedStrategy` detail cards below.
  - Add filters/lanes for HQ, Buildings, Production, Permissions, Rewards, Constraints.

- `public/progression-atlas.html` / `public/progression-atlas.css`
  - Add one canonical map container and compact status legend.
  - Avoid full-page navigation; keep modal-first.

Worker/skill surface:

- `public/skill.md`
  - Document that Atlas can read canonical coverage but cannot execute gameplay.

- `vendors/openclaw-lite-main/src/openclaw-lite/...` and generated `public/openclaw-lite/...`
  - Only if the existing tool result filtering needs to expose the new fields to OpenClaw Lite. Rebuild with `npm run build:openclaw-lite`.

Tests:

- `tests-founders-plot/fp-http.test.js`
  - Add API shape and non-mutating assertions.
  - Add state progression fixtures through HQ3/HQ4/HQ5.

- `tests-founders-plot/fp-unit.test.js`
  - Add engine reachability helpers if they do not already exist for HQ4/HQ5.
  - Add canonical graph unit-level assertions if exported helper functions are exposed.

- `e2e/114_progression_atlas_openclaw_lite.spec.js`
  - Assert the modal/Lite surface can see the canonical nodes and still save advisory strategies without gameplay mutation.

## Test Cases

No broad test suite is required for this report, but P1 implementation should add these.

### Fresh State

`GET /api/founders-plot/progression-atlas` on a fresh plot:

- `canonicalNodes` includes HQ1-HQ5, all five building place nodes, all non-HQ upgrade nodes, all permission nodes, rewards, storage, construction slots.
- HQ1 is `done`; HQ2/HQ3/HQ4/HQ5 upgrade nodes are `blocked` or `locked` according to requirements.
- `building.LUMBER_CAMP.place` and `building.FARM_PLOT.place` are unlocked; Lumber is `available` if enough coin/pad, Farm is blocked by wood/coin until resources exist.
- `building.QUARRY.place`, `building.WORKSHOP.place`, and `building.MARKET_STALL.place` are locked by HQ.
- `permission.observeAndSuggest.unlock` is done; `collectOutputs`, `queueProduction`, `setPriority`, `sellSurplusFood` are locked.
- `constraint.storage.wood/stone/food` show cap 100.
- Repeated Atlas reads keep `gameplayStableHash`, inventory, event count stable.

### HQ3 State

After reaching HQ3:

- `hq.level.3` done; `permission.queueProduction.unlock` done.
- `hq.upgrade.4` exists with exact `{ wood: 40, stone: 30, food: 20 }`, XP 90, and `et.plot.upgrade_building` action ref when affordable/no active HQ job.
- `building.WORKSHOP.place` locked by HQ4.
- `constraint.construction_slots` reports 2 slots and active/queued construction jobs.
- Existing HQ1-HQ3 nodes remain done/available based on real state.

### HQ4 State

After reaching HQ4:

- `hq.level.4` done; `permission.setPriority.unlock` done; storage cap nodes show 160 for wood/stone/food.
- `building.WORKSHOP.place` is available if resources/pad permit, otherwise blocked by exact resource shortfalls.
- Workshop production node has input `{ wood: 8, stone: 4 }`, output effect `{ construction_buff_pct: 20 }` at level 1.
- Workshop collection node reports `nextBuildBuffPct` effect once ready.
- `policy.setPriority.enable` reflects current policy toggle; `actionRefsByNode['action.set_priority']` references `et.plot.set_priority`.

### HQ5 State

After reaching HQ5:

- `hq.level.5` done; `permission.sellSurplusFood.unlock` done.
- `building.MARKET_STALL.place` available/blocked/done by real state.
- `production.MARKET_STALL.SELL` has input `{ food: 6 }`, output `{ coin: 3 }` at level 1, kind `SELL`.
- `policy.sellSurplusFood.enable` and `policy.sellDailyCoinCap` are represented.
- Agent sell availability accounts for policy toggle and daily cap; human sell remains an `et.plot.queue_job` action reference if building is ready.

### Rewards, Approvals, Receipts

- Claimable rewards appear as `reward.*.claim` nodes with `et.plot.claim_reward` action refs.
- Claimed rewards become done and do not disappear from canonical coverage.
- Pending approvals appear as `approval.APPROVAL_ID` nodes with action name, requested params, and status.
- Approved/used approvals update availability without Atlas mutating them.
- Receipt refs point to event-log/worldDelta evidence where implemented; otherwise empty arrays are accepted in P1 with a TODO.

### Non-Mutation

For every Atlas read/draft/explain/save/editor/icon endpoint:

- `gameplayStableHash` unchanged.
- `gameplaySnapshot.audit.eventCount` unchanged.
- Inventory unchanged.
- Buildings/jobs/approvals unchanged except saved private strategy records for strategy endpoints.

## Safest Incremental Order After P0 Lands

1. **Rebase on P0 schema hardening.** Do not duplicate schema constants or response-normalization if P0 already adds them.
2. **Add canonical graph behind additive fields only.** Implement `canonicalNodes`, `canonicalEdges`, `availabilityByNode`, `actionRefsByNode`, `receiptRefs` without changing existing `nodes`/`edges` or strategy templates.
3. **Cover read-only API shape in `fp-http.test.js`.** Start with fresh state and exact presence/status of HQ1-HQ5/building/permission nodes.
4. **Add HQ3/HQ4/HQ5 fixture helpers.** Reuse current engine tools to advance real state; do not seed fake Atlas-only states.
5. **Add Workshop and Market assertions.** Prove input/output/buff/sell cap metadata comes from `BUILDING_DEFS`/policy, not hard-coded UI copy.
6. **Add rewards/approvals/caps/slots/overflow assertions.** These are the highest-risk "already implemented but invisible" gameplay facts.
7. **Expose canonical map in UI.** Render the new graph while keeping strategy compare/editor flows unchanged.
8. **Expose through OpenClaw Lite only after API/UI stabilize.** The existing browser agent should read and explain the canonical map; it still must not call gameplay mutation routes from Atlas tools.
9. **Only then consider richer strategy generation.** Strategy templates can start composing from canonical nodes instead of bespoke arrays, but saved custom/editor strategies remain advisory.

## Risks

- **Read endpoint currently simulates time.** `getProgressionAtlasState` calls `engine.getFoundersPlotState`, and state reads can advance jobs/daily rewards if time has passed. Existing `gameplayStableHash` tests control this with fixed test clocks. P1 tests must stay deterministic and distinguish "Atlas endpoint caused mutation" from "state read performed canonical catch-up."
- **Action refs are not executable as-is.** Placement needs `x/y`; all mutations need idempotency keys; agent actions may need approvals/policy. Mark every `actionRef` as reference/planning metadata, not an Atlas execution permission.
- **Receipt refs may require event access.** State exposes only event count, not event rows. If P1 includes event seq receipts, add a narrow read path carefully.
- **Output overflow is easy to miss.** The buffer remainder behavior is subtle and should be explicitly tested.
- **Policy vs permission can be confused.** HQ unlock means permission available; policy enabled means agent may act. Atlas should show both.
- **Workshop has non-resource output.** Its effect is a construction buff, not inventory. Do not shoehorn it into `resource` output.
- **Market sell has a cap only for agent sells.** Human sell and agent sell availability differ.

## Commands Run

- `sed -n ... SOUL.md USER.md MEMORY.md memory/2026-05-29.md memory/2026-05-28.md`
- `git -C /Users/robin/Projects/Portal-atlas-editor status --short --branch`
- `git -C /Users/robin/Projects/Portal-atlas-editor rev-parse --short HEAD`
- `git -C /Users/robin/Projects/Portal-atlas-editor branch --show-current`
- `find /Users/robin/Projects/Portal-atlas-editor -maxdepth 2 -name AGENTS.md -print`
- `sed -n '1,260p' AGENTS.md`
- `codex --help`
- `codex exec --help`
- Attempted three `codex exec --sandbox read-only --ephemeral` subagent passes for engine/tools, Atlas/UI/tests, and routes/store/replay. All failed before analysis with OpenAI API `401 Unauthorized`; no files were edited by those attempts.
- `find server/founders_plot -maxdepth 2 -type f | sort`
- `find /Users/robin/Projects/Portal-atlas-editor -maxdepth 3 -path '*progression*atlas*' -o -path '*founders*plot*'`
- `rg -n "HQ_LEVEL_RULES|HQ_UPGRADE_RULES|BUILDING_DEFS|..." server/founders_plot public/progression-atlas.js tests-founders-plot e2e`
- `sed -n ... server/founders_plot/engine.js`
- `sed -n ... server/founders_plot/progression_atlas.js`
- `sed -n ... server/founders_plot/tool_handlers.js`
- `sed -n ... server/founders_plot/tools.js`
- `sed -n ... server/founders_plot/routes.js`
- `sed -n ... server/founders_plot/store.js`
- `sed -n ... server/founders_plot/replay.js`
- `sed -n ... tests-founders-plot/fp-http.test.js`
- `sed -n ... tests-founders-plot/fp-unit.test.js`
- `sed -n ... public/progression-atlas.js public/progression-atlas.html public/progression-atlas.css`
- `nl -ba ...` for line-grounded references in engine, progression_atlas, routes, store, and tools.
- `git diff --check -- reports/agent-town-progression-atlas-full-current-game-coverage-plan-2026-05-29.md`
- `git status --short --branch`
- `wc -l reports/agent-town-progression-atlas-full-current-game-coverage-plan-2026-05-29.md`
