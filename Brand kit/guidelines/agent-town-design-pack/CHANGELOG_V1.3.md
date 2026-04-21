# Agent Town Design Governance Pack — V1.3 Changelog

## What changed

This pack updates the existing design/branding markdown system so V1.3 visual game-surface rules live in the correct source-of-truth files instead of only in `AGENTS.md` or an implementation prompt.

## Updated files

- `BRAND.md`
  - Adds Agent Town / Founders Plot hierarchy.
  - Adds Founders Plot brand law.
  - Adds Clover/Foreman role law.
  - Adds Founders Plot vocabulary and no-jargon rules.
  - Adds GenAI asset brand law.

- `DESIGN.md`
  - Expands scope from shell/onboarding to Founders Plot V1 game surface.
  - Adds scenic game-surface composition rules.
  - Adds world-object, building-state, Clover, text-budget, and asset rules.

- `GAME_UX.md`
  - Adds Founders Plot UX thesis.
  - Adds five-second game test.
  - Adds attention arbitration rules.
  - Adds game-surface interaction law and measurable acceptance criteria.

- `REGISTRY.md`
  - Expands `@agent-town` registry scope to include V1 game-surface primitives/blocks.
  - Adds Founders Plot registry law.

- `AGENTS.md`
  - Converts AGENTS into workflow/guardrail/linking document.
  - Points coding agents to design docs as the durable style source.

- `agent-town-founders-plot-v1.3-design-source-handoff.md`
  - Provides the adapted Codex/GPT-5.4 implementation prompt that references the design docs.

## Why this is better

The design system becomes fixed, specified, testable, and LLM-readable.

`AGENTS.md` remains concise and operational, while the detailed brand and UX rules live where future designers, developers, and LLM coding agents expect them.
