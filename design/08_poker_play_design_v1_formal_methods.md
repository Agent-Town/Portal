# Poker Design Formal Methods

Status: Draft  
Date: 2026-03-16  
Audience: frontend engineers, design-system engineers, QA, agentic AI implementers

This document defines how formal methods fit into the poker design workflow.

## 1. Purpose

The poker design program now uses two kinds of verification:

1. **formal verification** for design logic,
2. **UI verification** for the actual rendered interface.

Formal verification is not here to prove beauty. It is here to prevent logical drift between:

1. the dead-simple human view,
2. the advanced human view,
3. the LLM-rich support projection,
4. admin-only surfaces,
5. localized route structure.

## 2. What TLA+ Should Formalize

TLA+ should be used for rules like:

1. which sections are visible on a given route,
2. which sections are visible only for admins,
3. which detail surfaces must stay hidden by default,
4. which panel must stay primary on each route,
5. which sections must appear before deferred sections,
6. how simple, advanced, and LLM-rich projections derive from one canonical route state,
7. which structural changes must remain locale-invariant,
8. which future voice-ready modes must not alter default visibility.

## 3. What TLA+ Should Not Formalize

Do not try to use TLA+ for:

1. typography hierarchy aesthetics,
2. spacing feel,
3. color taste,
4. animation quality,
5. visual premium-ness.

Those belong in:

1. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md),
2. Playwright UI tests,
3. screenshot reviews,
4. human design judgment.

## 4. Current Formal Model

The current canonical design-state model is:

1. [design/tla/PokerDesignProjection.tla](./tla/PokerDesignProjection.tla)
2. [design/tla/PokerDesignProjection.cfg](./tla/PokerDesignProjection.cfg)

That model currently formalizes:

1. route visibility logic,
2. admin gating,
3. default-hidden advanced detail,
4. dominant-before-deferred ordering,
5. simple vs advanced vs LLM fact projections,
6. locale-invariant structure,
7. voice-mode-invariant structure.

## 5. Mandatory Workflow For Future Agents

If a design change touches:

1. section order,
2. default-vs-advanced visibility,
3. admin-only visibility,
4. locale-dependent structure,
5. voice-ready structural seams,
6. projection of human vs LLM detail,

then the agent must:

1. update the TLA+ model if the logic changed,
2. update the related design docs in `design/`,
3. update or add deterministic Playwright coverage,
4. capture screenshots for the affected routes,
5. only then ship the visual implementation.

## 6. Mapping To Current Design Phases

TLA+ is most useful for:

1. D1 hierarchy,
2. D2 live-table priority,
3. D4 operator and centaur gating,
4. D5 international and voice-ready structure,
5. D6 dead-simple default plus advanced detail gating.

It is less useful for:

1. token tuning,
2. spacing refinement,
3. color polish,
4. motion polish.

## 7. Practical Rule

If a future design change can be described as:

1. “this section must always be visible,”
2. “this section must never be visible by default,”
3. “this role must not see that control,”
4. “these two projections must stay consistent,”

then it probably belongs in the TLA+ model.
