# Formal Mapping

Status: Active mapping between formal design logic and repo contracts

This document explains what the TLA+ modules in this folder mean in product terms, and how future agents should connect them to the rest of the repo.

## 1. Why this layer exists

The visual design docs define:

- tokens
- component contracts
- layout principles

The formal layer defines the logic beneath them:

- what belongs in the first view
- what belongs in advanced disclosure
- what the assistant should be able to explain
- how modal continuity behaves

This is the design translation of the `tla-precheck` idea:

- one source of truth
- no drift between representations

Source:

- https://github.com/kingbootoshi/tla-precheck

## 2. Module map

### `01_surface_simplicity_model.tla`

Formalizes:

- one primary action per surface state
- summary-first first view
- dense facts excluded from the default view
- assistant availability when deeper detail is hidden

Repo meaning:

- supports [design/01_design_context_and_system_baseline.md](/Users/robin/.codex/worktrees/3e47/Portal/design/01_design_context_and_system_baseline.md)
- supports [design/08_design_system_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/08_design_system_spec.md)
- supports [design/09_component_contracts.md](/Users/robin/.codex/worktrees/3e47/Portal/design/09_component_contracts.md)

Nearest current Playwright evidence:

- [e2e/265_start_screen_hierarchy_contract.spec.js](/Users/robin/.codex/worktrees/3e47/Portal/e2e/265_start_screen_hierarchy_contract.spec.js)
- [e2e/267_house_console_hierarchy_contract.spec.js](/Users/robin/.codex/worktrees/3e47/Portal/e2e/267_house_console_hierarchy_contract.spec.js)
- [e2e/268_house_office_information_density_contract.spec.js](/Users/robin/.codex/worktrees/3e47/Portal/e2e/268_house_office_information_density_contract.spec.js)
- [e2e/270_leaderboard_empty_state_contract.spec.js](/Users/robin/.codex/worktrees/3e47/Portal/e2e/270_leaderboard_empty_state_contract.spec.js)

### `02_no_drift_summary_detail_assistant.tla`

Formalizes:

- canonical truth as the source of meaning
- summary projection
- advanced projection
- assistant projection
- no semantic drift between those layers

Repo meaning:

- supports the assistant-first detail principle in [design/README.md](/Users/robin/.codex/worktrees/3e47/Portal/design/README.md)
- supports the no-drift rule in [design/08_design_system_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/08_design_system_spec.md)
- supports advanced disclosure rules in [design/09_component_contracts.md](/Users/robin/.codex/worktrees/3e47/Portal/design/09_component_contracts.md)

Expected future design contract direction:

- summary text should never imply a contradictory status relative to advanced sections
- assistant-readable debug/context surfaces should derive from the same structured truth used by visible UI summaries

### `03_modal_continuity_and_disclosure.tla`

Formalizes:

- modal-first route stability
- worker continuity while modal surfaces are open
- trainer modal surface alignment
- disclosure purity, where opening advanced detail does not mutate underlying truth

Repo meaning:

- supports modal-first rules in `AGENTS.md`
- supports [design/01_design_context_and_system_baseline.md](/Users/robin/.codex/worktrees/3e47/Portal/design/01_design_context_and_system_baseline.md)
- supports [design/10_frontend_design_build_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/10_frontend_design_build_spec.md)

Nearest current Playwright evidence:

- [e2e/266_town_modal_hierarchy_contract.spec.js](/Users/robin/.codex/worktrees/3e47/Portal/e2e/266_town_modal_hierarchy_contract.spec.js)
- [e2e/132_trainer_modal_continuity_redirect.spec.js](/Users/robin/.codex/worktrees/3e47/Portal/e2e/132_trainer_modal_continuity_redirect.spec.js)
- [e2e/276_trainer_brain_surface_consistency_contract.spec.js](/Users/robin/.codex/worktrees/3e47/Portal/e2e/276_trainer_brain_surface_consistency_contract.spec.js)

## 3. What future agents should verify

When changing design logic, future agents should check:

1. Is the first view still summary-first?
2. Did advanced disclosure merely expand detail, or did it change meaning?
3. Can the assistant still explain the detail hidden from the first viewport?
4. Does modal continuity preserve the same worker/session truth?
5. Did any summary surface drift from the richer detailed view?

## 4. Limits of this formal layer

This layer does not prove:

- beauty
- calmness
- spacing quality
- visual polish
- typographic judgment

Those still belong to the visual design docs and screenshot-backed review.

## 5. Recommended future use

If a future agent introduces:

- a new advanced disclosure pattern
- a new summary card system
- assistant-readable detail surfaces
- a new modal behavior rule

it should update this folder before treating the design as complete.
