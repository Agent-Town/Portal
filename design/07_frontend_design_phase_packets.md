# Frontend Design Phase Packets

Status: Planned execution packets

This document is the handoff layer between the design backlog and the future build agent. Each packet is intentionally small enough to execute well.

## Packet Format

Each packet defines:

- objective
- exact files
- exact focus
- what not to change
- measurable success checks
- how to keep visible UI simple while preserving deeper detail for assistant-guided access

## P1. Token Foundation Packet

Objective:

- establish the shared visual system before redesigning screens

Files:

- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)
- [design/01_design_context_and_system_baseline.md](/Users/robin/.codex/worktrees/3e47/Portal/design/01_design_context_and_system_baseline.md)

Focus:

- typography tokens
- spacing tokens
- surface tokens
- button hierarchy tokens
- section header / summary card rules
- summary-first versus advanced-detail exposure rules

Do not change:

- HTML structure
- behavior

Success checks:

- shared tokens are named and documented
- no new hardcoded visual values in touched CSS
- CJK-safe font roles and plain-language first-view rules are included

## P2. Start Screen Packet

Objective:

- make the start screen feel inevitable and focused

Files:

- [public/start.html](/Users/robin/.codex/worktrees/3e47/Portal/public/start.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Focus:

- hero composition
- CTA prominence
- spacing rhythm
- warning-banner treatment

Do not change:

- enter flow
- Privy behavior

Success checks:

- CTA visible at `390x844` without scroll
- one dominant primary action in first viewport
- no horizontal overflow
- no unexplained AI/provider jargon in the first viewport

## P3. Town Modal Packet

Objective:

- reduce shell noise and create one dominant modal content plane

Files:

- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Focus:

- district modal frame
- header height/weight
- panel stacking inside modal

Do not change:

- modal-first navigation
- district behavior
- trainer logic

Success checks:

- first viewport has one dominant action/content region
- modal header visually smaller than baseline
- no added inline styling

## P4. Agent Dock Packet

Objective:

- make the dock feel quieter and more premium

Files:

- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Focus:

- minimized state
- header controls
- expanded split hierarchy

Do not change:

- tabs
- debug functionality
- worker observability

Success checks:

- minimized dock is visually secondary
- controls use one consistent language
- no clipping or overflow at `390x844`
- controls are short and clear enough to be speakable later

## P5. House Console Header Packet

Objective:

- fix the first-screen hierarchy of House Console

Files:

- [public/views/house.html](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Focus:

- summary region
- action hierarchy
- district shell treatment
- readiness visual demotion

Do not change:

- house data logic
- team switching logic
- available actions

Success checks:

- one summary card before readiness details
- one primary action group above fold
- reduced visual density in first viewport

## P6. House Office Packet

Objective:

- restructure House Office into a clean operational overview

Files:

- [public/views/house.html](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Focus:

- section-header pattern
- overview versus deep-detail ordering
- list/card consistency
- inline-style removal

Do not change:

- house office data shape
- share/deployment/session functionality

Success checks:

- section headers are standardized
- overview reads before details
- targeted House Office inline layout styles removed

## P7. Leaderboard Packet

Objective:

- give the leaderboard a complete empty-state composition

Files:

- [public/leaderboard.html](/Users/robin/.codex/worktrees/3e47/Portal/public/leaderboard.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Focus:

- empty-state composition
- support-metric demotion
- page balance

Do not change:

- leaderboard logic
- list population behavior

Success checks:

- empty state has clear focal point
- counters are visually secondary

## P8. Registry Packet

Objective:

- integrate Registry into the shared visual system

Files:

- [public/registry.html](/Users/robin/.codex/worktrees/3e47/Portal/public/registry.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Focus:

- replace local visual system
- unify search and card treatment
- reduce debug-like internal styling

Do not change:

- registry behavior
- registry content model

Success checks:

- page-local style system is removed or minimalized
- Registry visually aligns with the product

## P9. Create Packet

Objective:

- align create flow polish with improved shell surfaces

Files:

- [public/create.html](/Users/robin/.codex/worktrees/3e47/Portal/public/create.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Focus:

- topbar weight
- panel rhythm
- inline-style cleanup

Do not change:

- create flow behavior
- entropy generation flow

Success checks:

- create page matches shared system
- targeted inline layout styles removed

## P10. Trainer / Brain Packet

Objective:

- bring advanced surfaces into the same system

Files:

- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)
- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)

Focus:

- trainer subpanels
- tabs
- advanced settings details block
- brain panel rhythm
- summary-first default state with deeper detail still available through disclosure

Do not change:

- training logic
- provider logic
- OAuth flow

Success checks:

- no ad hoc inline layout styling remains in targeted advanced blocks
- advanced controls are calmer and clearer
- dense technical detail is still available but no longer dominates the default view

## P11. States And Motion Packet

Objective:

- standardize polish patterns

Files:

- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)
- touched templates/components

Focus:

- motion tokens
- empty states
- loading states
- error states

Do not change:

- behavior
- API sequencing

Success checks:

- state patterns are consistent across touched screens

## P12. Global Audience Packet

Objective:

- validate the redesigned system for non-technical, international, and Chinese users

Files:

- all touched design files

Focus:

- CJK text fit
- translated label expansion
- jargon reduction in first-view content
- future voice-suitable labels

Do not change:

- functionality
- provider logic

Success checks:

- key screens tolerate Chinese or expanded labels without breakage
- first-view critical screens avoid unexplained AI/provider jargon
- core action labels are short and speakable

## P13. Final System Packet

Objective:

- prove end-to-end coherence

Files:

- all touched files

Focus:

- screenshot review
- responsive pass
- accessibility pass
- final doc sync

Do not change:

- no opportunistic scope creep

Success checks:

- all relevant design acceptance metrics pass
- full `npm test` passes
- docs updated to reflect completed design work
