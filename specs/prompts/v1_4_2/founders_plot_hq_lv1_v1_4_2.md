---
assetId: founders_plot_hq_lv1_v1_4_2
assetGroup: founders_plot_buildings
model: gpt-image-2
generationMode: codex_builtin
promptVersion: v1.4.2
referenceInputs:
  - docs/brand/reference/platform/agenttown-visual-reference.jpeg
  - public/experiences/founders-plot/assets/candidates/v1_4_2/buildings/building-pack-sheet-c01.png
outputTargets:
  - public/experiences/founders-plot/assets/buildings/hq-lv1.webp
requiresPostProcessing: true
humanArtOwner: Robin / design owner
status: approved
---
## Intent

Create the HQ cabin as a reusable standalone Founders Plot object.

## Positive prompt

Create a standalone HQ cabin for Agent Town, warm frontier storybook soft-3D collectible style, clean neutral background for cutout, readable silhouette, no text, no characters.

## Negative prompt

Use the global negative prompt.

## Output requirements

Single object crop at roughly 512x512. Must read cleanly at small game size.

## Post-processing notes

Extract the matching cell from building-pack-sheet-c01, remove the light cream background, and compress to WebP.

## Acceptance checks

HQ cabin must sit cleanly on the Founders Plot stage and read immediately as a clickable world object.
