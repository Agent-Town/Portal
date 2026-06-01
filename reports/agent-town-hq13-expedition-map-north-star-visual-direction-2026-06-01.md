# Agent Town HQ13 Expedition Map North-Star Visual Direction

Date: 2026-06-01
Model: `openai/gpt-image-2`
Verdict: USE_CANDIDATE_02_AS_PRIMARY_RUNTIME_DIRECTION.

## Scope

Generated four GPT Image 2 concept candidates for the next Expedition Map visual target, using the prior north-star image for quality/composition and the current HQ12/HQ13 map proof only for game-state structure.

These images are visual targets only. They are not runtime assets yet, do not create gameplay truth, and do not change server authority.

## Artifacts

- Candidate 01: `reports/agent-town-hq13-expedition-map-north-star-visual-direction-01-2026-06-01.png`
- Candidate 02: `reports/agent-town-hq13-expedition-map-north-star-visual-direction-02-2026-06-01.png`
- Candidate 03: `reports/agent-town-hq13-expedition-map-north-star-visual-direction-03-2026-06-01.png`
- Candidate 04: `reports/agent-town-hq13-expedition-map-north-star-visual-direction-04-2026-06-01.png`
- Contact sheet: `reports/agent-town-hq13-expedition-map-north-star-visual-direction-contact-sheet-2026-06-01.png`
- Prompt record: `reports/agent-town-hq13-expedition-map-north-star-visual-direction-prompt-2026-06-01.md`

Original generated media also exists under `/Users/robin/.openclaw/media/tool-image-generation/`.

## Assessment

Candidate 02 is the strongest runtime direction. It best balances:

- readable isometric map structure;
- clear fog-of-war frontier;
- obvious expedition-route language;
- recognizable node states;
- premium illustrated terrain;
- UI that feels game-like without fully covering the world.

Candidate 04 is a good secondary reference for lighter HUD placement and atmospheric depth.

Candidate 01 is visually rich but too cluttered; town, markers, and UI compete. The bottom/right UI is too card-heavy.

Candidate 03 is beautiful, but its fog borders skew too magical/cinematic and may hurt strategic readability.

## Concrete Asset Extraction Targets

Use candidate 02 as the main guide for a packable asset pipeline:

- Isometric terrain kit: forest clusters, rivers, cliffs, waterfalls, stone roads, bridges, farms, ruins, crystal/resource deposits.
- Settlement kit: teal/gold roof houses, central civic tower/obelisk, tents, outposts, work sites, plaza tiles.
- Fog-of-war system: grey desaturated hidden regions, soft cloud overlays, dotted frontier borders.
- Expedition route language: glowing dotted path, circular checkpoints, active node highlight.
- Map pins: compass/star pins, resource pins, question-mark unknown pins, lock pins, and discovered/known/hinted/hidden variants.
- Character tokens: small human/agent party markers walking along a route.
- HUD pieces: parchment panels, resource bar frame, minimap frame, avatar chips with role badges, compact expedition inventory/action tray.

## Current Implementation Gap

The HQ13B implementation is a meaningful step up from HQ12: richer terrain textures, fog veils, survey strokes, pins, and larger framing.

It is still much more functional/procedural than the concept target. The main remaining gap is real art extraction: terrain tiles, fog overlays, marker sprites, HUD frames, route strokes, and location-scene art should become explicit visual-pack assets rather than generated canvas decoration.

## Guardrails

- No runtime asset integration from these concepts yet.
- No new server mutation path.
- No client-fabricated map truth.
- No Atlas execution.
- No public sharing.
- No Generated Universe real rendering.
- No autonomous movement, route/trade/economy/resource-harvesting/combat/scheduler behavior.
- No Wild West/cowboy/saloon/gold-rush drift observed in the generated concepts.
