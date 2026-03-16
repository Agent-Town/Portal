# Portal Design System

## 1. Purpose

This file defines the design contract for the shipped Portal UI.

It is written for future agentic AI designers who need to improve the product without breaking its identity, shell architecture, or minimal UX rules.

## 2. Product Feeling

The shipped experience should feel:

- calm
- warm
- frontier-like
- collaborative
- legible
- minimal
- precise
- welcoming across cultures
- game-like in guidance, not in gimmicks
- timeless rather than trend-chasing

It should not feel:

- cluttered
- gamer-chaotic
- dashboard-heavy
- like a manual operations dashboard for basic tasks
- toy-like
- corporate-generic
- visually noisy

This aligns with the brand intent in [Brand kit/src/app/components/BrandCore.tsx](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/src/app/components/BrandCore.tsx), but the implementation contract here follows the shipped app.

The audience contract is defined further in [AUDIENCE_AND_GLOBALIZATION.md](/Users/robin/.codex/worktrees/afe5/Portal/design/AUDIENCE_AND_GLOBALIZATION.md).

## 3. Non-Negotiable Design Rules

### 3.1 Simplicity

- Every screen gets one dominant action.
- Secondary actions must visually recede.
- If an element can be removed without loss of meaning, it should be removed.

### 3.2 Modal-first continuity

- The town hub is the main shell.
- District experiences should open in modals or embedded panels whenever possible.
- Full-page navigations that tear down the worker runtime are design regressions unless explicitly required by product rules.

### 3.3 Product before instrumentation

- User-facing product surfaces must visually dominate.
- Agent/debug surfaces must remain available, but they must read as tooling, not as a second equal product.

### 3.4 Wallet-first identity

- Team Code must not become a prominent UI element outside debug contexts.
- Visual changes must not introduce alternate identity metaphors that conflict with wallet continuity.

### 3.5 Deterministic design

- New visual decisions must be testable.
- Avoid visual solutions that depend on hidden timing, imprecise animation, or manual interpretation only.

### 3.5.1 No-drift design contract

- One design contract should govern docs, tests, screenshots, and shipped UI.
- Future agents must not invent parallel “intended” styles that differ from what the app actually renders.
- If the documented design contract and the shipped surface diverge, the design phase is incomplete.

### 3.6 Standard-user-first communication

- Top-layer UI must speak in tasks and outcomes, not AI platform internals.
- Provider, model, service, and runtime terminology belong in deeper layers.

### 3.7 Global-ready design

- No screen may depend on English-only copy length.
- No screen may depend on Latin-only typography behavior.
- Important meaning must not depend on idioms that do not travel well across regions.

### 3.8 Voice-ready structure

- Controls should be clearly named and easily referable in speech.
- The layout should support future listening, speaking, and confirmation states without being rebuilt.

### 3.9 LLM-first detail, human-first simplicity

- Assume the assistant is always available to help the user understand detail.
- Keep the top layer sparse, task-first, and calm enough for a basic user to act without studying the screen.
- Preserve rich detail in structured secondary or advanced layers instead of deleting it.
- Dense metadata, raw identifiers, provider details, and operational evidence should be easy for the assistant to reference, but they must not become the main human surface.

### 3.10 Small-surface design loops

- Prefer small, proveable surface slices over giant redesign passes.
- Solve one screen family or hierarchy problem at a time.
- A phase should close only when the design contract, visual tests, and captured surface state all agree.

## 4. Source Of Truth

### 4.1 Live implementation truth

- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- [public/index.html](/Users/robin/.codex/worktrees/afe5/Portal/public/index.html)
- [public/app.js](/Users/robin/.codex/worktrees/afe5/Portal/public/app.js)
- [public/views/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/views/house.html)

### 4.2 Reference-only design intent

- [Brand kit/src/app/components/ColorSystem.tsx](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/src/app/components/ColorSystem.tsx)
- [Brand kit/src/app/components/TypographySystem.tsx](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/src/app/components/TypographySystem.tsx)
- [Brand kit/src/app/components/MotionGuide.tsx](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/src/app/components/MotionGuide.tsx)

### 4.3 Current design-system problem

The repo currently has multiple competing systems:

- production CSS tokens in [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- a dormant `--v0-*` vocabulary later in the same file
- separate Brand kit guidance that is not what the user sees

Future work must reduce this fragmentation, not add another parallel layer.

## 5. Core Tokens

These are the live visual primitives currently governing the product.

### 5.1 Color

Current live palette in [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css):

- `sky-50` through `sky-900`
- `coral-500`
- `gold-500`, `gold-600`
- `cream-50`, `cream-100`, `cream-200`
- semantic aliases:
  - `text`
  - `text-strong`
  - `muted`
  - `accent`
  - `accent-strong`
  - `accent-soft`
  - `good`
  - `good-strong`
  - `bad`
  - `bad-strong`
  - `border`
  - `panel`
  - `panel-strong`
  - `shadow`

#### Color usage contract

- Sky blues drive structure, not decoration.
- Coral is accent only. It should not compete with the primary CTA unless product intent explicitly requires urgency.
- Gold is scarce emphasis for achievement, important metadata, or focal highlights.
- Cream surfaces are the main readable foreground layer over the town backdrop.
- Dark navy border and text anchors create the western card language.

### 5.2 Typography

Current live implementation:

- `--font-display: "Wellfleet", serif`
- `--font-ui: "Wellfleet", serif`
- `--font-accent: "Wellfleet", serif`

This is a live-system weakness, not a desired end state.

#### Typography contract going forward

- Display type may remain expressive and western.
- UI text and body copy must become calmer than current live usage.
- Technical data may use a mono face when needed.
- The chosen UI/body typography must support Latin and Simplified Chinese gracefully through an explicit fallback strategy.
- Letter-spacing and uppercase treatments must not be the main carrier of meaning.
- Future design agents must not introduce more than:
  - one display family
  - one UI/body family
  - one mono family

### 5.3 Shape

Current live shape language:

- panels tend toward `10px` to `14px` radii
- stronger containers sometimes use `18px`+
- borders are often `3px`
- heavy drop shadows are common

#### Shape contract going forward

Future work should converge on a strict scale:

- radius `sm`
- radius `md`
- radius `lg`
- radius `xl`

And a parallel border scale:

- `1px` for fine UI controls
- `2px` for standard surfaces
- `3px` only when intentionally part of the western poster language

### 5.4 Elevation

The product currently relies on:

- dark offset shadows
- occasional inset border accents
- gradient and texture layering

Future work should reduce ad hoc recipes and standardize:

- base surface
- raised panel
- modal overlay
- debug/instrumentation layer

### 5.5 Motion

Reference durations from [Brand kit/src/app/components/MotionGuide.tsx](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/src/app/components/MotionGuide.tsx):

- hover: `150ms`
- click/tap: `100ms`
- modal enter: `300ms`
- modal exit: `200ms`
- loading spin: `800ms`

Motion contract:

- transform and opacity first
- no decorative motion without feedback value
- modal transitions should feel soft and fast
- district transitions should guide attention without turning into spectacle
- future motion must remain compatible with voice-state overlays and auditory interaction cues

## 6. Components

### 6.1 Town shell

The town shell is the signature surface.

Rules:

- the scene is the emotional backdrop
- the primary entry action must be immediately legible
- inactive districts must visually recede
- the scene cannot become cluttered with flat UI overlays

### 6.2 Panels and modals

Rules:

- one coherent panel family across house, registry, leaderboard, and office views
- headings should anchor the panel quickly
- inner spacing should feel rhythmic and generous
- panels must not become crowded control dumps

### 6.3 Buttons

Rules:

- one primary button style per screen
- secondary buttons must not visually compete
- destructive actions need separate treatment
- button copy must be direct and plain-language
- labels must remain understandable when translated or spoken aloud

### 6.4 Metadata pills and badges

Rules:

- read as metadata first
- never compete with main actions
- should be lighter than buttons

### 6.5 Debug surfaces

Rules:

- always available when required by product
- visually distinct from product panels
- lower visual priority by default
- allowed to be dense, but not noisy

### 6.6 Empty, loading, and error states

Rules:

- same grammar across the app
- title
- one sentence of explanation
- one recommended next step
- no accidental “broken blank page” feeling
- the text structure must survive translation and voice readout cleanly

### 6.7 Advanced detail layers

Rules:

- detailed evidence can exist, but it must sit below or behind the primary human story
- advanced sections should use stable headings and grouping so the assistant can reference them reliably
- do not make users scan logs, ids, provider names, or operational metadata before they understand the task
- do not solve clutter by deleting useful detail if it can be staged instead

## 7. Screen Hierarchy Rules

Every major surface should answer these in order:

1. Where am I?
2. What matters right now?
3. What should I do next?
4. What can I ignore safely?

If the user has to read technical nouns before learning what matters, the screen hierarchy is wrong.

If a screen expects a human to manually parse dense evidence that the assistant could interpret instead, the hierarchy is also wrong.

If the hierarchy only works in English or only works for typed interaction, it is also wrong.

## 8. Responsive Rules

Primary design widths for verification:

- mobile: `390px`
- tablet: `768px`
- desktop: `1440px`

Rules:

- mobile is not a compressed desktop view
- touch targets must remain at least `44x44`
- bottom bars cannot crowd the scene or primary action
- debug surfaces should become clearly secondary on smaller widths
- no viewport should feel like an afterthought
- translated and CJK text must not break layout or action clarity at these widths

## 9. Accessibility Contract

Minimum expectations for future design work:

- WCAG AA contrast for text and controls
- visible keyboard focus
- no icon-only controls without readable meaning
- readable hierarchy for screen readers and sighted users
- touch targets at least `44x44`
- copy written for non-technical users first
- future voice-readiness preserved through clear labels and state naming

## 10. User Model

The primary user is not an expert in AI agents, models, configs, or platform internals.

The visual system must therefore bias toward:

- clarity
- reassurance
- low cognitive overhead
- staged complexity
- language flexibility
- provider neutrality
- voice compatibility

If the product exposes technical truth, it should do so progressively.

## 11. Design Debt To Preserve In Memory

These are known live-system mismatches future agents must understand before changing anything:

- Brand kit typography does not match shipped typography.
- The Brand kit favors a more modern glassy style than the live retro-western UI.
- The live app uses heavy emphasis on too many interactive controls at once.
- The live app does not yet have one authoritative design-system document outside this folder.
