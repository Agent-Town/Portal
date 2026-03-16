# Phase D2 - Start Page And Town Hub TDD Spec

Status: Implemented on `codex/frontend-design`

## 1. Goal

Make the app's front door and town hub immediately understandable.

This phase covers:

1. `/start`
2. `/app` town hub

## 2. Scope

Primary files:

1. `public/start.html`
2. `public/index.html`
3. `public/styles.css`

Optional JS presentation support only if needed:

1. `public/start.js`
2. `public/app.js`

Any JS changes in this phase must remain presentation-only.

## 3. Non-goals

1. changing auth logic,
2. changing district routing,
3. changing map behavior,
4. adding new district features.

Cross-cutting requirement:

1. all changes must satisfy `design/specs/09_global_human_first_design_requirements.md`

## 4. Measurable acceptance criteria

### 4.1 Start page

1. at `390 x 844`, the title and primary CTA are visible without scrolling,
2. the primary CTA is the most visually dominant interactive element,
3. the page still feels intentional if the hero media does not render,
4. the warning footer no longer competes visually with the main action,
5. the first action remains understandable to users with no AI vocabulary.

### 4.2 Town hub

1. each major district reads as tappable in under 2 seconds,
2. the selected district is visually unambiguous,
3. the existing status or supporting copy clearly reinforces what opens next,
4. mobile tap targets feel thumb-safe and do not require pixel hunting,
5. the town metaphor remains understandable across languages.

### 4.3 Responsive composition

1. mobile feels designed, not cropped desktop,
2. tablet feels composed, not stretched mobile,
3. desktop uses space to create calm rather than just emptiness.

## 5. Evidence requirements

Required captures:

1. `/start` at mobile, tablet, desktop,
2. `/app` at mobile, tablet, desktop.

Required comparison notes:

1. what the eye lands on first before,
2. what the eye lands on first after,
3. why the new hierarchy is better.

## 6. Verification

1. targeted Playwright coverage for start and town hub surfaces,
2. full `npm test`,
3. no regression in agent sidebar behavior or modal entry.

## 7. Exit criteria

This phase is complete only when:

1. a first-time user can identify the next action instantly on `/start`,
2. the town hub feels obviously interactive,
3. the app's first impression feels confident rather than tentative.

## 8. Implementation evidence

Committed screenshot pack:

1. `design/evidence/phase-d2/before/`
2. `design/evidence/phase-d2/after/`
