# ZHC Spec Stack — Product, Formal State, Design, and Tests

Status: working methodology doc  
Last updated: 2026-03-16
Branch: `zhc0-founders-loop`

## 1. Purpose

This document explains how to combine:

1. the existing Agent Town **spec-driven development style**,
2. **TLA+ / formal state-machine modeling**,
3. **frontend design work**,
4. and **executable tests**.

The goal is to make frontend work as disciplined as the backend/platform work already is.

---

## 2. The core problem

Portal already has strong:

- product specs,
- TDD specs,
- route contracts,
- deterministic Playwright coverage,
- implementation runbooks.

But the frontend/design layer has historically been weaker because:

1. visual and UX states were not modeled as rigorously,
2. the user journey was described in prose but not pinned as a state machine,
3. screen states were often implied by implementation rather than specified,
4. design phases focused on polish without a fully explicit state contract underneath.

That is the gap.

---

## 3. The combined model

The right answer is **not** to replace the current spec system.
The right answer is to add one missing layer.

## The full stack should be:

### Layer 1 — Product / narrative spec

Purpose:
- what the user is trying to do
- what the room/flow means
- what the intended emotional arc is

Current homes:
- `docs/`
- `specs/00_product_story.md`
- `docs/zhc0.md`
- `docs/zhc-future-vision.md`

### Layer 2 — Formal state spec

Purpose:
- what the real states are
- what transitions are allowed
- what cannot happen
- what invariants must always hold

Future home:
- `machines/` or `formal/`
- example: `machines/FoundersLoop.machine.ts`

### Layer 3 — Design/UI projection spec

Purpose:
- given a formal state, what exactly is shown to the user?
- what CTA is visible?
- what copy is used?
- what is hidden / disabled / blocked / loading?

Current/future homes:
- `design/`
- `design/specs/*`
- state projection tables inside relevant docs

### Layer 4 — Implementation spec / TDD

Purpose:
- exact route, module, and UI behavior
- file ownership
- milestone sequencing

Current home:
- `specs/*_tdd_spec.md`
- runbooks

### Layer 5 — Executable verification

Purpose:
- prove the implementation matches the contracts

Current home:
- `e2e/*`
- unit/integration tests
- live-lane checks where relevant

---

## 4. What TLA+ adds

TLA+ adds the missing discipline between:

- “what we want”
- and “what we implemented.”

It forces us to pin down:

1. state variables,
2. transitions,
3. guards,
4. invariants,
5. impossible states,
6. termination/dead-end risks.

This matters because frontend bugs are often really **design-state bugs**:

- the wrong CTA appears for the wrong state,
- the user can get stuck,
- steps can be skipped,
- success appears without true completion,
- error recovery is undefined,
- a “nice design” hides a contradictory workflow.

TLA+ catches this upstream.

---

## 5. The key principle for frontend work

Frontend should be treated as a **projection of product state**, not a freehand painting over backend behavior.

That means every important screen should be answerable as:

1. what formal state am I in?
2. what UI state does that project to?
3. what actions are allowed here?
4. what evidence of success/failure is shown?

This is how frontend becomes spec-driven too.

---

## 6. Three classes of state

This split is critical.

### Class A — Product/protocol state

These are the states that should be formalized.

Examples:
- user authenticated or not
- brain ready or not
- founders registered or not
- alignment passed or not
- House ready or not
- mission not started / active / completed / failed
- memory saved or not
- next quest visible or not

These belong in the formal machine.

### Class B — UI orchestration state

These are frontend interaction states that may also deserve explicit modeling.

Examples:
- modal open / closed
- current district active
- drawer expanded / collapsed
- loading / retrying / blocked / confirmation required
- selected tab or current step index

These do not all need full TLA+ treatment, but they **must** be specified.

A lighter state table may be enough.

### Class C — Pure visual style state

Examples:
- color palette
- shadows
- typography
- spacing
- illustration emphasis

These do **not** need TLA+.
They belong in the design system and visual acceptance rules.

---

## 7. How existing work connects

The good news: most of the system already exists.

### Existing strengths already in the repo

1. strong TDD specs
2. strong route and contract thinking
3. deterministic e2e culture
4. explicit guardrails
5. phased implementation docs

That means we are not starting over.
We are adding a missing **formal-state + UI-projection bridge**.

### Existing docs map naturally into the new stack

- `specs/11*`, `12*`, `14*`, `15*`, `19*`, `22*`, `24*`, `25*`
  - already describe system behavior and contracts
- `design/PRD.md`, `design/APP_FLOW.md`
  - already describe intended UX
- `e2e/*`
  - already prove a lot of implementation behavior

What is missing is:

- a formal machine for the key flows
- a UI projection table from machine state -> screen state

---

## 8. The artifact chain we should adopt

For each major feature/flow, create this chain:

### 8.1 Narrative spec

Example:
- `docs/founders-loop.md`

Contains:
- user goal
- emotional arc
- business rationale
- room meanings

### 8.2 Formal machine

Example:
- `machines/FoundersLoop.machine.ts`

Contains:
- variables
- actions
- invariants
- transition rules

### 8.3 UI state projection table

Example:
- `design/specs/10_founders_loop_ui_state_projection.md`

Current artifact:
- `design/specs/10_founders_loop_ui_state_projection.md`

Contains a table like:

| Formal state | Visible screen | Primary CTA | Hidden/disabled | Error/recovery |
| --- | --- | --- | --- | --- |
| unauthenticated | `/start` | Enter town | House CTA hidden | login error visible |
| founders_partial | Town Hall | Continue founding | mission hidden | inline correction |
| house_ready | House | Run first mission | founder setup hidden | recovery link visible |

This is the missing frontend rigor.

### 8.4 TDD / implementation spec

Example:
- `specs/founders-loop-tdd-spec.md`

Contains:
- exact files
- route behavior
- acceptance milestones

### 8.5 Executable tests

Example:
- Playwright tests that cover each high-value transition
- reserved founders-loop block `e2e/414` through `e2e/428`

---

## 9. How design states fit in

The important phrase from your question is **including all the design states**.

This should be handled with a two-step rule:

### Step 1 — derive meaningful design states from the formal machine

Not every visual variant matters.
Only meaningful states should be promoted.

Examples:
- `blocked`
- `loading`
- `ready`
- `in_progress`
- `needs_confirmation`
- `error_recoverable`
- `error_fatal`
- `completed`

These should be defined explicitly per flow.

### Step 2 — define the visual contract for each design state

For each meaningful design state, define:

1. what the user sees,
2. what the primary CTA is,
3. what copy is shown,
4. what is disabled,
5. what recovery path exists,
6. what screenshot evidence is required.

This is where design work stops being vague.

---

## 10. Example: Founders Loop

This is the best first demonstration.

### Formal states

Possible top-level states:

1. `Start`
2. `Authenticated`
3. `BrainReady`
4. `FoundersRegistered`
5. `Aligned`
6. `CrestCreated`
7. `HouseReady`
8. `MissionCompleted`
9. `MemorySaved`
10. `NextQuestVisible`

### Derived design states

Examples:

- `/start` loading
- `/start` ready
- Town Hall partial progress
- Town Hall recoverable error
- sigil waiting
- sigil matched
- create in progress
- House first-entry ready
- first mission active
- first memory save success
- next quest revealed

### What this buys us

Now the frontend cannot drift into:

- showing House too early,
- showing mission CTA too early,
- implying completion without saved memory,
- dead-ending the player after a recoverable error.

That is exactly the benefit.

---

## 11. Rule for future specs

Every future major feature spec should include four new sections:

### A. State variables
What truth the system tracks.

### B. Invariants
What must never be violated.

### C. UI projections
How each meaningful state appears to the user.

### D. Evidence matrix
Which tests/screenshots prove the state is handled correctly.

This should become normal practice, not a one-off.

---

## 12. Practical rollout plan

Do this in order.

### Phase 1
Formalize **Founders Loop** only.

Why:
- it is the core ZHC0 game
- it is where product/design/frontend/backend all meet

### Phase 2
Add UI state projection for Founders Loop.

### Phase 3
Bind Playwright coverage to those states.

### Phase 4
Extend the same method to:
- House readiness
- first mission
- first memory save

### Phase 5
Later extend it to:
- region presets
- multi-worker staffing
- multi-company operation

---

## 13. Recommendation

The clean synthesis is:

- keep the current spec-driven approach,
- add TLA+ for the important state machines,
- add UI projection specs for the meaningful design states,
- keep Playwright as the executable proof.

That gives you:

1. product clarity,
2. design clarity,
3. implementation discipline,
4. less drift between backend and frontend,
5. less chance of beautiful but contradictory UX.

That is how the existing work connects cleanly to future design work instead of splitting into two cultures.
re design work instead of splitting into two cultures.
