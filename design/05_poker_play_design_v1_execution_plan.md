# Poker Play Design v1 Execution Plan

Status: Draft execution plan  
Date: 2026-03-16  
Depends on: [01_poker_play_design_v1_implementation_pack.md](./01_poker_play_design_v1_implementation_pack.md), [02_poker_play_design_v1_backlog.md](./02_poker_play_design_v1_backlog.md), [03_poker_play_design_v1_tdd_spec.md](./03_poker_play_design_v1_tdd_spec.md), [04_poker_play_design_v1_audit_baseline.md](./04_poker_play_design_v1_audit_baseline.md)

This document answers the practical question: how should the earlier design findings be implemented in the repo, in order, without changing functionality?

It is intentionally concrete. Future agents should use this as the implementation playbook for the next design session.

## 1. Working Assumptions

1. The current branch already contains the required poker functionality.
2. Design work must preserve all route semantics and all API calls.
3. Existing IDs, button meanings, and form submission behavior should remain stable unless the corresponding tests are updated in the same phase.
4. The current primary implementation seam is still:
   - [public/poker.html](../public/poker.html)
   - [public/poker.js](../public/poker.js)
5. Shared global styling remains in [public/styles.css](../public/styles.css), but poker-specific styling can be isolated into a dedicated stylesheet if approved.
6. Initial design validation must include beginner users and English plus Simplified Chinese overlays.

## 2. Recommended Implementation Order

Do not redesign individual screens first. Do this in order:

1. establish poker-specific tokens and structural wrapper hooks,
2. separate button roles and interaction states,
3. fix screen hierarchy for lobby and schedule,
4. fix live table composition,
5. fix review, rail, and season,
6. fix operator and centaur,
7. finish accessibility, loading, empty, and motion states,
8. close beginner-copy, localization, provider-neutral, and voice-ready gaps before declaring the design system stable.

This order matters because otherwise later phases will keep fighting inconsistent primitives.

## 3. File Ownership and Expected Change Surface

## 3.1 Primary files

- [public/poker.html](../public/poker.html)
- [public/poker.js](../public/poker.js)
- [public/styles.css](../public/styles.css)

## 3.2 Design docs to update when a phase lands

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md)
- [APP_FLOW.md](./APP_FLOW.md)
- [PRD.md](./PRD.md)
- [LESSONS.md](./LESSONS.md)
- [progress.txt](./progress.txt)

## 3.3 Tests expected to change or be added

Reserved design test block:

- `e2e/300` through `e2e/331`

Existing behavior tests likely to remain important:

- [e2e/177_poker_play_table_ui.spec.js](../e2e/177_poker_play_table_ui.spec.js)
- [e2e/276_poker_play_schedule_calendar_ui.spec.js](../e2e/276_poker_play_schedule_calendar_ui.spec.js)
- [e2e/269_poker_play_post_hand_review_ui.spec.js](../e2e/269_poker_play_post_hand_review_ui.spec.js)
- [e2e/295_poker_play_tournament_series_breaks_ui.spec.js](../e2e/295_poker_play_tournament_series_breaks_ui.spec.js)
- [e2e/298_poker_play_native_season_ui.spec.js](../e2e/298_poker_play_native_season_ui.spec.js)
- [e2e/204_poker_play_rail_series_ui.spec.js](../e2e/204_poker_play_rail_series_ui.spec.js)
- [e2e/168_centaur_poker_table.spec.js](../e2e/168_centaur_poker_table.spec.js)

## 4. Phase D0 - Foundation and Design Hooks

Purpose:

1. remove ambiguity from the poker shell,
2. make route-specific styling possible,
3. make later layout phases safer.

## 4.1 Required implementation tasks

### Task D0.1 - Normalize poker tokens

Files:

- [public/poker.html](../public/poker.html)
- [public/styles.css](../public/styles.css)

Work:

1. replace local poker hardcoded values with token-backed values from [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md),
2. stop relying on inherited global heading colors,
3. align typography, border, and radius values to the new system.

Notes:

1. If approved, poker-specific CSS should move out of the inline `<style>` block into a dedicated `public/poker.css` file linked from [public/poker.html](../public/poker.html).
2. If extraction is deferred, the token migration still has to happen inside the current inline stylesheet.

### Task D0.2 - Add route-level design hooks

Files:

- [public/poker.html](../public/poker.html)
- [public/poker.js](../public/poker.js)

Work:

1. add a root route hook like `data-poker-view` or equivalent screen class to the shell,
2. tag route sections with consistent wrappers, for example:
   - `data-poker-section="identity"`
   - `data-poker-section="quick-seat"`
   - `data-poker-section="live-tables"`
   - `data-poker-section="current-hand"`
   - `data-poker-section="submit-action"`
   - `data-poker-section="operator-review"`
3. tag action groups by role:
   - `data-action-role="primary"`
   - `data-action-role="secondary"`
   - `data-action-role="navigation"`
   - `data-action-role="destructive"`

Why:

Future CSS and Playwright assertions need stable structural hooks instead of relying on text search only.

### Task D0.3 - Add button role classes

Files:

- [public/poker.html](../public/poker.html)
- [public/poker.js](../public/poker.js)

Work:

1. split the current shared `.pokerButton` styling into explicit role families,
2. stop styling navigation links as if they are commit buttons,
3. create distinct destructive actions.

Minimum role classes:

1. `.pokerButtonPrimary`
2. `.pokerButtonSecondary`
3. `.pokerButtonNav`
4. `.pokerButtonDanger`

### Task D0.4 - Add missing interactive states

Files:

- [public/poker.html](../public/poker.html)

Work:

1. poker-specific `:focus-visible`,
2. poker-specific `:hover`,
3. poker-specific `:disabled`,
4. poker-specific pressed state.

Do not rely on generic app button styles for poker once the poker role system exists.

### Task D0.5 - Add copy and locale resilience hooks

Files:

- [public/poker.js](../public/poker.js)
- [public/poker.html](../public/poker.html)

Work:

1. add stable wrappers for player-help, provider metadata, and future voice-ready input slots,
2. ensure screen-level headings and action bars can accept longer localized labels,
3. keep provider/model labels visually separate from the main game instruction.

Why:

Future design tests need stable structural hooks for beginner-copy, Chinese-layout, and voice-ready assertions.

## 4.2 Acceptance target

1. token contract exists,
2. route sections are targetable,
3. button roles are distinguishable without reading labels,
4. mobile, tablet, and desktop baseline screenshots still render correctly,
5. locale overlay screenshots remain stable for affected screens.

## 5. Phase D1 - Lobby and Schedule Hierarchy

Purpose:

1. make player actions obvious before support metadata,
2. reduce the long-form, card-stack feeling.

## 5.1 Lobby implementation

Primary seam:

- [public/poker.js](../public/poker.js) `loadPlayLobby()`

Current render order:

1. Eligibility
2. Poker Policy
3. Quick Seat
4. Series
5. Live Tables

Target render order:

1. Quick Seat
2. Live Tables
3. Tournament Series
4. Eligibility / account snapshot
5. Poker Policy

Implementation notes:

1. keep all existing data, do not drop features,
2. compress `Eligibility` into a lighter metric strip,
3. compress `Poker Policy` into a smaller supporting section,
4. visually elevate the primary join/create button,
5. treat schedule, season, rail, and results links as navigation, not as primary actions,
6. explain AI assistance in plain language if referenced at all,
7. make sure localized labels still preserve quick-seat dominance.

### Lobby subcomponents to introduce

Recommended helpers in [public/poker.js](../public/poker.js):

1. `renderPokerScreenIntro()`
2. `renderPokerMetricStrip()`
3. `renderPokerActionGroup()`
4. `renderPokerSectionShell()`

These are structural rendering helpers, not new features.

## 5.2 Schedule implementation

Primary seam:

- [public/poker.js](../public/poker.js) `loadPlaySchedule()`

Current render order:

1. Schedule Snapshot
2. Schedule Admin
3. Recurring Templates
4. Day cards

Target render order:

1. Schedule Snapshot
2. Upcoming day cards
3. Recurring Templates
4. Schedule Admin

Implementation notes:

1. player-facing event cards should lead the route,
2. admin controls should be clearly contained and visually lower priority,
3. recurring templates should read like infrastructure, not the main user task,
4. register/waitlist actions must look stronger than timeline or lobby links,
5. event labels and break/schedule copy must remain legible in Simplified Chinese.

## 5.3 Acceptance target

1. a first-time player can identify where to join from the top of the screen,
2. admin controls no longer dominate the schedule page,
3. no horizontal overflow on mobile.

## 6. Phase D2 - Live Table Redesign

Purpose:

1. make acting state and legal action obvious,
2. remove the need to scan or scroll through secondary sections before acting.

Primary seam:

- [public/poker.js](../public/poker.js) `renderPlayTableCards()`

## 6.1 Current problem

The function currently renders a long, flat sequence of equal-weight sections including:

1. table summary,
2. seat state,
3. seat movement,
4. auto-act,
5. table review,
6. series director,
7. study preview,
8. current hand,
9. worker seat agent,
10. review form,
11. seat thread,
12. submit action,
13. operator review.

This is too flat. The user’s next move is buried.

## 6.2 Target composition

### Mobile

1. table summary strip
2. current hand
3. submit action
4. your seat
5. worker seat agent
6. seat thread
7. study preview
8. auto-act
9. seat movement and cash controls
10. review
11. operator review

### Tablet/Desktop

Preferred two-plane layout:

Primary column:

1. current hand
2. submit action
3. your seat
4. seat thread

Supporting rail:

1. summary strip
2. worker seat agent
3. study preview
4. auto-act
5. seat movement / cash controls
6. review

Operator view may use a distinct admin composition, but still needs:

1. state summary first,
2. safe controls second,
3. destructive controls isolated,
4. disputes and flags below controls.

## 6.3 Required implementation tasks

### Task D2.1 - Split table rendering into structural helpers

Recommended helper split in [public/poker.js](../public/poker.js):

1. `renderPlayTableHero()`
2. `renderPlayCurrentHandSection()`
3. `renderPlayActionSection()`
4. `renderPlaySeatSection()`
5. `renderPlayAgentSection()`
6. `renderPlayThreadSection()`
7. `renderPlayStudySection()`
8. `renderPlaySeatOpsSection()`
9. `renderPlayReviewSection()`
10. `renderPlayOperatorSection()`

This is still presentation-only.

### Task D2.2 - Add sticky mobile action zone

Files:

- [public/poker.js](../public/poker.js)
- [public/poker.html](../public/poker.html)

Work:

1. keep functionality identical,
2. use the existing legal action controls,
3. allow the primary action group to remain visible or quickly reachable at mobile widths.

If a true sticky bar proves too invasive without functional risk, fallback to a top-placed action block that remains in the first viewport.

### Task D2.3 - Promote shove and time bank appropriately

Files:

- [public/poker.js](../public/poker.js)

Work:

1. keep the existing shove and time-bank controls,
2. make them visually subordinate to the main action submit path,
3. prevent them from blending into utility links.

### Task D2.4 - Reframe thread and worker proposal

Files:

- [public/poker.js](../public/poker.js)

Work:

1. `Worker Seat Agent` should read as advisory,
2. `Seat Thread` should read as collaboration,
3. neither should outrank the live action form when the seat is acting.

## 6.4 Acceptance target

1. `Submit Action` is visible in the first viewport on mobile acting state,
2. no secondary section outranks the action section,
3. the table feels faster to read at every viewport.

## 7. Phase D3 - Review, Season, and Rail

Purpose:

1. turn analysis routes into clear reading surfaces,
2. separate player and spectator tone.

## 7.1 Hand Review implementation

Primary seam:

- [public/poker.js](../public/poker.js) `loadPlayHandReview()`

Current order is linear and flat.

Target order:

1. screen intro and export utilities
2. result summary
3. action line
4. board and pot
5. human note
6. agent note
7. lesson tags
8. notebook form
9. notebook history
10. opponent notes

Desktop enhancement:

1. summary + replay in primary column,
2. notebook + opponent notes in secondary column.

### Task D3.1 - Review shell

Introduce route-specific wrapper classes so review is not styled like a lobby or live table.

### Task D3.2 - Export utility demotion

Export buttons should remain available but should not visually compete with the reading flow.

## 7.2 Native season implementation

Primary seam:

- [public/poker.js](../public/poker.js) season renderer

Target:

1. strong leaderboard hierarchy,
2. lighter summary strip,
3. reduced card noise.

## 7.3 Rail implementation

Primary seam:

- [public/poker.js](../public/poker.js) rail table and rail series renderers

Target:

1. rail feels lighter than player mode,
2. no player-private control styling remains,
3. observational navigation is clear.

## 7.4 Acceptance target

1. review feels like a study screen,
2. season feels like a leaderboard,
3. rail clearly differs from player mode.

## 8. Phase D4 - Operator and Centaur

Purpose:

1. make intervention flows safe,
2. make centaur feel distinct and intentional.

## 8.1 Operator implementation

Primary seam:

- [public/poker.js](../public/poker.js) operator section inside `renderPlayTableCards()`

Required grouping:

1. review summary
2. neutral director controls
3. export / inspection controls
4. destructive controls
5. disputes
6. integrity flags
7. audit events

Implementation notes:

1. `Pause Table`, `Resume Table`, `Advance Blinds`, `Start Break`, `End Break`, `Move Seat` are not equal to `Close + Refund` or `Cancel Series + Refund`,
2. destructive controls require a dedicated visual group with additional spacing and danger token usage,
3. export actions should be visually lighter than intervention actions.

## 8.2 Centaur implementation

Primary seam:

- centaur route renderer in [public/poker.js](../public/poker.js)

Target phases visible in the UI:

1. verify
2. join
3. discuss
4. lock shared action

Implementation notes:

1. countdown should be more prominent,
2. discussion should be clearly separate from action commitment,
3. verification and OIL state should support the ritual, not dominate it forever after join.

## 8.3 Acceptance target

1. operator actions are safer to parse,
2. centaur feels like a distinct human+AI mode,
3. focus, disabled, empty, loading, and error states are complete.

## 9. State Design Work That Must Happen

These findings were in the earlier audit and must be documented as explicit tasks:

1. add route-specific loading treatments,
2. add route-specific empty states,
3. add route-specific error states,
4. replace status-line-only guidance with inline structural guidance where appropriate,
5. add visible focus and disabled states for poker controls,
6. reduce decorative background competition on mobile.

## 10. Suggested Commit Sequence

Future agents should not try to land everything in one change.

Recommended commit sequence:

1. design tokens and shell hooks
2. button roles and interaction states
3. lobby and schedule hierarchy
4. live table mobile-first redesign
5. desktop/tablet live table composition
6. review and season refinement
7. operator and centaur refinement
8. accessibility, loading, empty, error, and motion pass

## 11. Definition of Done

A phase is done only when:

1. the corresponding design docs are updated,
2. the corresponding design tests pass,
3. mobile, tablet, and desktop captures look intentionally composed,
4. functionality remains unchanged.
