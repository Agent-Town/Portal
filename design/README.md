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
- Information architecture for summary-first versus detail-first presentation

## Non-scope

- Feature changes
- Application logic
- API behavior
- State management refactors
- Backend changes

If a design improvement requires a functionality change, the design agent must flag it and stop short of implementing that part.

## Interaction Stance

The product should assume the user has a capable assistant with them.

That means:

- default screens should show the minimum needed to act
- dense operational detail should stay available through structured advanced views and machine-readable surfaces
- users should be able to learn depth by asking the assistant, not by manually parsing cluttered panels
- design agents should simplify the visible UI before removing access to underlying detail

That does not justify replacing visual structure with walls of copy.

- the default UI must avoid "text desert" layouts
- summary surfaces should use visual anchors such as maps, cards, chips, progress markers, icon-supported labels, and grouped actions before adding more prose
- text should explain, not carry the whole interface alone

## No-Drift Principle

Borrow the useful architectural idea from `tla-precheck`: one source of truth, no drift.

For design, that means:

- the simple summary surface
- the advanced or detailed surface
- the assistant-readable structured detail

must describe the same underlying product truth.

Future design agents should not let those layers diverge into three separate stories.

## Modal Continuity Rule

Core user work must remain inside the Agent Town shell.

- primary experiences should be designed as modal or in-shell surfaces on top of the town app
- future design work must not depend on sending the user to a separate page-first flow for core agent interaction
- if a route exists for technical or legacy reasons, the design target is still the modal-first shell experience
- preserving worker continuity is more important than page-level visual freedom

## Read Order

1. [01_design_context_and_system_baseline.md](/Users/robin/.codex/worktrees/3e47/Portal/design/01_design_context_and_system_baseline.md)
2. [02_design_audit_and_target_state.md](/Users/robin/.codex/worktrees/3e47/Portal/design/02_design_audit_and_target_state.md)
3. [03_design_tdd_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/03_design_tdd_spec.md)
4. [04_design_agent_runbook.md](/Users/robin/.codex/worktrees/3e47/Portal/design/04_design_agent_runbook.md)
5. [formal/README.md](/Users/robin/.codex/worktrees/3e47/Portal/design/formal/README.md)
6. [05_screen_inventory_and_selector_map.md](/Users/robin/.codex/worktrees/3e47/Portal/design/05_screen_inventory_and_selector_map.md)
7. [06_frontend_design_delivery_backlog.md](/Users/robin/.codex/worktrees/3e47/Portal/design/06_frontend_design_delivery_backlog.md)
8. [07_frontend_design_phase_packets.md](/Users/robin/.codex/worktrees/3e47/Portal/design/07_frontend_design_phase_packets.md)
9. [08_design_system_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/08_design_system_spec.md)
10. [09_component_contracts.md](/Users/robin/.codex/worktrees/3e47/Portal/design/09_component_contracts.md)
11. [10_frontend_design_build_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/10_frontend_design_build_spec.md)
12. [11_global_audience_and_voice_requirements.md](/Users/robin/.codex/worktrees/3e47/Portal/design/11_global_audience_and_voice_requirements.md)

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

## Current Implementation Status

The frontend design implementation has completed these packets on branch `codex/frontend-design-system-v0-1`:

- `FD0` through `FD10`

Implemented proof currently includes:

- start, town shell, dock, house console, house office, leaderboard, registry, create, trainer/brain, and shared state/motion contracts
- screenshot packs under [design/screenshots/](/Users/robin/.codex/worktrees/3e47/Portal/design/screenshots)
- full suite proof at `397 passed, 5 skipped`

Next unlocked design packet:

- `FD11`: visual anchor and scene-composition pass

## Design Acceptance Block

The current Playwright-backed design acceptance block now spans:

- `e2e/264` through `e2e/277`

Those tests validate layout invariants, primary action visibility, absence of overflow, consistent empty/loading/error states, reduced inline styling, and other measurable design contracts without changing functionality.

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

## Formal Logic Layer

The visual design system now has a formal companion layer under:

- [formal/README.md](/Users/robin/.codex/worktrees/3e47/Portal/design/formal/README.md)

Future agents should use that layer when a design change affects:

- summary versus advanced disclosure
- assistant-readable detail
- one-primary-action rules
- modal continuity and route stability

That layer does not replace visual review. It protects logic and meaning while the rest of this folder defines the visible system.
