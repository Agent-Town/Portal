# Oona Tallpack Hauler Sprite Prompt

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
This character visualizes Founders Plot hauler facts: OUTPUT_READY and collectable building output. In-game she appears when a building has output ready to collect, showing that real server-side production has finished. She is a visual-only receipt of ready output, not an autonomous actor and not a gameplay mutator.

Origin story:
Oona Tallpack came with the Dust Comet caravan, a strange freight family that crossed the dry flats by following broken satellite lights. She is not from the old human towns and not from the new agent networks, but she understands load, promise, and delivery better than either. She hauled the first timber bundles that made the rescued AI agent's plan wagon livable. Oona is a long-limbed alien freight-runner with a calm smile, four working arms, and a rope harness full of tiny knots that each record a completed delivery. She believes every bundle has a destination and every destination has a story. She joined Agent Town because the place looked impossible, and impossible places always need someone who can carry one more thing.

Subject:
Oona Tallpack, an adult alien frontier freight-runner from the Dust Comet caravan. She is tall but compact at gameplay scale, with four practical arms, a calm expressive adult face, sturdy boots, dusty teal canvas coat, rope harness, and a timber bundle or small hover-cart handle. Her harness has tiny knot charms for completed deliveries and a luminous green weight gauge. She carries real weight with a slight comic wobble, warm and trustworthy, not childlike.

Visual contrast:
This character must be visibly different from Mara, Kettle-37, Vell, and from the previous generated inhabitant sheets. Emphasize alien long-limbed body shape, four practical arms, rope-and-canvas material language, load-bearing prop silhouette, side-to-side balancing movement style, and dusty teal plus rope tan plus small green weight-gauge color anchor. Do not make this a human in a vest, a kettle machine, a paper courier, a recolor of Clover, or a generic fantasy alien.

Style:
Warm frontier storybook game art, polished 2D sprite art, soft painterly edges, clear readable silhouette, earthy frontier palette with one or two small luminous AI accents. Match the clean edge quality and polish of the no-hole Clover v1_4_4 references without copying Clover's silhouette. Readable at small gameplay scale. Not photorealistic, not hard cyberpunk.

Sprite sheet:
Exact 4 columns by 4 rows, 16 animation frames total. No labels, no numbers, no readable text, no watermark, no UI, no grid lines. Same centered character scale and consistent feet position within each row. Generous padding in every cell. Orthographic 2D sprite art, front three-quarter view.

Rows:
Row 1: idle frames - Oona shifts weight under the pack, checks the rope knots, calm smile, small green weight gauge glows.
Row 2: walk/trot frames - long-limbed carrying steps with visible weight and a gentle side-to-side balancing motion; four arms stabilize the bundle.
Row 3: role action frames - lifts, braces, balances timber bundle or hover-cart handle, adjusts harness knots, secures ready output.
Row 4: ready/attention frames - sets bundle down, points toward collectable output, proud delivery nod, bundle clearly ready for pickup.

Chroma key:
Use a perfectly flat solid #ff00ff background behind all frames for local transparency removal. No shadows, gradients, floor plane, reflections, texture, or lighting variation in the background. Avoid #ff00ff anywhere in the character, props, outlines, highlights, or antialiasing if possible.

Hard avoid:
Childlike proportions, baby face, toddler body, plush mascot body, giant head with infant body, schoolkid outfit, toy props, generic chrome robot, combat pose, weapons, logos, readable text, watermark, cropped body parts, props crossing cell boundaries, checkerboard background, alpha holes, missing interior pixels.
```
