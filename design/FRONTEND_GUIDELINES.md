# FRONTEND_GUIDELINES

Status: canonical design-engineering interface contract
Last updated: 2026-03-16

This file explains how the front end is built so a future design agent can change visuals without accidentally changing functionality.

## 1. Front-end architecture

The app is not a component-framework app.

Current baseline:

1. vanilla HTML,
2. one main global stylesheet: `public/styles.css`,
3. vanilla JS orchestration in `public/app.js`, `public/start.js`, and related files,
4. district content split into HTML partials in `public/views/`,
5. modal-first shells inside `/app`,
6. worker continuity depends on not tearing down the current page unnecessarily.

## 2. Core source files

### 2.1 Entry routes and shells

1. `public/index.html`
   - town hub shell at `/app`
2. `public/start.html`
   - start/login front door at `/start`
3. `public/create.html` if applicable through route rendering
4. `public/house.html` if applicable through route rendering

### 2.2 Shared styling

1. `public/styles.css`
   - current de facto design system

### 2.3 Main JS controllers

1. `public/app.js`
   - town hub, district modal behavior, House surfaces, Library surfaces, agent sidebar
2. `public/start.js`
   - start page auth flow and enter flow
3. `public/house.js`
   - house-specific behavior
4. `public/trainer.js`
   - trainer UI
5. `public/atlas.js`
   - atlas-specific UI

### 2.4 District views

1. `public/views/house.html`
2. `public/views/townhall.html`
3. `public/views/pony.html`
4. `public/views/leaderboard.html`
5. `public/views/saloon.html`
6. `public/views/brain.html`

## 3. Design-safe editing rules

Allowed without changing product behavior:

1. reorder visual sections if actions and state behavior remain intact,
2. change typography, spacing, color, size, layout, and alignment,
3. move advanced controls into already-existing drawers or visually subordinate regions,
4. change copy presentation without changing product meaning,
5. improve responsive layout,
6. improve focus states and accessibility presentation.

Not allowed without explicit separate approval:

1. deleting existing actions,
2. adding new actions or new flows,
3. changing route behavior,
4. moving logic from front end to backend,
5. breaking modal-first continuity,
6. changing or removing analytics or state hooks,
7. changing test semantics rather than updating tests to match approved design,
8. baking essential meaning into one language only.

## 4. Modal-first continuity guardrail

This repo has a strong modal-first rule.

Design implication:

1. prefer in-place panels and drawers over route changes,
2. avoid designs that require full-page navigation for House surfaces,
3. do not propose layout patterns that assume the worker can be torn down and recreated without UX cost.

## 5. Test stability rules

When changing markup:

1. preserve existing `data-testid` attributes unless a spec explicitly changes them,
2. preserve accessible names for buttons and controls,
3. preserve the current action wiring unless the change is explicitly approved as a functional change,
4. update Playwright coverage if the visual contract is intentionally changed.

## 6. Responsive implementation rules

Future design work should not rely on only three hard breakpoints.

Required behavior:

1. mobile is the baseline, not the fallback,
2. tablet must feel composed, not stretched mobile,
3. desktop must use space to create calm, not just show more content,
4. no bottom-edge collisions with the agent panel,
5. no hidden primary action below the fold on key screens.

## 6.1 Localization-safe implementation rules

When changing markup or CSS:

1. do not bake meaningful UI text into images,
2. do not assume English-only label length,
3. do not overfit widths to current English strings,
4. keep button and chip layouts tolerant of shorter and denser Chinese labels,
5. preserve accessible names so localized labels can later be applied cleanly,
6. avoid decorative copy treatments that depend on Latin-only typography.

## 7. House Library-specific constraints

The Library has become a large same-shell system. Design agents must preserve:

1. same-shell continuity,
2. route desk,
3. safety desk,
4. relay desk,
5. satchel desk,
6. local library items,
7. drawers for advanced/manual tools,
8. current review, trust, provenance, import, and sync mechanics.

Visual simplification is allowed.
Behavioral simplification is not automatically allowed.

## 7.1 Human-first wording rule

For primary user-facing surfaces:

1. prefer outcome language over infrastructure language,
2. prefer verbs over nouns,
3. keep provider and model names secondary unless the user is explicitly configuring them,
4. ensure the main task would still make sense to someone new to AI.

## 7.2 Voice-ready structure rule

Future design work should preserve:

1. stable names for key rooms and actions,
2. visible current-selection state,
3. simple action groupings that can later map to spoken commands,
4. layouts where a user can tell what is active without reading dense text.

## 8. Verification workflow for design implementation

For every approved design phase:

1. capture before screenshots at mobile, tablet, and desktop,
2. implement only approved visual changes,
3. capture after screenshots at the same viewports,
4. run targeted Playwright coverage for the affected surfaces,
5. run full `npm test`,
6. update `design/progress.txt`,
7. update `design/LESSONS.md`.

## 9. Preferred implementation style

1. Prefer CSS and markup hierarchy changes over JS changes when possible.
2. If JS is needed, keep it limited to presentation state, not product logic.
3. Prefer reusing existing semantic wrappers rather than inventing redundant container divs.
4. Reduce visual complexity before introducing new decorative elements.
