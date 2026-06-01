# AgentTown Base Operator Quarry Mason Sprite Integration - 2026-05-31

## Scope

Integrated the second missing base-building operator asset: Bram Stonecalm, the dedicated `quarry_mason` / Quarry mason.

This slice is asset-only. It does not wire Bram into `scene_state.js`, does not alter server projections, and does not change gameplay, resources, rewards, work orders, scheduler behavior, Atlas execution, route/trade behavior, public sharing, or generated-universe behavior.

## Source

The image generation route reported a delivery failure after generation, but the completed media file was available locally:

- `/Users/robin/.openclaw/media/tool-image-generation/agent-town-quarry-mason-bram-stonecalm-sprite-sheet-v1-opaqu---e47a6ae1-048a-4e48-a586-a924683f3f9b.png`

That source was copied into the project and alpha-cleaned locally.

## Outputs

Runtime asset directory:

- `public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/`

Files:

- `quarry-mason-bram-stonecalm-v1.generated.png`
- `quarry-mason-bram-stonecalm-v1.source.png`
- `quarry-mason-bram-stonecalm-v1.png`
- `quarry-mason-bram-stonecalm-v1.json`
- `quarry-mason-bram-stonecalm-v1.prompt.md`

Proofs:

- `reports/agent-town-base-operator-quarry-mason-sprite-integration-proof-2026-05-31.png`
- `reports/agent-town-base-operator-quarry-mason-row-strip-2026-05-31.png`
- `reports/agent-town-base-operator-quarry-mason-sprite-integration-proof-2026-05-31.json`
- `reports/agent-town-base-operator-quarry-mason-originals-2026-05-31/quarry-mason-bram-stonecalm-v1.opaque-original.png`

## Character

Bram Stonecalm is a visual-only Quarry mason. He inspects samples, marks safe cuts, works with careful hand tools, and presents receipt-bound stone when existing server-owned production is ready.

Rows:

- `idle`: inspecting a stone sample, marker tag, or measuring cord.
- `walk`: carrying a sample crate or marker bundle.
- `cut`: carefully marking and splitting stone with a subtle cyan fracture-scanner cue.
- `ready`: presenting stacked stone and a sealed receipt pouch.

## Processing

The generated file was an opaque 2048 x 2048 PNG with a magenta and pale background. The runtime sheet was produced with ImageMagick by converting the background keys to alpha, then clearing narrow generated guide strips around the 512px frame boundaries.

Runtime checks:

- Generated/source PNGs: `2048x2048 sRGB srgb 3.0`
- Runtime PNG: `2048x2048 sRGB srgba 4.0`
- Runtime corner, center, and sample grid pixels: transparent
- Runtime alpha mean: `0.383013`

## Validation

Commands run:

- `jq empty public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.json reports/agent-town-base-operator-quarry-mason-sprite-integration-proof-2026-05-31.json`
- `magick identify -format '%f %wx%h %[colorspace] %[channels] %[depth]\n' public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.generated.png public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.source.png public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.png reports/agent-town-base-operator-quarry-mason-sprite-integration-proof-2026-05-31.png reports/agent-town-base-operator-quarry-mason-row-strip-2026-05-31.png`
- `NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js`
- `git diff --check -- public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason reports/agent-town-base-operator-quarry-mason-sprite-integration-2026-05-31.md reports/agent-town-base-operator-quarry-mason-sprite-integration-proof-2026-05-31.json reports/agent-town-base-operator-quarry-mason-sprite-integration-proof-2026-05-31.png reports/agent-town-base-operator-quarry-mason-row-strip-2026-05-31.png reports/agent-town-base-operator-quarry-mason-originals-2026-05-31`

Results:

- Metadata and proof JSON parse cleanly.
- All asset and proof images identify at expected dimensions/channels.
- Scene-state tests still pass: 8/8.
- Focused `git diff --check` passes.

## Boundary

Bram is asset-ready only. A later bounded scene-wiring slice can map real `QUARRY` production or ready-output projections to `quarry_mason` once the parent explicitly chooses that runtime change. This slice intentionally stops before that line.
