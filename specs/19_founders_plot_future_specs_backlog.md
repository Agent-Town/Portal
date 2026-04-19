# Agent Town — Future Specs Backlog and Deferred Work Register

## Updated after the Founders Plot V1.1 refined specification

**Document version:** 2026-04-19  
**Primary reader:** future spec-writing LLMs and agentic AI developers  
**Current implementation target already specified elsewhere:** `Agent Town: Founders Plot V1.1 Refined Specification`  
**Purpose of this document:** preserve every important topic that is **not** included in the refined V1.1 build scope, so later versions can continue from a clear product, design, technical, and testing roadmap.

---

## 0. One-paragraph summary for a future LLM

Agent Town is the product and masterbrand. Founders Plot is the launch chapter. The refined V1.1 spec is intentionally narrow: it proves one polished first-hour home-plot loop, two living contract types, one micro-doctrine choice, a real OpenClaw Lite Foreman runtime path, and one scheduled Foreman action: `COLLECT_READY_OUTPUTS`. This document captures what was **deferred**: richer living-town systems, deeper contracts, coin sinks, aesthetic pride, generalized scheduler presets, persistent/off-session Foreman execution, full doctrine and trust, exception inbox, capability web, charters, specialist foremen, social sharing, ERC-8004/reputation, token economy, UGC/vibecoding, research datasets, moderation policy, hub integration, and later era/world expansion. Future specs must add one new decision layer at a time.

---

## 1. Read order for future spec-writing LLMs

Before writing the next spec, read in this order:

1. `agent-town-founders-plot-v1.1-refined-spec.md`  
   Treat this as the current implementation scope. Do not pull P2 topics into V1.1.

2. `agent-town-founders-plot-v1.1-tdd-acceptance-matrix.md`  
   Understand the measurable test style expected from agentic AI developers.

3. `agent-town-founders-plot-v1.1-feedback-resolution.md`  
   Understand which critiques were accepted, partially accepted, rejected, or deferred.

4. This file: `agent-town-future-specs-backlog-updated-after-v1.1.md`  
   Use it to choose the next spec target and avoid losing deferred ideas.

5. Strategic source memos:
   - `agent-town-product-strategy-and-roadmap.md`
   - `agent-town-brand-and-setting-direction.md`
   - `founders-plot-extension-research-memo.md`
   - `founders-plot-staged-product-roadmap.md`
   - `founders-plot-tech-tree-direction.md`
   - `founders-plot-persistent-foreman-planning.md`
   - `founders-plot-offload-branch-lineage-check.md`
   - `founders-plot-persistent-worker-branch-review.md`

6. Older architecture/design sources when relevant:
   - `eliza-town-vnext-agent-first-spec.md`
   - `TownRunnerLite.md`
   - `Eliza_Town_Vision_v0.3 (1).pdf`
   - `Eliza Town_Updated Platform Design and AI Integration_V2.pdf`
   - `eliza-town-werewolf-mvp-mcp-spec.md`
   - `2304.03442v2.pdf`

---

## 2. Current V1.1 boundary, restated

### 2.1 V1.1 P0 includes

The refined V1.1 build includes these **must-ship** items only:

| Area | V1.1 P0 scope |
|---|---|
| Product identity | User-facing product is **Agent Town: Founders Plot**. |
| Launch Gate UX | Founders Plot becomes the default game surface after onboarding. No provider/model/wallet/debug jargon in the game loop. |
| First-hour progression | HQ1 → Lumber Camp → first wood → HQ2 → Farm Plot → first contract. |
| Contract Board | `SUPPLY` and `BUILD` only. One active contract. Named requesters and institutions. Why-now text. |
| Micro-doctrine | One Foreman Standing Order v0 choice: `CAREFUL_STEWARD` or `BOLD_FOUNDER`. |
| Foreman runtime | OpenClaw Lite worker actually boots, observes Founders Plot, and performs one safe mutation through a Foreman-authenticated route. |
| Scheduler | One preset only: `COLLECT_READY_OUTPUTS`. Server-persisted. Executed by active OpenClaw Lite runtime. |
| Trust | Foreman Plan Card, action receipt, recap attribution, and small correction controls. |
| Security | Server-authoritative tools, idempotency, direct actor-spoof rejection, no client-declared Foreman identity. |
| Replay/ledger | Resource deltas and action-log replay hardening sufficient for V1.1 proof. |

### 2.2 V1.1 P1 may include, but only if P0 is green

If not shipped in the V1.1 branch, these become immediate future candidates:

| Area | P1 candidate |
|---|---|
| Scheduler | `KEEP_ONE_BUILDING_RUNNING` for one selected building or one Foreman-selected building under Standing Order. |
| Contracts | More `SUPPLY` and `BUILD` cards only; no new contract type. |
| Plan cards | More explicit contract-aware tradeoff phrasing. |
| Scheduler persistence | Scheduled preset survives reload without duplication. |
| Correction UX | `do this next time`, `ask me next time`, `snooze this suggestion`. |

### 2.3 V1.1 explicitly excludes

Do **not** implement these under the V1.1 spec unless a human maintainer explicitly writes a new spec:

- `MAINTAIN_RESOURCE_RESERVE`
- `CHECK_BOTTLENECK`
- `ASSIST_ACTIVE_CONTRACT`
- `RECOVERY` contracts
- `PREPARATION` contracts
- contract expiration and abandon complexity
- full doctrine board
- charter / starting-town-trait system
- backend-pool persistent/off-session Foreman
- specialist foremen
- broad multi-tab takeover UX beyond safe stale/fail-closed behavior
- social sharing and visitor mode
- tokenized economy
- marketplace
- UGC/vibecoding
- ERC-8004 as a gameplay requirement
- giant resource/building expansion
- era progression
- shared-world multiplayer

---

## 3. Locked decisions that future specs should not reopen casually

### 3.1 Naming and packaging

- **Agent Town** is the product/masterbrand.
- **Founders Plot** is the launch chapter / starting campaign.
- Preferred transitional label: **Agent Town: Founders Plot**.

Do not make Founders Plot the permanent umbrella product name.

### 3.2 Setting

- V1 remains stylized frontier / Wild West-coded founding era.
- The tone is warm, hopeful, newly settled, mythic frontier civic-builder.
- Later eras may exist only as the same town evolving, not as a generic civilization-game pivot.

### 3.3 Product thesis

Agent Town is a frontier town-builder where the player founds a settlement with an AI partner and gradually teaches it to run by their rules.

The differentiator is not “the AI does everything.”  
The differentiator is: **the town increasingly runs according to the player’s values, rules, and style.**

### 3.4 Architecture principle

Agent-owned mind, world-owned reality.

- The agent owns memory, style, planning, and cognition.
- The world/server owns rules, state, validation, timers, outcomes, event logs, and resource accounting.
- If an action is not expressible through a typed tool, it cannot change world state.

### 3.5 Version discipline

Each version should add **one new decision layer**:

| Version | Main decision layer |
|---|---|
| V1 / V1.1 | Demand, attachment, first trusted in-session assist. |
| V1.2 / V1.3 | Living-town depth and slightly richer in-session delegation, if V1.1 is strong. |
| V2 | Governance, doctrine, trust, persistent delegation. |
| V3 | Operating identity, charters, capability web, specialist staff. |
| V4 | Social diffusion, sharing, comparison, collaboration. |

Do not add five new systems in one spec.

---

## 4. Recommended next-spec sequence

The next spec after V1.1 should be chosen based on V1.1 results. The likely order is below.

### 4.1 V1.2 — Living Town and Better Demand

**Working title:** `Agent Town: Founders Plot V1.2 — Living Town Contracts and Town Identity`

**Use this if:** V1.1 P0 lands and the hero Foreman action works, but the game still feels like a resource board instead of a town.

**Product promise:** “My plot has people, needs, civic pressure, and a visible identity.”

**Main new decision layer:** deeper demand and town attachment.

**Candidate scope:**

- Add `RECOVERY` contracts only if they create a distinct player psychology.
- Add `PREPARATION` contracts only if they connect to an event-like town moment.
- Add requesters as persistent light characters or institutions.
- Add town signals: shortage, request pressure, civic prep, morale/charm hint, market timing.
- Add contract board deck rules, refresh cadence, duplicate prevention, and first-day pacing.
- Add coin sinks and coin purpose without adding new currencies.
- Add one aesthetic pride layer: landmark, charm, district label, or public square upgrade.
- Add richer recap: what the town needed, who asked, what improved.

**Must not include:** persistent off-session Foreman, full doctrine board, specialist staff, social sharing.

**Success metric examples:**

- `ContractComprehensionRate >= 85%` in playtest script.
- `RequesterRecallRate >= 60%`: players can name who asked for the active contract.
- `TownFeelsAliveSurvey >= 4/5` from internal playtest rubric.
- `ContractDeckDuplicateRate <= 10%` over first 10 generated cards.
- `CoinSpentOnUsefulSinkRate >= 50%` in scripted first-day test.

### 4.2 V1.3 — In-Session Delegation Depth

**Working title:** `Agent Town: Founders Plot V1.3 — Foreman Routine Depth and Correction Memory`

**Use this if:** V1.1 proves auto-collect and players understand Foreman runtime truth, but the Foreman still feels like a macro rather than a collaborator.

**Product promise:** “My Foreman can handle one or two useful routines while I watch, and it remembers my lightweight corrections.”

**Main new decision layer:** slightly richer supervised in-session delegation.

**Candidate scope:**

- Ship `KEEP_ONE_BUILDING_RUNNING` if not in V1.1 P1.
- Add a small correction-memory layer:
  - do this next time;
  - ask me next time;
  - do not suggest this for a while;
  - pause this routine.
- Add deterministic conflict priority between auto-collect and keep-running.
- Add a clearer Foreman confidence/candidate model:
  - deterministic candidate generator;
  - OpenClaw Lite / test brain chooses among safe candidates;
  - server validates again.
- Add Plan Card comparisons when two safe actions are possible.
- Add first visible “Foreman learned your preference” moment.

**Must not include:** arbitrary schedules, persistent off-session execution, full doctrine board, domain stewardship.

**Success metric examples:**

- `ForemanCorrectionAppliedRate = 100%` in deterministic correction fixtures.
- `UnexpectedForemanActionRate = 0` in scripted scenarios.
- `HelpfulAgentActionRate >= 80%` in internal playtest rubrics.
- `DuplicateRoutineExecutionRate = 0` under double tick.
- `PlayerCanExplainForemanBoundaryRate >= 80%`.

### 4.3 V2.0 — Persistent Foreman

**Working title:** `Agent Town: Founders Plot V2.0 — Persistent Foreman and Morning Brief`

**Use this if:** V1.1/V1.2/V1.3 prove the home loop, demand, recap, and in-session Foreman are understandable and trusted.

**Product promise:** “My town can keep moving when I step away, but only under my rules, and I can always see why.”

**Main new decision layer:** persistent delegation.

**Candidate scope:**

- One persistent Foreman per plot.
- Backend-pool only for first persistent execution.
- Runtime states: running here, running in backend, paused, stale, failed, needs approval.
- Off-session task execution for existing safe routines only.
- Morning Brief separates:
  - passive simulation;
  - Foreman actions;
  - pending exceptions;
  - failures/stale periods.
- Emergency pause.
- Runtime lease truth and fail-closed behavior.
- Durable approvals / exception inbox v0.
- Use runtime-instance/offload substrate from `codex/executor-abstraction-research-v0-1` selectively.

**Must not include:** local-node transfer, managed runtime, specialist foremen, shareable agents, marketplaces, broad social systems.

**Success metric examples:**

- `OffSessionForemanActionProof = true` in E2E.
- `StaleRuntimeShownAsHealthy = 0`.
- `OneRuntimePerPlotViolationRate = 0`.
- `EmergencyPauseLatencyP95 <= 2s`.
- `MorningBriefAttributionCoverage = 100%`.
- `PolicyViolationRate = 0`.

### 4.4 V2.1 — Doctrine and Trust

**Working title:** `Agent Town: Founders Plot V2.1 — Doctrine Board, Authority Ladder, and Exception Inbox`

**Use this if:** persistent Foreman works but players need more predictable behavior than presets and receipts.

**Product promise:** “I can teach my Foreman a town philosophy, not just toggle automation.”

**Main new decision layer:** governance and policy.

**Candidate scope:**

- Doctrine Board with 3–5 high-value slots, not dozens of thresholds.
- Authority ladder:
  - observe;
  - recommend;
  - routine execute;
  - bounded stewardship.
- Approval thresholds and spend/reserve rules.
- Exception inbox as the main play surface for meaningful judgment calls.
- Doctrine-driven Plan Cards and Morning Brief.
- Trust progression that is earned through successful bounded behavior.

**Must not include:** specialist roster, sharable foremen, open-ended AI redesign, large charters.

**Success metric examples:**

- `DoctrineAffectsDecisionRate >= 80%` in scenario fixtures.
- `ExceptionInboxNoiseRate <= 20%` of exceptions judged low-value by playtest rubric.
- `PlayerCanPredictForemanActionRate >= 75%`.
- `ManualOverrideRate` decreases after doctrine setup without reducing satisfaction.
- `DoctrineChangeExplainedInRecapCoverage = 100%`.

### 4.5 V3.0 — Operating Model

**Working title:** `Agent Town: Founders Plot V3.0 — Charters, Capability Web, and Specialist Foremen`

**Use this if:** one persistent Foreman and doctrine are trusted, and the base game needs replayability and build identity.

**Product promise:** “This town has an operating philosophy. Different towns can succeed through different styles.”

**Main new decision layer:** town identity and organization design.

**Candidate scope:**

- Founding Charters that create asymmetric starts.
- Capability Web, not a giant tech tree.
- District specialization.
- Scenario/season decks.
- Small bounded specialist set:
  - Builder Foreman;
  - Quartermaster;
  - Trade Clerk;
  - Event Steward.
- Specialist scopes, doctrine inheritance, audit trails, and handoff rules.
- Controlled playbook transfer between runs.

**Must not include:** giant specialist roster, broad agent marketplace, destructive PvP, dozens of currencies/resources, real-world action bridges as core progression.

**Success metric examples:**

- `DistinctTownBuildRate >= 3` viable archetypes in test scenarios.
- `CharterComprehensionRate >= 80%`.
- `SpecialistScopeViolationRate = 0`.
- `ReplayIntentSurvey >= 4/5` in internal testing.
- `CapabilityUnlockVerbRatio >= 80%`: most unlocks add verbs or decisions, not passive stats.

### 4.6 V4.0 — Social Diffusion and Shared Operating Styles

**Working title:** `Agent Town V4.0 — Visitor Mode, Plot Cards, and Operating Style Sharing`

**Use this if:** single-player retention, delegation, and replayability are stable.

**Product promise:** “My town’s way of thinking matters beyond my save file.”

**Main new decision layer:** social admiration and reuse.

**Candidate scope:**

- Public plot cards.
- Read-only visitor mode.
- Blueprint sharing.
- Doctrine pack sharing.
- Bounded Foreman template sharing with provenance and audit summary.
- Seasonal House/guild contribution projects.
- Soft prestige boards.

**Must not include:** destructive PvP, black-box agent marketplaces, real-time shared-world simulation, chore-heavy clan obligations.

**Success metric examples:**

- `PlotCardShareRate` measured per active player.
- `VisitorToReturnRate` measured after viewing another plot.
- `SharedBlueprintUseRate` measured per published blueprint.
- `SocialPressureComplaintRate` below threshold in qualitative testing.
- `PvPDestructiveMechanicsIntroduced = false`.

---

## 5. Deferred-topic inventory

Each topic below is intentionally preserved for future specs. Do not treat this as permission to implement all of them at once.

---

### 5.1 Living-town stakeholders and institutions

**Status:** partially introduced in V1.1 through named requesters and institutions, but not fully developed.

**Why it matters:** the game must feel like founding a town, not optimizing a private resource board.

**Future design work:**

- recurring requesters;
- first institutions such as Depot, Town Hall, Market, Workshop Guild, Clinic, Schoolhouse, or Rail Office;
- town signals that represent civic pressure;
- visible consequences for contract choices;
- small character beats tied to contracts and recap.

**Earliest safe version:** V1.2.

**Recommended spec:** `agent-town-founders-plot-v1.2-living-town-contracts-spec.md`.

**Test ideas:**

- fixture generates three contracts with distinct requesters and why-now text;
- player-facing contract card includes who, why, requirement, reward, and consequence;
- recap names the requester and outcome;
- duplicate requesters are allowed only if intentionally weighted.

---

### 5.2 Recovery and Preparation contracts

**Status:** deferred from V1.1.

**Why it matters:** these can add drama and mid-session direction, but they risk becoming wrappers around the same resource checks.

**Future design work:**

- `RECOVERY`: respond to shortage, failed production lane, storm damage, or missed reserve.
- `PREPARATION`: prepare for market day, festival, visiting merchant, inspection, or weather event.
- define how these differ emotionally and mechanically from `SUPPLY` and `BUILD`.
- define contract deck size, refresh cadence, duplicate prevention, and one-active-contract rule evolution.

**Earliest safe version:** V1.2.

**Recommended spec:** include inside V1.2 Living Town spec, not standalone unless the contract system becomes large.

**Test ideas:**

- `RECOVERY` must require a visible negative condition before spawning;
- `PREPARATION` must have an upcoming event marker;
- at least 80% of generated contracts are satisfiable from current/near-future state;
- no impossible contract appears in first hour.

---

### 5.3 Coin economy and early sinks

**Status:** underdefined after V1.1.

**Why it matters:** coin rewards will feel abstract if coin has no meaningful use.

**Future design work:**

- define coin’s early purpose;
- add one or two safe sinks:
  - small civic purchase;
  - optional contract acceleration;
  - market fee;
  - decoration/charm purchase;
  - limited storage convenience;
- avoid pay-to-win or token economy assumptions in core V1.

**Earliest safe version:** V1.2.

**Recommended spec:** `agent-town-founders-plot-v1.2-economy-balance-note.md` or a section of V1.2.

**Test ideas:**

- first-day scripted run earns and spends coin at least once;
- no coin sink blocks tutorial completion;
- coin reward expected value is stable across deterministic seeds;
- resource conservation still passes.

---

### 5.4 Aesthetic pride, charm, and layout identity

**Status:** not included in V1.1 beyond launch-gate UI polish.

**Why it matters:** the town needs pride and attachment, not only efficiency.

**Future design work:**

- one landmark or civic center upgrade;
- charm/prestige score as a light layer;
- plot snapshot/card visual language;
- district labels or frontier neighborhood identity;
- visual building states that show progress and life.

**Earliest safe version:** V1.2 or V1.3.

**Recommended spec:** `agent-town-founders-plot-layout-pride-and-charm-spec.md`.

**Test ideas:**

- screenshot baseline includes visible improvement after first upgrade;
- landmark/charm system has no effect on core tutorial solvability;
- player can identify what changed visually after first session.

---

### 5.5 Generalized scheduler presets

**Status:** V1.1 includes only `COLLECT_READY_OUTPUTS`; P1 may add `KEEP_ONE_BUILDING_RUNNING`.

**Deferred presets:**

- `MAINTAIN_RESOURCE_RESERVE`
- `CHECK_BOTTLENECK`
- `ASSIST_ACTIVE_CONTRACT`
- arbitrary user-defined schedules
- multi-task priority queues

**Why it matters:** these are where automation becomes powerful, but they require doctrine and conflict rules.

**Earliest safe version:**

- `KEEP_ONE_BUILDING_RUNNING`: V1.1 P1 or V1.3.
- `MAINTAIN_RESOURCE_RESERVE`: V2.1 with Doctrine Board.
- `ASSIST_ACTIVE_CONTRACT`: after contract system is richer and doctrine is clear.
- arbitrary schedules: much later, if ever exposed to users.

**Recommended spec:** `agent-town-foreman-scheduler-preset-expansion-spec.md`.

**Test ideas:**

- no duplicate task execution under double tick;
- task conflict priority deterministic;
- scheduler no-ops if confidence or policy is insufficient;
- scheduler actions always appear in receipt and recap;
- `PolicyViolationRate = 0`.

---

### 5.6 Persistent/off-session Foreman

**Status:** explicitly deferred from V1.1 implementation. V1.1 keeps server-persisted tasks to ease future migration.

**Why it matters:** this is the first true bridge from operator loop to governor loop.

**Existing donor guidance:** use `codex/executor-abstraction-research-v0-1` selectively for runtime instances, backend-pool offload, snapshots, lease truth, and stale state. Do not bulk-merge it blindly.

**Future design work:**

- one runtime per plot;
- backend-pool execution first;
- explicit runtime states;
- off-session actions limited to safe routines;
- durable approvals;
- morning brief;
- fail-closed semantics;
- emergency pause;
- one clean off-session E2E proof.

**Earliest safe version:** V2.0.

**Recommended specs:**

- `agent-town-persistent-foreman-v2.0-spec.md`
- `agent-town-persistent-foreman-v2.0-tdd-spec.md`

**Test ideas:**

- browser closes, backend Foreman acts once, user returns to honest recap;
- stale backend child never appears healthy;
- emergency pause stops queued execution;
- one-runtime-per-plot invariant holds under multi-tab/device races;
- recap separates passive simulation from Foreman action.

---

### 5.7 Full Doctrine Board

**Status:** deferred. V1.1 only has Standing Order v0.

**Why it matters:** doctrine is the real teaching mechanic. It turns the Foreman from a macro runner into a governed collaborator.

**Future design work:**

- doctrine slots, not dozens of thresholds;
- doctrine families such as reliability, throughput, prudence, autonomy, hospitality, prestige;
- policy conflict resolution;
- doctrine impact on scheduler decisions, Plan Cards, exceptions, and recap;
- doctrine change history.

**Earliest safe version:** V2.1.

**Recommended spec:** `agent-town-doctrine-trust-authority-v2.1-spec.md`.

**Test ideas:**

- changing doctrine changes action selection in deterministic fixtures;
- recap cites doctrine when it influenced an action;
- player-facing copy explains what the Foreman will do before it acts;
- no doctrine setting permits forbidden actions.

---

### 5.8 Trust ladder and authority model

**Status:** foreshadowed by V1.1 micro-doctrine and scheduler permissions, not complete.

**Future ladder:**

1. Observe
2. Recommend
3. Routine Execute
4. Bounded Stewardship
5. Exception Handling
6. Specialist Coordination

**Earliest safe version:** V2.1.

**Recommended spec:** same as Doctrine/Trust spec.

**Test ideas:**

- authority level determines available Foreman actions;
- upgrade requires prior successful actions or explicit tutorial milestone;
- downgrade/pause is always available;
- actions above authority create approval requests rather than mutations.

---

### 5.9 Exception inbox and Morning Brief

**Status:** V1.1 has receipts and recap attribution, but not a true exception workflow.

**Why it matters:** later gameplay should make the human handle judgment, not repetitive chores.

**Future design work:**

- Morning Brief on return;
- exception categories:
  - policy boundary;
  - missing resource;
  - contract tradeoff;
  - spend approval;
  - Foreman uncertainty;
- approve/deny/teach controls;
- exception aging and resolution.

**Earliest safe version:** V2.0 for basic Morning Brief; V2.1 for full exception inbox.

**Recommended spec:** `agent-town-morning-brief-exception-inbox-spec.md`.

**Test ideas:**

- off-session policy boundary creates exception rather than action;
- exception survives reload;
- resolving exception emits audit event;
- next plan respects resolution.

---

### 5.10 Capability Web

**Status:** deferred.

**Why it matters:** progression should unlock new town verbs and organizational capacity, not passive stat clutter.

**Future design work:**

Capability categories may include:

- Production and logistics;
- Contracts and economy;
- Governance and delegation;
- Planning and districting;
- Staff and specialization.

**Rule:** every major capability unlock must create a new decision surface, agent behavior surface, or contract/problem type.

**Earliest safe version:** V3.0, with small foreshadowing in V2.

**Recommended spec:** `agent-town-capability-web-v3.0-spec.md`.

**Test ideas:**

- `CapabilityUnlockVerbRatio >= 80%`;
- no unlock exists only as a passive percentage bonus unless explicitly justified;
- unlock descriptions include new verb, affected tools, affected UI, and affected tests.

---

### 5.11 Founding Charters and run identity

**Status:** deferred from V1.1 after feedback.

**Why it matters:** replayability should come from town identity and operating style, not random resource shuffling.

**Future design work:**

- Merchant Charter;
- Commons Charter;
- Works Charter;
- Stewardship Charter;
- starting capability bias;
- doctrine bias;
- drawback;
- contract deck skew;
- starter visual identity.

**Earliest safe version:** V3.0.

**Recommended spec:** `agent-town-founding-charters-v3.0-spec.md`.

**Test ideas:**

- each charter changes first-hour decisions without breaking tutorial;
- at least three viable playstyles exist;
- charter effects visible in contract deck and recap;
- player can explain charter tradeoff after selecting it.

---

### 5.12 Specialist Foremen

**Status:** explicitly deferred.

**Why it matters:** specialists are powerful only after one general Foreman is trusted.

**Future roles:**

- Builder Foreman;
- Quartermaster;
- Trade Clerk;
- Event Steward;
- Archivist, later if recap/research becomes a major surface.

**Earliest safe version:** V3.0 after doctrine and authority are working.

**Recommended spec:** `agent-town-specialist-foremen-v3.0-spec.md`.

**Guardrails:**

- narrow domain per specialist;
- server-authoritative tools;
- clear scope boundary;
- doctrine inheritance;
- audit trail;
- manual override;
- no black-box multi-agent swarm.

**Test ideas:**

- each specialist can only call tools in its domain;
- specialist action appears under its role in recap;
- conflicting specialists escalate to human or doctrine priority;
- specialist can be paused independently.

---

### 5.13 Scenario decks, seasons, and bounded replayability

**Status:** deferred.

**Why it matters:** persistent home plots can go stale; bounded scenarios create session purpose without deleting the home town.

**Future design work:**

- market day;
- harvest festival;
- storm prep;
- derelict block restoration;
- merchant week;
- austerity week;
- weekly fixed seeds.

**Earliest safe version:** V3.0, with small V1.2/V1.3 preparation contracts as previews.

**Recommended spec:** `agent-town-scenarios-and-season-decks-spec.md`.

**Test ideas:**

- scenario has start/end condition;
- scenario changes contract mix;
- scenario recap summarizes outcome and doctrine/Foreman contribution;
- scenario does not require daily chore pressure.

---

### 5.14 Public plot cards and visitor mode

**Status:** deferred.

**Why it matters:** social aspiration should begin with admiration and sharing, not destructive competition.

**Future design work:**

- public plot snapshot;
- HQ level and landmark summary;
- doctrine/operating style summary when safe;
- Foreman style label;
- visitor mode with no mutation rights;
- share image/card.

**Earliest safe version:** V4.0, or late V3 if single-player retention is strong.

**Recommended spec:** `agent-town-public-plot-cards-and-visitor-mode-spec.md`.

**Test ideas:**

- visitor cannot mutate host plot;
- public card hides private/raw audit details;
- share card renders consistently at mobile and desktop sizes;
- public card generation has privacy filter.

---

### 5.15 Blueprint, doctrine, and Foreman-template sharing

**Status:** deferred.

**Why it matters:** operating styles can become Agent Town-native social artifacts.

**Future design work:**

- blueprint share/copy;
- doctrine pack export/import;
- bounded Foreman template with provenance;
- audit summary for shared templates;
- reputation/validation before public discovery.

**Earliest safe version:** V4.0.

**Recommended spec:** `agent-town-operating-style-sharing-spec.md`.

**Guardrails:**

- do not share black-box agent minds;
- share bounded policies, templates, and performance summaries;
- keep provenance and versioning;
- require safe scopes.

---

### 5.16 Public hub and instanced experiences beyond Founders Plot

**Status:** partially present in Portal shell; not part of V1.1 build except navigation context.

**Why it matters:** Agent Town is eventually a town-shaped platform with buildings as experiences.

**Future design work:**

- Saloon as experience hub;
- Town Hall / Werewolf integration;
- Atlas / storefront discovery;
- buildings as manifest-registered experiences;
- Founders Plot as home plot linked from hub;
- experience routing and admission rules;
- consistent dual-view packs.

**Existing donor guidance:** `poker-saloon-redesign` contains a manifest-based experience plugin system. Harvest carefully.

**Earliest safe version:** after V1.1 or parallel platform track if it does not destabilize the home plot.

**Recommended spec:** `agent-town-experience-registry-and-town-hub-spec.md`.

**Test ideas:**

- every registered experience has manifest, route, skill/tools/heartbeat/goals files;
- registry endpoint returns Founders Plot and other active experiences;
- UI shows only allowed experiences by tier/state;
- broken manifest does not crash the town shell.

---

### 5.17 ERC-8004 identity and reputation

**Status:** outside V1.1 game loop. Existing Portal already has some identity and registration work, but Founders Plot should not require blockchain literacy for first play.

**Why it matters:** later agent identity, reputation, provenance, and shared Foreman templates need portable identity.

**Future design work:**

- when to require identity;
- agent/pair identity mapping;
- context-bound reputation;
- event-hash-backed reviews;
- identity transfer and continuity;
- reputation use in matchmaking/discovery.

**Earliest safe version:** platform track after V1.1; gameplay dependency no earlier than V3/V4.

**Recommended spec:** `agent-town-erc8004-identity-reputation-integration-spec.md`.

**Guardrails:**

- do not block the first home-plot loop on wallet or on-chain state;
- context-bound reputation only;
- no generic rating spam;
- no hidden paywall for core play.

---

### 5.18 Token economy and creator economy

**Status:** deferred from game V1.1.

**Why it matters:** long-term sustainability may use token sinks, creator earnings, tickets, cosmetics, and genAI features, but early game fun must not depend on token speculation.

**Future design work:**

- cosmetics;
- convenience sinks;
- platform-paid genAI features such as recap/narration/vibecoding;
- experience tickets;
- marketplace fees;
- creator revenue;
- governance;
- anti-farm protections;
- regulatory caution.

**Earliest safe version:** economy alpha after home loop retention; tokenized public economy later than V1.1.

**Recommended spec:** `agent-town-economy-and-token-utility-spec.md`.

**Guardrails:**

- no raw pay-to-win resource selling as core loop;
- no unrestricted betting/gambling mechanics;
- creators should not pay to publish by default;
- token utility must support sustainability, not extraction.

---

### 5.19 UGC, vibecoding, and safe experience publishing

**Status:** deferred.

**Why it matters:** Agent Town’s long-term platform layer depends on creator-made buildings and AI-assisted creation.

**Future design work:**

- create in private sandbox;
- AI assistant generates structured config, not arbitrary code;
- component catalog;
- schema validation;
- sim-test with automated agents;
- publish to personal shard or submit to public registry;
- versioning and rollback;
- ownership/licensing/provenance.

**Earliest safe version:** after experience registry and home-loop stability.

**Recommended spec:** `agent-town-ugc-vibecoding-creation-pipeline-spec.md`.

**Guardrails:**

- no unbounded generated code in production;
- no public publish without validation;
- no IP/asset provenance ambiguity;
- sandbox first, public later.

---

### 5.20 Research-grade event logs, replay, and privacy

**Status:** V1.1 includes local replay/ledger hardening, not a full research dataset platform.

**Why it matters:** event logs support recaps, debugging, research, replay, provenance, and auditability.

**Future design work:**

- event privacy tiers;
- PII scrubbing;
- public coarse logs;
- owner-only full logs;
- research export format;
- no chain-of-thought exposure;
- event hashes for provenance;
- replay viewer.

**Earliest safe version:** start parallel once V1.1 event schema stabilizes; full research dataset later.

**Recommended spec:** `agent-town-event-log-replay-and-research-data-spec.md`.

**Guardrails:**

- never export private agent memory or chain-of-thought;
- personal shard logs need privacy controls;
- public datasets must be anonymized/coarsened.

---

### 5.21 Moderation and safety posture

**Status:** V1.1 has tool constraints and spoof rejection, but not full moderation policy.

**Why it matters:** public hub, social sharing, UGC, agent communication, and reputation all need layered safety.

**Future design work:**

- tool-layer constraints;
- speech moderation;
- rate limits;
- quarantine mode;
- appeal/transparency;
- public/private zone differences;
- research-mode opt-in;
- abuse reports.

**Earliest safe version:** parallel platform track before broader public/social/UGC launch.

**Recommended spec:** `agent-town-moderation-and-safety-stack-spec.md`.

---

### 5.22 Design system and flagship frontend continuity

**Status:** `BRAND.md`, `DESIGN.md`, `GAME_UX.md`, `REGISTRY.md`, and component registry plan exist, but V1.1 only enforces launch-gate basics.

**Why it matters:** UI/UX has been a project bottleneck. Future work must preserve design law and avoid dashboard creep.

**Future design work:**

- screenshot baseline governance;
- scenic town composition;
- component registry implementation;
- mobile-first HUD rules;
- animation/motion tokens;
- no-jargon enforcement;
- playtest-driven comprehension metrics;
- design review CI.

**Earliest safe version:** continuous; every spec touching UI must include design acceptance tests.

**Recommended spec:** `agent-town-design-system-implementation-and-visual-regression-spec.md`.

**Guardrails:**

- do not expose provider/model/debug details in the game surface;
- one primary CTA at a time;
- keep technical control rooms backstage;
- Founders Plot must feel like a place, not a console.

---

### 5.23 Era progression and setting expansion

**Status:** explicitly deferred.

**Why it matters:** long-term growth may benefit from town evolution, but premature multi-era ambition will blur the hook.

**Future design work:**

- frontier civic expansion;
- early industrial growth;
- rail/logistics/governance institutions;
- discrete chapters or age layers;
- continuity of town identity.

**Earliest safe version:** V3+ only after governance/delegation loop works.

**Recommended spec:** `agent-town-era-progression-and-town-evolution-spec.md`.

**Guardrails:**

- do not become Civ-lite;
- keep the same town identity;
- eras must add governance problems, not just reskins.

---

### 5.24 Real-world bridge and external actions

**Status:** deferred.

**Why it matters:** Agent Town can eventually teach real agent practices and perhaps bridge to real-world services, but this is high-risk and not needed for core game proof.

**Future design work:**

- export doctrine templates;
- OpenClaw skill transfer;
- real outreach/storefront assistants;
- marketplace/service bots;
- spend policies;
- legal/safety reviews.

**Earliest safe version:** far future after in-game governance is loved and trusted.

**Guardrails:**

- no real-world side effects as early core progression;
- no automatic spending without strong policy and consent;
- in-game trust model must come first.

---

## 6. Readiness gates

### 6.1 Gate from V1.1 to V1.2

Do not start V1.2 until:

- V1.1 first-hour golden path passes;
- OpenClaw Lite Foreman origin proof passes;
- auto-collect scheduler works without duplicates;
- no-jargon UI baseline passes;
- player-understanding test confirms users know whether the Foreman works when the page is closed;
- human maintainer confirms P0 is complete.

### 6.2 Gate from V1.x to V2.0

Do not build persistent Foreman until:

- the manual home loop is fun enough;
- contracts create real demand;
- recap is read and understood;
- in-session Foreman is trusted;
- policy/permissions are not confusing;
- the team has decided which executor/offload substrate pieces to port.

### 6.3 Gate from V2 to V3

Do not build charters/specialists until:

- one persistent Foreman works;
- doctrine affects behavior predictably;
- exception inbox is useful rather than noisy;
- players understand authority boundaries;
- at least two viable operating styles exist in design fixtures.

### 6.4 Gate from V3 to V4

Do not build social sharing until:

- towns are distinctive enough to share;
- doctrines/blueprints/Foremen are inspectable;
- provenance and privacy rules exist;
- social comparison will not punish casual players;
- no destructive PvP is needed for engagement.

---

## 7. Branch and codebase donor guidance

### 7.1 Current Founders Plot implementation branch

Use `codex/founders-plot-phase1-isolated` as the current implementation reference for:

- Founders Plot manifest;
- server-authoritative simulation;
- `server/founders_plot/*` modules;
- `et.plot.*` tool surface;
- event log, recap, replay foundations;
- E2E patterns around first-loop progression.

### 7.2 OpenClaw Lite / browser worker substrate

Use current Portal/OpenClaw Lite assets for V1.1 in-session Foreman. Do not assume this already provides a game-aware scheduler; V1.1 must wire it explicitly.

### 7.3 Persistent Foreman donor branch

Use `codex/executor-abstraction-research-v0-1` as the primary donor for future V2 persistent/off-session work:

- runtime instances;
- backend-pool offload;
- workspace snapshots;
- lease truth;
- stale runtime handling;
- local-node registration concepts.

Do **not** bulk-merge the whole branch into Founders Plot. Port only the needed substrate and adapt it to one Foreman per plot.

### 7.4 Experience plugin donor

Use `poker-saloon-redesign` only for experience-registry/pluginization ideas. Its most relevant concept is manifest-discovered experiences and an `/api/experiences` registry.

### 7.5 Sandbox/artifact donor

Use `zhc1-sandbox-artifact-system` as an idea donor for:

- iterative human+agent loops;
- save/resume;
- artifact publication;
- learning systems.

Do not merge it into Founders Plot blindly.

### 7.6 Design docs

Use the design pack:

- `BRAND.md`
- `DESIGN.md`
- `GAME_UX.md`
- `REGISTRY.md`
- `components.json`

Every future frontend spec should include visual acceptance criteria and screenshot baselines.

---

## 8. Future spec backlog

Recommended next documents, in likely order:

1. `agent-town-founders-plot-v1.2-living-town-contracts-spec.md`  
   Expands demand, town stakeholders, contract deck, coin sinks, and town identity.

2. `agent-town-founders-plot-v1.3-foreman-routine-depth-spec.md`  
   Adds `KEEP_ONE_BUILDING_RUNNING`, correction memory, and richer in-session delegation.

3. `agent-town-persistent-foreman-v2.0-spec.md`  
   Adds backend-pool persistent Foreman vertical slice.

4. `agent-town-persistent-foreman-v2.0-tdd-spec.md`  
   Standalone TDD matrix for off-session execution, stale truth, pause, and recap attribution.

5. `agent-town-doctrine-trust-authority-v2.1-spec.md`  
   Adds full doctrine board, authority ladder, and exception inbox.

6. `agent-town-capability-web-and-charters-v3.0-spec.md`  
   Adds capability web and asymmetric town identity.

7. `agent-town-specialist-foremen-v3.0-spec.md`  
   Adds Builder Foreman, Quartermaster, Trade Clerk, and Event Steward.

8. `agent-town-public-plot-cards-and-social-sharing-v4.0-spec.md`  
   Adds visitor mode, plot cards, blueprint/doctrine/Foreman-template sharing.

9. `agent-town-experience-registry-and-town-hub-spec.md`  
   Connects Founders Plot to the wider town-shaped platform.

10. `agent-town-erc8004-identity-reputation-spec.md`  
    Defines identity/reputation integration when the game layer is ready.

11. `agent-town-economy-token-creator-flywheel-spec.md`  
    Defines sustainable token/creator economy without damaging the core game.

12. `agent-town-ugc-vibecoding-safe-publish-spec.md`  
    Defines AI-assisted creation pipeline and validation.

13. `agent-town-event-log-research-dataset-privacy-spec.md`  
    Defines event export, privacy tiers, and replay/archive interfaces.

14. `agent-town-moderation-safety-stack-spec.md`  
    Defines safety, quarantine, moderation, and transparency.

15. `agent-town-design-system-visual-regression-spec.md`  
    Converts design law into CI-enforced frontend consistency.

---

## 9. Standard structure for all future implementation specs

Every future spec should include:

1. **Product promise**  
   One sentence the player should feel.

2. **Non-goals**  
   Explicit list of tempting features that must not be implemented.

3. **Current code to reuse**  
   Branches, modules, files, and routes.

4. **Data model**  
   Tables/entities with required fields.

5. **Tool/API surface**  
   Names, request schemas, result schemas, error schemas, idempotency rules.

6. **UI/UX states**  
   Main screen regions, copy rules, disabled/error states, mobile behavior.

7. **Agent behavior contract**  
   What is deterministic, what uses LLM/worker, what happens on timeout/failure.

8. **Security and policy**  
   Auth, permissions, spoof rejection, spend caps, privacy, rate limits.

9. **Event/recap/audit requirements**  
   What must be logged, how it appears to the user, how replay verifies it.

10. **TDD acceptance matrix**  
    Unit, contract, integration, E2E, visual, and replay tests.

11. **Measurable metrics**  
    Include numeric thresholds where possible.

12. **Milestone roadmap**  
    Step-by-step order for agentic AI developers.

13. **Definition of Done**  
    One exact player scenario that must work.

14. **Future handoff**  
    What this spec intentionally leaves for the next one.

---

## 10. Anti-goals and traps

### 10.1 Product traps

- Do not call Founders Plot the main product.
- Do not sell the roadmap as a pile of speculative promises.
- Do not market persistent/off-session Foreman until it is true.
- Do not bury the current game under platform jargon.

### 10.2 Game design traps

- Do not add resources as a substitute for decisions.
- Do not add buildings that only increase numbers.
- Do not make contracts generic checklists without stakeholders.
- Do not turn doctrine into threshold babysitting.
- Do not add charters before the base loop is understood.

### 10.3 AI/agent traps

- Do not fake agent-originated actions by posting `actor: "AGENT"` from the client.
- Do not treat receipts as a replacement for predictable behavior.
- Do not let the Foreman act without policy and audit.
- Do not expose arbitrary schedules to normal players too early.
- Do not build specialist swarms before one Foreman is trustworthy.

### 10.4 UI/UX traps

- Do not expose provider/model/wallet/debug language in the game loop.
- Do not let every system compete for the primary CTA.
- Do not turn the town into a dashboard.
- Do not ignore mobile hierarchy.
- Do not ship frontend changes without screenshot baselines.

### 10.5 Platform traps

- Do not bulk-merge giant branches because they contain one useful subsystem.
- Do not duplicate offload infrastructure inside Founders Plot if executor substrate can be reused.
- Do not store private agent memories or chain-of-thought on the world server.
- Do not deploy unbounded AI-generated code.
- Do not make blockchain mandatory for first-session fun.

---

## 11. Machine-readable planning summary

```yaml
current_spec:
  name: "Agent Town: Founders Plot V1.1 Refined Specification"
  scope:
    - launch_gate_ux
    - first_hour_progression
    - supply_and_build_contracts
    - foreman_standing_order_v0
    - openclaw_lite_in_session_foreman
    - collect_ready_outputs_scheduler
    - receipts_recap_audit
    - resource_ledger_replay_hardening
  explicit_non_goals:
    - persistent_off_session_foreman
    - full_doctrine_board
    - generalized_scheduler
    - recovery_contracts
    - preparation_contracts
    - charters
    - specialist_foremen
    - social_sharing
    - tokenized_economy
    - ugc_vibecoding
    - era_progression

recommended_next_specs:
  v1_2:
    title: "Living Town Contracts and Town Identity"
    adds_decision_layer: "demand_and_attachment"
    candidate_topics:
      - recovery_contracts
      - preparation_contracts
      - persistent_requesters
      - institutions
      - town_signals
      - coin_sinks
      - aesthetic_pride
    blocked_by:
      - v1_1_p0_complete
      - hero_foreman_action_understood
  v1_3:
    title: "Foreman Routine Depth and Correction Memory"
    adds_decision_layer: "supervised_in_session_delegation"
    candidate_topics:
      - keep_one_building_running
      - correction_memory
      - plan_card_tradeoffs
      - deterministic_candidate_model
    blocked_by:
      - v1_1_foreman_origin_proof
      - scheduler_no_duplicates
  v2_0:
    title: "Persistent Foreman and Morning Brief"
    adds_decision_layer: "persistent_delegation"
    candidate_topics:
      - backend_pool_foreman
      - runtime_lease_truth
      - off_session_safe_routines
      - morning_brief
      - emergency_pause
      - durable_approvals
    donor_branch: "codex/executor-abstraction-research-v0-1"
    blocked_by:
      - home_loop_fun
      - in_session_foreman_trusted
      - recap_understood
  v2_1:
    title: "Doctrine Board, Authority Ladder, and Exception Inbox"
    adds_decision_layer: "governance_and_policy"
    candidate_topics:
      - doctrine_slots
      - authority_ladder
      - approval_thresholds
      - exception_inbox
      - doctrine_driven_recap
    blocked_by:
      - persistent_foreman_works
  v3_0:
    title: "Charters, Capability Web, and Specialist Foremen"
    adds_decision_layer: "operating_identity"
    candidate_topics:
      - founding_charters
      - capability_web
      - district_specialization
      - scenario_decks
      - specialist_foremen
    blocked_by:
      - doctrine_predictable
      - at_least_two_viable_operating_styles
  v4_0:
    title: "Visitor Mode, Plot Cards, and Operating Style Sharing"
    adds_decision_layer: "social_diffusion"
    candidate_topics:
      - public_plot_cards
      - visitor_mode
      - blueprint_sharing
      - doctrine_pack_sharing
      - foreman_template_sharing
      - seasonal_house_projects
    blocked_by:
      - towns_are_distinctive
      - provenance_and_privacy_defined

parallel_tracks:
  design_system:
    status: "continuous"
    docs:
      - BRAND.md
      - DESIGN.md
      - GAME_UX.md
      - REGISTRY.md
  experience_registry:
    donor_branch: "poker-saloon-redesign"
    earliest: "after_v1_1_or_parallel_if_low_risk"
  erc8004_identity:
    earliest: "platform_track_after_core_loop"
    gameplay_dependency: "not_before_v3_v4"
  economy_token:
    earliest: "after_retention_and_core_fun"
  ugc_vibecoding:
    earliest: "after_experience_registry_and_validation_pipeline"
  research_dataset:
    earliest: "after_event_schema_stabilizes"
  moderation:
    earliest: "before_public_social_or_ugc_scale"

hard_rules:
  - "Agent Town is product; Founders Plot is launch chapter."
  - "Agent-owned mind, world-owned reality."
  - "Typed tools are the only way to mutate world state."
  - "Do not expose technical stack jargon in game UI."
  - "Add one new decision layer per version."
  - "Do not use more resources/buildings as fake depth."
  - "Persistent automation must be honest and auditable."
  - "Blockchain must not block first-session fun."
```

---

## 12. Final instruction block for the next spec-writing LLM

When creating the next Agent Town spec, do this:

1. Start from the refined V1.1 state, not the older broad V1.1 spec.
2. Choose exactly one next decision layer.
3. State what is not included before writing systems.
4. Reuse existing code and donor branches selectively.
5. Keep the player fantasy in front of the infrastructure.
6. Include strict TDD metrics that agentic AI developers can measure.
7. Include visual/UI acceptance if the spec touches the frontend.
8. Keep the Foreman honest: distinguish browser-attached, backend-persistent, and fully delegated behavior.
9. Preserve the frontier founding tone until the governance loop earns expansion.
10. End every spec with a clear future handoff section.

