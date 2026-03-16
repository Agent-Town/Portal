# Frontend Design Delivery Backlog

Status: Active phased implementation

This document converts the earlier design audit into an implementation backlog for future frontend agents.

Current progress on branch `codex/frontend-design-system-v0-1`:

- completed: `FD0` through `FD10`
- next unlocked packet: `FD11`
- latest full-suite proof: `397 passed, 5 skipped`

It answers:

- what should be worked on next
- in what order
- on which files
- with what acceptance criteria
- with what dependencies

## 1. Delivery Strategy

The design work should not be executed as one big redesign. It should be delivered in a controlled sequence:

1. establish the shared token and component base
2. fix the highest-friction hierarchy problems
3. unify the remaining major surfaces
4. keep default UI summary-first while preserving dense detail for assistant-guided exploration
5. harden for international, Chinese, and non-technical comprehension
6. polish motion, states, and accessibility
7. prove coherence across the product

This order matters because the current design problems are mostly architectural, not cosmetic.

## 2. Backlog Structure

The backlog is organized as a numbered delivery sequence:

- `FD0`: design-system foundation
- `FD1`: start screen focal hierarchy
- `FD2`: town hub and district modal hierarchy
- `FD3`: agent dock quieting
- `FD4`: house console summary layer
- `FD5`: house office information architecture
- `FD6`: leaderboard empty-state redesign
- `FD7`: registry system alignment
- `FD8`: create surface alignment
- `FD9`: trainer / brain / advanced surface cleanup
- `FD10`: states and motion library
- `FD11`: international, Chinese, and voice-ready validation
- `FD12`: final responsive and accessibility pass
- `FD13`: final visual smoke

## 3. Workstreams

### FD0. Design-System Foundation

Goal:

- Create the minimum shared design system needed to prevent more one-off styling

Primary files:

- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)
- [design/01_design_context_and_system_baseline.md](/Users/robin/.codex/worktrees/3e47/Portal/design/01_design_context_and_system_baseline.md)

Tasks:

- formalize semantic surface tokens
- formalize typography roles
- formalize Chinese/CJK-safe font fallback roles
- formalize spacing, radius, stroke, and elevation tokens
- define button hierarchy tokens
- define summary-card and section-header component rules
- define plain-language, non-jargon first-view rules
- define summary-first versus advanced-detail exposure rules for assistant-guided product use

Dependencies:

- none

Acceptance metrics:

- all new design values map to shared tokens
- no new inline style values are introduced
- one documented token system exists for future phases
- typography tokens explicitly support international and Chinese rendering

### FD1. Start Screen Focal Hierarchy

Goal:

- Make the first screen feel calm, focused, and premium

Primary files:

- [public/start.html](/Users/robin/.codex/worktrees/3e47/Portal/public/start.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Tasks:

- reduce visual dominance of the embedded video
- strengthen the Enter CTA as the single focal point
- remove or relocate the warning banner from the primary composition
- refine spacing and rhythm within the start card

Dependencies:

- `FD0`

Acceptance metrics:

- primary CTA visible at `390x844` without scroll
- no competing primary action in the first viewport
- start screen reads as one centered composition
- first viewport remains understandable without AI/provider jargon

### FD2. Town Hub And District Modal Hierarchy

Goal:

- Reduce visual competition in the main shell

Primary files:

- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Tasks:

- quiet the modal frame
- reduce panel-within-panel stacking
- shorten the visual header weight
- establish one dominant content zone in the district modal

Dependencies:

- `FD0`

Acceptance metrics:

- one obvious focal region on modal open
- reduced first-viewport chrome versus baseline
- no new inline styling in town modal sections

### FD3. Agent Dock Quieting

Goal:

- Make Agent Comms feel supportive, not competitive

Primary files:

- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Tasks:

- soften minimized dock
- simplify header/control emphasis
- normalize control language
- improve expanded-state hierarchy between chat and debug panes

Dependencies:

- `FD0`
- should be reviewed alongside `FD2` because the dock overlaps the shell experience

Acceptance metrics:

- minimized dock is visually secondary to the active screen
- dock controls feel coherent and quiet
- no overflow or clipped controls at `390x844`

### FD4. House Console Summary Layer

Goal:

- Rebuild the top of House Console around clarity

Primary files:

- [public/views/house.html](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Tasks:

- replace verbose summary stack with one summary region
- establish one primary action row
- demote readiness and checklist detail visually
- turn district buttons into quieter secondary navigation

Dependencies:

- `FD0`
- should be implemented after `FD2` so shell hierarchy and house hierarchy align

Acceptance metrics:

- first viewport shows one summary block and one primary action group
- readiness data remains accessible but visually subordinate
- no inline layout styling remains in the House Console header region

### FD5. House Office Information Architecture

Goal:

- Turn House Office into a readable workspace, not a stack of system sections

Primary files:

- [public/views/house.html](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Tasks:

- create shared section-header pattern
- restructure overview versus deep-detail order
- reduce repeated label noise
- standardize overview cards, lists, and map styling
- remove inline spacing/layout styles across House Office markup

Dependencies:

- `FD0`
- `FD4`

Acceptance metrics:

- overview appears before detailed operational sections
- sections are grouped consistently but do not all shout equally
- inline layout styling removed from the House Office section

### FD6. Leaderboard Empty-State Redesign

Goal:

- Make the empty leaderboard feel complete and intentional

Primary files:

- [public/leaderboard.html](/Users/robin/.codex/worktrees/3e47/Portal/public/leaderboard.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Tasks:

- center the empty-state composition
- demote support metrics
- improve page balance at all viewports

Dependencies:

- `FD0`

Acceptance metrics:

- empty state has one obvious message and next step
- page has a visual center of gravity on mobile, tablet, and desktop

### FD7. Registry System Alignment

Goal:

- Bring Registry under the shared visual system

Primary files:

- [public/registry.html](/Users/robin/.codex/worktrees/3e47/Portal/public/registry.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Tasks:

- remove page-local visual styling
- migrate search, card, and action treatment to shared patterns
- reduce debug-like visual weight of projection blocks

Dependencies:

- `FD0`

Acceptance metrics:

- Registry no longer reads as a separate product
- local style system removed or reduced to structure-only rules
- search remains clear on mobile

### FD8. Create Surface Alignment

Goal:

- Bring the create path up to the quality bar of the improved system

Primary files:

- [public/create.html](/Users/robin/.codex/worktrees/3e47/Portal/public/create.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Tasks:

- simplify topbar visual weight
- normalize panel structure
- remove remaining inline layout styling

Dependencies:

- `FD0`

Acceptance metrics:

- create path feels visually consistent with improved shell surfaces
- no inline layout styling remains in targeted create markup

### FD9. Trainer / Brain / Advanced Surface Cleanup

Goal:

- Make advanced surfaces disciplined without reducing power

Primary files:

- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Tasks:

- unify tabs, panels, and advanced settings treatment
- remove ad hoc inline layout styling
- improve hierarchy within trainer and brain panels
- keep dense provider/runtime detail behind calmer secondary disclosure

Dependencies:

- `FD0`
- should follow major shell improvements so the shared system is already defined

Acceptance metrics:

- advanced sections remain functional but feel part of the same product
- no ad hoc inline layout styling remains in targeted advanced blocks
- default views stay simpler even though the underlying detail remains available to the assistant and advanced users

### FD10. States And Motion Library

Goal:

- Standardize empty, loading, error, and motion behavior

Primary files:

- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)
- whichever templates/components are touched during rollout

Tasks:

- define motion tokens
- unify empty-state pattern
- unify loading-state pattern
- unify error-state pattern

Dependencies:

- `FD0`
- should follow major structural redesigns

Acceptance metrics:

- target surfaces no longer use ad hoc state presentation
- motion is restrained and consistent

Implementation proof:

- implemented on branch `codex/frontend-design-system-v0-1`
- acceptance contract: [e2e/277_design_states_motion_consistency_contract.spec.js](/Users/robin/.codex/worktrees/3e47/Portal/e2e/277_design_states_motion_consistency_contract.spec.js)
- screenshot pack: [design/screenshots/2026-03-16-fd10-states-motion/README.md](/Users/robin/.codex/worktrees/3e47/Portal/design/screenshots/2026-03-16-fd10-states-motion/README.md)

### FD11. International, Chinese, And Voice-Ready Validation

Goal:

- Prove the redesigned system works for global non-technical users and future voice-first interaction

Primary files:

- all touched design files

Tasks:

- validate Chinese/CJK rendering on key screens
- validate label expansion and wrapping
- reduce unexplained AI/model/provider jargon in first-view content
- ensure controls and state labels are concise and speakable

Dependencies:

- all major surface redesign work

Acceptance metrics:

- critical screens tolerate Chinese or expanded copy without layout breakage
- first-view critical screens avoid unexplained AI/provider jargon
- major controls use concise speakable labels

### FD12. Final Responsive And Accessibility Pass

Goal:

- Prove the design system works across real device classes

Primary files:

- all touched design files

Tasks:

- verify no horizontal overflow
- verify touch target sizing
- verify focus treatment
- verify contrast for revised surfaces
- tighten tablet layout behavior

Dependencies:

- all prior workstreams

Acceptance metrics:

- no horizontal overflow at `390x844`
- focus states visible and coherent
- touch targets meet `44x44` in redesigned zones

### FD13. Final Visual Smoke

Goal:

- Confirm the app now feels like one product

Primary files:

- all touched design files

Tasks:

- run final screenshot pass
- run full regression
- sync docs

Dependencies:

- all prior workstreams

Acceptance metrics:

- start, town, house, dock, leaderboard, registry, create, and advanced surfaces feel visually coherent
- full Playwright suite passes

## 4. Recommended Implementation Order

The recommended sequence for actual work is:

1. `FD0`
2. `FD1`
3. `FD2`
4. `FD3`
5. `FD4`
6. `FD5`
7. `FD6`
8. `FD7`
9. `FD8`
10. `FD9`
11. `FD10`
12. `FD11`
13. `FD12`
14. `FD13`

## 5. Work Not To Mix In

Do not mix these into the design program unless explicitly approved:

- feature additions
- backend behavior changes
- copy rewrites that change meaning
- navigation rewrites that break modal-first continuity
- new runtime or worker behavior

## 6. Green-Phase Checklist

Before a workstream is marked complete:

- before/after screenshots captured
- acceptance metrics recorded
- touched selectors documented
- inline-style reduction recorded where applicable
- nearby functional regressions passed
- full suite passed before major milestone close
