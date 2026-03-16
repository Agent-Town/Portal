# Poker Design Docs

This folder is the canonical design-spec workspace for the poker surfaces in this repo.

It exists because the repo previously had strong engineering specs but no equivalent design-spec set. Future agentic AI design work should start here before proposing or implementing any UI changes.

## Scope

- Poker routes only
- Visual design, layout, spacing, typography, color, motion, responsiveness, accessibility
- Beginner-first AI framing for users with little AI knowledge
- International readiness with English and Simplified Chinese as initial design-validation locales
- Provider-neutral, service-neutral hierarchy
- Future voice-ready structure without functional voice controls yet
- No functionality changes

## Status

- Baseline design audit completed on 2026-03-16
- No design phase is implemented yet
- These docs define the target system and the test-driven path to reach it
- Cross-market and beginner-user constraints are now part of the canonical design definition

## Read Order

1. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
2. [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md)
3. [APP_FLOW.md](./APP_FLOW.md)
4. [PRD.md](./PRD.md)
5. [TECH_STACK.md](./TECH_STACK.md)
6. [progress.txt](./progress.txt)
7. [LESSONS.md](./LESSONS.md)
8. [01_poker_play_design_v1_implementation_pack.md](./01_poker_play_design_v1_implementation_pack.md)
9. [02_poker_play_design_v1_backlog.md](./02_poker_play_design_v1_backlog.md)
10. [03_poker_play_design_v1_tdd_spec.md](./03_poker_play_design_v1_tdd_spec.md)
11. [04_poker_play_design_v1_audit_baseline.md](./04_poker_play_design_v1_audit_baseline.md)
12. [05_poker_play_design_v1_execution_plan.md](./05_poker_play_design_v1_execution_plan.md)
13. [06_poker_play_design_v1_test_matrix.md](./06_poker_play_design_v1_test_matrix.md)

## Source Derivation

These docs were derived from the current live app and the existing repo sources:

- [specs/00_product_story.md](../specs/00_product_story.md)
- [specs/01_experience_flow.md](../specs/01_experience_flow.md)
- [specs/02_api_contract.md](../specs/02_api_contract.md)
- [specs/25_poker_play_platform_v2_scaling_implementation_pack.md](../specs/25_poker_play_platform_v2_scaling_implementation_pack.md)
- [public/poker.html](../public/poker.html)
- [public/poker.js](../public/poker.js)
- [public/styles.css](../public/styles.css)

## Working Rule For Future Agents

If a design decision is not documented in this folder, treat it as unspecified and add it here before implementation.
