# Poker Play Design v1 Backlog

Status: Draft design backlog  
Date: 2026-03-16  
Depends on: [01_poker_play_design_v1_implementation_pack.md](./01_poker_play_design_v1_implementation_pack.md)  
Companion TDD spec: [03_poker_play_design_v1_tdd_spec.md](./03_poker_play_design_v1_tdd_spec.md)

This backlog converts the poker design work into a sequence that future agentic AI designers and builders can implement without improvising visual intent.

## 1. Cross-Cutting Delivery Rules

1. No ticket is done until the relevant design docs and tests are updated in the same change set.
2. No ticket may change functionality.
3. No ticket may weaken modal-first poker entry.
4. No ticket may introduce new hardcoded poker-specific values outside [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
5. No ticket may land without mobile, tablet, and desktop evidence.
6. No ticket may collapse destructive and neutral actions into the same visual group.
7. No ticket may solve hierarchy by adding more decoration.

## 2. Mandatory Doc-Sync Matrix

| Changed surface | Required docs and tests |
|---|---|
| Tokens, colors, spacing, typography, button roles | `DESIGN_SYSTEM.md`, companion TDD spec |
| Layout structure or wrapper conventions | `FRONTEND_GUIDELINES.md`, companion TDD spec |
| Route-level visual order or screen purpose | `APP_FLOW.md`, `PRD.md`, companion TDD spec |
| Audit findings or recurring pitfalls | `LESSONS.md`, `progress.txt` |

## 3. Reserved Design Test Block

To avoid collisions with existing engineering tests, this program reserves:

1. `e2e/300_poker_design_harness.spec.js`
2. `e2e/301_poker_design_token_contract.spec.js`
3. `e2e/302_poker_design_lobby_hierarchy_ui.spec.js`
4. `e2e/303_poker_design_lobby_responsive_ui.spec.js`
5. `e2e/304_poker_design_schedule_hierarchy_ui.spec.js`
6. `e2e/305_poker_design_schedule_responsive_ui.spec.js`
7. `e2e/306_poker_design_live_table_priority_ui.spec.js`
8. `e2e/307_poker_design_live_table_mobile_action_ui.spec.js`
9. `e2e/308_poker_design_button_roles_contract.spec.js`
10. `e2e/309_poker_design_hand_review_layout_ui.spec.js`
11. `e2e/310_poker_design_hand_review_responsive_ui.spec.js`
12. `e2e/311_poker_design_operator_hierarchy_ui.spec.js`
13. `e2e/312_poker_design_operator_destructive_group_ui.spec.js`
14. `e2e/313_poker_design_rail_distinction_ui.spec.js`
15. `e2e/314_poker_design_native_season_ui.spec.js`
16. `e2e/315_poker_design_centaur_hierarchy_ui.spec.js`
17. `e2e/316_poker_design_focus_states_contract.spec.js`
18. `e2e/317_poker_design_disabled_states_ui.spec.js`
19. `e2e/318_poker_design_empty_loading_error_ui.spec.js`
20. `e2e/319_poker_design_spacing_rhythm_contract.spec.js`
21. `e2e/320_poker_design_no_horizontal_overflow_ui.spec.js`
22. `e2e/321_poker_design_tablet_composition_ui.spec.js`
23. `e2e/322_poker_design_desktop_two_column_ui.spec.js`
24. `e2e/323_poker_design_contrast_contract.spec.js`
25. `e2e/324_poker_design_status_line_ui.spec.js`
26. `e2e/325_poker_design_motion_contract.spec.js`

Supplemental verification lanes allowed in this phase:

1. `npm run test -- --grep "poker design"`
2. screenshot review captures using seeded states

## 4. Phase Roadmap

### Phase D0 - Baseline and token discipline

Goal:

1. establish the design harness,
2. freeze the current route map,
3. create token discipline before layout changes start.

Bundle gate:

1. design harness test passes,
2. token contract exists,
3. baseline screenshots are reproducible.

### Phase D1 - Shell, hierarchy, and button roles

Goal:

1. replace equal-weight screen treatment with clear primary and secondary planes,
2. separate navigation, commit, and destructive actions visually,
3. create responsive shell behavior.

Bundle gate:

1. lobby, schedule, and live table hierarchy tests pass,
2. no horizontal overflow at mobile,
3. button role contract passes.

### Phase D2 - Live table redesign

Goal:

1. make the table decision-first,
2. move action controls into the first viewport on mobile,
3. demote secondary tools.

Bundle gate:

1. live table priority tests pass,
2. mobile action visibility passes,
3. tablet and desktop composition tests pass.

### Phase D3 - Review, season, and rail refinement

Goal:

1. make review feel analytical,
2. make season feel ranking-first,
3. make rail feel observational.

Bundle gate:

1. review layout tests pass,
2. rail distinction tests pass,
3. native season UI tests pass.

### Phase D4 - Operator and centaur polish

Goal:

1. make operator actions safe-by-structure,
2. make centaur feel like a distinct shared-decision ritual,
3. harden accessibility and state styling.

Bundle gate:

1. operator hierarchy and destructive-group tests pass,
2. centaur hierarchy tests pass,
3. focus, disabled, empty, loading, and error tests pass.

## 5. Tickets

## PDK-301 - Design harness and baseline capture

- Priority: P0
- Phase: D0
- Goal: create deterministic, route-specific screenshot and DOM baseline coverage for poker screens.
- Deliverables:
  - design harness test
  - seeded capture protocol
  - stable route/state matrix
- Acceptance criteria:
  - mobile, tablet, and desktop baseline capture works for lobby, table, schedule, review, operator, and centaur
  - route map is documented once
  - baseline drift can be detected

## PDK-302 - Token migration and poker shell cleanup

- Priority: P0
- Phase: D0
- Goal: move poker visual values onto the design system and remove rogue local styling decisions.
- Deliverables:
  - tokenized poker palette
  - tokenized typography
  - tokenized spacing and radii
- Acceptance criteria:
  - token contract passes
  - poker shell no longer mixes accidental global heading styling with local poker visuals

## PDK-303 - Lobby hierarchy redesign

- Priority: P0
- Phase: D1
- Goal: make quick seat and live tables the obvious top-level actions.
- Deliverables:
  - reordered lobby sections
  - reduced metric noise
  - clearer table cards
- Acceptance criteria:
  - quick seat is the top primary panel
  - policy and identity are visually secondary
  - open-table actions are visible without scanning the whole page

## PDK-304 - Schedule separation

- Priority: P0
- Phase: D1
- Goal: separate player schedule browsing from admin template authoring.
- Deliverables:
  - player-first schedule order
  - secondary template rail
  - admin section demotion
- Acceptance criteria:
  - upcoming events appear before admin tooling
  - register/waitlist controls are easier to find than template creation

## PDK-305 - Live table decision-first layout

- Priority: P0
- Phase: D2
- Goal: make the acting-hand and action controls the first visual priority.
- Deliverables:
  - top decision zone
  - action-first mobile order
  - secondary tool demotion
- Acceptance criteria:
  - primary action is visible in first viewport at mobile acting state
  - thread, study, auto-act, and review appear later

## PDK-306 - Button role system

- Priority: P0
- Phase: D1
- Goal: define and apply visual roles for commit, navigation, utility, and destructive controls.
- Deliverables:
  - button classes and tokens
  - operator destructive grouping
- Acceptance criteria:
  - destructive buttons are visually distinct
  - navigation pills do not resemble action buttons

## PDK-307 - Review surface redesign

- Priority: P1
- Phase: D3
- Goal: turn hand review into a readable study workflow.
- Deliverables:
  - summary/replay/study structure
  - improved notebook placement
  - opponent note grouping
- Acceptance criteria:
  - summary appears before forms
  - notebook and opponent notes read as study support, not primary content

## PDK-308 - Operator review redesign

- Priority: P1
- Phase: D4
- Goal: create safe operator hierarchy and reduce accidental-action risk.
- Deliverables:
  - grouped operator controls
  - destructive cluster
  - stronger state summary
- Acceptance criteria:
  - neutral and destructive actions are visually separated
  - the current review state is readable before any intervention control

## PDK-309 - Rail and season refinement

- Priority: P2
- Phase: D3
- Goal: make spectator and ranking surfaces lighter and easier to scan.
- Deliverables:
  - rail visual distinction
  - leaderboard-first season layout
- Acceptance criteria:
  - rail does not feel like a player screen
  - season reads as ranking-first

## PDK-310 - Centaur ritual redesign

- Priority: P2
- Phase: D4
- Goal: give centaur a distinct shared-decision hierarchy.
- Deliverables:
  - clearer verify/join/action phases
  - countdown emphasis
  - discussion versus commitment separation
- Acceptance criteria:
  - centaur feels visibly distinct from standard poker table screens

## PDK-311 - Accessibility and state polish

- Priority: P1
- Phase: D4
- Goal: add complete focus, disabled, loading, empty, and error design treatment.
- Deliverables:
  - focus ring system
  - disabled state styling
  - loading/empty/error patterns
- Acceptance criteria:
  - focus is visible,
  - disabled is clearly inactive,
  - blank states feel intentional.
