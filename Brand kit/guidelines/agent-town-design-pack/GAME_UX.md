# GAME_UX.md
_Status: canonical for shell + onboarding surfaces_

## 1. UX thesis

**The main frontend experience should feel like entering and settling a town with an AI helper.**

The product must not lead with:
- provider setup complexity
- blockchain registration checklists
- tool labs
- traffic inspectors
- session context panes

Those are backstage systems.

The public journey is:
1. enter town
2. meet your role in the story
3. rescue / name your agent
4. connect its brain
5. complete the sigil ritual
6. open house / continue into the town

## 2. What stays from current Portal

Keep:
- the frontier town metaphor
- the start gate
- the town hotspot shell
- districts as place-based navigation
- Town Hall as the onboarding ritual
- “brain” as the user-facing word for model connection
- the sigil match mechanic
- the persistent idea of agent communications

## 3. What moves backstage

Move out of the main player path by default:
- Experience Trainer
- Tool Lab
- Worker Traffic
- Session Context
- raw provider matrices
- chain-by-chain registration detail
- deep worker/runtime debugging

These may still exist, but they must be:
- hidden behind a dev or advanced toggle
- in dedicated backstage views
- absent from the first-run golden path

## 4. Primary screen map

### 4.1 Start Gate
Public hero screen.
Purpose: get the user into town with one obvious next step.

### 4.2 Town Shell
The scenic overview and district hotspot map.
Purpose: establish place and orient the player.

### 4.3 District Modal
The shell for any district-level experience that still lives in DOM space.

### 4.4 Town Hall Onboarding
The guided story flow:
- human identity
- agent identity
- registration processing
- worker / sigil ritual

### 4.5 Brain Connect
The LLM/provider path framed in friendly language.

### 4.6 Sigil Lock Step
The mirrored trust ritual between human and agent.

### 4.7 Agent Comms Drawer
Persistent helper surface for:
- short receipts
- suggestions
- approvals
- conversation

### 4.8 Backstage Tools
Trainer, debug, raw tools, traffic, and advanced brain controls.

## 5. Golden path: first-time player

### Step 1 — Start Gate
Player sees:
- scenic hero
- “Welcome to the Wild West!” or equivalent frontier greeting
- one primary Enter CTA
- sign-in path only when needed

Acceptance rules:
- only one primary CTA above fold
- sign-in box hidden until the user actively enters that path
- no provider, wallet, or tool language shown yet

### Step 2 — Enter Town
Player lands in the town shell.
Player sees:
- a readable scenic map
- one selected district
- one status line telling them what to do now

Acceptance rules:
- maximum 5 visible district hotspots
- only one hotspot can be “active”
- status line uses plain language, not internal system terms

### Step 3 — Open Town Hall
Town Hall opens in a framed district modal.
Player sees:
- a story shell
- one current step
- no giant side configuration stack

Acceptance rules:
- the stepper is implicit or softly visible, not a dense wizard chrome
- the player is never asked more than one conceptual question at a time

### Step 4 — Human identity step
Questions:
- what should we call you?
- choose or customize your avatar

Acceptance rules:
- one name field
- one avatar action
- one submit CTA
- no chain or provider language

### Step 5 — Agent identity step
Questions:
- what should we call your agent?
- choose or customize its avatar

Acceptance rules:
- same structure as human step
- copy makes the agent feel like a rescued partner, not a backend process

### Step 6 — Processing / registration
The player sees progress, but not an infrastructure wall.

Acceptance rules:
- default surface shows one combined progress state
- detailed chain-specific sub-statuses live behind “details”
- retry is secondary
- continue is primary once allowed

### Step 7 — Brain connect
The user is guided to power the agent.

Acceptance rules:
- first path is friendly and short
- advanced providers hidden by default
- “bring your own API key” is a secondary disclosure path
- list explosion is never the first thing the user sees

### Step 8 — Sigil ritual
The player and the worker mirror a symbol to unlock the next stage.

Acceptance rules:
- the puzzle has clear cause and effect
- one action at a time
- success state is celebratory but brief
- next actions are obvious: ceremony or house

## 6. Returning player path

A returning player should not be forced through full onboarding again.

Preferred behavior:
- if the house/session exists, show reconnect panel first
- if brain is connected, do not show the provider path first
- if the user is ready, make “Open house” or “Continue” the primary CTA

## 7. Brain Connect UX law

### 7.1 The brain screen is not a provider marketplace
The user goal is:
> “Give my agent a brain.”

The UI goal is not:
> “Expose every possible backend transport.”

### 7.2 Screen structure
Order:
1. short explanation
2. recommended/easy path
3. “I have my own API key” disclosure
4. advanced settings disclosure
5. continue action

### 7.3 Provider display rules
- do not dump 20+ providers in the default state
- default to a short recommended path
- advanced provider selectors appear only after explicit user action
- OAuth/raw JSON fields are always backstage or advanced

## 8. Town Shell law

### 8.1 Shell purpose
The shell is an orientation scene, not a control center.

### 8.2 Shell contents
Must include:
- town vista
- hotspot layer
- current objective text
- district modal launcher
- optional subtle global nav or profile access

Must not include by default:
- trainer open
- debug traffic
- raw session state
- long logs
- configuration wall

### 8.3 Shell density
Maximum:
- 5 visible district hotspots
- 1 status line
- 1 selected district
- 1 persistent helper drawer entry point

## 9. District modal law

Districts should feel like entering an interior or an office in town.
The modal is not just a web dialog.

Rules:
- title always names the place
- body always begins with the place’s purpose
- controls are grouped by player task, not by system subsystem
- close affordance always visible
- backdrop click to close allowed only when safe

## 10. Town Hall law

Town Hall is the emotional onboarding center.

Rules:
- friendly greeting at every entry
- use place-based copy
- keep technical steps framed as civic/ritual steps when possible
- never show four registration states as the first thing in the flow
- keep chain detail hidden unless there is a failure or user request

## 11. Sigil step law

The sigil step is the first strong “human + agent collaboration” moment.

It must communicate:
- mirrored choice
- trust
- synchronization
- unlocking

Rules:
- the player chooses
- the worker mirrors
- lock state is always visible
- waiting state is explicit
- success immediately reveals what is now open

## 12. Agent Comms drawer law

### 12.1 Purpose
The drawer is a sidekick surface, not a mission control center.

### 12.2 Default behavior
- collapsed or minimized by default for first-time users
- opens contextually when:
  - the agent has a receipt
  - an approval is needed
  - the user explicitly opens it

### 12.3 Visible content priority
1. current short status
2. one recommendation or receipt
3. approvals
4. chat transcript
5. advanced tabs only when requested

### 12.4 Backstage debug
Debug tabs must be hidden behind a clear advanced/dev toggle.

## 13. Progressive disclosure map

### Public by default
- Enter
- town shell
- district hotspots
- Town Hall main flow
- basic Brain connect
- Sigil ritual
- house / continue

### Hidden behind advanced
- provider matrix
- OAuth profile fields
- base URL overrides
- thinking level knobs
- proxy checkboxes
- raw worker tools
- traffic inspector
- session context

### Hidden behind dev mode
- trainer
- compare
- tool invoke lab
- transcript integrity
- low-level debug panes

## 14. Error and recovery UX

### 14.1 Error copy
Every error must answer:
1. what happened
2. what the player can do now

### 14.2 Recovery states
Need dedicated patterns for:
- provider connection failure
- wallet not connected
- worker disconnected
- registration still pending
- sigil mismatch
- reconnecting to an existing house/session

### 14.3 Rule
Recovery UI may expose more technical detail than primary UI, but only in a secondary details layer.

## 15. Mobile behavior

### 15.1 Start Gate
- hero content stacks vertically
- auth sheet overlays or replaces hero support content
- primary CTA stays visible

### 15.2 Town Shell
- hotspot labels must not overlap
- status line wraps to two lines max
- district modal becomes full-height sheet

### 15.3 Agent drawer
- becomes bottom sheet
- never obscures the primary CTA of the current step
- debug panes cannot open full-screen without explicit user action

## 16. Measurable acceptance criteria

These are mandatory for shell/onboarding implementation.

### 16.1 Navigation and hierarchy
- exactly 1 primary CTA above the fold on Start Gate, Brain Connect, and each Town Hall step
- no more than 5 visible district hotspots on the shell
- no developer/debug panes visible on first-run entry

### 16.2 Responsiveness
- no horizontal scroll from 320px to 1440px
- primary CTA remains tappable on 390px width with drawer closed and open
- district titles never clip at 390px

### 16.3 Progressive disclosure
- advanced provider controls are absent until advanced is opened
- chain-specific registration detail is collapsed by default
- trainer tools require explicit open

### 16.4 Persistence
- current Town Hall step persists on refresh
- reconnect state surfaces the most relevant next action first
- brain connection state is remembered

### 16.5 Accessibility
- every icon button has an accessible name
- focus order matches visual order
- visible focus ring on keyboard navigation
- status is conveyed by text as well as color

## 17. Playwright validation checklist

Minimum automated checks for each shell/onboarding PR:
1. screenshot at 390 / 768 / 1280
2. no console errors on load
3. primary CTA visible and enabled when expected
4. advanced provider panel hidden initially
5. agent debug pane hidden initially
6. Town Hall first step shows only human identity fields
7. reconnect panel appears before full onboarding when reconnect state exists

## 18. Rules for AI developers

When editing a shell or onboarding screen:
- do not start by adding controls
- start by protecting the main story beat
- if you need a new control cluster, place it behind disclosure unless it advances the main task
- do not invent new shell primitives if an `@agent-town` registry block already exists
- if you must create a new primitive, add it to the registry before using it in production

## 19. Forward-compatibility note

These UX rules are written for the current Portal shell and onboarding flow, but they are meant to become the stable shell law for the upcoming town-builder / homestead experience as well.

The later city-builder may replace the current town shell as the dominant home screen, but it should inherit the same principles:
- one composition
- one obvious next step
- AI as helper, not hidden complexity
- place-first navigation
