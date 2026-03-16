# Phase D5 - Town Hall And Agent Sidebar TDD Spec

Status: Draft

## 1. Goal

Improve the emotional and hierarchical clarity of onboarding while reducing the default dominance of the agent sidebar.

## 2. Scope

Primary files:

1. `public/views/townhall.html`
2. `public/styles.css`
3. `public/index.html`

Optional JS presentation support only if needed:

1. `public/app.js`

## 3. Non-goals

1. changing registration logic,
2. changing mint logic,
3. removing agent debug capability,
4. removing the sidebar,
5. changing brain configuration behavior.

## 4. Measurable acceptance criteria

### 4.1 Town Hall

1. each onboarding step has one clearly dominant action,
2. avatar customization is visually secondary to the identity step,
3. processing and mint states feel guided, not clerical,
4. the continue action is obvious once available,
5. mobile onboarding remains usable without feeling cramped.

### 4.2 Agent sidebar

1. by default, the sidebar no longer competes with the current main task,
2. debug information remains available and readable,
3. bottom safe area and content spacing remain intentional on mobile,
4. expanded and collapsed states remain clear and accessible.

## 5. Evidence requirements

Required captures:

1. Town Hall step mobile and desktop,
2. Town Hall processing state,
3. `/app` with sidebar minimized,
4. `/app` with sidebar expanded.

## 6. Verification

1. targeted onboarding and agent-panel Playwright coverage,
2. full `npm test`.

## 7. Exit criteria

This phase is complete only when:

1. onboarding feels guided rather than procedural,
2. the sidebar feels like support infrastructure rather than a competing product surface,
3. no onboarding or debug behavior changed functionally.

