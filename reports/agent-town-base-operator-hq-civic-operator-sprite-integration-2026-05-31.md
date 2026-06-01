# AgentTown Base Operator HQ Civic Operator Sprite Integration - 2026-05-31

## Scope

Integrated the third missing base-building operator asset: Vale-Desk 7, the dedicated `hq_civic_operator` / HQ civic operator.

This slice is asset-only. It does not wire Vale into `scene_state.js`, does not alter server projections, and does not change gameplay, upgrades, resources, rewards, work orders, scheduler behavior, Atlas execution, route/trade behavior, public sharing, or generated-universe behavior.

## Source

The inter-session GPT Image 2 generation completed and the media file was available locally:

- `/Users/robin/.openclaw/media/tool-image-generation/agent-town-hq-civic-operator-vale-desk-7-sprite-sheet-v1-opa---d05f5f0b-1667-4cda-a9f8-91f7b2db9cf6.png`

That source was copied into the project and alpha-cleaned locally.

## Outputs

Runtime asset directory:

- `public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/`

Files:

- `hq-civic-operator-vale-desk-7-v1.generated.png`
- `hq-civic-operator-vale-desk-7-v1.source.png`
- `hq-civic-operator-vale-desk-7-v1.png`
- `hq-civic-operator-vale-desk-7-v1.json`
- `hq-civic-operator-vale-desk-7-v1.prompt.md`

Proofs:

- `reports/agent-town-base-operator-hq-civic-operator-sprite-integration-proof-2026-05-31.png`
- `reports/agent-town-base-operator-hq-civic-operator-row-strip-2026-05-31.png`
- `reports/agent-town-base-operator-hq-civic-operator-sprite-integration-proof-2026-05-31.json`
- `reports/agent-town-base-operator-hq-civic-operator-originals-2026-05-31/hq-civic-operator-vale-desk-7-v1.opaque-original.png`

## Character

Vale-Desk 7 is a visual-only synthetic HQ civic operator. It sorts receipts, readiness notices, and upgrade paperwork that already exists in server-owned state, making HQ civic memory visible without becoming town authority.

Rows:

- `idle`: waiting at a compact civic desk with receipt tray.
- `walk`: carrying notice ribbons or receipt bundles.
- `coordinate`: sorting receipts, stamping an abstract queue token, and pointing at an unreadable HQ board.
- `ready`: presenting a sealed upgrade or readiness notice packet.

## Processing

The generated file was an opaque 2048 x 2048 PNG with a saturated magenta and pale edge background. The runtime sheet was produced with ImageMagick by converting saturated magenta pixels to alpha, flood-filling pale edge remnants from safe sheet boundary points, clearing narrow generated guide strips around the 512px frame boundaries, and zeroing hidden RGB in transparent pixels to avoid resized-proof magenta bleed.

Runtime checks:

- Generated/source PNGs: `2048x2048 sRGB srgb 3.0`
- Runtime PNG: `2048x2048 sRGB srgba 4.0`
- Runtime corner, center, and sample grid pixels: transparent
- Runtime alpha mean: `0.412107`

## Validation

Commands run:

- `jq empty public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.json reports/agent-town-base-operator-hq-civic-operator-sprite-integration-proof-2026-05-31.json`
- `magick identify -format '%f %wx%h %[colorspace] %[channels] %[depth]\n' public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.generated.png public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.source.png public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.png reports/agent-town-base-operator-hq-civic-operator-sprite-integration-proof-2026-05-31.png reports/agent-town-base-operator-hq-civic-operator-row-strip-2026-05-31.png`
- `NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js`
- `git diff --check -- public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator reports/agent-town-base-operator-hq-civic-operator-sprite-integration-2026-05-31.md reports/agent-town-base-operator-hq-civic-operator-sprite-integration-proof-2026-05-31.json reports/agent-town-base-operator-hq-civic-operator-sprite-integration-proof-2026-05-31.png reports/agent-town-base-operator-hq-civic-operator-row-strip-2026-05-31.png reports/agent-town-base-operator-hq-civic-operator-originals-2026-05-31`

Results:

- Metadata and proof JSON parse cleanly.
- All asset and proof images identify at expected dimensions/channels.
- Scene-state tests still pass: 8/8.
- Focused `git diff --check` passes.

## Boundary

Vale-Desk 7 is asset-ready only. A later bounded scene-wiring slice can map real HQ readiness, receipt, or civic notice projections to `hq_civic_operator` if the parent explicitly chooses that runtime change. This slice intentionally stops before that line.
