# Agent Town HQ14S Runtime Promotion Implementation Plan - 2026-06-01

## Verdict

PLAN_READY_AWAITING_EXPLICIT_RUNTIME_PROMOTION_APPROVAL

This is a report/proof-only plan. It does not promote HQ14P/HQ14Q review media into runtime, does not add a loader, and does not edit app, server, test, or asset code.

## Why This Plan Exists

HQ14R set the right gate: the next visual leap should not move painted terrain/world assets into `public/experiences/founders-plot/assets/` until the runtime can prove public terrain/fog semantics cell by cell.

The current runtime already has a useful guard, but it is still renderer-side and text-derived:

- `public/experiences/founders-plot/three_scene_entry.js` declares `EXPEDITION_REGION_TILE_ASSETS`.
- `expeditionCellTerrain(...)` and `expeditionRegionTileAssetAllowed(...)` derive terrain from public cell text.
- `updateInfo()` already emits `regionVisuals` and guardrail metadata for `FP-E2E-023`.
- The server owns the Expedition Map read model and Scout Sector mutation path, but it does not yet expose a normalized `publicTerrainAssetSlot` contract per cell.

HQ14S should be the smallest explicit runtime-promotion slice after Robin approves promotion, not before.

## Implementation Shape

### 1. Server Read-Model Contract

Add a normalized public terrain/fog asset contract to each Expedition Map cell in `server/founders_plot/engine.js`.

Recommended fields:

```json
{
  "publicTerrainAssetSlot": "forest",
  "publicTerrainAssetSlotSource": "server_read_model_v1",
  "publicTerrainAssetSlotReason": "known/discovered public cell traits include forest or wood",
  "fogAssetSlot": null,
  "terrainAssetContractVersion": "agenttown_public_terrain_asset_slots_v1"
}
```

Rules:

- `discovered` and `known` cells may expose concrete slots only from server-owned public fields.
- First allowed concrete slots: `field`, `forest`, `ridge`, and `settled`.
- `water` stays blocked until the server exposes an explicit public water/coast/river truth source.
- `hinted` cells expose only `fogAssetSlot: "hinted_frontier_fog"`.
- `locked_unknown` cells expose only `fogAssetSlot: "locked_unknown_fog"`.
- Hidden cells must not receive a concrete `publicTerrainAssetSlot`, even if their private template has flavor.

Tests:

- Unit tests for every fog state and slot.
- HTTP contract test that no hidden cell has a concrete terrain slot.
- Contract/schema assertions for the new fields.
- A regression case proving water/coast-heavy assets remain blocked without explicit public water truth.

### 2. Runtime Asset Pack Manifest

Promote only a tiny same-origin pack after the server contract lands.

Recommended pack id:

`hq14s_public_terrain_underlay_v1`

Initial runtime files:

- one broad underlay from HQ14Q Candidate 01 or Candidate 03;
- one fog-only hidden/hinted edge overlay;
- optional small slot samples for `field`, `forest`, `ridge`, and `settled`;
- no water/coast-specific runtime asset in the first slice.

Manifest requirements:

```json
{
  "id": "hq14s_public_terrain_underlay_v1",
  "presentationOnly": true,
  "serverOwnedRegionTruthRequired": true,
  "fogOnlyForHiddenCells": true,
  "noHiddenTruthLeakage": true,
  "scoutSectorOnlyMutationPath": true,
  "allowedConcreteSlots": ["field", "forest", "ridge", "settled"],
  "blockedSlots": ["water", "coast", "route", "resource", "combat", "reward"]
}
```

The manifest must not expose prompt text or sidecar metadata in user-facing UI, because review/source metadata can contain style intent that is not gameplay truth.

### 3. Renderer Binding

Update the renderer to consume server slots instead of deriving concrete terrain from ad hoc public-text matching.

Required behavior:

- hidden cells always choose fog-only assets from `fogAssetSlot`;
- visible cells can choose concrete terrain only from `publicTerrainAssetSlot`;
- missing/unknown slots fall back to procedural neutral field/fog rendering;
- the broad underlay can be visual-only, but any per-cell concrete asset assignment must cite the server slot;
- Scout Sector remains the only current Expedition Map mutation path.

Required proof metadata per rendered cell:

```json
{
  "cellId": "cell_q1_r0",
  "fogState": "known",
  "publicTerrainAssetSlot": "forest",
  "fogAssetSlot": null,
  "assetPack": "hq14s_public_terrain_underlay_v1",
  "assetSlot": "forest",
  "assetPath": "/experiences/founders-plot/assets/expedition-map/hq14s-public-terrain-underlay-v1/forest.png",
  "assetKind": "concrete_public_terrain",
  "fogOnly": false,
  "assetAllowedByServerTruth": true,
  "slotSource": "server_read_model_v1"
}
```

Hidden-cell proof entries must instead report `assetKind: "fog_only"` and `fogOnly: true`.

### 4. E2E Failure Gates

Extend `FP-E2E-023` so the runtime proof fails if:

- any `hinted` or `locked_unknown` cell uses a concrete terrain asset;
- any hidden cell has `publicTerrainAssetSlot`;
- any visible cell uses an asset whose slot does not equal the server-owned `publicTerrainAssetSlot`;
- any `water` or `coast` asset is used without explicit public water truth;
- any new Expedition Map mutation button appears besides eligible Scout Sector;
- any asset assignment is missing `cellId`, `fogState`, `assetPack`, `assetSlot`, `assetKind`, and `assetAllowedByServerTruth`.

Add one negative fixture or pure helper assertion that simulates a hidden cell with an invalid concrete asset request and proves the renderer normalizes it back to fog-only. Do not rely only on visual screenshots for this guardrail.

### 5. Verification Commands For The Runtime Slice

Expected checks after the future code/asset slice:

- `jq empty` on the runtime manifest and proof JSON.
- `file` and `magick identify` on promoted runtime PNG/WebP assets.
- `node --check server/founders_plot/engine.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- focused Founders Plot unit/contract/HTTP tests touching Expedition Map and Scout Sector.
- `npm run build:founders-plot-threejs`
- focused Playwright `FP-E2E-023`
- focused Playwright `FP-E2E-022`
- `git diff --check`

## Do Not Do In HQ14S Without New Approval

- Do not promote Candidate 02 or Candidate 04 water/coast-heavy art.
- Do not add client-side terrain classification.
- Do not make hidden, hinted, or locked cells visually imply concrete terrain.
- Do not create a new map mutation path.
- Do not add route/trade/economy/resource/reward/combat/scheduler behavior.
- Do not let Atlas execute or publish anything.
- Do not deploy, merge, or push without explicit Robin approval.

## Rollback Plan

If the future runtime slice misbehaves:

1. Remove the new `hq14s_public_terrain_underlay_v1` runtime asset directory/manifest.
2. Revert renderer asset-pack constants to `hq14a_region_faithful_terrain_fog_atlas_v1`.
3. Keep or revert server `publicTerrainAssetSlot` fields depending on whether their tests pass independently.
4. Rerun `FP-E2E-023`, `FP-E2E-022`, focused Founders Plot tests, and `git diff --check`.

## Current Verification

This report-only lane verified the plan against the current HQ14R/HQ14Q/HQ14O artifacts and current renderer asset-gating references.

Commands run:

- `git status --short --branch`
- `git log --oneline -5`
- `rg` over Expedition Map server/renderer/e2e/docs references
- `sed` over current HQ14R/HQ14Q/HQ14O reports and renderer gate snippets
- `jq empty reports/agent-town-hq14s-runtime-promotion-implementation-plan-proof-2026-06-01.json`
- `git diff --check -- reports/agent-town-hq14s-runtime-promotion-implementation-plan-2026-06-01.md reports/agent-town-hq14s-runtime-promotion-implementation-plan-proof-2026-06-01.json`
