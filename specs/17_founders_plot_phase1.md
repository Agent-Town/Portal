
# Agent Town — Founders Plot Phase 1 Specification
## Human + Agent Collaboration City-Builder Slice
**Version:** v1.0 working draft  
**Date:** 2026-04-17  
**Audience:** AI agent developers, gameplay engineers, UI/UX designers, backend engineers, QA, technical product leads  
**Primary objective:** implement the first persistent, replayable, testable building/progression loop for Agent Town using the strongest pieces of the current Portal code, active Portal branches, and existing Eliza Town/Agent Town design work.

---

## 0. Executive summary

This document defines the **first real game layer** that should sit on top of the existing Agent Town / Portal onboarding shell:

**Founders Plot** — a persistent personal shard where the player and their AI agent co-manage a small town plot that grows from a barely-open headquarters into a productive starter settlement.

### Product thesis
The correct first city-builder implementation is **not** a fully open simulation. It is a **guided, deterministic, personal progression loop** where:

- the **human** chooses layout, priorities, upgrades, and trust boundaries,
- the **agent** automates bounded town tasks and explains what it did,
- the **server** owns truth, timers, rules, and outcomes,
- the **town** gradually expands as the player learns the game and learns what AI delegation feels like.

### What this spec delivers
This spec gives a complete implementation target for the first playable slice:
1. a **persistent personal plot** unlocked after onboarding,
2. a **starter building loop** with resources, timers, upgrades, XP, and levels,
3. a **bounded agent foreman tool surface**,
4. a **deterministic simulation model**,
5. a **test-first roadmap** with measurable acceptance criteria,
6. a **stepwise integration plan** grounded in the current Portal code and the strongest unmerged branches.

### Recommended implementation stance
Use the **current Portal repo as the front door and integration shell**, but implement the builder using patterns already proven in the broader project:
- Portal onboarding, Brain setup, browser worker, house/identity/security surfaces,
- the unmerged **experience manifest loader** work,
- the unmerged **Founders Loop** state-contract work,
- and the existing **room/build/interactable** patterns from the Convex/Pixi Eliza Town development branch.

This is not a rewrite. It is a convergence plan.

---

## 1. Problem statement

Portal currently proves onboarding, co-op unlock, agent connection, house identity, wallet-linked ceremony, and browser-native agent participation. That is necessary, but it is not yet a sticky game.

The missing layer is a **daily-return personal loop**:
- a reason to come back,
- a reason to delegate to an agent,
- a reason to unlock more town capabilities,
- a reason for the broader world to exist.

The first builder/progression slice must solve that without destroying what already works.

---

## 2. Ground truth from the current code and branches

This section is normative for planning. It describes what should be treated as reusable substrate versus what should not be merged wholesale.

### 2.1 What is already strong in Portal
Portal already has the following strengths and they **must be reused**, not rebuilt:

1. **Onboarding shell**
   - human + agent bring-up,
   - Town Hall / Brain setup,
   - wallet-linked identity flows,
   - house ceremony and progression framing.

2. **Browser-native agent runtime**
   - in-browser worker runtime,
   - BYO model/provider,
   - experience-run and worker-turn orchestration,
   - recovery/continuity patterns.

3. **Strong deterministic TDD culture**
   - Playwright-based contract testing,
   - runtime/worker/skill contract lines,
   - API-first tests that survive UI restructuring.

4. **Security hardening direction**
   - OTP/Privy/login fixes,
   - proxy/LLM config fixes,
   - mailbox/pony PoW hardening,
   - anchor/registration authorization fixes.

### 2.2 What the active Portal branches contribute
The active Portal branches provide four particularly important ingredients:

#### A. Onboarding hardening line
Use as the base stabilization layer:
- `fix/ui-ux-polish`
- `fix/privy-login-otp-flow`
- PR #55 onboarding overhaul
- PR #46 anonymous postage PoW hardening
- PR #38 anchor registration authorization

These are prerequisites because the builder should not land on a brittle onboarding/security foundation.

#### B. Experience plugin / manifest line
From `poker-saloon-redesign`, reuse:
- `public/experiences/<experience>/manifest.json`
- `server/experience_loader.js`
- `/api/experiences` registry pattern
- district-driven navigation via manifests rather than hard-coded one-off routes

This is the cleanest way to add Founders Plot as a first-class experience.

#### C. Founders loop line
From `zhc0-founders-loop`, reuse:
- the formal state-machine mindset,
- the existing “Open HQ / Run first mission / Save first memory / Reveal next quest” loop,
- the existing machine-readable state modeling discipline.

Founders Plot should start **immediately after HQ opens**. It is the natural continuation of that branch, not a disconnected feature.

#### D. Sandbox / iteration / executor research lines
Do **not** merge these lines wholesale for the first builder milestone:
- `zhc1-sandbox-artifact-system`
- `codex/executor-abstraction-research-v0-1`
- `codex/agent-library`

Harvest ideas later, but do not block the builder on them.

### 2.3 What the broader Eliza Town dev work already solved
The wider project has already proven several builder-relevant patterns in the development branch:
- `userRooms` / private worlds,
- interactables and hitboxes,
- in-game build mode,
- per-object template state,
- Convex schema patterns for deterministic multiplayer state,
- Werewolf as a complete authoritative minigame with idempotency and event logs.

These patterns should be reused conceptually even if the implementation remains inside Portal.

---

## 3. Product decision

## 3.1 Selected first playable feature
Build **Founders Plot**.

**Founders Plot** is a persistent personal shard unlocked after the current onboarding/founders-opening sequence. It is a small buildable plot containing:
- a headquarters,
- a few build pads,
- storage,
- a tiny economy,
- and an AI foreman assistant.

It is the player’s **home loop**.

### 3.2 Why this is the correct first city-builder slice
It fits the project’s existing design principles:
- personal shards already exist in the vision,
- controlled generativity is already preferred over open chaos,
- dual human/agent views are already part of the architecture,
- agent-owned mind / world-owned reality is already the project philosophy,
- and a personal HQ/farm/house progression loop is the easiest place to teach AI delegation safely.

### 3.3 Explicit non-goals for Phase 1
The first implementation **must not** try to do all of the following:
- open shared-city simulation,
- public freeform town economics,
- creator-coded custom mechanics,
- fully procedural world generation,
- unrestricted agent finance,
- deep NPC life simulation,
- or “AI can do everything” autonomy.

These are later layers.

---

## 4. First-part game fantasy

The player’s fantasy is:

> “I am founding a town with a smart assistant.  
> I decide the vision.  
> My agent helps me run the boring parts.  
> The town grows because we work together.”

The agent’s fantasy is:

> “I am the town’s foreman.  
> I observe the plot, explain the current state, and perform bounded town work inside clear permissions.”

The system fantasy is:

> “The world remains deterministic, inspectable, replayable, and safe.”

---

## 5. Core scope of Phase 1

Phase 1 is intentionally small.

### 5.1 Included
- One persistent personal plot per pair/account.
- Grid-based building placement on approved tiles.
- Starter buildings.
- Resource production with timers.
- Headquarters upgrades.
- Town XP and levels 1–5.
- Agent permissions that unlock with progression.
- Offline progress catch-up with hard caps.
- “While you were away” recap from event logs.
- Replayable deterministic simulation.
- Complete TDD coverage and measurable acceptance metrics.

### 5.2 Excluded
- PvP attacks.
- Public trade between players.
- Shared town governance.
- Crafted item rarity systems.
- Decoration economy beyond placeholders.
- Land expansion beyond the starter plot.
- Open-world roaming between city districts from the plot itself.
- Resource monetization through direct raw-resource sales.

---

## 6. First-session and first-30-minute experience

The game must be understandable in one session.

### 6.1 Entry point
The player completes the current onboarding / founders-opening flow and receives:

> “Your Headquarters is open. Your next quest is to establish the first productive district.”

The CTA opens **Founders Plot**.

### 6.2 First 5 minutes
1. Player enters a small, readable plot.
2. The headquarters is already present but underdeveloped.
3. The player receives a guided quest:
   - place a **Lumber Camp**,
   - collect the first wood,
   - ask the agent for advice.
   - the quest must remain on **first wood** from placement through construction and first production; it must **not** jump to HQ 2 before the first wood collection completes.

4. The agent introduces itself as the **Foreman** and gives one recommendation.

### 6.3 First 15 minutes
The player:
- upgrades Headquarters to Level 2,
- enables the agent’s first automation ability: **collect finished jobs**,
- places a Farm Plot,
- collects food,
- understands that permission tiers are taught one at a time before the next major district expansion.

### 6.4 First 30 minutes
The player:
- reaches Headquarters level 3,
- unlocks queue permission,
- unlocks Quarry,
- experiences queue pressure and build choice tension,
- sees the agent collect or queue a task under permission,
- gets a short recap,
- leaves with a clear next goal.

The player should understand:
- resources,
- timers,
- upgrades,
- agent permissions,
- and why the assistant matters.

---

## 7. Core loop

The loop is:

1. **Place** a building.
2. **Wait / queue** production.
3. **Collect** outputs.
4. **Spend** outputs on upgrades.
5. **Gain XP** and level up Headquarters.
6. **Unlock** one new building or agent permission.
7. **Return** later for more optimized choices.

This is the entire Phase 1 loop. It must be easy to learn and hard to accidentally break.

---

## 8. Game systems

## 8.1 Resources
Phase 1 uses exactly four production/economy resources and one meta resource.

### Production resources
- `wood`
- `stone`
- `food`
- `coin`

### Meta resource
- `town_xp`

No other hard-state resources are allowed in Phase 1.

## 8.2 Buildings
Phase 1 has six building types total.

1. **Headquarters** (HQ)  
   - unlocked at start  
   - drives town level  
   - unlocks buildings and agent permissions

2. **Lumber Camp**  
   - produces wood

3. **Farm Plot**  
   - produces food

4. **Quarry**  
   - produces stone

5. **Workshop**  
   - converts wood + stone into faster construction throughput (phase-1 optional production bonus, not a new resource)

6. **Market Stall**  
   - converts surplus food into coin

### Design rule
No Phase 1 building may have more than:
- one primary output,
- one active production job,
- one upgrade path.

Keep it readable.

## 8.3 Headquarters levels
Phase 1 ends at HQ Level 5.

### HQ Level 1
Unlocked at entry.
- plot open
- Lumber Camp available
- agent may **observe + suggest**

### HQ Level 2
Unlock:
- Farm Plot
- agent may **collect finished outputs** from approved buildings
- tutorial order: enable collect permission before opening the first Farm Plot

### HQ Level 3
Unlock:
- Quarry
- second concurrent construction slot
- agent may **queue one production job** on approved buildings
- tutorial order: enable queue permission before opening the Quarry lane

### HQ Level 4
Unlock:
- Workshop
- improved storage cap
- agent may **set one building priority** (wood / stone / food emphasis)
- tutorial order: enable one priority before the Workshop lane becomes the next optimization layer

### HQ Level 5
Unlock:
- Market Stall
- “overnight planner” recap
- agent may **sell surplus food for coin** within a daily sell cap
- tutorial order: place the Market Stall, then explicitly enable sell permission

Phase 1 stops here.

---

## 9. Economy and balancing rules

## 9.1 Design goals
The economy must:
- feel meaningful,
- create queue pressure,
- reward planning,
- and showcase AI value through bounded relief of friction.

It must **not**:
- become pay-to-win,
- flood the player with currencies,
- or require spreadsheets.

## 9.2 Starter economy values (normative for MVP)
These values are intentionally simple and can later be rebalanced, but the first implementation should target them.

### Storage caps
- wood: 100
- stone: 100
- food: 100
- coin: uncapped in Phase 1
- cap increases at HQ 4

### Initial wallet
- coin: 20
- wood: 0
- stone: 0
- food: 0

### Initial building slots
- construction slots: 1
- production jobs per building: 1
- HQ 3 adds a second construction slot

## 9.3 Production baselines
These are the default Level 1 production baselines.

- Lumber Camp: `+6 wood / 60 sec`
- Farm Plot: `+6 food / 90 sec`
- Quarry: `+4 stone / 90 sec`
- Workshop: `-8 wood -4 stone -> 20% build-time reduction buff for next construction`
- Market Stall: `-6 food -> +3 coin / 60 sec`

These are authoritative system rules, not LLM suggestions.

## 9.4 Upgrade cost baselines
### HQ upgrade costs
- HQ 1 -> 2: 20 wood, 15 XP
- HQ 2 -> 3: 30 wood, 20 food, 45 XP
- HQ 3 -> 4: 40 wood, 30 stone, 20 food, 90 XP
- HQ 4 -> 5: 60 wood, 50 stone, 30 food, 135 XP

### Economic validity rule
Every HQ upgrade must require only resources that are already producible at lower HQ levels.

That means:
- HQ 1 -> 2 cannot require food or stone,
- HQ 2 -> 3 cannot require stone,
- only HQ 3+ upgrades may require all three core resources.

### XP sources
- place first instance of each building: +10 XP
- collect first completed job of a building type: +5 XP
- complete HQ upgrade: +20 XP
- use agent automation successfully for the first time in a new permission tier: +10 XP
- daily return bonus: +5 XP once per UTC day

## 9.5 Offline progress rules
Offline progress must be deterministic and capped.

### Rules
- Maximum offline simulation window in Phase 1: **8 hours**
- Simulation resolution: 1-minute ticks
- No random outcomes during offline catch-up
- No duplicate reward issuance on repeated resume
- Recap must be generated from actual event log deltas, not synthetic guesses

---

## 10. Human + agent collaboration model

This is the heart of the product. The human and agent must have different responsibilities.

## 10.1 Human responsibilities
The human decides:
- where to place buildings,
- whether to approve construction,
- when to upgrade HQ,
- what automation permissions to grant,
- spending caps,
- whether to allow market selling,
- and whether to pause the agent.

## 10.2 Agent responsibilities
The agent may:
- summarize plot state,
- recommend next actions,
- collect outputs from approved buildings,
- queue production,
- set one declared priority,
- and sell food within an approved cap.

The agent may **not** in Phase 1:
- place buildings without approval,
- spend coin above cap,
- change HQ upgrades,
- destroy buildings,
- or access public trading.

## 10.3 Agent permission ladder
Agent permissions unlock by HQ level and must be visible in the UI.

| Permission | HQ Level | Default | Tutorial timing | Human approval required |
|---|---:|---|---|---|
| Observe + suggest | 1 | enabled | available at entry | no |
| Collect outputs | 2 | disabled until toggled on | immediately after HQ 2, before Farm Plot | yes |
| Queue production | 3 | disabled until toggled on | immediately after HQ 3, before Quarry | yes |
| Set one priority | 4 | disabled until toggled on | immediately after HQ 4, before Workshop optimization | yes |
| Sell surplus food | 5 | disabled until toggled on | after Market Stall placement | yes, plus daily coin cap |

## 10.4 Explainability rule
Every autonomous action by the agent must create:
- an event log entry,
- a short explanation string,
- and a human-readable recap line.

Example:
> “Foreman queued wheat harvest at Farm Plot because food fell below your preferred reserve of 20.”

---

## 11. UX and interaction design

## 11.1 Human view requirements
The human view must be cozy, legible, and simple.

### Required UI elements
- plot view (tile or pad-based)
- selected-building panel
- inventory strip
- HQ level bar
- quest / next-goal panel
- foreman panel
- action queue / timer view
- recap drawer (“While you were away”)
- permissions drawer for agent autonomy

### Required interaction principles
- One click to inspect building
- One click to collect if manual
- One clear CTA for next main quest
- No more than 3 simultaneous tutorial callouts on screen
- No hidden critical affordances

## 11.2 Agent view requirements
The agent must receive:
- structured plot state
- allowed tools only
- current goals
- budget/cap info
- recent important events
- no full DOM dump
- no irrelevant art payloads

### Agent observation payload
Minimum contents:
- HQ level
- inventory totals
- building list with state
- pending jobs
- required approvals
- autonomy flags
- allowed tools
- time remaining until next scheduled tick
- current quest step

---

## 12. Technical architecture

## 12.1 Primary implementation decision
Implement Founders Plot as a **manifest-discovered experience** inside Portal.

### Required reuse
- Use the experience manifest/loader pattern from the poker branch.
- Use the current browser agent runtime / worker patterns.
- Use the current deterministic Playwright contract-line culture.
- Use the existing Founders Loop state-machine discipline.
- Reuse the room/interactable/build-mode concepts from the Convex branch as the conceptual model for personal plots.

## 12.2 Simulation ownership
The simulation must be **authoritative and deterministic**.

### Required rule
- The world owns truth.
- The agent never writes state directly.
- The agent only requests actions through typed tools.
- The server validates and applies those actions.

## 12.3 Recommended storage model
Because Portal already uses `node:sqlite`, the most practical Phase 1 implementation is a dedicated structured sqlite module for plot state.

### Recommended store tables
Create dedicated tables or equivalent structured records for:

- `founderPlots`
- `founderBuildings`
- `founderJobs`
- `founderEventLog`
- `founderPermissions`
- `founderIdempotency`

Do **not** store plot state as one giant opaque JSON blob without indexes. Replayability and testability matter more than short-term convenience.

## 12.4 Personal plot identity
Each plot belongs to one pair or user identity.

### Canonical link
- `pairId -> plotId`
- optionally `plotId -> houseId` if house/HQ continuity is desired
- if ERC-8004 is linked, also record `plotId -> identity token metadata`

## 12.5 Event logging
Every meaningful state change must emit an event.

Minimum event types:
- `PLOT_CREATED`
- `BUILDING_PLACED`
- `BUILDING_STARTED`
- `BUILDING_COMPLETED`
- `JOB_QUEUED`
- `JOB_COMPLETED`
- `OUTPUT_COLLECTED`
- `HQ_UPGRADED`
- `APPROVAL_REQUESTED`
- `APPROVAL_APPROVED`
- `APPROVAL_REJECTED`
- `AGENT_PERMISSION_CHANGED`
- `AGENT_ACTION_EXECUTED`
- `RECAP_GENERATED`

Event logs must support:
- replay,
- recap generation,
- debugging,
- and deterministic re-simulation checks.

Approval request/resolve must be treated as first-class visible events. A future rebuild is not allowed to hide approval state transitions in silent row updates.

---

## 13. Data model (normative)

This section defines the canonical domain model. Implementation language/storage can vary, but fields and invariants must survive.

## 13.1 Plot
```ts
type Plot = {
  plotId: string;
  pairId: string;
  houseId?: string | null;
  worldId?: string | null;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  hqLevel: 1 | 2 | 3 | 4 | 5;
  townXp: number;
  inventory: {
    wood: number;
    stone: number;
    food: number;
    coin: number;
  };
  storageCaps: {
    wood: number;
    stone: number;
    food: number;
  };
  constructionSlots: number;
  createdAt: number;
  updatedAt: number;
  lastSimulatedAt: number;
};
```

## 13.2 Building
```ts
type PlotBuilding = {
  buildingId: string;
  plotId: string;
  objectInstanceId?: string | null;
  type: "HQ" | "LUMBER_CAMP" | "FARM_PLOT" | "QUARRY" | "WORKSHOP" | "MARKET_STALL";
  level: number;
  x: number;
  y: number;
  state: "EMPTY" | "UNDER_CONSTRUCTION" | "READY" | "PRODUCING" | "OUTPUT_READY" | "UPGRADING" | "DISABLED";
  outputBuffer?: {
    wood?: number;
    stone?: number;
    food?: number;
    coin?: number;
  };
  priority?: "WOOD" | "STONE" | "FOOD" | "BALANCED";
  createdAt: number;
  updatedAt: number;
};
```

## 13.3 Job
```ts
type PlotJob = {
  jobId: string;
  plotId: string;
  buildingId: string;
  kind: "CONSTRUCT" | "UPGRADE" | "PRODUCE" | "SELL";
  input: Record<string, number>;
  output: Record<string, number>;
  startedAt: number;
  endsAt: number;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "CLAIMED" | "FAILED" | "CANCELLED";
  createdBy: "HUMAN" | "AGENT" | "SYSTEM";
  explanation?: string | null;
};
```

## 13.4 Agent permission policy
```ts
type PlotAgentPolicy = {
  plotId: string;
  observeAndSuggest: boolean;
  collectOutputs: boolean;
  queueProduction: boolean;
  setPriority: boolean;
  sellSurplusFood: boolean;
  sellDailyCoinCap: number;
  maxAutonomousActionsPerHour: number;
  emergencyPause: boolean;
  updatedAt: number;
};
```

## 13.5 Invariants
These invariants are mandatory and testable.

1. Inventory values are never negative.
2. Building coordinates are unique per occupied tile.
3. A building may have at most one active running job.
4. A plot may not exceed its construction slot count.
5. HQ level increases monotonically and never skips levels.
6. A job may not start unless inputs are available.
7. A completed job may only be claimed once.
8. Offline catch-up may not advance more than 8 hours.
9. Agent actions must respect policy flags and caps.
10. Replaying the same event log from the same initial snapshot must produce the same final state hash.

## 13.6 Save compatibility contract
Founders Plot is allowed to start small, but save data must support additive future expansion without wiping player progress.

Required rules:
- Every persisted plot save must carry an explicit `schemaVersion`.
- Loading an older save must run a named migration path before gameplay logic reads the state.
- The loader must persist the canonical migrated shape after a successful forward migration.
- Additive metadata that the current phase does not actively interpret must survive round-trip persistence in `meta.extensions`.
- Core compatibility surfaces must not be renamed casually: building types, event types, permission keys, and occupied pad coordinates all require explicit migration if they change.

Extension policy:
- Adding new buildings, later HQ levels, new quest steps, and richer recap/public summary views is allowed.
- Rebalancing costs, durations, and rewards is allowed.
- Removing or relocating existing build pads requires a real migration because saved buildings already persist `x`/`y`.
- Renaming a building or permission key without migration is a save-contract break.

Testing requirement:
- A seeded compatibility regression must load a legacy v0 plot into the current version and prove that the migrated save exposes the current `schemaVersion` and preserves additive extension metadata.

---

## 14. Tool and API contract

The agent interaction surface must be typed, small, and deterministic.

## 14.1 Required tool set
Phase 1 requires these tools only.

### `et.plot.get_state`
Returns structured plot state.

### `et.plot.place_building`
Places a building on an allowed tile.  
**Human approval required** in Phase 1.

### `et.plot.queue_job`
Queues a production or sell job if permitted.

### `et.plot.collect_outputs`
Claims completed outputs if permitted.

### `et.plot.upgrade_building`
Starts a building or HQ upgrade.  
**Human approval required** for HQ.

### `et.plot.set_priority`
Sets one building priority if permitted.

### `et.plot.claim_reward`
Claims quest or level rewards.

### `et.plot.request_user_approval`
Creates a UI-visible approval request for sensitive actions.

Normative rule:
- creating an approval request must append an `APPROVAL_REQUESTED` event,
- resolving one must append either `APPROVAL_APPROVED` or `APPROVAL_REJECTED`,
- both must appear in recap output and replay event output.

## 14.2 Required error codes
- `UNAUTHORIZED`
- `FORBIDDEN_POLICY`
- `INVALID_STATE`
- `OUT_OF_RESOURCES`
- `OUT_OF_BOUNDS`
- `BUILD_SLOT_OCCUPIED`
- `JOB_ALREADY_RUNNING`
- `RATE_LIMITED`
- `IDEMPOTENCY_CONFLICT`
- `SIMULATION_DESYNC`
- `SERVER_ERROR`

## 14.3 Tool contract rules
1. Every tool must have JSON-schema arguments and results.
2. Every mutation tool must accept `idempotencyKey`.
3. Every result must return `ok`, `error?`, and `worldDelta`.
4. If the action is blocked by policy, the error must say **why** and whether retry is possible after approval.

---

## 15. Human-facing routes and files

## 15.1 Experience files
Create a manifest-based experience pack.

### Required files
- `public/experiences/founders-plot/manifest.json`
- `public/experiences/founders-plot/skill.md`
- `public/experiences/founders-plot/heartbeat.md`
- `public/experiences/founders-plot/goals.md`
- `public/experiences/founders-plot/tools.md`

### Recommended files
- `public/experiences/founders-plot/index.html` or equivalent mounted app entry
- `public/experiences/founders-plot/assets/*`
- `public/experiences/founders-plot/safety.md`

## 15.2 Server modules
Recommended server-side modules:

- `server/founders_plot/engine.js`
- `server/founders_plot/routes.js`
- `server/founders_plot/store.js`
- `server/founders_plot/replay.js`
- `server/founders_plot/recap.js`
- `server/founders_plot/tools.js`

If the implementation instead uses Convex as the authoritative runtime, preserve the same contract names and invariants.

---

## 16. Integration with existing flows

## 16.1 Post-onboarding handoff
When the current onboarding or founders-opening flow reaches “HQ opened” / “next quest revealed”, the default CTA must be:
- `Open Founders Plot`

This should not be a hidden experimental path.

## 16.2 House continuity
Founders Plot should inherit:
- the user’s identity shell,
- chosen agent brain/provider,
- house or HQ thematic continuity,
- and recap surfaces already present in Portal.

## 16.3 Browser-runner compatibility
The default browser agent runtime must be able to participate without additional setup beyond the current Brain/provider configuration.

The experience pack must be designed for:
- worker-driven turns,
- resumable sessions,
- explicit action cadence,
- and small observation payloads.

---

## 17. Test-driven development standard

This section is mandatory. No milestone is considered complete without its tests.

## 17.1 Test classes
Use five test classes.

### A. Unit tests (`UT`)
Pure logic tests:
- economy formulas,
- state transitions,
- resource math,
- policy checks,
- offline catch-up calculations.

### B. Contract tests (`CT`)
Schema and API tests:
- tool schemas,
- response schemas,
- pack manifest validity,
- error code consistency,
- replay file format.

### C. Integration tests (`IT`)
Authoritative system tests:
- state mutation via routes/tools,
- save/load,
- recap generation,
- idempotency,
- approval flows,
- event log emission.

### D. End-to-end tests (`E2E`)
Playwright/browser tests:
- onboarding handoff to Founders Plot,
- first-session tutorial,
- agent approval UI,
- collect/queue/upgrade loops,
- recap on resume.

### E. Replay + performance tests (`RPL`, `PERF`)
- deterministic replays,
- multi-plot simulation smoke,
- p95 latency checks,
- observation payload budget checks.

## 17.2 Test naming convention
Use deterministic test IDs.

Format:
- `FP-UT-###`
- `FP-CT-###`
- `FP-IT-###`
- `FP-E2E-###`
- `FP-RPL-###`
- `FP-PERF-###`

Example:
- `FP-UT-001_inventory_never_negative`
- `FP-IT-014_agent_collect_respects_policy_toggle`
- `FP-RPL-003_same_seed_same_hash_after_100_events`

## 17.3 TDD rule
For every feature:
1. write failing unit/contract tests first,
2. implement the narrowest change,
3. add at least one deterministic E2E if user-visible,
4. add replay coverage if it changes state transitions,
5. update the affected spec and API contract examples in the same change,
6. only then refactor.

---

## 18. Acceptance metrics

These are the metrics AI developers must be able to measure automatically.

## 18.1 Determinism metrics
### `StateHashDeterminism`
**Definition:** identical initial snapshot + identical action/event log must produce identical final state hash.

**Target:** `100%` across 10 reruns in CI for every replay fixture.

### `ReplayFidelity`
**Definition:** replay-generated recap event count must equal original event count for all visible plot events in fixture runs.

**Target:** `100%`

## 18.2 Correctness metrics
### `ResourceConservationError`
**Definition:** absolute error in  
`starting_inventory + produced - consumed - ending_inventory - buffered_outputs`

**Target:** `0` for every deterministic integration fixture.

### `DuplicateClaimRate`
**Definition:** completed jobs claimed more than once / total completed jobs.

**Target:** `0`

### `PolicyViolationRate`
**Definition:** unauthorized agent actions that mutate world state / total unauthorized attempts.

**Target:** `0` successful violations

## 18.3 Performance metrics
### `ToolMutationP95`
**Definition:** p95 latency for mutation tool routes in local/staging automation.

**Target:** `< 300 ms` local, `< 500 ms` staging

### `ObservationPayloadP95`
**Definition:** p95 bytes of agent observation payload.

**Target:** `< 8 KB`

### `ResumeRecoveryTimeP95`
**Definition:** time from page load to restored plot state and recap visible.

**Target:** `< 2.5 s` local, `< 4.0 s` staging

## 18.4 UX progression metrics
### `FirstLoopCompletionRate`
**Definition:** fraction of deterministic onboarding bot runs that complete:
- place Lumber Camp,
- collect first wood,
- upgrade HQ to 2

**Target:** `>= 95%`

### `TutorialStallRate`
**Definition:** bot or QA scripted runs that remain in one quest step for > 3 minutes.

**Target:** `<= 5%`

## 18.5 Agent collaboration metrics
### `HelpfulAgentActionRate`
**Definition:** autonomous agent actions that directly advance current quest or declared resource priority / total autonomous actions.

**Target:** `>= 80%` in scripted scenario harness

### `AgentBudgetRespectRate`
**Definition:** autonomous actions executed within configured caps / total executed autonomous actions.

**Target:** `100%`

---

## 19. Required test cases

This is the minimum initial suite.

## 19.1 Unit tests
- `FP-UT-001` inventory never goes negative
- `FP-UT-002` HQ levels progress monotonically
- `FP-UT-003` construction slots enforce concurrency cap
- `FP-UT-004` market conversion math is exact
- `FP-UT-005` workshop buff applies once
- `FP-UT-006` offline catch-up clamps at 8 hours
- `FP-UT-007` storage caps clamp outputs correctly
- `FP-UT-008` XP awards correct amounts once per trigger

## 19.2 Contract tests
- `FP-CT-001` manifest validates and experience appears in registry
- `FP-CT-002` every tool has args/result schemas
- `FP-CT-003` every mutation tool accepts idempotencyKey
- `FP-CT-004` every error code serializes to documented shape
- `FP-CT-005` recap payload validates against schema
- `FP-CT-006` event log entries have monotonic seq numbers

## 19.3 Integration tests
- `FP-IT-001` plot creation on first entry
- `FP-IT-002` building placement reserves tile
- `FP-IT-003` production job consumes and produces correctly
- `FP-IT-004` completed job cannot be claimed twice
- `FP-IT-005` HQ upgrade unlocks correct building and permission
- `FP-IT-006` agent collect blocked until policy enabled
- `FP-IT-007` agent queue blocked until HQ 3 and policy enabled
- `FP-IT-008` recap reflects actual offline events only
- `FP-IT-009` idempotent mutation replays identical result
- `FP-IT-010` event log replay reproduces final state hash
- `FP-IT-011` approval request and resolve events appear in recap and replay audit output
- `FP-IT-012` HQ upgrade costs only require already-unlocked resources at each tier
- `FP-IT-013` a legacy v0 plot save migrates to the current schema version and preserves additive extension metadata

## 19.4 End-to-end tests
- `FP-E2E-001` onboarding handoff opens Founders Plot
- `FP-E2E-002` player places Lumber Camp and collects first output
- `FP-E2E-003` agent recommendation appears after first output
- `FP-E2E-004` enabling collect permission lets agent collect, and recap shows why
- `FP-E2E-005` HQ 2 unlock banner and Farm Plot tutorial appear
- `FP-E2E-006` reload/resume restores state and recap drawer
- `FP-E2E-007` emergency pause stops autonomous actions instantly
- `FP-E2E-008` denied agent upgrade request produces approval card instead of mutation
- `FP-E2E-009` first-loop quest stays on first wood until collection, and the first Lumber Camp remains queueable/collectable in the browser
- `FP-E2E-010` HQ 2 teaches collect permission before Farm Plot and the next HQ cost only uses already-unlocked resources
- `FP-E2E-011` public summary exposes explicit progress-score semantics instead of a vague productivity score

## 19.5 Replay and perf tests
- `FP-RPL-001` same seed + same actions => same state hash
- `FP-RPL-002` replay after resume matches no-resume run
- `FP-PERF-001` 100 plots simulate 30 minutes without correctness drift
- `FP-PERF-002` observation payload stays within p95 budget
- `FP-PERF-003` route latency stays within p95 budget under synthetic load

---

## 20. Stepwise roadmap

## Milestone 0 — Stabilize the Portal base
### Goal
Prepare a reliable base branch for the builder.

### Tasks
- merge or rebase onboarding/security hardening work,
- land security PR equivalents,
- ensure browser worker runtime is stable,
- preserve current deterministic Playwright lines.

### Tests first
- current onboarding suite remains green,
- security regression tests remain green,
- worker continuity tests remain green.

### Exit criteria
- no regressions in existing Portal onboarding flows,
- no new builder work starts before this passes.

---

## Milestone 1 — Experience registry and Founders Plot shell
### Goal
Make Founders Plot appear as a first-class experience.

### Tasks
- add manifest-based discovery,
- add `/api/experiences` registry if not present in base branch,
- add Founders Plot manifest, route, skill, heartbeat, goals, tools stubs,
- add post-onboarding CTA into Founders Plot.

### Tests first
- `FP-CT-001`
- `FP-E2E-001`

### Metrics
- Founders Plot visible in registry: `100%`
- direct route open success in CI: `100%`

### Exit criteria
- Founders Plot can be entered,
- experience pack can be fetched and hashed,
- empty plot shell renders for human and agent.

---

## Milestone 2 — Deterministic plot core
### Goal
Implement plot creation, buildings, jobs, timers, and event logs.

### Tasks
- plot store tables,
- building state machine,
- production simulation,
- event log append,
- replay module.

### Tests first
- `FP-UT-001` through `FP-UT-007`
- `FP-IT-001` through `FP-IT-004`
- `FP-RPL-001`

### Metrics
- `StateHashDeterminism = 100%`
- `ResourceConservationError = 0`

### Exit criteria
- the server can create and simulate a plot without UI,
- replay reproduces state exactly.

---

## Milestone 3 — Human-first playable loop
### Goal
Allow the human to play the starter loop manually.

### Tasks
- build pad placement UI,
- building panel,
- manual collect,
- HQ upgrade flow,
- tutorial quests,
- inventory and level bar.

### Tests first
- `FP-E2E-002`
- `FP-E2E-005`

### Metrics
- `FirstLoopCompletionRate >= 95%`
- `TutorialStallRate <= 5%`

### Exit criteria
- a human can reach HQ Level 2 manually from a fresh plot.

---

## Milestone 4 — Agent foreman v1
### Goal
Introduce useful but safe agent automation.

### Tasks
- `get_state`
- `collect_outputs`
- approval surface
- policy toggles
- explanation strings
- recap linkage

### Tests first
- `FP-IT-006`
- `FP-E2E-003`
- `FP-E2E-004`
- `FP-E2E-008`

### Metrics
- `HelpfulAgentActionRate >= 80%`
- `PolicyViolationRate = 0`

### Exit criteria
- the agent can observe and collect outputs when allowed,
- every action is visible and explainable.

---

## Milestone 5 — Progression to HQ 5
### Goal
Complete the first meaningful progression arc.

### Tasks
- Quarry
- Workshop
- Market Stall
- HQ 3–5 upgrades
- additional permissions
- storage increase
- daily recap bonus

### Tests first
- remaining integration suite,
- HQ unlock tests,
- sell-cap tests,
- recap tests.

### Metrics
- `AgentBudgetRespectRate = 100%`
- `DuplicateClaimRate = 0`

### Exit criteria
- a player can reach HQ 5 in deterministic QA runs,
- agent permission ladder behaves exactly as documented.

---

## Milestone 6 — Resume, recap, and continuity
### Goal
Make the plot feel persistent and trustworthy.

### Tasks
- resume after reload,
- offline catch-up,
- while-you-were-away recap,
- audit/replay links,
- emergency pause.

### Tests first
- `FP-E2E-006`
- `FP-E2E-007`
- `FP-RPL-002`

### Metrics
- `ResumeRecoveryTimeP95` within target
- recap auditability: `100%`

### Exit criteria
- closing and reopening the browser preserves progress,
- recap is trustworthy and event-linked.

---

## Milestone 7 — Social read-only hooks
### Goal
Expose enough of the plot to the wider town to create anticipation for later social systems.

### Tasks
- town card / profile view for a plot,
- explicit public progress score with published basis,
- leaderboard stub,
- visitor mode (read-only).

### Tests first
- contract tests for public plot summary view,
- E2E for viewing another plot card.

### Exit criteria
- the plot can be surfaced publicly without exposing private agent internals.

---

## 21. Merge and branch strategy

This section is implementation guidance for agentic developers.

## 21.1 Base branch recommendation
Start from the newest stable Portal hardening line, then create a fresh integration branch:
- `feature/founders-plot-phase1`

## 21.2 Cherry-pick / port list
### Must port
- experience manifest loader pattern
- `/api/experiences` registry pattern
- founders-loop state-contract discipline
- browser-worker runtime continuity patterns
- deterministic Playwright testline conventions

### Strongly recommended to port conceptually
- `userRooms` / private world ownership model
- interactables / object-instance placement model
- build-mode selection patterns
- idempotency/event-log patterns from Werewolf

### Do not bulk-merge yet
- sandbox artifact mega-branch
- executor abstraction research mega-branch
- agent-library mega-branch

---

## 22. Definition of done

Founders Plot Phase 1 is done only when all of the following are true:

1. A fresh user can enter the plot immediately after onboarding.
2. The human can complete the first productive loop without devtools or manual DB edits.
3. The agent can provide advice and perform at least one useful autonomous action under permission.
4. The simulation is deterministic under replay.
5. The recap is generated from event logs and is auditable.
6. All mandatory tests in this document pass in CI.
7. Performance and payload metrics are within target.
8. No unauthorized agent action mutates the world.
9. Existing Portal onboarding and worker suites remain green.

If any one of these is false, the milestone is not complete.

---

## 23. Risks and mitigation

## 23.1 Risk: builder work drifts into an open-world rewrite
**Mitigation:** keep scope personal-shard only; no shared-city mechanics in Phase 1.

## 23.2 Risk: agent autonomy feels unsafe or chaotic
**Mitigation:** hard permission ladder, caps, event log, emergency pause.

## 23.3 Risk: Portal shell and game runtime diverge
**Mitigation:** keep Portal as front door and builder as experience pack with typed contracts.

## 23.4 Risk: too much tech debt from branch merging
**Mitigation:** cherry-pick only narrow reusable components; preserve contracts, not whole branches.

## 23.5 Risk: offline progress creates duplicate or inconsistent rewards
**Mitigation:** deterministic catch-up, idempotent claims, replay tests.

---

## 24. Immediate implementation checklist

1. Stabilize Portal base branch.
2. Port manifest registry into the chosen base.
3. Create Founders Plot experience pack files.
4. Implement plot store and state machine.
5. Write the first 10 unit/contract tests before UI work.
6. Build manual starter loop.
7. Add agent foreman v1 tools and permission UI.
8. Add resume/recap.
9. Add HQ 3–5 progression.
10. Add social read-only hooks.

---

## 25. Final recommendation

Build **Founders Plot** as the first city-builder/progression layer.

It is the highest-leverage move because it:
- reuses the strongest Portal work,
- fits the existing Agent Town vision,
- creates the missing retention loop,
- teaches AI delegation safely,
- and gives the broader world a reason to exist.

Do not attempt a full open town yet.  
Ship the home loop first.  
Make the agent visibly useful inside that loop.  
Then expand outward.

---

## Appendix A — Suggested initial file map

```text
public/
  experiences/
    founders-plot/
      manifest.json
      skill.md
      heartbeat.md
      goals.md
      tools.md
      index.html

server/
  founders_plot/
    engine.js
    routes.js
    store.js
    replay.js
    recap.js
    tools.js

e2e/
  120_founders_plot_entry.spec.js
  121_founders_plot_manual_loop.spec.js
  122_founders_plot_agent_collect.spec.js
  123_founders_plot_resume_recap.spec.js
  124_founders_plot_policy_guard.spec.js
```

---

## Appendix B — Suggested manifest example

```json
{
  "name": "founders-plot",
  "title": "Founders Plot",
  "parentDistrict": "house",
  "entryLabel": "Open your headquarters plot",
  "entryPrimary": true,
  "routePrefix": "/founders-plot",
  "embedPath": "/founders-plot?embed=1",
  "theme": {
    "accent": "#8b5cf6",
    "surface": "#12131a",
    "text": "#f8fafc"
  }
}
```

---

## Appendix C — Suggested tool stub example

```json
{
  "name": "et.plot.collect_outputs",
  "description": "Collect completed building outputs from one building on the caller's plot.",
  "argsSchema": {
    "type": "object",
    "properties": {
      "plotId": { "type": "string" },
      "buildingId": { "type": "string" },
      "idempotencyKey": { "type": "string" }
    },
    "required": ["plotId", "buildingId", "idempotencyKey"],
    "additionalProperties": false
  },
  "resultSchema": {
    "type": "object",
    "properties": {
      "ok": { "type": "boolean" },
      "collected": { "type": "object" },
      "worldDelta": { "type": "array" },
      "error": {
        "type": ["object", "null"],
        "properties": {
          "code": { "type": "string" },
          "message": { "type": "string" },
          "retryable": { "type": "boolean" }
        },
        "required": ["code", "message", "retryable"]
      }
    },
    "required": ["ok", "collected", "worldDelta", "error"],
    "additionalProperties": false
  }
}
```

---

## Appendix D — Required source alignment summary

This spec intentionally aligns with existing project direction:
- personal shards and private progression,
- deterministic core loops,
- controlled generativity,
- dual human/agent views,
- typed tool interfaces,
- browser-native agent participation,
- and a creator/platform architecture where “buildings are experiences”.

It also aligns with the strongest current code directions:
- Portal as onboarding shell,
- manifest-based experience discovery,
- founders-loop formal state contracts,
- deterministic TDD,
- and room/build/interactable patterns from the Eliza Town development work.
