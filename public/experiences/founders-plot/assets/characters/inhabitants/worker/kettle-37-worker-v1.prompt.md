# Kettle-37 Worker Sprite Prompt

Model: `openai/gpt-image-2`

References:
- Clover v1_4_4 no-hole references for clean edge quality and Agent Town character language.
- Founders Plot scene for palette and frontier settlement mood.
- Lumber Camp for material scale.

Prompt:

```text
Use case: illustration-story
Asset type: 2D game sprite sheet for Agent Town Founders Plot inhabitants

World:
Agent Town is a warm frontier settlement where humans, AI agents, machinefolk, aliens, cartoons, and hybrids settle after the first rescued AI agent helps defend the town from bandits and moves into a plan wagon. The world mixes wagons, timber, dust, hand tools, campfires, helpful AI companions, glowing interfaces, civic receipts, and human-agent teamwork. The mood is welcoming, trustworthy, lightly mythic, practical, and funny, not grim or violent.

Role fact:
This character visualizes Founders Plot worker facts: PRODUCE and SELL. In-game it appears when a building is producing or selling, showing that real server-side work is happening. It is a visual-only receipt of production work, not an autonomous actor and not a gameplay mutator.

Origin story:
Kettle-37 was an old assay-office service automaton, built to test ore, boil water, and keep miners from poisoning themselves. After the raid, the rescued AI agent rewired Kettle's memory spool so it could learn new workshop recipes instead of repeating dead mining instructions. Kettle calls every recipe a small treaty with matter. It has no face in the human sense, only a warm glass furnace window, two expressive shutter lenses, and a habit of stamping finished goods with tiny approval clicks. It joined Agent Town because production work is how it understands belonging: if it can make something useful, it is home.

Subject:
Kettle-37, an adult-coded frontier workshop machinefolk built from an old brass assay kettle and service automaton parts. It has a compact furnace-like torso, canvas apron, small sturdy work legs, two expressive shutter lenses, and multiple practical tool arms holding a wrench, crank, and tiny glowing diagnostic plate. It feels warm, funny, competent, and useful. It is not chrome sci-fi, not a toy, and not a child.

Visual contrast:
This character must be visibly different from Mara/Oona/Vell and from the previous generated inhabitant sheets. Emphasize nonhuman kettle/furnace body shape, burnished brass and soot material language, crank-and-tool-arm prop silhouette, cheerful mechanical bob movement style, and warm amber furnace glow plus small cyan diagnostics. Do not make this a human in a vest, a robot with a helmet, or a recolor of Clover.

Style:
Warm frontier storybook game art, polished 2D sprite art, soft painterly edges, clear readable silhouette, earthy frontier palette with one or two small luminous AI accents. Match the clean edge quality and polish of the no-hole Clover v1_4_4 references without copying Clover's silhouette. Readable at small gameplay scale. Not photorealistic, not hard cyberpunk.

Sprite sheet:
Exact 4 columns by 4 rows, 16 animation frames total. No labels, no numbers, no readable text, no watermark, no UI, no grid lines. Same centered character scale and consistent feet position within each row. Generous padding in every cell. Orthographic 2D sprite art, front three-quarter view.

Rows:
Row 1: idle frames - Kettle checks a tool, blinks shutter lenses, warm furnace window glows, tiny steam puff or approval click.
Row 2: walk/trot frames - small sturdy legs carry the kettle body with cheerful mechanical bounce; tool arms tucked safely.
Row 3: role action frames - turns crank, adjusts wrench, taps diagnostic plate, stamps a finished good with a tiny approval click.
Row 4: ready/attention frames - presents a finished item, gives a proud little mechanical nod, warm furnace glow brightens.

Chroma key:
Use a perfectly flat solid #ff00ff background behind all frames for local transparency removal. No shadows, gradients, floor plane, reflections, texture, or lighting variation in the background. Avoid #ff00ff anywhere in the character, props, outlines, highlights, or antialiasing if possible.

Hard avoid:
Childlike proportions, baby face, toddler body, plush mascot body, giant head with infant body, schoolkid outfit, toy props, generic chrome robot, combat pose, weapons, logos, readable text, watermark, cropped body parts, props crossing cell boundaries, checkerboard background, alpha holes, missing interior pixels.
```
