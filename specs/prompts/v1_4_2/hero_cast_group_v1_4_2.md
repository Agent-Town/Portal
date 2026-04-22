---
assetId: hero_cast_group_key_art_v1_4_2
assetGroup: hero_cast_platform
model: gpt-image-2
generationMode: codex_builtin_or_api
promptVersion: v1.4.2
referenceInputs:
  - docs/brand/reference/hero-cast/prairie-dog-ranger-source.png
  - docs/brand/reference/hero-cast/sheriff-lobster-source.jpeg
  - docs/brand/reference/hero-cast/chibi-homesteader-girl-source.png
  - docs/brand/reference/hero-cast/wizard-kid-source.png
outputTargets:
  - public/assets/hero-cast/hero-cast-group.webp
requiresPostProcessing: true
humanArtOwner: TBD
status: draft
---

## Intent

Create platform key art using the recovered hero cast without adding them to Founders Plot gameplay.

## Positive prompt

Create platform key art for Agent Town featuring the recovered hero cast as an ensemble: Prairie Dog Ranger, Sheriff Lobster, Chibi Homesteader Girl, and Wizard Kid. They stand together as friendly explorers of Agent Town, with a warm frontier settlement in the background. The image should feel like brand/marketing art, not default gameplay UI. Preserve each character's identity while unifying rendering, lighting, scale, and material style. Warm frontier storybook / soft-3D collectible style. No readable text or logo.

## Negative prompt

Use the global negative prompt. Do not place the hero cast in the default Founders Plot gameplay stage.

## Acceptance checks

Hero-cast assets are only used in platform/marketing/onboarding contexts.
