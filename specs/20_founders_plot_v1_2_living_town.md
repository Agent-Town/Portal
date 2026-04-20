# Agent Town: Founders Plot V1.2 Specification
## Living Town Contracts, Town Signals, and Real Foreman Intent Loop

**Document status:** implementation specification for the next sprint after `codex/founders-plot-v1-1-sprint`  
**Date:** 2026-04-19  
**Product:** Agent Town  
**Launch chapter:** Agent Town: Founders Plot  
**Target branch name:** `codex/founders-plot-v1-2-living-town`  
**Baseline branch:** `codex/founders-plot-v1-1-sprint`  
**Primary reader:** agentic AI developers, game engineers, UI/UX, AI-agent/runtime engineers, QA agents  
**Implementation mode:** strict TDD; no feature is complete unless its measurable tests pass  

---

## 0. One-paragraph summary for future LLMs

V1.1 landed the first playable AI-assisted builder slice: a polished first-hour plot loop, `SUPPLY` and `BUILD` contracts, one Standing Order, one `COLLECT_READY_OUTPUTS` scheduler preset, a Foreman-authenticated server route, receipts, recap, and ledger/replay hardening. V1.2 must **not** jump to persistent/off-session autonomy. V1.2 adds the next V1 decision layer: **living-town demand and attachment**. The player should now feel that contracts come from recurring people and institutions, that choices affect visible town signals, that coin has an early purpose, and that the town looks and reads more like a place. V1.2 also closes a V1.1 technical/product integrity gap: the Foreman tick must be owned by the OpenClaw Lite worker command path, not by page/test code that merely carries a runtime token.

---

## 1. Current implementation read: what V1.1 now gives us

### 1.1 Codebase reality observed in `codex/founders-plot-v1-1-sprint`

The V1.1 sprint branch adds a substantial implementation layer over Phase 1:

- V1.1 docs are now in-repo under `specs/18_*` and the future backlog is under `specs/19_*`.
- Founders Plot has new E2E files for launch gate, contract board, standing order/goal arbitration, Foreman runtime auth, scheduler/receipt/audit, ledger/replay, and UI surfaces.
- The Founders Plot tool surface now includes contract, standing-order, scheduler, and Foreman routes.
- The server exposes Foreman session start/heartbeat/pause, observation, authenticated Foreman tool execution, receipt correction, contracts, recap, replay, and policy routes.
- The client can start a Foreman runtime, fetch pack files, request observation, run a Foreman tick, and display scheduler/receipt/UI surfaces.
- Replay now exposes resource deltas and an action-log fixture concept.

### 1.2 Product success from V1.1

V1.1 successfully moved the game from “builder prototype” to “first AI-assisted home-plot game slice.” It proves that the project can ship:

- a server-authoritative plot simulation;
- a small but coherent economy;
- a first progression path to HQ2 and Farm Plot;
- contracts with named requesters;
- Standing Order v0;
- a bounded Foreman action;
- receipt and recap attribution;
- actor-spoof rejection;
- and deterministic tests around the AI gameplay surface.

### 1.3 Important remaining issue from V1.1

V1.1 is good enough to build on, but V1.2 must be honest about one runtime gap:

> In V1.1, the Foreman route is authenticated and runtime-labeled, but the visible tick orchestration still appears to be driven by page/test harness functions that request observation and call the Foreman route. V1.2 must move the decision/tick execution into an actual OpenClaw Lite worker command path.

This does **not** mean V1.1 failed. It means V1.1 created the server authority path and V1.2 should close the loop so the player-facing claim “the Foreman acted” is stronger and less dependent on page glue.

### 1.4 What V1.2 must not reopen

Do not reopen these decisions:

- Product name is **Agent Town**.
- Founders Plot is the **launch chapter / starting campaign**.
- V1 remains stylized frontier founding, not a generic multi-era city game.
- The server owns world truth.
- Agents act only through typed tools.
- Browser execution is in-session only.
- Persistent/off-session Foreman is V2, not V1.2.
- Full doctrine board, specialist Foremen, social sharing, ERC-8004 gameplay gates, token economy, UGC/vibecoding, marketplace, and era expansion remain deferred.

---

## 2. V1.2 product promise

### 2.1 Public promise

> **Agent Town: Founders Plot now feels more like a living frontier town. The player helps recurring people and institutions, sees civic signals improve, gives Clover one small operating style, and watches the Foreman act through a real in-session worker loop.**

### 2.2 Player-facing hero moment

By the end of the V1.2 golden path, the player should be able to say:

> “I chose whether to help the depot, the market, or the neighborhood first. My choice changed the town’s signals and recap. I upgraded the public square with earned coin. Clover noticed the town’s need, followed my standing order, and handled a routine task through the real worker path.”

### 2.3 What V1.2 must prove

V1.2 must prove six things, in order:

1. **The town has recurring people.** Requesters are stable light characters, not throwaway strings.
2. **The town has visible civic needs.** Contract choices affect simple town signals.
3. **The player has a meaningful next goal after V1.1.** Contract board refresh, signals, and the public-square upgrade extend the loop without adding resource bloat.
4. **Coin has a first useful sink.** Coin is not only a reward number.
5. **The Foreman is a real in-session agent player.** OpenClaw Lite owns the Foreman tick and tool call path.
6. **The UI remains clean.** One primary CTA remains true even with signals, contracts, receipts, and a landmark.

---

## 3. Scope discipline

### 3.1 P0, must ship

V1.2 P0 is the next sprint target. Do not mark V1.2 complete unless every P0 test passes.

| Area | P0 scope |
|---|---|
| V1.1 guardrail | All V1.1 P0 tests remain passing. No V1.2 change may break the first-hour loop. |
| Foreman worker-loop closure | The OpenClaw Lite worker, not the page/test harness, owns observe → decide → tool-call for one in-session tick. |
| Requester model v0 | Convert contract requesters into persistent light characters/institutions with IDs, names, role copy, affinity, and history. |
| Town signals v0 | Add 4 visible town signals: `depotReadiness`, `marketConfidence`, `neighborGoodwill`, `publicCharm`. |
| Contract Board v1 | Board offers up to 3 cards: one `SUPPLY`, one `BUILD`, one `PREPARATION` once unlocked. One active contract remains. |
| Preparation contract v0 | Add one positive, event-like `PREPARATION` contract type with recoverable miss semantics and no harsh penalty. |
| Deck rules | Deterministic deck, duplicate prevention, requirement validity, refresh after completion/miss. |
| Coin sink v0 | Add one early, safe coin sink: `Public Square Welcome Sign` / `Public Square Level 1`. |
| Recap and Town Journal | Recap names requesters, signal changes, landmark improvements, and Foreman actions separately. |
| UI/UX | Add requesters, signal panel, and public-square progress without turning the screen into a dashboard. |
| Tests | Deterministic tests for deck, signals, coin sink, requester recall, worker-owned Foreman tick, recap, and screenshots. |

### 3.2 P1, ship only after P0 is green

| Area | P1 scope |
|---|---|
| Recovery contract v0 | Add `RECOVERY` only if it is mechanically distinct from `SUPPLY`: it must spawn from a visible shortage/signal condition. |
| Keep running preset | Add `KEEP_ONE_BUILDING_RUNNING` if the worker-loop closure is strong and conflict rules are implemented. |
| Requester affinity | Requesters remember completed/missed contracts and vary copy based on simple affinity. |
| Manual board refresh | Allow one paid board refresh when no contract is active; cost must be small and never block tutorial. |
| Public-square visual polish | Add screenshot-worthy visual states for level 0 and level 1. |

### 3.3 P2, explicitly deferred

Do not implement these in V1.2 unless a human maintainer writes a new spec:

- persistent/off-session Foreman;
- backend-pool runtime/offload;
- full Doctrine Board;
- authority ladder beyond V1.1/V1.2 permissions;
- arbitrary scheduler presets;
- `ASSIST_ACTIVE_CONTRACT` generalized automation;
- specialist Foremen;
- Founding Charters;
- capability web;
- social sharing / visitor mode;
- ERC-8004 as a gameplay requirement;
- tokenized economy;
- marketplace;
- UGC/vibecoding;
- multi-era progression;
- multiplayer/shared-world simulation.

---

## 4. Existing code to reuse and extend

### 4.1 Keep and extend these files

```text
public/founders-plot.html
public/experiences/founders-plot/app.js
public/experiences/founders-plot/styles.css
public/experiences/founders-plot/manifest.json
public/experiences/founders-plot/skill.md
public/experiences/founders-plot/tools.md
public/experiences/founders-plot/goals.md
public/openclaw-lite/gateway.js
public/openclaw-lite/worker.js
vendors/openclaw-lite-main/src/openclaw-lite/worker.js
server/founders_plot/engine.js
server/founders_plot/store.js
server/founders_plot/routes.js
server/founders_plot/tools.js
server/founders_plot/recap.js
server/founders_plot/replay.js
e2e/helpers/founders_plot.js
e2e/139_founders_plot_v11_launch_gate.spec.js
e2e/140_founders_plot_v11_contract_board.spec.js
e2e/141_founders_plot_v11_standing_order_and_goal_arbitration.spec.js
e2e/142_founders_plot_v11_foreman_runtime_auth.spec.js
e2e/143_founders_plot_v11_scheduler_receipt_audit.spec.js
e2e/144_founders_plot_v11_ledger_replay.spec.js
e2e/145_founders_plot_v11_ui_surfaces.spec.js
```

### 4.2 Add these files

```text
specs/20_founders_plot_v1_2_living_town.md
specs/20_founders_plot_v1_2_tdd_matrix.md          # optional if team prefers separate matrix
server/founders_plot/contract_deck.js              # optional extraction; recommended
server/founders_plot/town_signals.js               # optional extraction; recommended
server/founders_plot/foreman_worker_bridge.js      # optional extraction; recommended
e2e/146_founders_plot_v12_worker_owned_tick.spec.js
e2e/147_founders_plot_v12_living_contract_deck.spec.js
e2e/148_founders_plot_v12_town_signals_and_journal.spec.js
e2e/149_founders_plot_v12_public_square_coin_sink.spec.js
e2e/150_founders_plot_v12_recap_and_ui.spec.js
```

### 4.3 Compatibility rule

Existing V1.1 saves must migrate automatically. Fresh V1.2 state uses `compatibility.schemaVersion = 3`. Existing V1.1 state with `schemaVersion = 2` must be upgraded lazily on load.

Migration must add defaults:

```json
{
  "townSignals": {
    "depotReadiness": 50,
    "marketConfidence": 50,
    "neighborGoodwill": 50,
    "publicCharm": 0
  },
  "requesters": [],
  "contractDeck": {
    "version": "v1.2",
    "refreshCount": 0,
    "recentContractKeys": []
  },
  "landmarks": {
    "publicSquare": { "level": 0, "upgradedAtMs": 0 }
  },
  "foremanWorker": {
    "lastWorkerCommandId": "",
    "lastWorkerTraceId": ""
  }
}
```

---

## 5. Design and UX requirements

### 5.1 Visual hierarchy

The main Founders Plot screen must remain one composition, not a dashboard. V1.2 adds town life, so it must reduce clutter elsewhere.

Required hierarchy:

1. **Current Goal** — one primary CTA only.
2. **Plot Stage** — buildings and public-square state.
3. **Contract Board** — 2–3 cards, collapsible on mobile.
4. **Town Signals** — compact, readable, non-KPI-heavy.
5. **Foreman Drawer** — status, plan, receipt, correction controls.
6. **Journal/Recap** — drawer or secondary surface.

### 5.2 Forbidden early-game words

The player-facing game loop must not expose these terms unless in a developer/debug toggle:

```text
provider, model, OAuth, wallet, blockchain, runtime token, bearer, MCP, JSON, debug, schema, worker trace
```

The UI may say:

- “Clover is watching.”
- “Clover handled one routine.”
- “Clover needs your say-so.”
- “Clover is paused.”

### 5.3 Current Goal arbitration update

V1.2 keeps the V1.1 attention priority and inserts town-event/preparation states carefully.

Priority order:

1. Blocking approval or safety warning.
2. Critical town failure / invalid migration / stale runtime truth.
3. Tutorial/current milestone.
4. Ready-to-turn-in active contract.
5. Active `PREPARATION` contract with due time under 2 minutes.
6. Active contract progress suggestion.
7. Foreman receipt.
8. Public-square upgrade available.
9. Optional Foreman optimization.
10. General recap/journal suggestion.

Only the highest active item may own the primary CTA.

### 5.4 Town Signals UX

Town Signals must feel like civic texture, not spreadsheet analytics.

User-facing labels:

| Signal key | Label | Meaning |
|---|---|---|
| `depotReadiness` | Depot Readiness | Logistics and basic supplies are dependable. |
| `marketConfidence` | Market Confidence | Traders believe the settlement can support activity. |
| `neighborGoodwill` | Neighbor Goodwill | Locals feel helped and heard. |
| `publicCharm` | Public Charm | The plot looks and feels like a place worth visiting. |

Display rule:

- Show signals as small bars/chips with plain-language state: `Low`, `Steady`, `Strong`.
- Do not show more than four signals.
- Do not add a second currency-like score.

Signal bands:

```ts
function signalBand(value: number): "LOW" | "STEADY" | "STRONG" {
  if (value < 35) return "LOW";
  if (value < 70) return "STEADY";
  return "STRONG";
}
```

---

## 6. Requester and institution model v0

### 6.1 Purpose

The player should recognize recurring town people. Contracts must feel like requests from a place, not random cards.

### 6.2 Data model

```ts
type RequesterV12 = {
  requesterId: string;
  displayName: string;
  institution: "Atlas Depot" | "Market Circle" | "Town Hall" | "Neighbor Row";
  roleTitle: string;
  portraitEmoji: string;
  personalityTag: "practical" | "warm" | "ambitious" | "careful";
  signalAffinity: "depotReadiness" | "marketConfidence" | "neighborGoodwill" | "publicCharm";
  completedContracts: number;
  missedContracts: number;
  lastContractId?: string;
  lastSeenAtMs: number;
};
```

### 6.3 Required default cast

```ts
const REQUESTERS_V12: RequesterV12[] = [
  {
    requesterId: "jasper_depot_clerk",
    displayName: "Jasper at the Depot",
    institution: "Atlas Depot",
    roleTitle: "Depot Clerk",
    portraitEmoji: "🧰",
    personalityTag: "practical",
    signalAffinity: "depotReadiness",
    completedContracts: 0,
    missedContracts: 0,
    lastSeenAtMs: 0
  },
  {
    requesterId: "mara_market_host",
    displayName: "Mara from Market Circle",
    institution: "Market Circle",
    roleTitle: "Market Host",
    portraitEmoji: "🥘",
    personalityTag: "warm",
    signalAffinity: "marketConfidence",
    completedContracts: 0,
    missedContracts: 0,
    lastSeenAtMs: 0
  },
  {
    requesterId: "nell_neighbor_lead",
    displayName: "Nell from Neighbor Row",
    institution: "Neighbor Row",
    roleTitle: "Neighbor Lead",
    portraitEmoji: "🏡",
    personalityTag: "careful",
    signalAffinity: "neighborGoodwill",
    completedContracts: 0,
    missedContracts: 0,
    lastSeenAtMs: 0
  },
  {
    requesterId: "clara_town_scribe",
    displayName: "Clara at Town Hall",
    institution: "Town Hall",
    roleTitle: "Town Scribe",
    portraitEmoji: "📜",
    personalityTag: "ambitious",
    signalAffinity: "publicCharm",
    completedContracts: 0,
    missedContracts: 0,
    lastSeenAtMs: 0
  }
];
```

### 6.4 Requester memory rules

- Completing a contract increments `completedContracts` for that requester.
- Missing a `PREPARATION` contract increments `missedContracts`.
- Requester copy may reference prior completed/missed contract counts, but must not imply deep memory beyond the stored fields.
- Recap must identify requesters by `displayName` and institution.

---

## 7. Town Signals v0

### 7.1 Data model

```ts
type TownSignalsV12 = {
  depotReadiness: number;     // 0..100
  marketConfidence: number;   // 0..100
  neighborGoodwill: number;   // 0..100
  publicCharm: number;        // 0..100
  updatedAtMs: number;
};
```

### 7.2 Mutation rules

Every contract may include `signalDelta`:

```ts
type SignalDeltaV12 = Partial<Record<keyof TownSignalsV12, number>>;
```

Rules:

- Signal values clamp to `0..100`.
- Contract completion applies positive signal deltas.
- Missing a `PREPARATION` contract may apply a small negative delta, but no negative delta may exceed `-5` in P0.
- Landmark upgrades apply positive `publicCharm` deltas.
- Signal changes must emit an event with before/after values.

### 7.3 Signal event

```ts
type TownSignalChangedEventV12 = {
  type: "TOWN_SIGNAL_CHANGED";
  actor: "SYSTEM" | "HUMAN" | "FOREMAN";
  data: {
    reason: "CONTRACT_COMPLETED" | "CONTRACT_MISSED" | "LANDMARK_UPGRADED" | "MIGRATION_DEFAULT";
    sourceId: string;
    before: TownSignalsV12;
    delta: SignalDeltaV12;
    after: TownSignalsV12;
  };
};
```

---

## 8. Contract Board v1

### 8.1 Contract types

V1.2 P0 contract types:

| Type | Status | Meaning |
|---|---|---|
| `SUPPLY` | existing from V1.1 | Deliver existing resources. |
| `BUILD` | existing from V1.1 | Place or upgrade a building. |
| `PREPARATION` | new P0 | Prepare resources/building readiness for a named civic moment. |

P1 candidate:

| Type | Status | Meaning |
|---|---|---|
| `RECOVERY` | P1 only | Spawn from an actual shortage/signal condition and recover it. |

### 8.2 Contract lifecycle

```text
OFFERED -> ACTIVE -> READY_TO_TURN_IN -> COMPLETED
                        |
                        -> MISSED       // PREPARATION only, after dueAtMs
```

`ABANDONED`, `FAILED`, and `EXPIRED` are still not P0. Use `MISSED` only for soft `PREPARATION` misses.

### 8.3 Contract data model

```ts
type ContractV12 = {
  contractId: string;
  plotId: string;
  version: "v1.2";
  kind: "SUPPLY" | "BUILD" | "PREPARATION" | "RECOVERY";
  status: "OFFERED" | "ACTIVE" | "READY_TO_TURN_IN" | "COMPLETED" | "MISSED" | "CANCELLED_BY_SYSTEM";

  title: string;
  requesterId: string;
  requesterSnapshot: {
    displayName: string;
    institution: string;
    roleTitle: string;
    portraitEmoji: string;
  };

  whyNow: string;
  townBenefit: string;
  philosophyHint: string;
  townMoment?: {
    momentId: "market_morning" | "wagon_arrival" | "neighbor_supper" | "town_notice";
    label: string;
    dueAtMs?: number;
    softDeadline: boolean;
  };

  requirements: {
    resources?: Partial<Record<"wood" | "stone" | "food" | "coin", number>>;
    buildings?: Array<{ buildingType: BuildingType; minCount: number }>;
  };

  rewards: {
    resources?: Partial<Record<"wood" | "stone" | "food" | "coin", number>>;
    townXp?: number;
    signalDelta?: SignalDeltaV12;
  };

  missEffect?: {
    signalDelta?: SignalDeltaV12; // max absolute value 5 per signal in P0
    recapLine: string;
  };

  deckKey: string;
  generationSeed: string;
  offeredAtMs: number;
  acceptedAtMs?: number;
  completedAtMs?: number;
  missedAtMs?: number;
};
```

### 8.4 Board offer rules

- Before HQ2: board locked.
- At HQ2: offer exactly 3 cards if all are valid:
  - one `SUPPLY`,
  - one `BUILD`,
  - one `PREPARATION`.
- If a valid `PREPARATION` cannot be generated, offer 2 cards only and log why in debug/test state, not in player copy.
- Exactly one active contract remains.
- Contract offers refresh automatically after active contract completion or miss.
- Deck must not repeat the same `deckKey` within the last 6 offered cards unless no valid alternatives exist.
- Contract requirements must be satisfiable using current HQ unlocks and plausible near-term production.

### 8.5 Example P0 contracts

#### SUPPLY: Stock the Depot

```json
{
  "kind": "SUPPLY",
  "title": "Stock the Depot",
  "requesterId": "jasper_depot_clerk",
  "whyNow": "The first wagons are lining up and Jasper needs dry timber for repairs.",
  "townBenefit": "The depot looks more reliable to incoming travelers.",
  "philosophyHint": "This favors stability and logistics.",
  "requirements": { "resources": { "wood": 12 } },
  "rewards": {
    "resources": { "coin": 5 },
    "townXp": 8,
    "signalDelta": { "depotReadiness": 6 }
  }
}
```

#### BUILD: Breakfast Before Market

```json
{
  "kind": "BUILD",
  "title": "Breakfast Before Market",
  "requesterId": "mara_market_host",
  "whyNow": "Mara wants the morning crowd fed before trading starts.",
  "townBenefit": "Market Circle feels ready for regular trade.",
  "philosophyHint": "This favors growth and public activity.",
  "requirements": { "buildings": [{ "buildingType": "FARM_PLOT", "minCount": 1 }] },
  "rewards": {
    "resources": { "coin": 4 },
    "townXp": 8,
    "signalDelta": { "marketConfidence": 6 }
  }
}
```

#### PREPARATION: Neighbor Supper

```json
{
  "kind": "PREPARATION",
  "title": "Neighbor Supper",
  "requesterId": "nell_neighbor_lead",
  "whyNow": "Nell is gathering the nearby families tonight and wants a small food reserve ready.",
  "townBenefit": "The neighbors start to treat the plot as a shared settlement.",
  "philosophyHint": "This favors goodwill over fast expansion.",
  "townMoment": {
    "momentId": "neighbor_supper",
    "label": "Supper at dusk",
    "softDeadline": true
  },
  "requirements": { "resources": { "food": 6 } },
  "rewards": {
    "resources": { "coin": 3 },
    "townXp": 10,
    "signalDelta": { "neighborGoodwill": 8 }
  },
  "missEffect": {
    "signalDelta": { "neighborGoodwill": -3 },
    "recapLine": "Nell held the supper smaller than planned. No harm done, but Neighbor Row is still waiting to be won over."
  }
}
```

---

## 9. Coin sink and Public Square v0

### 9.1 Purpose

Coin must become useful without turning V1 into a token economy or pay-to-win resource shop.

### 9.2 Public Square landmark

Add a small civic landmark called **Public Square Welcome Sign**.

User-facing copy:

> “Put up a welcome sign so the plot feels less like a camp and more like a town.”

### 9.3 Data model

```ts
type PublicSquareLandmarkV12 = {
  landmarkId: "public_square_welcome_sign";
  level: 0 | 1;
  label: "Open Dust Lot" | "Welcome Sign";
  upgradedAtMs: number;
};
```

### 9.4 Upgrade rule

P0 supports only level 0 → 1.

Cost:

```json
{ "wood": 4, "coin": 8 }
```

Reward/effect:

```json
{
  "townXp": 8,
  "signalDelta": { "publicCharm": 10 }
}
```

### 9.5 Tool/API

Add one human-route tool:

```text
et.plot.town.upgrade_landmark
```

Args:

```json
{
  "landmarkId": "public_square_welcome_sign",
  "idempotencyKey": "string"
}
```

Result:

```json
{
  "ok": true,
  "landmark": {
    "landmarkId": "public_square_welcome_sign",
    "level": 1,
    "label": "Welcome Sign"
  },
  "resourceDelta": {
    "before": {},
    "consumed": { "wood": 4, "coin": 8 },
    "produced": {},
    "collected": {},
    "rewarded": { "townXp": 8 },
    "cappedLost": {},
    "after": {}
  },
  "signalDelta": { "publicCharm": 10 }
}
```

The Foreman may recommend the upgrade but may **not** perform it autonomously in P0.

---

## 10. Foreman worker-loop closure

### 10.1 Goal

V1.1 created a Foreman-authenticated server path. V1.2 must make the Foreman’s first routine action originate from the OpenClaw Lite worker command path, not from page-level code directly orchestrating observe/decide/tool-call.

### 10.2 Required architecture

The page may start/stop/pause the Foreman. After that, the OpenClaw Lite worker must own:

```text
receive command -> load pack -> request/refresh runtime session -> fetch observation -> choose candidate -> call foreman tool route -> checkpoint trace -> return summary to UI
```

### 10.3 New worker command

Add a gateway/worker command equivalent to:

```ts
type FoundersPlotForemanTickCommandV12 = {
  type: "founders_plot.foreman.tick";
  commandId: string;
  plotId?: string;
  mode: "RUN_ONCE" | "SCHEDULED_TICK";
  endpointBase: string;
  foremanRuntimeTokenRef: "worker_session";
};
```

The UI may call a gateway function such as:

```ts
await gateway.foundersPlotForemanTick({ mode: "RUN_ONCE" });
```

The UI must not implement candidate choice or direct `fetch('/api/founders-plot/foreman/tool/...')` in production-path code.

### 10.4 Worker output

```ts
type FoundersPlotForemanTickResultV12 = {
  ok: boolean;
  commandId: string;
  workerTraceId: string;
  runtimeId: string;
  observationSeq?: number;
  chosenCandidateId?: string | null;
  toolName?: string;
  mutationApplied: boolean;
  receiptId?: string;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
};
```

### 10.5 Event attribution

Every Foreman action event must include:

```ts
type ForemanOriginV12 = {
  origin: "OPENCLAW_LITE_WORKER";
  runtimeId: string;
  foremanSessionId: string;
  workerCommandId: string;
  workerTraceId: string;
  tokenScope: string[];
};
```

V1.2 must reject or mark as non-release any automated action that only proves `actor: AGENT` or only proves “page supplied bearer token.”

### 10.6 Test Brain

CI still uses a deterministic Test Brain. The Test Brain may run inside the worker or behind a worker adapter, but the test must prove the worker command path owns the decision step.

Live LLM calls remain forbidden in CI.

---

## 11. Foreman Plan Cards in V1.2

Plan Cards now reference town signals and requesters when relevant.

```ts
type ForemanPlanCardV12 = {
  headline: string;
  goalServed:
    | "tutorial"
    | "active_contract"
    | "preparation_moment"
    | "town_signal"
    | "standing_order"
    | "town_stability"
    | "idle_optimization";
  requesterMention?: string;
  signalMention?: string;
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
> Nell’s Neighbor Supper needs 6 food, and your Careful Steward order protects reserves. Collecting the ready food costs nothing and moves Neighbor Goodwill forward.

---

## 12. Recap and Town Journal v1.2

### 12.1 Recap sections

V1.2 recap must contain these sections:

1. **What you did**
2. **What the town produced**
3. **Who asked for help**
4. **What changed in town**
5. **What Clover did**
6. **What needs your decision now**

### 12.2 Town Journal surface

Add a compact Town Journal drawer/panel. It is not a second quest board.

Journal entries are generated from events and should include:

- contract accepted/completed/missed;
- requester name;
- town signal changes;
- public square upgrade;
- Foreman receipt summaries.

Data shape:

```ts
type TownJournalEntryV12 = {
  journalId: string;
  eventId: number | string;
  atMs: number;
  category: "REQUEST" | "SIGNAL" | "LANDMARK" | "FOREMAN" | "RECAP";
  title: string;
  body: string;
  requesterId?: string;
  signalKey?: keyof TownSignalsV12;
};
```

### 12.3 Copy rules

Good:

> “Jasper at the Depot says the wagons can roll sooner now. Depot Readiness rose to Strong.”

Bad:

> “Signal `depotReadiness` mutated by +6 from contract `con_001`.”

---

## 13. Tools and API surface

### 13.1 Existing tools retained

All V1.1 tools remain unless explicitly deprecated later:

```text
et.plot.get_state
et.plot.place_building
et.plot.queue_job
et.plot.collect_outputs
et.plot.upgrade_building
et.plot.set_priority
et.plot.claim_reward
et.plot.request_user_approval
et.plot.contracts.get_state
et.plot.contracts.accept
et.plot.contracts.turn_in
et.foreman.policy.get_standing_order
et.foreman.policy.set_standing_order
et.foreman.scheduler.get_status
et.foreman.scheduler.enable_collect_ready_outputs
et.foreman.scheduler.pause
et.foreman.scheduler.resume
```

### 13.2 New P0 tools

```text
et.plot.town.get_signals
et.plot.town.upgrade_landmark
et.plot.journal.get_entries
```

### 13.3 P1 tools, only if approved

```text
et.plot.contracts.refresh_offers
et.foreman.scheduler.enable_keep_one_building_running
```

### 13.4 Tool schema requirements

Every tool must have strict JSON schemas for:

- args;
- success result;
- error result;
- emitted event types;
- resource deltas if economy-affecting;
- signal deltas if town-signal-affecting.

`tools.md` must be updated, not only `server/founders_plot/tools.js`.

---

## 14. Server events

Add these event types:

```ts
const EVENT_TYPES_V12 = {
  REQUESTER_SEEN: "REQUESTER_SEEN",
  CONTRACT_OFFERED: "CONTRACT_OFFERED",
  CONTRACT_MISSED: "CONTRACT_MISSED",
  TOWN_SIGNAL_CHANGED: "TOWN_SIGNAL_CHANGED",
  LANDMARK_UPGRADED: "LANDMARK_UPGRADED",
  TOWN_JOURNAL_ENTRY_CREATED: "TOWN_JOURNAL_ENTRY_CREATED",
  FOREMAN_WORKER_COMMAND_STARTED: "FOREMAN_WORKER_COMMAND_STARTED",
  FOREMAN_WORKER_COMMAND_COMPLETED: "FOREMAN_WORKER_COMMAND_COMPLETED",
  FOREMAN_WORKER_COMMAND_FAILED: "FOREMAN_WORKER_COMMAND_FAILED"
};
```

Event requirements:

- Every event must be replay-visible.
- Every economy event must have `resourceDelta`.
- Every signal mutation must have `signalDelta` and before/after.
- Every Foreman mutation must include `ForemanOriginV12`.
- Journal entries may be derived from events but must be testable.

---

## 15. Game balance and pacing

### 15.1 First-session pacing target

V1.2 should not extend the time to the first Foreman hero moment beyond V1.1.

Targets:

| Moment | Target |
|---|---:|
| First CTA visible | <= 5 seconds |
| HQ2 reachable in accelerated golden path | <= V1.1 test duration |
| First contract accepted | <= 20 minutes of intended play |
| First Foreman auto-collect | <= 30 minutes of intended play |
| First signal change | <= 35 minutes of intended play |
| Public Square upgrade opportunity visible | <= 45 minutes of intended play |

### 15.2 No new hard resources

Do not add new resources/currencies in V1.2. Use only:

```text
wood, stone, food, coin, townXp
```

Town Signals are not resources and must not behave like spendable currencies.

### 15.3 PREPARATION timing

P0 may use a soft due window for `PREPARATION`, but the default implementation should avoid punishing new players.

Recommended default:

```ts
dueAtMs = acceptedAtMs + 10 * 60 * 1000;
softDeadline = true;
missEffect.maxNegativeSignalDelta = -3;
```

In automated tests, use accelerated time via existing test advance route.

---

## 16. Test-driven development plan

### 16.1 Test philosophy

V1.2 is not complete because new systems exist. V1.2 is complete when deterministic tests prove:

> A player can complete the V1.1 golden path, choose among recurring requesters, complete or miss a preparation request, see town signals and public-square identity change, and observe a Foreman action whose decision and tool call originated from the OpenClaw Lite worker command path.

Live LLM calls are forbidden in CI.

### 16.2 Required P0 test matrix

#### V12-P0-GUARD: V1.1 regression gate

| Test ID | Name | Type | Goal | Required assertions | Metric |
|---|---|---|---|---|---|
| V12-P0-GUARD-001 | V1.1 P0 suite remains green | CI | V1.2 does not break the shipped slice. | Existing V1.1 tests pass. | `V11RegressionFailures = 0` |
| V12-P0-GUARD-002 | Save migration from schema 2 to 3 | Integration | Existing users keep plots. | Load V1.1 fixture; state has signals/requesters/landmarks; no resource change except migration defaults. | `SaveMigrationFailureRate = 0` |

#### V12-P0-WORKER: Foreman worker-loop closure

| Test ID | Name | Type | Goal | Required assertions | Metric |
|---|---|---|---|---|---|
| V12-P0-WORKER-001 | Worker owns Foreman tick | Playwright/integration | Tick originates from OpenClaw Lite worker command path. | UI click dispatches worker command; worker fetches observation; worker chooses candidate; worker calls Foreman route. | `ForemanWorkerOriginCoverage = 100%` |
| V12-P0-WORKER-002 | Production UI has no direct Foreman tool fetch | Static/integration | Avoid page-orchestrated pseudo-agent. | Production `app.js` does not directly call `/foreman/tool/` except via test hook or gateway wrapper. | `DirectPageForemanToolCallCount = 0` |
| V12-P0-WORKER-003 | Worker trace appears in event | Integration | Audit proves true origin. | `AGENT_ACTION_EXECUTED` includes `origin: OPENCLAW_LITE_WORKER`, `workerCommandId`, `workerTraceId`, `runtimeId`. | `WorkerTraceCoverage = 100%` |
| V12-P0-WORKER-004 | Test Brain remains deterministic | Unit/runtime | CI stable without live LLM. | Same observation/candidates yields same decision/plan card. | `TestBrainDeterminism = 100%` |
| V12-P0-WORKER-005 | Worker timeout no-ops | Runtime | Failure is safe. | Simulated model/worker timeout produces no mutation and user-readable status. | `InvalidMutationOnTimeout = 0` |

#### V12-P0-REQ: Requesters and institutions

| Test ID | Name | Type | Goal | Required assertions | Metric |
|---|---|---|---|---|---|
| V12-P0-REQ-001 | Default requester cast exists | Unit | Stable living-town cast. | Four default requesters with IDs, displayName, institution, roleTitle, portraitEmoji, signalAffinity. | `RequesterSchemaCoverage = 100%` |
| V12-P0-REQ-002 | Contracts snapshot requester identity | Unit/integration | Recap remains stable even if requester evolves. | Contract includes `requesterId` and `requesterSnapshot`. | `RequesterSnapshotCoverage = 100%` |
| V12-P0-REQ-003 | Requester history updates | Integration | Recurring people remember outcomes. | Completing/missing contract increments requester counters and updates lastContractId. | exact state |
| V12-P0-REQ-004 | Requester appears in UI and recap | Playwright/integration | Player can name who asked. | Contract card and recap include requester displayName and institution. | `RequesterContextCoverage = 100%` |

#### V12-P0-SIGNAL: Town Signals

| Test ID | Name | Type | Goal | Required assertions | Metric |
|---|---|---|---|---|---|
| V12-P0-SIGNAL-001 | Signal defaults and clamping | Unit | Stable signal state. | Fresh/migrated plot has four signals; values clamp 0..100. | exact state |
| V12-P0-SIGNAL-002 | Contract completion changes signal | Integration | Contracts affect town. | Complete signal-bearing contract; signal delta applied; event written. | `SignalMutationCoverage = 100%` |
| V12-P0-SIGNAL-003 | Landmark changes publicCharm | Integration | Coin sink affects town identity. | Upgrade Welcome Sign; publicCharm increases. | exact delta |
| V12-P0-SIGNAL-004 | Signal panel is legible | Playwright | Signals are visible but compact. | Four labels visible; no raw debug keys in game UI. | `SignalPanelForbiddenRawKeyCount = 0` |

#### V12-P0-CONTRACT: Contract deck v1 and PREPARATION

| Test ID | Name | Type | Goal | Required assertions | Metric |
|---|---|---|---|---|---|
| V12-P0-CON-001 | Board has valid 2–3 offers | Integration | Board expands safely. | At HQ2, board contains SUPPLY, BUILD, and valid PREPARATION if possible. | `ContractRequirementValidityRate = 100%` |
| V12-P0-CON-002 | Duplicate prevention | Unit/property | Reduce repetition. | No same deckKey in last 6 offers unless no alternatives. | `ContractDeckDuplicateRate <= 10%` |
| V12-P0-CON-003 | One active contract remains | Integration | Clarity preserved. | Accept one; second accept blocked. | `ActiveContractCount <= 1` |
| V12-P0-CON-004 | PREPARATION completion | Integration | Event-like demand works. | Active PREPARATION becomes READY then COMPLETED; rewards/signal applied once. | `DuplicatePreparationRewardRate = 0` |
| V12-P0-CON-005 | PREPARATION soft miss | Integration | Recoverable drama. | Advance past due; contract becomes MISSED; small signal delta; recap/journal line created. | `PreparationMissAuditCoverage = 100%` |
| V12-P0-CON-006 | Board refresh after completion/miss | Integration | Continued goals. | Completing/missing active contract produces fresh valid offers with new refreshCount. | exact state |

#### V12-P0-COIN: Public Square coin sink

| Test ID | Name | Type | Goal | Required assertions | Metric |
|---|---|---|---|---|---|
| V12-P0-COIN-001 | Welcome Sign upgrade visible when affordable | Playwright/integration | Coin has purpose. | CTA/status appears when wood/coin cost is affordable and no higher-priority goal owns CTA. | exact UI |
| V12-P0-COIN-002 | Upgrade consumes resources once | Integration | Economy correctness. | Cost consumed; XP and charm awarded; idempotency replay stable. | `DuplicateLandmarkUpgradeRate = 0` |
| V12-P0-COIN-003 | Upgrade does not block tutorial | E2E | No early deadlock. | First-hour golden path remains possible without upgrading landmark. | `TutorialBlockageCount = 0` |
| V12-P0-COIN-004 | Visual state changes | Screenshot | Pride/attachment visible. | Baseline screenshot changes from open lot to welcome sign state. | `ScreenshotDiffWithinApprovedRange = true` |

#### V12-P0-RECAP: Journal and recap

| Test ID | Name | Type | Goal | Required assertions | Metric |
|---|---|---|---|---|---|
| V12-P0-REC-001 | Recap sections complete | Integration | Player understands what happened. | Recap includes who asked, town changed, Clover did, needs decision. | `RecapSectionCoverage = 100%` |
| V12-P0-REC-002 | Journal entries derive from events | Unit/integration | Auditability. | Contract/signal/landmark/Foreman events create journal entries with eventId. | `JournalEventLinkCoverage = 100%` |
| V12-P0-REC-003 | Recap avoids fake agency | Integration | Trust. | Passive production and Foreman action remain separate. | `PassiveAgentConfusionCount = 0` |
| V12-P0-REC-004 | Requester recall copy | Playwright | Living-town fantasy. | Recap contains requester displayName and benefit. | `RequesterRecapCoverage = 100%` |

#### V12-P0-UX: UI/UX and attention

| Test ID | Name | Type | Goal | Required assertions | Metric |
|---|---|---|---|---|---|
| V12-P0-UX-001 | One primary CTA under conflicts | Unit/UI | Avoid cognitive overload. | Approval > tutorial > ready contract > urgent prep > landmark. | `PrimaryCtaConflictFailures = 0` |
| V12-P0-UX-002 | Mobile layout holds | Screenshot | V1.2 surfaces fit. | 390/768/1280 screenshots approved; no panel overlap. | `ScreenshotDiff <= threshold` |
| V12-P0-UX-003 | No forbidden jargon | Static/Playwright | Game remains approachable. | Game loop excludes forbidden terms. | `ForbiddenGameLoopJargonCount = 0` |
| V12-P0-UX-004 | Town feels alive rubric fixture | Human/playtest or scripted proxy | Product quality. | Internal review checklist passes requester/signal/visual/recap items. | `TownFeelsAliveRubric >= 4/5` |

#### V12-P0-LEDGER: Ledger and replay

| Test ID | Name | Type | Goal | Required assertions | Metric |
|---|---|---|---|---|---|
| V12-P0-LEDGER-001 | Signal and landmark events replay | Unit/integration | Replay covers new systems. | Replay includes signal/landmark/journal events and final hash matches. | `StateHashDeterminism = 100%` |
| V12-P0-LEDGER-002 | Resource conservation with contracts + landmark | Unit/replay | No hidden resource creation. | Start + produced + rewards - consumed - end = 0 for resources. | `ResourceConservationError = 0` |
| V12-P0-LEDGER-003 | Signal conservation not confused with resources | Unit | Signals are separate. | Resource ledger ignores signals; signal ledger handles signals. | exact schema |

### 16.3 Global V1.2 release gates

```yaml
release_gates:
  v11_p0_regression_failures: 0
  save_migration_failure_rate: 0
  foreman_worker_origin_coverage: 1.0
  direct_page_foreman_tool_call_count: 0
  worker_trace_coverage: 1.0
  actor_spoof_rejection_rate: 1.0
  requester_context_coverage: 1.0
  contract_requirement_validity_rate: 1.0
  contract_deck_duplicate_rate_max: 0.10
  signal_mutation_coverage: 1.0
  duplicate_preparation_reward_rate: 0
  duplicate_landmark_upgrade_rate: 0
  resource_conservation_error: 0
  state_hash_determinism: 1.0
  primary_cta_conflict_failures: 0
  forbidden_game_loop_jargon_count: 0
  console_error_count_golden_path: 0
  screenshot_baselines_approved: true
  town_feels_alive_rubric_min: 4.0
```

---

## 17. Implementation milestones

### Milestone 0 — Branch setup and regression freeze

**Goal:** establish safe baseline.

Tasks:

1. Branch from `codex/founders-plot-v1-1-sprint`.
2. Add `specs/20_founders_plot_v1_2_living_town.md`.
3. Run all existing V1.1 tests.
4. Add a CI/test label or script target for V1.2 tests.

Acceptance:

- Existing V1.1 tests pass.
- New V1.2 tests initially fail for expected missing systems.

---

### Milestone 1 — Schema migration and data models

**Goal:** add state without changing gameplay yet.

Tasks:

1. Add `schemaVersion = 3` migration.
2. Add requesters, town signals, landmarks, deck metadata.
3. Add strict view models in `stateView()`.
4. Add test fixtures for fresh and migrated plots.

Acceptance:

- Fresh and migrated plots expose V1.2 state.
- No first-hour behavior changes yet.
- Resource state unchanged by migration except versioned defaults.

---

### Milestone 2 — Foreman worker-loop closure

**Goal:** close the V1.1 runtime integrity gap before adding more automation.

Tasks:

1. Add OpenClaw Lite gateway command for Founders Plot Foreman tick.
2. Move observe/decide/tool-call orchestration into worker/gateway path.
3. Keep deterministic Test Brain in CI.
4. Add `ForemanOriginV12` to agent action events.
5. Ensure production UI uses gateway command, not direct Foreman route fetch.

Acceptance:

- `V12-P0-WORKER-*` tests pass.
- Foreman receipts include worker trace internally.
- Player copy remains friendly and does not mention worker traces.

---

### Milestone 3 — Requester model and Contract Deck v1

**Goal:** make contract choice feel like helping a town.

Tasks:

1. Add default requester cast.
2. Convert contract generation to use requester IDs and snapshots.
3. Add deterministic deck keys and duplicate prevention.
4. Add up to 3 offers at HQ2.
5. Preserve one active contract rule.

Acceptance:

- `V12-P0-REQ-*` and basic `V12-P0-CON-*` tests pass.
- Existing V1.1 contract tests updated only where V1.2 intentionally expands board count.

---

### Milestone 4 — Town Signals and PREPARATION contracts

**Goal:** add civic pressure and visible outcomes.

Tasks:

1. Add town signal mutators and events.
2. Add `PREPARATION` contract generation.
3. Add soft due/miss handling.
4. Add recap/journal lines for completion/miss.
5. Add signal panel UI.

Acceptance:

- Signal tests pass.
- PREPARATION completion and miss tests pass.
- No impossible contracts in first-hour fixtures.

---

### Milestone 5 — Public Square coin sink

**Goal:** make coin useful and improve attachment.

Tasks:

1. Add Public Square landmark state.
2. Add `et.plot.town.upgrade_landmark`.
3. Add resource and signal deltas.
4. Add visible plot/tile state for Welcome Sign.
5. Add screenshot baselines.

Acceptance:

- Coin sink tests pass.
- First-hour tutorial still passes without using the sink.
- Visual improvement is visible in screenshots.

---

### Milestone 6 — Recap, Journal, and UX arbitration

**Goal:** preserve clarity with new content.

Tasks:

1. Update recap sections.
2. Add Town Journal derived entries.
3. Update current-goal arbitration.
4. Ensure mobile layout remains clean.
5. Add no-jargon and screenshot tests.

Acceptance:

- Recap/journal tests pass.
- UI tests pass at 390/768/1280.
- One primary CTA rule remains true.

---

### Milestone 7 — Final balancing and release gate

**Goal:** make V1.2 shippable.

Tasks:

1. Run full test suite.
2. Run deterministic first-hour golden path.
3. Run V1.2 extended 60-minute accelerated path.
4. Review event log for readability and replay correctness.
5. Update docs and `public/experiences/founders-plot/tools.md`, `goals.md`, `skill.md`.

Acceptance:

- All release gates pass.
- Specs and implementation agree.
- No P2 scope accidentally included.

---

## 18. Extended golden path for V1.2

The V1.2 golden path extends V1.1 without replacing it.

| Beat | Target | Player-visible moment | Required system proof |
|---|---:|---|---|
| 1 | 0–10 min | Complete V1.1 HQ2 path. | V1.1 tests still pass. |
| 2 | 10–15 min | Contract Board shows recurring requesters. | Requester model visible. |
| 3 | 15–20 min | Player chooses between Depot, Market, Neighbor/Prep. | 2–3 valid offers. |
| 4 | 20–30 min | Clover handles one routine through worker path. | Worker-origin event and receipt. |
| 5 | 30–35 min | Player completes or misses a prep moment. | Signal delta and recap line. |
| 6 | 35–45 min | Coin has a purpose: Welcome Sign upgrade appears. | Coin sink visible but optional. |
| 7 | 45–60 min | Public Square looks improved; recap names who was helped. | Landmark state + journal + recap. |

---

## 19. Risk register

| Risk | Why it matters | Mitigation |
|---|---|---|
| V1.2 becomes too broad | V1.1 just landed; widening too fast can break clarity. | P0 only adds one new decision layer: living-town demand. |
| Foreman still feels fake | The product differentiator depends on real agent delegation. | Make worker-owned tick a P0 release gate. |
| Signals become KPI clutter | Too many numbers hurt cozy UX. | Four signals only; labels/bands, not raw dashboards. |
| PREPARATION feels punitive | New players may dislike failure. | Soft miss only; small/no penalty; recap framed as recoverable. |
| Coin sink blocks progress | Economy sink could create deadlock. | Public Square is optional and never tutorial-gating. |
| Contract deck generates impossible goals | Kills trust in game and Foreman. | Requirement validity property tests. |
| UI overcrowding | V1.2 adds surfaces. | One primary CTA, collapsible boards, screenshot gates. |
| Runtime work consumes sprint | Worker-loop closure could balloon. | Only in-session RUN_ONCE/SCHEDULED_TICK, no backend offload. |

---

## 20. Definition of Done

V1.2 is done when:

1. All V1.1 P0 tests still pass.
2. All V1.2 P0 tests pass.
3. Existing V1.1 saves migrate to schema 3.
4. The Foreman’s automated action originates from OpenClaw Lite worker command path.
5. Contracts use persistent requesters and institutions.
6. Contract deck offers are valid, non-repetitive, and readable.
7. Town Signals change from contracts/landmark and appear in recap/journal.
8. Public Square Welcome Sign consumes coin/wood once and visibly improves the plot.
9. The UI has one primary CTA under conflict fixtures.
10. No forbidden technical jargon appears in the main game loop.
11. Replay final hash matches current hash after V1.2 events.
12. Resource conservation error is zero.
13. Screenshot baselines are approved for mobile/tablet/desktop.
14. Docs and implementation agree: `skill.md`, `tools.md`, `goals.md`, and specs are updated.
15. No P2 deferred system is accidentally shipped.

---

## 21. Future handoff after V1.2

If V1.2 succeeds, the next likely spec should be selected by playtest results:

### Option A: V1.3 — Foreman Routine Depth and Correction Memory

Use if the town feels more alive but Clover still feels like a macro.

Candidate scope:

- `KEEP_ONE_BUILDING_RUNNING`;
- correction memory;
- better Plan Card comparisons;
- clearer candidate/confidence model;
- no off-session execution.

### Option B: V2.0 — Persistent Foreman and Morning Brief

Use only if V1.1/V1.2/V1.3 prove the manual loop, living-town demand, recap, and in-session Foreman are trusted.

Candidate scope:

- one backend-pool persistent Foreman per plot;
- off-session safe routines only;
- Morning Brief;
- exception inbox v0;
- emergency pause;
- runtime lease truth.

### Option C: V1.2.1 polish patch

Use if V1.2 is fun but rough.

Candidate scope:

- balance deck weights;
- improve copy;
- improve mobile layout;
- add a few more SUPPLY/BUILD/PREPARATION cards;
- no new systems.

---

## 22. Machine-readable planning summary

```yaml
spec:
  id: agent-town-founders-plot-v1.2
  title: Living Town Contracts, Town Signals, and Real Foreman Intent Loop
  baseline_branch: codex/founders-plot-v1-1-sprint
  target_branch: codex/founders-plot-v1-2-living-town
  product: Agent Town
  chapter: Founders Plot

main_new_decision_layer: living_town_demand_and_attachment

must_ship_p0:
  - v1_1_regression_green
  - openclaw_lite_worker_owned_foreman_tick
  - requester_model_v0
  - town_signals_v0
  - contract_board_v1_with_supply_build_preparation
  - contract_deck_duplicate_prevention
  - public_square_coin_sink
  - town_journal_and_recap_v1_2
  - ui_attention_arbitration_v1_2
  - replay_and_ledger_for_new_events

explicitly_deferred:
  - persistent_off_session_foreman
  - backend_pool_offload
  - full_doctrine_board
  - specialist_foremen
  - founding_charters
  - capability_web
  - social_sharing
  - tokenized_economy
  - ugc_vibecoding
  - multiplayer_shared_world

release_gates:
  v11_regression_failures: 0
  foreman_worker_origin_coverage: 1.0
  direct_page_foreman_tool_call_count: 0
  requester_context_coverage: 1.0
  contract_requirement_validity_rate: 1.0
  contract_deck_duplicate_rate_max: 0.10
  signal_mutation_coverage: 1.0
  resource_conservation_error: 0
  state_hash_determinism: 1.0
  primary_cta_conflict_failures: 0
  forbidden_game_loop_jargon_count: 0
```
