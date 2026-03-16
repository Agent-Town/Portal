# Founders Loop UI State Projection

Status: design-state projection contract  
Last updated: 2026-03-16
Branch: `zhc0-founders-loop`

This document defines how the **formal founders loop states** project into user-visible UI states.

It is the missing bridge between:

1. product/narrative intent,
2. formal state,
3. and frontend design behavior.

## 1. Source-of-truth chain

This spec must stay aligned with:

- `docs/founders-loop-state-model.md`
- `machines/FoundersLoop.machine.ts`
- `specs/43_zhc0_founders_loop_state_contract.md`

If those disagree, this doc is stale.

---

## 2. Projection rule

Every meaningful product state must answer these questions:

1. what screen or room is visible?
2. what is the primary CTA?
3. what is hidden or disabled?
4. what feedback is visible?
5. what recovery path exists?
6. what screenshot/test evidence proves this state works?

That is the contract.

---

## 3. Primary phase projection table

| Formal phase | Main surface | Primary CTA | Must be hidden/secondary | Success meaning |
| --- | --- | --- | --- | --- |
| `arrival` | `/start` | `Enter town` | House, mission, deep Library surfaces | player has begun |
| `first_worker_online` | `/start` or guided setup state | `Bring your first worker online` / continue | late-loop CTAs | agent can participate |
| `founders_established` | Town Hall | `Continue to alignment` | HQ/mission CTAs | founding pair exists |
| `alignment_passed` | sigil/open completion handoff | `Create crest` | House/mission CTAs until crest exists | co-op gate passed |
| `crest_created` | `/create` success handoff | `Open headquarters` | mission CTA | founding artifact exists |
| `hq_ready` | House first-entry shell | `Run first mission` | deep admin complexity | HQ is real |
| `first_mission_completed` | mission completion state in House | `Save to company memory` | next-quest CTA until save succeeds | real task done |
| `first_memory_saved` | Library success / House progression state | `See next quest` | unrelated advanced surfaces | durable memory exists |
| `next_quest_visible` | Tracks / quest board / guided next-step surface | `Start next quest` | old setup CTAs | the loop points forward |

---

## 4. Required screen behaviors by phase

## 4.1 Arrival

### Surface
- `/start`

### Required visual behavior
- one strong thesis
- one obvious first action
- no dashboard density
- no provider taxonomy dumped up front

### Primary CTA
- `Enter town`

### Secondary support
- lightweight explanation of what the player is doing

### Hidden or de-emphasized
- House
- Registry/Pony/Poker complexity
- debug-heavy sidebar framing

### Evidence needed
- mobile/tablet/desktop screenshots
- test showing start screen before auth and no late-loop CTA visible

---

## 4.2 First worker online

### Surface
- guided start/setup flow

### Required visual behavior
- agent/brain setup feels like bringing the first worker online
- technical details stay secondary
- recoverable setup errors remain understandable

### Primary CTA
- `Continue` / `Bring your first worker online`

### Hidden or de-emphasized
- advanced provider complexity unless expanded
- mission/House completion framing

### Evidence needed
- screenshots for ready/loading/error states
- test proving founders flow remains blocked until brain ready

---

## 4.3 Founders established

### Surface
- Town Hall

### Required visual behavior
- human and agent feel like cofounders/founding pair
- sequential, guided, ceremonial
- no back-office admin tone

### Primary CTA
- `Continue to alignment`

### Hidden or de-emphasized
- House actions
- mission actions
- deep technical setup controls

### Evidence needed
- screenshots for partial progress, valid completion, and inline recoverable error
- test proving alignment cannot pass before founders are registered

---

## 4.4 Alignment passed

### Surface
- sigil/open completion handoff

### Required visual behavior
- the player understands a co-op gate was passed
- completion feels satisfying but brief
- the next step is obvious

### Primary CTA
- `Create crest`

### Hidden or de-emphasized
- House-ready messaging
- mission messaging

### Evidence needed
- screenshot of matched/passed state
- test proving crest cannot be treated as complete before alignment passes

---

## 4.5 Crest created

### Surface
- `/create` success handoff

### Required visual behavior
- crest is framed as a meaningful founding artifact
- transition to HQ feels earned

### Primary CTA
- `Open headquarters`

### Hidden or de-emphasized
- next quest
- first mission CTA before House readiness

### Evidence needed
- screenshot of successful create state
- test proving House-ready UI does not appear before crest creation

---

## 4.6 HQ ready

### Surface
- House first-entry shell

### Required visual behavior
- House clearly reads as HQ
- the player sees the first relevant rooms/functions
- complexity is suppressed to the minimum needed

### Primary CTA
- `Run first mission`

### Hidden or de-emphasized
- deep Library admin surfaces
- advanced Trainer/debug clutter
- unrelated future systems

### Evidence needed
- first-entry House screenshots at mobile/tablet/desktop
- test proving first mission CTA appears only after House readiness

---

## 4.7 First mission completed

### Surface
- mission completion state inside House

### Required visual behavior
- the player sees that a real task was completed
- the next action is clearly to save useful output
- completion is not treated as end of loop yet

### Primary CTA
- `Save to company memory`

### Hidden or de-emphasized
- next quest CTA until memory save succeeds

### Evidence needed
- screenshot of mission completion state
- test proving next quest is not visible yet

---

## 4.8 First memory saved

### Surface
- Library success / House progression state

### Required visual behavior
- saving feels meaningful, not clerical
- the player understands this created company memory

### Primary CTA
- `See next quest`

### Hidden or de-emphasized
- giant Library admin workload
- unrelated publication/review complexity in the first-run path

### Evidence needed
- screenshot of saved-memory success state
- test proving saved memory unlocks next-quest visibility

---

## 4.9 Next quest visible

### Surface
- Tracks / quest board / guided next-step panel

### Required visual behavior
- the loop points forward cleanly
- the user sees momentum, not dashboard sprawl

### Primary CTA
- `Start next quest`

### Hidden or de-emphasized
- restart/founding setup language
- old setup CTAs

### Evidence needed
- screenshot of next-quest reveal state
- test proving this state appears only after durable memory save

---

## 5. Overlay state matrix

These states apply across multiple phases and must be handled consistently.

| Overlay state | Required UI treatment | CTA rule | Evidence rule |
| --- | --- | --- | --- |
| `loading` | stable layout, not blank collapse | primary CTA disabled or replaced with progress indicator | screenshot + deterministic loading assertion |
| `blocked` | explain what prerequisite is missing in plain language | show the missing step, not a dead button | test proves blocked state until prerequisite satisfied |
| `needs_confirmation` | explicit confirmation surface, not silent side effect | destructive/irreversible action gated | screenshot + confirm-path test |
| `recoverable_error` | inline or modal error with retry path | retry or back path visible | test proves recovery path |
| `fatal_error` | stable failure state with escape hatch | no fake continue CTA | screenshot + error-path assertion |
| `success_feedback` | short, clear completion acknowledgement | next action obvious | screenshot + success transition assertion |

---

## 6. Design states that must be explicitly covered

For each major phase, design work must define how the screen behaves in:

1. initial load
2. ready state
3. blocked state
4. partial progress state
5. recoverable error state
6. success handoff state

If one of those is omitted, the phase is under-specified.

---

## 7. Initial file-surface focus for implementation

The first likely files impacted by this projection spec are:

- `public/start.html`
- `public/start.js`
- `public/app.js`
- `public/views/townhall.html`
- `public/views/house.html`
- `public/styles.css`

That list may expand, but these are the first critical surfaces.

---

## 8. Acceptance rule

No founders-loop UI phase should be treated as complete until it has:

1. explicit mapping from formal state -> visible UI state,
2. a primary CTA,
3. defined hidden/disabled states,
4. error/recovery behavior,
5. mobile/tablet/desktop screenshot evidence,
6. executable tests covering the critical transition.

This is the minimum discipline required to make frontend as spec-driven as the backend.
