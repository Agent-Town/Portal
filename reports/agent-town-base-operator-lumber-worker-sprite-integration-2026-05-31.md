# AgentTown Base Operator Lumber Worker Sprite Integration - 2026-05-31

## Scope

Integrated the fourth missing base-building operator asset: Jun Timberline, the dedicated `lumber_worker` / Lumber Camp wood steward.

This slice is asset-only. It does not wire Jun into `scene_state.js`, does not alter server projections, and does not change gameplay, production timing, resource math, rewards, work orders, scheduler behavior, Atlas execution, route/trade behavior, public sharing, or generated-universe behavior.

## Source

The GPT Image 2 generation completed and the media file was available locally:

- `/Users/robin/.openclaw/media/tool-image-generation/agent-town-lumber-worker-jun-timberline-sprite-sheet-v1-opaq---8c9e4578-d8b6-4dfd-8a5b-c0b190af62c9.png`

That source was copied into the project and alpha-cleaned locally.

## Outputs

Runtime asset directory:

- `public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/`

Files:

- `lumber-worker-jun-timberline-v1.generated.png`
- `lumber-worker-jun-timberline-v1.source.png`
- `lumber-worker-jun-timberline-v1.png`
- `lumber-worker-jun-timberline-v1.json`
- `lumber-worker-jun-timberline-v1.prompt.md`

Proofs:

- `reports/agent-town-base-operator-lumber-worker-sprite-integration-proof-2026-05-31.png`
- `reports/agent-town-base-operator-lumber-worker-row-strip-2026-05-31.png`
- `reports/agent-town-base-operator-lumber-worker-sprite-integration-proof-2026-05-31.json`
- `reports/agent-town-base-operator-lumber-worker-originals-2026-05-31/lumber-worker-jun-timberline-v1.opaque-original.png`

## Character

Jun Timberline is a visual-only Lumber Camp wood steward. Jun learned woodwork from repair crews who could make one good plank serve three emergencies. In Founders Plot, Jun makes the wood loop feel maintained and local without implying any production bonus or hidden mechanic.

Rows:

- `idle`: checking stacked planks, a plank gauge, or a camp marker.
- `walk`: carrying a tied board bundle or bundle straps.
- `mill`: measuring, sanding, or sorting planks with a subtle cyan grain-reader cue.
- `ready`: presenting bundled wood and a sealed receipt pouch.

## Processing

The generated file was an opaque 2048 x 2048 PNG with a saturated magenta and pale edge background. The runtime sheet was produced with ImageMagick by converting saturated magenta pixels to alpha, flood-filling pale edge remnants from safe sheet boundary points, clearing narrow generated guide strips around the 512px frame boundaries, and zeroing hidden RGB in transparent pixels to avoid resized-proof magenta bleed.

Runtime checks:

- Generated/source PNGs: `2048x2048 sRGB srgb 3.0`
- Runtime PNG: `2048x2048 sRGB srgba 4.0`
- Runtime corner, center, and sample grid pixels: transparent where background is expected
- Runtime alpha mean: `0.316259`

## Validation

Commands run:

- `jq empty public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.json reports/agent-town-base-operator-lumber-worker-sprite-integration-proof-2026-05-31.json`
- `magick identify -format '%f %wx%h %[colorspace] %[channels] %[depth]\n' public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.generated.png public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.source.png public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.png reports/agent-town-base-operator-lumber-worker-sprite-integration-proof-2026-05-31.png reports/agent-town-base-operator-lumber-worker-row-strip-2026-05-31.png`
- `NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js`
- `git diff --check -- public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker reports/agent-town-base-operator-lumber-worker-sprite-integration-2026-05-31.md reports/agent-town-base-operator-lumber-worker-sprite-integration-proof-2026-05-31.json reports/agent-town-base-operator-lumber-worker-sprite-integration-proof-2026-05-31.png reports/agent-town-base-operator-lumber-worker-row-strip-2026-05-31.png reports/agent-town-base-operator-lumber-worker-originals-2026-05-31`

Results:

- Metadata and proof JSON parse cleanly.
- All asset and proof images identify at expected dimensions/channels.
- Scene-state tests still pass: 8/8.
- Focused `git diff --check` passes.

## Boundary

Jun Timberline is asset-ready only. A later bounded scene-wiring slice can map real Lumber Camp production or ready-output projections to `lumber_worker` if the parent explicitly chooses that runtime change. This slice intentionally stops before that line.
