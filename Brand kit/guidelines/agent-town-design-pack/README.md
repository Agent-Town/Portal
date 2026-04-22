# Agent Town Design Pack v1

This pack turns the current Portal shell, onboarding flow, and Founders Plot game surface into fixed, repo-native design law for humans and AI coding agents.

## Contents

1. `BRAND.md`
   - Product fantasy, tone, character defaults, naming rules, copy rules, and anti-patterns.
2. `DESIGN.md`
   - Visual system, tokens, typography, composition rules, surface recipes, motion, accessibility, and implementation rules.
3. `GAME_UX.md`
   - Screen map, progression flow, shell behavior, onboarding behavior, drawer behavior, and measurable acceptance criteria.
4. `REGISTRY.md`
   - The first private `@agent-town` registry definition, scope, governance, and install rules.
5. `CHANGELOG_V1.3.md`
   - Delta log for the V1.3 design-governance expansion.
6. `agent-town-founders-plot-v1.3-design-source-handoff.md`
   - Implementation handoff explaining how the design docs and sprint spec should be used together.
7. `AGENTS.original.md`
   - The pack-supplied AGENTS draft preserved for reference against the repo root `AGENTS.md`.
8. `components.json`
   - Starter shadcn-compatible config for a private namespaced registry.
9. `registry/`
   - Registry metadata files for the first shell and onboarding components/blocks.
10. `registry-source/`
   - Minimal source stubs, contracts, and theme files for the first registry items.

## Intended use

Read order for AI developers:

1. `BRAND.md`
2. `DESIGN.md`
3. `GAME_UX.md`
4. `REGISTRY.md`
5. the active sprint spec in `specs/`
6. install only the blocks needed for the screen you are changing

## Scope

This pack governs **DOM shell + onboarding surfaces** and the **Founders Plot V1 game surface** for Agent Town:
- Start / Enter flow
- Town shell
- District modal shell
- Town Hall onboarding
- Brain connection panel
- Sigil / lock step
- Agent Comms drawer
- Founders Plot scenic stage
- Founders Plot world-object interaction patterns
- Founders Plot Clover/Foreman embodiment

This pack does **not** define:
- future Pixi/canvas/engine renderer internals
- off-session governance systems
- creator tools beyond the patterns listed above
- low-level blockchain contract design

## Design decision

Previous flagship assumptions around **retro pixel UI** are deprecated for the shell and onboarding layer.

The shell is now a **warm frontier storybook** system:
- parchment
- wood
- brass
- teal accents
- trustworthy defaults
- cinematic one-screen compositions

A game world can still be stylized and readable, but the shell and Founders Plot V1 game surface must no longer inherit pixel-font, 8-bit-border, or novelty-retro defaults.

## Addendum set

The checked-in Founders Plot addenda now include:

- `CHANGELOG_V1.3.md`
- `agent-town-founders-plot-v1.3-design-source-handoff.md`
- `specs/22_founders_plot_v1_3_visual_game_surface.md`
- `specs/23_founders_plot_v1_3_1_visual_signoff_pass.md`
- `specs/26_founders_plot_v1_4_ai_reality_and_visual_direction_pack.md`
- `specs/28_founders_plot_v1_4_1_hero_cast_video_addendum.md`

These extend the pack from shell/onboarding law into scenic game-surface law, AI-reality guardrails, and recovered hero-cast governance for Agent Town: Founders Plot.
