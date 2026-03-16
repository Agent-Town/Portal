# PRD

Status: Design product requirements for poker design v1  
Date: 2026-03-16

This document defines what the poker UI must feel like and how future design phases will be judged.

## 1. Objective

Transform the current poker UI from a functionally complete alpha into a human-first decision environment without changing feature behavior.

## 2. Success Criteria

1. A player can identify the primary action of any poker screen within 2 seconds.
2. On the live table at mobile width, the action area is visible in the initial viewport when the seat is acting.
3. On every screen, primary actions are visually stronger than navigation and utilities.
4. Responsive behavior feels composed, not merely compressed.
5. Operator screens separate high-risk actions from neutral actions.
6. Review and study screens feel analytical, not like miscellaneous form stacks.

## 3. Non-Goals

1. No feature additions.
2. No route changes.
3. No backend changes.
4. No API shape changes.
5. No framework migration.

## 4. User Requirements

## 4.1 Player

The player must be able to:

1. immediately see what table or event they are in,
2. immediately understand whether they can act,
3. immediately see the legal next action,
4. distinguish action controls from settings and utilities,
5. review history without wading through unrelated controls.

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
4. understand the agent suggestion without digging.

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

## 6. Responsive Requirements

1. Mobile is the default composition.
2. Tablet is not allowed to look like slightly wider mobile or collapsed desktop.
3. Desktop must use additional width to reduce scanning effort, not simply enlarge gaps.
4. No poker screen may rely on a single `max-width` padding override as its only responsive behavior.

## 7. Accessibility Requirements

1. Keyboard users must see obvious focus.
2. Disabled state must be visually distinct and legible.
3. Form controls must be large enough for touch.
4. Color contrast must remain acceptable on all poker surfaces.

## 8. Design Review Gate

No phase should be considered complete until:

1. the screen passes deterministic Playwright design checks,
2. the screen passes responsive screenshot review at mobile, tablet, and desktop,
3. the change remains functionality-preserving.
