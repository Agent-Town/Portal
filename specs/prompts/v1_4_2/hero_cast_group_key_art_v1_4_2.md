---
assetId: hero_cast_group_key_art_v1_4_2
assetGroup: platform_identity
model: gpt-image-2
generationMode: codex_builtin
promptVersion: v1.4.2
referenceInputs:
  - docs/brand/reference/hero-cast/prairie-dog-ranger-source.png
  - docs/brand/reference/hero-cast/sheriff-lobster-source.jpeg
  - docs/brand/reference/hero-cast/chibi-homesteader-girl-source.png
  - docs/brand/reference/hero-cast/wizard-kid-source.png
  - public/assets/candidates/v1_4_2/hero-cast/hero-cast-group-c01.png
outputTargets:
  - public/assets/hero-cast/hero-cast-group.webp
requiresPostProcessing: true
humanArtOwner: Robin / design owner
status: approved
---
## Intent

Create the Hero cast group key art for the Agent Town platform surface.

## Positive prompt

Create Hero cast group key art for Agent Town. Warm frontier storybook soft-3D collectible style, brand-safe, polished, no UI labels, no watermark, readable at web scale.

## Negative prompt

Use the global negative prompt.

## Output requirements

Use the supplied candidate as the approved source for production compression and route integration.

## Post-processing notes

Promote the approved candidate into the production path with WebP compression and no frame extraction.

## Acceptance checks

Hero cast group key art must look intentional on the live route and match the V1.4.2 platform direction.
