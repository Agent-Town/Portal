# Poker Play Design v1 Test Matrix

Status: Draft test matrix  
Date: 2026-03-16  
Depends on: [03_poker_play_design_v1_tdd_spec.md](./03_poker_play_design_v1_tdd_spec.md)

This matrix translates every major finding from the earlier audit into a deterministic test target.

## 1. Route and Seed Inventory

| Surface | Seed / setup | Existing route |
|---|---|---|
| Live lobby | seeded seated cash table or empty live tables | `/poker/play?embed=1` |
| Live cash table | `pkt_play_cash_01` with two seated players | `/poker/play/tables/:tableId?embed=1` |
| Tournament schedule | `schedule_calendar_story` | `/poker/play/schedule?embed=1` |
| Hand review | `history_results_story` | `/poker/play/hands/:handId/review?embed=1` |
| Operator review | `director_series_scheduled_break_ready` | `/poker/play/tables/:tableId?embed=1` with admin token |
| Native season | `economy_native_season_story` | `/poker/play/seasons/native/:seasonId?embed=1` |
| Public rail | existing rail seeded tournament series | `/poker/play/rail/series/:seriesId?embed=1` |
| Centaur | existing centaur verify/join seeded flow | `/poker/centaur/tournaments/:tournamentId?embed=1` |

## 2. Viewport Matrix

Every design phase must capture and assert:

| Viewport | Width | Height |
|---|---:|---:|
| Mobile | 390 | 844 |
| Tablet | 834 | 1112 |
| Desktop | 1440 | 1200 |

## 3. Finding-to-Test Map

## F-01 - Live table primary action is buried

- Problem:
  - `Submit Action` appears too late in the page on mobile.
- Seed:
  - seated cash table with acting state
- Tests:
  - `e2e/306_poker_design_live_table_priority_ui.spec.js`
  - `e2e/307_poker_design_live_table_mobile_action_ui.spec.js`
- Assertions:
  - `Submit Action` section top is above `Seat Thread` section top
  - `Submit Action` section is within the initial viewport when the acting seat is the viewer
  - no horizontal overflow

## F-02 - Lobby hierarchy is inverted

- Problem:
  - `Eligibility` and `Poker Policy` compete with `Quick Seat`.
- Seed:
  - default live lobby state
- Tests:
  - `e2e/302_poker_design_lobby_hierarchy_ui.spec.js`
  - `e2e/303_poker_design_lobby_responsive_ui.spec.js`
- Assertions:
  - quick seat section is first major section after the intro
  - live table list appears before policy
  - policy is visually and structurally secondary

## F-03 - Schedule mixes player and admin goals

- Problem:
  - schedule admin appears too early and too loudly.
- Seed:
  - `schedule_calendar_story`
- Tests:
  - `e2e/304_poker_design_schedule_hierarchy_ui.spec.js`
  - `e2e/305_poker_design_schedule_responsive_ui.spec.js`
- Assertions:
  - scheduled event cards appear before recurring templates and admin controls
  - register or waitlist controls are visible before admin form controls

## F-04 - Button roles are visually collapsed

- Problem:
  - navigation, commit, and destructive controls share one visual family.
- Seed:
  - live table and operator review states
- Tests:
  - `e2e/308_poker_design_button_roles_contract.spec.js`
  - `e2e/312_poker_design_operator_destructive_group_ui.spec.js`
- Assertions:
  - primary, secondary, nav, and danger roles map to distinct classes or role markers
  - destructive controls appear in a dedicated group

## F-05 - Review feels like a pile of forms

- Problem:
  - summary and replay do not visually outrank notebook forms.
- Seed:
  - `history_results_story`
- Tests:
  - `e2e/309_poker_design_hand_review_layout_ui.spec.js`
  - `e2e/310_poker_design_hand_review_responsive_ui.spec.js`
- Assertions:
  - result summary appears before notebook form
  - action line and board appear before study form
  - on desktop, notebook and opponent notes may occupy a secondary rail or lower-priority column

## F-06 - Operator actions are risky to parse

- Problem:
  - destructive and neutral operator controls look too similar.
- Seed:
  - `director_series_scheduled_break_ready`
- Tests:
  - `e2e/311_poker_design_operator_hierarchy_ui.spec.js`
  - `e2e/312_poker_design_operator_destructive_group_ui.spec.js`
- Assertions:
  - state summary appears above intervention controls
  - `Close + Refund` and `Cancel Series + Refund` appear inside destructive cluster
  - export and inspection actions are outside destructive cluster

## F-07 - Rail is not visually distinct enough

- Problem:
  - public rail risks feeling like a player screen.
- Seed:
  - existing public rail series flow
- Tests:
  - `e2e/313_poker_design_rail_distinction_ui.spec.js`
- Assertions:
  - no player-only action groups are rendered
  - rail layout is lighter than player table layout

## F-08 - Native season is not ranking-first

- Problem:
  - season screen uses too much generic card framing.
- Seed:
  - `economy_native_season_story`
- Tests:
  - `e2e/314_poker_design_native_season_ui.spec.js`
- Assertions:
  - leaderboard summary remains compact
  - ranking rows are the visual focus

## F-09 - Centaur does not feel distinct enough

- Problem:
  - verification, discussion, and commitment are not strongly separated.
- Seed:
  - centaur deterministic flow
- Tests:
  - `e2e/315_poker_design_centaur_hierarchy_ui.spec.js`
- Assertions:
  - countdown is visually prominent
  - discussion area is distinct from action lock area
  - verify/join state and live-hand state feel like separate phases

## F-10 - Focus and disabled states are incomplete

- Problem:
  - poker-specific focus and disabled styling are missing.
- Tests:
  - `e2e/316_poker_design_focus_states_contract.spec.js`
  - `e2e/317_poker_design_disabled_states_ui.spec.js`
- Assertions:
  - keyboard focus ring is visible
  - disabled buttons differ clearly from enabled buttons

## F-11 - Empty/loading/error states are weak

- Problem:
  - many routes rely on plain text and status line only.
- Tests:
  - `e2e/318_poker_design_empty_loading_error_ui.spec.js`
  - `e2e/324_poker_design_status_line_ui.spec.js`
- Assertions:
  - each route has a dedicated empty state container or layout
  - loading state does not appear as only raw status text
  - status line remains supportive, not primary

## F-12 - Spacing rhythm and composition are inconsistent

- Problem:
  - everything is the same card with the same visual weight.
- Tests:
  - `e2e/319_poker_design_spacing_rhythm_contract.spec.js`
  - `e2e/321_poker_design_tablet_composition_ui.spec.js`
  - `e2e/322_poker_design_desktop_two_column_ui.spec.js`
- Assertions:
  - layout uses route-specific grouping
  - tablet and desktop compositions are intentionally different where required

## F-13 - Mobile overflow and compression risk

- Problem:
  - current responsive handling is too shallow.
- Tests:
  - `e2e/320_poker_design_no_horizontal_overflow_ui.spec.js`
- Assertions:
  - no horizontal overflow at 390px
  - buttons and controls remain readable and tappable

## F-14 - Contrast and motion are unspecified

- Problem:
  - premium polish work lacks measurable gates.
- Tests:
  - `e2e/323_poker_design_contrast_contract.spec.js`
  - `e2e/325_poker_design_motion_contract.spec.js`
- Assertions:
  - contrast meets token expectations
  - motion rules only apply to approved surfaces and remain minimal

## F-15 - Beginner users may not understand the AI framing

- Problem:
  - player-facing surfaces assume too much AI vocabulary.
- Seed:
  - live lobby, live table, and centaur
- Tests:
  - `e2e/326_poker_design_beginner_copy_ui.spec.js`
  - `e2e/331_poker_design_international_persona_ui.spec.js`
- Assertions:
  - primary actions remain understandable without AI jargon
  - teammate/help labels outrank provider or model metadata

## F-19 - Default player routes are still too dense

- Problem:
  - the current redesign still shows too many full-weight sections in the default player view.
- Seed:
  - lobby, live table, schedule, season, centaur
- Tests:
  - `e2e/332_poker_design_lobby_dead_simple_default_ui.spec.js`
  - `e2e/336_poker_design_quick_seat_compact_default_ui.spec.js`
  - `e2e/337_poker_design_live_table_compact_list_ui.spec.js`
  - `e2e/334_poker_design_schedule_dead_simple_default_ui.spec.js`
  - `e2e/338_poker_design_season_compact_default_ui.spec.js`
  - `e2e/339_poker_design_centaur_dead_simple_default_ui.spec.js`
- Assertions:
  - the default route exposes one dominant action plane
  - dense support detail is not full-weight in the first read

## F-20 - Rich detail is not yet clearly gated behind advanced surfaces

- Problem:
  - too much useful but non-essential information remains visible by default.
- Seed:
  - live table, schedule, season
- Tests:
  - `e2e/333_poker_design_lobby_advanced_detail_gate_ui.spec.js`
  - `e2e/335_poker_design_schedule_advanced_detail_gate_ui.spec.js`
- Assertions:
  - advanced detail is collapsed, hidden, or moved to explicit secondary surfaces
  - the player can act without reading dense support sections

## F-21 - LLM-friendly context may be lost if visible clutter is reduced

- Problem:
  - simplification must not mean removing useful structured context entirely.
- Seed:
  - lobby, live table, centaur, study-enabled table
- Tests:
  - `e2e/333_poker_design_lobby_advanced_detail_gate_ui.spec.js`
  - `e2e/335_poker_design_schedule_advanced_detail_gate_ui.spec.js`
- Assertions:
  - rich support metadata still exists in machine-readable or explicit advanced form
  - the default visible layout stays cleaner than the machine or context layer
  - overlapping facts remain consistent between the human-default and advanced or machine-readable projections

## F-22 - Player routes risk leaking operator or admin density

- Problem:
  - player surfaces can still inherit too much admin or system detail.
- Seed:
  - live table, schedule
- Tests:
  - `e2e/335_poker_design_schedule_advanced_detail_gate_ui.spec.js`
- Assertions:
  - player default routes do not foreground admin or operator surfaces
  - admin controls remain clearly secondary or absent outside explicit operator states

## F-23 - Chinese default mode must stay simple, not just unbroken

- Problem:
  - localization resilience alone is not enough; the simplified default layout must stay compact in Chinese too.
- Seed:
  - lobby, live table, centaur
- Tests:
  - `e2e/340_poker_design_chinese_simple_default_ui.spec.js`
- Assertions:
  - default Chinese routes remain action-first and compact
  - localized detail does not force dense fallback composition

## F-16 - Simplified Chinese and localized expansion are not yet validated

- Problem:
  - layouts have not yet been checked against Chinese and longer localized strings.
- Seed:
  - live table, schedule, native season
- Tests:
  - `e2e/327_poker_design_cjk_layout_ui.spec.js`
  - `e2e/328_poker_design_localized_expansion_ui.spec.js`
- Assertions:
  - no clipped or overlapping primary actions
  - mixed-script rows remain readable

## F-17 - Provider and service references may become too prominent

- Problem:
  - future design work could accidentally make provider labels central.
- Seed:
  - live table and centaur
- Tests:
  - `e2e/329_poker_design_provider_neutral_ui.spec.js`
- Assertions:
  - provider/model labels appear only in supporting containers
  - main action hierarchy remains game-first

## F-18 - Voice-ready structure is not yet reserved

- Problem:
  - discussion and action-entry surfaces could require structural redesign later.
- Seed:
  - live table and centaur
- Tests:
  - `e2e/330_poker_design_voice_ready_layout_contract.spec.js`
- Assertions:
  - future voice slot hooks exist near discussion/action inputs
  - dormant voice-ready structure does not displace primary actions

## 4. Test Authoring Guidance

When future agents implement the reserved design tests, prefer:

1. section order assertions using `data-poker-section`,
2. role assertions using `data-action-role`,
3. bounding-box visibility checks for primary actions,
4. computed-style assertions for button role differences,
5. screenshot snapshots only after semantic assertions already exist.

Do not rely only on full-page snapshot diffs.

## 5. Exit Condition

All major findings from the earlier audit are considered covered only when every `F-*` item above has:

1. a passing test,
2. a linked implementation phase,
3. a doc entry in [progress.txt](./progress.txt) and [LESSONS.md](./LESSONS.md) once implemented.
