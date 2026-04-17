# Agent Town Design Pack v1

This pack turns the current Portal shell and onboarding flow into fixed, repo-native design law for humans and AI coding agents.

## Contents

1. `BRAND.md`
   - Product fantasy, tone, character defaults, naming rules, copy rules, and anti-patterns.
2. `DESIGN.md`
   - Visual system, tokens, typography, composition rules, surface recipes, motion, accessibility, and implementation rules.
3. `GAME_UX.md`
   - Screen map, progression flow, shell behavior, onboarding behavior, drawer behavior, and measurable acceptance criteria.
4. `REGISTRY.md`
   - The first private `@agent-town` registry definition, scope, governance, and install rules.
5. `components.json`
   - Starter shadcn-compatible config for a private namespaced registry.
6. `registry/`
   - Registry metadata files for the first shell and onboarding components/blocks.
7. `registry-source/`
   - Minimal source stubs, contracts, and theme files for the first registry items.

## Intended use

Read order for AI developers:

1. `BRAND.md`
2. `DESIGN.md`
3. `GAME_UX.md`
4. install `@agent-town/frontier-base`
5. install only the blocks needed for the screen you are changing

## Scope

This pack governs **DOM shell + onboarding surfaces** for Agent Town:
- Start / Enter flow
- Town shell
- District modal shell
- Town Hall onboarding
- Brain connection panel
- Sigil / lock step
- Agent Comms drawer

This pack does **not** define:
- Pixi / canvas world rendering internals
- full city-builder HUDs
- creator tools beyond the shell patterns listed above
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

A game world can still be stylized and readable, but the shell must no longer inherit pixel-font, 8-bit-border, or novelty-retro defaults.
