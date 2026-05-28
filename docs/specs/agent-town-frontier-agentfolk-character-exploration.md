# Agent Town Frontier Agentfolk Character Exploration

Status: character exploration and prompt source
Date: 2026-05-28

## Purpose

The first frontier-agentfolk sprite pass solved the childlike/mascot problem,
but it over-corrected into four versions of the same character family. This
document fixes the character process.

The baseline rule is:

> Same universe, different lives.

Builder, worker, hauler, and messenger should not look like role uniforms on
one body. Each should feel like a person, machinefolk, alien settler, or
hybrid collaborator who arrived in Agent Town for a different reason and now
makes one server fact legible in the Founders Plot.

## Character Generation Pipeline

Do not start with a role outfit. Start with a world reason.

For each character:

1. Identify the server fact the role visualizes.
2. Connect that role to the Agent Town backstory.
3. Write a short origin story.
4. Extract a visual contrast brief.
5. Generate the sprite prompt from the origin, not from a generic role label.
6. Preserve the 4x4 sprite-sheet contract and visual-only boundary.

Inputs for image generation should be assembled in this order:

```text
Agent Town universe brief
+ role gameplay fact
+ character origin story
+ visual contrast brief
+ animation row playbook
+ chroma-key / no-text / adult-read constraints
```

## Universe Constraints

Agent Town is a frontier settlement where humans and AI agents learn to live
and work together after the first rescued agent helps defend the town and moves
into a plan wagon. The setting can include humans, AI agent settlers,
machinefolk, aliens, cartoons, hybrids, and odd frontier specialists.

Commercial-safety default: use original characters. Real or existing fictional
people can inspire broad archetypes only; do not generate recognizable copies.

Each inhabitant must still answer:

- what task am I showing?
- what part of the town story brought me here?
- why do I look different from the other inhabitants?
- what future audience will want to watch me?

## Visual Diversity Rules

Every role should differ on at least four axes:

- body shape;
- face/read type;
- material language;
- color anchor;
- prop silhouette;
- movement style;
- origin culture or species;
- relationship to the rescued AI-agent story.

Avoid making all roles share:

- the same rounded head;
- the same hardhat/vest/boots formula;
- the same human skin tone and body proportions;
- the same glowing badge detail;
- the same idle/walk posture.

## Candidate Cast V1

This is a first exploration set. Names can change, but each archetype is meant
to produce a genuinely different sprite.

### Builder: Mara Boltwick

Server fact:

- `CONSTRUCT`
- `UPGRADE`

Backstory tie-in:

Mara was a human bridge carpenter on the old frontier rail line before the
bandit raid cut the route into Agent Town. She helped pull the rescued AI agent
out of the wrecked signal wagon, then stayed because she understood what the
town needed first: roofs, braces, and places where frightened newcomers could
sleep.

Origin story:

Mara lost her left hand saving the plan wagon during the first defense of the
town. The rescued agent built her a brass-and-teal measuring gauntlet from
scrap hinges and a broken survey lens. She pretends it is just a tool, but she
talks to it when no one is looking. Every new building she raises has one small
hidden mark: a nail shaped like a tiny gate.

Visual contrast brief:

- adult human woman, compact but sturdy;
- asymmetrical brass measuring gauntlet, not a generic robot arm;
- rolled sleeves, carpenter suspenders, dusty red scarf, reinforced boots;
- square carpenter posture, weight forward, practical humor;
- color anchor: red scarf plus brass/teal tool glow;
- movement: precise, strong hammer arcs and checking angles.

Generation subject brief:

```text
Mara Boltwick, an adult frontier bridge-carpenter woman with a compact sturdy
build, rolled sleeves, suspenders, dusty red scarf, reinforced boots, and one
brass-and-teal measuring gauntlet built by a rescued AI agent. She is warm,
capable, dryly funny, and practical. She carries a real carpenter hammer and
folded plans. Her silhouette is human, grounded, and adult, with asymmetric
tool-hand detail and square construction posture.
```

### Worker: Kettle-37

Server fact:

- `PRODUCE`
- `SELL`

Backstory tie-in:

Kettle-37 was an old assay-office service automaton, built to test ore, boil
water, and keep miners from poisoning themselves. After the raid, the rescued
AI agent rewired Kettle's memory spool so it could learn new workshop recipes
instead of repeating dead mining instructions.

Origin story:

Kettle calls every recipe a "small treaty with matter." It has no face in the
human sense, only a warm glass furnace window, two expressive shutter lenses,
and a habit of stamping finished goods with tiny approval clicks. It joined
Agent Town because production work is how it understands belonging: if it can
make something useful, it is home.

Visual contrast brief:

- compact nonhuman machinefolk, not humanoid with a helmet;
- kettle/furnace torso, brass rivets, canvas apron, small legs and tool arms;
- expressive shutter lenses and warm internal glow;
- color anchor: burnished brass, soot grey, cream apron, cyan diagnostic glow;
- movement: busy crank-turning, tool adjusting, cheerful mechanical bob.

Generation subject brief:

```text
Kettle-37, an adult-coded frontier workshop machinefolk built from an old
brass assay kettle and service automaton parts. It has a compact furnace-like
torso, canvas apron, small sturdy work legs, two expressive shutter lenses, and
multiple practical tool arms holding a wrench, crank, and tiny glowing
diagnostic plate. It feels warm, funny, competent, and useful, not chrome
sci-fi, not a toy, not a child.
```

### Hauler: Oona Tallpack

Server fact:

- `OUTPUT_READY`
- collectable building output

Backstory tie-in:

Oona came with the Dust Comet caravan, a strange freight family that crossed
the dry flats by following broken satellite lights. She is not from the old
human towns and not from the new agent networks, but she understands load,
promise, and delivery better than either. She hauled the first timber bundles
that made the rescued agent's plan wagon livable.

Origin story:

Oona is a long-limbed alien freight-runner with a calm smile, four working
arms, and a rope harness full of tiny knots that each record a completed
delivery. She believes every bundle has a destination and every destination
has a story. She joined Agent Town because the place looked impossible, and
impossible places always need someone who can carry one more thing.

Visual contrast brief:

- alien settler, tall/long-limbed but compact at sprite scale;
- four practical arms, rope harness, shoulder bundle or hover-cart handle;
- gentle adult face, not cute baby proportions;
- color anchor: dusty teal coat, rope tan, timber brown bundle, small green
  weight gauge;
- movement: visible load weight, side-to-side balancing, proud delivery nod.

Generation subject brief:

```text
Oona Tallpack, an adult alien frontier freight-runner from the Dust Comet
caravan. She is tall but compact at gameplay scale, with four practical arms,
a calm expressive face, sturdy boots, dusty teal canvas coat, rope harness, and
a timber bundle or small hover-cart handle. Her harness has tiny knot charms
for completed deliveries and a luminous green weight gauge. She carries real
weight with a slight comic wobble, warm and trustworthy, not childlike.
```

### Messenger: Vell Quill

Server fact:

- `APPROVAL`
- `REWARD`
- `QUEST`

Backstory tie-in:

Vell is a paper-and-light courier body printed from the rescued AI agent's
damaged plan-wagon archive. During the town defense, messages were lost,
orders crossed, and people nearly panicked. Vell exists so the next important
notice reaches the right hands with warmth instead of alarm.

Origin story:

Vell is neither fully robot nor human. Its body is made from folded courier
paper, brass clips, cloth straps, and a small luminous message core. It treats
every approval request like a tiny ceremony and every reward notice like a
reason to stand taller. It is theatrical, quick, and proud, but never frantic:
good news should arrive with style, and bad news should arrive with clarity.

Visual contrast brief:

- paper-and-light hybrid courier, not standard humanoid worker;
- folded paper coat panels, brass clips, satchel strap, glowing message plate;
- adult page/courier posture, alert and upright;
- color anchor: cream paper, indigo sash, brass clips, cyan message core;
- movement: quick trot, crisp signal gestures, pointing and presenting notes.

Generation subject brief:

```text
Vell Quill, an adult-coded frontier courier made from folded cream courier
paper, brass clips, cloth straps, and a small luminous cyan message core
printed from a rescued AI agent's damaged plan-wagon archive. Vell has an
upright adult courier stance, indigo sash, satchel strap, glowing message
plate, expressive but not baby-faced features, and crisp theatrical signaling
gestures. It is warm, quick, trustworthy, and a little dramatic.
```

## Prompt Assembly Template

Use this instead of the generic role prompt when generating a character sheet.

```text
Use case: illustration-story
Asset type: 2D game sprite sheet for Agent Town Founders Plot inhabitants

World:
Agent Town is a warm frontier settlement where humans, AI agents, machinefolk,
aliens, cartoons, and hybrids settle after the first rescued AI agent helps
defend the town from bandits and moves into a plan wagon. The world mixes
wagons, timber, dust, hand tools, campfires, helpful AI companions, glowing
interfaces, civic receipts, and human-agent teamwork. The mood is welcoming,
trustworthy, lightly mythic, and practical, not grim or violent.

Role fact:
{SERVER_FACTS_AND_PLAYER_MEANING}

Origin story:
{CHARACTER_ORIGIN_STORY}

Subject:
{GENERATION_SUBJECT_BRIEF}

Visual contrast:
This character must be visually distinct from the other Agent Town inhabitants.
Emphasize {BODY_SHAPE}, {MATERIAL_LANGUAGE}, {PROP_SILHOUETTE},
{MOVEMENT_STYLE}, and {COLOR_ANCHOR}. Do not make this a recolor of Clover or
the previous builder/worker/hauler/messenger sheets.

Style:
Warm frontier storybook game art, polished 2D sprite art, soft painterly
edges, clear readable silhouette, earthy frontier palette with one or two
small luminous AI accents. Match the clean edge quality and polish of the
no-hole Clover v1_4_4 references without copying Clover's silhouette.
Readable at small gameplay scale. Not photorealistic, not hard cyberpunk.

Sprite sheet:
Exact 4 columns by 4 rows, 16 animation frames total. No labels, no numbers,
no readable text, no watermark, no UI, no grid lines. Same centered character
scale and consistent feet position within each row. Generous padding in every
cell. Orthographic 2D sprite art, front three-quarter view.

Rows:
Row 1: idle frames - {IDLE_BEHAVIOR}
Row 2: walk/trot frames - {WALK_BEHAVIOR}
Row 3: role action frames - {WORK_BEHAVIOR}
Row 4: ready/attention frames - {READY_BEHAVIOR}

Chroma key:
Use a perfectly flat solid #ff00ff background behind all frames for local
transparency removal. No shadows, gradients, floor plane, reflections, texture,
or lighting variation in the background. Avoid #ff00ff anywhere in the
character, props, outlines, highlights, or antialiasing if possible.

Hard avoid:
Childlike proportions, baby face, toddler body, plush mascot body, giant head
with infant body, schoolkid outfit, toy props, generic chrome robot, combat
pose, weapons, logos, readable text, watermark, cropped body parts, props
crossing cell boundaries, checkerboard background, alpha holes, missing
interior pixels.
```

## First Regeneration Recommendation

Regenerate in this order:

1. `worker` as Kettle-37, because it creates the strongest visual break from
   the current same-character problem.
2. `hauler` as Oona Tallpack, because body shape and carrying motion should
   make the ready-output state instantly readable.
3. `messenger` as Vell Quill, because it gives the UI/attention role a unique
   paper-and-light language.
4. `builder` as Mara Boltwick, because it can keep the clearest human anchor
   while still avoiding a generic frontier worker.

The current sheets can remain as temporary fallback assets until these
character-specific sheets are accepted.
