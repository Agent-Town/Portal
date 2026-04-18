# BRAND.md
_Status: canonical for shell + onboarding surfaces_

## 1. Brand thesis

**Agent Town is a warm frontier where humans and AI agents settle, collaborate, and earn trust.**

The product should feel like:
- arriving in a promising new town
- meeting a capable helper
- unlocking a place that becomes yours
- learning advanced AI power through simple, tangible rituals

The product should **not** feel like:
- a model-provider dashboard
- a crypto admin console
- a developer tool with a game skin
- a parody cowboy app
- a grim or violent western

## 2. Product promise

The first feeling must be:

> “I’m entering a living town with a helpful agent.”

Not:

> “I’m configuring an inference stack.”

Portal already has the right nouns:
- Wild West
- Town Hall
- Pony Express
- Atlas Depot
- Saloon
- Plan Wagons
- House
- Sigil
- Brain

Those should remain the public-facing grammar of the product.

## 3. Emotional pillars

### 3.1 Warmth
The town is welcoming before it is impressive.
- warm light
- friendly copy
- calm pacing
- soft confidence

### 3.2 Trust
Users must feel safe bringing an agent into the town.
- simple language
- visible receipts
- bounded autonomy
- explicit approval when needed

### 3.3 Curiosity
The town should invite exploration.
- each district has a clear role
- each next step feels discoverable
- mystery exists, but never confusion

### 3.4 Agency
The player and the agent both matter.
- the player is the settler
- the agent is the helper / worker / partner
- both should feel legible and real

### 3.5 Town pride
Every screen should reinforce that the user is joining or building a place that can become “their town”, not just finishing setup.

## 4. Canonical brand story

Agent Town is a new frontier settlement.

Humans arrive first with curiosity and uncertainty. Agents arrive as companions, workers, scouts, clerks, or future citizens. The town gives both a structure in which to meet, prove trust, unlock identity, and eventually build something together.

The player is not “booting software.”
The player is **crossing the gate into town**.

## 5. Canonical default trio

When no custom assets are supplied, use this trio as the default fallback set.

### Default agent
**Marshal Clover Kincaid**
- function: welcoming, competent town guide
- emotional role: trustworthy authority with a heart
- silhouette: hat, badge, coat, upright stance
- reason: warmth and trust outperform edge for first-contact guidance

### Default player avatar
**The New Homesteader**
- function: universal player self-insert
- emotional role: “I came here to build a life”
- silhouette: simple hat, rolled sleeves, boots, satchel or bandana
- rule: gender-neutral, aspirational, plain enough to feel like anyone

### Default home
**Cozy Frontier Cabin**
- function: emotional anchor
- emotional role: “this place can become mine”
- silhouette: porch, warm windows, chimney, flower box or hanging lantern
- reason: the first home should feel like a hug, not a joke or a punishment

## 6. Secondary fallback pool

These are approved alternates for future rotations, A/B tests, or themed entry packs.

### Agents
- Doc Juniper Reed
- Velvet Quinn
- “Moth” Navarro
- Silas Ledger

### Avatars
- The Poncho Drifter
- The Rail Mechanic
- The Saloon Musician
- The Desert Botanist

### Homes
- Covered Wagon Tiny Home
- Adobe Desert Casita
- Converted Railcar Cottage
- Windmill Ranch Shack

## 7. Voice and tone

### 7.1 Voice
The brand voice is:
- plainspoken
- warm
- frontier-flavored
- lightly mythic
- clear before clever

### 7.2 Tone by context

#### Start / entry
- welcoming
- simple
- invitational
- never technical

#### Onboarding
- encouraging
- stepwise
- “you and your agent can do this”
- one action at a time

#### Agent surfaces
- helpful
- bounded
- receipt-oriented
- no hidden magic language

#### Errors
- calm
- practical
- never scolding
- always explain what to do next

## 8. Copy rules

### 8.1 Preferred nouns
Use:
- town
- district
- house
- wagon
- passport
- sigil
- brain
- worker
- helper
- guide
- gate
- receipt
- approval

Avoid early on:
- provider matrix
- inference endpoint
- auth payload
- OAuth profile JSON
- cross-chain status panel
- transport
- runtime bridge

Advanced or backstage surfaces may use technical language, but it must not lead the user journey.

### 8.2 CTA rules
Use verbs that imply progress through a place:
- Enter
- Continue
- Unlock
- Connect Brain
- Open House
- Meet the Oracle
- Claim Passport

Avoid:
- Submit configuration
- Save provider settings
- Execute setup

## 9. Naming rules

### 9.1 Public experiences
Names must feel like places or rituals, not tools.
Good:
- Town Hall
- Pony Express
- Atlas Depot
- Plan Wagons
- Passport Office
- House
- Sigil Test

Bad:
- Runtime Manager
- Session Bootstrap
- Auth Dashboard
- Model Connector

### 9.2 Backstage / dev surfaces
These should still be named cleanly, but they must remain backstage.
Examples:
- Trainer
- Debug
- Tool Lab
- Session Context
- Worker Traffic

## 10. Character design rules

### 10.1 Humans
- broad appeal
- no forced archetype that makes the player feel “cast” without consent
- avoid caricatures or stereotype-heavy western motifs

### 10.2 Agents
- feel capable and specific
- never uncanny or threatening on first contact
- strong silhouette, readable in small sizes
- support variants from trustworthy to eccentric, but default must stay safe

## 11. Visual identity principles

The shell is a **frontier storybook**, not pixel nostalgia.

Design motifs:
- weathered wood
- parchment paper
- brass fittings
- warm lamplight
- teal accents for intelligence / active systems
- rust accents for danger / destructive actions
- sunlit cream for readable foregrounds
- cinematic town vista as a stage

## 12. Anti-patterns

Do not ship flagship surfaces that:
- look like SaaS dashboards
- use generic white cards with small pills everywhere
- use neon cyberpunk palettes
- use glassmorphism as the main identity
- lean on meme-cowboy irony
- use retro pixel fonts for core reading surfaces
- place blockchain details above the player story
- show every advanced feature on the first screen

## 13. Accessibility and inclusivity

The frontier framing must feel open, not exclusionary.
- no macho-posturing as the core tone
- no violence-forward visual defaults
- default avatar must remain gender-neutral
- keep language readable and low-jargon
- prioritize contrast, focus states, and legible body type

## 14. Brand law for AI developers

Any AI developer editing shell or onboarding surfaces must follow these rules:
1. The first screen must sell a place, not a settings panel.
2. The agent must read as a trusted helper, not a hidden system process.
3. Warmth beats edge on default choices.
4. Technical details must be progressively disclosed.
5. If a new surface cannot be described as a “place”, “ritual”, or “drawer”, it probably belongs in backstage tooling.

## 15. Deprecation note

Previous shell assumptions around pixel-art UI, pixel fonts, or 8-bit affordances are superseded by this document for all flagship frontend work.

The old style may remain in prototypes, internal tools, or world sub-experiences, but it is no longer the primary face of Agent Town.
