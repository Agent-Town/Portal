# PRD

Status: Design product requirements for poker design v1  
Date: 2026-03-16

This document defines what the poker UI must feel like and how future design phases will be judged.

## 1. Objective

Transform the current poker UI from a functionally complete alpha into a dead-simple, human-first decision environment for global players, including users with very basic AI knowledge, without changing feature behavior.

## 2. Success Criteria

1. A player can identify the primary action of any poker screen within 2 seconds.
2. On the live table at mobile width, the action area is visible in the initial viewport when the seat is acting.
3. On every screen, primary actions are visually stronger than navigation and utilities.
4. Responsive behavior feels composed, not merely compressed.
5. Operator screens separate high-risk actions from neutral actions.
6. Review and study screens feel analytical, not like miscellaneous form stacks.
7. A beginner user can understand the role of the AI teammate without needing prior AI vocabulary.
8. English and Simplified Chinese layouts remain composed and legible.
9. Localized text expansion does not break hierarchy or action visibility.
10. Provider, model, and service identity never becomes the main explanation of how to play.
11. The default player view feels like a game surface, not a dashboard.
12. Rich data remains available for the LLM and advanced users without crowding the default human route.
13. The human-default and LLM-rich views remain consistent because they are projections of the same underlying route state.

## 3. Non-Goals

1. No feature additions.
2. No route changes.
3. No backend changes.
4. No API shape changes.
5. No framework migration.
6. No default-view clutter justified only by the existence of more data.

## 4. User Requirements

## 4.0 Target Groups

Initial design validation must cover:

1. international players using English,
2. Chinese players using Simplified Chinese,
3. users who understand poker but have minimal understanding of AI systems,
4. users who may later interact through voice in their local language.

## 4.1 Player

The player must be able to:

1. immediately see what table or event they are in,
2. immediately understand whether they can act,
3. immediately see the legal next action,
4. distinguish action controls from settings and utilities,
5. review history without wading through unrelated controls,
6. understand the AI teammate in plain language without having to understand models or providers.
7. ignore advanced detail and still play correctly.
8. ask the AI for explanation instead of reading a wall of supporting UI.

## 4.2 Operator

The operator must be able to:

1. see the current review situation at a glance,
2. distinguish safe controls from destructive ones,
3. avoid accidental refunds or closures,
4. understand series state before taking action.

## 4.3 Spectator

The rail user must be able to:

1. understand the current public state quickly,
2. navigate to a table or series without seeing player-private UI,
3. avoid confusion with player or admin controls.

## 4.4 Centaur Team

The centaur user must be able to:

1. understand the shared-decision ritual,
2. see the countdown clearly,
3. distinguish discussion from commitment,
4. understand the agent suggestion without digging,
5. distinguish clearly between discussion with the AI teammate and committing the team action.
6. stay inside a simple ritual flow without parsing every technical detail on screen.

## 4.5 International Player

The international player must be able to:

1. understand the main game action in their locale without decoding AI jargon,
2. scan labels that may be longer than English defaults,
3. understand the product even if provider or model names are unfamiliar.

## 5. Visual Product Requirements

1. The poker shell must use one coherent palette.
2. Heading hierarchy must be stable across routes.
3. Card treatment must not flatten all information into one level.
4. Screen-specific layouts must exist for:
   - lobby,
   - table,
   - schedule,
   - review,
   - operator,
   - centaur.
5. Buttons must have explicit role families:
   - primary,
   - secondary,
   - navigation,
   - destructive.
6. Primary action zones must prefer plain-language labels over technical AI vocabulary.
7. Provider and model names must be visually demoted to supporting metadata when present.
8. Rich detail that is mainly useful for the LLM or advanced users must be hidden, collapsed, or clearly secondary on the default player route.

## 6. Responsive Requirements

1. Mobile is the default composition.
2. Tablet is not allowed to look like slightly wider mobile or collapsed desktop.
3. Desktop must use additional width to reduce scanning effort, not simply enlarge gaps.
4. No poker screen may rely on a single `max-width` padding override as its only responsive behavior.
5. Responsive layout must remain stable under English and Simplified Chinese copy lengths.
6. Responsive layout must stay simple under those locales, not merely unbroken.

## 7. Accessibility Requirements

1. Keyboard users must see obvious focus.
2. Disabled state must be visually distinct and legible.
3. Form controls must be large enough for touch.
4. Color contrast must remain acceptable on all poker surfaces.
5. Language complexity must not be the barrier to comprehension.

## 8. International and Chinese Market Requirements

1. English and Simplified Chinese are required design-validation locales for poker surfaces.
2. Mixed-script layouts must support Latin numerals with Chinese text cleanly.
3. Buttons, tabs, schedules, and leaderboard rows must survive localized expansion without clipping or overlap.
4. No primary workflow may depend on English-specific casing, tracking, or word length assumptions.
5. Regional provider or service differences must not require redesign of the main game screens.
6. Simplicity expectations apply equally in English and Simplified Chinese: default routes should stay short, scannable, and action-first.

## 9. Future Voice Requirements

1. Discussion and action-entry surfaces must remain structurally compatible with future voice controls.
2. Voice-readiness must not introduce fake controls before the feature exists.
3. Future voice affordances should work across local languages and providers without changing the main game hierarchy.

## 9.1 LLM-Rich Secondary Detail Requirement

The product assumes an LLM is available with the user.

Therefore:

1. not all useful data needs to be visible by default,
2. richer context may remain available in advanced or machine-readable layers,
3. the default human route should optimize for clarity and action,
4. the LLM can help users interrogate detail instead of forcing the UI to expose every metric all the time,
5. the advanced or LLM projection must come from the same canonical route state as the human surface.

## 10. Design Review Gate

No phase should be considered complete until:

1. the screen passes deterministic Playwright design checks,
2. the screen passes responsive screenshot review at mobile, tablet, and desktop,
3. the screen remains understandable to beginner AI users,
4. English and Simplified Chinese review passes for affected layouts,
5. the change remains functionality-preserving,
6. the default player view is still simpler than the previous state, not denser,
7. any changed visibility, gating, or projection rule is reflected in the TLA+ design model.
