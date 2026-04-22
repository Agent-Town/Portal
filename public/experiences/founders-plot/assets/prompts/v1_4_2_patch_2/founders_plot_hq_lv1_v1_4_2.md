---
assetId: founders_plot_hq_lv1_v1_4_2
assetGroup: founders_plot_buildings
model: gpt-image-2
generationMode: codex_patch2_composite
promptVersion: v1.4.2
referenceInputs:
  - docs/brand/reference/platform/agenttown-visual-reference.jpeg
  - public/experiences/founders-plot/assets/candidates/v1_4_2/buildings/building-pack-sheet-c01.png
  - specs/prompts/v1_4_2_patch_2/hq_progression_l1_l3_l5.md
outputTargets:
  - public/experiences/founders-plot/assets/buildings/hq-lv1.webp
requiresPostProcessing: true
humanArtOwner: Robin / design owner
status: approved
---
## Intent

Create the humble claim-cabin headquarters milestone for the Patch 2 mobile/HQ acceptance pass.

## Positive prompt

Warm frontier storybook civic-builder HQ, humble claim cabin, small footprint, simple porch, rough timber and canvas details, modest sign and crate, low compact roofline, readable at gameplay scale, no text.

## Negative prompt

Use the global negative prompt.

## Output requirements

Standalone gameplay object at roughly 512x512. Must remain clearly distinct from HQ levels 1, 3, and 5 at gameplay scale.

## Post-processing notes

Use the approved V1.4.2 HQ base crop and compose the Patch 2 ladder with deterministic Codex-authored civic additions. Mirror this prompt into the public asset prompt folder.

## Acceptance checks

Pass unique file hash checks, browser-canvas visual delta checks, and the gameplay-scale gallery screenshot review without relying on labels.
