# Founders Plot 2D Asset Pipeline

Status: implementation note
Branch: `codex/founders-plot-threejs-playable-slice`
Date: 2026-05-24

## Intent

Founders Plot should be able to accept generated or externally supplied 2D assets without bespoke one-off cleanup. The near-term renderer is Three.js, but most game-world content still enters as billboard sprites or textured planes. This pipeline keeps that asset path explicit and testable.

## Asset Lanes

### Generated Sprite Sheet

Use this for character states, small prop sets, and related visual variants.

1. Generate a sprite sheet on a flat chroma-key background.
2. Store the untouched generated sheet under `public/experiences/founders-plot/assets/candidates/<version>/...`.
3. Normalize with `scripts/normalize_founders_plot_sprite_sheet.mjs`.
4. Store alpha PNG sources and optimized WebP runtime assets under `public/experiences/founders-plot/assets/<kind>/<version>/...`.
5. Add manifest entries with prompt, source sheet, hashes, dimensions, byte sizes, anchor, hitbox, and approval metadata.
6. Point scene-state mappings at the manifest asset IDs.

### External 2D Import

Use this for partner art, purchased packs, or hand-authored sprites.

1. Place the source under `assets/candidates/<version>/external/...`.
2. Record source/license notes in the manifest entry and prompt/provenance file.
3. If the source already has clean alpha, run the normalizer with `--grid 1x1 --png-only` only if resizing/metadata is needed.
4. If the source has a flat background, run the normalizer with the source key color and fuzz tuned against a gray-background QA sheet.
5. Do not wire external art into scene-state until manifest metadata and validation pass.

### Ambient World Prop

Use this for non-critical props that make the Three.js world feel inhabited without changing gameplay logic.

1. Register the prop asset with `role: founders_plot_world_prop`, `kind: founders_plot_world_prop`, `layerRole: world-prop`, and `stateDriven: false`.
2. Add a top-level `worldProps` entry that maps `propId` to the manifest `assetId`, label, normalized scene coordinates, z hint, and display scale.
3. Reference the same `assetId` from `WORLD_PROPS` in `public/experiences/founders-plot/scene_state.js`.
4. Run `node scripts/validate_founders_plot_assets.mjs`; it fails on duplicate asset IDs, missing prop files, invalid prop coordinates, and `_prop_` scene references that are absent from `worldProps`.

Current prop example:

`founders_plot_supply_crates_prop_v1_4_4` renders ambient supply crates in the Three.js scene as a pipeline sample.

## Current Clover V2 Slice

The Clover V2 sheet source is:

`public/experiences/founders-plot/assets/candidates/v1_4_4/characters/clover-v2-sheet-magenta.png`

Runtime assets are:

`public/experiences/founders-plot/assets/characters/v1_4_4/clover-*.webp`

The normalizer writes a sidecar report:

`public/experiences/founders-plot/assets/characters/v1_4_4/clover-sprite-sheet-normalized.json`

## Acceptance Checks

- The normalized PNG/WebP files have alpha channels.
- Corners are transparent after normalization.
- Sprite dimensions match the target size.
- Manifest paths and source hashes match checked-in files.
- Ambient prop manifest entries are listed in `worldProps` and referenced from scene state only through registered asset IDs.
- Playwright can still find Clover by `CLOVER` object identity in the Three.js scene.
- Playwright can find the registered ambient prop in Three.js scene coverage.
- The rendered sprite has no obvious interior alpha holes or broken silhouette.

## Three.js Contract

The current Three.js renderer consumes `assetMap[assetId].src` as a sprite texture. Future GLB/GLTF assets can be added later, but 2D imports should remain valid for:

- billboard characters;
- building/prop sprites;
- marker planes;
- UI-adjacent world objects;
- scene preview placeholders before a full 3D model exists.
