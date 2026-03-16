# 43. ZHC0 Founders Loop State Contract

Status: state/TDD bridge spec  
Last updated: 2026-03-16
Branch: `zhc0-founders-loop`

## 1. Purpose

This spec connects the new ZHC0 formal-state work to the repository’s existing spec-driven implementation style.

It exists so the founders loop is not just:

- a narrative idea,
- or a UI redesign,
- or a backend implementation accident.

It must be all three at once:

1. product-valid,
2. state-valid,
3. testable.

---

## 2. Connected source documents

This contract depends on:

- `docs/founders-loop-state-model.md`
- `machines/FoundersLoop.machine.ts`
- `design/specs/10_founders_loop_ui_state_projection.md`
- `docs/zhc0-implementation-checklist.md`

These together define the current ZHC0 source of truth for the founders loop.

---

## 3. Scope

This spec covers the first playable ZHC0 loop only:

1. Enter town
2. Meet / hatch agent
3. Name founders
4. Prove alignment
5. Create crest
6. Open HQ
7. Run first mission
8. Save first memory
9. Reveal next quest

This spec does **not** yet cover:

- many workers
- many companies
- region presets
- advanced office/staff flows
- long-tail Registry/Pony economy loops

---

## 4. Core implementation rule

Every major founders-loop UI or route change must trace back to:

1. a state variable,
2. a transition,
3. or an invariant.

If a change cannot be explained that way, it is probably under-specified.

---

## 5. Required contract sections for future phase work

Any future founders-loop implementation sub-spec should include:

### 5.1 State variables touched

Example:
- `brainState`
- `alignmentState`
- `houseState`

### 5.2 Transition(s) affected

Example:
- `configureBrain`
- `passAlignment`
- `activateHouse`

### 5.3 Invariants that must still hold

Example:
- House cannot become ready before crest creation
- next quest cannot become visible before first memory save

### 5.4 UI projection changes

Example:
- when a blocked state becomes recoverable, what CTA and copy change?

### 5.5 Evidence plan

Example:
- screenshots
- Playwright coverage
- negative assertions

---

## 6. Initial acceptance matrix

## 6.1 Enter town

Acceptance:
- `/start` has one obvious first action
- no HQ/mission completion UI appears before appropriate state

Minimum evidence:
- screenshot at mobile/tablet/desktop
- test proving late-loop CTAs are absent pre-auth

## 6.2 Meet / hatch agent

Acceptance:
- founders flow remains blocked until the first worker is ready
- setup errors remain recoverable

Minimum evidence:
- ready/loading/error screenshots
- test proving founders registration cannot advance from invalid brain state

## 6.3 Founders established

Acceptance:
- human and agent can both be registered in order
- alignment cannot pass early

Minimum evidence:
- screenshots for partial and completed Town Hall states
- test proving alignment preconditions

## 6.4 Alignment -> crest

Acceptance:
- crest creation requires alignment passed
- UI handoff is explicit

Minimum evidence:
- completion screenshot
- negative test for premature crest completion path

## 6.5 Crest -> HQ

Acceptance:
- House first-entry state requires crest creation + house readiness
- House reads as HQ in the first-entry path

Minimum evidence:
- first-entry HQ screenshots
- test proving mission CTA does not appear too early

## 6.6 First mission

Acceptance:
- mission can start only after HQ ready
- mission completion is a real success state, not fake copy

Minimum evidence:
- mission-active and mission-complete screenshots
- transition test(s)

## 6.7 First memory save

Acceptance:
- first memory save must depend on mission completion
- save flow is recoverable if it fails

Minimum evidence:
- save-success and save-error screenshots
- transition + recovery test(s)

## 6.8 Next quest reveal

Acceptance:
- next quest visible only after first memory saved
- UI points forward clearly

Minimum evidence:
- next-quest screenshot
- invariant test proving reveal is blocked before memory save

---

## 7. Recommended first executable test set

When implementation starts, first founders-loop test coverage should include at minimum:

1. cannot reach House-ready flow before crest completion
2. cannot reveal first mission CTA before House ready
3. cannot reveal next quest before first memory save
4. recoverable setup error keeps user in loop, not dead end
5. successful first loop ends in visible next quest

This should be implemented using the repo’s current deterministic test culture, not hand-wavy manual validation.

---

## 8. File ownership guidance

Likely first surfaces impacted by founders-loop implementation:

- `public/start.html`
- `public/start.js`
- `public/app.js`
- `public/views/townhall.html`
- `public/views/house.html`
- `public/styles.css`

Likely first docs impacted by future updates:

- `docs/founders-loop-state-model.md`
- `machines/FoundersLoop.machine.ts`
- `design/specs/10_founders_loop_ui_state_projection.md`
- `docs/zhc0-implementation-checklist.md`

---

## 9. Change control rule

If implementation reveals a contradiction between:

1. narrative intent,
2. formal machine,
3. UI projection,
4. or executable tests,

do not silently patch one layer only.

Update the chain.

That means reconciling:
- doc
- machine
- design projection
- test expectations

The whole point is to stop drift.

---

## 10. Recommendation

Use this spec as the bridge that makes ZHC0 feel native to the repository’s existing development culture.

The repo already knows how to think in:
- specs,
- guardrails,
- milestones,
- deterministic tests.

This contract just extends that discipline into:
- formal state
- and frontend projection.
