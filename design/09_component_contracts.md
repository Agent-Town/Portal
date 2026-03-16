# Component Contracts

Status: Build-agent ready

This document defines the exact component variants future frontend agents should build toward.

## 1. Buttons

### Primary button

Purpose:

- main action in a screen, modal, or section

Visual contract:

- background: `--color-accent-primary`
- text: `--color-accent-primary-ink`
- border: none or `1px` accent edge if needed
- radius: `--radius-md`
- min-height: `44px`
- horizontal padding: `--space-16`
- font: `--type-control` with `--font-ui`
- shadow: `--shadow-sm`

Rules:

- one primary button group per major section
- no more than one visually primary button in the first viewport of a critical screen
- primary labels should be short, verb-led, and translatable

### Secondary button

Purpose:

- supporting actions that should remain clear but not dominant

Visual contract:

- background: `--color-surface-raised`
- text: `--color-ink-primary`
- border: `--stroke-subtle`
- radius: `--radius-md`
- min-height: `44px`
- no bevel effect

### Quiet button

Purpose:

- utility actions, tertiary navigation, secondary controls

Visual contract:

- background: transparent
- text: `--color-accent-primary`
- border: transparent
- min-height: `36px`

Rules:

- do not use quiet buttons for irreversible or high-priority actions
- quiet labels must still be understandable without AI/provider vocabulary

## 2. Panels / Cards

### Standard card

Use for:

- house summaries
- leaderboard containers
- registry cards
- trainer sections

Visual contract:

- surface: `--color-surface-base`
- border: `--stroke-subtle`
- radius: `--radius-lg`
- shadow: `--shadow-sm`
- padding: `--space-20`
- no decorative inner outline by default

### Summary card

Use for:

- top-of-screen operational summary
- start hero support content
- house console headline block

Visual contract:

- surface: `--color-surface-raised`
- border: `--stroke-subtle`
- radius: `--radius-xl`
- shadow: `--shadow-md`
- padding: `--space-24`

Rules:

- summary card contains the main page explanation and primary action
- detailed status lists must not precede it visually
- summary card copy must be understandable to non-technical users
- summary card should let a user act without reading deep internal detail first
- summary card must stay truthful to the richer detail available elsewhere; simplification must not distort meaning

### Overlay modal

Use for:

- district modal
- trainer modal

Visual contract:

- surface: `--color-surface-base`
- border: `--stroke-subtle`
- radius: `--radius-xl`
- shadow: `--shadow-overlay`
- backdrop uses `--color-overlay`

## 3. Section Header

Purpose:

- consistent label for subsections inside larger panels

Structure:

- eyebrow label optional
- section title
- optional supporting sentence

Visual contract:

- title uses `--type-title-3`
- supporting text uses `--type-body-sm`
- gap below header to content: `--space-8`
- top margin between sections: `--space-20`

Rules:

- do not simulate section headers with repeated `.small` labels and ad hoc margins
- section titles should remain comprehensible after translation and in Chinese

## 4. Status Chips / Pills

Purpose:

- compact metadata and status

Visual contract:

- use UI font
- height: `32px` minimum
- padding: `0 var(--space-12)`
- radius: `--radius-pill`
- border: `--stroke-faint`
- background: `--color-surface-subtle`

Rules:

- chips must not look louder than buttons
- do not use chips as faux cards
- chips should avoid verbose technical jargon in first-view contexts

## 5. Form Inputs

Visual contract:

- min-height: `44px`
- border: `--stroke-subtle`
- radius: `--radius-md`
- background: white or near-white
- font: `--type-body-md`
- focus ring: `0 0 0 4px var(--color-focus)`

Rules:

- advanced settings forms follow the same input system
- browser/brain settings cannot use a separate ad hoc form visual language
- provider/model-specific controls belong in advanced sections unless absolutely necessary in the primary flow
- if the assistant can explain a dense setting on demand, the visible UI should keep that setting secondary by default

## 6. Advanced Disclosure Block

Purpose:

- hold dense operational, provider, runtime, or provenance detail without crowding the primary interface

Visual contract:

- implemented with a standard `details` or equivalent secondary disclosure component
- closed by default on first view unless the current task requires immediate action inside it
- summary line uses `--type-body-sm` or `--type-control`
- body uses the same card/input tokens as the rest of the product, not a debug-only mini-system

Rules:

- advanced disclosure must never precede the main summary or primary action
- raw ids, dense lists, and verbose diagnostics belong here before they belong in the first viewport
- disclosure labels must remain understandable without assuming technical knowledge
- expanded detail must elaborate on the same underlying truth the summary surface already implies

## 7. Tabs

Visual contract:

- active tab: subtle raised surface + strong text
- inactive tab: transparent or subtle surface
- radius: `--radius-md`
- min-height: `36px`
- font: `--type-control`

Rules:

- tabs should read as navigation within a surface, not as primary CTAs
- tab labels should remain short enough to survive localization

## 8. Empty State

Structure:

- title
- one sentence of explanation
- one next action

Visual contract:

- center aligned when the page is empty-only
- left aligned when inside a denser operational panel
- action uses secondary or primary button depending on importance

Rules:

- empty state must feel intentional
- no raw "No items yet" without structure
- empty-state copy should use plain language, not internal AI terminology

## 9. Agent Dock

### Minimized state

Visual contract:

- quiet background
- compact header
- one clear status label
- no ornamental texture as the dominant visual signal

### Expanded state

Visual contract:

- chat pane remains primary
- debug pane is structurally clear but visually secondary
- controls are consistent with global button system

Rules:

- dock must support the current screen, not compete with it
- dock controls should be understandable and pronounceable for future voice use

## 10. Town Map Hotspot Labels

Visual contract:

- label pill treatment should be consistent
- active district should be identifiable without louder ornamentation
- labels must not obscure scene legibility

Rules:

- the map is cinematic first, interface second
- labels should aid orientation, not clutter the image
- essential district meaning must not rely on English-only phrasing
