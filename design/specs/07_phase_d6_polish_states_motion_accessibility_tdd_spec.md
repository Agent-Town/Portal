# Phase D6 - Polish, States, Motion, And Accessibility TDD Spec

Status: Implemented on `codex/frontend-design`

## 1. Goal

Complete the design program with the subtle details that make the interface feel premium rather than merely tidy.

This phase should come last.

## 2. Scope

Possible files:

1. `public/styles.css`
2. `public/start.html`
3. `public/index.html`
4. `public/views/*.html`
5. `public/app.js`
6. `public/start.js`

Only presentation-related JS changes are allowed.

## 3. Non-goals

1. new features,
2. dark mode by default unless separately approved,
3. heavy animation,
4. performance-hostile decorative effects.

Cross-cutting requirement:

1. all changes must satisfy `design/specs/09_global_human_first_design_requirements.md`
2. polish work must reinforce a summary-first UI instead of reintroducing visible detail clutter.

## 4. Measurable acceptance criteria

### 4.1 Loading states

1. loading does not look broken,
2. loading components use a consistent presentation language,
3. third-party media waiting states feel intentional.

### 4.2 Empty states

1. empty surfaces feel authored rather than unfinished,
2. each empty state points toward one next action,
3. empty states are visually consistent across districts,
4. empty states summarize what matters instead of dumping system detail into the blank state.

### 4.3 Error states

1. error styling is consistent,
2. error text is clear and not hostile,
3. the user can recover without deciphering technical jargon,
4. default error states explain just enough for the user while deeper diagnosis remains available elsewhere.

### 4.4 Motion

1. motion explains change rather than decorating it,
2. drawers, modals, and panel entries feel coherent,
3. `prefers-reduced-motion` remains respected.

### 4.5 Accessibility

1. focus remains visible on all key controls,
2. color contrast stays acceptable,
3. no icon-only control lacks an accessible name,
4. no status relies on color alone,
5. the final UI remains plausible for English and Chinese labels and future voice-target naming.

## 5. Evidence requirements

Required:

1. before/after captures for one loading surface,
2. one empty state,
3. one error state,
4. one reduced-motion-safe interaction,
5. mobile and desktop proof.

## 6. Verification

1. targeted Playwright coverage for touched surfaces,
2. full `npm test`.

## 7. Exit criteria

This phase is complete only when:

1. the interface feels finished in motion and state transitions,
2. the app remains calm when empty, loading, or failing,
3. accessibility is visibly stronger than the baseline,
4. the final UI stays dead simple on the main path even though the product retains richer detail for the LLM and advanced views.

## 8. Implementation evidence

Implemented in:

1. `public/styles.css`
2. `public/start.html`
3. `public/index.html`
4. `public/trainer.html`
5. `public/views/house.html`
6. `public/views/townhall.html`
7. `public/app.js`
8. `public/start.js`

Evidence:

1. `design/evidence/phase-d6/before/`
2. `design/evidence/phase-d6/after/`

Verification completed:

1. targeted D6 regressions passed
2. full `npm test` passed with `410 passed, 4 skipped`
