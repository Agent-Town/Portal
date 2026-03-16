# Design Context And System Baseline

Status: Active baseline for future design work

## 1. Product Context

Agent Town is not a generic SaaS dashboard. It is a worlded interface:

- western frontier setting
- human + agent co-op
- wallet-first identity
- modal-first navigation inside the town shell
- persistent in-page agent presence

The design goal is not "make it modern". The design goal is:

- quiet
- confident
- legible in 2 seconds
- premium without becoming sterile
- themed without becoming noisy
- game-like without becoming childish
- globally understandable without requiring AI literacy
- summary-first for the user, depth-on-demand through the assistant

The current app already has a strong personality. The problem is not lack of identity. The problem is that too many surfaces speak at the same volume.

## 2. Functional Guardrails

Future design agents must preserve these rules:

- No feature changes
- No backend changes for purely visual work
- No navigation changes that violate modal-first continuity
- No rewording that changes product meaning
- No hiding of required actions behind undiscoverable affordances

If a design improvement requires new functionality, flag it separately.

## 2.1 Audience Guardrail

The primary audience is not AI-native power users. The design must work for:

- people with basic or near-zero understanding of AI agents
- people with basic or near-zero understanding of LLMs or model providers
- international users across different backgrounds
- initial priority audiences:
  - broad international audience
  - Chinese audience

These users should be able to rely on the built-in assistant to explain depth, history, and operational detail.
The default visible UI should therefore not expand into a dense dashboard unless the task truly requires it.

Future design work must also stay compatible with:

- different local service providers
- different local model providers
- future voice-control interaction across different languages

## 3. Repo-Grounded Inputs

Because the requested startup docs do not exist verbatim, future design work must use these as context:

### Product / Flow

- [README.md](/Users/robin/.codex/worktrees/3e47/Portal/README.md)
- [specs/00_product_story.md](/Users/robin/.codex/worktrees/3e47/Portal/specs/00_product_story.md)
- [specs/01_experience_flow.md](/Users/robin/.codex/worktrees/3e47/Portal/specs/01_experience_flow.md)
- Current product and platform specs under [`specs/`](/Users/robin/.codex/worktrees/3e47/Portal/specs)

### Frontend / Visual Baseline

- [public/styles.css](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css)
- [public/start.html](/Users/robin/.codex/worktrees/3e47/Portal/public/start.html)
- [public/index.html](/Users/robin/.codex/worktrees/3e47/Portal/public/index.html)
- [public/views/house.html](/Users/robin/.codex/worktrees/3e47/Portal/public/views/house.html)
- [public/leaderboard.html](/Users/robin/.codex/worktrees/3e47/Portal/public/leaderboard.html)
- [public/registry.html](/Users/robin/.codex/worktrees/3e47/Portal/public/registry.html)
- [public/create.html](/Users/robin/.codex/worktrees/3e47/Portal/public/create.html)

## 4. Current Visual Language

### What exists now

The current system is built from:

- western/pixel branding
- parchment and wood textures
- high-contrast borders
- rounded, beveled buttons
- bright sky, gold, cream, and blue palette
- one dominant serif family for nearly everything

Current root tokens are defined in [public/styles.css:8](/Users/robin/.codex/worktrees/3e47/Portal/public/styles.css#L8).

### What is working

- The world has a recognizable tone
- The town map has cinematic character
- The start screen is close to a clear hero surface
- The app feels authored, not generic
- The town metaphor can support a game-like product direction

### What is not working

- There is no mature hierarchy between primary, secondary, and supporting UI
- Default panels and buttons are too visually heavy
- Too many surfaces have equal weight
- Typography has insufficient differentiation
- Inline layout styling fragments consistency
- Several pages use local style systems instead of shared tokens

## 5. Core Design Principles

These are mandatory for future design work:

### 5.1 Simplicity is architecture

- Remove until the screen breaks, then restore the last necessary layer
- If a surface needs explanation before action, hierarchy has failed

### 5.2 The world serves clarity

- Theme is allowed only when it helps orientation and memory
- Decoration must never compete with the primary task
- The game layer should make the product more inviting, not harder to parse

### 5.3 One screen, one focal point

- Every screen or panel has one primary action
- Everything else is subordinate in weight, position, and contrast

### 5.4 Quiet is premium

- Reduce borders before adding new ones
- Reduce copy before adding labels
- Reduce gradients and shadow stacking before adding more texture

### 5.5 Mobile-first, not breakpoint-first

- Mobile must feel intentionally composed
- Tablet must feel expanded, not stretched
- Desktop must feel authoritative, not merely larger

### 5.6 Conversation reveals depth

- The visible UI should prioritize summary, confidence, and next action
- Dense operational detail should remain available in structured advanced views and stable machine-readable surfaces
- If a user can reasonably learn something by asking the assistant, that is preferable to placing another dense information block in the first viewport
- Default screens should not force users to parse provider, runtime, or system detail when the assistant can surface it on demand

### 5.7 One truth across summary, detail, and assistant

- Summary UI, advanced UI, and assistant-readable detail must all reflect the same underlying product truth
- The simple view may omit depth, but it must not imply something different from the detailed view
- Advanced views may expand information, but they must not redefine meaning
- If the assistant can explain something, that explanation should align with the same structured detail the UI is built from

### 5.8 Global-first wording and layout

- Essential actions must be understandable without AI jargon
- Layout must survive translated copy and CJK text
- No essential instruction may depend on English-specific word length

### 5.9 Voice-ready structure

- Controls must have concise, speakable labels
- State feedback must be short enough to be understood when read aloud
- No critical interaction may depend on hover-only disclosure

### 5.10 No rogue values

- No new hardcoded spacing, radii, colors, shadows, or typography values outside shared tokens
- No new inline `style=` for layout or visual treatment

## 6. Design-System Gaps To Solve

The repo needs a real design-system layer. At minimum, future work must formalize:

- semantic surface tokens
- semantic text tokens
- semantic action tokens
- spacing scale
- type scale
- border and radius scale
- elevation scale
- motion scale
- section-header component
- empty-state component
- summary-card component

## 7. Viewport Targets

Every design milestone must be checked at:

- Mobile: `390x844`
- Tablet: `768x1024`
- Desktop: `1440x900`

Optional large desktop validation:

- `1728x1117`

## 8. Baseline UX Findings

### Strongest current surface

- Start screen

Why:

- single focal card
- limited chrome
- readable action area

### Weakest current surfaces

- House Console / House Office
- Town modal shell
- Leaderboard empty state
- Agent dock in minimized + expanded states

Why:

- visual competition
- excessive chrome
- too much prose before action
- too many equally weighted controls

## 9. Accessibility Baseline

Future design work must meet these minimums:

- Body text contrast: `4.5:1` minimum
- Large text contrast: `3:1` minimum
- Visible focus state on all interactive controls
- Minimum touch target: `44x44`
- No horizontal overflow at target mobile width
- Primary action visible within first viewport on critical screens where practical
- CJK text must render without fallback failure or clipping in redesigned surfaces

## 10. Measurable Non-Functional Design Rules

These are intended for future automated design acceptance checks:

- No inline `style=` in targeted surfaces after a phase is complete
- No new local page style systems unless formally added to shared tokens
- No more than one visually primary action in the first viewport of a target surface
- No horizontal scrollbar at `390px` width
- Dock and modal overlays must not obscure the only primary action on mobile
- Empty states must render an intentional message and next action, not blank space
- First-viewport critical screens should avoid unexplained model/provider/LLM jargon
- Redesigned surfaces should tolerate at least `35%` label expansion without breaking layout

## 11. Evidence Sources From This Audit

The visual audit for this baseline was performed by walking the live app and capturing screenshots at:

- mobile
- tablet
- desktop

The capture set is currently stored in:

- [`tmp-design-audit/`](/Users/robin/.codex/worktrees/3e47/Portal/tmp-design-audit)

Future agents should regenerate fresh captures instead of assuming those images are current.
