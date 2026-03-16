# Formal Design Logic

Status: Draft formal layer for future agentic design work

This folder adds a formal-design-logic layer to the visual design system under [`design/`](/Users/robin/.codex/worktrees/3e47/Portal/design).

It does not try to formalize:

- typography taste
- spacing feel
- color judgment
- motion elegance

It does formalize the stateful logic behind the design:

- what the user sees by default
- what is hidden behind advanced disclosure
- what the assistant can explain
- how modal continuity behaves
- how those layers avoid semantic drift

## Why this exists

The useful architectural idea borrowed from `tla-precheck` is:

- one source of truth
- no drift between representations

Source:

- https://github.com/kingbootoshi/tla-precheck

That idea fits Agent Town design well.

For this product, the three representations that must stay aligned are:

1. the simple, summary-first user-facing surface
2. the advanced or detailed surface
3. the assistant-readable structured detail

## Files

- [01_surface_simplicity_model.tla](/Users/robin/.codex/worktrees/3e47/Portal/design/formal/01_surface_simplicity_model.tla)
  - one-primary-action and summary-first model
- [01_surface_simplicity_model.cfg](/Users/robin/.codex/worktrees/3e47/Portal/design/formal/01_surface_simplicity_model.cfg)
  - TLC model configuration
- [02_no_drift_summary_detail_assistant.tla](/Users/robin/.codex/worktrees/3e47/Portal/design/formal/02_no_drift_summary_detail_assistant.tla)
  - no-drift invariants across summary/detail/assistant layers
- [02_no_drift_summary_detail_assistant.cfg](/Users/robin/.codex/worktrees/3e47/Portal/design/formal/02_no_drift_summary_detail_assistant.cfg)
  - TLC model configuration
- [03_modal_continuity_and_disclosure.tla](/Users/robin/.codex/worktrees/3e47/Portal/design/formal/03_modal_continuity_and_disclosure.tla)
  - modal-first continuity and disclosure purity model
- [03_modal_continuity_and_disclosure.cfg](/Users/robin/.codex/worktrees/3e47/Portal/design/formal/03_modal_continuity_and_disclosure.cfg)
  - TLC model configuration
- [04_formal_mapping.md](/Users/robin/.codex/worktrees/3e47/Portal/design/formal/04_formal_mapping.md)
  - links formal invariants to the repo’s design docs and Playwright contracts

## How future agents should use this

Use the TLA+ layer when a design change affects:

- disclosure order
- summary vs detailed representation
- assistant-visible detail
- modal continuity
- primary-action clarity as a state rule

Do not use it to debate purely visual taste.

## Execution note

These specs are designed so future agents can run TLC locally if TLA+ tools are available.

They are not a replacement for:

- [design/08_design_system_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/08_design_system_spec.md)
- [design/09_component_contracts.md](/Users/robin/.codex/worktrees/3e47/Portal/design/09_component_contracts.md)
- Playwright design contracts under `e2e/`

They are the logic layer beneath them.
