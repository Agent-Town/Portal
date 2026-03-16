# Poker Play Design v1 TDD Spec

Status: Draft  
Version: 1.0  
Audience: frontend engineers, design-system engineers, QA automation engineers, product designers, agentic AI builders  
Depends on: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md), [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md), [PRD.md](./PRD.md), [01_poker_play_design_v1_implementation_pack.md](./01_poker_play_design_v1_implementation_pack.md), [02_poker_play_design_v1_backlog.md](./02_poker_play_design_v1_backlog.md), [specs/02_api_contract.md](../specs/02_api_contract.md), [AGENTS.md](../AGENTS.md)  
Goal: make poker design implementation executable through deterministic, agent-friendly, test-driven milestones.
Formal methods companion: [08_poker_play_design_v1_formal_methods.md](./08_poker_play_design_v1_formal_methods.md), [tla/PokerDesignProjection.tla](./tla/PokerDesignProjection.tla)

Implementation constraints:

1. No functionality changes.
2. Default design tests must remain deterministic and seeded.
3. Mobile, tablet, and desktop are mandatory test targets.
4. Design assertions must use observable criteria, not subjective prose alone.
5. Screenshot review is required, but DOM and computed-style assertions must carry as much of the acceptance burden as possible.
6. If a design change alters visibility, gating, or projection logic, the TLA+ model must be updated before the UI implementation is considered complete.

## 1. Executive Summary

This phase turns poker design work into measurable milestones:

1. baseline and tokens,
2. hierarchy,
3. responsive composition,
4. button role clarity,
5. accessibility and state design,
6. final route-specific refinement,
7. beginner-first and cross-market resilience.

Reserved Playwright block:

1. `300` to `331`
2. `300` to `325` cover the original design-hierarchy and accessibility program
3. `326` to `331` cover beginner-first, international, provider-neutral, and voice-ready validation
4. `332` to `340` cover the dead-simple default and LLM-rich secondary-detail program

## 2. Global Measurable Metrics

### 2.1 Hierarchy Metrics

Required for every redesigned route:

1. exactly one primary action group is visually tagged and present per screen state,
2. the primary action appears before secondary action groups in DOM order on mobile,
3. no screen renders more than one high-emphasis button family in the same section unless one is clearly destructive.

### 2.2 Responsive Metrics

Required for every route:

1. no horizontal overflow at 390px width,
2. primary route goal remains visible without zoom at mobile width,
3. tablet and desktop use different compositions where documented in [APP_FLOW.md](./APP_FLOW.md), not just wider single-column stacks.

### 2.3 Action Visibility Metrics

Required for live table and centaur:

1. active decision state shows the action area in the first viewport on mobile,
2. countdown and acting-seat context appear above the action controls,
3. submit/lock action controls are more visually prominent than thread or study controls.

### 2.4 Role Differentiation Metrics

Required for all action-heavy screens:

1. navigation, secondary, primary, and destructive controls have distinct classes,
2. destructive controls are grouped separately from neutral controls,
3. disabled controls are styled distinctly and do not resemble active controls.

### 2.5 Accessibility Metrics

Required for all routes:

1. visible `:focus-visible` state for keyboard navigation,
2. touch targets meet minimum size,
3. contrast contract passes for text and key controls,
4. status-only guidance is not the sole carrier of task-critical meaning.

### 2.6 Consistency Metrics

Required for all routes:

1. poker-specific colors come from the design tokens,
2. spacing and radius values come from the design tokens,
3. section shells and button roles remain consistent across routes.

### 2.7 Beginner-Comprehension Metrics

Required for player-facing routes:

1. the main action remains understandable without requiring AI, LLM, model, or provider vocabulary,
2. the AI teammate can be understood through plain-language labels,
3. provider or model names do not outrank the main game instruction.

### 2.8 Internationalization Metrics

Required for touched routes:

1. English and Simplified Chinese layouts remain composed,
2. no primary control is clipped or overlapped under deterministic localized expansion,
3. mixed-script rows remain readable in schedules, leaderboards, and hand state.

### 2.9 Provider-Neutral and Voice-Ready Metrics

Required for discussion and action-entry surfaces:

1. provider or service metadata appears only in supporting regions,
2. discussion and action layouts can reserve a future voice slot without changing functional order,
3. the dormant voice-ready slot does not introduce dead visual weight today.

### 2.10 Dead-Simple Default Metrics

Required for default player routes:

1. the first read should expose one dominant action cluster, not a report wall,
2. non-essential detail should be collapsed, hidden, or clearly secondary,
3. advanced, study, or operator-style detail must not compete with the primary action plane,
4. the route should still preserve richer context for the LLM or an explicit advanced view.

## 3. Test Harness Rules

1. Design tests must use the same seeded harness scenarios already available in the repo whenever possible.
2. The test harness must capture mobile, tablet, and desktop for core screens.
3. Design tests may assert:
   - DOM order,
   - control visibility,
   - bounding-box position,
   - computed style token usage,
   - presence or absence of horizontal overflow,
   - screenshot baselines.
4. Design tests must not assert on content that is intentionally variable across seeded states unless the seed is fixed.
5. Localized copy tests must use deterministic fixture overlays, not live translation services.
6. Formal design logic that can be modeled in TLA+ should be kept consistent with the Playwright contract; the TLA+ model is the logic precheck, and Playwright is the rendered-surface check.

## 4. Required Seeded States

At minimum, design tests must cover:

1. live cash table with two seated players,
2. `schedule_calendar_story`,
3. `history_results_story`,
4. `director_series_scheduled_break_ready`,
5. `economy_native_season_story`,
6. centaur table seeded through its existing deterministic UI flow,
7. localized overlay variants for English and Simplified Chinese on copy-sensitive routes.

## 5. Milestone Map

## M-D0 - Design harness and baseline

Purpose:

1. lock seeded route coverage,
2. capture baseline composition,
3. create the initial token contract.

Primary tests:

1. `e2e/300_poker_design_harness.spec.js`
2. `e2e/301_poker_design_token_contract.spec.js`

RED gate:

1. no canonical design tokens exist,
2. no stable design harness exists,
3. no baseline route matrix exists.

GREEN gate:

1. harness covers lobby, table, schedule, review, operator, native season, and centaur,
2. token contract exists,
3. baseline screenshot capture is repeatable,
4. locale overlay strategy is locked.

## M-D1 - Lobby and schedule hierarchy

Purpose:

1. make player tasks obvious before supporting metadata,
2. separate player browsing from admin authoring.

Primary tests:

1. `e2e/302_poker_design_lobby_hierarchy_ui.spec.js`
2. `e2e/303_poker_design_lobby_responsive_ui.spec.js`
3. `e2e/304_poker_design_schedule_hierarchy_ui.spec.js`
4. `e2e/305_poker_design_schedule_responsive_ui.spec.js`

Evaluation target:

1. quick seat is the top player action,
2. schedule events appear before templates and admin tooling,
3. no horizontal overflow on mobile,
4. beginner-copy and provider-neutral checks pass on lobby and schedule.

## M-D2 - Live table redesign

Purpose:

1. make the live table action-first,
2. reduce scanning friction,
3. clarify button roles.

Primary tests:

1. `e2e/306_poker_design_live_table_priority_ui.spec.js`
2. `e2e/307_poker_design_live_table_mobile_action_ui.spec.js`
3. `e2e/308_poker_design_button_roles_contract.spec.js`
4. `e2e/320_poker_design_no_horizontal_overflow_ui.spec.js`
5. `e2e/321_poker_design_tablet_composition_ui.spec.js`
6. `e2e/322_poker_design_desktop_two_column_ui.spec.js`

Evaluation target:

1. action area is visible in first viewport at mobile acting state,
2. thread and study are visually secondary,
3. destructive, navigation, and primary buttons are distinct,
4. localized labels and voice-ready structural hooks do not break action priority.

## M-D3 - Review, season, and rail

Purpose:

1. make review analytical,
2. make season ranking-first,
3. make rail observational.

Primary tests:

1. `e2e/309_poker_design_hand_review_layout_ui.spec.js`
2. `e2e/310_poker_design_hand_review_responsive_ui.spec.js`
3. `e2e/313_poker_design_rail_distinction_ui.spec.js`
4. `e2e/314_poker_design_native_season_ui.spec.js`

Evaluation target:

1. summary and replay appear before notebook forms,
2. season leaderboard rows are clearer than surrounding metadata,
3. rail visually differs from player view.

## M-D4 - Operator, centaur, and accessibility

Purpose:

1. make operator action safe-by-structure,
2. give centaur its own hierarchy,
3. complete state and accessibility design.

Primary tests:

1. `e2e/311_poker_design_operator_hierarchy_ui.spec.js`
2. `e2e/312_poker_design_operator_destructive_group_ui.spec.js`
3. `e2e/315_poker_design_centaur_hierarchy_ui.spec.js`
4. `e2e/316_poker_design_focus_states_contract.spec.js`
5. `e2e/317_poker_design_disabled_states_ui.spec.js`
6. `e2e/318_poker_design_empty_loading_error_ui.spec.js`
7. `e2e/323_poker_design_contrast_contract.spec.js`
8. `e2e/324_poker_design_status_line_ui.spec.js`
9. `e2e/325_poker_design_motion_contract.spec.js`

Evaluation target:

1. destructive controls are visually isolated,
2. centaur distinguishes discussion from commitment,
3. focus and disabled states are obvious,
4. loading and empty states are intentionally designed,
5. international and voice-ready checks pass for centaur and operator surfaces where relevant.

## M-D6 - Dead-simple default and LLM-rich secondary detail

Purpose:

1. make the default player routes feel as simple as mature poker clients,
2. stop exposing rich detail at full weight by default,
3. preserve richer context for the LLM and advanced flows without visible clutter.

Primary tests:

1. `e2e/332_poker_design_lobby_dead_simple_default_ui.spec.js`
2. `e2e/333_poker_design_lobby_advanced_detail_gate_ui.spec.js`
3. `e2e/334_poker_design_schedule_dead_simple_default_ui.spec.js`
4. `e2e/335_poker_design_schedule_advanced_detail_gate_ui.spec.js`
5. `e2e/336_poker_design_quick_seat_compact_default_ui.spec.js`
6. `e2e/337_poker_design_live_table_compact_list_ui.spec.js`
7. `e2e/338_poker_design_live_table_dead_simple_default_ui.spec.js`
8. `e2e/339_poker_design_live_table_support_detail_gate_ui.spec.js`
9. `e2e/340_poker_design_chinese_live_table_simple_default_ui.spec.js`

Evaluation target:

1. default routes are materially simpler than the prior state,
2. player routes no longer expose excessive detail at full weight,
3. richer support context remains accessible without dominating the default UI,
4. English and Simplified Chinese remain compact and action-first.

## 6. Example Deterministic Assertions

Future agents should use assertions like:

1. `Submit Action` section top is above `Seat Thread` section top at mobile width,
2. primary action button bounding box is visible without scroll on mobile acting state,
3. elements with destructive role share a dedicated class and appear in a distinct container,
4. schedule event list appears before schedule admin container in DOM order,
5. no element extends beyond `document.documentElement.clientWidth`,
6. computed color values for poker buttons map to design tokens,
7. focused buttons receive a visible outline or ring,
8. localized action labels remain within their control bounds,
9. provider labels appear in supporting metadata containers only,
10. advanced detail containers are absent, hidden, or collapsed in the default player state.

## 7. Required Screenshot Matrix

Every approved phase must capture at least:

1. lobby: mobile, tablet, desktop
2. live table: mobile, tablet, desktop
3. schedule: mobile, tablet, desktop
4. hand review: mobile, tablet, desktop
5. operator review: mobile, tablet, desktop
6. centaur: mobile, tablet, desktop once centaur phase begins
7. affected screens: English and Simplified Chinese overlays once localization-resilience work begins

## 8. Failure Policy

If a design change makes the screen prettier but violates:

1. primary action visibility,
2. responsive composition,
3. accessibility,
4. token discipline,

then the phase fails, even if the screenshots look more polished.
