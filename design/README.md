# Poker Design Docs

This folder is the canonical design-spec workspace for the poker surfaces in this repo.

It exists because the repo previously had strong engineering specs but no equivalent design-spec set. Future agentic AI design work should start here before proposing or implementing any UI changes.

## Scope

- Poker routes only
- Visual design, layout, spacing, typography, color, motion, responsiveness, accessibility
- Beginner-first AI framing for users with little AI knowledge
- Dead-simple default player UX, with richer detail demoted to explicit advanced or AI-mediated surfaces
- One-source, two-projection design: the same structured poker state should power a dead-simple human view and a richer LLM or advanced view without drift
- International readiness with English and Simplified Chinese as initial design-validation locales
- Provider-neutral, service-neutral hierarchy
- Future voice-ready structure without functional voice controls yet
- No functionality changes

## Status

- Baseline design audit completed on 2026-03-16
- Dead-simple simplicity pivot added on 2026-03-16 after external poker-UI research
- These docs define the target system and the test-driven path to reach it
- Cross-market and beginner-user constraints are now part of the canonical design definition
- LLM-rich secondary detail is now a first-class design rule: rich context may stay available, but it must not crowd the default human route
- A TLA+ formal layer now exists for design-state projection and visibility invariants

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
14. [07_poker_play_design_v1_dead_simple_research.md](./07_poker_play_design_v1_dead_simple_research.md)
15. [08_poker_play_design_v1_formal_methods.md](./08_poker_play_design_v1_formal_methods.md)
16. [tla/README.md](./tla/README.md)

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

If a design decision changes visibility, gating, or projection rules, update the TLA+ layer as well.
