# Portal Design Audit Baseline

Baseline commit: `a56503d`

This file captures the current design audit so future agents do not have to rediscover the same problems from scratch.

## 1. Audit Inputs

Current product sources reviewed:

- [AGENTS.md](/Users/robin/.codex/worktrees/afe5/Portal/AGENTS.md)
- [README.md](/Users/robin/.codex/worktrees/afe5/Portal/README.md)
- [specs/11_district_map_storefront_spec.md](/Users/robin/.codex/worktrees/afe5/Portal/specs/11_district_map_storefront_spec.md)
- [research/portal/loss.md](/Users/robin/.codex/worktrees/afe5/Portal/research/portal/loss.md)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- [public/index.html](/Users/robin/.codex/worktrees/afe5/Portal/public/index.html)
- [public/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/house.html)
- [public/views/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/views/house.html)
- [public/registry.html](/Users/robin/.codex/worktrees/afe5/Portal/public/registry.html)
- [public/poker.html](/Users/robin/.codex/worktrees/afe5/Portal/public/poker.html)
- [public/leaderboard.html](/Users/robin/.codex/worktrees/afe5/Portal/public/leaderboard.html)

Reference-only design artifacts reviewed:

- [Brand kit/src/app/components/BrandCore.tsx](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/src/app/components/BrandCore.tsx)
- [Brand kit/src/app/components/ColorSystem.tsx](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/src/app/components/ColorSystem.tsx)
- [Brand kit/src/app/components/TypographySystem.tsx](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/src/app/components/TypographySystem.tsx)
- [Brand kit/src/app/components/MotionGuide.tsx](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/src/app/components/MotionGuide.tsx)
- [Brand kit/guidelines/Guidelines.md](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/guidelines/Guidelines.md)

## 2. Overall Assessment

The product already has a recognizable world, but the visual system under it is fragmented. The app feels memorable and handmade, yet the hierarchy, typography discipline, responsive restraint, and component consistency are not calm enough for a premium experience.

## 3. Biggest Structural Problem

There is no single authoritative design source of truth.

Current reality:

- the shipped UI is governed by [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- the Brand kit contains useful intent but not a production contract
- the nominal Brand kit guidelines file is placeholder text

Future work must fix this before large-scale polish.

## 4. Phase 1 Findings: Critical

### 4.1 Town hub hierarchy

Problem:

- the town illustration, district labels, bottom Agent Comms bar, and primary CTA compete

Needed state:

- one dominant next action
- inactive districts recede
- the shell feels obvious within two seconds

Why it matters:

- this is the first and most important screen

### 4.2 Mobile town hub crowding

Problem:

- the bottom dock consumes important thumb and visual space
- the scene and the control layer fight each other

Needed state:

- mobile chrome becomes quieter
- the scene remains primary

Why it matters:

- mobile is the most fragile layout in the current shell

### 4.3 House page hierarchy

Problem:

- unlock, backup, brain, share, public image, write, and read appear with similar emphasis

Needed state:

- one clear narrative:
  - unlock first
  - continuity second
  - sharing third
  - advanced sections later

Why it matters:

- this screen carries important user trust and continuity tasks

### 4.4 House Console and House Office readability

Problem:

- these surfaces still read like system consoles

Needed state:

- human summary first
- technical evidence second
- “what happened / what matters / what next” at the top

Why it matters:

- the product is supposed to help standard users, not just operators

### 4.5 Debug panel competition

Problem:

- debug surfaces visually compete with the product

Needed state:

- instrumentation remains available but clearly secondary

Why it matters:

- visual noise reduces trust and composure

### 4.6 Poker empty state

Problem:

- low coherence with the rest of the system
- feels underdesigned when empty

Needed state:

- same family as the rest of the app
- intentional empty-state structure

Why it matters:

- users should never feel they hit an abandoned corner

## 5. Phase 2 Findings: Refinement

### 5.1 Typography

Problem:

- Wellfleet is currently carrying display, UI, and body text

Needed state:

- expressive display face
- quieter UI/body face
- stricter type hierarchy

### 5.2 Button and pill emphasis

Problem:

- too many controls look equally important

Needed state:

- stronger distinction between primary, secondary, and metadata elements

### 5.3 Surface inconsistency

Problem:

- panels, modals, sidebar cards, and share shells do not feel system-built

Needed state:

- one container system with a strict scale

### 5.4 Leaderboard measure

Problem:

- too much empty desktop space relative to content density

Needed state:

- calmer central frame and stronger content focus

### 5.5 Registry layering

Problem:

- search, summary, and proof-heavy content compete too directly

Needed state:

- summary first
- proof next
- raw/advanced data last

## 6. Phase 3 Findings: Polish

### 6.1 Motion language

- interactions need one coherent timing family

### 6.2 Empty states

- different screens use different empty-state grammars

### 6.3 Loading states

- several surfaces still jump from blank to loaded

### 6.4 Error states

- tone and structure are inconsistent

### 6.5 Accessibility

- contrast and hit-target work remain

### 6.6 Theming drift

- there is a parallel inactive theme vocabulary that increases entropy

## 7. Viewport Baseline

The audit was performed against:

- mobile `390px`
- tablet `768px`
- desktop `1440px`

Reviewed surfaces:

- `/start` or `/` entry shell depending on config
- `/app`
- `/house`
- `/leaderboard`
- `/registry`
- `/poker`
- seeded House Console / House Office helper states

## 8. Immediate Design Recommendation

Do not start with cosmetic polish.

The correct order is:

1. establish one authoritative design system
2. fix hierarchy on the hub and house surfaces
3. reduce debug/product competition
4. unify surface language
5. add polish only after the structure is coherent
