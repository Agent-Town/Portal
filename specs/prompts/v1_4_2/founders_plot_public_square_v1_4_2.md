---
assetId: founders_plot_public_square_v1_4_2
assetGroup: founders_plot_civic_objects
model: gpt-image-2
generationMode: codex_builtin
promptVersion: v1.4.2
referenceInputs:
  - docs/brand/reference/platform/agenttown-visual-reference.jpeg
  - public/experiences/founders-plot/assets/candidates/v1_4_2/objects/civic-pack-sheet-c01.png
outputTargets:
  - public/experiences/founders-plot/assets/objects/public-square.webp
requiresPostProcessing: true
humanArtOwner: Robin / design owner
status: approved
---
## Intent

Create the Public Square Welcome Sign as a reusable Founders Plot civic object.

## Positive prompt

Create a standalone Public Square Welcome Sign for Agent Town, warm frontier storybook soft-3D collectible style, clean neutral background for cutout, readable at game size, no text, no characters.

## Negative prompt

Use the global negative prompt.

## Output requirements

Single object crop at roughly 512x512. Must work as a world-space interactive object.

## Post-processing notes

Extract the matching cell from civic-pack-sheet-c01, remove the light cream background, and compress to WebP.

## Acceptance checks

Public Square Welcome Sign must be identifiable at a glance and not require labels to understand the click target.
