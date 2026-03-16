# DESIGN_SYSTEM

Status: Proposed target system for poker design v1  
Date: 2026-03-16  
Scope: poker-specific UI only

This document defines the target visual system for poker surfaces. It does not mean the current code already implements these values. It defines the approved design target future agents must build toward.

## 1. Design Intent

Poker should feel calm, exact, and quiet under pressure.

The product is not a casino skin and not a dashboard. It is a focused decision environment. The visual system must make the next action obvious, reduce noise, and support long sessions without fatigue.

## 2. Non-Negotiable Design Principles

1. Every screen has one primary action.
2. Primary actions must not compete with settings or metadata.
3. Information must collapse into clear planes:
   - live decision plane,
   - supporting context plane,
   - background reference plane.
4. Mobile is the default composition.
5. No hardcoded one-off values in poker-specific UI after migration to this system.
6. Destructive actions must always look distinct from neutral actions.
7. Navigation pills must never look like commit actions.

## 3. Color Tokens

These are target poker tokens. Future implementation should map poker surfaces to these values instead of mixing global sky/cream tokens with local poker colors.

### 3.1 Surfaces

- `--poker-surface-0: #0b1014`
- `--poker-surface-1: #11181d`
- `--poker-surface-2: #182126`
- `--poker-surface-3: #202b31`
- `--poker-overlay: rgba(8, 12, 16, 0.72)`

### 3.2 Text

- `--poker-text-primary: #f4ecdc`
- `--poker-text-secondary: #b8ae99`
- `--poker-text-tertiary: #8e8678`
- `--poker-text-inverse: #081014`

### 3.3 Accent

- `--poker-accent-gold: #d6aa63`
- `--poker-accent-gold-strong: #e4bd79`
- `--poker-accent-gold-soft: rgba(214, 170, 99, 0.14)`

### 3.4 State

- `--poker-success: #90b88f`
- `--poker-success-soft: rgba(144, 184, 143, 0.16)`
- `--poker-warning: #d1aa5c`
- `--poker-warning-soft: rgba(209, 170, 92, 0.16)`
- `--poker-danger: #c98778`
- `--poker-danger-soft: rgba(201, 135, 120, 0.16)`
- `--poker-info: #81a7be`
- `--poker-info-soft: rgba(129, 167, 190, 0.16)`

### 3.5 Lines

- `--poker-line-subtle: #26313a`
- `--poker-line-strong: #31404a`
- `--poker-focus-ring: #f0d49c`

## 4. Typography Tokens

Typography must create calm hierarchy, not western novelty.

- `--poker-font-display: "Wellfleet", "Iowan Old Style", Georgia, serif`
- `--poker-font-ui: "Iowan Old Style", "Palatino Linotype", Georgia, serif`
- `--poker-font-mono: ui-monospace, SFMono-Regular, Menlo, monospace`

### 4.1 Type Scale

- `display-48`: `48/56`
- `title-32`: `32/38`
- `title-24`: `24/30`
- `section-18`: `18/24`
- `body-15`: `15/24`
- `meta-12`: `12/16`
- `metric-28`: `28/32`

### 4.2 Type Rules

1. Only display titles may use uppercase.
2. Section headings should not be all caps.
3. Metadata labels may use uppercase with restrained tracking.
4. Numeric metrics should use the metric scale, not oversized headers.

## 5. Spacing Tokens

- `space-8`
- `space-12`
- `space-16`
- `space-24`
- `space-32`
- `space-48`
- `space-64`

### 5.1 Layout Rhythm

1. Card internal padding: `24` on desktop/tablet, `16` on mobile.
2. Vertical gap between major sections: `24` mobile, `32` tablet, `40` desktop.
3. Gap between controls in a button group: `8`.
4. Gap between metric cells: `12` mobile, `16` desktop.

## 6. Radius and Shadow Tokens

- `radius-12`
- `radius-16`
- `radius-24`
- `radius-pill`

Shadows:

- `shadow-card: 0 18px 44px rgba(0, 0, 0, 0.24)`
- `shadow-floating: 0 24px 64px rgba(0, 0, 0, 0.32)`
- `shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.04)`

## 7. Motion Tokens

The product should feel responsive, not animated for decoration.

- `motion-fast: 120ms`
- `motion-base: 180ms`
- `motion-slow: 260ms`
- `ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1)`

Allowed motion:

1. card fade/slide on load,
2. button press and focus transitions,
3. inline status transitions,
4. sticky action bar reveal,
5. countdown state emphasis.

Disallowed motion:

1. floating ambient animation on core decision panels,
2. bounce or spring decoration,
3. long looping motion that competes with the table state.

## 8. Layout System

### 8.1 Mobile

1. Single column.
2. Primary action must appear before secondary tools.
3. Decision-critical content should be visible in the first viewport on the live table.
4. No horizontal overflow.

### 8.2 Tablet

1. One dominant column with one supporting rail only when density clearly benefits.
2. Tables and schedule screens may use a `2:1` split for context versus actions.

### 8.3 Desktop

1. Two-plane composition is allowed:
   - primary decision/content column,
   - secondary context rail.
2. Operator review may expand to a wider control grid, but destructive actions still need a dedicated cluster.

## 9. Core Components

### 9.1 Screen Shell

Use for every poker route.

- Contains title, subtitle, status line, and content grid.
- Must visually recede behind screen-specific content.

### 9.2 Section Shell

Replaces the current equal-weight card pile.

- One heading
- Optional short supporting text
- Content body
- Optional footer action row

### 9.3 Metric Strip

For compact identity and numeric overview.

- Not a nested card inside another card
- Light visual weight
- Used at the top of a screen, not everywhere

### 9.4 Primary Action Bar

For live decision screens.

- Contains legal poker actions only
- Sticky on mobile where appropriate
- Distinct from navigation and utilities

### 9.5 Navigation Pills

For route transitions only.

- Lower emphasis than primary buttons
- Must never be mistaken for commit actions

### 9.6 Destructive Group

For pause, cancel, refund, close, or similar actions.

- Separate cluster
- Danger tone
- Extra spacing from neutral controls

### 9.7 Thread Surface

For human/agent conversation.

- Distinct human and agent message styles
- Low emphasis compared with the action bar
- Chronology must remain readable

### 9.8 Study Surface

For review, notebook, and opponent notes.

- Structured into summary, replay, and notes zones
- Forms appear after reading context, not before

## 10. Accessibility Rules

1. Every interactive control must provide a visible focus state.
2. Minimum touch target: `44x44`.
3. Contrast ratio target:
   - body text: `4.5:1`
   - large text: `3:1`
   - focus ring must be obvious on dark surfaces.
4. Disabled state must remain legible without looking active.
5. Status updates must stay in polite live regions only where already functionally required.

## 11. Anti-Patterns To Avoid

1. Box inside box inside box metric framing.
2. More than one equally strong button group per section.
3. All-caps everywhere.
4. Making navigation pills and destructive controls visually identical.
5. Responsive design that only reduces padding.
6. Mixing poker palette and global sky/cream palette in the same screen without an explicit bridge.
7. Long vertical forms above the user’s next action.

## 12. Implementation Rule

No future agent may introduce new poker-specific visual values outside this document without updating this file first.
