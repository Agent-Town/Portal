# GAME_UX.md
_Status: canonical for shell, onboarding, Founders Plot V1 game surfaces, and V1.4.2 screenshot-first signoff_

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

## 1.1 V1.4.2 UX objective

This sprint changes the visual asset layer, not the gameplay loop. The same systems should feel more like a launch-quality game because the art, world objects, Clover states, and onboarding visuals read more clearly and more warmly.

In five seconds, a player should understand:

1. this is a town-building game;
2. this is my plot or town;
3. this is the next thing to do;
4. Clover is helping me.

If the screen reads as a dashboard, asset browser, or AI demo, it fails.

## 1.2 V1.4.2 route-level acceptance cleanup

The V1.4.2 GPT Image 2 art baseline is accepted. The next UX cleanup focuses on the live route, not a broad art rebuild.

### The five-second rule

A player must be able to answer within five seconds:

1. What kind of game is this?
2. What is the next thing to do?
3. Where is Clover?
4. What object matters right now?

### Attention hierarchy

The screen may have only one dominant objective owner.

Priority order:

1. blocking approval or error;
2. current objective or tutorial milestone;
3. ready-to-turn-in contract;
4. active Foreman action;
5. selected object action;
6. secondary available lots;
7. ambient labels.

If two systems compete, the lower-priority system must become a badge, tooltip, drawer item, or journal entry.

### Mobile label rules

On mobile default route:

- hide non-objective `Build here` labels;
- show at most one strong objective label;
- use icons or stakes for quiet available lots;
- move detail copy into bottom sheets;
- show no visible clipped labels.

### Clover action UX

Clover must visibly act in the world without relying on the Foreman drawer.

When Clover acts:

1. Clover is grounded in the scene.
2. The target object is linked or highlighted.
3. The action feedback appears near the world object.
4. A one-line receipt appears after completion.
5. Detailed audit remains expandable.

### HQ upgrade UX

HQ upgrades are emotional progress moments.

At least HQ Level 1, Level 3, and Level 5 must read as distinct states in the scene.

### Scene layering UX

Use background plates for atmosphere and live object layers for state. If a building can be placed, upgraded, locked, producing, or targeted by Clover, it cannot be only baked into the scene background.

## App-wide visual coherence rule

A user moving through Start Gate, Town Shell, Town Hall, Brain, House, Pony Express, Saloon, Sigil, Atlas, Leaderboard, and Founders Plot should feel they are in one Agent Town product.

Platform surfaces may use richer brand/hero-cast visuals than Founders Plot gameplay, but they must not distract from the V1 product priority: Founders Plot is the launch chapter and Clover is the gameplay partner.

### Route-level acceptance

Each refreshed surface must pass the five-second test:
1. What is this place?
2. What can I do next?
3. Does it feel like Agent Town?
4. Is debug/provider/runtime complexity hidden unless intentionally opened?

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

## 4.9 Screenshot-first signoff

The signoff artifact for player-facing art changes is the actual route screenshot, not the loose asset file.

Required V1.4.2 screenshot review surfaces:

- Founders Plot full player route desktop and mobile;
- Founders Plot selected building;
- Founders Plot Clover acting state;
- Start Gate desktop;
- town shell / hub desktop;
- Town Hall onboarding first step;
- Brain Connect default collapsed state.

The full player route must remain free of Agent Comms / worker-debug console chrome unless explicit debug mode is enabled.

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

---

# V1.3 Addendum — Founders Plot Game-Surface UX Law

_Status: canonical for Agent Town: Founders Plot V1 game-surface work_

## U1. Founders Plot UX thesis

Founders Plot is the primary V1 game surface after onboarding.

The player should not feel they are managing panels. They should feel they are improving a visible frontier plot with Clover nearby.

The default game loop should read visually:

1. see town state;
2. see one current goal;
3. click the relevant building/object;
4. take one action;
5. watch the town respond;
6. let Clover handle a bounded routine task when trusted.

## U2. The five-second game test

A person viewing the default screen for five seconds should answer:

- “This is a town-building game.”
- “That is my plot.”
- “That highlighted object is what I should do next.”
- “That character is my AI helper.”
- “Something is producing / ready / blocked.”

If a five-second viewer says “dashboard”, “admin panel”, “task manager”, or “AI config screen”, the UI has failed.

## U3. One current owner of attention

Founders Plot must arbitrate attention in this order:

1. blocking approval or broken runtime truth;
2. tutorial / current goal blocker;
3. ready contract turn-in;
4. ready production / collection;
5. active contract progress suggestion;
6. optional Foreman optimization;
7. journal / recap / secondary history.

The UI, Clover suggestion, and primary CTA must point to the same highest-priority item whenever possible.

## U4. Founders Plot primary screen map

### U4.1 Founders Plot Game Surface

The post-onboarding home-town screen.

Purpose:
- make Agent Town feel like a real game;
- make the existing V1 systems visible in the world;
- give the player one clear next action;
- keep Clover present and legible.

Required regions:

- compact top HUD;
- scenic plot stage;
- in-world buildings and town objects;
- Clover / Foreman presence;
- contextual action sheet;
- drawers for contracts, journal, approvals, and Foreman details.

This screen is allowed to become the default return destination once onboarding is complete.

## U5. Default layout

Default desktop layout:

1. top HUD with HQ level, resources, and current goal;
2. scenic plot stage as dominant area;
3. contextual action sheet, closed or minimal unless an object is selected;
4. drawer entry points for Foreman, contracts, approvals, and journal.

Default mobile layout:

1. compact HUD;
2. scenic plot;
3. bottom action sheet;
4. drawer buttons; no permanent stacked panels.

## U6. Interaction model

Players interact through world objects:

- click/tap empty lot -> build sheet;
- click/tap HQ -> upgrade sheet;
- click/tap Lumber Camp/Farm/Quarry/etc. -> queue/collect/inspect sheet;
- click/tap Contract Board -> contract drawer;
- click/tap Clover -> Foreman drawer;
- click/tap Journal -> recap/history drawer;
- click/tap Welcome Sign -> Public Square / charm drawer.

## U7. Required object states

Each building/object must have clear visual and accessible states:

- locked;
- buildable;
- under construction;
- idle;
- producing;
- ready;
- blocked;
- upgradable;
- selected.

## U8. Foreman UX

Clover is a character in the world.

Clover states:

- idle: standing near Foreman Hut/HQ;
- observing: subtle attention indicator;
- thinking: short non-blocking bubble;
- acting: movement/intent indicator toward target object if feasible;
- waiting approval: visible badge and drawer prompt;
- paused: calm paused marker;
- needs restart: friendly restart prompt.

Clover copy rule: one short sentence by default, details only on expand.

## U9. Text compression

Default visible text limits:

- desktop: <= 120 words;
- mobile: <= 80 words;
- max 3 visible prose blocks;
- all debug/provider/runtime words absent in normal gameplay.

## U10. Drawers and sheets

Default hidden or minimized:

- Contract details;
- Town Journal;
- Approvals;
- Foreman receipts;
- Standing Orders;
- debug/worker details.

Open drawers must not obscure the current primary action unless the drawer itself contains that action.

## U11. Visual feedback

Minimum game-feel feedback:

- placement/construction animation;
- production timer/progress indicator;
- ready-to-collect marker;
- resource flyout on collect/reward;
- contract paper pin / availability indicator;
- Clover action receipt;
- HQ level-up moment.

All motion must respect reduced motion.

## U12. Founders Plot measurable acceptance criteria

### U12.1 Visual hierarchy

- scenic plot is the largest default region;
- no more than one primary CTA visible;
- no stacked permanent management panels on the default screen;
- no debug/provider/runtime terms visible in normal gameplay.

### U12.2 Text budget

- desktop default visible words <= 120;
- mobile default visible words <= 80;
- no more than 3 prose blocks visible by default.

### U12.3 Object interaction

- every P0 object is clickable/tappable;
- every P0 object is keyboard reachable;
- every P0 object has an accessible name and state;
- selecting an object opens the correct contextual sheet/drawer.

### U12.4 Foreman embodiment

- Clover is visible on default screen;
- `acting`, `waiting-approval`, `paused`, and `needs-restart` states have distinct visual treatments;
- a Foreman scheduler action produces visible world feedback and a receipt.

### U12.5 Screenshot baselines

Required viewports:

- 390px mobile;
- 768px tablet;
- 1280px desktop;
- 1440px wide desktop if layout changes materially.

Required states:

- initial plot;
- selected building;
- producing;
- ready to collect;
- active contract;
- Clover acting;
- Clover waiting approval;
- reduced-motion mode if animation code changed.

## U13. Rules for AI developers working on Founders Plot UI

- Start by making the town state visible in-world before adding any panel.
- Convert panels into objects, drawers, badges, tooltips, or sheets where possible.
- Do not add a new visible text block unless it owns the current player decision.
- Do not expose debug/runtime/provider jargon in the normal game surface.
- Use `REGISTRY.md` before inventing primitives.
- Test the five-second game test with screenshots before finalizing.

# V1.3.1 Addendum — Visual-Surface Signoff UX Law

_Status: canonical for Agent Town: Founders Plot V1.3.1 visual-surface signoff_

## U14. V1.3.1 sprint thesis

V1.3.1 is not a new systems sprint. It is a focused signoff pass on V1.3.

The current V1.3 direction is structurally correct: scene-first, drawer/sheet secondary systems, Clover in-world, visual adapter architecture, and meaningful tests. V1.3.1 must finish the polish that determines whether the product feels launch-grade.

## U15. Locked wins from V1.3

Do not reopen these unless a serious regression is found:

- scene-first Founders Plot surface;
- visual state adapter / renderer / effects split;
- secondary systems in drawers/sheets;
- Clover visible in-world;
- restart/runtime-truth preserved;
- targeted Playwright coverage for hierarchy, object mapping, mobile, reduced motion, and assets.

## U16. Full-route game test

The player-facing game test applies to the full player route, not only the iframe or embedded experience frame.

A five-second viewer of the actual app route must not see a large worker/debug console as part of the normal game surface.
A five-second viewer of the actual app route must not see Agent Comms / worker-debug console chrome as part of the normal game surface.

The answer should be:

> “This is a frontier town-building game, and Clover is helping me.”

Not:

> “This is a game embedded above Agent Comms / Worker Tools / Brain config.”

## U17. Clover acting UX

When Clover acts, the player must know:

1. what Clover is doing;
2. which world object Clover is doing it to;
3. whether it succeeded, failed, or needs approval.

Default presentation:

- Clover moves/anchors/points toward the target or shows a target-link treatment;
- the target object also reacts;
- one short receipt appears;
- details remain expandable in the Foreman drawer.

Bad presentation:

- Clover bubble says “acting” but target is unclear;
- only a text receipt explains the action;
- the action is visible only in logs.

## U18. Mobile label suppression rules

Mobile should feel calmer than desktop, not more annotated.

At mobile widths:

- default object labels are hidden unless selected or objective-relevant;
- buildable lot labels are suppressed unless the lot is the recommended next step;
- label meaning should move into icons, badges, focus states, and the bottom sheet;
- the objective ribbon carries the main instruction;
- the selected sheet carries secondary text.

Metric:

- mobile default stage labels visible <= 3;
- mobile default visible word count target <= 65, hard max <= 80;
- no overlapping object labels in the baseline screenshots.

## U19. Objective-relevant lot emphasis

When several build lots are unlocked, the game must still show one next action.

Rules:

- current goal resolver selects at most one `recommended` world object;
- other legal lots stay `available` but visually muted;
- the current objective ribbon, primary CTA, and Clover suggestion should reference the recommended object;
- if no single recommendation exists, the UI may show a neutral “choose a lot” state, but that is not the default tutorial path.

## U20. Badge and signal discipline

Badges, pills, and labels must not recreate dashboard clutter.

Rules:

- default object badges use priority ordering;
- mobile defaults show fewer badges than desktop;
- multi-signal details live in selected-object sheet;
- town signals remain secondary unless they own the current attention priority.

## U21. Scope-hygiene UX rule

Non-game platform work such as OpenRouter/proxy migration may be important, but it must not be part of normal Founders Plot signoff unless the sprint explicitly says so.

The review experience should be clean:

- one branch story;
- one owner for unrelated migration work if it remains;
- separate tests and rollback plan;
- no mixed approval where visual signoff implicitly approves provider/proxy changes.

## U22. V1.3.1 measurable UX gates

### U22.1 Product direction gate

Pass criteria:

- five-second viewer reads it as a frontier town-building game;
- one current goal is obvious;
- Clover is visibly in-world;
- no normal-surface debug console is visible.

### U22.2 Art direction gate

Pass criteria:

- canonical hero frame approved by named human art/design owner;
- no primary-view placeholder-grade assets;
- asset manifest approval metadata complete.

### U22.3 Embodiment gate

Pass criteria:

- Clover `acting` target link visible in screenshot and testable in DOM;
- target object reacts to Clover action;
- blocked/restart-needed truth remains visible and friendly.

### U22.4 Mobile gate

Pass criteria:

- mobile stage breathes;
- default stage labels <= 3;
- visible words hard max <= 80, target <= 65;
- no label overlap in baseline screenshots.

### U22.5 Goal-emphasis gate

Pass criteria:

- exactly one primary recommended object in tutorial/default states;
- non-recommended available lots are visually quieter;
- CTA and recommendation agree.

### U22.6 Scope gate

Pass criteria:

- OpenRouter/proxy changes split out or documented in `specs/OPENROUTER_SCOPE_QUARANTINE.md`;
- separate owner signoff recorded if not split.


---

## V1.4 update: AI gameplay truth and hero-frame UX

### Foreman gameplay truth path

Normal gameplay must represent Clover as an AI partner only when the real path exists:

```text
structured observation
+ skill.md
+ heartbeat.md
+ tools.md
+ goals.md
+ safe candidates
→ LLM/Test Brain choice
→ server-authoritative tool execution
→ in-world feedback
→ receipt/replay/recap
```

### Player-facing Foreman receipt

After Clover acts, show one concise line in normal gameplay:

> “I collected lumber because the Contract Board needs wood.”

Do not show provider/model/runtime/tool jargon unless the player opens an explicit debug/audit surface.

### Hero-frame test

The default Founders Plot route must pass the five-second test:

1. It reads as a town-building game.
2. The next action is obvious.
3. Clover is visibly the helper.
4. The town state is legible through the scene, not through text panels.

### Hero-video/script reuse

Hero-video material may support tone and marketing alignment, but gameplay UI must remain centered on the home plot and Clover. Supporting trailer characters should not become persistent UI clutter.

### Hero-cast boundary

The recovered platform hero cast may appear in:

- landing-page hero art;
- onboarding or loading surfaces;
- marketing and brand story panels;
- future NPC/worldbuilding concepts after a later spec.

The default Founders Plot gameplay route must not become a mascot ensemble screen.

A five-second reading of the route should still be:

1. this is my town;
2. this is the next action;
3. Clover is helping me.

## Founders Plot Mobile Attention Arbitration

On mobile, the player must always know one thing first:

> What should I do next?

The default mobile route must not show multiple competing world labels. The objective, selected object, and Clover action may speak. Everything else must wait.

### Mobile default state

The 390px default route should show:

1. compact resource/status HUD;
2. one concise objective;
3. scenic plot;
4. one objective/recommended object marker;
5. one primary action via sheet or CTA.

### Mobile selected state

After selecting an object, the bottom sheet may carry the text burden. The stage should remain visually calm.

### Mobile Clover acting state

When Clover acts:

- Clover must remain visible;
- the target object must be visually linked;
- no large Foreman drawer should be required to understand the action;
- target-area feedback must not stack more than two competing signals.

### HQ upgrade emotional rule

An HQ upgrade must feel like a settlement milestone, not a number change. At minimum, HQ levels 1, 3, and 5 must be visibly distinct without labels.

### Five-second mobile test

Show the 390px screenshot for five seconds. A reviewer must be able to answer:

1. What game is this?
2. What is the next action?
3. Which object matters now?
4. Where is Clover / what is Clover doing, if relevant?

Failure to answer these means the mobile screen fails even if automated metrics pass.
