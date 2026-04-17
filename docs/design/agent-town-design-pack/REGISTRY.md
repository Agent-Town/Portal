# REGISTRY.md
_Status: starter private registry definition for shell + onboarding_

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
