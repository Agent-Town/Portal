# Design PRD

This is the design-facing product requirements document for Portal.

It translates the live product contract into requirements that visual work must preserve.

## 1. Product Goal

Portal is a minimal Agent Town shell where a human can work with an agent, move through a town-like world, and manage a house-centered experience without being forced to understand platform internals first.

The assistant should help interpret richer data so the human UI does not turn into a dense control panel.

It must remain approachable for low-technical users and flexible enough for international, Chinese, and future voice-first use cases.

## 2. Primary Product Requirements

### 2.1 Minimal shell

- The app must remain visually minimal.
- No clutter.
- No excessive CTAs.
- No engagement-hack UI patterns.

### 2.2 Human + agent co-op

- The product is about shared progress between a human and an agent.
- Visual design should support this with calm guidance and shared-state clarity.

### 2.3 Wallet-first identity

- Wallet continuity is the identity anchor.
- Team Code is not a decorative or prominent UI artifact.
- Design must not introduce alternate identity metaphors that confuse this.

### 2.4 Modal-first continuity

- The town hub is the shell.
- Experiences should open inside that shell whenever possible.
- Design work must support continuity, not encourage full-page hopping.

### 2.5 Deterministic testability

- Every meaningful UI phase must remain Playwright-verifiable.
- Visual changes should support measurable acceptance, not just aesthetic opinion.

### 2.6 Standard-user-first interaction

- A user must be able to make progress without understanding AI-provider, model, or runtime concepts.
- The primary shell must explain tasks and outcomes before platform structure.

### 2.7 International and Chinese readiness

- The design must support international use, with initial priority on Latin-script international users and Simplified Chinese users.
- Layout and typography decisions must remain translation-safe and CJK-safe.

### 2.8 Voice-ready interaction architecture

- The design must remain compatible with future voice control and future voice providers.
- Primary task flows should be understandable through clear action naming and stable focus order, not typing-only assumptions.

### 2.9 LLM-assisted detail model

- The assistant is assumed to stay with the user through the product journey.
- The top layer should expose task, status, and next step, not the full operational data model.
- Rich detail must remain available for assistant interpretation, trust, and advanced review, but it must not dominate the first impression.

### 2.10 No-drift design execution

- Design intent, design tests, screenshot baselines, and shipped UI must stay aligned.
- The product should not rely on “aspirational” design docs that drift away from the rendered app.
- Future design work should proceed in small verified loops, not broad unverified restyling passes.

## 3. Primary User

The primary user is not highly technical.

They likely do not know:

- LLM internals
- model routing
- agent runtime architecture
- config lineage
- session/runtime terminology

They want:

- to understand what is happening
- to know what to do next
- to get help from an agent
- to feel in control
- to ask the agent about details instead of manually parsing dense dashboards

Secondary design audiences:

- international users with different language expectations
- Chinese users who may prefer local language, local services, and local providers
- future users interacting partly through voice instead of keyboard only

## 4. Product Non-Goals

Visual work must not move the product toward:

- token farming
- gamified engagement hacks
- dashboard clutter
- “AI control panel” complexity
- dense human dashboards that front-load operational detail
- new identity providers
- framework churn for its own sake

It also must not move the product toward:

- English-only assumptions
- vendor-branded primary UX copy
- voice-hostile interaction patterns

## 5. Design Success Criteria

The visual system succeeds when:

- the user can understand each major screen quickly
- the active next step is obvious
- the product feels quiet and intentional
- technical complexity is staged instead of dumped
- rich detail is still available without dominating the human layer
- debug tools remain available without visually dominating
- the product remains understandable across different language lengths and scripts
- the product feels like a guided place, not a tool dashboard

## 6. Design Failure Modes

The design is failing when:

- multiple actions compete equally
- the debug sidebar feels like a second app
- typography is expressive everywhere instead of strategic
- technical nouns are more prominent than human tasks
- the user must manually scan dense operational detail to answer simple questions
- mobile feels cramped or crowded
- empty states read as unfinished
- the shell assumes English-only copy length or western-only reading patterns
- the UI cannot plausibly host voice states without redesign

## 7. Current Product Truth To Preserve

From [AGENTS.md](/Users/robin/.codex/worktrees/afe5/Portal/AGENTS.md), [README.md](/Users/robin/.codex/worktrees/afe5/Portal/README.md), and [research/portal/loss.md](/Users/robin/.codex/worktrees/afe5/Portal/research/portal/loss.md):

- keep minimal landing shell
- keep worker-first browser runtime assumptions intact
- keep the debug panel and its observability tabs
- keep trainer and ceremony modal-first
- prevent Team Code leakage in non-debug UI

## 8. Design Priorities

Priority order for future work:

1. source-of-truth alignment
2. low-technical-user clarity
3. LLM-assisted human simplicity
4. international and Chinese readiness
5. visual hierarchy
6. responsive sanity
7. typography discipline
8. component consistency
9. empty/loading/error-state quality
10. motion and micro-polish
