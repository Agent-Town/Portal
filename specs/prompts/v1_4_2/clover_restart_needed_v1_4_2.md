---
assetId: clover_restart_needed_v1_4_2
assetGroup: founders_plot_clover
model: gpt-image-2
generationMode: codex_builtin
promptVersion: v1.4.2
referenceInputs:
  - docs/brand/reference/platform/agenttown-visual-reference.jpeg
  - public/experiences/founders-plot/assets/candidates/v1_4_2/characters/clover-paused-blocked-sheet-c01.png
outputTargets:
  - public/experiences/founders-plot/assets/characters/clover-restart-needed.webp
requiresPostProcessing: true
humanArtOwner: Robin / design owner
status: approved
---
## Intent

Create Clover restart needed as a reusable Clover pose for the Founders Plot stage.

## Positive prompt

Create Clover Kincaid, the trusted AI Foreman of Agent Town. Warm, practical, intelligent, frontier-marshal inspired without militarism, readable silhouette, soft-3D collectible storybook style, clean neutral background for cutout, no text, no logo.

## Negative prompt

Use the global negative prompt.

## Output requirements

Single pose crop at roughly 512x512 with full body readable at small UI size.

## Post-processing notes

Extract the correct pose cell from the Clover source sheet, remove the cream background, and compress to WebP.

## Acceptance checks

Clover must stay consistent across states and remain clearly readable when placed on the stage.
