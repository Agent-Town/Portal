---
assetId: townhall_onboarding_illustration_v1_4_2
assetGroup: platform_identity
model: gpt-image-2
generationMode: codex_builtin
promptVersion: v1.4.2
referenceInputs:
  - docs/brand/reference/platform/agenttown-visual-reference.jpeg
  - public/assets/candidates/v1_4_2/platform/townhall-onboarding-illustration-c01.png
outputTargets:
  - public/assets/platform/townhall-onboarding-illustration-v1_4_2.webp
requiresPostProcessing: true
humanArtOwner: Robin / design owner
status: approved
---
## Intent

Create the Town Hall onboarding illustration for the Agent Town platform surface.

## Positive prompt

Create Town Hall onboarding illustration for Agent Town. Warm frontier storybook soft-3D collectible style, brand-safe, polished, no UI labels, no watermark, readable at web scale.

## Negative prompt

Use the global negative prompt.

## Output requirements

Use the supplied candidate as the approved source for production compression and route integration.

## Post-processing notes

Promote the approved candidate into the production path with WebP compression and no frame extraction.

## Acceptance checks

Town Hall onboarding illustration must look intentional on the live route and match the V1.4.2 platform direction.
