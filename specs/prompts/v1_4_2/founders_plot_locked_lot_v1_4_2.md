---
assetId: founders_plot_locked_lot_v1_4_2
assetGroup: platform_normalization
model: codex-svg
generationMode: scripted-svg
promptVersion: v1.4.2
referenceInputs:
  - docs/brand/reference/platform/agenttown-visual-reference.jpeg
outputTargets:
  - public/experiences/founders-plot/assets/objects/locked-lot.svg
requiresPostProcessing: true
humanArtOwner: Robin / design owner
status: approved
---
## Intent

Create the locked-lot fallback as a scripted supportive asset.

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
