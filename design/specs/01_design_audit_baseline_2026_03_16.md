# Design Audit Baseline - 2026-03-16

Status: current baseline audit

This document captures the current state of the design before any new design phase is approved or implemented.

## 1. Audit source set

Context docs reviewed:

1. `AGENTS.md`
2. `README.md`
3. `IMPLEMENTATION_PLAN.md`
4. `LOOP.md`
5. `specs/00_product_story.md`
6. `specs/39_house_library_safety_moderation_tdd_spec.md`
7. `specs/40_house_library_trust_aware_discovery_tdd_spec.md`
8. `specs/41_house_library_route_sync_tdd_spec.md`
9. `specs/42_house_library_shellwide_icon_first_tdd_spec.md`
10. `public/styles.css`
11. `public/index.html`
12. `public/start.html`
13. `public/views/house.html`
14. `public/views/townhall.html`
15. `public/views/pony.html`
16. `public/views/leaderboard.html`
17. `public/views/saloon.html`
18. `public/views/brain.html`

Live walk completed at:

1. mobile,
2. tablet,
3. desktop.

## 2. Overall assessment

The app has a distinctive world and a strong premise.
It does not yet have a quiet or inevitable interface hierarchy.

The biggest current issue is not lack of visual identity.
It is too much visual competition at once.

There is also a structural product opportunity:

1. too much raw or system-facing detail is surfaced for people by default,
2. the app already has an always-available LLM companion,
3. the UI should rely more on that companion to explain complexity and less on screens filled with layered detail.

## 3. Primary findings by surface

### 3.1 Start page

Problems:

1. hero media frame dominates before meaning does,
2. if third-party media is absent or blocked, the page looks incomplete,
3. the primary CTA is too visually small relative to the media block,
4. the warning footer competes with the main card at mobile sizes.

### 3.2 Town hub

Problems:

1. district hotspots are atmospheric but not immediately obvious,
2. the active district does not own the user's attention strongly enough,
3. the agent sidebar competes with the world on mobile and desktop,
4. the world is expressive, but the overlay information is under-articulated.

### 3.3 District modal shell

Problems:

1. modal shell and inner content shell are both visually loud,
2. repeated wood, border, shadow, and panel framing weaken hierarchy,
3. dense content inside the modal feels heavy before the user has chosen a task.

### 3.4 House Library

Problems:

1. too many capabilities are stacked in a single long scroll,
2. human goals are less obvious than system structure,
3. technical/manual controls still carry too much default visual weight,
4. cards and drawers improved things, but the top-level task architecture is still not simple enough.
5. too much information is still presented as if the human must inspect it manually instead of asking the LLM.

### 3.5 Town Hall

Problems:

1. onboarding still reads as a form flow more than a guided story,
2. avatar customization visually competes with primary identity input,
3. registration processing is functionally clear but visually procedural.

### 3.6 Agent sidebar

Problems:

1. it reads like a second product attached to the app,
2. it is too visually prominent by default,
3. mobile and short-height layouts feel compressed once the sidebar is present.

### 3.7 Information architecture

Problems:

1. the product often presents complexity directly to the human even when the LLM could mediate it,
2. advanced and detailed information is not always separated clearly from the primary path,
3. the UI still occasionally behaves like a system browser instead of a guided game surface.

## 4. System-level findings

### 4.1 Typography

Problem:

1. one display-like typeface is used for nearly all interface roles.

Needed direction:

1. separate display from UI text.

### 4.2 Spacing

Problem:

1. spacing values exist, but not yet as an enforced rhythm.

Needed direction:

1. formal spacing ladder.

### 4.3 Depth

Problem:

1. too many layers are equally framed and raised.

Needed direction:

1. explicit depth hierarchy.

### 4.4 Color

Problem:

1. the palette is strong, but too many surfaces use strong gradients and borders simultaneously.

Needed direction:

1. keep the world rich,
2. quiet the interface.

## 5. Recommended phase sequence

### D1 - Foundation

1. typography roles,
2. spacing ladder,
3. depth hierarchy,
4. button and token hierarchy,
5. shell-wide visual quieting rules.

### D2 - Front door and town hub

1. `/start`
2. `/app` town map
3. active district clarity

### D3 - District modal shell

1. shell hierarchy,
2. inner panel quieting,
3. shared modal composition rules.

### D4 - House Library

1. task-first architecture,
2. calmer top-level grouping,
3. advanced control quieting,
4. human-readable task framing,
5. clear separation between simple user view and deeper LLM/advanced detail.

### D5 - Town Hall and agent sidebar

1. onboarding clarity,
2. processing clarity,
3. sidebar subordination.

### D6 - Polish

1. loading states,
2. empty states,
3. motion,
4. accessibility tightening,
5. final cross-device rhythm cleanup.
6. consistent summary-versus-detail treatment across loading, empty, and error surfaces.

## 6. Non-negotiable guardrails from the audit

1. no functional changes disguised as design work,
2. no new route architecture,
3. no full-page replacement of modal-first district flows,
4. no destruction of current test coverage assumptions,
5. no color-only status patterns,
6. no default screen where every control screams equally.
7. no default screen that assumes the human must browse all available system detail manually.
