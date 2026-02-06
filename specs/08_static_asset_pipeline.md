# Static Asset Pipeline (Deterministic Upload-Only)

This pipeline produces **Phaser-friendly static sprites** from user uploads, without any LLM/prompting.

It is designed for 2.5D isometric worlds:
- Projection metadata: **2:1 pixel isometric** (`iso-2:1`)
- Tile footprint metadata (in tiles): e.g. `1x1`, `2x1`
- Pivot/origin metadata: bottom-center for ground objects; center for decals

The pipeline **does not** convert non-isometric art into isometric perspective. It only normalizes and exports a consistent runtime package.

---

## Output Contract (v1)

For each accepted upload, the pipeline publishes a `StaticAssetPack`:

- `sprite.png` (SD)
- `sprite@2x.png` (HD, nearest-neighbor x2 of SD)
- `manifest.json`

Debug/stage artifact:
- `stages/normalized.png`

Determinism:
- Same source bytes + same options + same `pipelineVersion` + same `templateVersion` => identical output hashes.

---

## Manifest Schema (v1)

`manifest.json` is the canonical runtime metadata.

Key fields:
- `assetKind`: `decal|prop|building`
- `projection.kind`: `iso-2:1`
- `projection.tile`: `{ w: 64, h: 32 }`
- `tileFootprint`: `{ w, h }` in tiles (not pixels)
- `pivot.origin`: `[ox, oy]` (Phaser `setOrigin(ox, oy)` compatible)
  - `prop|building`: `[0.5, 1]` (bottom-center, feet/ground contact)
  - `decal`: `[0.5, 0.5]` (center)

Example:
```json
{
  "schemaVersion": 1,
  "kind": "agent-town-static-asset-pack",
  "assetKind": "prop",
  "pipelineVersion": "v1.0.0",
  "templateVersion": "t1.0.0",
  "projection": { "kind": "iso-2:1", "tile": { "w": 64, "h": 32 } },
  "tileFootprint": { "w": 1, "h": 1 },
  "pivot": {
    "origin": [0.5, 1],
    "pivotPx": [23.5, 47],
    "name": "bottom-center"
  },
  "options": { "pixelateTo": 128, "quantizeBits": 4 },
  "images": {
    "sd": { "file": "sprite.png", "w": 47, "h": 47 },
    "hd": { "file": "sprite@2x.png", "w": 94, "h": 94 }
  }
}
```

---

## Pipeline Stages (Deterministic)

1. **Normalize**
- decode + rotate (EXIF) + ensure alpha
- cap max dimension to `1024` (nearest-neighbor) for safety
- write `stages/normalized.png`

2. **Export**
- trim transparent padding (alpha bounds)
- optional pixelate: downscale to `pixelateTo` (max dimension) using nearest-neighbor
- optional quantize: per-channel RGB quantization (`quantizeBits`)
- trim again
- write `sprite.png` and `sprite@2x.png`
- write `manifest.json`

No stage uses prompts or model inference.

---

## API Surface

The full endpoint contract lives in:
- `specs/02_api_contract.md` (Static asset pipeline section)

In short:
- `POST /api/static-asset/upload`
- `GET /api/static-asset/jobs/:jobId`
- `GET /api/static-asset/:assetId/package`
- `GET /api/static-asset/:assetId/sprite.png`
- `GET /api/static-asset/:assetId/sprite@2x.png`
- `GET /api/static-asset/:assetId/manifest.json`

All endpoints are session-scoped.

---

## Runtime Use (Phaser)

This pipeline exports **single images** (not atlases). Phaser can load them as images:

```js
// after you have assetId from /package:
scene.load.image('myProp', `/api/static-asset/${assetId}/sprite.png`);
scene.load.once('complete', async () => {
  const manifest = await fetch(`/api/static-asset/${assetId}/manifest.json`, { credentials: 'include' }).then(r => r.json());
  const s = scene.add.image(x, y, 'myProp');
  s.setOrigin(manifest.pivot.origin[0], manifest.pivot.origin[1]);
  s.setDepth(s.y);
});
scene.load.start();
```

Notes:
- For isometric depth sorting, `setDepth(sprite.y)` is a good default.
- `decal` assets should generally be treated as overlays (center origin) rather than grounded props.

