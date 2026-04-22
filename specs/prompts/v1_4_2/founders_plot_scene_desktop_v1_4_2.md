---
assetId: founders_plot_scene_desktop_v1_4_2
assetGroup: founders_plot_scene
model: gpt-image-2
generationMode: codex_builtin
promptVersion: v1.4.2
referenceInputs:
  - docs/brand/reference/platform/agenttown-visual-reference.jpeg
  - public/experiences/founders-plot/assets/candidates/v1_4_2/scenes/founders-plot-desktop-candidate-c01.png
outputTargets:
  - public/experiences/founders-plot/assets/scenes/founders-plot-desktop.webp
requiresPostProcessing: true
humanArtOwner: Robin / design owner
status: approved
---
## Intent

Rebuild the default Founders Plot desktop background as a launch-grade game stage.

## Positive prompt

Create a launch-grade hero background for Agent Town: Founders Plot. Slightly elevated three-quarter view. HQ cabin, six buildable plot zones, a contract board, a public square marker, a foreman workspace, readable dirt paths, river and mesas in the distance. Warm frontier storybook soft-3D collectible style. No UI panels, no labels, no characters.

## Negative prompt

Use the global negative prompt.

## Output requirements

Landscape 1536x1024 or better. Must hold up behind DOM-driven world objects.

## Post-processing notes

Compress to production WebP without changing composition. Use directly as the desktop stage backdrop.

## Acceptance checks

Desktop Founders Plot should read as a real game stage within five seconds and leave room for overlaid world objects.
