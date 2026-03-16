# Poker Play Design v1 Audit Baseline

Status: Baseline audit snapshot  
Date: 2026-03-16  
Audience: future design agents, frontend engineers, QA automation engineers

This document records the starting point before any approved design implementation begins.

## 1. Source Documents Reviewed

The repo did not previously contain the exact design-document filenames requested by the design-audit prompt. This baseline was derived from:

1. [specs/00_product_story.md](../specs/00_product_story.md)
2. [specs/01_experience_flow.md](../specs/01_experience_flow.md)
3. [specs/02_api_contract.md](../specs/02_api_contract.md)
4. [specs/25_poker_play_platform_v2_scaling_implementation_pack.md](../specs/25_poker_play_platform_v2_scaling_implementation_pack.md)
5. [public/poker.html](../public/poker.html)
6. [public/poker.js](../public/poker.js)
7. [public/styles.css](../public/styles.css)

## 2. Screens Audited Live

The live app was walked at mobile, tablet, and desktop using deterministic seeded states for:

1. live lobby,
2. live cash table,
3. tournament schedule,
4. hand review,
5. operator review,
6. centaur table,
7. native season,
8. public rail series.

Local non-canonical screenshots were captured during the audit. Future agents should not depend on those local files. They should recreate the states through the seeded harness.

## 2.1 Existing Seeded UI Tests That Matter

Future agents should treat these tests as the current route-state map for design work:

1. [e2e/177_poker_play_table_ui.spec.js](../e2e/177_poker_play_table_ui.spec.js)
2. [e2e/276_poker_play_schedule_calendar_ui.spec.js](../e2e/276_poker_play_schedule_calendar_ui.spec.js)
3. [e2e/269_poker_play_post_hand_review_ui.spec.js](../e2e/269_poker_play_post_hand_review_ui.spec.js)
4. [e2e/295_poker_play_tournament_series_breaks_ui.spec.js](../e2e/295_poker_play_tournament_series_breaks_ui.spec.js)
5. [e2e/298_poker_play_native_season_ui.spec.js](../e2e/298_poker_play_native_season_ui.spec.js)
6. [e2e/204_poker_play_rail_series_ui.spec.js](../e2e/204_poker_play_rail_series_ui.spec.js)
7. [e2e/168_centaur_poker_table.spec.js](../e2e/168_centaur_poker_table.spec.js)

## 3. Current Visual System Summary

Current poker shell characteristics:

1. local dark background with gold text accents in [public/poker.html](../public/poker.html),
2. repeated rounded glass-like cards,
3. one global card pattern reused for nearly every surface,
4. minimal responsive logic,
5. no poker-specific focus, hover, or disabled state system,
6. no explicit beginner-first AI framing,
7. no documented English and Simplified Chinese layout validation,
8. no reserved structure for future voice input surfaces.

## 4. Structural Audit Findings

## 4.1 Live Lobby

Current issues:

1. `Eligibility` and `Poker Policy` lead before the main join flow,
2. the page reads like configuration before it reads like a live room,
3. quick-seat fields are long and form-heavy,
4. the route does not yet explain the AI/helpful-teammate role in beginner-safe language.

Implementation seam:

- [public/poker.js](../public/poker.js) `loadPlayLobby()`

## 4.2 Live Table

Current issues:

1. the live table is not action-first,
2. `Submit Action` sits below many equally weighted sections,
3. action urgency is diluted,
4. player, admin, study, and automation surfaces all use near-identical card treatment,
5. action labels have not yet been validated against Simplified Chinese expansion.

Implementation seam:

- [public/poker.js](../public/poker.js) `renderPlayTableCards()`

## 4.3 Schedule

Current issues:

1. admin template creation sits too early,
2. public browsing and admin authoring share the same visual treatment,
3. recurring templates are too heavy relative to near-term playable events,
4. localized schedule labels and mixed-script event rows have not been validated.

Implementation seam:

- [public/poker.js](../public/poker.js) `loadPlaySchedule()`

## 4.4 Hand Review

Current issues:

1. summary, replay, notebook, and opponent notes all use the same card weight,
2. the route reads as a pile of sections instead of a study workflow,
3. forms appear too early visually,
4. the study route does not yet distinguish plain poker learning language from AI-analysis language.

Implementation seam:

- [public/poker.js](../public/poker.js) `loadPlayHandReview()`

## 4.5 Operator Review

Current issues:

1. destructive and neutral actions visually blend,
2. there is no clear decision path through the controls,
3. the screen is dense but not meaningfully tiered.

Implementation seam:

- [public/poker.js](../public/poker.js) `renderPlayTableCards()` admin branch

## 4.6 Centaur

Current issues:

1. the centaur flow is understandable but not visually distinct enough,
2. the countdown, discussion, and commitment states are not strongly separated,
3. the ritual nature of the screen is lost in the generic poker card system,
4. no voice-ready structural reservation exists near the discussion flow.

Implementation seam:

- [public/poker.js](../public/poker.js) centaur route loader

## 5. Responsive Audit Findings

The current poker shell defines only one explicit mobile adjustment:

- [public/poker.html](../public/poker.html) `@media (max-width: 720px) { .pokerFrame { ... } }`

Observed consequence:

1. mobile mostly looks like a compressed desktop stack,
2. tablet mostly looks like a slightly wider mobile stack,
3. desktop underuses width for clearer grouping,
4. the current layouts were not designed against English and Simplified Chinese overlays.

## 6. Accessibility Audit Findings

Observed gaps:

1. poker-specific `:focus-visible` treatment is absent,
2. disabled buttons exist but have no dedicated poker design treatment,
3. loading and empty states often rely on plain text,
4. status text is overused as the route’s fallback narrative,
5. beginner-safe copy principles are not yet visible in primary action areas.

## 7. File Map For Future Design Agents

Primary files:

1. [public/poker.html](../public/poker.html)
2. [public/poker.js](../public/poker.js)
3. [public/styles.css](../public/styles.css)

Key render seams:

1. `renderCards()`
2. `loadPlayLobby()`
3. `loadPlaySchedule()`
4. `loadPlayHandReview()`
5. `renderPlayTableCards()`
6. native season renderer
7. centaur route renderer

## 8. Baseline Recommendation

Do not start with polish.

The first approved design work should focus on:

1. token discipline,
2. button role separation,
3. mobile-first reordering of the live table and lobby,
4. route-specific composition rules.
