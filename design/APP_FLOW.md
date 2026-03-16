# Design App Flow

This file describes the current user-facing flow as a design system, not just as routing.

The goal is to tell a future design agent what each surface is for, who it is for, and what the user should understand within two seconds.

All flow decisions here must also satisfy [AUDIENCE_AND_GLOBALIZATION.md](/Users/robin/.codex/worktrees/afe5/Portal/design/AUDIENCE_AND_GLOBALIZATION.md).

## 1. Top-Level Shell

### 1.1 `/start`

Purpose:

- warm welcome
- minimal start ceremony
- Privy entry when configured

Primary user question:

- “How do I enter?”

Primary action:

- `Enter`

Design requirement:

- this page should feel calm, cinematic, and obvious
- there must be one dominant call to action
- the entry language must still be understandable when localized

### 1.2 `/`

Purpose:

- onboarding shell when start-page mode is not taking over
- token-check and reconnect entry
- path toward the town hub

Primary user question:

- “Can I get into Agent Town from here?”

Primary action:

- whatever the current active onboarding action is for the configured mode

Design requirement:

- remain minimal
- do not turn into a crowded dashboard
- do not assume prior AI or product knowledge

### 1.3 `/app`

Purpose:

- main town-hub shell
- district discovery
- modal-first entry into deeper surfaces

Primary user question:

- “What part of town should I open next?”

Primary action:

- the currently relevant district entry, with visual priority given to the most important next step

Design requirement:

- town scene remains the emotional center
- hotspots and labels must feel integrated, not pasted on
- the shell must remain compatible with long-lived worker continuity
- district labels and action language must stay short, translation-safe, and voice-friendly
- the user should not need to inspect dense platform detail to choose the next district; the assistant can explain deeper context if needed

## 2. District And Experience Surfaces

### 2.1 House district

Entry points:

- town hub district hotspot
- [public/views/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/views/house.html)
- [public/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/house.html)

Purpose:

- unlock and continuity
- home for identity, brain, writing, public share, office, archive, workshop

Primary user question:

- “What do I need to do with my house right now?”

Design requirement:

- unlock is visually dominant when relevant
- continuity and recovery read clearly
- advanced areas are progressively disclosed
- copy must explain the user job without assuming knowledge of agents or wallets beyond what is necessary
- deeper house detail may exist for advanced review and assistant interpretation, but the first layer must stay simple

### 2.2 House Console

Purpose:

- operational summary
- readiness
- navigation into Office, Experiences, Workshop, Tracks, Archive, Trainer

Primary user question:

- “What matters in my house today?”

Design requirement:

- human summary first
- technical evidence second
- translated and spoken versions of the summary should still preserve the same task order
- the first visible layer should be short enough that the user can ask the assistant for more instead of scanning operational detail

### 2.3 House Office

Purpose:

- presence
- briefing
- helper supervision
- attention and follow-up

Primary user question:

- “What is happening in my office and what should I do next?”

Design requirement:

- should not feel like a backend console
- helper state should be explained in plain language
- debug and runtime terms should be secondary
- actions should remain understandable even when read aloud or translated
- presence, briefing, and helper detail should support assistant interpretation without turning the human layer into a dense dashboard

### 2.4 Atlas / Registry / Poker

Purpose:

- district browsing
- storefronts
- registry proof and discovery
- poker ranking / verification surfaces

Primary user question:

- “What is here, and why should I care?”

Design requirement:

- opened modal-first where product rules require
- must feel like part of the same product family
- empty states must look intentional
- provider names and technical labels must not dominate the first layer

### 2.5 Town Hall, Pony, Saloon, Sigil, Brain

Purpose:

- specific support experiences inside the larger town shell

Design requirement:

- keep the same container logic and visual hierarchy rules as the rest of the hub
- do not become bespoke mini-apps with unrelated styling

## 3. Public Surfaces

### 3.1 `/leaderboard`

Purpose:

- public social proof
- share and referral outcome surface

Primary user question:

- “Who is visible here, and why does it matter?”

Design requirement:

- strong, intentional content frame
- no excessive empty desktop waste
- public ranking language must stay understandable for international audiences

### 3.2 `/registry`

Purpose:

- discoverability and proof layers

Primary user question:

- “What is this entity, and can I trust it?”

Design requirement:

- summary before proof
- proof before raw internals
- trust language must be simple enough for non-technical and translated use
- rich trust detail can remain available for advanced review and assistant explanation, but it must not lead the page

### 3.3 `/poker`

Purpose:

- competition and browser-class information

Primary user question:

- “What is the current state here?”

Design requirement:

- empty states must feel intentional and on-brand
- visual language should not drift into a disconnected mini-product
- competition framing must stay understandable without AI jargon

### 3.4 `/s/:id`

Purpose:

- public house/share presentation

Primary user question:

- “What is being shared with me?”

Design requirement:

- hero media and core story should be clear immediately
- technical detail should not lead

## 4. Supporting Flows

### 4.1 `/create`

Purpose:

- co-op ceremony and shared entropy creation

Primary user question:

- “What do I do to complete this shared step?”

Design requirement:

- simple, ritualized, guided
- no visual clutter
- instructions must remain understandable in translation and voice readout

### 4.2 Agent panel

Purpose:

- persistent chat and debug visibility

Primary user question:

- “Can I talk to the agent, and if needed inspect what it is doing?”

Design requirement:

- product communication stays approachable
- debug tabs remain stable and observable
- instrumentation does not overpower the app shell
- chat input and actions should remain compatible with future voice interaction patterns

## 5. Design Viewport Matrix

Every design phase must review these routes at these widths:

- `/start`
- `/`
- `/app`
- `/house`
- `/leaderboard`
- `/registry`
- `/poker`
- seeded House Console / House Office / helper running / helper recovery

Required widths:

- mobile `390px`
- tablet `768px`
- desktop `1440px`

## 6. User Understanding Targets

For every audited screen, the user should be able to answer within two seconds:

1. where they are
2. what the primary action is
3. what matters now

If the user must decode multiple equal-weight sections before understanding the screen, the flow is visually wrong even if functionality is correct.
