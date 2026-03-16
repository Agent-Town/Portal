# ZHC Formal Spec Strategy

Status: working formal-methods plan  
Last updated: 2026-03-16
Reference concept: `kingbootoshi/tla-precheck`

## 1. Short answer

Yes — we should use the **TLA+ / model-checking technique** for ZHC0.

But we should use it for the **product protocols and state transitions**, not for visual styling.

In plain English:

- **good fit**: onboarding flow correctness, mission-state correctness, approval gating, House readiness, memory progression
- **bad fit**: colors, typography, layout taste, visual mood

TLA+ is for proving that the important game/product rules cannot drift or contradict themselves.

---

## 2. Why this is useful for Agent Town

Agent Town is becoming a world/product with:

1. onboarding steps,
2. branching runtime states,
3. identity and House creation,
4. approvals and safety gates,
5. mission progression,
6. memory and persistence,
7. later multi-agent and multi-company behavior.

That is exactly the kind of system where hidden state bugs become brutal.

The danger is not just code bugs.
The danger is **design bugs** like:

- impossible or contradictory flows,
- steps that can be skipped when they should not,
- steps that dead-end,
- approvals that can be bypassed,
- memory progression that can happen in the wrong order,
- export/self-host flows that break identity continuity,
- later region-specific presets that make state combinations invalid.

TLA-style modeling is very good at catching this kind of failure early.

---

## 3. What exactly we should formalize

We should formalize **interaction/state contracts**.

### Good formalization targets

1. onboarding and founders loop state machine
2. Lite runtime / brain readiness state machine
3. House readiness and unlock state machine
4. first mission progression state machine
5. first-memory-save progression state machine
6. approval-gated actions and irreversible writes
7. later multi-worker / office assignment rules
8. later multi-company switching/ownership rules

### Bad formalization targets

1. the visual look of `/start`
2. whether a button feels premium enough
3. typography choices
4. aesthetic direction
5. broad creative tone

Rule:
- formalize the **logic of the experience**
- do not try to formalize taste

---

## 4. How to apply this to ZHC0

## 4.1 The three-layer method

Every major ZHC0 flow should have three layers:

### Layer A — Human-readable product/design doc

Example:
- `docs/zhc0.md`
- `docs/zhc0-implementation-checklist.md`

Purpose:
- explain what the player should feel
- explain the intended sequence in human language

### Layer B — Formal machine / invariant spec

Purpose:
- define allowed states
- define transitions
- define impossible states
- define invariants that must always hold

### Layer C — Implementation + test surface

Purpose:
- actual code
- Playwright + unit/integration tests
- UI and route behavior

The formal layer sits between story and code and keeps them honest.

---

## 4.2 First machine we should build

The first and best candidate is:

# `FoundersLoop.machine`

This should model the first playable ZHC0 loop:

1. enter town
2. meet/hatch agent
3. name founders
4. prove alignment
5. create crest
6. open HQ
7. run first mission
8. save first memory
9. unlock next quest

This is the most important machine because it defines whether ZHC0 is actually coherent.

---

## 5. Proposed first machine model

## 5.1 Candidate state variables

Possible variables to model:

- `sessionState`
  - `none | started | authenticated`
- `brainState`
  - `missing | draft | ready`
- `humanFounderState`
  - `missing | named | registered`
- `agentFounderState`
  - `missing | named | registered`
- `alignmentState`
  - `locked | sigil_matched | open_pressed | passed`
- `crestState`
  - `missing | in_progress | created`
- `houseState`
  - `missing | initializing | ready`
- `missionState`
  - `not_started | active | completed | failed`
- `memoryState`
  - `none | saved`
- `questState`
  - `hidden | visible`

This does not need to mirror implementation field names exactly at first.
It needs to capture the real product truth.

## 5.2 Candidate actions

Possible actions:

- `enterTown`
- `authenticate`
- `configureBrain`
- `nameHumanFounder`
- `registerHumanFounder`
- `nameAgentFounder`
- `registerAgentFounder`
- `matchSigil`
- `pressOpen`
- `createCrest`
- `initializeHouse`
- `startFirstMission`
- `completeFirstMission`
- `failFirstMission`
- `saveFirstMemory`
- `revealNextQuest`

## 5.3 Candidate invariants

Important invariants to prove:

1. `questState = visible` implies `memoryState = saved`
2. `memoryState = saved` implies `missionState = completed`
3. `missionState = active or completed` implies `houseState = ready`
4. `houseState = ready` implies `crestState = created`
5. `crestState = created` implies `alignmentState = passed`
6. `alignmentState = passed` implies both founders are registered
7. `agentFounderState = registered` implies `brainState = ready`
8. impossible state: `missionState = completed` while `sessionState != authenticated`
9. impossible state: `houseState = ready` while `humanFounderState = missing`
10. impossible state: next quest visible before the first mission produces any durable artifact

These are exactly the kinds of mistakes that UI mockups and plain English specs miss.

---

## 6. Second-wave machines after the founders loop

After the first machine, good next candidates are:

## 6.1 `HouseReadiness.machine`

Purpose:
- formalize when a House is truly ready for operation

Potential invariants:
- no mission start without readiness
- no irreversible write without correct auth state
- no unlocked House view without required materials/identity continuity

## 6.2 `FirstMission.machine`

Purpose:
- model the first canonical mission lane

Potential invariants:
- mission cannot complete without evidence/output
- approval-gated actions cannot become “completed” silently
- mission cannot be both failed and completed
- memory save should reference real mission output

## 6.3 `LibraryPromotion.machine`

Purpose:
- formalize how “save this to company memory” works

Potential invariants:
- first saved memory must come from a legitimate source
- scope/shelf state should remain consistent
- publish/share paths must respect safety or approval rules

## 6.4 `RegionPreset.machine` (later)

Purpose:
- formalize region-specific onboarding packs

Potential invariants:
- China preset and international preset should not create broken or partial startup states
- a user always has one valid route forward
- provider choice remains optional/secondary unless required

---

## 7. How this helps design, specifically

This technique is useful for design because it forces us to answer:

1. what the real states are,
2. what transitions are allowed,
3. what must never happen,
4. what completion actually means,
5. where we need user feedback,
6. where dead ends or contradictions exist.

That makes the design specs better because the narrative can no longer hand-wave the hard parts.

Example:
- if we say “save first memory” is part of the loop,
- the machine makes us define:
  - from what source,
  - after what preconditions,
  - with what visible confirmation,
  - and what it unlocks.

That is design clarity, not just engineering caution.

---

## 8. What not to do

Do not formalize everything at once.

Bad idea:
- model the whole of Agent Town before ZHC0 is playable

Good idea:
- model the first critical loop,
- prove it coherent,
- implement it,
- then formalize the next hard subsystem.

Also:
- do not let the formal layer become detached from the player-facing docs
- do not let the formal layer drift from implementation
- do not pretend a machine spec replaces UX judgment

---

## 9. Practical repo plan

Recommended structure if we adopt this seriously:

- `docs/`
  - human-readable narrative and product docs
- `formal/` or `machines/`
  - machine specs / generated artifacts
- `specs/`
  - engineering/test contracts

Current first additions:

1. `machines/FoundersLoop.machine.ts`
2. `machines/FoundersLoop.tla`
3. `machines/FoundersLoop.cfg`
4. `docs/founders-loop-state-model.md`
5. `design/specs/10_founders_loop_ui_state_projection.md`
6. `design/specs/11_zhc0_ui_evidence_contract.md`
7. `specs/43_zhc0_founders_loop_state_contract.md`
8. `specs/44_zhc0_founders_loop_delivery_roadmap.md`

If we use `tla-precheck` directly, the first machine should remain deliberately small and focused.

---

## 10. Recommendation

Yes — we should use the TLA+ technique here.

My recommendation is:

1. keep the human-readable design docs,
2. add a formal state machine for the founders loop,
3. prove the invariants before we spread the flow across more UI,
4. let that machine guide the ZHC0 implementation.

This is one of the few places where formal methods would actually pay off early instead of becoming academic theater.
