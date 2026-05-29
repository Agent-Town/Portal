# Agent Town Global Icons v1

Generated with built-in GPT Image 2 for Agent Town UI icons.

Runtime source of truth:
- Server registry: `server/agent_town_icons.js`
- Browser registry: `public/agent-town-icons.js`
- Public asset path: `/assets/icons/agent-town/`

Generated icons:
- `hq-command-gpt-image-2-v1.png`
- `lumber-camp-gpt-image-2-v1.png`
- `wood-resource-gpt-image-2-v1.png`
- `farm-plot-gpt-image-2-v1.png`
- `food-resource-gpt-image-2-v1.png`
- `hq-upgrade-gpt-image-2-v1.png`
- `quarry-gpt-image-2-v1.png`
- `stone-resource-gpt-image-2-v1.png`
- `foreman-queue-gpt-image-2-v1.png`

Prompt:

```text
Use case: game UI asset kit.
Asset type: Agent Town Progression Atlas icon sprite sheet for a browser game UI.
Primary request: Create a square 3x3 grid of polished, readable fantasy frontier city-builder progression icons, no text, no letters, no numbers. Each cell contains one centered icon with generous padding and consistent scale. Style: warm hand-painted game UI icons, compact readable silhouettes, premium cozy frontier/settlement strategy game, subtle brass/wood/stone material language, crisp edges for downscaling to 48px.
Icons in reading order left to right, top to bottom:
1. Headquarters: small frontier town hall / command cabin with banner.
2. Lumber Camp: saw frame, timber stack, axe, frontier worksite.
3. Wood resource: bundled logs with bark rings.
4. Farm Plot: tilled rows with sprouts and small fence.
5. Food resource: crate with grain, vegetables, and bread.
6. HQ upgrade: town hall blueprint with upward arrow motif, no text.
7. Quarry: rock ridge with pickaxe and cut stone.
8. Stone resource: stacked stone blocks and ore flecks.
9. Foreman queue / planning: clipboard map with clock/gear tokens, no text.
Background: perfectly flat solid #ff00ff chroma-key in the gutters and behind icons for background removal. No shadows cast onto the background, no gradients in the background, no text, no watermark. Make the 3x3 grid layout clear and evenly spaced so the image can be cropped into nine equal square cells.
```

Post-processing:
- Cropped into a 3x3 grid from the generated 1254x1254 PNG.
- Removed the `#ff00ff` chroma-key background with ImageMagick transparency because the local Pillow helper was unavailable.
- Resized final icons to 256x256 PNG with alpha.
