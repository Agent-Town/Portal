# FRONTEND_GUIDELINES

Status: Canonical design-engineering guide for poker UI work  
Date: 2026-03-16

## 1. Scope

These guidelines apply to poker UI design work in:

- [public/poker.html](../public/poker.html)
- [public/poker.js](../public/poker.js)
- supporting shell integration in [public/app.js](../public/app.js) only when needed for modal presentation

They do not authorize functionality changes.

## 2. Current Architecture

1. Poker is a server-served HTML shell with inline CSS in [public/poker.html](../public/poker.html).
2. Route-specific content is composed in vanilla JS in [public/poker.js](../public/poker.js).
3. The current rendering pattern is `setTitle()` plus `renderCards()` with HTML string sections.
4. Poker runs modal-first through `?embed=1` and must remain compatible with the hub.
5. Admin state is keyed through `localStorage` token lookup and must not be visually confused with player state.
6. Player-facing poker copy must stay understandable to users with little or no AI vocabulary.

## 3. Design-Engineering Constraints

1. Do not change route semantics.
2. Do not change API contracts.
3. Do not rename forms, buttons, or IDs if doing so would break existing tests, unless the design phase explicitly updates the corresponding tests.
4. No framework migrations.
5. No CSS frameworks.
6. No functionality hidden behind design work.
7. Design work must preserve future localization readiness for English and Simplified Chinese.
8. Design work must not make provider or model labels necessary to operate the product.
9. Design work must treat default human UI and advanced or LLM-facing detail as separate layers.
10. Those layers must remain projections of the same route state, not separate manually maintained views.

## 4. Required Engineering Pattern For Design Work

1. Add screen-level wrapper classes or `data-view` markers so CSS can target route-specific layouts cleanly.
2. Keep one content order in the DOM that matches user priority, especially on mobile.
3. Use tokens from [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md), not new inline values.
4. Distinguish these classes structurally:
   - page shell,
   - screen intro,
   - metric strip,
   - primary action group,
   - secondary navigation group,
   - destructive group,
   - supporting rail,
   - thread/review content.
5. New player-facing strings should be written so they can be externalized later without structural rewrites.
6. Layout must survive longer translated labels without depending on manual line breaks.
7. If a section exists primarily to expose rich context, it should default to a collapsed, hidden, or explicitly secondary presentation on player routes.
8. Rich machine-readable context may exist in hidden support containers or advanced surfaces, but should not inflate the first-read human layout.
9. If the same information appears in both the human default view and the advanced or LLM layer, both must be generated from the same source fields to avoid drift.
10. If a change alters visibility, ordering, or gating logic, update the TLA+ projection model before implementation.

## 5. Responsive Rules

1. Mobile is the default DOM priority.
2. Tablet and desktop may rearrange visually through layout only after mobile order is correct.
3. No poker screen may rely on a single breakpoint-only patch.
4. Every approved phase must test mobile, tablet, and desktop.
5. Responsive review must include English and Simplified Chinese string overlays once a design phase touches copy-sensitive layout.

## 6. Accessibility Rules

1. New design classes must include visible focus styling.
2. New button roles must preserve native button semantics.
3. Status text must stay readable and not be the only location for critical guidance.
4. Do not convey meaning through color alone.
5. If a user never notices the term `agent`, the interface should still make sense from surrounding plain-language labels.

## 7. Design Testability Rules

Future design changes must be verifiable through Playwright.

Allowed assertions:

1. visible section order,
2. presence of primary action above fold,
3. absence of horizontal overflow,
4. computed styles for token usage,
5. role-based control grouping,
6. screenshot snapshots at seeded states.
7. localized expansion and mixed-script layout resilience.
8. default-versus-advanced detail visibility.

## 8. Voice-Ready Layout Discipline

1. Reserve structural space near discussion and action inputs for future voice affordances only when the approved phase requires it.
2. Do not add fake microphone buttons or simulated voice controls before the functional feature exists.
3. If a route prepares a future voice slot, it must degrade cleanly to a standard text/input layout today.

## 8.1 Dead-Simple Default Rule

For player routes, future agents should assume:

1. the human wants to act, not inspect a report,
2. the LLM can absorb richer structured context than the human should be asked to scan,
3. details can be offered through an advanced surface or AI interaction instead of crowding the default route.
4. advanced or machine-readable detail must stay aligned with the visible human state because both are projections of the same route truth.

## 9. Required Doc Sync

When a design phase changes poker UI, update:

1. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) if tokens or component rules changed
2. [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md) if engineering rules changed
3. [APP_FLOW.md](./APP_FLOW.md) if screen composition expectations changed
4. [PRD.md](./PRD.md) if design success criteria changed
5. [progress.txt](./progress.txt)
6. [LESSONS.md](./LESSONS.md)

## 10. Default Rule For Future Agents

If a proposed design improvement requires a functional change, stop and flag it explicitly. Do not smuggle it into design implementation.
