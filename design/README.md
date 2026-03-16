# Design Work System

This folder is the design equivalent of the product/spec/TDD stack under [`specs/`](/Users/robin/.codex/worktrees/3e47/Portal/specs).

Its purpose is to let future agentic AI developers improve the visual design of Agent Town without changing product behavior, guessing at intent, or making taste-only decisions.

## Scope

- Visual hierarchy
- Layout and spacing
- Typography
- Color and contrast
- Component consistency
- Motion and interaction polish
- Empty, loading, and error states
- Responsive behavior across mobile, tablet, and desktop
- Accessibility as it relates to visual structure and interaction clarity

## Non-scope

- Feature changes
- Application logic
- API behavior
- State management refactors
- Backend changes

If a design improvement requires a functionality change, the design agent must flag it and stop short of implementing that part.

## Read Order

1. [01_design_context_and_system_baseline.md](/Users/robin/.codex/worktrees/3e47/Portal/design/01_design_context_and_system_baseline.md)
2. [02_design_audit_and_target_state.md](/Users/robin/.codex/worktrees/3e47/Portal/design/02_design_audit_and_target_state.md)
3. [03_design_tdd_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/03_design_tdd_spec.md)
4. [04_design_agent_runbook.md](/Users/robin/.codex/worktrees/3e47/Portal/design/04_design_agent_runbook.md)
5. [05_screen_inventory_and_selector_map.md](/Users/robin/.codex/worktrees/3e47/Portal/design/05_screen_inventory_and_selector_map.md)
6. [06_frontend_design_delivery_backlog.md](/Users/robin/.codex/worktrees/3e47/Portal/design/06_frontend_design_delivery_backlog.md)
7. [07_frontend_design_phase_packets.md](/Users/robin/.codex/worktrees/3e47/Portal/design/07_frontend_design_phase_packets.md)
8. [08_design_system_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/08_design_system_spec.md)
9. [09_component_contracts.md](/Users/robin/.codex/worktrees/3e47/Portal/design/09_component_contracts.md)
10. [10_frontend_design_build_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/10_frontend_design_build_spec.md)
11. [11_global_audience_and_voice_requirements.md](/Users/robin/.codex/worktrees/3e47/Portal/design/11_global_audience_and_voice_requirements.md)

## Relationship To Existing Repo Docs

The audit prompt called for these startup docs:

- `DESIGN_SYSTEM.md`
- `FRONTEND_GUIDELINES.md`
- `APP_FLOW.md`
- `PRD.md`
- `TECH_STACK.md`
- `progress.txt`
- `LESSONS.md`

Those do not exist verbatim in this repo. The design system below is therefore grounded in the closest real sources:

- [README.md](/Users/robin/.codex/worktrees/3e47/Portal/README.md)
- [docs/README.md](/Users/robin/.codex/worktrees/3e47/Portal/docs/README.md)
- [specs/00_product_story.md](/Users/robin/.codex/worktrees/3e47/Portal/specs/00_product_story.md)
- [specs/01_experience_flow.md](/Users/robin/.codex/worktrees/3e47/Portal/specs/01_experience_flow.md)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)
- Core templates under [`public/`](/Users/robin/.codex/worktrees/3e47/Portal/public)

## Source Of Truth

- Product and behavior truth remain under [`specs/`](/Users/robin/.codex/worktrees/3e47/Portal/specs).
- Visual and interaction intent for future design work live in this folder.
- Until a dedicated `DESIGN_SYSTEM.md` exists elsewhere, [01_design_context_and_system_baseline.md](/Users/robin/.codex/worktrees/3e47/Portal/design/01_design_context_and_system_baseline.md) is the design-system source of truth.

## Reserved Design Acceptance Block

Future design acceptance tests should use the reserved Playwright block:

- `e2e/264` through `e2e/275`

These tests should validate layout invariants, primary action visibility, absence of overflow, consistent empty states, reduced inline styling, and other measurable design contracts without changing functionality.

## Execution Planning

The backlog and execution handoff for implementing the current audit findings live here:

- [06_frontend_design_delivery_backlog.md](/Users/robin/.codex/worktrees/3e47/Portal/design/06_frontend_design_delivery_backlog.md)
- [07_frontend_design_phase_packets.md](/Users/robin/.codex/worktrees/3e47/Portal/design/07_frontend_design_phase_packets.md)

Those two documents translate the audit into concrete next work for future frontend-design agents.

## Build-Agent Ready Layer

The following three docs turn the design plan into implementation-ready instructions:

- [08_design_system_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/08_design_system_spec.md)
- [09_component_contracts.md](/Users/robin/.codex/worktrees/3e47/Portal/design/09_component_contracts.md)
- [10_frontend_design_build_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/10_frontend_design_build_spec.md)
- [11_global_audience_and_voice_requirements.md](/Users/robin/.codex/worktrees/3e47/Portal/design/11_global_audience_and_voice_requirements.md)

These lock:

- exact token values
- exact component variants
- exact phase-by-phase implementation guidance
- global-audience, Chinese-language, jargon, and future voice-readiness requirements

Until they are superseded, they are the build-agent source of truth for frontend design implementation.
