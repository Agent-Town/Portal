# Founders Plot V1.3 Asset Pack

This directory contains the scenic and object assets for the Agent Town: Founders Plot V1.3 visual game surface.

## Contents

- `asset-manifest.json`
  - Canonical manifest with provenance, dimensions, budget metadata, and review state.
- `manifest.json`
  - Compatibility copy of the canonical manifest for tooling that expects the shorter path.
- `prompts/`
  - Style lock and prompt summaries for the generated-style asset set.
- `scenes/`
  - Stage backgrounds for desktop and mobile.
- `buildings/`
  - HQ/building sprites.
- `objects/`
  - Contract board, public square, foreman hut, and lot sprites.
- `props/`
  - Non-critical ambient world props registered through `worldProps`.
- `characters/`
  - Clover state sprites.
- `overlays/`
  - SVG overlays and badges.

## Provenance

The V1.3 pack was produced inside the repo from deterministic vector masters using:

- prompt summaries stored under `prompts/`;
- a scripted raster pipeline in `scripts/generate_founders_plot_assets.mjs`;
- `sips` for SVG to PNG rasterization;
- `cwebp` for final `.webp` optimization.

Every shipped asset is listed in the manifest with prompt reference, license, review status, optimization state, provenance fields, and approval scope.

V1.4.1 note:

- the gameplay asset pack remains Clover-first and plot-first;
- recovered hero-cast references live under `docs/brand/reference/hero-cast/`;
- the hero video is recorded as a tone/motion/story reference only;
- no video stills are extracted or committed in this asset pack.

## Rebuild and validation

- Generate: `node scripts/generate_founders_plot_assets.mjs`
- Validate: `node scripts/validate_founders_plot_assets.mjs`

## 2D import and sprite-sheet normalization

Use `scripts/normalize_founders_plot_sprite_sheet.mjs` for new generated or externally supplied 2D game assets that should become Three.js billboard sprites.

The expected character/building sprite-sheet flow is:

1. Store the untouched source sheet under `candidates/<version>/...`.
2. Normalize into alpha PNG sources and optimized WebP runtime sprites.
3. Commit the sidecar `*-sprite-sheet-normalized.json` report.
4. Add or update manifest entries with source hashes, dimensions, byte sizes, anchor, hitbox, and approval metadata.
5. Point scene-state asset IDs at the new manifest IDs only after validation.

Current Clover V2 example:

```bash
node scripts/normalize_founders_plot_sprite_sheet.mjs \
  --input public/experiences/founders-plot/assets/candidates/v1_4_4/characters/clover-v2-sheet-magenta.png \
  --out-dir public/experiences/founders-plot/assets/characters/v1_4_4 \
  --prefix clover \
  --grid 3x3 \
  --states idle,observing,thinking,acting,waiting-approval,celebrating,paused,blocked,restart-needed \
  --key '#ff00ff' \
  --fuzz 45% \
  --size 512 \
  --quality 92
```

## Ambient world prop imports

Use `worldProps` in `asset-manifest.json` for non-critical 2D props that should appear in the Three.js world without changing gameplay logic.

The expected prop flow is:

1. Store the untouched source under `candidates/<version>/props/` when it came from GPT Image or an outside artist.
2. Normalize to transparent PNG/WebP or a reviewed repo-native SVG under `props/`.
3. Add a manifest asset with `role` and `kind` set to `founders_plot_world_prop`, `layerRole: "world-prop"`, `stateDriven: false`, dimensions, byte size, hashes, anchor, hitbox, and approval metadata.
4. Add a `worldProps` entry that maps `propId` to the manifest `assetId` and normalized scene coordinates.
5. Add the prop to `WORLD_PROPS` in `scene_state.js`; validation fails if a `_prop_` asset is referenced there without a matching `worldProps` entry.

Current prop example: `founders_plot_supply_crates_prop_v1_4_4` renders ambient supply crates in the Three.js scene and does not create gameplay actions.
