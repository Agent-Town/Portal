---
assetId: hero_sheriff_lobster_v1_4_2
assetGroup: platform_normalization
model: reference-normalized
generationMode: reference_conversion
promptVersion: v1.4.2
referenceInputs:
  - docs/brand/reference/hero-cast/sheriff-lobster-source.jpeg
outputTargets:
  - public/assets/hero-cast/sheriff-lobster.webp
requiresPostProcessing: true
humanArtOwner: Robin / design owner
status: approved
---
## Intent

Normalize the recovered Sheriff Lobster reference into a production WebP.

## Positive prompt

Preserve the approved source identity while making the output web-ready and route-safe.

## Negative prompt

Preserve the supplied source identity. Do not invent text, extra props, or new characters.

## Output requirements

Output must be stable, deterministic, and ready for route integration.

## Post-processing notes

Use only normalization, cleanup, compression, or scripted supportive SVG work. Do not invent a new visual identity.

## Acceptance checks

The resulting production asset must remain faithful to the approved source and support future rebuilds.
