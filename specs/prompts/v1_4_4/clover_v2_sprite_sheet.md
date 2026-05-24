---
assetId: clover_v2_sprite_sheet
assetGroup: founders_plot_character
model: gpt-image-2
generationMode: codex_builtin
promptVersion: v1.4.4
referenceInputs:
  - public/experiences/founders-plot/assets/characters/clover-idle.webp
outputTargets:
  - public/experiences/founders-plot/assets/candidates/v1_4_4/characters/clover-v2-sheet-magenta.png
  - public/experiences/founders-plot/assets/characters/v1_4_4/clover-idle.webp
  - public/experiences/founders-plot/assets/characters/v1_4_4/clover-observing.webp
  - public/experiences/founders-plot/assets/characters/v1_4_4/clover-thinking.webp
  - public/experiences/founders-plot/assets/characters/v1_4_4/clover-acting.webp
  - public/experiences/founders-plot/assets/characters/v1_4_4/clover-waiting-approval.webp
  - public/experiences/founders-plot/assets/characters/v1_4_4/clover-celebrating.webp
  - public/experiences/founders-plot/assets/characters/v1_4_4/clover-paused.webp
  - public/experiences/founders-plot/assets/characters/v1_4_4/clover-blocked.webp
  - public/experiences/founders-plot/assets/characters/v1_4_4/clover-restart-needed.webp
requiresPostProcessing: true
status: implementation
---

# Clover V2 Sprite Sheet Prompt

Use case: stylized-concept

Asset type: 2D game sprite sheet for Three.js billboard characters in a browser town-builder game.

Primary request: Create a clean replacement sprite sheet for Clover, the friendly AI Foreman for Agent Town: Founders Plot, fixing alpha-hole/cutout issues in the current sprite.

Reference identity: keep Clover as a warm, practical frontier guide: friendly young woman, brown hair, expressive face, work vest over cream shirt, teal neckerchief/accent, leather belt/tools or small satchel, sturdy boots, trustworthy helper silhouette. Similar overall identity to the existing Clover sprite, but cleaned up and more readable at small size.

Scene/backdrop: perfectly flat solid `#ff00ff` chroma-key background only. The background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.

Composition: 3x3 sprite sheet, nine separate full-body poses, each centered in its cell with generous padding and the full silhouette visible from head to boots. Use consistent character proportions, outfit, face, hair color, and lighting in every cell.

States left-to-right, top-to-bottom: idle, observing, thinking, acting, waiting approval, celebrating, paused, blocked, restart needed.

Style: warm non-pixel illustrated frontier town-builder character art, three-quarter view, readable silhouette, polished game asset, soft painterly rendering, no photorealism.

Output requirements: square image, crisp edges, no text, no labels, no logos, no watermark, no extra characters. Keep all magenta strictly in the background and out of the character. No cast shadow, no contact shadow, no transparent-looking holes, no checkerboard background, no interior missing pixels in hair, clothing, hands, legs, or props.

Negative prompt: no pixel art, no cyberpunk, no grim western, no weapons, no readable signs, no brand marks, no copyrighted characters, no props crossing cell boundaries, no cropped body parts, no white/gray checkerboard, no semi-transparent gaps inside the body.

## Post-Processing

Normalize with:

```bash
node scripts/normalize_founders_plot_sprite_sheet.mjs \
  --input public/experiences/founders-plot/assets/candidates/v1_4_4/characters/clover-v2-sheet-magenta.png \
  --out-dir public/experiences/founders-plot/assets/characters/v1_4_4 \
  --prefix clover \
  --grid 3x3 \
  --states idle,observing,thinking,acting,waiting-approval,celebrating,paused,blocked,restart-needed \
  --key '#ff00ff' \
  --fuzz 45% \
  --size 512 \
  --quality 92
```
