---
assetId: founders_plot_building_pack_v1_4_2
assetGroup: founders_plot_buildings
model: gpt-image-2
generationMode: codex_builtin_or_api
promptVersion: v1.4.2
referenceInputs:
  - docs/brand/reference/platform/agenttown-visual-reference.jpeg
outputTargets:
  - public/experiences/founders-plot/assets/buildings/*.webp
requiresPostProcessing: true
humanArtOwner: TBD
status: draft
---

## Intent

Create a coherent pack of P0 Founders Plot buildings and civic objects.

## Positive prompt

Create a coherent asset pack of small frontier town-building objects for Agent Town: HQ cabin, Lumber Camp, Farm Plot, Quarry, Workshop, Market Stall, Contract Board, Public Square with Welcome Sign, Foreman Hut, Town Journal stand, Approval Inbox/Town Bell, Empty Buildable Lot, Locked Future Lot. Each object must have a clear readable silhouette, consistent camera angle, consistent lighting, and enough charm to feel collectible. Warm frontier storybook soft-3D game asset style, clean neutral background for later cutout, no text, no labels, no logos, no characters, no clutter.

## Negative prompt

Use the global negative prompt.

## Output requirements

Generate either a contact sheet for candidate selection or individual assets using the individual building template.

## Acceptance checks

All buildings look like one asset family and are readable at game size.
