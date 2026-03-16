# Design System Spec

Status: Build-agent ready

This document defines the exact visual system that future frontend agents should implement.

It is intentionally precise. If a value is not here, the build agent should not invent it silently.

## 1. Design Intent

The target design is:

- frontier-themed, but calmer
- premium, but not luxury-for-show
- cinematic at the map level
- quiet and efficient at the task level
- legible for non-technical users
- dead simple in the default view, with detail preserved for assistant-guided exploration

The system keeps the Agent Town world. It removes unnecessary visual noise.

## 1.1 Information Architecture Rule

- The primary UI should expose summary, next action, and confidence first
- Dense runtime, provider, provenance, and operational detail should stay in structured advanced surfaces rather than the first viewport
- The assistant should be able to help users reach deeper detail without the visible UI becoming a dashboard
- Designers should prefer progressive disclosure over persistent clutter

## 2. Typography

### Font roles

- `--font-display`: `"Wellfleet", "Noto Serif SC", "Source Han Serif SC", serif`
- `--font-ui`: `"Source Sans 3", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif`
- `--font-mono`: `ui-monospace, "SFMono-Regular", Menlo, monospace`

### Implementation note

`Wellfleet` already exists in the repo. `Source Sans 3` and the chosen CJK fallback strategy must be added before implementation is considered complete.

### Type scale

- `--type-display-1`: `clamp(2rem, 3vw, 2.75rem)` / weight `400` / line-height `1.05`
- `--type-display-2`: `clamp(1.625rem, 2.4vw, 2.125rem)` / weight `400` / line-height `1.1`
- `--type-title-1`: `1.5rem` / weight `600` / line-height `1.15`
- `--type-title-2`: `1.25rem` / weight `600` / line-height `1.2`
- `--type-title-3`: `1.0625rem` / weight `600` / line-height `1.3`
- `--type-body-lg`: `1rem` / weight `400` / line-height `1.55`
- `--type-body-md`: `0.9375rem` / weight `400` / line-height `1.55`
- `--type-body-sm`: `0.875rem` / weight `400` / line-height `1.5`
- `--type-meta`: `0.75rem` / weight `600` / line-height `1.35` / letter-spacing `0.04em`
- `--type-control`: `0.875rem` / weight `600` / line-height `1.2`

### Usage rules

- Display styles are for page titles, district names, and hero moments only
- UI and body copy must use `--font-ui`
- Buttons, labels, pills, and summary metadata must use UI font, not display font
- Serif should never be the default for dense operational copy
- For Chinese or other CJK copy, UI text must fall back cleanly without mixed-glyph visual failure
- Do not rely on uppercase styling for essential meaning because it does not translate across writing systems

## 3. Color System

### Core tokens

- `--color-canvas-top`: `#97cdea`
- `--color-canvas-bottom`: `#75afd0`
- `--color-surface-base`: `#fff8ee`
- `--color-surface-raised`: `#fff2de`
- `--color-surface-subtle`: `rgba(255, 248, 238, 0.78)`
- `--color-surface-strong`: `#f4e2c1`
- `--color-ink-primary`: `#233847`
- `--color-ink-secondary`: `#4b6273`
- `--color-ink-muted`: `#6e8190`
- `--color-border-strong`: `#5f7788`
- `--color-border-subtle`: `rgba(95, 119, 136, 0.22)`
- `--color-border-faint`: `rgba(95, 119, 136, 0.12)`
- `--color-accent-primary`: `#4f8fbe`
- `--color-accent-primary-hover`: `#427ca5`
- `--color-accent-primary-pressed`: `#396b8d`
- `--color-accent-primary-ink`: `#ffffff`
- `--color-accent-secondary`: `#ddab58`
- `--color-accent-secondary-hover`: `#cc9b49`
- `--color-good`: `#4d9660`
- `--color-bad`: `#c95555`
- `--color-warning`: `#b7802e`
- `--color-focus`: `rgba(79, 143, 190, 0.28)`
- `--color-overlay`: `rgba(15, 24, 34, 0.46)`

### Usage rules

- Blue is the action color
- Warm gold is a supporting accent, not the default action treatment
- Border color must not be used as a text color
- Muted text should still meet contrast requirements
- Color must not be the only signal differentiating model/provider-specific advanced controls

## 4. Spacing Scale

- `--space-2`: `0.125rem`
- `--space-4`: `0.25rem`
- `--space-6`: `0.375rem`
- `--space-8`: `0.5rem`
- `--space-10`: `0.625rem`
- `--space-12`: `0.75rem`
- `--space-16`: `1rem`
- `--space-20`: `1.25rem`
- `--space-24`: `1.5rem`
- `--space-32`: `2rem`
- `--space-40`: `2.5rem`
- `--space-48`: `3rem`
- `--space-64`: `4rem`

### Rhythm rules

- Inner card padding defaults to `--space-20`
- Section spacing defaults to `--space-24`
- Small label to content gap defaults to `--space-8`
- Do not use ad hoc `6px`, `10px`, `14px`, or `18px` once the new system is in place

## 5. Radius Scale

- `--radius-sm`: `0.5rem`
- `--radius-md`: `0.75rem`
- `--radius-lg`: `1rem`
- `--radius-xl`: `1.25rem`
- `--radius-pill`: `999px`

## 6. Stroke And Elevation

### Border tokens

- `--stroke-strong`: `2px solid var(--color-border-strong)`
- `--stroke-subtle`: `1px solid var(--color-border-subtle)`
- `--stroke-faint`: `1px solid var(--color-border-faint)`

### Shadows

- `--shadow-sm`: `0 8px 24px rgba(23, 40, 56, 0.10)`
- `--shadow-md`: `0 16px 36px rgba(23, 40, 56, 0.14)`
- `--shadow-lg`: `0 24px 56px rgba(23, 40, 56, 0.20)`
- `--shadow-overlay`: `0 32px 72px rgba(10, 20, 32, 0.28)`

### Usage rules

- Remove the fake "pressed wood" look from default panels
- Use one outer shadow only for standard cards and modals
- Inner border decoration is no longer the default

## 7. Motion

- `--motion-fast`: `120ms`
- `--motion-standard`: `180ms`
- `--motion-slow`: `260ms`
- `--ease-standard`: `cubic-bezier(0.22, 0.61, 0.36, 1)`

### Usage rules

- modal open/close uses `--motion-standard`
- hover should never exceed `--motion-fast`
- avoid bounce or ornamental motion

## 8. Layout Rules

### General

- Maximum readable line length for body copy: `68ch`
- Primary content blocks should rarely exceed `960px` unless the content is inherently data-dense
- First viewport must expose the primary action without requiring interpretation
- Critical labels and actions must survive at least `35%` expansion for localization

### Mobile

- Minimum interactive target: `44px`
- No surface may horizontally overflow at `390px`
- Reduce competing side-by-side controls; prefer stacking when needed
- Allow multi-line button or section labels where localization requires it

### Tablet

- Tablet must feel like a composed expansion, not a stretched phone

### Desktop

- Desktop may add breathing room, but not duplicate emphasis

## 9. Material Rules

- Default cards use soft cream surfaces and subtle border
- Only hero or top-level shell surfaces may use textured imagery
- Textured imagery must not be the primary source of contrast
- Wood/parchment motifs are supporting materials, not default backgrounds for every nested container
- No essential instruction may be baked into imagery because the product must remain localizable

## 10. Inline Styling Rule

After migration to this system:

- no inline layout styling in target templates
- no inline visual styling in target templates

Exceptions must be justified in the build spec and kept temporary.

## 11. Language And Voice Rules

- First-view user-facing content must be task-first, not AI-first
- Terms like `provider`, `model`, `LLM`, and `OAuth` belong in advanced or clearly secondary contexts unless functionally required
- Primary controls should use short, speakable labels such as `Open House`, `Send`, `Connect Brain`, `Open Office`
- Status copy should be short enough to understand when read aloud
