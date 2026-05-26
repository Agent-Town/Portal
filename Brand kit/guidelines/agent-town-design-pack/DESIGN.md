---
version: "v1.4.2"
name: "Agent Town Warm Frontier Storybook"
description: "Machine-readable design tokens and human-readable visual law for Agent Town, Founders Plot, and the governed asset rebuild."
colors:
  primary: "#7A3F22"
  secondary: "#2F5D50"
  tertiary: "#D99A3D"
  background: "#F7E8C8"
  surface: "#FFF3D6"
  ink: "#2A1A0D"
  brass: "#C7892E"
  sage: "#6F8A58"
  focus: "#2B76C4"
typography:
  display:
    fontFamily: "var(--font-display, Georgia, serif)"
    fontSize: "2.75rem"
    fontWeight: "800"
  body:
    fontFamily: "var(--font-body, system-ui, sans-serif)"
    fontSize: "1rem"
    fontWeight: "500"
  label:
    fontFamily: "var(--font-body, system-ui, sans-serif)"
    fontSize: "0.78rem"
    fontWeight: "800"
components:
  game-stage:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
  panel-parchment:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  objective-ribbon:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.ink}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFF7E8"
  overlay-objective:
    role: "objective"
    maxVisible: 1
    attention: "strongest"
  overlay-primary-action:
    role: "primary-action"
    attention: "strong"
  overlay-available:
    role: "available"
    attention: "quiet"
  overlay-status:
    role: "status"
    attention: "compact"
  overlay-ambient:
    role: "ambient"
    attention: "quiet"
  overlay-debug:
    role: "debug"
    normalGameplayVisible: false
sceneLayers:
  mode: "layered_plates"
  base: "scene-base"
  ambient: "scene-ambient"
  liveObjects: "live-object"
  characters: "character"
  effects: "effects"
  overlays: "ui-overlay"
  backgroundContainsLiveStatefulObjects: false
assetGeneration:
  v1_4_3:
    model: gpt-image-2
    scope: app-wide-platform-assets
    styleFamily: agent-town-frontier-storybook-v1_4_3
    promptsAreSource: true
    manifestRequired: true
    humanSignoffRequired: true
    transparentBackgroundPolicy: clean-background-plus-postprocess
    appWideManifest: public/assets/platform/asset-manifest.json
    promptRoots:
      - specs/prompts/v1_4_3
      - public/assets/platform/prompts/v1_4_3
---

# DESIGN.md
_Status: canonical for shell, onboarding, Founders Plot V1 game surfaces, and V1.4.2 asset-generation law_

## 1. Purpose

This file defines the visual law for Agent Town’s shell and onboarding UI.

It is meant to be:
- readable by humans
- executable by AI coding agents
- stable enough to prevent style drift
- specific enough to stop “generic card app” regressions

This file governs:
- layout
- color roles
- typography
- panel recipes
- motion
- responsive rules
- anti-patterns
- implementation constraints

## Overview

Agent Town uses a warm frontier storybook design system. The UI must feel like a game world first and a control surface second. The player should see a town, a current goal, and Clover helping inside that town.

This file now carries both machine-readable tokens in front matter and human-readable visual law in the markdown body.

## Three.js visual system

The Founders Plot world surface uses Three.js as the forward renderer path.

Visual assets may be:

- generated 2D billboard sprites;
- textured planes;
- ambient world props;
- future GLB/glTF models.

The current production path may use GPT Image 2 generated 2D assets normalized through the 2D asset pipeline. Future GLB/glTF assets must record source prompt, concept image, model file, texture files, size budgets, bounding box, pickable nodes, approval metadata, and screenshot proof.

Do not bake stateful gameplay objects into backgrounds. Stateful objects must be live scene objects with server-state identity.

## V5+ World Grid Visual Language

The world grid extends the warm frontier storybook system. It should read as a
surveyed territory around the player's town, not a strategy-war map.

Grid cell state language:

- `locked`: quiet, distant, low-contrast terrain.
- `visible`: readable terrain with no strong action treatment.
- `claimable`: clear but secondary action marker.
- `claimed`: warm ownership tint tied to the home settlement.

Public/private distinction:

- private town and territory state uses warm parchment/sage/brass treatments;
- public or neighbor state uses cooler civic blue/teal accents;
- unsafe, moderated, or blocked public actions use explicit lock/moderation
  iconography and never rely on color alone.

World event visuals should look civic and cooperative: public works boards,
route markers, bridges, gardens, telegraph lines, or festival preparations.
Avoid battle-map, conquest, or speculative land-market motifs.

Camera and zoom behavior should preserve orientation. Z1 settlement, Z2
territory, and later Z3/Z4 views need visible home-town anchors, short camera
transitions, and DOM accessibility mirrors for every selectable cell or node.

## 1.1 V1.4.2 overview

The V1.4.2 art baseline is approved. The cleanup sprint is about route-level integration polish, not another broad asset rebuild.

## Asset Generation Law

All V1.4.2 player-facing production art must be:

- governed by a durable prompt file under `specs/prompts/`;
- generated or rebuilt through a reproducible candidate-first workflow;
- tied to reference inputs that live in the repo;
- tracked in the asset manifest with prompt hash, reference hashes, candidate id, post-processing, dimensions, byte size, and human approval;
- judged inside the actual route, not only as isolated artwork.

Rules:

- do not generate directly into production paths without candidate review;
- do not request transparent backgrounds from GPT Image 2; cut out or mask after generation when needed;
- do not rely on readable embedded text in generated art unless explicitly approved;
- do not treat screenshots as optional; full-route review is part of the asset contract.

## V1.4.2 signoff and route validation

The signoff surface is the full-route player experience. At minimum, review:

- Founders Plot desktop full-route;
- Founders Plot mobile full-route;
- selected-building state;
- Clover acting state with `clover-target-link`;
- Start Gate;
- town shell / hub;
- Town Hall onboarding;
- Brain Connect.

The route must still read as Agent Town even after the asset swap. Visual polish does not justify dashboard chrome, debug leakage, or gameplay-scope drift.

## V1.4.3 App-Wide Asset Refresh

All non-game platform assets must now follow the same prompt-versioned GPT Image 2 pipeline used for Founders Plot. The goal is visual coherence across Start Gate, town shell, Town Hall, Brain, House, Pony, Saloon, Sigil, Atlas, Leaderboard, and share/claim surfaces.

Generated assets must be treated as rebuildable source outputs. The durable source is the prompt file + references + manifest record + human signoff, not only the `.webp` file.

## V1.4.2 acceptance cleanup

### World overlays

World overlays must not all use the same white or pale pill treatment.

Use semantic classes:

- `objective`: one dominant current goal marker;
- `primary-action`: selected or recommended immediate action;
- `available`: quiet possible action marker;
- `status`: compact ready, producing, locked, or blocked marker;
- `ambient`: optional flavor or location identity;
- `debug`: hidden in normal gameplay.

Only the objective-relevant lot may get strong attention by default.

### Scene layering

Founders Plot uses layered plates:

- background plate for terrain, roads, and atmosphere;
- live object layer for all stateful objects;
- character layer for Clover;
- effects layer for action feedback;
- overlay layer for objective, status, and action UI.

Background plates must not contain stateful objects such as HQ, production buildings, Contract Board, Public Square, Foreman Hut, Clover, timer rings, or objective markers.

## V1.4.4 Onboarding Mode Visual Language

### Manual Founder Mode badge

Use a quiet helper badge, not an error badge.

Recommended text:

```text
Manual Founder Mode
Clover can guide the basics.
```

Visual treatment:

- low-emphasis parchment/charm styling;
- not red/error;
- positioned near Clover/Foreman controls;
- never above the primary objective.

### Brain Quick Connect CTA

Use one warm primary action:

```text
Connect a Brain
```

Subcopy:

```text
Let Clover reason about your town and help with approved actions.
```

Visual treatment:

- contextual sheet or compact card;
- no debug tabs;
- no provider wall on first view;
- advanced settings link may exist but is secondary.

### Town Hall invite

Use civic/progression styling, not setup-error styling.

Recommended text:

```text
Make it official
```

Subcopy:

```text
Your settlement is growing. Visit Town Hall to set your public role.
```

### Forbidden normal-gameplay visuals

Do not present missing Brain or missing Town Hall as failure states during manual play.

Forbidden normal-gameplay copy:

- `LLM not configured`
- `runtime missing`
- `provider error`
- `NO_SOLANA_WALLET`
- raw onboarding enum names
- raw localization keys

Raw diagnostics belong only in debug/dev surfaces.

### Clover grounding

Clover must read as physically present:

- visible ground shadow or contact;
- scale consistent with scene;
- clear target link when acting;
- no black matte or crop artifacts.

### HQ progression

HQ Level 1, Level 3, and Level 5 must be visually distinguishable at gameplay scale.

## 2. Current basis

This document is intentionally grounded in the current Portal shell:
- a Wild West start card with a single “Enter” CTA
- a town-view shell with district hotspots
- a framed district modal
- Town Hall story steps for human name/avatar, agent name/avatar, processing, and sigil test
- a persistent Agent Comms drawer
- backstage trainer/debug/brain surfaces

The design system keeps the good parts of that structure, but removes the clutter and hierarchy problems caused by exposing too many backstage controls in the main player path.

## 3. Visual thesis

**Frontier Storybook Shell**

A tactile frontier UI with:
- cinematic town backdrops
- wood and brass framing
- parchment interaction surfaces
- sunlit cream content planes
- teal for intelligence / active systems
- rust for risk and destructive states

The interface should feel:
- handcrafted
- warm
- readable
- atmospheric
- deliberate

It should not feel:
- sterile
- pixel-noisy
- meme-western
- overly polished SaaS
- visually fragmented

## 4. Hard composition rules

### 4.1 One composition per screen
Each primary screen must read as one unified scene.
- one hero
- one dominant action group
- one story beat
- supporting information only after the primary action is obvious

### 4.2 One obvious action above the fold
Every player-facing screen must have exactly one primary call to action visible above the fold.

### 4.3 No dashboard-first layouts
Do not begin with:
- grids of cards
- side-by-side configuration forms
- stacked technical checklists
- debug panels
- raw status matrices

### 4.4 Progressive disclosure
Advanced options must live behind:
- drawers
- details/summary controls
- explicit “advanced” toggles
- backstage screens

## 5. Color system

## Colors

### 5.1 Canonical token set

Use these as the default shell tokens.

```css
:root {
  --at-ochre-500: #c4883a;
  --at-sand-100: #f5e6c8;
  --at-sand-200: #e8d5a8;
  --at-rust-600: #a0522d;
  --at-teal-600: #5b8a8a;
  --at-brass-700: #8b7d3c;
  --at-wood-950: #2e1b0e;
  --at-cream-50: #fff8e8;
  --at-sun-200: #ffe4a0;

  --at-sky-100: #c2e6ff;
  --at-sky-300: #8dc8f0;
  --at-sky-500: #6bb0dd;
  --at-sky-600: #5b9bd5;
}
```

### 5.2 Role mapping

#### Background / atmosphere
- sky and horizon: `--at-sky-*`
- ambient warmth: `--at-sun-200`
- deep frame / border: `--at-wood-950`

#### Primary surfaces
- parchment panel fill: `--at-sand-100`
- panel border / depth: `--at-sand-200`
- reading plane / input interior: `--at-cream-50`

#### Actions
- primary confirm / intelligence / active system: `--at-teal-600`
- warm secondary action / reward / attractor: `--at-ochre-500`
- destructive / danger / error: `--at-rust-600`

#### Metallic detail
- rivets, small framing, ornamental accents: `--at-brass-700`

## 6. Contrast and legibility rules

- Text on parchment or cream must use `--at-wood-950`.
- Text on teal or rust fills must use `--at-cream-50`.
- Small text may not sit directly on photographic backgrounds.
- Do not place body text over town scenes without a surface behind it.
- Every interactive element must have a visible focus ring.

## Components

Treat these as canonical component behaviors for the scenic route:

- `game-stage`: main world composition, not a dashboard
- `objective-ribbon`: one dominant current-goal owner
- `panel-parchment`: contextual sheet and drawer body
- `overlay-objective`: strongest in-world cue
- `overlay-primary-action`: selected or recommended next interaction
- `overlay-available`: quiet opportunity marker
- `overlay-status`: compact readiness/lock/blocked state
- `overlay-ambient`: flavor only
- `overlay-debug`: never normal gameplay

## Do's and Don'ts

### Do

- Keep `WARNING! CONTAINS AND PRODUCES AI SLOP.` as product-owner-approved humorous Start Gate copy.
- Use one strong objective cue and quiet everything else.
- Keep mobile labels minimal.
- Put selected details in sheets rather than duplicating everything on the map.
- Keep art provenance and prompt history in manifests and docs.

### Don't

- Do not remove the `AI SLOP` warning without product-owner approval.
- Do not bake stateful gameplay objects into background plates.
- Do not show repeated `Build here` labels on mobile.
- Do not let Clover action be understandable only when a debug or drawer panel is open.
- Do not treat test-passing asset metadata as a substitute for product-owner visual signoff.

## 7. Typography

### 7.1 Type roles

#### Display
Use a western display face like `Rye` for:
- major titles
- district names
- ritual headers
- no more than 1–2 lines at a time

#### UI / body
Use a warm readable serif like `Wellfleet` for:
- body copy
- labels
- helper text
- dialog content
- onboarding steps

#### Accent / mono
Monospace is backstage only:
- debug output
- raw payloads
- developer tools
- never as the primary shell voice

### 7.2 Typography law
- Do not use pixel fonts on flagship shell surfaces.
- Do not use Inter as the defining face of the main game shell.
- Body text should stay calm and readable.
- Display type should be used sparingly; too much turns the product into costume.

### 7.3 Scale
Suggested desktop scale:
- Display XL: 40–52
- Display L: 32–40
- Heading: 24–28
- Body: 16–18
- Small: 13–14
- Micro / pill: 12–13

Suggested mobile scale:
- Display XL: 32–40
- Display L: 28–32
- Heading: 22–24
- Body: 15–16
- Small: 13–14

## 8. Layout grid

### 8.1 Screen width behavior
- max readable content width for heavy text: 720–840px
- shell hero compositions may extend wider visually, but copy blocks remain constrained
- side drawers must never reduce primary content below readable widths

### 8.2 Spacing rhythm
Use a 4 / 8 / 12 / 16 / 24 / 32 system.
Prefer fewer, larger spacing steps over noisy micro adjustments.

### 8.3 Radius and edge language
- panels: modest radius, visibly physical
- drawers and sheets: softer radius
- buttons: medium radius
- avoid perfect pill-everything systems

## 9. Surface recipes

### 9.1 Town backdrop
Purpose:
- establish place
- hold district hotspots
- make the shell feel like a destination

Rules:
- atmospheric depth
- readable hotspot placement
- no visual clutter near primary status line
- no text floating without anchor objects

### 9.2 Hotspot sign
Purpose:
- label a district without looking like a web nav button

Recipe:
- wood / painted wood body
- brass or sunlit edge accents
- display or UI title depending on size
- slight lift on hover
- clear pressed state

### 9.3 Parchment panel
Purpose:
- most modal and card-like reading surfaces

Recipe:
- sand fill
- sand-dark border
- wood or brass trim
- cream sub-panels for inputs
- subtle inner shadow, not a heavy drop shadow

### 9.4 District modal frame
Purpose:
- make opening a district feel like entering a building interior

Recipe:
- strong framed header
- clear title
- close button top-right
- body scroll inside
- backdrop dim with warm tint, not black void

### 9.5 Brass button
Purpose:
- default secondary button with tactile feel

Recipe:
- warm fill or outline
- wood text on light fills, cream text on dark fills
- visible pressed state
- no floating ghost buttons for important actions

### 9.6 Teal primary button
Purpose:
- one clear “move forward” action

Use for:
- Enter
- Continue
- Connect Brain
- Unlock
- Open House (when primary)

There should be only one dominant teal action per major screen section.

### 9.7 Rust danger button
Purpose:
- destructive or risky actions only

Use for:
- clear brain
- disconnect and erase
- destructive confirmations
- never for primary onboarding progression

### 9.8 Status pill
Purpose:
- compact status only

Use for:
- connected
- pending
- unlocked
- waiting
- network state

Do not use status pills as the main content of a screen.

### 9.9 Agent drawer
Purpose:
- a persistent sidekick surface for the AI helper

Rules:
- collapsed by default for first-time players
- only one highlighted insight at a time
- approvals grouped together
- debug tabs hidden by default

## 10. Inputs and forms

### 10.1 Form law
- one question at a time on the main flow
- labels always visible
- helper text short
- field groups should feel like a ritual, not a tax form

### 10.2 Inputs
- cream interior
- brass or wood stroke
- large enough touch targets
- obvious focus ring
- no neon or browser-default mismatch

### 10.3 Textareas
- reserve for prompts, advanced metadata, and backstage tooling
- do not expose large prompt textareas on the first-run path unless absolutely necessary

## 11. Motion

### 11.1 Motion philosophy
Use motion to reinforce hierarchy, not decorate emptiness.

### 11.2 Approved motion set
- hotspot hover lift
- drawer slide
- modal settle
- soft glow / bloom on successful sigil match
- very subtle ambient atmosphere motion on backdrops

### 11.3 Motion rules
- no infinite busy motion on important CTAs
- no bouncing UI
- no flashy particle spam
- errors shake lightly at most

## 12. Responsive behavior

### 12.1 Mobile-first truths
- district modal becomes full-height sheet
- agent drawer becomes bottom sheet
- status lines wrap gracefully
- debug tools are never open by default
- primary CTA must remain visible without the drawer covering it

### 12.2 Desktop
- keep town shell visible as long as possible
- modals may float over backdrop
- agent drawer can dock right
- large debug panes allowed only in backstage modes

## 13. Accessibility

- focus order must match reading order
- all icon-only buttons need labels
- visible focus ring on every interactive element
- 44px minimum touch targets
- never rely on color alone for status
- animations respect reduced motion

## 14. Anti-patterns

Never generate:
- white card dashboards over scenic backgrounds
- full developer tooling exposed next to player onboarding
- mixed type systems with display + pixel + system sans in one viewport
- generic SaaS sidebars as the main town shell
- 10+ status pills competing above the fold
- raw blockchain or provider forms before the player has entered the town
- giant raw dropdown lists as the primary interaction on a hero screen

## 15. Screenshot validation rules

Every shell or onboarding PR must ship screenshot baselines for:
- 390px width
- 768px width
- 1280px width

Screenshots must confirm:
1. one obvious primary action above the fold
2. no overlap between CTA and drawer
3. no horizontal scroll
4. no clipped district titles
5. no debug pane visible by default
6. advanced settings hidden unless explicitly opened

## 16. AI developer instructions

Before changing any shell or onboarding screen:
1. read `BRAND.md`
2. read this file
3. read `GAME_UX.md`
4. install `@agent-town/frontier-base`
5. use registry blocks before inventing new shell patterns

If a new pattern is required:
- add it to the private registry
- document it here
- add screenshot tests before merging

## 17. Deprecation note

Legacy pixel-font or pixel-border treatments may remain only in prototypes or internal tools. They are no longer valid defaults for public shell work.

---

# V1.3 Addendum — Founders Plot Visual Game-Surface Law

_Status: canonical for Agent Town: Founders Plot V1 game-surface work_

## D1. Principle: the world is the interface

Founders Plot is the flagship V1 game surface. The normal player screen must be a **scenic town stage**, not a panel dashboard.

Players should primarily act by selecting things in the world:

- HQ;
- empty build lots;
- Lumber Camp;
- Farm Plot;
- Quarry;
- Workshop;
- Market Stall;
- Contract Board;
- Public Square / Welcome Sign;
- Clover / Foreman Hut;
- Town Journal.

Panels may explain or confirm, but panels must not be the main composition.

## D2. Scenic plot dominance

The scenic plot area must dominate the default screen.

Minimum target:

- desktop: scenic plot uses at least 60% of above-the-fold visual area;
- mobile: scenic plot appears before any long-form management panel;
- no stacked permanent side panels on the default view.

## D3. Text budget

Default visible text must stay low.

Targets:

- desktop default visible words: **<= 120**;
- mobile default visible words: **<= 80**;
- no more than 3 prose blocks visible by default:
  1. current goal;
  2. selected object / action hint;
  3. Clover one-line receipt or suggestion.

If more explanation is needed, use a drawer, tooltip, journal, or details disclosure.

## D4. Panel transformation law

Convert current panels into diegetic or contextual objects:

| Former visible panel | V1.3 game-surface replacement |
|---|---|
| Current goal panel | compact quest banner / goal ribbon |
| Settlement board | scenic plot stage |
| Building cards | in-world building objects |
| Contract board panel | physical Contract Board object |
| Town signals panel | small town-bell / signal icons |
| Public square panel | visible Public Square / Welcome Sign |
| Foreman panel | Clover in scene + Foreman drawer |
| Delegation panel | Foreman Hut / Standing Orders drawer |
| Approvals panel | badge + Approval Inbox drawer |
| Rewards panel | sparkles / claim badge on source object |
| Journal panel | Town Journal icon / book drawer |
| Recap drawer | Morning Brief / Town Journal section |

## D5. Building state visual language

Every Founders Plot building object must support these state classes:

- `locked`
- `buildable`
- `under-construction`
- `idle`
- `producing`
- `ready`
- `blocked`
- `upgradable`
- `selected`

The visual treatment must combine shape/icon/text/accessibility. Color alone is not enough.

## D6. Clover embodiment

Clover must have visible states:

- `idle`
- `observing`
- `thinking`
- `acting`
- `waiting-approval`
- `paused`
- `needs-restart`

Clover should be represented by a character, not only a text card. The normal game screen must never make the Foreman feel like only a scheduler setting.

## D7. Contextual action sheets

Detail surfaces appear only after player intent:

- selecting a building opens a contextual action sheet;
- selecting Clover opens the Foreman drawer;
- selecting the Contract Board opens contracts;
- selecting the Journal opens recap/history;
- selecting the Welcome Sign opens charm / public square details.

The contextual sheet may contain buttons, timers, requirements, and receipts. It should not stay open as a permanent dashboard unless the player pins it.

## D8. Founders Plot surface recipes

### D8.1 Scenic plot stage

Purpose:
- make the home plot feel like a place;
- hold buildings, Clover, contracts, public square, timers, and resource feedback.

Rules:
- must be the largest visual object on the default game screen;
- must support absolute-positioned or grid-positioned world objects;
- must provide accessible names and keyboard traversal for every interactive object;
- must not become a decorative image behind unrelated panels.

### D8.2 World building object

Purpose:
- represent a real game entity and expose its current state.

Recipe:
- illustrated building or object silhouette;
- state badge / timer / ready marker layered on top;
- hover/focus affordance;
- short label only when needed;
- click/tap opens contextual action sheet.

### D8.3 Game HUD

Purpose:
- show only core resources, HQ level, and current goal.

Rules:
- compact and stable;
- no debug identifiers;
- no raw runtime/worker terminology;
- no more than one current objective visible.

### D8.4 Context action sheet

Purpose:
- explain and confirm actions for the currently selected object.

Rules:
- appears after object selection or current goal focus;
- contains one primary action whenever possible;
- secondary details collapsible;
- mobile: bottom sheet; desktop: bottom or right contextual panel.

### D8.5 Resource flyout

Purpose:
- make collection and rewards feel tactile.

Rules:
- short format like `+3 wood`;
- appears near source object;
- respects reduced motion;
- cannot be the only record of resource change; state remains server-derived.

### D8.6 Timer ring / progress marker

Purpose:
- show production/construction progress visually.

Rules:
- visible on producing or under-construction objects;
- must have text fallback / aria label;
- must not require reading a full queue panel.

### D8.7 Foreman avatar / Clover marker

Purpose:
- embody AI help inside the town.

Rules:
- visible in normal game state;
- state changes must be visible and accessible;
- one-line bubble or receipt only; long logs move to drawer;
- no runtime/debug jargon in normal copy.

## D9. GenAI asset implementation rules

### D9.1 Asset generation prompt frame

Use this frame for generated Founders Plot assets:

```text
Warm frontier storybook game asset for Agent Town: Founders Plot.
Non-pixel illustrated style, sunlit dusty frontier civic-builder, friendly and practical.
Wood, brass, parchment, ochre, cream, muted teal accents. Clear readable silhouette.
No guns, no violence-forward cowboy trope, no cyberpunk, no generic fantasy village, no text embedded in image.
Transparent background where appropriate. Optimized for web UI and mobile readability.
```

### D9.2 Asset acceptance criteria

Every generated asset must pass:

- matches `BRAND.md` frontier storybook rules;
- readable at 64px and 128px;
- consistent perspective with other Founders Plot buildings;
- no embedded accidental text;
- no hallucinated trademarks or recognizable third-party IP;
- optimized for web;
- listed in `asset-manifest.json` or equivalent.

### D9.3 Preferred file placement

Recommended layout:

```text
public/experiences/founders-plot/assets/
  scene/
  buildings/
  clover/
  icons/
  effects/
  asset-manifest.json
```

### D9.4 Screenshot states

Founders Plot visual PRs must capture at least:

- first load / starter plot;
- selected building;
- producing building;
- ready-to-collect building;
- active contract available;
- Clover acting;
- Clover waiting approval;
- mobile default state.

# V1.3.1 Addendum — Visual-Surface Signoff Law

_Status: canonical for Agent Town: Founders Plot V1.3.1 visual-surface signoff_

## D10. Purpose of V1.3.1

V1.3.1 is a finish pass on the current V1.3 scene-first implementation.

Do not reopen the shell architecture or add new gameplay systems. The purpose is to make the existing scene-first surface pass final visual/product signoff.

The five mandatory finish areas are:

1. flagship frontier-storybook art quality;
2. Clover `acting` target linkage;
3. mobile label-density reduction;
4. objective-relevant lot emphasis;
5. scope quarantine for unrelated OpenRouter/proxy changes.

Additionally, the full-route player surface must not show Agent Comms / worker-debug panels during normal gameplay.

## D11. Full-route player-surface quarantine

The normal Founders Plot player surface is the full app route, not only the embedded Founders Plot frame.

Normal route examples:

```text
/app?district=founders-plot
/app#founders-plot
/founders-plot
```

On those normal routes, the player must not see the following unless an explicit developer/debug mode is active:

- `Agent Comms` as a large persistent debug console;
- `Worker Tools`;
- `Skill Context`;
- `Worker Traffic`;
- `Brain` provider details;
- `Session Context`;
- `Trainer`;
- raw runtime IDs, worker command IDs, tokens, or provider/model jargon.

Allowed normal-surface replacements:

- Clover one-line bubble;
- Foreman drawer with player-facing receipts;
- small approval/notification badge;
- explicit `Developer Tools` button only when debug mode is enabled.

Debug mode must be opt-in through one of:

- `?debug=1`;
- local dev flag;
- authenticated/admin-only developer route;
- explicit `Developer Tools` toggle hidden from first-run players.

## D12. Hero composition standard

The default hero composition must be a real app screenshot, not a Figma-only mockup.

Required hero screenshot:

```text
e2e/.../snapshots/founders-v1-3-1-hero-1280.png
```

The hero composition must satisfy:

- scenic stage is the largest visual object;
- there is one obvious next object or action;
- Clover is visible;
- no debug/runtime/provider panel is visible;
- primary-view assets are approved in the asset manifest;
- the frame feels like a warm frontier-storybook game, not placeholder UI.

## D13. Art-quality standard for generated assets

Generated assets are allowed, but V1.3.1 requires a higher bar than technical validity.

Primary-view assets must show:

- consistent perspective;
- consistent sunlit frontier lighting;
- clear silhouette at 64px and 128px;
- object richness appropriate for a flagship game screen;
- coherent material language: wood, brass, cloth, paper, stone, dusty ground, warm light;
- no blurred or embedded accidental text;
- no third-party trade dress.

Asset validation must include both machine checks and named human art-direction approval metadata.

## D14. Clover target-link law

When Clover is in `acting` state, the visual system must link Clover to the target world object.

At least one of these treatments must be implemented:

1. **target-relative re-anchoring** — Clover moves or appears beside the target object;
2. **path / gesture line** — a visible line, arrow, footprints, dust trail, or pointer from Clover to target;
3. **shared action highlight** — Clover and target share a synchronized action effect that clearly pairs them;
4. **equivalent treatment** approved by design/product.

Required data attributes or equivalent test hooks:

```html
<div data-testid="clover-foreman" data-state="acting" data-target-object-id="...">
<div data-testid="clover-target-link" data-target-object-id="...">
```

Accessible text must describe the action target, for example:

> “Clover is collecting from the Farm Plot.”

## D15. Mobile label-density law

Mobile must preserve the stage-first read.

At widths <= 430px:

- nonessential object labels are hidden by default;
- the selected object may show its label;
- the objective-relevant object may show a short label;
- blocked or ready states may show compact icons/badges instead of full labels;
- long labels move to the objective ribbon or selected-object sheet;
- labels must not overlap or cover the scenic focal area.

Mobile default visible text target for V1.3.1:

- hard maximum: **<= 80 words**;
- target: **<= 65 words**;
- default stage labels visible: **<= 3**.

## D16. Buildable-lot attention law

The UI must distinguish between **available** and **recommended** lots.

Definitions:

- `available`: a lot/building action is legal but not the current best next step;
- `recommended`: the lot/building is objective-relevant and should receive the strongest attention treatment.

Rules:

- only one object may receive primary attention by default;
- available but non-recommended lots must be visually quieter;
- the objective ribbon, Clover suggestion, and primary attention object should agree whenever possible;
- attention treatment must be visually clear without excessive labels.

Required state fields or equivalent:

```ts
type AttentionLevel = "none" | "available" | "recommended" | "blocked";
```

Required test hooks or equivalent:

```html
<div data-testid="world-object" data-attention="recommended">
<div data-testid="world-object" data-attention="available">
```

## D17. Badge stacking law

Badges must not turn the scene back into a dashboard.

Per object, default visible badges:

- maximum 2 visible badges on desktop;
- maximum 1 visible badge on mobile, unless the object is selected;
- additional information moves to hover/focus tooltip or selected action sheet.

Priority for badges:

1. blocked / needs attention;
2. ready;
3. producing / timer;
4. upgradeable;
5. available.

## D18. OpenRouter/proxy scope quarantine

OpenRouter/proxy/LLM transport work must not be mixed into the V1.3.1 visual signoff path unless explicitly quarantined.

If such files are present in the branch, the branch must include a markdown note:

```text
specs/OPENROUTER_SCOPE_QUARANTINE.md
```

That note must list:

- files changed;
- owner/reviewer;
- reason the changes are in the branch;
- tests proving they do not affect Founders Plot visual signoff;
- rollback plan.

Prefer splitting those changes into a separate branch. If not split, they require separate owner signoff.

## D19. Required V1.3.1 screenshots

V1.3.1 visual PRs must capture:

- full app route hero at 1280px;
- full app route mobile at 390px;
- embedded/internal Founders Plot hero at 1280px if it differs from full route;
- Clover acting with target link;
- mobile selected-object sheet;
- objective-relevant lot emphasis;
- debug mode disabled normal view;
- debug mode enabled view if debug UI changed.


---

## V1.4 update: reference-led visual direction workflow

### Visual direction pack before visual implementation

For major Founders Plot visual changes, implementation must start from:

```text
docs/visual/FOUNDERS_PLOT_V1_4_VISUAL_DIRECTION_PACK.md
```

The pack must include:

- mood board inventory;
- reference board inventory;
- anti-examples;
- desktop/mobile/Clover acting paintover requirements;
- weak asset list;
- visual-platform usage rules;
- named art/design signoff fields.

### Visual platforms are production tools, not art directors

Scenario, Firefly, image editing tools, or similar systems may be used for:

- asset variants;
- character poses;
- background/object replacements;
- icon and ornament exploration;
- consistency workflows.

They may not decide the final product composition or sign off the hero frame. A named human design/art owner must approve primary-view assets.

### Asset provenance rule

Every new primary-view asset must record:

```yaml
assetId: string
sourceTool: string
referenceSource: string
promptFile: string | null
referenceFiles: string[]
rightsStatus: owned | generated_project_owned | licensed | reference_only | unknown
postProcessing: string[]
approvedBy: string | needs_human_signoff
approvedAt: string | null
approvalNotes: string
approvalScope: brand_reference | marketing_asset | gameplay_asset
```

For V1.4.1 hero-cast work:

- the recovered hero images are the primary reference inputs;
- the hero video is a tone/motion/story reference only;
- video-frame extraction is optional future marketing work, not a required gameplay sprint task.

### No vague polish requests

Do not implement from notes like:

- “make it more premium”;
- “make it more magical”;
- “make it more alive.”

Translate them into concrete redlines:

- replace asset X;
- hide label Y on mobile;
- make only objective lot glow;
- add target-link treatment to Clover acting;
- update screenshot Z.

## Founders Plot V1.4.2 Patch 2 — Mobile Calmness and HQ Progression

### Mobile calmness law

At mobile widths, the Founders Plot stage must feel like a calm game surface, not a compressed annotated map.

Default 390px route rules:

```yaml
mobile_calmness:
  max_persistent_world_labels: 3
  max_on_map_visible_words: 24
  max_primary_attention_objects: 2
  max_same_weight_pills: 2
  non_objective_text_labels: 0
  clipped_labels: 0
```

Persistent labels may appear only for:

- current objective/recommended object;
- selected object;
- Clover when actively relevant;
- critical blocking state.

All other lots must be icon-only, quiet, or represented in the bottom sheet.

### Signal priority

```yaml
mobile_signal_priority:
  - blocking_approval_or_critical_warning
  - current_objective_marker
  - clover_acting_target_link
  - selected_object_label
  - resource_flyout
  - ready_or_blocked_badge
  - ambient_label
```

If signals overlap on mobile, lower-priority signals must be suppressed.

### HQ progression visual ladder

HQ upgrades must communicate civic growth through silhouette, massing, footprint, and props.

```yaml
hq_progression:
  level_1: humble claim cabin or starter office
  level_3: expanded homestead / civic office
  level_5: proper frontier town hall
  required_difference_axes:
    - footprint_width
    - silhouette_height
    - roofline_shape
    - civic_props
    - entrance_treatment
    - tower_bell_flag_or_signature_feature
    - material_finish
  not_sufficient:
    - color_only
    - trim_only
    - level_label_only
    - metadata_only
```

### Visual proof rule

Do not satisfy visual progression through metadata alone. HQ progression requires:

- unique asset hashes;
- visual delta test;
- gameplay-scale screenshot;
- no-label screenshot.

## Play-First Onboarding Visual Rule

The Founders Plot entry path should look like starting a game, not completing setup paperwork.

- The first visible state should emphasize the town and first action.
- Brain/Town Hall/Sigil/Ceremony affordances may appear later as contextual invitations.
- Brain Quick Connect should be a compact sheet or drawer, not a blocking full-screen configuration wall.
- Manual Founder Mode copy should be warm and clear.
- Real Clover lock state should feel like a future capability, not a failure state.
