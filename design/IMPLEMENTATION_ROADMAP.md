# Portal Design Implementation Roadmap

This roadmap translates the current design audit into an execution order that future agentic AI contributors can follow without re-prioritizing the work every session.

It is intentionally strict: design polish should not start before structural clarity is fixed.

## 1. Objective

Implement every finding from [DESIGN_AUDIT_BASELINE.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_AUDIT_BASELINE.md) in an order that:

- preserves product behavior
- preserves the town-hub shell
- preserves modal-first worker continuity
- improves end-user comprehension first
- keeps the human first layer dead simple while preserving rich detail for assistant interpretation and advanced review
- keeps all work measurable and Playwright-verifiable
- preserves low-technical-user clarity across international and Chinese use cases
- keeps future voice interaction viable

## 2. Delivery Strategy

There are five implementation tracks:

1. design-system consolidation
2. audience and globalization readiness
3. hierarchy and responsive clarity
4. cross-surface consistency
5. polish and accessibility hardening
6. no-drift verification discipline

The tracks are not independent. Later tracks depend on earlier tracks being finished first.

## 3. Phase Order

### Phase D0 — Design foundation lock

Source docs:

- [DESIGN_SYSTEM.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_SYSTEM.md)
- [FRONTEND_GUIDELINES.md](/Users/robin/.codex/worktrees/afe5/Portal/design/FRONTEND_GUIDELINES.md)
- [TDD_SPEC.md](/Users/robin/.codex/worktrees/afe5/Portal/design/TDD_SPEC.md)

Purpose:

- establish one design source of truth
- define token families and visual constraints before touching screens
- establish the no-drift rule between docs, tests, captures, and shipped UI

Main outputs:

- approved token family plan
- approved type hierarchy plan
- approved panel/button/badge system
- approved international, Chinese, and voice-ready design rules
- approved LLM-first detail staging rules
- approved design-precheck / no-drift workflow

Do not start screen polish before this phase is approved.

### Phase D0.5 — Audience and globalization lock

Purpose:

- ensure the whole design program is built for standard users, international users, Chinese users, and future voice use

Main surfaces:

- cross-cutting design docs first
- then any shell surface using prominent copy or typography

Main findings covered:

- low-technical-user clarity
- translation-safe layout assumptions
- CJK-safe typography direction
- provider-neutral top-layer copy
- future voice readiness
- assistant-first detail staging rules for human simplicity

### Phase D1 — Town shell clarity

Purpose:

- fix the first impression
- make the hub legible on mobile, tablet, and desktop

Main surfaces:

- [public/index.html](/Users/robin/.codex/worktrees/afe5/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- [public/app.js](/Users/robin/.codex/worktrees/afe5/Portal/public/app.js)

Main findings covered:

- town hub hierarchy
- mobile town hub crowding
- debug-vs-product competition at shell level

### Phase D2 — House and House Office clarity

Purpose:

- turn House into a guided human surface
- make House Office understandable without platform fluency
- ensure rich detail supports the assistant and advanced users without overwhelming the default human layer

Main surfaces:

- [public/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/house.html)
- [public/views/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/views/house.html)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- [public/app.js](/Users/robin/.codex/worktrees/afe5/Portal/public/app.js)

Main findings covered:

- house page hierarchy
- House Console readability
- House Office readability
- helper/session language staging

### Phase D3 — Surface consistency

Purpose:

- unify the cross-app component system after the most important flows are fixed

Main surfaces:

- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- [public/leaderboard.html](/Users/robin/.codex/worktrees/afe5/Portal/public/leaderboard.html)
- [public/registry.html](/Users/robin/.codex/worktrees/afe5/Portal/public/registry.html)
- [public/poker.html](/Users/robin/.codex/worktrees/afe5/Portal/public/poker.html)

Main findings covered:

- typography refinement
- button and pill emphasis
- surface inconsistency
- leaderboard measure
- registry layering
- poker empty state

### Phase D4 — Premium polish

Purpose:

- unify motion
- normalize empty/loading/error states
- close accessibility and responsive gaps

Main findings covered:

- motion language
- empty states
- loading states
- error states
- accessibility
- theming drift cleanup

## 4. Dependency Rules

### 4.1 Hard dependencies

- D0.5 depends on D0
- D1 depends on D0 and D0.5
- D2 depends on D0 and D0.5 and should not finish before D1, because House sits inside the same shell language
- D3 depends on D0 and D0.5 and should mostly follow D1 and D2
- D4 depends on the previous phases because polish without structural consistency will drift

### 4.2 Do not parallelize these pairs

- typography overhaul and surface consistency
- empty-state system and poker empty-state implementation
- debug panel styling and town-shell hierarchy

These pairs share too many visual assumptions.

## 5. Acceptance Gates Per Phase

### D0 gate

- design docs are the recognized source of truth
- token plan is explicit
- no-drift workflow is explicit
- no implementation yet

### D0.5 gate

- low-technical-user communication rules are explicit
- international and Chinese design constraints are explicit
- future voice readiness rules are explicit

### D1 gate

- town shell has one dominant action
- landing clutter remains within loss-harness budget
- mobile dock no longer crowds the shell

### D2 gate

- House first viewport is clearly ordered by importance
- House Office top layer is human-readable
- technical detail is visually secondary
- rich detail remains available but does not dominate the first visible human layer

### D3 gate

- shared container grammar exists
- Registry, Poker, and Leaderboard feel like one product family
- typography and emphasis are more disciplined than baseline

### D4 gate

- empty/loading/error states use one grammar
- minimum accessibility metrics are met
- responsive behavior is intentionally designed at `390`, `768`, and `1440`

## 6. Review Expectations

After every phase:

1. capture before/after screenshots for the changed surfaces
2. run the phase-specific design tests
3. run `npm test`
4. update:
   - [progress.txt](/Users/robin/.codex/worktrees/afe5/Portal/design/progress.txt)
   - [LESSONS.md](/Users/robin/.codex/worktrees/afe5/Portal/design/LESSONS.md)
5. check that docs, captures, tests, and shipped UI still describe the same surface

If a future agent makes the UI “cleaner” by either deleting useful detail entirely or surfacing all of it in the first viewport, that work is out of bounds. The correct outcome is staged detail: simple first, deep second.

## 7. Practical Next Step

The next approved working phase should be:

- D1 if the goal is visible user impact first
- D0 only if token and component-system approval is still unresolved
- D0.5 if audience and globalization requirements are not yet approved for implementation

If a future agent starts with D3 or D4 first, it is working out of order.
