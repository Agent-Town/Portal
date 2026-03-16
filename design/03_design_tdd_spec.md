# Design TDD Spec

Status: Planned

This document defines a test-driven design program for future agentic AI developers. It mirrors the structure of the product TDD specs in [`specs/`](/Users/robin/.codex/worktrees/3e47/Portal/specs), but focuses on visual and interaction quality without changing functionality.

## 1. Program Goal

Deliver a premium, end-user-first visual system across Agent Town while preserving all existing behavior.
Users should be able to act from a simple surface and learn depth through conversation with the assistant instead of scanning a crowded interface.

## 2. Design TDD Principles

- No phase begins without measurable acceptance criteria
- Every phase must be provable with screenshots, DOM assertions, or style-contract checks
- No design interpretation should be left implicit when writing implementation notes
- Design changes must preserve functionality exactly
- Design changes must improve clarity for non-technical users, not just visual taste
- Default surfaces should reduce visible complexity while preserving dense detail in advanced or assistant-accessible views
- Summary surfaces, advanced surfaces, and assistant-readable detail should remain semantically aligned and testable for drift
- If a milestone changes disclosure logic, modal continuity, or the relationship between summary/detail/assistant layers, the formal models under [design/formal/](/Users/robin/.codex/worktrees/3e47/Portal/design/formal) must be reviewed and synced

## 3. Viewport Contract

Every milestone must be evaluated at:

- `390x844`
- `768x1024`
- `1440x900`

Language validation target:

- English baseline
- Chinese content fit / CJK rendering validation

## 4. Reserved Acceptance Test Block

Reserve these filenames for future design acceptance tests:

- `e2e/264_design_baseline_capture_contract.spec.js`
- `e2e/265_start_screen_hierarchy_contract.spec.js`
- `e2e/266_town_modal_hierarchy_contract.spec.js`
- `e2e/267_house_console_hierarchy_contract.spec.js`
- `e2e/268_house_office_information_density_contract.spec.js`
- `e2e/269_agent_dock_quiet_state_contract.spec.js`
- `e2e/270_leaderboard_empty_state_contract.spec.js`
- `e2e/271_registry_system_alignment_contract.spec.js`
- `e2e/272_trainer_brain_surface_consistency_contract.spec.js`
- `e2e/273_mobile_responsiveness_design_contract.spec.js`
- `e2e/274_design_token_and_inline_style_contract.spec.js`
- `e2e/275_design_final_visual_smoke.spec.js`

These are reserved numbers only. This document does not implement them.

## 4.1 Formal Logic Companion

The design TDD program has a formal companion layer under:

- [design/formal/README.md](/Users/robin/.codex/worktrees/3e47/Portal/design/formal/README.md)
- [design/formal/04_formal_mapping.md](/Users/robin/.codex/worktrees/3e47/Portal/design/formal/04_formal_mapping.md)

That layer is mandatory for milestones that change:

- summary-first versus advanced disclosure boundaries
- assistant-visible structured detail
- modal continuity and route stability
- primary-action clarity as a state rule

The formal layer does not replace screenshot-backed design review. It defines the logic that the visible design must preserve.

## 5. Milestone Plan

### D0. Baseline Capture And Contract Freeze

Goal:

- Freeze current target surfaces, viewports, and selectors so design work starts from evidence, not memory

Files in scope:

- [public/start.html](/Users/robin/.codex/worktrees/3e47/Portal/public/start.html)
- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)
- [public/views/house.html](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html)
- [public/leaderboard.html](/Users/robin/.codex/worktrees/3e47/Portal/public/leaderboard.html)
- [public/registry.html](/Users/robin/.codex/worktrees/3e47/Portal/public/registry.html)
- [public/create.html](/Users/robin/.codex/worktrees/3e47/Portal/public/create.html)

Acceptance metrics:

- Screenshot set exists for all target screens at all three required viewports
- Baseline selector map exists in the design docs
- Inline-style inventory exists for target templates

### D1. Token Foundation

Goal:

- Formalize design tokens and component roles before changing screen composition

Source of truth:

- [design/08_design_system_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/08_design_system_spec.md)
- [design/09_component_contracts.md](/Users/robin/.codex/worktrees/3e47/Portal/design/09_component_contracts.md)

Acceptance metrics:

- Shared token names documented for typography, spacing, surface, border, radius, shadow, and motion
- No new hardcoded values introduced in target files
- Future design work can reference token names instead of ad hoc values
- UI and display typography account for CJK fallback behavior

### D2. Start Screen Hierarchy

Goal:

- Make the start screen the clearest, calmest first impression in the product

Acceptance metrics:

- At `390x844`, the primary CTA is fully visible without scrolling
- Exactly one visually primary action appears in the first viewport
- The warning banner is removed or relocated from the primary composition
- The hero media is visually subordinate to the call to action

Suggested assertion types:

- CTA visible
- no horizontal overflow
- single primary button in hero zone
- no unexplained AI/provider jargon in the first viewport

### D3. Town Modal Hierarchy

Goal:

- Make the district modal read as one guided surface instead of stacked equal-weight panels

Acceptance metrics:

- The modal header consumes less vertical space than baseline
- First viewport of the open house district contains one dominant action area
- Target district content no longer presents more than two visually strong framed regions above the first scroll threshold
- No new inline styles added to [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)

### D4. House Console Summary And Navigation

Goal:

- Make House Console immediately understandable to a non-technical user

Acceptance metrics:

- One summary region appears before readiness details
- One clear primary action is visible before secondary actions
- Readiness content is present but visually subordinate
- At `390x844`, the first viewport does not contain more than two stacked action groups
- first viewport avoids unexplained provider/model/LLM vocabulary

### D5. House Office Information Density

Goal:

- Turn House Office from a verbose operational stack into a structured workspace overview

Acceptance metrics:

- Section headers use one consistent component pattern
- Presence, Briefing, Attention, Assignments, Deployments, Shares, and Sessions are visually grouped but not equally loud
- The top of the screen shows overview before deep detail
- No inline layout styling remains in the House Office section markup

### D6. Agent Dock Quieting

Goal:

- Make Agent Comms feel supportive and premium rather than intrusive

Acceptance metrics:

- Minimized dock occupies a visually quiet footprint
- Dock controls use one consistent icon/control language
- Expanded dock does not visually overpower the active modal or screen
- At `390x844`, dock plus content do not create horizontal overflow or clipped controls
- dock controls use short, speakable labels suitable for future voice affordances

### D7. Leaderboard Empty State

Goal:

- Make the empty leaderboard intentional and complete

Acceptance metrics:

- Empty state includes one clear message and one next action
- The page has a clear center of gravity at all three viewports
- Counters are visually secondary to the empty-state message

### D8. Registry System Alignment

Goal:

- Bring Registry into the shared design system

Acceptance metrics:

- No page-local hardcoded visual system remains in [public/registry.html](/Users/robin/.codex/worktrees/3e47/Portal/public/registry.html) other than structure-specific layout when approved
- Typography, actions, spacing, and cards visibly align with the rest of the product
- Search area remains first-glance understandable at `390x844`

### D9. Trainer / Brain / Advanced Surface Consistency

Goal:

- Bring advanced surfaces into the shared UI language without reducing functionality

Acceptance metrics:

- Tabs, forms, advanced settings, and action rows use shared visual patterns
- No ad hoc inline layout styling remains in targeted advanced-surface blocks
- Advanced settings remain discoverable but visually subordinate

### D10. Responsive And Accessibility Pass

Goal:

- Ensure the redesigned system holds up across device classes

Acceptance metrics:

- No horizontal overflow at `390x844`
- Minimum touch target `44x44` for interactive controls in redesigned surfaces
- Focus states visible on all redesigned controls
- Body copy contrast `>= 4.5:1`
- redesigned screens tolerate Chinese or `35%` expanded copy without clipping core actions

### D11. Motion, Empty, Loading, And Error Library

Goal:

- Standardize subtle product polish

Acceptance metrics:

- Shared motion tokens exist and are used by redesigned surfaces
- Empty, loading, and error patterns are consistent across the targeted surfaces
- No decorative animation is added without a structural role

### D12. Final Visual Smoke

Goal:

- Prove the redesigned system is coherent end to end

Acceptance metrics:

- Start, Town, House, House Office, Leaderboard, Registry, and Agent Dock all read as one system
- All target surfaces pass screenshot review at mobile, tablet, and desktop
- All targeted templates are free of visual-layout inline styles
- Full Playwright suite still passes
- critical-path screens remain understandable without AI/provider jargon in the first viewport

## 6. Global Acceptance Metrics

These metrics apply to every design milestone:

- No functionality regressions
- No new inline `style=` added in targeted files
- No horizontal overflow at mobile viewport
- Primary action remains visible and obvious
- New visual values come from shared tokens, not ad hoc constants

## 7. Required Evidence For A Green Phase

Each completed phase must include:

- before screenshots
- after screenshots
- affected files list
- token changes list
- inline-style count before/after for targeted files
- statement that behavior was preserved
- confirmation that the phase matched [design/10_frontend_design_build_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/10_frontend_design_build_spec.md) or a documented approved deviation

## 8. Failure Conditions

A phase is not green if any of the following is true:

- it improves styling but not hierarchy
- it introduces a new one-off component style
- it relies on new inline layout styles
- it changes product behavior
- it works on desktop but feels accidental on mobile
- it adds chrome instead of removing ambiguity
