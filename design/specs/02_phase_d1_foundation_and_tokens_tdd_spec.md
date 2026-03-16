# Phase D1 - Foundation And Tokens TDD Spec

Status: Draft

## 1. Goal

Establish the visual foundation required for all later design work:

1. typography roles,
2. spacing rhythm,
3. depth hierarchy,
4. button hierarchy,
5. calmer token and surface rules.

This phase is system-level.
It should not redesign individual flows yet.

## 2. Scope

Primary files:

1. `public/styles.css`
2. `design/DESIGN_SYSTEM.md`

Optional markup touch only if required for semantic clarity:

1. `public/index.html`
2. `public/start.html`
3. `public/views/*.html`

## 3. Non-goals

1. redesigning start flow logic,
2. changing House Library information architecture,
3. changing Town Hall workflow,
4. changing route behavior.

## 4. Measurable acceptance criteria

### 4.1 Typography

1. a display role and a UI role are visually distinct,
2. body copy is calmer and more readable than headings,
3. button text no longer looks identical in voice to large headings.

### 4.2 Spacing

1. a documented spacing ladder is present in `design/DESIGN_SYSTEM.md`,
2. panel padding, control gaps, and section gaps use the approved ladder,
3. no new ad hoc spacing values are introduced.

### 4.3 Depth

1. modal shell, content panel, and control surfaces have distinct depth roles,
2. nested panel emphasis is visibly reduced,
3. controls do not use stronger depth than their containing surface.

### 4.4 Buttons and tokens

1. primary buttons read clearly as primary,
2. supporting buttons do not compete with primary actions,
3. pills and library tokens no longer look like near-equal buttons.

### 4.5 Responsiveness

1. no new horizontal overflow at `390 x 844`,
2. button groups still wrap cleanly,
3. focus visibility remains intact.

## 5. Evidence requirements

Required before/after captures:

1. `/start` at mobile and desktop,
2. `/app` town hub at mobile and desktop,
3. House Library at mobile and desktop.

## 6. Verification

1. targeted visual regressions for the touched surfaces,
2. full `npm test`,
3. updated `design/DESIGN_SYSTEM.md`,
4. updated `design/progress.txt`,
5. updated `design/LESSONS.md`.

## 7. Exit criteria

This phase is complete only when:

1. the visual system reads more calmly before any route-specific redesign begins,
2. later phases can reference explicit token roles instead of one-off values,
3. no functionality changed.

