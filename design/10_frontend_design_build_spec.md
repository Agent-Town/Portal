# Frontend Design Build Spec

Status: Build-agent ready

This document translates the design audit into explicit implementation instructions.

It is written for future coding agents. Work in the listed order. Do not implement phases out of sequence unless explicitly approved.

## 1. General Build Rules

- Preserve functionality exactly
- Use shared tokens from [08_design_system_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/08_design_system_spec.md)
- Use component rules from [09_component_contracts.md](/Users/robin/.codex/worktrees/3e47/Portal/design/09_component_contracts.md)
- Satisfy audience and voice rules from [11_global_audience_and_voice_requirements.md](/Users/robin/.codex/worktrees/3e47/Portal/design/11_global_audience_and_voice_requirements.md)
- Remove inline styling in targeted areas as part of the work
- After each phase, capture mobile, tablet, and desktop screenshots

Cross-cutting rules:

- first-view critical screens must remain understandable to non-technical users
- avoid unexplained `LLM`, `provider`, `model`, or similar terminology in first-view critical UI
- no essential text may be embedded in images
- redesigned labels and controls must survive Chinese/CJK rendering and localization expansion
- primary controls should use short speakable labels suitable for future voice workflows

## 2. Phase A: Token And Component Base

### Files

- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Required changes

- Replace current root font role assignment from [public/styles.css:10](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L10) through [public/styles.css:12](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L12) with the new font role model:
  - display = Wellfleet
  - ui = Source Sans 3 with Chinese/CJK fallbacks
  - mono = monospace stack
- Add new semantic color, spacing, radius, stroke, elevation, and motion tokens
- Keep current palette lineage but move to the quieter values defined in [08_design_system_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/08_design_system_spec.md)
- Rework `.panel` from [public/styles.css:286](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L286):
  - `border: 3px solid var(--border)` → subtle border token
  - `border-radius: 14px` → tokenized `--radius-lg`
  - remove `.panel::before` decoration from [public/styles.css:298](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L298)
  - replace stacked heavy shadow with one softer card shadow
- Rework `.pill` from [public/styles.css:960](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L960) to the quieter chip contract
- Rework `.btn` from [public/styles.css:979](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L979) into primary/secondary/quiet hierarchy

### Acceptance criteria

- shared tokens exist
- default card and button styling are visibly calmer
- no decorative inner outline remains on default panels
- CJK-safe font fallbacks are specified and ready to implement

## 3. Phase B: Start Screen

### Files

- [public/start.html](/Users/robin/.codex/worktrees/3e47/Portal/public/start.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Required changes

- Recompose `.startCard` from [public/styles.css:1472](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L1472):
  - increase padding from `18px` to tokenized `--space-24`
  - increase gap from `12px` to tokenized `--space-16`
- Rebalance `.startHero` and `.startVideo` from [public/styles.css:1493](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L1493):
  - keep media, but visually subordinate it through less contrast and less border weight
- Strengthen `.startTitle` and `.startEntryActions` from [public/styles.css:1519](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L1519) so the CTA is the focal point
- Remove the fixed warning banner at [public/start.html:56](/Users/robin/.codex/worktrees/3e47/Portal/public/start.html#L56) from the primary screen composition

### Acceptance criteria

- Enter button is the unmistakable focal point
- CTA is visible at `390x844` without scrolling
- screen reads as one centered composition
- first viewport avoids unexplained AI/provider jargon

## 4. Phase C: Town Modal Shell

### Files

- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Required changes

- Rework `.districtModal` from [public/styles.css:627](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L627):
  - reduce border weight from `3px`
  - simplify shadow from current two-stage stack
  - keep modal size behavior unless it causes mobile issues
- Rework `.districtModalHeader` from [public/styles.css:649](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L649):
  - reduce vertical padding
  - simplify divider treatment
- Reduce panel stacking inside the modal content rendered from [public/index.html:53](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L53) onward
- Remove inline layout styling in targeted trainer blocks at:
  - [public/index.html:56](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L56)
  - [public/index.html:62](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L62)
  - [public/index.html:67](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L67)
  - [public/index.html:117](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L117)

### Acceptance criteria

- district modal has one dominant content plane
- shell chrome is quieter than baseline
- no new inline styles added
- key district actions remain understandable when labels expand or are localized

## 5. Phase D: Agent Dock

### Files

- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Required changes

- Redesign `#agentSidebar.agent-sidebar` from [public/styles.css:4142](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L4142):
  - keep placement and behavior
  - reduce ornamental material contrast
  - make minimized state quieter
- Rework dock header from [public/styles.css:4182](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L4182):
  - quieter background
  - stronger typographic clarity
  - consistent controls
- Replace emoji-like button semantics in [public/index.html:145](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L145) through [public/index.html:162](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L162) with one coherent icon/control strategy
- Bring non-toggle dock buttons under the shared button hierarchy instead of the current custom gold treatment from [public/styles.css:4348](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L4348)

### Acceptance criteria

- minimized dock is visually secondary to the screen
- expanded dock feels like one product, not a separate artifact
- no clipping at `390x844`
- controls use concise labels suitable for future voice interaction

## 6. Phase E: House Console

### Files

- [public/views/house.html](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Required changes

- Recompose the top of `#houseConsolePanel` from [public/views/house.html:90](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html#L90):
  - summary region first
  - primary action row second
  - readiness surfaces visually demoted below
- Convert the current action row at [public/views/house.html:112](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html#L112) from six equal-weight buttons into:
  - one clear primary action
  - secondary navigation actions
- Convert district shell at [public/views/house.html:120](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html#L120) through [public/views/house.html:127](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html#L127) into quieter secondary navigation, not primary CTA peers
- Remove inline layout styling in the House Console header region

### Acceptance criteria

- first viewport contains one summary block and one primary action group
- readiness remains available but visually secondary
- first viewport remains understandable without internal AI/provider terminology

## 7. Phase F: House Office

### Files

- [public/views/house.html](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Required changes

- Rework `#houseOfficePanel` from [public/views/house.html:132](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html#L132):
  - overview summary first
  - selected office and key operational picture second
  - deeper lists below
- Replace repeated small-label sections at:
  - [public/views/house.html:143](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html#L143)
  - [public/views/house.html:145](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html#L145)
  - [public/views/house.html:147](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html#L147)
  - [public/views/house.html:149](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html#L149)
  - [public/views/house.html:151](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html#L151)
  - [public/views/house.html:153](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html#L153)
  - [public/views/house.html:155](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html#L155)
  with one shared section-header pattern
- Remove inline spacing/layout styling across the House Office markup

### Acceptance criteria

- overview reads before detail
- House Office no longer looks like a stacked status dump
- targeted inline styles removed
- section titles and key actions remain stable with Chinese/CJK text

## 8. Phase G: Leaderboard

### Files

- [public/leaderboard.html](/Users/robin/.codex/worktrees/3e47/Portal/public/leaderboard.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Required changes

- Recompose the main panel at [public/leaderboard.html:31](/Users/robin/.codex/worktrees/3e47/Portal/public/leaderboard.html#L31) so the empty state is central and intentional
- Demote stat pills at [public/leaderboard.html:32](/Users/robin/.codex/worktrees/3e47/Portal/public/leaderboard.html#L32) through [public/leaderboard.html:35](/Users/robin/.codex/worktrees/3e47/Portal/public/leaderboard.html#L35) to supporting metadata
- Replace the current plain empty copy at [public/leaderboard.html:41](/Users/robin/.codex/worktrees/3e47/Portal/public/leaderboard.html#L41) with the shared empty-state component structure

### Acceptance criteria

- empty leaderboard feels complete
- page has clear center of gravity at all target viewports

## 9. Phase H: Registry

### Files

- [public/registry.html](/Users/robin/.codex/worktrees/3e47/Portal/public/registry.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Required changes

- Remove the page-local visual system in the inline `<style>` block beginning at [public/registry.html:8](/Users/robin/.codex/worktrees/3e47/Portal/public/registry.html#L8)
- Rebuild Registry using shared tokens and component classes
- Reduce the debug weight of `.registryProjection`
- Keep the search-first layout but with calmer spacing and card structure

### Acceptance criteria

- Registry reads as part of the same product
- page-local visual system is removed or reduced to structure-only rules
- key search and card layouts tolerate translated and Chinese labels

## 10. Phase I: Create

### Files

- [public/create.html](/Users/robin/.codex/worktrees/3e47/Portal/public/create.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Required changes

- Remove inline layout styling at:
  - [public/create.html:27](/Users/robin/.codex/worktrees/3e47/Portal/public/create.html#L27)
  - [public/create.html:33](/Users/robin/.codex/worktrees/3e47/Portal/public/create.html#L33)
  - [public/create.html:34](/Users/robin/.codex/worktrees/3e47/Portal/public/create.html#L34)
  - [public/create.html:43](/Users/robin/.codex/worktrees/3e47/Portal/public/create.html#L43)
  - [public/create.html:45](/Users/robin/.codex/worktrees/3e47/Portal/public/create.html#L45)
  - [public/create.html:49](/Users/robin/.codex/worktrees/3e47/Portal/public/create.html#L49)
- Bring create topbar and panel tone in line with the new shared card/button system

### Acceptance criteria

- create path visually aligns with improved core surfaces
- inline layout styles removed in targeted create markup

## 11. Phase J: Trainer And Brain

### Files

- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

### Required changes

- Remove inline layout styling in trainer and brain areas at:
  - [public/index.html:54](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L54)
  - [public/index.html:75](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L75)
  - [public/index.html:84](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L84)
  - [public/index.html:90](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L90)
  - [public/index.html:104](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L104)
  - [public/index.html:108](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L108)
  - [public/index.html:112](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L112)
  - [public/index.html:116](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L116)
  - [public/index.html:274](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L274)
  - [public/index.html:275](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L275)
  - [public/index.html:276](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L276)
  - [public/index.html:288](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L288)
  - [public/index.html:298](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html#L298)
- Bring tabs, sections, and advanced settings into the shared card and form system

### Acceptance criteria

- advanced surfaces no longer feel visually improvised
- targeted inline styles removed
- provider/model controls are visually secondary to task-level controls

## 12. Phase K: Motion And States

### Files

- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)
- any touched templates

### Required changes

- Replace generic motion usage with shared motion tokens
- standardize empty, loading, and error patterns across redesigned surfaces

### Acceptance criteria

- motion is restrained and consistent
- state presentation is coherent

## 13. Phase L: Final Responsive And Accessibility Pass

### Required checks

- mobile `390x844`
- tablet `768x1024`
- desktop `1440x900`

### Required outcomes

- no horizontal overflow
- visible focus states
- minimum `44x44` touch targets in redesigned surfaces
- body-copy contrast meets minimum thresholds
- Chinese/CJK text renders correctly on critical redesigned screens

## 15. Global Audience Validation

Before the final phase is considered complete, verify:

- start screen in English and Chinese-compatible text fit
- town shell with translated/expanded labels
- house console and house office with translated/expanded labels
- dock controls remain short and pronounceable
- no essential first-view screen depends on AI/provider jargon

## 14. Documentation And Verification

After each phase:

- update the relevant design docs
- capture before/after screenshots
- run relevant design acceptance checks when they exist
- run nearby regressions
- run full `npm test` before closing a major milestone
