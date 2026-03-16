# DESIGN_SYSTEM

Status: current source-of-truth after Phase D1 foundation
Last updated: 2026-03-16

This file documents the current visual system, the non-negotiable design principles, and the allowed token vocabulary for future design agents.

It is intentionally conservative. It records what exists and what is approved as policy. It does not silently approve new values or new component behavior.

## 1. Design philosophy

The product should feel:

1. calm,
2. quiet,
3. inevitable,
4. readable in 2 seconds,
5. playful in world-building but restrained in interface chrome,
6. globally readable without requiring AI literacy.

The world may be rich.
The interface must stay disciplined.

## 2. Product-level design rules

1. One primary action per screen.
2. Secondary actions must support, never compete.
3. Technical detail belongs behind progressive disclosure when possible.
4. The worker continuity model is page-scoped and modal-first; design must preserve that.
5. Every surface must work intentionally at mobile, tablet, and desktop.
6. The interface must not look like a debug tool unless it is the debug tool.
7. The same component role must look and behave the same across all House surfaces.
8. Primary controls must be nameable with simple human verbs.
9. The system must tolerate localization, especially English and Chinese.
10. The visual grammar must remain compatible with future voice control.

## 3. Current token baseline from `public/styles.css`

These are the current implemented token families.

### 3.1 Fonts

Current baseline:

1. `--font-display: "Wellfleet", "Songti SC", "STSong", serif`
2. `--font-ui: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Helvetica Neue", Arial, sans-serif`
3. `--font-accent: "Wellfleet", "Songti SC", "STSong", serif`
4. `--font-body: var(--font-ui)`
5. `--font-mono: ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", monospace`

Current design note:

1. D1 separated display from UI text,
2. world-facing headings keep the display voice,
3. body, labels, buttons, and metadata now use the calmer UI stack,
4. the UI stack is intentionally system-based for international and Chinese fallback safety.

### 3.2 Core colors

Current palette:

1. sky
   - `--sky-50` through `--sky-900`
2. warm accents
   - `--coral-500`
   - `--gold-500`
   - `--gold-600`
3. warm neutrals
   - `--cream-50`
   - `--cream-100`
   - `--cream-200`
4. semantic roles
   - `--text`
   - `--text-strong`
   - `--muted`
   - `--accent`
   - `--accent-strong`
   - `--accent-soft`
   - `--good`
   - `--good-strong`
   - `--bad`
   - `--bad-strong`
   - `--border`
   - `--panel`
   - `--panel-strong`
   - `--shadow`

Current design debt:

1. too many layers use strong borders plus gradients plus shadows at once,
2. status, interaction, and decoration are not separated clearly enough,
3. background richness sometimes competes with UI surfaces.

### 3.3 Borders and radii

Current baseline:

1. border widths still appear as `1px`, `2px`, and `3px` depending on shell strength
2. standard radius tokens are:
   - `--radius-sm: 8px`
   - `--radius-md: 12px`
   - `--radius-lg: 16px`
   - `--radius-xl: 20px`
   - `--radius-pill: 999px`

Current design debt:

1. some legacy route-specific surfaces still use older one-off radius values,
2. later phases should continue migrating remaining `10px`, `14px`, and `18px` one-offs to the standard scale where safe.

### 3.4 Spacing

Current baseline:

1. `--space-1: 4px`
2. `--space-2: 8px`
3. `--space-3: 12px`
4. `--space-4: 16px`
5. `--space-5: 24px`
6. `--space-6: 32px`
7. `--space-7: 48px`

Current design debt:

1. some older screen-specific rules still use legacy values like `6px`, `10px`, `14px`, `18px`, and `20px`,
2. later phases should continue replacing those with the formal ladder as individual surfaces are redesigned.

### 3.5 Shadows and depth

Current baseline:

1. `--depth-control`
2. `--depth-surface`
3. `--depth-modal`
4. `--focus-ring`
5. softer `--border-soft` surface separation

Current design note:

1. D1 introduced an explicit control versus surface versus modal depth model,
2. panels, buttons, pills, and tokens are calmer than the pre-D1 baseline,
3. nested town-shell and agent-dock surfaces were reduced in emphasis without changing their behavior.

Current design debt:

1. some ornate route-specific shells still carry stronger framing than ideal,
2. D3 and D5 still need to complete the hierarchy cleanup in modal interiors and the agent sidebar.

## 4. Current component families

The design agent should recognize these as the primary reusable visual families:

1. `.panel`
2. `.btn`
3. `.pill`
4. `.districtModal`
5. `.townDistrictHotspot`
6. `.house-library-card`
7. `.house-library-token`
8. `.house-library-drawer`
9. `.agent-sidebar`
10. `.pixel-input` and other form fields

## 5. Responsive contract

All design work must evaluate at minimum:

1. mobile: `390 x 844`
2. tablet: `820 x 1180`
3. desktop: `1440 x 1100`

Additional stress cases:

1. narrow mobile: `375 x 812`
2. wide laptop: `1280 x 900`
3. short viewport desktop: `1440 x 900`

## 6. Accessibility contract

Every design change must preserve or improve:

1. keyboard focus visibility,
2. minimum touch target comfort,
3. readable contrast for text and controls,
4. screen-reader naming on icon-first controls,
5. no color-only status encoding,
6. predictable reading order in modal and drawer flows.

## 6.1 Localization and global readability contract

Every design change must also preserve or improve:

1. support for English and Chinese label lengths,
2. icon-first controls with localized accessible names,
3. layouts that do not depend on English-only word length,
4. text presentation that remains readable for Latin and Chinese scripts,
5. primary actions that remain obvious without technical vocabulary.

## 6.2 Voice-readiness contract

Every design change must also preserve or improve:

1. stable short action labels,
2. unambiguous primary action naming,
3. visible state changes not communicated by color alone,
4. controls that can later be referenced clearly in speech,
5. room and panel structures that make current context visually obvious.

## 7. Design system rules for future changes

1. No rogue values. New spacing, color, radius, or motion values must be recorded here before use.
2. Preserve semantic separation between:
   - world art,
   - modal shell,
   - content panel,
   - control,
   - token,
   - status.
3. Reduce emphasis before adding emphasis.
4. If a component can become quieter without losing clarity, it should.
5. If a user must read long text to understand the next step, the hierarchy is wrong.
6. If a user must understand AI jargon to act, the design is wrong.
7. If a control label only works in English, it is not ready.

## 8. Approved direction, not yet implemented

These are approved as design direction for future phase planning, but not yet implemented globally:

1. complete the migration of legacy one-off spacing and radius values,
2. keep the world expressive while making interface surfaces quieter,
3. move advanced controls behind progressive disclosure by default,
4. use simple human verbs in primary flows,
5. build layouts that remain composed for English and Chinese,
6. maintain a control vocabulary that can later support voice interaction.

## 9. Pending additions required before major implementation

Future approved implementation phases should add or finish:

1. motion durations and easing curves,
2. route-specific shell tokens for the town modal family,
3. remaining legacy value cleanup across older surfaces,
4. any additional text-role tokens needed after D2 through D5.
