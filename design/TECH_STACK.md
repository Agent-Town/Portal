# TECH_STACK

Status: Design-facing technical constraints for poker UI work  
Date: 2026-03-16

## 1. Current Frontend Stack

1. Static HTML shell per route
2. Vanilla JavaScript rendering in [public/poker.js](../public/poker.js)
3. Inline poker-specific CSS in [public/poker.html](../public/poker.html)
4. Shared global CSS in [public/styles.css](../public/styles.css)
5. Playwright end-to-end testing

## 2. Runtime Constraints

1. Poker must work inside modal embed flows through `?embed=1`.
2. The hub worker runtime is page-scoped elsewhere in the app; poker design must not force full-page detours unnecessarily.
3. Admin state is delivered through the existing admin token mechanism.
4. Data and behavior are server-driven; design work must not require new API state to function.

## 3. What The Stack Supports Well

1. Deterministic seeded Playwright states
2. Route-specific server rendering
3. CSS tokenization
4. Semantic HTML and form controls
5. Screenshot-based regression tests
6. Deterministic locale-specific screenshot validation for seeded states

## 4. What The Stack Does Not Support Well Today

1. Component-level design isolation through a framework
2. Large-scale stateful animation systems
3. Automatic design token pipelines
4. Visual regression tooling out of the box
5. Live translation-provider dependencies in deterministic design tests

## 5. Design Implication

Future design phases should prefer:

1. CSS token discipline,
2. DOM order improvements,
3. screen-level layout classes,
4. deterministic screenshot assertions,
5. minimal but meaningful motion.

Future design phases should avoid:

1. runtime-heavy animation libraries,
2. visual changes that depend on hidden state not already present,
3. framework-style rewrites hidden inside a design task.

## 6. Test Infrastructure Available To Design Work

The repo already has deterministic seeded poker scenarios through the test harness. Design work should build on those scenarios rather than inventing new ad hoc mocks when possible.

Useful seeded states include:

1. `history_results_story`
2. `schedule_calendar_story`
3. `director_series_scheduled_break_ready`
4. `economy_native_season_story`
5. `waitlist_full_cash`
6. live seated cash table flows through `pkt_play_cash_01`

Localization and internationalization checks should use deterministic injected copy fixtures or seeded overlay strings, not live translation providers.

## 7. Required Design Discipline

1. Keep selectors stable when possible.
2. If new wrapper classes or `data-*` hooks are needed for styling or tests, add them explicitly and document them.
3. Any new visual assertions must be expressible in Playwright without live providers.
