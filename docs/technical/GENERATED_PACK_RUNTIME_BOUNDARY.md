# Generated Pack Runtime Boundary

Status: prototype-gated

## Runtime Flow

```text
Player prompt
  -> GenerationBrief
  -> StyleBible + UniverseBible
  -> Canonical Gameplay Mapping
  -> Asset Prompt Plan
  -> Candidate assets or deterministic fallbacks
  -> Generated Pack Manifest
  -> Validation report
  -> Three.js runtime load
  -> First-loop playtest report
```

## Current V0 Implementation

- `server/world_grid/generated_pack.js` creates deterministic fallback packs from a prompt.
- `FEATURE_WORLD_GRID_GENERATED_PACKS` gates generated-pack APIs and runtime UI.
- Three.js receives generated palette/material information, but server-owned world state and claim mutations still use canonical `et.world.*` behavior.
- The V0 demo uses fallback Three.js materials and generated text. GPT Image 2 assets are future candidates, not production assets.

## V0.1 Contract-First Pipeline

- Player prompts are reduced to a structured `GenerationBrief` with theme, tone, visual style, species, factions, cultures, tech flavor, humor level, and safety status.
- Generated packs include an `AssetPromptPlan` for canonical image targets only; plan entries carry prompt hashes, target sizes, usage paths, negative prompts, candidate output paths, and JSONL job-log paths.
- Candidate folders and job logs are scaffolded under `data/generated-packs*`; no production image asset is required for runtime playability.
- Deterministic fallback materials, shape tokens, sprites, and generated text remain the playable runtime source until an explicit auth, consent, cost, review, and promotion model exists for production image generation.

## GU-2 Schema Validation Slice

- `server/world_grid/generated_schema.js` is the local schema registry and minimal JSON Schema runner for generated-pack contracts.
- Generated packs now validate `GenerationBrief`, `StyleBible`, `UniverseBible`, `GameplayMapping`, `AssetPromptPlan`, `GeneratedAssetManifest`, and the outer generated pack independently.
- Runtime pack validation fails closed when schema validation finds missing required fields, unknown fields in strict subdocuments, wrong enum values, or raw-prompt forbidden fields.
- The schema runner is intentionally local and deterministic; it does not call external validators or image/model services.

## GU-4 Job Scaffold Slice

- Each asset prompt target writes a scaffolded JSONL generation job record under the configured candidate root.
- Job logs record `authMode=not_configured`, `costConsentStatus=not_required_for_scaffold`, `externalImageGenerationUsed=false`, zero outputs, and no production approval.
- Job logs include prompt-plan hash, source provenance, retry metadata, and a resume pointer so a future approved image-generation runner can replay from the prompt plan without inventing state.

## GU-5 Candidate Generation Guard Slice

- `server/world_grid/generated_asset_generation.js` provides the preflight boundary for future candidate image generation.
- `scripts/generated_pack_candidate_generation_spike.js` is the optional command surface; by default it only reports blocked preflight state and can append candidate-generation evidence to JSONL job logs.
- The guard requires product/security approval, documented auth, documented cost, accepted cost estimate, and user/team consent before any adapter can run.
- No adapter is wired by default. Failed or blocked attempts keep deterministic fallback packs playable, write zero production outputs, and preserve canonical gameplay mappings.

## GU-6 Post-Processing Contract Slice

- `server/world_grid/generated_asset_postprocess.js` builds standalone postprocess plans and reports from an `AssetPromptPlan`.
- Postprocess plans record crop, resize, alpha, WebP/PNG fallback, shelf-atlas metadata, per-target byte budgets, candidate input paths, postprocessed candidate output paths, and human-promotion paths.
- The runner writes texture-atlas metadata, visual manifest sidecars, and per-target sidecars even when candidate files are absent, so missing assets fall back deterministically instead of blocking the first loop.
- Postprocessed outputs remain candidate artifacts under `data/generated-packs*/<packId>/postprocessed`; production promotion paths under `approved` are not written without later human signoff.

## Machine Checks

```json
{
  "defaultPackLoads": true,
  "generatedPackLoads": true,
  "packSwitchWithRouteReload": true,
  "consoleErrors": 0,
  "missingTextures": 0,
  "visiblePackDifferenceScoreMin": 0.65,
  "canonicalPayloadIntegrity": true,
  "generationBriefStructured": true,
  "assetPromptPlanCoverage": 1.0,
  "candidateFolderCount": 23,
  "generationJobLogCount": 23,
  "productionImageAssetCount": 0,
  "externalImageModelUsed": false,
  "replayabilityDistinctSignatureRatioMin": 1.0,
  "schemaRegistryExists": true,
  "jsonSchemaRunnerExists": true,
  "schemasValidatedIndependently": true,
  "dangerousFieldRejectCountMin": 20,
  "jobLogsReplayableFromPromptPlan": true,
  "costConsentStatus": "not_required_for_scaffold",
  "candidateGenerationPreflightExists": true,
  "generationDisabledWithoutConsentAuthCost": true,
  "approvedAssetsRequireHumanSignoff": true,
  "generatedImageAssetsCanChangeServerRules": false,
  "assetPostprocessPlanExists": true,
  "assetPostprocessReportExists": true,
  "spriteAtlasMetadataExists": true,
  "visualManifestSidecarsExist": true,
  "postprocessedOutputsStayCandidateOnly": true,
  "threejsPackedAssetLoadDeferredToGU7": true
}
```
