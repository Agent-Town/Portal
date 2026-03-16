# Poker Design TLA+

This folder formalizes the poker design logic that should stay true even when the UI is redesigned.

It is intentionally **not** trying to formalize:

1. typography taste,
2. spacing aesthetics,
3. color emotion,
4. motion feel.

Those still belong to the design system, screenshots, and Playwright UI tests.

What TLA+ is used for here:

1. one canonical route state,
2. dead-simple human projection,
3. richer advanced or LLM projection,
4. role and capability gating,
5. default-hidden advanced detail,
6. ordering rules for dominant vs deferred sections,
7. invariants that future agents should not break by accident.

## Files

1. [PokerDesignProjection.tla](./PokerDesignProjection.tla)
   - canonical projection model for poker design logic
2. [PokerDesignProjection.cfg](./PokerDesignProjection.cfg)
   - TLC config with the core invariants

## What The Model Covers

The model currently formalizes:

1. route set:
   - lobby
   - schedule
   - live table
   - hand review
   - native season
   - rail series
   - centaur table
2. role set:
   - player
   - admin
   - rail
3. locale set:
   - English
   - Simplified Chinese
4. voice-ready structural mode:
   - reserved
   - off
5. visibility rules for:
   - simple panels
   - admin-only panels
   - advanced drawers
6. fact-projection rules for:
   - simple human view
   - advanced human view
   - LLM-rich view

## Core Invariants

The current TLC config checks these:

1. `TypeOK`
2. `PrimaryVisible`
3. `DominantBeforeDeferred`
4. `NoAmbientAdvancedByDefault`
5. `AdvancedPanelsRequireExplicitOpen`
6. `AdminPanelsGated`
7. `LocaleDoesNotChangeVisibility`
8. `VoiceModeDoesNotChangeVisibility`
9. `ProjectionFactSubset`
10. `NoProjectionDrift`

These map directly to the poker design rules:

1. the user should always see the right next action,
2. advanced detail should never leak into the default player view,
3. admin controls must not appear on normal player routes,
4. changing locale must not change structural visibility,
5. richer LLM or advanced projections must come from the same canonical state instead of a second truth.

Latest validation:

1. TLC ran clean on 2026-03-16 against `PokerDesignProjection.tla` and `PokerDesignProjection.cfg`.

## How Future Agents Should Use It

Before implementing a design change that affects:

1. section order,
2. detail drawers,
3. admin gating,
4. locale-dependent structure,
5. voice-ready structure,
6. simple vs advanced projection,

the agent should:

1. update `PokerDesignProjection.tla` if the route logic changed,
2. update the related design docs in `design/`,
3. update or add deterministic Playwright design tests,
4. run TLC if `tla2tools.jar` is available,
5. then implement the UI change.

## Running TLC

This repo does not currently vendor `tla2tools.jar`.

If the tool is available locally, run:

```bash
java -cp tla2tools.jar tlc2.TLC design/tla/PokerDesignProjection.tla -config design/tla/PokerDesignProjection.cfg
```

If the tool is not available, the TLA+ files still serve as the canonical formal contract for future agentic work.

## Relationship To Playwright

TLA+ and Playwright do different jobs:

1. TLA+ proves the projection logic is coherent.
2. Playwright checks that the actual DOM and rendered UI obey that logic.

Both are required for a safe design program in this repo.
