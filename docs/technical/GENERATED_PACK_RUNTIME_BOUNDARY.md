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

## GU-7 Three.js Asset Loader Slice

- `public/experiences/world-grid/asset_loader.js` is the browser-side asset-aware loader contract for generated packs.
- The loader reads material colors from `GeneratedAssetManifest`, planned texture targets from `AssetPromptPlan`, and optional future public runtime assets from `runtimeAssetManifest`.
- Runtime asset URLs must remain under `public/experiences/world-grid/generated`; unsafe paths and unapproved data/candidate paths are treated as fallbacks.
- `public/experiences/world-grid/three_scene_entry.js` exposes loader metrics through `sceneInfo.assetLoader`, respects reduced motion, and derives playtest missing-asset counts from the loader.

## GU-8 AI Playtest Harness Slice

- First-loop reports are normalized by `buildMeasuredPlaytestReport` before validation and cannot pass with default scores.
- The harness records measured score evidence, palette contrast/readability scoring, style-coherence factors, prompt-alignment hints, asset-loader fallback evidence, console error count, and screenshot evidence.
- Screenshot evidence is recorded as dimensions, byte length, source, and SHA-256 hash; the contract does not require storing production screenshot files yet.
- Missing future production textures remain deterministic fallbacks. The harness records handled fallbacks as warnings while still requiring zero unhandled missing assets for a pass.

## GU-9 Replayability Diversity Slice

- `REPLAYABILITY_PROMPT_SUITE` is the fixed ten-prompt roadmap seed set for generated-pack diversity checks.
- `analyzePackDiversity` now produces a pack pass/fail report with valid pack count, first-loop pass count, replayability signatures, pairwise palette distance, label/name distance, motif distance, screenshot-hash comparison, and forbidden-authority/raw-prompt leak counts.
- Prompt-derived palette variants keep same-preset packs visually distinct while preserving readable text contrast and canonical gameplay mappings.
- Browser coverage runs all ten prompts through the real world-grid first loop and reuses the same diversity analyzer on the returned packs and measured playtest reports.

## GU-10 Pack Save, Reload, and Remix Slice

- Generated-pack records are persisted under an ignored durable root, defaulting to `data/generated-packs-durable`.
- `reloadGeneratedPack` reloads a saved pack by ID, reloads the current pack after memory reset, and falls back to the current durable pack when a requested pack is missing.
- `exportGeneratedPack` writes an owner-redacted export envelope with a stable content hash, migration version, vault compatibility metadata, and no raw prompt text.
- `importGeneratedPack` accepts only hash-valid generated-pack exports, rejects tampering or private owner fields, migrates the pack to the current owner, and validates before saving.
- `remixGeneratedPack` creates a child pack with parent/root/generation lineage while preserving canonical mappings and zero server-rule overrides.

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
  "assetAwareLoaderExists": true,
  "plannedTextureTargetCount": 23,
  "missingTextureCount": 0,
  "handledMissingTextureCount": 23,
  "assetLoaderPerformanceBudgetPassed": true,
  "firstLoopStillCompletes": true,
  "firstLoopPlaytestAutomated": true,
  "measuredScoresRequired": true,
  "defaultScoresCannotPass": true,
  "badContrastPackRejected": true,
  "missingMappingPackRejected": true,
  "missingAssetFallbackWarningRecorded": true,
  "screenshotEvidenceRecorded": true,
  "paletteContrastScoreMin": 0.85,
  "replayabilityPromptCount": 10,
  "replayabilityValidPackCount": 10,
  "replayabilityFirstLoopPassCount": 10,
  "replayabilityPairwiseComparisonCount": 45,
  "uniqueReplayabilitySignatures": 10,
  "uniqueScreenshotHashes": 10,
  "meaningfulDifferenceScoreMin": 0.65,
  "replayabilityForbiddenAuthorityCount": 0,
  "durablePackStorage": true,
  "restartReloadPass": true,
  "exportImportRoundTrip": true,
  "invalidImportRejected": true,
  "remixLineageRecorded": true,
  "missingPackFallback": true,
  "privateDataLeakCount": 0,
  "migrationVersion": 1
}
```
