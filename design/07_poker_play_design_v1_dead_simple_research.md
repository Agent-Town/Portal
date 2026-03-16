# Poker Play Design v1 Dead-Simple Research

Status: Competitive-reference addendum  
Date: 2026-03-16  
Audience: product designers, frontend engineers, QA automation engineers, agentic AI builders  
Purpose: lock the simplicity benchmark for the next poker design phase so future agents do not keep adding visible detail to the default player surface.

## 1. Why This Exists

The current poker redesign improved hierarchy, but the default player UI is still too dense.

The product direction is now explicit:

1. the default poker UI must feel like a game, not an operations console,
2. the human should see only the few things needed to act,
3. the LLM may still have access to much richer state,
4. advanced and detail-heavy views must be explicit, not the default.

This document records the external product patterns that justify that pivot.

## 2. Official Reference Sources Reviewed

The goal is not to copy visual styling. The goal is to extract proven interaction patterns from mature poker products.

Official sources reviewed:

1. PokerStars game-features page:
   - https://www.pokerstars.bet/poker/games/features/
2. PokerStars software-features page:
   - https://www.pokerstars.bet/poker/download/features/
3. PokerStars product-update post about simplifying tournament finding and registration:
   - https://www.pokerstars.com/poker/learn/news/pokerstars-enhancing-lobby-and-registering-for-tournaments/
4. PokerStars software release notes documenting where player stats and notes live:
   - https://www.pokerstars.com/poker/room/features/release-notes/
5. TLA PreCheck architecture concept:
   - https://github.com/kingbootoshi/tla-precheck

## 3. Distilled Product Findings

### 3.1 Entry must be immediate

Official PokerStars language emphasizes:

1. getting into a game quickly,
2. filtering and locating games fast,
3. reducing the time spent reading configuration before play.

Design implication for Agent Town:

1. `Quick Seat` or equivalent join/create action must dominate the live lobby,
2. schedule and season are secondary destinations,
3. policy, wallet, and identity details should not block the first action.

### 3.2 The table must be action-first

Mature poker clients keep the table visually centered on:

1. current hand state,
2. bet or act controls,
3. timer/turn pressure,
4. seat identity and stack context.

They do not ask the player to scan a long report before acting.

Design implication for Agent Town:

1. the default table should show current hand, action controls, and a minimal context strip first,
2. team notes, study, disputes, seat movement, and policy controls should not sit at full weight in the first read,
3. if advanced detail exists, it must be explicitly opened.

### 3.3 Notes and stats belong in secondary surfaces

PokerStars release notes explicitly place player notes and stats in secondary locations such as the chat box or a notes tab, not in the main action zone.

Design implication for Agent Town:

1. rich analysis, notebook detail, opponent notes, provider metadata, and model/service context should not crowd the default table,
2. those details can exist in:
   - an advanced drawer,
   - a details sheet,
   - a study mode,
   - structured hidden support metadata for the LLM.

### 3.4 Tournament browsing must prioritize events, not tooling

Official PokerStars tournament work focuses on:

1. helping players find the right event,
2. reducing friction around registration,
3. making event discovery simpler than admin/configuration mechanics.

Design implication for Agent Town:

1. schedule should first feel like a clean event calendar,
2. recurring templates and admin authoring must be pushed behind the primary player layer,
3. the human default view should read as “what can I join next?” not “how is the system configured?”

### 3.5 Simplicity does not mean low data fidelity

Mature poker products still expose:

1. notes,
2. player stats,
3. filters,
4. tournament details,
5. advanced settings,

but they do so without forcing every user to parse them on every screen.

Design implication for Agent Town:

1. rich state may stay available,
2. default human UI must stay sparse,
3. LLM-accessible context may remain rich and structured,
4. advanced human detail must be intentional and opt-in.

## 4. Agent Town Translation

These are now binding design rules.

### 4.0 One Source, Two Projections

The useful architectural idea from `tla-precheck` is:

1. one source of truth,
2. multiple projections from that same source,
3. no drift between them.

For poker design, that becomes:

1. one underlying structured game and support state,
2. one dead-simple projection for the human default UI,
3. one richer projection for the LLM and explicit advanced views,
4. no divergence where the human view and LLM view imply different truths about the same state.

Design implication:

1. simplification should not mean inventing a second reduced data model,
2. advanced and LLM-facing detail should derive from the same canonical route state,
3. the human default route is a projection choice, not a different truth.

### 4.1 Dead-Simple Default

For player routes, the default view should usually show only:

1. one primary action group,
2. one compact state strip,
3. one optional AI helper entry point,
4. one short supporting explanation if needed.

Anything beyond that should be demoted.

### 4.2 LLM-Rich Secondary Layer

The LLM is assumed to be present with the user.

Therefore:

1. we do not need to surface every metric and explanation in the primary UI,
2. richer structured context should remain easy for the LLM to access,
3. human users should be able to ask the LLM for explanation instead of reading a wall of UI.

Preferred implementation forms:

1. structured hidden support metadata,
2. advanced details drawers,
3. explicit `details` or `advanced` modes,
4. route-specific study or review views.

### 4.3 Advanced Is Explicit

Advanced detail is allowed, but only when:

1. it is visibly secondary,
2. it is hidden or collapsed by default on player routes,
3. it does not push the main action out of the first read,
4. it does not compete with the action plane.

### 4.4 International Simplicity

For English and Simplified Chinese:

1. labels must stay short in default mode,
2. longer descriptive text belongs in help or advanced layers,
3. the UI must not assume familiarity with AI, LLM, agent, model, or provider vocabulary.

### 4.5 Voice Future, Not Voice Clutter

Future multilingual voice support is important, but:

1. it should not add visible clutter now,
2. only structural slots should be reserved,
3. voice must inherit the same dead-simple default mode later.

## 5. What Must Change In The Existing Design Plan

The current plan must now be interpreted with a stricter simplicity filter:

1. lobby must compress into a join-first surface,
2. live table must demote most support panels out of the default read,
3. schedule must act like an event calendar first,
4. season must stay ranking-first and compact,
5. centaur must feel ritual-simple, not like a dense dashboard,
6. operator detail must never leak into the normal player default view.

## 6. Future Test Implications

The next design phase should add deterministic tests for:

1. default player screens not exposing too many full-weight sections,
2. advanced/detail surfaces being collapsed or absent by default,
3. primary action remaining visible while support detail is hidden,
4. LLM/support metadata existing without visual clutter,
5. Chinese default mode remaining compact and action-first.

## 7. Final Rule

If a design change adds visible information to the default player route, the burden of proof is on that change.

Default visible complexity should be treated as a regression unless it clearly improves the next action.
