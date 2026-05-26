# REGISTRY.md
_Status: starter private registry definition for shell, onboarding, Founders Plot V1 game surface, and V1.4.2 asset-governance contracts_

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

### V1.4.2 asset-governance items
- `gpt-image-2-prompt-contract`
- `asset-manifest-entry`
- `asset-inventory-row`
- `visual-signoff-sheet`
- `generated-asset-candidate-folder`
- `prompt-provenance-validator`
- `hero-cast-reference-card`
- `scene-layer-plate`
- `world-overlay-marker`
- `clover-action-link`
- `hq-progression-visual`
- `platform-start-gate-hero`
- `platform-town-shell-background`
- `platform-district-icon`
- `platform-illustration-card`
- `platform-empty-state`

### Three.js scene primitives

- `three-town-stage`
- `three-world-object`
- `three-state-anchor`
- `three-clover`
- `three-object-picker`
- `three-accessibility-mirror`
- `three-selected-detail`
- `three-scene-hud-row`
- `three-region-grid`
- `three-region-cell`
- `three-settlement-node`
- `three-route-edge`
- `three-world-zoom-control`
- `three-public-node`

Each Three.js scene primitive must declare:

- scene-state input;
- stable object ID;
- accessible DOM mirror;
- Playwright selector/test hook;
- performance expectations;
- fallback behavior.

V5+ world-grid primitives must also declare:

- zoom level ownership;
- public/private state category;
- keyboard navigation behavior;
- redaction contract if the primitive can display public or neighbor data;
- rollback/moderation indicator if the primitive can appear in public districts.

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

### 7.4 Asset-governance rules

For V1.4.2 and later visual-production sprints:

- every generated production asset must map to a durable prompt contract;
- candidate folders are part of the registry workflow, not ad hoc scratch space;
- manifest entries must keep prompt and reference provenance;
- screenshot signoff is required before gameplay or primary-view use;
- hero-cast platform assets stay quarantined from default Founders Plot gameplay unless a later spec explicitly changes that boundary.

For the V1.4.2 acceptance cleanup:

- scene backgrounds must use the layered-plates model;
- overlay markers must carry semantic roles instead of defaulting to one shared pill style;
- mobile available-lot labels must stay quiet by default;
- Clover action proof must remain visible without opening the Foreman drawer;
- HQ progression visuals must expose readable starter, improved, and established tiers.

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

### `platform-start-gate-hero`
Use for the Start Gate V1.4.3 hero background. Prompt and manifest provenance are required.

### `platform-town-shell-background`
Use for the town-shell scenic background. Prompt and manifest provenance are required.

### `platform-district-icon`
Use for town-shell district preview thumbnails. Variants cover `townhall`, `founders_plot`, `brain`, `house`, `pony`, `saloon`, `sigil`, `atlas`, and `leaderboard`.

### `platform-illustration-card`
Use for approved platform route illustrations with caption and optional CTA context.

### `platform-empty-state`
Use for empty/loading/error states that carry V1.4.3 generic ornamentation instead of plain placeholders.

## V1.4.4 Onboarding Components

### `play-first-entry-card`

Purpose: primary Start Gate / Town Shell card that routes authenticated users into Founders Plot.

Required props:

```ts
type PlayFirstEntryCardProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  destination: 'founders-plot';
  requiresAuth: true;
};
```

### `clover-mode-badge`

Purpose: shows whether Clover is in Manual Founder Mode or Real Foreman Mode.

Required props:

```ts
type CloverModeBadgeProps = {
  mode: 'MANUAL_FOUNDER' | 'REAL_CLOVER' | 'OFFICIAL_TOWN';
  brainConfigured: boolean;
  runtimeReady: boolean;
};
```

### `brain-quick-connect-sheet`

Purpose: compact in-game Brain connection surface.

Required props:

```ts
type BrainQuickConnectSheetProps = {
  providerOptions: ProviderOption[];
  selectedProvider?: string;
  selectedModel?: string;
  onSave: (config: BrainConfig) => Promise<void>;
  onOpenFullSettings: () => void;
  onDismiss: () => void;
};
```

### `townhall-official-invite`

Purpose: non-blocking progression invite after HQ2 / first contract / public identity attempt.

Required props:

```ts
type TownHallOfficialInviteProps = {
  reason: 'HQ2_REACHED' | 'FIRST_CONTRACT_DONE' | 'PUBLIC_FEATURE_ATTEMPT';
  onOpenTownHall: () => void;
  onDismiss: () => void;
};
```

### `manual-foreman-locked-control`

Purpose: disabled/locked state for real Foreman controls when Brain is missing.

Required behavior:

- friendly copy;
- no raw debug/provider language;
- direct path to Brain Quick Connect;
- no blocking of manual human actions.

## 13. Registry law for AI developers

When generating UI code:
- prefer registry installs over custom one-off markup
- do not restyle registry blocks ad hoc
- extend through variants, slots, and documented props
- if you find yourself copying a shell section twice, it belongs in the registry

## 14. V1.4.2 cleanup primitives

### `scene-layer-plate`

Declares scene background plates that contain terrain or atmosphere but no stateful live objects.

```ts
type SceneLayerPlate = {
  id: string;
  layerRole: "scene-base" | "scene-ambient";
  sceneLayering: {
    mode: "layered_plates";
    containsLiveStatefulObjects: false;
    allowedBakedContent: string[];
    forbiddenBakedContent: string[];
  };
};
```

### `world-overlay-marker`

Canonical semantic overlay for map labels and badges.

```ts
type WorldOverlayVariant =
  | "objective"
  | "primary-action"
  | "available"
  | "status"
  | "ambient"
  | "debug";
```

Rules:

- `objective`: max one visible;
- `debug`: never visible in normal gameplay;
- `available`: quiet, icon or stake preferred, hidden text on mobile;
- `status`: compact icon or badge;
- `ambient`: low priority.

### `clover-action-link`

Renders Clover-to-target action relationship without opening the Foreman drawer.

```ts
type CloverActionLinkProps = {
  cloverState: "idle" | "thinking" | "acting" | "waiting" | "blocked";
  targetObjectId?: string;
  targetAnchor?: { x: number; y: number };
  showWhenDrawerClosed: boolean;
};
```

### `hq-progression-visual`

Renders HQ upgrade visual state.

```ts
type HqProgressionTier = "starter" | "improved" | "established";
```

Mapping:

- HQ 1 -> `starter`
- HQ 3 -> `improved`
- HQ 5 -> `established`

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

# V1.3.1 Addendum — Signoff Registry Items

_Status: canonical for Agent Town: Founders Plot V1.3.1 visual-surface signoff_

## R6. V1.3.1 registry extensions

These items extend the V1.3 game-surface registry. They exist to prevent one-off fixes from becoming unreviewable style drift.

### `hero-frame-baseline`

Purpose:
- standardize the canonical launch-grade hero screenshot and its review metadata.

Contract:
- captures full app route at 1280px;
- contains no normal-surface debug panels;
- references approved primary-view assets;
- stored as a screenshot baseline and linked from the V1.3.1 spec or release note.

Required metadata:

```json
{
  "frameId": "founders-v1-3-1-hero-1280",
  "route": "/app?district=founders-plot",
  "viewport": { "width": 1280, "height": 900 },
  "approvedBy": "name-or-handle",
  "approvedAt": "YYYY-MM-DD",
  "notes": "short signoff note"
}
```

### `clover-target-link`

Purpose:
- make Clover's `acting` state visibly connected to the target world object.

Contract:
- receives `state`, `targetObjectId`, `targetLabel`, `actionVerb`;
- renders only when Clover is acting or when the selected action needs target explanation;
- supports reduced motion;
- exposes `data-testid="clover-target-link"`;
- has accessible text describing target and action.

### `objective-attention-ring`

Purpose:
- give exactly one current object the strongest attention treatment.

Contract:
- supports attention levels: `none`, `available`, `recommended`, `blocked`;
- only one `recommended` object by default;
- works without relying only on color;
- mobile treatment is quieter than desktop.

### `mobile-label-controller`

Purpose:
- centralize label visibility rules at mobile widths.

Contract:
- hides nonessential labels on mobile;
- allows selected object label;
- allows objective-relevant label;
- allows compact state icon/badge for ready/blocked states;
- exposes testable counts for visible labels.

### `badge-stack-governor`

Purpose:
- prevent badges/pills from accumulating into dashboard clutter.

Contract:
- enforces badge priority;
- max 2 visible object badges on desktop;
- max 1 visible object badge on mobile unless selected;
- excess state moves to sheet/tooltip.

### `devtools-quarantine-toggle`

Purpose:
- make backstage/debug surfaces available without polluting the normal game surface.

Contract:
- debug UI hidden by default;
- can be enabled only through explicit debug/dev mode;
- does not appear in first-run or normal Founders Plot screenshots;
- debug mode is visually marked as non-player-facing.

## R7. Asset approval registry rule

`asset-manifest.json` must now support human approval metadata for primary-view assets.

Each primary-view asset entry must include:

```json
{
  "id": "hq-lv1",
  "path": "assets/buildings/hq-lv1.webp",
  "kind": "building|scene|character|effect|icon",
  "usage": "primary-view|secondary|debug|unused",
  "source": "generated|handmade|licensed|unknown",
  "prompt": "optional prompt or prompt reference",
  "approvalStatus": "draft|needs_revision|approved",
  "approvedBy": "name-or-handle|null",
  "approvedAt": "YYYY-MM-DD|null",
  "approvalNotes": "short note"
}
```

V1.3.1 final signoff requires `usage: primary-view` assets to be `approvalStatus: approved`.

## R8. Registry executable-stub rule

When a registry item is referenced by `REGISTRY.md`, the branch should include one of:

- an actual reusable component/module;
- a documented contract file under the registry docs;
- a deliberate note explaining why the current implementation is still local and when it will be promoted.

This prevents the registry from becoming aspirational text that AI developers cannot use.


---

## V1.4 registry additions

These items are approved as registry targets for the AI reality + visual-direction workflow.

### `foreman-decision-receipt`

Normal player-facing one-line receipt after a Foreman action.

Requirements:

- no provider/model/debug jargon;
- expandable audit link only if appropriate;
- references the visible game reason;
- tied to replay event ID.

### `foreman-debug-trace-panel`

Debug-only panel for worker/model/tool context traces.

Requirements:

- hidden in normal gameplay;
- shows model/test-brain invocation ID;
- shows pack hashes;
- shows provider-safe alias and canonical tool;
- shows selected candidate and server validation result.

### `visual-direction-pack-template`

Markdown template block for visual signoff packs.

Requirements:

- mood board;
- reference board;
- anti-examples;
- paintover list;
- weak asset list;
- screenshot rubric;
- art owner field.

### `hero-media-source-index`

Markdown/source-index pattern for prior hero video/script recovery.

Requirements:

- status field;
- searched terms;
- searched paths;
- recovered sources;
- provenance;
- recommended use;
- open questions.

### `reference-board-card`

Small doc/UI primitive for annotating references by principle instead of copying.

Requirements:

- borrow-this field;
- do-not-borrow field;
- rights/provenance field.

### `screenshot-signoff-panel`

Review surface for comparing candidate screenshots.

Requirements:

- desktop/mobile/Clover acting states;
- score table;
- named reviewer;
- pass/fail decision.

### `hero-cast-reference-card`

Reference-card pattern for one hero-cast character.

Requirements:

- source image path;
- canonical role;
- approval scope;
- usage notes;
- explicit non-gameplay warning when applicable.

### `asset-approval-scope-badge`

Internal review badge for asset scope.

Requirements:

- allowed values:
  - `brand_reference`
  - `marketing_asset`
  - `gameplay_asset`
- never shown in normal gameplay;
- used in review and manifest tooling only.

### `hero-video-frame-index`

Optional future marketing registry concept for extracted hero-video stills.

Requirements:

- not required for V1.4.1;
- only created if explicit extraction work is later approved;
- records timestamp, preserve/avoid notes, and approved usage.

## New / updated game-surface registry items

### `mobile-stage-signal-policy`

Defines mobile label, badge, and feedback suppression for Founders Plot.

Required behavior:

- exposes current viewport class;
- accepts selected object, objective object, Clover target, and feedback list;
- returns visible/suppressed signals;
- enforces mobile text and label budgets.

### `quiet-lot-marker`

A small in-world marker for non-objective available lots.

Must not use persistent text on mobile.

### `objective-lot-marker`

The only strong default lot marker when the current objective points to a lot.

Must be visually distinct from quiet lot markers.

### `hq-progression-gallery`

A test/review component that renders HQ L1/L3/L5 at gameplay scale.

Required modes:

- labeled;
- no-label;
- desktop;
- mobile crop, if useful.

### `hq-upgrade-visual-ladder`

The asset contract for HQ L1/L3/L5 progression.

Must include:

- asset paths;
- visual tier metadata;
- prompt/provenance path;
- approval state;
- visual-delta test status.

## V1.4.4 Onboarding Primitives

### `play-first-start-gate`

Routes an authenticated Privy/test user directly into Founders Plot play-first mode.

Required states:

- unauthenticated;
- auth pending;
- authenticated redirecting;
- error/fallback.

### `manual-founder-mode-badge`

Explains that the user can play manually without Brain.

Required copy:

- no Brain required;
- no AGENT mutations;
- Connect Brain CTA when appropriate.

### `brain-quick-connect-sheet`

Connects a real Brain only after the player has entered the game.

Required states:

- none;
- preview/test;
- real ready;
- blocked/invalid.

### `real-clover-locked-callout`

Friendly guard when Clover actions require Brain.

Required error code:

- `BRAIN_REQUIRED`
