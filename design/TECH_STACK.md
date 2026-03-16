# Design Tech Stack Constraints

This file tells future design agents what the current software can and cannot support.

## 1. Live Product Stack

- server: Express / Node
- frontend: plain HTML, CSS, and JavaScript in `public/`
- styling: primarily [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- worker runtime: in-browser OpenClaw Lite worker
- tests: Playwright

## 2. Important Architectural Constraint

The worker runtime is page-scoped JavaScript.

That means:

- full document navigation can tear it down
- modal-first UX is not just preference, it protects continuity
- design changes that encourage route-jumping can create runtime regressions even when they look cleaner on paper

## 3. Brand Kit Status

The `Brand kit/` app is a design reference, not the live frontend.

Implications:

- do not assume Brand kit tokens are already live
- do not copy a style decision into production without checking [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- if a Brand kit choice is adopted, it must be translated deliberately

## 4. Styling Constraints

The current product is not built on a component framework with isolated style tokens.

Implications:

- CSS changes often affect multiple surfaces at once
- future visual cleanup should prefer token consolidation over ad hoc selector overrides
- a design agent must audit shared selectors before assuming a change is local
- typography choices must also consider browser/system fallback behavior for Simplified Chinese and mixed-script content

## 5. Test Constraints

The repo already expects deterministic Playwright validation.

Design work should therefore rely on:

- DOM assertions
- computed-style assertions
- screenshot comparisons where stable
- existing loss-harness invariants

Avoid designs that require:

- manual timing judgment only
- non-deterministic animation timing
- random visual layout behavior
- language-specific visual assumptions that cannot be regression-tested with alternate text fixtures

## 6. Accessibility Constraints

No dedicated external design system or accessibility framework is governing the shipped UI.

Implications:

- contrast, focus, and hit-target discipline must be encoded in design docs and tests
- the app cannot rely on framework defaults to be accessible

## 7. Responsive Constraints

The app is currently one live shell with multiple surfaces.

Implications:

- mobile changes can affect desktop if not carefully scoped
- fixed bars, modals, and debug surfaces need special attention on small screens

## 8. Safe Design Areas

Good targets for future design-only work:

- spacing
- hierarchy
- typography refinement
- button emphasis
- container consistency
- empty/loading/error states
- debug/product visual separation
- localization-ready copy hierarchy
- voice-ready control affordances

Risky areas requiring extra caution:

- route changes
- iframe/modal flow changes
- anything that changes when and how the worker runtime is visible
- anything that changes unlock/co-op ceremony behavior

## 9. Required Validation Commands

Future design changes should at minimum run:

```bash
npm test
```

And targeted tests for the changed surface once the design TDD suite exists.
