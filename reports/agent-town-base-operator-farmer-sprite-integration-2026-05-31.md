# AgentTown Base Operator Farmer Sprite Integration - 2026-05-31

## Scope

Integrated the first missing base-building operator asset: Mira Seedhand, the dedicated `farmer` / Farm Plot grower.

This slice is asset-only. It does not wire Mira into `scene_state.js`, does not alter server projections, and does not change gameplay, resources, rewards, work orders, scheduler behavior, Atlas execution, route/trade behavior, public sharing, or generated-universe behavior.

## Source

The image generation route reported a delivery failure after generation, but the completed media file was available locally:

- `/Users/robin/.openclaw/media/tool-image-generation/agent-town-farmer-mira-seedhand-sprite-sheet-v1-opaque---1c765b5e-1556-40cc-bc0e-b8c1b0734f39.png`

That source was copied into the project and alpha-cleaned locally.

## Outputs

Runtime asset directory:

- `public/experiences/founders-plot/assets/characters/inhabitants/farmer/`

Files:

- `farmer-mira-seedhand-v1.generated.png`
- `farmer-mira-seedhand-v1.source.png`
- `farmer-mira-seedhand-v1.png`
- `farmer-mira-seedhand-v1.json`
- `farmer-mira-seedhand-v1.prompt.md`

Proofs:

- `reports/agent-town-base-operator-farmer-sprite-integration-proof-2026-05-31.png`
- `reports/agent-town-base-operator-farmer-row-strip-2026-05-31.png`
- `reports/agent-town-base-operator-farmer-sprite-integration-proof-2026-05-31.json`

## Character

Mira Seedhand is a visual-only Farm Plot grower. She reads soil markers, tends crop rows, and prepares receipt-bound food baskets when existing server-owned production is ready.

Rows:

- `idle`: checking a seed tray, soil marker, or crop row.
- `walk`: carrying a seed satchel or watering can.
- `tend`: tending crop rows with a subtle cyan soil-sensor cue.
- `ready`: holding a gathered food basket and sealed receipt pouch.

## Processing

The generated file was an opaque 2048 x 2048 PNG with a magenta and pale-magenta background. The runtime sheet was produced with ImageMagick by converting the sampled magenta and pale background keys to alpha, then clearing narrow generated guide strips around the 512px frame boundaries.

Runtime checks:

- Generated/source PNGs: `2048x2048 sRGB srgb 3.0`
- Runtime PNG: `2048x2048 sRGB srgba 4.0`
- Runtime corner samples: transparent at all four corners
- Runtime alpha mean: `0.239559`

## Validation

Commands run:

- `jq empty public/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.json reports/agent-town-base-operator-farmer-sprite-integration-proof-2026-05-31.json`
- `magick identify -format '%f %wx%h %[colorspace] %[channels]\n' public/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.generated.png public/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.source.png public/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.png reports/agent-town-base-operator-farmer-sprite-integration-proof-2026-05-31.png reports/agent-town-base-operator-farmer-row-strip-2026-05-31.png`
- `NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js`
- `git diff --check -- public/experiences/founders-plot/assets/characters/inhabitants/farmer reports/agent-town-base-operator-farmer-sprite-integration-2026-05-31.md reports/agent-town-base-operator-farmer-sprite-integration-proof-2026-05-31.json reports/agent-town-base-operator-farmer-sprite-integration-proof-2026-05-31.png reports/agent-town-base-operator-farmer-row-strip-2026-05-31.png`

Results:

- Metadata and proof JSON parse cleanly.
- All asset and proof images identify at expected dimensions/channels.
- Scene-state tests still pass: 8/8.
- Focused `git diff --check` passes.

## Boundary

Mira is asset-ready only. A later bounded scene-wiring slice can map real `FARM_PLOT` production or ready-output projections to `farmer` once the parent explicitly chooses that runtime change. This slice intentionally stops before that line.
