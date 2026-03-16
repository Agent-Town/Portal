# APP_FLOW

Status: current route and user-flow map for design work
Last updated: 2026-03-16

This file documents the user-facing routes and major journey surfaces relevant to design work.

Cross-cutting rule:

1. every major flow must remain understandable to non-technical users,
2. every major flow must survive localization,
3. every major flow should be describable in plain verbs,
4. future voice interaction should be able to refer to the current room and main action clearly,
5. the user should be able to rely on the LLM for explanation instead of browsing dense detail by default.

## 1. Route inventory

### 1.1 Front door

1. `/start`
   - welcome card
   - hero media frame
   - Privy email or guest entry flow
   - `Enter` primary CTA

### 1.2 Main hub

1. `/app`
   - town map background
   - district hotspots
   - district modal shell
   - persistent agent sidebar

### 1.3 Cooperative creation

1. `/create`
   - co-op canvas and ceremony path

### 1.4 House

1. `/house`
   - house unlock and house-level artifacts

### 1.5 Public/social routes

1. `/leaderboard`
2. `/s/:id`
3. `/inbox`

## 2. `/start` flow

Primary user journey:

1. land on welcome card,
2. see title and primary CTA,
3. enter auth,
4. complete login,
5. move into `/app`.

Current design risk:

1. the media frame dominates too early,
2. if media is unavailable, the screen can look broken before it looks intentional,
3. the screen must work for users who do not know what an agent or provider is.

## 3. `/app` town hub flow

Primary user journey:

1. open the town map,
2. identify the active or intended district,
3. open a district in a modal,
4. work inside the district without losing page-scoped worker continuity.

Human-readable interpretation:

1. "I am in town"
2. "I can go to a place"
3. "I know which place is active"
4. "I can do one main thing there"

Districts currently visible in the main hub:

1. Atlas Depot
2. Town Board
3. Pony Express
4. Town Hall
5. Saloon
6. Plan Wagons / House

## 4. District modal flow

The user does not normally navigate to a second page for these district experiences.

Current pattern:

1. select district hotspot,
2. district modal opens,
3. district content loads inside the modal body,
4. user works inside the same shell,
5. close returns to the map.

This is both a UX and technical requirement because of the page-scoped worker runtime.

## 5. House / Plan Wagons flow

This is the densest current surface and the one most in need of design discipline.

Major House subsections:

1. path or gate panels,
2. reconnect surfaces,
3. House Console entry buttons,
4. Experiences,
5. Workshop,
6. Library,
7. Tracks,
8. Archive,
9. Trainer.

### 5.1 House Library current task map

The Library currently supports:

1. direct note authoring,
2. conversation capture,
3. shelf creation and filtering,
4. reading table and satchel save,
5. public stack discovery,
6. preview and import,
7. trust and verification,
8. safety actions,
9. relay import,
10. satchel import,
11. route follow and sync,
12. local item inspection and revisions.

Design consequence:

1. it is a powerful tool,
2. it can easily become visually administrative,
3. hierarchy and progressive disclosure are essential,
4. primary actions must be human verbs, not AI vocabulary,
5. the default state must still make sense across languages,
6. detailed trust, provenance, revision, and route data should stay available without dominating the main path.

## 6. Town Hall flow

Current sequence:

1. human naming step,
2. human avatar block,
3. agent naming step,
4. agent avatar block,
5. registration processing,
6. mint checklist,
7. continue to sigil flow.

Design consequence:

1. this is an onboarding ceremony,
2. it should feel guided,
3. it must not feel like a back-office form,
4. it must be understandable by users who do not know how agents are configured.

## 7. Pony, Leaderboard, Saloon, Brain flows

### Pony

1. open inbox,
2. optionally compose in modal,
3. connect or recover house context if needed.

### Leaderboard

1. inspect public teams and summary counts,
2. optionally open full board.

### Saloon

1. currently mostly placeholder / future-facing copy.

### Brain

1. choose provider,
2. choose model,
3. provide auth,
4. optionally configure advanced settings,
5. connect and continue.

Design consequence:

1. all of these inherit the same shell,
2. they should not all inherit the same visual density,
3. advanced infrastructure detail should remain secondary because the LLM can help explain it.

## 8. Device audit order

Future design agents must inspect in this order:

1. mobile,
2. tablet,
3. desktop.

This is mandatory because the current product reveals its biggest hierarchy and density issues on mobile first.

## 9. Current design pain points by flow

### `/start`

1. unclear hierarchy on first paint,
2. oversized dead media frame when external content is blocked,
3. CTA does not feel inevitable enough.

### `/app`

1. town map hotspots are beautiful but not self-evident,
2. selected district state is not strong enough,
3. agent sidebar competes with the primary world surface.

### district modal

1. modal shell and panel shell are both visually loud,
2. too much repeated framing,
3. hierarchy resets inside the modal instead of continuing smoothly.

### House Library

1. too many systems in one scroll,
2. task-first hierarchy not yet strong enough,
3. advanced/manual controls still accumulate visual weight,
4. human goals are less obvious than system structure,
5. language still risks sounding more technical than necessary for mainstream users,
6. the screen still asks the human to inspect more structure than necessary when the LLM could explain it.
