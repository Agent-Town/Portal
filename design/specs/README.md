# Design Specs

This folder mirrors the repo's engineering TDD discipline, but for design work.

Each spec should be treated as:

1. scoped,
2. measurable,
3. approval-gated,
4. implementation-ready for a future AI design agent.

Cross-cutting rule:

1. the default UI should stay simple enough for non-technical users,
2. rich detail should remain available through advanced views and LLM-readable product state,
3. future design work should not confuse "less visible by default" with "deleted from the product."

## Reading order

1. `00_design_tdd_protocol.md`
2. `01_design_audit_baseline_2026_03_16.md`
3. `08_frontend_design_master_implementation_roadmap.md`
4. `09_global_human_first_design_requirements.md`
5. approved phase spec(s) only

If a phase changes what the default UI summarizes versus what advanced views, the LLM, or future voice affordances may express, also read:

1. `../formal/README.md`
2. `../formal/DesignProjectionNoDrift.tla`
3. `../formal/VoiceInteractionGrammar.tla` (for command and locale alignment)

## Spec structure

Every design spec should include:

1. goal,
2. scope,
3. non-goals,
4. constraints,
5. viewport matrix,
6. measurable visual acceptance criteria,
7. evidence requirements,
8. exact file targets,
9. exit criteria.

Whenever relevant, specs should also state:

1. what detail stays in the product for LLM use,
2. what detail is hidden from the default human path,
3. which advanced views preserve optional human deep inspection.

## Verification model

Design verification is not only subjective review.

Every phase should define measurable checks such as:

1. primary action visible without scroll,
2. no horizontal overflow at target viewports,
3. minimum tap target comfort,
4. reduced visible advanced controls by default,
5. stable accessible names and focus states,
6. no regression in full Playwright coverage.
