# Portal Design Backlog

This backlog enumerates every current design finding as execution-ready work.

Each item is intentionally small enough for a future agentic AI contributor to implement in a focused pass, but concrete enough to avoid aesthetic improvisation.

## Status Vocabulary

- `planned`
- `approved`
- `in_progress`
- `implemented`

Current default status for all items in this file: `planned`

## D0 — Design Foundation

### DG-001 — Canonical design source mapping

Status: `implemented`

Problem:

- future design prompts expect standalone design docs that did not exist in this repo

Implementation target:

- keep `design/` as the canonical design spec layer

Primary files:

- [design/README.md](/Users/robin/.codex/worktrees/afe5/Portal/design/README.md)
- [design/DESIGN_SYSTEM.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_SYSTEM.md)

Acceptance metric:

- every expected design artifact name has one mapped local file

Test mapping:

- `e2e/264_design_source_of_truth_contract.spec.js`

### DG-002 — Token family consolidation plan

Status: `implemented`

Problem:

- live tokens, dormant `--v0-*` tokens, and Brand kit tokens all compete

Implementation target:

- define one approved set for:
  - color
  - type
  - radius
  - elevation
  - motion

Primary files:

- [design/DESIGN_SYSTEM.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_SYSTEM.md)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)

Acceptance metric:

- future phases can reference one approved token family per category

Test mapping:

- `e2e/264_design_source_of_truth_contract.spec.js`

### DG-003 — Audience and globalization contract

Status: `implemented`

Problem:

- earlier design docs were not explicit enough about low-technical users, Chinese users, or future voice use

Implementation target:

- make these requirements first-class and binding across the design system

Primary files:

- [design/AUDIENCE_AND_GLOBALIZATION.md](/Users/robin/.codex/worktrees/afe5/Portal/design/AUDIENCE_AND_GLOBALIZATION.md)
- [design/PRD.md](/Users/robin/.codex/worktrees/afe5/Portal/design/PRD.md)
- [design/TDD_SPEC.md](/Users/robin/.codex/worktrees/afe5/Portal/design/TDD_SPEC.md)

Acceptance metric:

- future phases explicitly inherit low-technical-user, international, Chinese, and voice-readiness requirements

Test mapping:

- `e2e/264_design_source_of_truth_contract.spec.js`

## D0.5 — Audience And Globalization Readiness

### DG-051 — Plain-language top-layer copy contract

Status: `in_progress`

Problem:

- top-layer surfaces can still drift toward AI/provider jargon

Implementation target:

- enforce plain-language task-first copy in primary product layers

Primary files:

- [public/index.html](/Users/robin/.codex/worktrees/afe5/Portal/public/index.html)
- [public/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/house.html)
- [public/views/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/views/house.html)
- [public/app.js](/Users/robin/.codex/worktrees/afe5/Portal/public/app.js)

Acceptance metrics:

- top-layer labels and summaries avoid unexplained provider/model/runtime terms
- a standard user can understand the task without AI background

Test mapping:

- `e2e/279_provider_neutral_primary_copy.spec.js`

### DG-052 — Translation-safe shell labels

Status: `implemented`

Problem:

- some strong uppercase and tight-label assumptions are fragile under translation

Implementation target:

- core shell labels and actions stay stable with longer translated strings

Primary files:

- [public/index.html](/Users/robin/.codex/worktrees/afe5/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)

Acceptance metrics:

- primary shell labels do not overflow, collide, or lose hierarchy under translated fixtures

Test mapping:

- `e2e/277_globalized_copy_and_mixed_script_layout.spec.js`

### DG-053 — Simplified Chinese mixed-script readiness

Status: `implemented`

Problem:

- the current typography and spacing system was not explicitly designed for mixed Latin plus Simplified Chinese usage

Implementation target:

- protect shell and summary layouts under mixed-script content

Primary files:

- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- all top-layer route shells touched by translated labels or summaries

Acceptance metrics:

- mixed Latin plus Simplified Chinese fixture text remains readable and does not break layout

Test mapping:

- `e2e/277_globalized_copy_and_mixed_script_layout.spec.js`

### DG-054 — Voice-ready control naming

Status: `planned`

Problem:

- some controls are visually understandable but not optimized for spoken reference or future voice states

Implementation target:

- keep main controls short, direct, and unambiguous enough for future voice use

Primary files:

- [public/index.html](/Users/robin/.codex/worktrees/afe5/Portal/public/index.html)
- [public/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/house.html)
- [public/views/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/views/house.html)

Acceptance metrics:

- primary controls can be identified by short spoken labels without ambiguity
- layouts leave room for future listen/speak/confirm states

Test mapping:

- `e2e/278_voice_ready_control_naming.spec.js`

## D1 — Town Shell Clarity

### DG-101 — Town hub primary action dominance

Status: `implemented`

Problem:

- the user’s eye does not land on one inevitable next action

Implementation target:

- active district and primary entry action own the visual hierarchy

Primary files:

- [public/index.html](/Users/robin/.codex/worktrees/afe5/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)

Acceptance metrics:

- exactly one primary CTA treatment in the shell
- inactive district labels and hotspots visibly recede relative to the active one

Test mapping:

- `e2e/265_town_hub_primary_action_hierarchy.spec.js`

### DG-102 — Mobile dock crowding reduction

Status: `implemented`

Problem:

- the bottom Agent Comms bar competes with the town scene on mobile

Implementation target:

- mobile dock becomes secondary while remaining accessible

Primary files:

- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- [public/index.html](/Users/robin/.codex/worktrees/afe5/Portal/public/index.html)

Acceptance metrics:

- primary town interaction region is not occluded at `390px`
- landing clutter stays within research-harness budget

Test mapping:

- `e2e/266_mobile_town_hub_clutter_guard.spec.js`

### DG-103 — Town shell status and scene rhythm

Status: `implemented`

Problem:

- labels, status line, and dock read as separate systems

Implementation target:

- one calmer hierarchy between scene, status, and controls

Primary files:

- [public/index.html](/Users/robin/.codex/worktrees/afe5/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)

Acceptance metrics:

- status line reads as support information, not a competing headline
- scene labels are visually integrated into the environment

Test mapping:

- `e2e/265_town_hub_primary_action_hierarchy.spec.js`
- `e2e/276_responsive_visual_regression_matrix.spec.js`

### DG-104 — Debug panel shell demotion

Status: `planned`

Problem:

- the agent panel currently competes with the product shell

Implementation target:

- keep the panel available but visually subordinate

Primary files:

- [public/index.html](/Users/robin/.codex/worktrees/afe5/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)

Acceptance metrics:

- debug panel remains functional
- town shell visually dominates at rest

Test mapping:

- `e2e/269_debug_panel_visual_priority.spec.js`

## D2 — House And House Office Clarity

### DG-201 — House first-viewport narrative

Status: `planned`

Problem:

- House first viewport reads as a stack of equally weighted control blocks

Implementation target:

- clear order:
  - unlock
  - continuity
  - share
  - advanced/private sections

Primary files:

- [public/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/house.html)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)

Acceptance metrics:

- no more than one primary CTA treatment visible in the first mobile viewport
- unlock or reconnect block is visually dominant when relevant

Test mapping:

- `e2e/267_house_hierarchy_contract.spec.js`

### DG-202 — House section regrouping

Status: `planned`

Problem:

- backup, brain, public share, and read/write surfaces are visually flat

Implementation target:

- visibly regroup sections into:
  - continuity
  - sharing
  - public presence
  - private advanced controls

Primary files:

- [public/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/house.html)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)

Acceptance metrics:

- advanced sections visually recede
- spacing rhythm makes section boundaries obvious without adding clutter

Test mapping:

- `e2e/267_house_hierarchy_contract.spec.js`

### DG-203 — House Console summary-first layer

Status: `planned`

Problem:

- House Console starts too close to operational detail

Implementation target:

- top layer summarizes what matters and what can be opened next

Primary files:

- [public/views/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/views/house.html)
- [public/app.js](/Users/robin/.codex/worktrees/afe5/Portal/public/app.js)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)

Acceptance metrics:

- summary reads as human-oriented status before technical evidence
- the first visible console block contains meaning, not just controls

Test mapping:

- `e2e/268_house_office_plain_language_shell.spec.js`

### DG-204 — House Office plain-language top layer

Status: `planned`

Problem:

- House Office still uses operator/system language too early

Implementation target:

- rewrite the first layer visually and textually as:
  - what changed
  - what matters
  - what to do next

Primary files:

- [public/views/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/views/house.html)
- [public/app.js](/Users/robin/.codex/worktrees/afe5/Portal/public/app.js)

Acceptance metrics:

- raw session/config/runtime identifiers do not dominate the first visible summary
- helper state is understandable in plain language

Test mapping:

- `e2e/268_house_office_plain_language_shell.spec.js`

### DG-205 — House helper emphasis cleanup

Status: `planned`

Problem:

- deployments, shares, and sessions are presented with similar visual weight

Implementation target:

- helper actions remain clear, but metadata becomes calmer and more layered

Primary files:

- [public/views/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/views/house.html)
- [public/app.js](/Users/robin/.codex/worktrees/afe5/Portal/public/app.js)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)

Acceptance metrics:

- one dominant helper action per card
- metadata pills and diagnostic details read as secondary

Test mapping:

- `e2e/268_house_office_plain_language_shell.spec.js`
- `e2e/270_surface_container_consistency.spec.js`

## D3 — Cross-Surface Consistency

### DG-301 — Typography split

Status: `planned`

Problem:

- display, UI, and body all rely on Wellfleet in the live app

Implementation target:

- preserve western character in headings
- introduce quieter UI/body typography

Primary files:

- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- [design/DESIGN_SYSTEM.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_SYSTEM.md)

Acceptance metrics:

- no more than one display face and one UI/body face are active in production
- body copy is more readable than baseline

Test mapping:

- `e2e/270_surface_container_consistency.spec.js`
- `e2e/276_responsive_visual_regression_matrix.spec.js`

### DG-302 — Button tier rationalization

Status: `planned`

Problem:

- too many controls are equally loud

Implementation target:

- define and enforce:
  - primary
  - secondary
  - tertiary
  - danger

Primary files:

- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)

Acceptance metrics:

- primary button treatment appears only once per screen region unless explicitly justified
- pills and badges are visually quieter than buttons

Test mapping:

- `e2e/270_surface_container_consistency.spec.js`

### DG-303 — Surface container unification

Status: `planned`

Problem:

- panels, modals, share blocks, and sidebar cards do not feel system-built

Implementation target:

- one container grammar for:
  - panel
  - elevated panel
  - modal
  - debug surface

Primary files:

- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)

Acceptance metrics:

- approved radius, border, and shadow families are reused consistently

Test mapping:

- `e2e/270_surface_container_consistency.spec.js`

### DG-304 — Leaderboard content frame

Status: `planned`

Problem:

- the desktop leaderboard wastes visual space and dilutes focus

Implementation target:

- a calmer central measure and stronger summary/list relationship

Primary files:

- [public/leaderboard.html](/Users/robin/.codex/worktrees/afe5/Portal/public/leaderboard.html)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)

Acceptance metrics:

- leaderboard content frame remains within approved max width and spacing band
- empty state reads intentional, not sparse

Test mapping:

- `e2e/272_leaderboard_measure_and_density.spec.js`

### DG-305 — Registry information layering

Status: `planned`

Problem:

- search controls, summary content, and proof-heavy blocks compete too directly

Implementation target:

- stage content as:
  - search
  - result summary
  - proof/details
  - advanced disclosure

Primary files:

- [public/registry.html](/Users/robin/.codex/worktrees/afe5/Portal/public/registry.html)
- [public/registry.js](/Users/robin/.codex/worktrees/afe5/Portal/public/registry.js)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)

Acceptance metrics:

- proof and advanced blocks are visually subordinate to the summary layer
- result cards are scannable within one viewport

Test mapping:

- `e2e/273_registry_layering_and_proof_disclosure.spec.js`

### DG-306 — Poker empty-state redesign

Status: `planned`

Problem:

- poker’s empty or low-data state feels detached from the main product language

Implementation target:

- make it intentional, framed, and visually related to the rest of Portal

Primary files:

- [public/poker.html](/Users/robin/.codex/worktrees/afe5/Portal/public/poker.html)
- [public/poker.js](/Users/robin/.codex/worktrees/afe5/Portal/public/poker.js)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)

Acceptance metrics:

- poker empty state uses the shared empty-state grammar
- contrast and containment are improved relative to baseline

Test mapping:

- `e2e/271_poker_empty_state_design_contract.spec.js`

## D4 — Polish And Hardening

### DG-401 — Shared empty-state grammar

Status: `planned`

Problem:

- empty states across the app do not feel like one product

Implementation target:

- one grammar for title, meaning, and next step

Primary files:

- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- route-specific HTML/JS surfaces as needed

Acceptance metrics:

- key empty states across House, Leaderboard, Registry, and Poker follow the same structure

Test mapping:

- `e2e/274_empty_loading_error_state_contract.spec.js`

### DG-402 — Loading-state system

Status: `planned`

Problem:

- some surfaces still jump from blank to loaded

Implementation target:

- consistent loading shells where user wait is visible

Primary files:

- [public/app.js](/Users/robin/.codex/worktrees/afe5/Portal/public/app.js)
- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- route-specific JS files as needed

Acceptance metrics:

- loading treatment appears consistently on key async surfaces
- blank flashes are reduced on audited routes

Test mapping:

- `e2e/274_empty_loading_error_state_contract.spec.js`

### DG-403 — Error-state tone normalization

Status: `planned`

Problem:

- current error styling and tone are inconsistent

Implementation target:

- one calm, precise error pattern

Primary files:

- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- route-specific HTML/JS files as needed

Acceptance metrics:

- error states use consistent container, color, spacing, and copy hierarchy

Test mapping:

- `e2e/274_empty_loading_error_state_contract.spec.js`

### DG-404 — Motion timing normalization

Status: `planned`

Problem:

- motion lacks one coherent timing family

Implementation target:

- unify hover, tap, modal, and supporting transitions

Primary files:

- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- [design/DESIGN_SYSTEM.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_SYSTEM.md)

Acceptance metrics:

- motion timings use the approved motion token families
- modal and panel motion feel related, not improvised

Test mapping:

- `e2e/276_responsive_visual_regression_matrix.spec.js`

### DG-405 — Accessibility hardening

Status: `planned`

Problem:

- touch targets, contrast, and focus styling still need a pass

Implementation target:

- accessibility is treated as part of premium quality, not a separate concern

Primary files:

- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- all route shells as affected

Acceptance metrics:

- text and controls meet WCAG AA contrast
- interactive controls reach `44x44`
- focus states remain visible across key routes

Test mapping:

- `e2e/275_accessibility_touch_target_and_contrast.spec.js`

### DG-406 — Theming drift cleanup

Status: `planned`

Problem:

- dormant and parallel theme vocabularies increase entropy

Implementation target:

- explicitly deprecate or reconcile inactive style systems

Primary files:

- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- [design/DESIGN_SYSTEM.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_SYSTEM.md)

Acceptance metrics:

- inactive token families are either removed from active use or clearly documented as deprecated

Test mapping:

- `e2e/264_design_source_of_truth_contract.spec.js`

## Rollup Rule

The design backlog is fully covered only when every item above is either:

- `implemented`, or
- explicitly deferred with a written reason and a replacement milestone

No future design pass should say “I fixed the design” without updating this file.
