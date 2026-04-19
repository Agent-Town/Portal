# Agent Town: Founders Plot V1.1 Refined Specification

## Launch Gate, Living Contracts, OpenClaw Lite Foreman, and One Delightful Scheduled Action

**Document status:** refined implementation specification after team review  
**Date:** 2026-04-19  
**Product:** Agent Town  
**Launch chapter:** Agent Town: Founders Plot  
**Baseline branch:** `codex/founders-plot-phase1-isolated`  
**Supersedes for build scope:** `agent-town-founders-plot-v1.1-spec.md`  
**Companion docs:**

- `agent-town-founders-plot-v1.1-tdd-acceptance-matrix.md`
- `agent-town-future-specs-backlog-updated-after-v1.1.md`

---

## 1. Product promise

### 1.1 Public promise

**Agent Town is a frontier town-builder where you found a settlement with an AI partner and gradually teach it to run by your rules.**

For this milestone, the promise must be more precise:

> **I founded a small working plot, chose who in town I wanted to help first, taught my Foreman one operating preference, and saw it handle a routine task I trusted it with.**

### 1.2 What V1.1 must prove

V1.1 must prove these five things, in order:

1. **The first hour is understandable.** A normal player always knows what to do next.
2. **The plot feels like the beginning of a town.** Contracts come from named stakeholders and institutions, not abstract task cards.
3. **The Foreman is real.** The first autonomous action originates from the OpenClaw Lite worker path, not from a UI button pretending to be an agent.
4. **The player has taught something small but visible.** A standing order changes Foreman recommendations, scheduler choices, and recap language.
5. **Trust is predictable before action and auditable after action.** The player can know what the Foreman is likely to do, why it may act, when it will ask, and how to correct it.

### 1.3 What V1.1 must not become

V1.1 must not become:

- a generalized automation platform;
- a full persistent/off-session Foreman system;
- a doctrine-board release;
- a specialist-foremen release;
- a large resource-tree expansion;
- a multi-era city game;
- a social/world/multiplayer release;
- a debug-console-heavy agent runtime demo.

---

## 2. Scope discipline

### 2.1 P0, must ship

P0 is the required V1.1 release. Do not mark the milestone complete unless every P0 item passes its tests.

| Area | P0 scope |
|---|---|
| Launch Gate UX | Founders Plot is the default game surface after onboarding; first CTA visible; no technical jargon in the game loop. |
| First-hour progression | Compact path from HQ1 → Lumber Camp → first wood → HQ2 → Farm Plot → first contract. |
| Contract Board | `SUPPLY` and `BUILD` contracts only; one active contract; contracts have named requesters and why-now text. |
| Micro-doctrine | One **Foreman Standing Order v0** choice that affects plan cards, safe-action scoring, and recap language. |
| Foreman runtime | OpenClaw Lite worker boots, observes Founders Plot state, and performs one safe mutation through a Foreman-authenticated route. |
| Scheduler | One preset only: `COLLECT_READY_OUTPUTS`. Persisted server-side, executed only by active OpenClaw Lite runtime. |
| Trust surfaces | Foreman Plan Card, action receipt, recap attribution, correction controls. |
| Security | Direct actor spoof rejection; server-owned authority; idempotency; no client body may declare itself as the Foreman. |
| Tests | Deterministic test brain; first-hour E2E; agent-origin proof; auto-collect proof; policy/doctrine effect proof. |

### 2.2 P1, ship only after P0 is green

P1 may be implemented in the same branch only if P0 is already complete and stable.

| Area | P1 scope |
|---|---|
| Scheduler | Add `KEEP_ONE_BUILDING_RUNNING` for exactly one chosen building or one Foreman-selected building under Standing Order. |
| Contracts | Add additional `SUPPLY` and `BUILD` cards to the deck; no new contract type. |
| Plan cards | Add stronger contract-aware phrasing and side-by-side tradeoff copy. |
| Scheduler persistence | Ensure scheduled preset survives reload without duplication. |
| Correction affordances | Add “do this next time”, “ask me next time”, “snooze this suggestion” if not already shipped in P0. |

### 2.3 P2, explicitly deferred from V1.1

Do not implement these in V1.1 unless a human maintainer explicitly creates a new spec:

- `MAINTAIN_RESOURCE_RESERVE` scheduler preset;
- `CHECK_BOTTLENECK` scheduler preset;
- `ASSIST_ACTIVE_CONTRACT` generalized preset;
- `RECOVERY` contracts;
- `PREPARATION` contracts;
- contract expiration and abandon complexity;
- full doctrine board;
- charter / starting-town-trait system;
- backend-pool persistent/off-session Foreman;
- specialist foremen;
- multi-tab takeover UX beyond fail-safe minimal stale truth;
- social sharing, visitor mode, marketplaces, tokenized economy.

---

## 3. Existing code to reuse

The implementation must extend the current Founders Plot branch. Do not rebuild solved work.

### 3.1 Existing Founders Plot modules

Keep and extend:

```text
public/founders-plot.html
public/experiences/founders-plot/manifest.json
public/experiences/founders-plot/app.js
public/experiences/founders-plot/skill.md
public/experiences/founders-plot/tools.md
server/founders_plot/engine.js
server/founders_plot/store.js
server/founders_plot/routes.js
server/founders_plot/tools.js
server/founders_plot/recap.js
server/founders_plot/replay.js
e2e/*founders_plot*.spec.js
```

### 3.2 Existing runtime assets

Reuse OpenClaw Lite / Town Runner Lite assets already present in the Portal branch family:

```text
public/openclaw-lite/*
vendors/openclaw-lite-main/*
```

The Foreman integration must not create a second bespoke browser-agent runtime if the existing OpenClaw Lite bridge can be extended.

### 3.3 Existing principles that remain mandatory

- The server owns world truth.
- Agents act only through typed tools.
- Every mutation validates permissions and idempotency.
- Every Foreman-originated mutation is attributed, audited, and recap-visible.
- No LLM output directly mutates world state.
- The platform does not pretend browser execution survives after tab close.

---

## 4. First-hour progression table

This table is normative for V1.1 balancing and test fixtures. Values may later be rebalanced, but V1.1 tests should use this table unless a human maintainer changes it deliberately.

### 4.1 Core resources

Hard resources remain:

- `wood`
- `stone`
- `food`
- `coin`
- `townXp`

No new hard currency is allowed in V1.1.

### 4.2 Storage caps

| Resource | Initial cap | Notes |
|---|---:|---|
| wood | 100 | capped |
| stone | 100 | capped |
| food | 100 | capped |
| coin | uncapped in V1.1 | coin is still scarce through sinks |

### 4.3 Initial state

| Field | Value |
|---|---:|
| HQ level | 1 |
| construction slots | 1 |
| production jobs per building | 1 |
| wood | 0 |
| stone | 0 |
| food | 0 |
| coin | 20 |
| townXp | 0 |

### 4.4 Production baselines

| Building | Input | Output | Duration |
|---|---:|---:|---:|
| Lumber Camp | none | +6 wood | 60 sec |
| Farm Plot | none | +6 food | 90 sec |
| Quarry | none | +4 stone | 90 sec |
| Workshop | -8 wood, -4 stone | next construction 20% faster | instant buff job |
| Market Stall | -6 food | +3 coin | 60 sec |

### 4.5 Starter construction costs

| Building | Unlock | First instance cost | Construction time |
|---|---:|---:|---:|
| Lumber Camp | HQ1 | 0 wood, 0 coin | 30 sec |
| Farm Plot | HQ2 | 10 wood, 5 coin | 45 sec |
| Quarry | HQ3 | 15 wood, 5 coin | 60 sec |
| Workshop | HQ4 | 20 wood, 10 stone, 10 coin | 90 sec |
| Market Stall | HQ5 | 15 wood, 10 stone, 10 coin | 90 sec |

### 4.6 HQ upgrade costs

| Upgrade | Cost |
|---|---:|
| HQ1 → HQ2 | 20 wood, 10 food, 25 townXp |
| HQ2 → HQ3 | 30 wood, 20 stone, 50 townXp |
| HQ3 → HQ4 | 40 wood, 30 stone, 20 food, 90 townXp |
| HQ4 → HQ5 | 60 wood, 50 stone, 30 food, 140 townXp |

### 4.7 Required starter reward fix

Because Farm Plot unlocks at HQ2, HQ1 cannot naturally produce food. Therefore V1.1 must include a starter quest reward that makes HQ2 reachable without contradiction.

When the player collects the first Lumber Camp output, complete the quest **“First Timber”** and grant:

```json
{
  "food": 10,
  "townXp": 10
}
```

Combined with existing XP sources:

- place first Lumber Camp: `+10 townXp`
- collect first Lumber Camp job: `+5 townXp`
- First Timber quest reward: `+10 townXp`

This reaches the 25 XP needed for HQ2 after the player has collected enough wood.

### 4.8 First-hour golden path

| Beat | Target time | Player-visible moment | System requirement | Testable success |
|---|---:|---|---|---|
| 1 | 0:00–0:30 | “Welcome to Agent Town: Founders Plot.” | HQ1 visible; one CTA: “Place Lumber Camp.” | One primary CTA visible. |
| 2 | 0:30–1:30 | Player places Lumber Camp. | First Lumber Camp costs 0 and occupies slot. | Building enters `CONSTRUCTING`. |
| 3 | 1:30–2:30 | Lumber Camp completes. | Action exposed: “Start wood job.” | Correct selected-building action. |
| 4 | 2:30–6:30 | Player queues and collects enough wood. | Four jobs produce at least 24 wood total. | Inventory wood >= 20. |
| 5 | after first collection | First Timber reward appears. | Grant +10 food, +10 XP once. | Reward cannot duplicate. |
| 6 | 6:30–8:30 | HQ2 upgrade becomes available. | HQ upgrade validates exact costs. | HQ level becomes 2. |
| 7 | 8:30–10:00 | Farm Plot unlocks. | Build menu highlights Farm Plot. | Farm Plot action visible. |
| 8 | 10:00–12:00 | Foreman introduction. | OpenClaw Lite Foreman boots or shows honest failure. | Runtime state visible. |
| 9 | 12:00–15:00 | Standing Order prompt. | Player chooses Careful Steward or Bold Founder. | Policy saved and event logged. |
| 10 | 15:00–18:00 | Contract Board unlocks. | Two offers appear: one Supply, one Build. | Contract deck valid. |
| 11 | 18:00–25:00 | Player accepts one contract. | One active contract. | Contract CTA owns goal area. |
| 12 | 25:00–30:00 | Foreman auto-collect moment. | Auto-collect preset enabled; OpenClaw Lite performs action. | Event proves runtime-originated action. |
| 13 | by 30:00 | Receipt + recap line. | Recap separates player action, world progress, Foreman action. | Human-readable receipt appears. |

---

## 5. Living Contract Board v0

### 5.1 Purpose

Contracts must make the economy feel like a town responding to needs, not a checklist generator.

A contract must answer:

- Who is asking?
- Which institution do they represent?
- Why now?
- What does the town gain if this succeeds?
- What tradeoff does this create?

### 5.2 P0 contract types

Only two contract types are allowed in P0.

#### `SUPPLY`

A requester asks for existing resources.

Example:

```json
{
  "contractId": "contract_depot_firewood_001",
  "type": "SUPPLY",
  "title": "Stock the Depot",
  "requester": {
    "id": "jasper_depot_clerk",
    "displayName": "Jasper at the Depot",
    "institution": "Atlas Depot"
  },
  "whyNow": "The first wagons arrive at dusk and the depot needs dry timber for repairs.",
  "requirements": [{ "resource": "wood", "qty": 12 }],
  "rewards": { "coin": 5, "townXp": 8 },
  "townSignal": "depot_readiness",
  "teaches": "Contracts create demand beyond upgrading HQ."
}
```

#### `BUILD`

A requester asks the player to place or upgrade a specific building.

Example:

```json
{
  "contractId": "contract_market_breakfast_001",
  "type": "BUILD",
  "title": "Breakfast Before Market",
  "requester": {
    "id": "mara_market_host",
    "displayName": "Mara from Market Morning",
    "institution": "Market Circle"
  },
  "whyNow": "The market crowd will need a steady food source before sunrise trade begins.",
  "requirements": [{ "buildingType": "FARM_PLOT", "minCount": 1 }],
  "rewards": { "coin": 4, "townXp": 8 },
  "townSignal": "market_confidence",
  "teaches": "Buildings serve town needs, not only resource loops."
}
```

### 5.3 Contract lifecycle

```text
OFFERED -> ACTIVE -> READY_TO_TURN_IN -> COMPLETED
                  -> CANCELLED_BY_SYSTEM only if invalidated by migration/admin reset
```

`ABANDONED`, `EXPIRED`, `FAILED`, `RECOVERY`, and `PREPARATION` are not part of P0.

### 5.4 Board rules

- The board offers exactly two contracts after HQ2:
  - one `SUPPLY`,
  - one `BUILD`.
- The player may have exactly one active contract.
- The active contract owns the main goal area unless a higher-priority UI state overrides it.
- Generated contracts must only require resources/buildings available at the current HQ level.
- Contract rewards must use existing resources and XP only.
- Contract copy must include `requester.displayName`, `institution`, and `whyNow`.

### 5.5 Contract choice must imply town philosophy

Each offer must include one sentence showing its implied civic style.

Examples:

- “This helps the depot become reliable.”
- “This makes the market grow faster.”
- “This protects reserves before expanding.”
- “This favors fast growth over comfort.”

This is not a full ideology system. It is a minimal way to make contract choice feel authored.

### 5.6 Contract data model

```ts
type ContractV11 = {
  contractId: string;
  plotId: string;
  status: "OFFERED" | "ACTIVE" | "READY_TO_TURN_IN" | "COMPLETED" | "CANCELLED_BY_SYSTEM";
  type: "SUPPLY" | "BUILD";
  title: string;

  requester: {
    id: string;
    displayName: string;
    institution: "Headquarters" | "Atlas Depot" | "Market Circle" | "Town Hall";
  };

  whyNow: string;
  philosophyHint: string;
  requirements: Array<
    | { kind: "RESOURCE"; resource: "wood" | "stone" | "food" | "coin"; qty: number }
    | { kind: "BUILDING"; buildingType: BuildingType; minCount: number }
  >;
  rewards: Partial<Record<"wood" | "stone" | "food" | "coin" | "townXp", number>>;
  townSignal: "depot_readiness" | "market_confidence" | "hq_legitimacy" | "neighbor_goodwill";

  offeredAtMs: number;
  acceptedAtMs?: number;
  completedAtMs?: number;
  createdBy: "SYSTEM";
  generationSeed: string;
};
```

### 5.7 Contract tools

P0 tools:

```text
et.plot.contracts.get_state
et.plot.contracts.accept
et.plot.contracts.turn_in
```

Do not ship `abandon` in P0 unless the implementation already has it and it is hidden from the first-hour UI.

---

## 6. Foreman Standing Order v0

### 6.1 Purpose

The player must feel they have taught the Foreman something, not merely toggled automation.

V1.1 does **not** include the full future Doctrine Board. Instead it includes a tiny **Standing Order** choice that affects:

- Foreman Plan Cards;
- scheduler candidate scoring;
- whether the Foreman suggests spending or conserving;
- recap language;
- correction controls.

### 6.2 Standing Order presets

P0 includes exactly two presets.

#### `CAREFUL_STEWARD`

User-facing label: **Careful Steward**

Meaning:

- protect small reserves before rushing contracts;
- finish current work before starting optional work;
- ask before spending coin;
- prefer reliable production over speed.

Default for new players.

#### `BOLD_FOUNDER`

User-facing label: **Bold Founder**

Meaning:

- prioritize active contract progress and HQ growth;
- allow small coin spending within cap;
- accept tighter reserves;
- prefer visible progress when safe.

### 6.3 Standing Order data model

```ts
type ForemanStandingOrderV0 = {
  plotId: string;
  preset: "CAREFUL_STEWARD" | "BOLD_FOUNDER";
  coinPolicy: {
    allowSmallSpend: boolean;
    maxCoinSpendWithoutApproval: number; // 0 for Careful, 5 for Bold in P0
  };
  reservePolicy: {
    protectFoodBelow: number; // 12 for Careful, 6 for Bold
    protectWoodBelow: number; // 12 for Careful, 6 for Bold
  };
  workStyle: "FINISH_STARTED_WORK" | "CHASE_VISIBLE_PROGRESS";
  updatedAtMs: number;
  updatedBy: "HUMAN";
};
```

### 6.4 Standing Order UI

Show after HQ2 and before the first Foreman automation prompt.

Copy:

> “How should Clover help while you are learning the town?”

Cards:

- **Careful Steward** — “Protect supplies and ask before spending.”
- **Bold Founder** — “Push growth when the move is safe.”

The player may change this later from the Foreman drawer.

### 6.5 Required effects

The Standing Order must be used in at least three places.

| Surface | Required effect |
|---|---|
| Plan Card | Must include one clause referencing the active standing order when relevant. |
| Scheduler scoring | If two safe actions are available, choose according to preset. |
| Recap | Foreman action line must say which standing order or permission governed the action. |

### 6.6 Teaching language rule

V1.1 may say:

- “Give your Foreman a standing order.”
- “Teach your Foreman the first way you like to run the town.”
- “Clover will follow this until you change it.”

V1.1 must not say:

- “Your Foreman learns your style automatically.”
- “Your Foreman will keep working after you close the tab.”
- “Your Foreman can run the town for you.”

---

## 7. Goal and attention arbitration

### 7.1 Purpose

The UI must have exactly one primary owner of the player’s attention at a time. A clean layout is not enough; the product needs a decision hierarchy.

### 7.2 Priority order

When multiple systems want attention, use this order:

1. **Blocking approval or safety warning**
   - Example: “Clover needs approval before spending coin.”
2. **Critical town failure**
   - Example: storage full and outputs would be lost; no production possible; save migration issue.
3. **Tutorial/current milestone**
   - Example: “Place the Lumber Camp.”
4. **Ready-to-turn-in active contract**
   - Example: “Stock the Depot is ready.”
5. **Active contract progress suggestion**
   - Example: “Need 6 more wood for Stock the Depot.”
6. **Foreman receipt**
   - Example: “Clover collected 6 food.”
7. **Optional Foreman optimization**
   - Example: “I can keep the Farm Plot running.”
8. **General recap suggestion**
   - Example: “Tomorrow, consider a Quarry.”

### 7.3 CTA ownership rules

- Only the highest-priority active item may show the primary CTA.
- Lower-priority items may appear as passive status chips or inside drawers.
- The Foreman may not interrupt tutorial steps unless there is a blocking approval or critical state.
- The active contract may not override a required onboarding milestone before the player understands the relevant building/action.
- A Foreman Plan Card must explicitly say which goal it is serving:
  - `tutorial`,
  - `active_contract`,
  - `standing_order`,
  - `town_stability`,
  - `idle_optimization`.

### 7.4 Foreman silence rules

The Foreman must stay quiet when:

- the player is in the middle of a required tutorial click;
- no safe action exists;
- the only available action would conflict with the Standing Order;
- the player has snoozed that suggestion type;
- runtime state is stale or disconnected.

When quiet due to policy, the status line should say why in short form:

> “Clover is watching. No safe action inside your standing order.”

---

## 8. OpenClaw Lite Foreman v1

### 8.1 Requirement

Founders Plot V1.1 must use OpenClaw Lite / Town Runner Lite as the in-session Foreman runtime.

A server request with `actor: "AGENT"` in the JSON body is not proof of Foreman agency.

### 8.2 Runtime states

Use these user-facing labels:

| Internal state | User label | Meaning |
|---|---|---|
| `NOT_STARTED` | Foreman not started | Worker has not been booted. |
| `BOOTING` | Foreman saddling up | Worker is loading pack/runtime. |
| `OBSERVING` | Foreman watching | Worker is connected and receiving observations. |
| `THINKING` | Foreman thinking | Worker is preparing a plan. |
| `WAITING_FOR_PERMISSION` | Needs your say-so | Best action needs approval or permission. |
| `ACTING` | Foreman working | Worker is invoking an allowed tool. |
| `PAUSED` | Foreman paused | Human paused automation. |
| `STALE` | Foreman lost the trail | Worker lease/heartbeat stale; no actions allowed. |
| `ERROR` | Foreman needs help | Runtime failed; no actions allowed. |

### 8.3 Observation packet

The worker receives a structured observation packet. It must not scrape the DOM.

```ts
type FoundersPlotObservationV11 = {
  schemaVersion: "founders-plot.obs.v1.1";
  plotId: string;
  nowMs: number;
  runtimeId: string;

  currentGoal: {
    owner: "tutorial" | "active_contract" | "approval" | "foreman" | "recap";
    text: string;
    priorityRank: number;
  };

  inventory: Record<"wood" | "stone" | "food" | "coin", number>;
  townXp: number;
  hqLevel: number;
  storageCaps: Record<"wood" | "stone" | "food", number>;

  buildings: Array<{
    buildingId: string;
    type: BuildingType;
    state: "EMPTY_PAD" | "CONSTRUCTING" | "IDLE" | "PRODUCING" | "OUTPUT_READY" | "UPGRADING";
    outputReady?: { resource: "wood" | "stone" | "food" | "coin"; qty: number };
    jobEndsAtMs?: number;
  }>;

  activeContract: ContractV11 | null;
  standingOrder: ForemanStandingOrderV0;

  permissions: {
    collectOutputs: boolean;
    queueProduction: boolean;
    spendCoinCap: number;
  };

  scheduler: {
    enabled: boolean;
    activePresets: Array<"COLLECT_READY_OUTPUTS" | "KEEP_ONE_BUILDING_RUNNING">;
    paused: boolean;
  };

  allowedTools: string[];
  recentEvents: Array<{ eventId: string; type: string; summary: string; atMs: number }>;
};
```

### 8.4 Foreman decision boundary

For V1.1, the decision model is intentionally hybrid and testable.

1. **Deterministic server/client logic enumerates safe candidate actions.**
   - Example: “Farm Plot output is ready and collect permission is enabled.”
2. **The Foreman worker chooses among safe candidates or no-ops.**
   - In tests, use a deterministic test brain.
   - In live mode, the LLM may phrase and rank among equivalent safe options.
3. **The server validates the chosen tool again.**
   - No tool call succeeds just because the Foreman chose it.
4. **If the model fails, times out, or returns an invalid plan, the worker no-ops.**
   - UI shows “Clover watched but did not act.”
   - The server must not invent an action on the model’s behalf.

### 8.5 Foreman Plan Card

The Plan Card must not repeat obvious UI facts unless it adds judgment.

Required structure:

```ts
type ForemanPlanCardV11 = {
  headline: string;
  goalServed: "tutorial" | "active_contract" | "standing_order" | "town_stability" | "idle_optimization";
  observation: string;
  recommendation: string;
  reason: string;
  standingOrderInfluence?: string;
  canActNow: boolean;
  proposedTool?: string;
  requiresApproval: boolean;
  alternative?: string;
};
```

Example:

> **Clover can collect the Farm Plot.**  
> The Farm Plot has 6 food ready. Your Careful Steward order protects food reserves, and collecting does not spend anything. I can collect it now.

### 8.6 Foreman-authenticated action route

Add a route that cannot be spoofed by client JSON:

```text
POST /api/founders-plot/foreman/tool/:toolName
```

Requirements:

- Requires a valid server-issued `foremanRuntimeToken` or runtime session cookie.
- Token binds:
  - `plotId`,
  - `runtimeId`,
  - `pairId` or user/session owner,
  - allowed tool scopes,
  - expiration.
- Request body must not accept `actor`.
- Server derives actor as `FOREMAN` only from the authenticated runtime session.
- If a normal client calls this route without runtime auth, return `403 FOREMAN_RUNTIME_REQUIRED`.

### 8.7 Actor spoof rejection

The old general tool route may continue to exist for human UI actions, but it must reject direct actor spoofing.

If `/api/founders-plot/tool/:toolName` receives:

```json
{ "actor": "AGENT" }
```

it must either ignore it and treat the actor as human, or reject it with:

```json
{
  "ok": false,
  "error": {
    "code": "ACTOR_SPOOF_REJECTED",
    "message": "Agent actions must come through the Foreman runtime route.",
    "retryable": false
  }
}
```

Prefer rejection for clarity.

---

## 9. Scheduler v0, narrowed

### 9.1 Purpose

The scheduler exists to prove the differentiated fantasy:

> “I can hand off a routine task to my AI Foreman.”

It does not exist to ship a generalized automation framework in V1.1.

### 9.2 P0 preset: `COLLECT_READY_OUTPUTS`

User-facing label: **Collect ready outputs**

Behavior:

- On each scheduler tick, if any approved building has `OUTPUT_READY`, the Foreman may collect exactly one output batch.
- Requires `collectOutputs` permission enabled.
- Does not spend resources.
- Must respect storage caps and emit `cappedLost` if applicable.
- Must use the Foreman-authenticated route.
- Must emit receipt and recap lines.

### 9.3 P1 preset: `KEEP_ONE_BUILDING_RUNNING`

User-facing label: **Keep one building running**

Behavior:

- If enabled, the Foreman may queue one production job for one eligible building.
- Requires `queueProduction` permission.
- If multiple buildings are eligible, choose based on active contract and Standing Order.
- This is P1, not required for P0 completion.

### 9.4 Deferred presets

The following are not V1.1 P0/P1:

- `MAINTAIN_RESOURCE_RESERVE`
- `CHECK_BOTTLENECK`
- `ASSIST_ACTIVE_CONTRACT`

They belong to V2 or a later V1.x spec after P0 proves the hero moment.

### 9.5 Scheduler data model

Even though P0 has one preset, store it server-side so reload and future backend execution are possible.

```ts
type ForemanTaskV11 = {
  taskId: string;
  plotId: string;
  runtimeScope: "BROWSER_OPENCLAW_LITE";
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  preset: "COLLECT_READY_OUTPUTS" | "KEEP_ONE_BUILDING_RUNNING";
  createdBy: "HUMAN";

  schedule: {
    kind: "EVERY_MS";
    everyMs: number; // P0 default: 10000
    jitterMs: number; // P0 default: 1000
  };

  policy: {
    requiredPermission: "collectOutputs" | "queueProduction";
    maxActionsPerRun: 1;
    maxRunsPerHour: number;
  };

  lease?: {
    claimedByRuntimeId: string;
    leaseUntilMs: number;
  };

  lastRunAtMs?: number;
  nextRunAtMs: number;
  runCount: number;
  lastResult?: "SUCCESS" | "NOOP" | "BLOCKED" | "ERROR";
  lastErrorCode?: string;

  createdAtMs: number;
  updatedAtMs: number;
};
```

### 9.6 Scheduler conflict rule

For P0, conflict handling is simple:

- Collecting ready output always beats optional queueing.
- Only one scheduler task may execute per tick.
- If multiple outputs are ready, choose the output that best supports the current attention priority:
  1. active contract requirement,
  2. Standing Order reserve policy,
  3. oldest ready output.

### 9.7 No duplicate execution

The server must guarantee:

- one lease winner per due task;
- one successful collection per output batch;
- idempotency replay returns the same result;
- duplicate ticks never duplicate inventory.

---

## 10. Trust, correction, and recovery UX

### 10.1 Receipt structure

Every Foreman action must create a visible receipt.

```ts
type ForemanReceiptV11 = {
  receiptId: string;
  eventId: string;
  atMs: number;
  action: string;
  result: string;
  reason: string;
  authorityUsed: string;
  standingOrderUsed?: "CAREFUL_STEWARD" | "BOLD_FOUNDER";
  correctionOptions: Array<"DO_THIS_NEXT_TIME" | "ASK_ME_NEXT_TIME" | "SNOOZE_THIS_SUGGESTION" | "PAUSE_FOREMAN">;
};
```

Example:

> Clover collected 6 food from Farm Plot because Collect ready outputs is enabled and your Careful Steward order protects food reserves.

### 10.2 Correction controls

At least two correction controls must exist in P0:

1. **Ask me next time**
   - Pauses or disables the relevant preset.
2. **Pause Foreman**
   - Immediately prevents future Foreman actions.

P1 may add:

- **Do this automatically next time**
- **Snooze this kind of suggestion**
- **Why this over that?**

### 10.3 Failure-state copy

| Failure | Required user copy | Required behavior |
|---|---|---|
| Worker fails to boot | “Clover could not start. You can still play by hand.” | No automation; manual tools work. |
| Runtime stale | “Clover lost the trail. Automation is paused.” | Fail closed. |
| Model timeout | “Clover watched but did not choose an action.” | No-op. |
| Permission missing | “Clover needs your say-so before doing that.” | Create approval or suggestion only. |
| Storage capped | “Some output could not fit.” | Emit `cappedLost`. |
| Duplicate tick | No visible duplicate warning unless debug mode. | No duplicate mutation. |

---

## 11. Recap and audit surface

### 11.1 Required recap sections

The recap must separate:

1. **What you did**
2. **What the town produced**
3. **What Clover did**
4. **What Clover skipped or asked about**
5. **What needs your decision now**

### 11.2 Required Foreman recap line

A Foreman action recap line must include:

- action;
- target building/tool;
- result;
- reason;
- permission/preset;
- standing order if relevant;
- event link/id.

Example:

> Clover collected 6 food from Farm Plot because Collect ready outputs was enabled and Careful Steward prioritizes reserves. Event: `evt_...`.

### 11.3 Passive simulation vs Foreman action

Do not mix passive production with Foreman action.

Bad:

> “While you were away, Clover produced 6 food.”

Good:

> “Farm Plot finished producing 6 food. Clover collected it after the output was ready.”

---

## 12. Resource ledger and replay hardening

### 12.1 Resource delta schema

Every economy event must include explicit resource deltas.

```ts
type ResourceDeltaV11 = {
  before: Partial<Record<"wood" | "stone" | "food" | "coin" | "townXp", number>>;
  consumed: Partial<Record<"wood" | "stone" | "food" | "coin" | "townXp", number>>;
  produced: Partial<Record<"wood" | "stone" | "food" | "coin" | "townXp", number>>;
  collected: Partial<Record<"wood" | "stone" | "food" | "coin" | "townXp", number>>;
  rewarded: Partial<Record<"wood" | "stone" | "food" | "coin" | "townXp", number>>;
  cappedLost: Partial<Record<"wood" | "stone" | "food" | "coin" | "townXp", number>>;
  after: Partial<Record<"wood" | "stone" | "food" | "coin" | "townXp", number>>;
};
```

### 12.2 Replay requirement

Event-snapshot replay is not enough. Add action-log replay fixtures.

Fixture shape:

```ts
type ActionReplayFixtureV11 = {
  fixtureId: string;
  initialState: object;
  actions: Array<{
    atOffsetMs: number;
    actor: "HUMAN" | "FOREMAN" | "SYSTEM";
    toolName: string;
    args: object;
    expectedOk: boolean;
  }>;
  timeAdvances: Array<{ atOffsetMs: number; advanceByMs: number }>;
  expectedFinalHash: string;
};
```

---

## 13. Required APIs and tools

### 13.1 Existing plot tools

Keep existing tool names:

```text
et.plot.get_state
et.plot.place_building
et.plot.queue_job
et.plot.collect_outputs
et.plot.upgrade_building
et.plot.set_priority
et.plot.claim_reward
et.plot.request_user_approval
```

### 13.2 Contract tools

P0:

```text
et.plot.contracts.get_state
et.plot.contracts.accept
et.plot.contracts.turn_in
```

### 13.3 Foreman tools / routes

P0 server routes:

```text
POST /api/founders-plot/foreman/session/start
POST /api/founders-plot/foreman/session/heartbeat
POST /api/founders-plot/foreman/session/pause
POST /api/founders-plot/foreman/tool/:toolName
GET  /api/founders-plot/foreman/observation
```

### 13.4 Scheduler tools

P0:

```text
et.foreman.scheduler.get_status
et.foreman.scheduler.enable_collect_ready_outputs
et.foreman.scheduler.pause
et.foreman.scheduler.resume
```

P1:

```text
et.foreman.scheduler.enable_keep_building_running
```

Do not expose arbitrary `schedule_task` in P0. Internally the server may use a generic implementation, but the player and Foreman see safe presets.

### 13.5 Standing Order tools

```text
et.foreman.policy.get_standing_order
et.foreman.policy.set_standing_order
```

Only the human may set standing order in P0. The Foreman may recommend changing it but cannot change it.

---

## 14. UI launch gate

### 14.1 Main screen regions

Mobile-first order:

1. Plot stage / town view
2. Resource strip
3. Current Goal card
4. Contextual action sheet
5. Foreman drawer
6. Contract Board drawer
7. Recap drawer

Desktop may show more surfaces at once, but attention arbitration still permits only one primary CTA.

### 14.2 Forbidden early UI language

Do not show these in the main game loop:

- provider
- model
- OpenRouter
- API key
- wallet
- ERC-8004
- runtime lease
- JSON
- MCP
- worker debug
- raw event log
- scheduler task id

These may exist in advanced/backstage surfaces only.

### 14.3 Visual acceptance

Required screenshot baselines:

- 390px width mobile
- 768px tablet
- 1280px desktop

Pass conditions:

- no overlapping panels;
- one primary CTA;
- current goal readable;
- resources visible;
- Foreman status visible but not dominant;
- no forbidden early jargon;
- selected building action is obvious.

---

## 15. TDD and measurable metrics

The separate `agent-town-founders-plot-v1.1-tdd-acceptance-matrix.md` is normative. This section summarizes the release gates.

### 15.1 P0 release metrics

| Metric | Required value |
|---|---:|
| `FirstHourGoldenPathPassRate` | 100% in deterministic E2E |
| `FirstActionableCtaVisibleMs` | <= 5000 ms |
| `ForbiddenGameLoopJargonCount` | 0 |
| `AgentOriginatedActionCoverage` | 100% for Foreman actions |
| `ActorSpoofRejectionRate` | 100% |
| `PolicyViolationRate` | 0 |
| `DuplicateTaskExecutionRate` | 0 |
| `ResourceConservationError` | 0 |
| `ForemanReceiptCoverage` | 100% |
| `RecapAttributionCoverage` | 100% |
| `StandingOrderInfluenceCoverage` | 100% for Plan Card scenarios where Standing Order is relevant |
| `ConsoleErrorCountGoldenPath` | 0 |

### 15.2 Player-understanding metrics

These are manual/playtest or instrumented survey metrics. They do not block CI but they do block “public launch” readiness.

| Metric | Target |
|---|---:|
| `ForemanEnabledAfterUnlockRate` | >= 60% in internal playtest |
| `UnderstandsInSessionOnlyBoundaryRate` | >= 80% answer correctly |
| `FirstForemanActionUnderstoodRate` | >= 80% answer correctly without debug language |
| `FirstActionUnsurprisingRate` | >= 80% |
| `OnePrimaryGoalComprehensionRate` | >= 85% |

---

## 16. Milestone roadmap

### Milestone 0 — Spec landing and branch guardrails

Deliver:

- add this refined spec to repo;
- add feedback-resolution doc;
- add TDD acceptance matrix;
- update branch README or implementation notes to say old V1.1 scope is superseded by refined P0/P1/P2.

Acceptance:

- docs exist;
- implementers can identify P0/P1/P2;
- no team member treats deferred scheduler presets as required for V1.1.

### Milestone 1 — Launch Gate and first-hour progression

Deliver:

- first-hour table implemented;
- First Timber starter reward fix;
- no-jargon game loop;
- responsive screenshots;
- one CTA arbitration in static UI states.

Acceptance:

- first-hour E2E reaches HQ2 and Farm Plot unlock;
- screenshot baselines pass;
- no forbidden language in main game loop.

### Milestone 2 — Living Contract Board P0

Deliver:

- two contract types: `SUPPLY`, `BUILD`;
- named requesters and institutions;
- one active contract;
- contract turn-in;
- contract events and recap lines.

Acceptance:

- generated contracts are satisfiable;
- contracts include who/why/townSignal;
- rewards apply exactly once;
- active contract follows attention priority rules.

### Milestone 3 — Foreman Standing Order v0 and priority framework

Deliver:

- Careful Steward / Bold Founder UI;
- policy persistence;
- Plan Card references Standing Order;
- attention arbitration implemented;
- correction controls: Ask me next time, Pause Foreman.

Acceptance:

- policy change alters Plan Card output in deterministic tests;
- top-priority CTA wins in conflict fixtures;
- Foreman stays quiet when required.

### Milestone 4 — OpenClaw Lite Foreman runtime path

Deliver:

- worker boots inside Founders Plot;
- worker receives observation packet;
- worker reads pack files;
- deterministic test brain can select safe action;
- Foreman-authenticated route exists;
- actor spoof rejection exists.

Acceptance:

- test proves first Foreman action originates from runtime path;
- raw `actor: AGENT` spoof fails;
- stale/error states fail closed.

### Milestone 5 — Scheduler P0: Collect ready outputs

Deliver:

- `COLLECT_READY_OUTPUTS` preset;
- server-persisted task;
- due task claim/lease;
- Foreman execution through runtime route;
- receipt and recap.

Acceptance:

- one completed output is collected by the Foreman;
- no duplicate collection under double tick;
- pause prevents execution;
- recap separates passive production from Foreman collection.

### Milestone 6 — Hardening and P1 decision

Deliver:

- resource ledger;
- action-log replay fixture;
- final golden-path run;
- P1 go/no-go review.

Acceptance:

- all P0 metrics pass;
- human maintainer decides whether P1 `KEEP_ONE_BUILDING_RUNNING` lands in same branch or next branch.

---

## 17. Definition of done

V1.1 P0 is done only when this exact scenario works:

1. A fresh player enters Agent Town: Founders Plot.
2. The player can place a Lumber Camp, collect enough wood, receive the starter reward, and upgrade to HQ2.
3. The player unlocks Farm Plot and the Contract Board.
4. The player chooses a Standing Order for the Foreman.
5. The player accepts a `SUPPLY` or `BUILD` contract from a named town stakeholder.
6. The OpenClaw Lite Foreman boots and receives a structured observation.
7. The player enables **Collect ready outputs**.
8. A building output becomes ready.
9. The Foreman scheduler ticks.
10. The Foreman calls `et.plot.collect_outputs` through the Foreman-authenticated route.
11. The server validates permission, idempotency, and runtime authority.
12. The inventory changes exactly once.
13. The UI shows a receipt.
14. The recap later says what the Foreman did and why.
15. A spoofed manual `actor: "AGENT"` request is rejected.
16. The player can pause the Foreman and no further scheduled actions happen.

If any step fails, V1.1 is not done.

---

## 18. Implementation notes for agentic AI developers

1. **Do not broaden scope.** Implement P0 first. P1 requires all P0 tests passing.
2. **Do not fake the Foreman.** A request body label is not Foreman agency.
3. **Do not expose schedule internals to players.** Use presets.
4. **Do not overuse the LLM.** Deterministic candidate enumeration comes first; the model may explain and choose among safe candidates.
5. **Do not make the UI a dashboard.** The game surface must preserve one current goal.
6. **Do not claim off-session automation.** Browser worker automation is in-session only.
7. **Do not add new resources.** Depth comes from goals, stakeholders, standing orders, and trust.
8. **Keep future paths open.** Store scheduler tasks in a way that backend-pool execution can reuse later.


---

## 19. Final implementation directive

Build V1.1 around the first believable delegation moment.

The release is not “a scheduler platform.”  
The release is not “contracts plus UI polish.”  
The release is not “OpenClaw Lite is somewhere in the repo.”

The release is:

> **A real small town loop where the player gives the Foreman one simple standing order and watches the actual OpenClaw Lite Foreman safely perform one useful scheduled action inside that order.**

That is the product proof.
