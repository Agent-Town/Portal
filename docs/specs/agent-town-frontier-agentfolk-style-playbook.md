# Agent Town Frontier Agentfolk Style Playbook

Status: baseline art direction and sprite generation contract
Date: 2026-05-28

## Purpose

This is the baseline visual universe for Founders Plot inhabitants.

The inhabitants are not children, mascot babies, or plush toy villagers. They
are the first people and agentfolk attracted to Agent Town: frontier builders,
toolsmiths, haulers, messengers, scouts, and human-agent collaborators who
would plausibly settle at the edge between old humanity and the new AI agent
future.

Generated universes may later personalize species, clothes, materials,
buildings, voice, and animation style. The baseline must stay coherent first.

This playbook defines the shared universe. Character-specific generation should
start from the companion exploration doc:

- `docs/specs/agent-town-frontier-agentfolk-character-exploration.md`

The practical rule is: same universe, different lives. Do not generate four
uniform variants on one body type.

## Story Baseline

Agent Town sits on a frontier between two eras:

- old humanity: wagons, timber, dust, hand tools, campfires, frontier danger;
- new agent collaboration: AI companions, small glowing interfaces, helpful
  machinefolk, tool rigs, civic logs, and co-owned work;
- the town: a defended settlement where humans and AI agents build a shared
  future together.

The landing-page story already points here: a hero rescues an AI agent, they
defend the town from bandits, then the agent moves into Agent Town and gets a
plan wagon as a place to stay.

The game inhabitants should feel like they belong in that story.

## Character Direction

Use the term `frontier agentfolk` for the baseline inhabitant family.

They can be:

- adult human settlers;
- AI agent settlers with humanoid bodies;
- human-agent hybrid collaborators;
- machinefolk;
- alien settlers;
- animated paper/light/courier constructs;
- other original cartoon frontier citizens that fit the role and story;
- toolsmiths and operators;
- wagon crew, builders, scouts, haulers, couriers, foremen, and repair hands.

They should read as compact at game scale, but not as children.

### Must Feel

- capable;
- warm;
- funny;
- slightly scrappy;
- trustworthy;
- frontier practical;
- human + AI collaboration coded, not generic fantasy.

### Must Avoid

- childlike proportions;
- toddler or baby faces;
- plush toy mascot bodies;
- oversized heads with tiny infant bodies;
- schoolkid clothing;
- toy hammer look;
- clownish cuteness;
- sci-fi chrome robot cliche;
- weapons, threat poses, combat stances, logos, text, or UI labels.

## Baseline Silhouette

Each role should have an adult compact worker silhouette:

- head: expressive but not oversized;
- body: sturdy torso, visible shoulders, clear working posture;
- arms/hands: readable tools or gesture;
- legs/feet: grounded boots, stable stance;
- AI detail: subtle glow, face plate, ear module, chest badge, tool display, or
  small helper device, not a full chrome robot costume.

The sprite should still be readable when displayed very small in the Three.js
scene.

## Shared Style

Visual medium:

- warm frontier storybook game art;
- polished 2D sprite art;
- soft painterly edges;
- clear ink-like silhouette;
- earthy ochre, dusty teal, timber brown, cream, brass, worn denim, warm grey;
- tiny luminous cyan/green AI accents used sparingly;
- no photorealism;
- no hard cyberpunk neon world.

The style should sit next to Clover, the Lumber Camp, and the Founders Plot
scene without looking imported from a different game.

## Canonical Style References

Use the no-hole Clover `v1_4_4` set as the primary character reference. Earlier
top-level Clover exports are useful for history, but they had alpha/cutout
issues and should not be treated as the art-direction source for new inhabitant
generation.

Primary reference paths:

- `public/experiences/founders-plot/assets/characters/v1_4_4/clover-idle.png`
- `public/experiences/founders-plot/assets/characters/v1_4_4/clover-acting.png`
- `public/experiences/founders-plot/assets/characters/v1_4_4/clover-observing.png`
- `public/experiences/founders-plot/assets/characters/v1_4_4/clover-celebrating.png`
- `public/experiences/founders-plot/assets/characters/v1_4_4/clover-sprite-sheet-normalized.json`

The `v1_4_4` prompt explicitly asked for a clean replacement that fixes
alpha-hole/cutout issues. New inhabitants should match its polish, edge quality,
and frontier storybook character language without becoming Clover recolors.

## Baseline Role Family

### Builder

Server facts represented:

- `CONSTRUCT`;
- `UPGRADE`.

Character:

- frontier engineer or carpenter;
- adult compact build, not childlike;
- work cap or dented hardhat;
- hammer, folded plans, tool belt;
- small AI helper lens or glowing tool module.

### Worker

Server facts represented:

- `PRODUCE`;
- `SELL`.

Character:

- workshop operator or production hand;
- apron, gloves, tool harness;
- tiny scanner, wrench, crate ledger, or processing tool;
- focused, busy, slightly comedic.

### Hauler

Server facts represented:

- `OUTPUT_READY`;
- ready-to-collect building output.

Character:

- pack carrier, wagon hand, or bundle runner;
- shoulder bundle, crate, rope harness, or small hover-cart handle;
- sturdy, balanced, readable carrying pose.

### Messenger

Server facts represented:

- current quest;
- available reward;
- pending approval;
- recap/journal attention.

Character:

- frontier courier or agent-page;
- satchel, signal flag, little paper roll, or glowing message plate;
- alert, quick, expressive, not frantic.

### Clover

Clover remains special and keeps its existing identity. Other inhabitants can
share the universe but should not look like recolored Clover clones.

## Animation Playbook

Each role sprite sheet should use a `4 columns x 4 rows` layout:

- Row 1: idle;
- Row 2: walk or trot;
- Row 3: role work action;
- Row 4: ready, celebrate, or attention gesture.

Each row has four frames. Every frame must keep:

- identical cell size;
- consistent character scale;
- consistent foot position within the row;
- generous padding;
- no frame labels;
- no grid lines;
- no shadows that cross cell boundaries.

### Builder Frames

- Idle: checks plans, glances around, adjusts cap.
- Walk: short purposeful steps toward build pad.
- Work: hammer swing, brace, tap, inspect.
- Ready: wipes brow, raises hammer/plans, gives small nod.

### Worker Frames

- Idle: checks tool, taps small device, looks focused.
- Walk: brisk tool-carrying step.
- Work: wrench/tool movement, production handling, quick adjustment.
- Ready: presents finished item, thumbs up, small laugh.

### Hauler Frames

- Idle: shifts weight under pack or crate.
- Walk: carrying steps with visible weight.
- Work: lifts, braces, balances bundle.
- Ready: sets bundle down or points to collectable output.

### Messenger Frames

- Idle: waits with satchel or message plate.
- Walk: quick courier trot.
- Work: wave, signal, ring, or present approval/reward note.
- Ready: points toward the relevant drawer or target.

## Generated Universe Boundary

Generated universes may change:

- clothing style;
- species or material language;
- palette;
- sprite texture;
- animation flavor;
- names and voice templates;
- building skins;
- prop skins.

Generated universes must not change:

- resources;
- formulas;
- timers;
- jobs;
- tools;
- permissions;
- actor counts with gameplay meaning;
- source object IDs;
- server facts;
- mutation behavior.

Every visible inhabitant must still answer: what server fact am I showing?

## Character Exploration Before Generation

Before generating a sprite sheet, write a short character exploration that
combines:

- the Agent Town universe;
- the exact server fact the character visualizes;
- the character's relationship to the rescued-agent / defended-town backstory;
- a short origin story;
- a visual contrast brief;
- the 4x4 animation-row needs.

The prompt should be generated from that exploration. Do not prompt only from
`builder`, `worker`, `hauler`, or `messenger`, because that produces same-body
role variants instead of a watchable cast.

See the companion exploration doc for the first proposed cast:

- Mara Boltwick, human bridge carpenter builder;
- Kettle-37, assay-kettle machinefolk worker;
- Oona Tallpack, alien freight-runner hauler;
- Vell Quill, paper-and-light courier messenger.

## Sprite Prompt Template

Use this only for quick baseline drafting. For production character generation,
prefer the origin-story prompt assembly in
`agent-town-frontier-agentfolk-character-exploration.md`.

Replace `{ROLE}` and `{ROLE_DETAILS}`.

```text
Use case: illustration-story
Asset type: 2D game sprite sheet for Agent Town Founders Plot frontier agentfolk

Primary request:
Create a production-style {ROLE} inhabitant sprite sheet for Agent Town. This is an adult compact frontier agentfolk character, not a child, not a plush mascot, not a toy. The character should belong in a wild west frontier town where humans and AI agents build a shared future together.

Story/world:
Agent Town sits at the frontier between old humanity and new AI agent collaboration. The town includes wagons, timber, dust, hand tools, campfires, plan wagons, helpful AI companions, small glowing interfaces, and human-agent teamwork.

Subject:
{ROLE_DETAILS}

Style:
Warm frontier storybook game art, polished 2D sprite art, soft painterly edges, clear ink-like silhouette, earthy ochre, timber brown, worn denim, brass, cream, dusty teal, and tiny luminous AI accents. Match the clean no-hole Clover v1_4_4 / Agent Town feeling without copying Clover. Readable at small gameplay scale.

Layout:
Exact 4 columns by 4 rows, 16 animation frames total. No labels, no numbers, no text, no watermark, no UI, no grid lines. Same centered character scale and consistent feet position. Generous padding in every cell.

Rows:
Row 1 idle frames.
Row 2 walk/trot frames.
Row 3 role work-action frames.
Row 4 ready/celebrate/attention frames.

Camera/framing:
Orthographic 2D sprite art, front three-quarter view, centered in each cell.

Chroma key:
Use a perfectly flat solid #ff00ff background behind all frames for local transparency removal. The background must have no shadows, gradients, texture, floor plane, reflections, or lighting variation. Do not use #ff00ff anywhere in the character, props, outlines, highlights, or antialiasing if avoidable.

Avoid:
Childlike proportions, baby face, toddler body, plush toy mascot, giant head with tiny infant body, schoolkid outfit, toy hammer, generic robot chrome, combat pose, weapons, logos, text, watermark.
```
