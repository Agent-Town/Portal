---
assetId: founders_plot_scene_mobile_v1_4_2
assetGroup: founders_plot_scene
model: gpt-image-2
generationMode: codex_builtin
promptVersion: v1.4.2
referenceInputs:
  - docs/brand/reference/platform/agenttown-visual-reference.jpeg
  - public/experiences/founders-plot/assets/candidates/v1_4_2/scenes/founders-plot-mobile-candidate-c01.png
outputTargets:
  - public/experiences/founders-plot/assets/scenes/founders-plot-mobile.webp
requiresPostProcessing: true
humanArtOwner: Robin / design owner
status: approved
---
## Intent

Create a mobile-first Founders Plot stage that is calm and readable.

## Positive prompt

Create a portrait Founders Plot stage for Agent Town with HQ cabin, contract board, public square marker, foreman workspace, and visible buildable ground areas. Warm frontier storybook soft-3D style, mobile-first readability, no characters, no labels, no UI panels, no clutter.

## Negative prompt

Use the global negative prompt.

## Output requirements

Portrait 1024x1536 or better. Must remain readable at 390px width behind DOM overlays.

## Post-processing notes

Compress to production WebP without adding typography or graphic overlays.

## Acceptance checks

The 390px Founders Plot route should still read as a game surface instead of a text-heavy web panel.
