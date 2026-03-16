# Design Frontend Guidelines

## 1. Scope

These guidelines define how design changes should be implemented in this repo.

They are for future agentic AI contributors working on:

- layout
- hierarchy
- spacing
- typography
- color
- motion
- accessibility
- responsive behavior

They do not authorize:

- feature work
- backend changes
- state-machine changes
- API contract changes
- identity model changes

## 2. Main Files To Touch

- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- [public/index.html](/Users/robin/.codex/worktrees/afe5/Portal/public/index.html)
- [public/start.html](/Users/robin/.codex/worktrees/afe5/Portal/public/start.html)
- [public/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/house.html)
- [public/registry.html](/Users/robin/.codex/worktrees/afe5/Portal/public/registry.html)
- [public/poker.html](/Users/robin/.codex/worktrees/afe5/Portal/public/poker.html)
- [public/leaderboard.html](/Users/robin/.codex/worktrees/afe5/Portal/public/leaderboard.html)
- [public/views/*.html](/Users/robin/.codex/worktrees/afe5/Portal/public/views/house.html)
- [public/app.js](/Users/robin/.codex/worktrees/afe5/Portal/public/app.js)
- [public/house.js](/Users/robin/.codex/worktrees/afe5/Portal/public/house.js)

## 3. Functional Guardrails

### 3.1 Do not change behavior casually

Design work must preserve:

- wallet-first identity
- worker continuity
- shared-state co-op flow
- modal-first navigation
- debug observability tabs

If a design improvement requires a behavior change, stop and document it separately.

### 3.2 Do not move work server-side

UI cleanup is not a reason to rewrite product behavior in backend routes.

### 3.3 Preserve route contracts

Design work may restyle or regroup presentation, but it must not silently:

- delete current routes
- replace modal flows with full-page flows
- remove debug access required by product rules

## 4. Styling Rules

### 4.1 Token-first

- No new hardcoded colors without adding them to [DESIGN_SYSTEM.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_SYSTEM.md).
- No rogue radii, shadows, or transition timings.
- Use existing CSS variable families where possible.

### 4.2 Reduce, do not decorate

Prefer:

- fewer accent colors
- fewer shadow recipes
- fewer border styles
- fewer button tiers visible at once

### 4.3 Stage complexity

When a surface contains advanced information:

- show human-facing summary first
- show detailed or technical information second
- keep raw identifiers and dense metadata behind lower-priority visual layers
- keep detailed evidence grouped clearly enough that the assistant can reference it without forcing the human to read all of it

### 4.4 LLM-assisted detail model

- Assume the assistant is present and can help the user interpret data.
- The first visible block on a screen should answer task, status, and next step without requiring the user to inspect internals.
- Rich detail should remain available in structured secondary or advanced layers for:
  - assistant interpretation
  - advanced human review
  - trust and audit needs
- Do not turn the default UI into a dense dashboard just because the data is valuable.

### 4.5 No-drift implementation rule

- Do not let design docs say one thing while shipped selectors render another.
- When a design phase changes hierarchy, spacing, or copy layers, update:
  - shipped CSS/markup
  - the relevant design docs
  - the corresponding visual tests
  - screenshot captures when the runbook requires them
- If any of those disagree, treat it as unfinished work, not an acceptable gap.

## 5. Responsive Rules

Required design review widths:

- `390x844`
- `768x1024`
- `1440x960`

Every design change must be checked at all three widths.

Specific responsibilities:

- mobile: thumb reach, spacing, scroll sanity, readable hierarchy
- tablet: no awkward desktop compression
- desktop: no dead-space wasteland and no overstretched measures

## 6. Instrumentation Rules

The agent debug panel is part of the product contract.

Rules:

- it must remain available
- it must remain testable
- it should visually read as instrumentation, not primary product content
- on mobile, it must not overwhelm the main task surface

## 7. Copy Rules

For user-facing layers:

- plain language first
- action-oriented
- non-technical
- no unexplained internal nouns at the top of a screen
- do not require a user to manually parse dense operational detail when the same detail can live in an advanced or assistant-readable layer

For debug layers:

- accuracy over friendliness
- but still calm and concise

## 8. Validation Rules

Before a design phase is considered complete:

1. targeted Playwright coverage for the changed surface must pass
2. full `npm test` must pass
3. responsive screenshot review must be completed for mobile, tablet, and desktop
4. [progress.txt](/Users/robin/.codex/worktrees/afe5/Portal/design/progress.txt) must be updated
5. [LESSONS.md](/Users/robin/.codex/worktrees/afe5/Portal/design/LESSONS.md) must record anything worth preserving

## 9. File Hygiene Rules

- Keep design decisions documented in this folder.
- Do not let new style decisions live only in code.
- If a new component tier or token is introduced, update:
  - [DESIGN_SYSTEM.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_SYSTEM.md)
  - [TDD_SPEC.md](/Users/robin/.codex/worktrees/afe5/Portal/design/TDD_SPEC.md) if new measurable verification is needed
  - [AGENT_RUNBOOK.md](/Users/robin/.codex/worktrees/afe5/Portal/design/AGENT_RUNBOOK.md) if execution order changes
