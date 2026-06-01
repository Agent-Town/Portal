# Agent Town HQ14R Runtime Promotion Gate - 2026-06-01

## Verdict

READY_FOR_EXPLICIT_RUNTIME_PROMOTION_SLICE_AFTER_PUBLIC_TERRAIN_GATE

HQ14P/HQ14Q produced useful review media, but none of those assets should move into `public/experiences/founders-plot/assets/` until a dedicated runtime promotion slice proves public-terrain gating in code and e2e proof metadata.

## Current Runtime Truth

The live Expedition Map renderer already has a truth gate:

- Runtime region pack: `hq14a_region_faithful_terrain_fog_atlas_v1`
- Renderer source: `public/experiences/founders-plot/three_scene_entry.js`
- Existing tile guard: `expeditionRegionTileAssetAllowed(...)`
- Existing map read-model authority: `server_owned_read_only_expedition_map_fog_of_war_projection_v1`
- Existing reveal route: `POST /api/founders-plot/expedition-map/scout-sector`

The server read model exposes fog states and descriptive terrain flavor, but it does not yet expose a formal public terrain asset slot contract rich enough for broad HQ14P/HQ14Q underlays.

## Promotion Requirements

A later runtime promotion lane may promote a tiny subset only if it adds or proves:

- `publicTerrainAssetSlot` or equivalent normalized public terrain slot on each discovered/known cell.
- Allowed concrete slots are narrow: `field`, `forest`, `ridge`, `settled`, and later `water` only when explicit public water truth exists.
- `hinted` and `locked_unknown` cells must use fog-only slots, never concrete terrain art.
- Candidate 02/04 water/coast-heavy art stays blocked unless a public water/coast truth source exists.
- Asset manifest must declare `presentationOnly`, `serverOwnedRegionTruthRequired`, `fogOnlyForHiddenCells`, `noHiddenTruthLeakage`, and `scoutSectorOnlyMutationPath`.
- Renderer proof metadata must report each rendered asset assignment by cell id, fog state, public terrain slot, asset slot, and whether the asset is fog-only.
- FP-E2E-023 must fail if any hidden cell uses a non-fog-only asset or if any discovered/known cell uses terrain art without a matching public slot.

## Suggested Smallest Runtime Slice

Start with only:

- one underlay image derived from HQ14Q Candidate 01 or Candidate 03, used as a broad presentation backdrop;
- one fog-only edge overlay concept for hidden/unknown masking;
- no water/coast-specific assets;
- no new Scout Sector behavior;
- no client-generated terrain classification.

This keeps the first promotion focused on visual continuity while preserving server authority.

## Not In Scope

- No runtime promotion in HQ14R.
- No image generation.
- No app/source edits.
- No server/store/routes/tools/schema edits.
- No tests changed.
- No Atlas execution, public sharing, Generated Universe rendering, hidden autonomy, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation, external effects, or Wild West drift.

## Verification

- Read current renderer terrain/fog asset-gating references.
- Read current server/API/e2e Expedition Map fog/Scout Sector references.
- `jq empty reports/agent-town-hq14r-runtime-promotion-gate-proof-2026-06-01.json`
- `git diff --check`
