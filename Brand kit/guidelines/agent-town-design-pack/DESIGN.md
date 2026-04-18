# DESIGN.md
_Status: canonical for shell + onboarding surfaces_

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
