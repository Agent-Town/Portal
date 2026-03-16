# Design TDD Spec

This spec turns design work into measurable milestones for future agentic AI contributors.

The goal is not visual novelty. The goal is a more inevitable, legible, premium Portal without changing product behavior.

For the execution order and atomic work items behind these milestones, see:

- [IMPLEMENTATION_ROADMAP.md](/Users/robin/.codex/worktrees/afe5/Portal/design/IMPLEMENTATION_ROADMAP.md)
- [BACKLOG.md](/Users/robin/.codex/worktrees/afe5/Portal/design/BACKLOG.md)

## 1. Scope

In scope:

- visual hierarchy
- spacing
- typography
- component consistency
- color usage
- responsive layout
- empty/loading/error states
- motion discipline
- accessibility

Out of scope:

- new features
- route changes that alter behavior
- backend changes
- worker/runtime logic changes
- identity model changes

## 2. Verification Model

Each design milestone must be verified through measurable evidence, not taste alone.

Approved metric types:

- visible control counts
- computed-style assertions
- viewport screenshot comparisons
- focus and hit-target checks
- contrast checks
- multilingual string-fit checks
- mixed-script rendering checks
- voice-label clarity checks
- existing portal loss invariants

## 3. Global Design Gates

These gates apply to every milestone:

1. existing full suite still passes via `npm test`
2. landing clutter does not increase beyond the current hard guard in [research/portal/loss.md](/Users/robin/.codex/worktrees/afe5/Portal/research/portal/loss.md)
3. Team Code visible leak count remains `0` outside debug contexts
4. modal-first route behavior is preserved
5. product surface remains more visually prominent than instrumentation
6. top-layer copy remains understandable for low-technical users
7. translated or Chinese fixture text does not break primary layout on audited routes

## 4. Reserved Design Test Block

Reserve the next visual/design-focused block for future implementation:

- `e2e/264_design_source_of_truth_contract.spec.js`
- `e2e/265_town_hub_primary_action_hierarchy.spec.js`
- `e2e/266_mobile_town_hub_clutter_guard.spec.js`
- `e2e/267_house_hierarchy_contract.spec.js`
- `e2e/268_house_office_plain_language_shell.spec.js`
- `e2e/269_debug_panel_visual_priority.spec.js`
- `e2e/270_surface_container_consistency.spec.js`
- `e2e/271_poker_empty_state_design_contract.spec.js`
- `e2e/272_leaderboard_measure_and_density.spec.js`
- `e2e/273_registry_layering_and_proof_disclosure.spec.js`
- `e2e/274_empty_loading_error_state_contract.spec.js`
- `e2e/275_accessibility_touch_target_and_contrast.spec.js`
- `e2e/276_responsive_visual_regression_matrix.spec.js`
- `e2e/277_globalized_copy_and_mixed_script_layout.spec.js`
- `e2e/278_voice_ready_control_naming.spec.js`
- `e2e/279_provider_neutral_primary_copy.spec.js`

## 5. Milestones

### D0 - Design source of truth

Goal:

- create one design contract for future agents

Required tests:

- `264`

Acceptance metrics:

- required design docs exist in `design/`
- every file named in the design prompt has a local equivalent
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css) is explicitly identified as shipped truth
- Brand kit is documented as reference-only, not production truth

### D1 - Town hub hierarchy

Goal:

- make the town shell readable in two seconds

Required tests:

- `265`
- `266`

Acceptance metrics:

- exactly one visually primary action is detectable on the town hub
- non-debug visible landing clutter remains `<= 2`
- mobile bottom chrome does not occlude the primary town interaction region
- active district affordance is visually stronger than inactive districts
- primary action wording remains short enough for translation and speech

### D2 - House hierarchy

Goal:

- turn House into a guided user surface instead of a flat control stack

Required tests:

- `267`

Acceptance metrics:

- unlock/continuity block appears before share and advanced blocks in DOM and visual order
- no more than one primary button treatment is visible in the first viewport on mobile
- advanced sections visually recede relative to the main continuity action

### D3 - House Office plain-language shell

Goal:

- put human meaning ahead of technical structure

Required tests:

- `268`

Acceptance metrics:

- top-of-surface summary uses plain-language headings and next-step cues
- raw session/runtime/config identifiers are not in the top summary layer
- a non-technical user can identify status, significance, and next action from the first visible block

### D4 - Debug panel priority separation

Goal:

- keep instrumentation available without letting it dominate

Required tests:

- `269`

Acceptance metrics:

- debug surface remains present and functional
- product surface occupies the stronger visual hierarchy in default layout
- mobile debug entry remains accessible without crowding the primary task area

### D5 - Surface consistency pass

Goal:

- unify panels, cards, buttons, and empty states across the app

Required tests:

- `270`
- `271`
- `272`
- `273`

Acceptance metrics:

- standard panels use only approved border, radius, and shadow token families
- poker empty state matches the same structural empty-state grammar as other surfaces
- leaderboard content measure remains within the approved desktop frame range
- registry summary, proof, and advanced blocks are visually separable

### D6 - Empty/loading/error system

Goal:

- make the app feel intentional when data is absent or delayed

Required tests:

- `274`

Acceptance metrics:

- empty states share one grammar:
  - title
  - one-line meaning
  - next step
- loading states are visible and consistent across key surfaces
- error surfaces use consistent tone and structure

### D7 - Accessibility and responsive hardening

Goal:

- make the premium design robust at real-world sizes

Required tests:

- `275`
- `276`

Acceptance metrics:

- interactive touch targets are `>= 44x44`
- contrast checks meet WCAG AA for body text and controls
- the route matrix renders without broken hierarchy at `390`, `768`, and `1440`
- debug and product surfaces remain navigable by keyboard

### D8 - Globalization and voice-readiness hardening

Goal:

- make the design durable for international users, Chinese users, and future voice-driven interaction

Required tests:

- `277`
- `278`
- `279`

Acceptance metrics:

- audited routes remain stable with longer translated strings and mixed Latin plus Simplified Chinese fixture text
- top-level controls use short, plain-language labels that are understandable when spoken aloud
- primary product layers do not depend on provider or model brand names for comprehension

## 6. Required Assertion Types

Future visual tests should include, where appropriate:

- `getComputedStyle()` token checks
- screenshot assertions for approved stable surfaces
- bounding-box checks for minimum touch target size
- text/DOM order checks for hierarchy
- active/inactive class or attribute assertions for primary action emphasis
- translated fixture-string overflow checks
- mixed-script rendering checks for action labels and summaries

## 7. Regression Commands

Minimum run sequence after each design milestone:

```bash
npx playwright test <changed-design-tests>
npm run research:portal:eval
npm test
```

If the research harness is too noisy for a given pass, the full suite remains mandatory.

## 8. Completion Rule

A design milestone is complete only when:

1. its new tests are green
2. existing tests are green
3. the docs in `design/` are updated
4. the change still respects [AGENTS.md](/Users/robin/.codex/worktrees/afe5/Portal/AGENTS.md)
