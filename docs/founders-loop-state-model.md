# Founders Loop State Model

Status: human-readable source of truth for the ZHC0 founders loop  
Last updated: 2026-03-16
Branch: `zhc0-founders-loop`

This document defines the **product state model** for the first playable zero-human-company loop.

It sits between:

1. the narrative/product docs,
2. the formal machine,
3. the UI projection spec,
4. and the implementation/test contracts.

## 1. Purpose

The founders loop is the smallest complete ZHC0 experience that should already feel like:

> a person and their agent found a company together, complete one real mission, save one useful memory, and unlock the next step.

This doc exists to remove ambiguity about what that really means in state terms.

---

## 2. Canonical loop

The canonical first loop is:

1. Enter town
2. Meet / hatch agent
3. Name founders
4. Prove alignment
5. Create crest
6. Open HQ
7. Run first mission
8. Save first memory
9. Reveal next quest

The loop is not complete until **step 9**.

---

## 3. State variables

These are the product/protocol states that matter most.

### 3.1 Session state

- `none`
- `started`
- `authenticated`

Meaning:
- whether the player has entered the product and completed the minimum auth/session requirement

### 3.2 Brain state

- `missing`
- `draft`
- `ready`

Meaning:
- whether the first worker/agent has enough configuration to participate in the loop

### 3.3 Human founder state

- `missing`
- `named`
- `registered`

Meaning:
- whether the human side of the founding pair exists as a product identity

### 3.4 Agent founder state

- `missing`
- `named`
- `registered`

Meaning:
- whether the agent side of the founding pair exists as a product identity

### 3.5 Alignment state

- `locked`
- `sigil_matched`
- `open_pressed`
- `passed`

Meaning:
- whether the co-op alignment ritual has truly completed

### 3.6 Crest state

- `missing`
- `in_progress`
- `created`

Meaning:
- whether the shared founding crest / seal material has been created through `/create`

### 3.7 House state

- `missing`
- `initializing`
- `ready`

Meaning:
- whether the pair’s HQ exists and is ready for the next phase

### 3.8 First mission state

- `not_started`
- `active`
- `completed`
- `failed`

Meaning:
- the status of the first canonical mission lane

### 3.9 First memory state

- `none`
- `saved`

Meaning:
- whether the pair has saved the first durable company memory/artifact

### 3.10 Next quest state

- `hidden`
- `visible`

Meaning:
- whether the next recommended action has been unlocked and shown to the user

---

## 4. Derived top-level phases

These are the human-meaningful top-level phases projected from the state variables.

### Phase A — Arrival

Required truth:
- `sessionState = none | started`

Player meaning:
- the player is entering Agent Town

### Phase B — First worker online

Required truth:
- `sessionState = authenticated`
- `brainState = ready`

Player meaning:
- the first worker/agent can participate

### Phase C — Founders established

Required truth:
- `humanFounderState = registered`
- `agentFounderState = registered`

Player meaning:
- the founding pair exists

### Phase D — Alignment passed

Required truth:
- `alignmentState = passed`

Player meaning:
- the pair proved they can operate together

### Phase E — Crest created

Required truth:
- `crestState = created`

Player meaning:
- the company has its first symbol/material

### Phase F — HQ ready

Required truth:
- `houseState = ready`

Player meaning:
- the pair can operate from a real headquarters

### Phase G — First mission complete

Required truth:
- `missionState = completed`

Player meaning:
- the pair accomplished one real task together

### Phase H — First memory saved

Required truth:
- `memoryState = saved`

Player meaning:
- what they learned now lives in company memory

### Phase I — Next quest revealed

Required truth:
- `nextQuestState = visible`

Player meaning:
- the game/product clearly points forward

---

## 5. Allowed transitions

These are the high-level transitions the formal machine should allow.

1. `enterTown`
   - `sessionState: none -> started`
2. `authenticate`
   - `sessionState: started -> authenticated`
3. `configureBrain`
   - `brainState: missing|draft -> ready`
4. `nameHumanFounder`
   - `humanFounderState: missing -> named`
5. `registerHumanFounder`
   - `humanFounderState: named -> registered`
6. `nameAgentFounder`
   - `agentFounderState: missing -> named`
7. `registerAgentFounder`
   - `agentFounderState: named -> registered`
8. `matchSigil`
   - `alignmentState: locked -> sigil_matched`
9. `pressOpen`
   - `alignmentState: sigil_matched -> open_pressed`
10. `passAlignment`
   - `alignmentState: open_pressed -> passed`
11. `beginCrest`
   - `crestState: missing -> in_progress`
12. `completeCrest`
   - `crestState: in_progress -> created`
13. `initializeHouse`
   - `houseState: missing -> initializing`
14. `activateHouse`
   - `houseState: initializing -> ready`
15. `startFirstMission`
   - `missionState: not_started -> active`
16. `completeFirstMission`
   - `missionState: active -> completed`
17. `failFirstMission`
   - `missionState: active -> failed`
18. `saveFirstMemory`
   - `memoryState: none -> saved`
19. `revealNextQuest`
   - `nextQuestState: hidden -> visible`

---

## 6. Critical invariants

These are the truths we should formalize first.

1. `nextQuestState = visible` implies `memoryState = saved`
2. `memoryState = saved` implies `missionState = completed`
3. `missionState = active or completed or failed` implies `houseState = ready`
4. `houseState = ready` implies `crestState = created`
5. `crestState = created` implies `alignmentState = passed`
6. `alignmentState = passed` implies both founders are registered
7. `agentFounderState = registered` implies `brainState = ready`
8. `missionState = completed` implies `sessionState = authenticated`
9. `houseState = ready` implies `sessionState = authenticated`
10. `missionState = completed` and `memoryState = none` is an incomplete loop, not success

These invariants exist to stop product/design drift.

---

## 7. Design-state overlays

The formal machine above captures product truth.
The UI still needs explicit **overlay states** to remain rigorous.

Each major phase may also be in one of these projection states:

- `loading`
- `ready`
- `blocked`
- `needs_confirmation`
- `recoverable_error`
- `fatal_error`
- `success_feedback`

These are not all top-level protocol states, but they are critical design states.

Rule:
- every meaningful overlay must have explicit UI treatment
- none should be left as “whatever the implementation currently does”

---

## 8. Failure and recovery rules

### 8.1 Brain setup failure

If brain setup fails:
- the player must remain in a recoverable state
- founders/HQ progression must stay blocked
- the UI must make the next recovery action obvious

### 8.2 Founding interruption

If Town Hall is only partially complete:
- partial progress should be resumable
- the user must not be silently kicked into a later phase

### 8.3 Alignment failure

If alignment is not passed:
- crest creation must remain unavailable
- HQ must remain unavailable

### 8.4 Mission failure

If the first mission fails:
- the loop may remain incomplete
- the user should see retry or alternate recovery path
- next quest must not be revealed as if success occurred

### 8.5 Memory save failure

If the memory save fails:
- mission completion may still remain true
- but loop completion remains false
- the player should be guided to retry the save or recover gracefully

---

## 9. Completion definition

The ZHC0 founders loop is complete only when:

1. the pair is authenticated,
2. the brain is ready,
3. both founders are registered,
4. alignment is passed,
5. crest is created,
6. House is ready,
7. first mission is completed,
8. first memory is saved,
9. next quest is visible.

Anything short of that is partial progress.

---

## 10. Connected artifacts

This state model should remain aligned with:

- `machines/FoundersLoop.machine.ts`
- `design/specs/10_founders_loop_ui_state_projection.md`
- `specs/43_zhc0_founders_loop_state_contract.md`

If any of those disagree, this document should be treated as stale until reconciled.

---

## 11. Scope rule

This model is intentionally about **the first playable loop only**.

It does not yet formalize:

- many workers
- many companies
- region-specific presets
- complex office/staff management
- advanced Registry/Pony economic loops

Those should come later as separate machines or extensions once ZHC0 is real.
