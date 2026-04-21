# REGISTRY.md
_Status: starter private registry definition for shell, onboarding, and Founders Plot V1 game surface_

## 1. Purpose

`@agent-town` is the private component/block registry for the **DOM shell and onboarding layer** of Agent Town.

It exists to stop three recurring failures:
1. one-off shell styling
2. UX drift between screens
3. AI-generated frontend work that ignores the approved design language

This registry is **not** the game renderer.
It governs:
- shell surfaces
- modal shells
- onboarding blocks
- helper drawers
- form primitives used in those flows

## 2. Why a registry

The shell and onboarding layer must become:
- specified
- fixed
- iterable
- installable by AI developers

A private registry is the cleanest way to:
- reuse approved patterns
- attach contracts to blocks
- version shell changes
- keep Figma exploration and implementation in sync

## 3. Stack choice

This registry is defined to work with the current shadcn registry model:
- a private namespaced registry
- installable items
- support for components, hooks, pages, config, rules, and other files

This registry only targets the React / DOM layer around the game.
It does **not** attempt to package Pixi/canvas world rendering primitives.

## 4. Namespace

Use:
- `@agent-town`

Install examples:
```bash
npx shadcn@latest add @agent-town/frontier-base
npx shadcn@latest add @agent-town/town-shell
npx shadcn@latest add @agent-town/townhall-onboarding
```

## 5. Registry scope

### In scope
- theme tokens
- shell CSS variables
- shell utilities
- buttons
- panel primitives
- fields
- modal frame
- hotspot sign
- start gate block
- town shell block
- district modal block
- Town Hall onboarding block
- brain connect block
- sigil step block
- agent comms drawer block

### Out of scope
- canvas map rendering
- combat HUDs
- full city-builder economy HUDs
- blockchain contract bindings
- trainer / debug heavy internal tools as first-class public blocks

## 6. Item taxonomy

### Base
`frontier-base`
- theme CSS
- token exports
- motion variables
- shell utility classes

### UI primitives
- `parchment-panel`
- `brass-button`
- `status-pill`
- `frontier-field`
- `sheet-frame`
- `hotspot-sign`

### Blocks
- `start-gate`
- `town-shell`
- `district-modal`
- `townhall-onboarding`
- `brain-connect-panel`
- `sigil-lock-step`
- `agent-comms-drawer`

## 7. Governance rules

### 7.1 Base token changes
Any change to `frontier-base` requires:
- `DESIGN.md` update
- screenshot diffs at 390 / 768 / 1280
- approval from design owner or product owner

### 7.2 Block changes
Any change to a block requires:
- contract update if behavior changed
- screenshot diffs
- at least one acceptance test update

### 7.3 New primitives
Do not add a new primitive unless:
- it cannot be expressed with the current registry
- it solves a repeated shell/onboarding problem
- it gets documented in `DESIGN.md`

## 8. Block contracts

Every block should ship with a `.contract.md` file that answers:
- what this block is for
- when to use it
- when not to use it
- the visual hierarchy it must preserve
- responsive rules
- measurable acceptance rules

## 9. Registry versioning

### 9.1 Versioning model
Use semver at the registry item level.

### 9.2 Breaking changes
Breaking visual or API changes require:
- new major version
- migration note
- updated screenshot baselines

### 9.3 Pack branding
Use `frontier-v1` as the current shell system family.

## 10. Development workflow

1. Read `BRAND.md`
2. Read `DESIGN.md`
3. Read `GAME_UX.md`
4. Install `@agent-town/frontier-base`
5. Install the block you need
6. Customize only through approved props, slots, or composition
7. If you must fork the block, upstream the improvement into the registry

## 11. Private registry auth

Use authenticated access for internal development and CI.
Example `components.json` entry is included in this pack.

Registry auth should be provided through:
- bearer token header
- CI secret for pipelines
- local environment variable for trusted developers

## 12. Initial registry item list

### `frontier-base`
Use for every shell or onboarding screen.

### `parchment-panel`
Use for most readable content containers.

### `brass-button`
Use for secondary shell actions and tactile buttons.

### `status-pill`
Use for compact state only.

### `frontier-field`
Use for shell/onboarding forms.

### `sheet-frame`
Use for drawers and mobile sheets.

### `hotspot-sign`
Use to label districts and place-based navigation anchors.

### `start-gate`
Use for the opening entry hero.

### `town-shell`
Use for the scenic hub shell.

### `district-modal`
Use for district interiors launched from the shell.

### `townhall-onboarding`
Use for the main onboarding story container.

### `brain-connect-panel`
Use for brain connection flows with progressive disclosure.

### `sigil-lock-step`
Use for mirrored lock / trust ritual steps.

### `agent-comms-drawer`
Use for helper receipts, approvals, and context-aware chat.

## 13. Registry law for AI developers

When generating UI code:
- prefer registry installs over custom one-off markup
- do not restyle registry blocks ad hoc
- extend through variants, slots, and documented props
- if you find yourself copying a shell section twice, it belongs in the registry

---

# V1.3 Addendum — Founders Plot Registry Expansion

_Status: canonical for Agent Town: Founders Plot V1 game-surface components_

## R1. Expanded scope

`@agent-town` now governs:

- DOM shell surfaces;
- onboarding surfaces;
- helper drawers;
- Founders Plot V1 scenic game-surface DOM blocks;
- world-object interaction primitives;
- game HUD, action sheets, and diegetic state markers.

This registry is **not** a full canvas/game-engine renderer. It does govern the current DOM-based Founders Plot visual game surface until a future renderer rewrite is explicitly approved.

## R2. New game-surface item taxonomy

### Base

`game-surface-base`
- Founders Plot game-surface tokens;
- object-layer utilities;
- accessibility utilities;
- reduced-motion helpers.

### UI primitives

- `world-object`
- `building-state-badge`
- `timer-ring`
- `resource-flyout`
- `town-journal-trigger`
- `approval-inbox-trigger`

### Blocks

- `founders-plot-stage`
- `game-top-hud`
- `context-action-sheet`
- `clover-foreman`
- `contract-board-object`

## R3. Item usage rules

### `game-surface-base`
Use before building any Founders Plot visual surface.

### `founders-plot-stage`
Use for the dominant scenic plot layer.

### `game-top-hud`
Use for HQ level, core resources, and one current objective.

### `world-object`
Use for clickable/tappable in-world buildings and town objects.

### `building-state-badge`
Use for ready, producing, blocked, buildable, upgrade, and selected states.

### `timer-ring`
Use for construction and production progress.

### `resource-flyout`
Use for short collect/reward feedback such as `+3 wood`.

### `context-action-sheet`
Use for selected-object actions on desktop and mobile.

### `clover-foreman`
Use to embody Clover states in the world.

### `contract-board-object`
Use for the physical contract-board entry point.

### `town-journal-trigger`
Use for recap/history entry points.

### `approval-inbox-trigger`
Use for pending approval badges and drawer entry points.

## R4. Founders Plot registry law

For V1.3 visual game-surface work:

1. Install/use `game-surface-base` before building any new Founders Plot screen primitives.
2. Use `founders-plot-stage` for the scenic plot composition.
3. Represent buildings through `world-object` plus `building-state-badge` / `timer-ring`.
4. Use `context-action-sheet` for selected object details.
5. Use `clover-foreman` for Clover embodiment; do not build Foreman as a normal status card.
6. Use `resource-flyout` and `timer-ring` for game feel, but keep the server state authoritative.
7. If a one-off component starts to repeat, promote it to the registry and add a contract.

## R5. Asset registry rule

Generated visual assets are not shadcn components, but they must still be registry-adjacent and manifest-driven.

Required asset manifest path:

```text
public/experiences/founders-plot/assets/asset-manifest.json
```

The manifest must list every generated or sourced asset used by the scenic game surface.
