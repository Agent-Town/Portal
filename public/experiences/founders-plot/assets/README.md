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

Every shipped asset is listed in the manifest with prompt reference, license, review status, and optimization state.

## Rebuild and validation

- Generate: `node scripts/generate_founders_plot_assets.mjs`
- Validate: `node scripts/validate_founders_plot_assets.mjs`
