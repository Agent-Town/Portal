# Agent Town Three.js Texture Warning Cleanup - 2026-05-31

## Scope

Investigated the repeated Founders Plot Three.js warning:

`THREE.WebGLRenderer: Texture marked for update but no image data found.`

Changed only the owned Three.js renderer entry and its generated bundle:

- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`

Proof files:

- `reports/agent-town-threejs-texture-warning-cleanup-proof-2026-05-31.json`
- `reports/agent-town-threejs-texture-warning-cleanup-proof-2026-05-31.png`

## Cause

The warning came from sprite-sheet textures created from `TextureLoader` textures before the image had finished loading.

The old flow was:

1. `loadTexture(assetSrc)` returned a pending `THREE.Texture`.
2. `spriteTextureForObject()` immediately called `texture.clone()` for sprite-sheet UV cropping.
3. Three.js `Texture.clone().copy()` marks the clone as `needsUpdate`.
4. The renderer tried to upload the clone while `texture.image` was still null, triggering the warning.
5. `setSpriteSheetFrame()` also marked the clone for update every animation frame, which repeated the warning until image data arrived.

Rendered assets still appeared in prior playtests because the loader eventually completed, but the renderer was noisy during the pending-image window.

## Fix

Added a narrow texture readiness guard:

- `textureHasImageData(texture)` checks that a texture has image data and is not an incomplete image.
- `setSpriteSheetFrame()` now updates UV repeat/offset immediately but only sets `needsUpdate` when image data exists.
- Pending sprite-sheet textures now share the loader source without cloning through Three.js `Texture.clone()` until data exists.
- `loadTexture()` now keeps pending per-call load/error callbacks for cached in-flight textures, so multiple sprites sharing one asset still re-render when the asset finishes.

This preserves sprite-sheet cropping, asset loading, and animation while avoiding premature GPU upload attempts.

## Verification

Passed:

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `npm run build:founders-plot-threejs`
- Focused Playwright/canvas proof via one-off browser probe:
  - loaded `/founders-plot`
  - captured browser console output
  - confirmed `textureWarningCount: 0`
  - confirmed WebGL canvas visible/nonblank with 4 visible sampled pixels and 4 unique samples
  - confirmed real sprite-sheet actors rendered without asset fallback
- `node` JSON parse/readback for proof file
- `identify reports/agent-town-threejs-texture-warning-cleanup-proof-2026-05-31.png`
- `git diff --check`

Proof summary:

```json
{
  "ok": true,
  "textureWarningCount": 0,
  "renderedActors": 2,
  "visible": 4,
  "unique": 4
}
```

## E2E Note

I attempted the existing `e2e/214_founders_plot_threejs_playable_slice.spec.js` before the fix. It failed at the pre-existing canvas actor-pick assertion because clicking the builder canvas point left the drawer on `Empty pad (1, 1)` instead of `Lumber Camp`. That appears to be a separate dense-scene/click-target test issue, not the texture warning; I did not broaden this cleanup into interaction semantics.

## Remaining Risk

Low. The fix affects only renderer texture timing. It does not change scene state, gameplay authority, server routes, tools, assets, Atlas behavior, resource math, scheduling, public sharing, or external effects.
