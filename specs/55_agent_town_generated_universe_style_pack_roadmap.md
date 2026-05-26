---
schemaVersion: "agent-town-spec-v1"
documentId: "specs/55_agent_town_generated_universe_style_pack_roadmap"
title: "Generated Universe + Style Pack Roadmap"
status: "prototype_gated"
date: "2026-05-26"
owner: "Agent Town product"
featureFlag: "FEATURE_WORLD_GRID_GENERATED_PACKS"
---

# Generated Universe + Style Pack Roadmap

The first real demo target is:

> Enter a prompt, generate a style/universe pack, load it in Three.js, and complete the first gameplay loop with generated visuals and text.

This is a separate prototype-gated track. It must not change normal gameplay visibility, canonical server simulation rules, Foreman authority, Brain Vault secrets, production auth, public social sharing, or world-grid default visibility.

## Roadmap

| Goal | Milestone | AI-measurable done |
| --- | --- | --- |
| G0 | Pack charter, security policy, runtime boundary | `canonicalServerTruthPreserved=true`, `generatedPackMutationAuthority=false`, rollback documented |
| G1 | Schema suite and fixtures | 10 contract schemas exist, valid fixture passes, invalid fixtures fail |
| G2 | Prompt intake and safety normalization | Prompt becomes safe `GenerationBrief`; raw prompt is not executable |
| G3 | Style bible generator | Palette, material rules, silhouette rules, UI rules, animation rules present |
| G4 | Universe bible generator | Factions/species/cultures, requester archetypes, hooks, humor, tech flavor present |
| G5 | Canonical gameplay mapping | Required canonical mappings covered, generated labels never replace mechanical keys |
| G6 | Asset prompt plan | Prompt files, hashes, target sizes, usage paths, negative prompts present |
| G7 | Codex/GPT Image 2 candidate generation | Candidate folder, job log, model record, retry records, fallback playability |
| G8 | Post-processing and sprite packing | Crop/resize/alpha checks, WebP/PNG output, manifest sidecars |
| G9 | Three.js generated-pack loader | Default and generated packs load; no missing textures; visible difference measured |
| G10 | Generated text runtime | Canonical payload integrity, generated-text coverage, readability pass |
| G11 | First generated world demo | Prompt-to-pack, validation, Three.js load, first loop, playtest report pass |
| G12 | AI playtest harness | Failed packs rejected; passing packs promoted to playable |
| G13 | Replayability diversity tests | 10 prompts produce 10 playable, meaningfully different packs |
| G14 | Pack save/reload/remix | Hash reload stable, export/import round trip, remix lineage, migration |
| G15 | Public-safe pack cards | No secret/private data leaks; summary and screenshot fields complete |
| G16 | Curated pack gallery | Only approved packs visible; moderation metadata complete |
| G17 | Approved modifier system | Enum-only modifiers; no formula strings; balance simulation passes |
| G18 | Generated tech flavor tree | Canonical effects covered; bounded modifiers; readable lore text |
| G19 | Generation cost/auth/consent model | Consent, cost estimate, rate limit, no secret logs |
| G20 | Production release gate | Schema, moderation, playtest, manifest, fallback, human review all pass |

## V0 Acceptance

```json
{
  "promptToPackComplete": true,
  "packValidationPassed": true,
  "generatedPackMutationAuthority": false,
  "canonicalMappingCoverage": 1.0,
  "firstLoopCompleted": true,
  "missingAssets": 0,
  "consoleErrors": 0,
  "playtestPassed": true,
  "styleCoherenceScoreMin": 0.85,
  "promptAlignmentScoreMin": 0.85,
  "uiReadabilityScoreMin": 0.85
}
```

## V0.1 Contract-First Pipeline Acceptance

```json
{
  "generationBriefStructured": true,
  "generationBriefDimensions": [
    "theme",
    "tone",
    "visualStyle",
    "species",
    "factions",
    "cultures",
    "techFlavor",
    "humorLevel",
    "safetyStatus"
  ],
  "rawPromptStored": false,
  "rawExecutablePromptInstructionCount": 0,
  "secretLikeFieldCount": 0,
  "canonicalMappingCoverage": 1.0,
  "arbitraryToolMutationFormulaCount": 0,
  "invalidAssetManifestEntryCount": 0,
  "assetPromptPlanCoverage": 1.0,
  "assetPromptPlanAssetCount": 23,
  "candidateOutputPathCount": 23,
  "candidateFolderCount": 23,
  "generationJobLogCount": 23,
  "productionImageAssetCount": 0,
  "externalImageModelUsed": false,
  "explicitConsentRequiredForImageGeneration": true,
  "candidateGenerationPreflightExists": true,
  "candidateGenerationBlockedWithoutConsentAuthCost": true,
  "assetPostprocessPlanExists": true,
  "assetPostprocessReportExists": true,
  "assetAwareLoaderExists": true,
  "missingTextureCount": 0,
  "handledMissingTextureCount": 23,
  "assetLoaderPerformanceBudgetPassed": true,
  "deterministicFallbackPlayable": true,
  "firstLoopCompleted": true,
  "firstLoopPlaytestAutomated": true,
  "measuredScoresRequired": true,
  "defaultScoresUsed": false,
  "screenshotEvidenceRecorded": true,
  "paletteContrastScoreMin": 0.85,
  "replayabilityDistinctSignatureRatioMin": 1.0,
  "replayabilityDistinctThemeRatioMin": 0.75
}
```

## GU-2 Schema Validation Engine Slice

The first production-roadmap continuation adds a local JSON Schema registry and runner for generated-pack subdocuments. The runner validates the pack, brief, style bible, universe bible, gameplay mapping, asset prompt plan, and asset manifest independently before a generated pack can pass validation.

```json
{
  "schemaRegistryExists": true,
  "jsonSchemaRunnerExists": true,
  "schemasValidatedIndependently": true,
  "generationBriefMatchesRoadmapShape": true,
  "styleBibleMatchesRoadmapShape": true,
  "universeBibleMatchesRoadmapShape": true,
  "gameplayMappingSchemaVersionRequired": true,
  "assetPromptPlanMatchesRoadmapShape": true,
  "dangerousFieldRejectCountMin": 20,
  "runtimeRejectsInvalidPack": true
}
```

## GU-4 Candidate Generation Job Scaffold Slice

The candidate generation scaffold still does not call image models. Each planned target writes a JSONL job-log record with explicit no-generation provenance, consent/cost placeholders, retry metadata, and enough prompt-plan linkage to replay or resume later.

```json
{
  "jobLogExists": true,
  "jobLogCount": 23,
  "externalImageGenerationUsed": false,
  "authMode": "not_configured",
  "costConsentStatus": "not_required_for_scaffold",
  "approvedOutputsEmptyUntilSignoff": true,
  "retryRecordsPresent": true,
  "replayableFromPromptPlan": true,
  "secretsRedacted": true
}
```

## GU-5 Candidate Image Generation Guard Slice

The real image-generation spike remains blocked until product/security approval, an explicit auth model, an explicit cost model, and explicit user/team consent exist. This slice adds only the optional command and runtime guard for that future work. The guard writes candidate-generation preflight records to the same job logs, never reads provider credentials, never calls an image model by default, never creates approved production assets, and fails back to the deterministic generated pack.

```json
{
  "optionalGenerationCommandExists": true,
  "generationDisabledWithoutConsentAuthCost": true,
  "productSecurityApprovalRequired": true,
  "authModelDocumentedRequired": true,
  "costConsentRequired": true,
  "jobLogsNeverStoreProviderSecrets": true,
  "failedJobsFallbackToDeterministicPack": true,
  "generatedImageAssetsCanChangeServerRules": false,
  "approvedAssetsRequireHumanSignoff": true,
  "candidateImagesGenerated": false
}
```

## GU-6 Post-Processing Contract Slice

The post-processing lane now has a deterministic contract layer for future approved image candidates. It builds a postprocess plan from the `AssetPromptPlan`, validates standalone plan/report schemas, records crop/resize/alpha/conversion policy, writes per-target visual sidecars, writes texture-atlas metadata, enforces per-target byte budgets, and falls back to deterministic runtime assets when candidate files or conversion are absent. The runner writes postprocessed candidate outputs only; it does not promote production assets or change server gameplay rules.

```json
{
  "assetPostprocessPlanSchemaExists": true,
  "assetPostprocessReportSchemaExists": true,
  "postprocessPipelineExists": true,
  "cropResizeAlphaPolicyRecorded": true,
  "webpPrimaryPngFallbackPolicyRecorded": true,
  "spriteAtlasMetadataExists": true,
  "visualManifestSidecarsExist": true,
  "assetBudgetPassedWhenOutputsUnderBudget": true,
  "oversizedOutputsFallback": true,
  "fallbackOnAssetFailure": true,
  "approvedProductionAssetCount": 0,
  "generatedImageAssetsCanChangeServerRules": false,
  "threejsPackedAssetLoadDeferredToGU7": true
}
```

## GU-7 Three.js Generated Pack Loader v2 Slice

The browser runtime now includes a generated-pack asset loader between pack contracts and Three.js rendering. The loader reads material fallback assets from `GeneratedAssetManifest`, reads planned texture targets from `AssetPromptPlan`, accepts only safe future public runtime asset paths, and reports texture load/fallback metrics through `sceneInfo.assetLoader`. When no approved public runtime assets exist, all planned texture targets are explicitly handled as deterministic fallbacks, so missing texture count remains zero and the first loop can still pass.

```json
{
  "assetAwareLoaderExists": true,
  "materialLoaderUsesGeneratedManifest": true,
  "plannedTextureTargetCount": 23,
  "safePublicRuntimeAssetPathsOnly": true,
  "runtimeAssetPathTraversalRejected": true,
  "missingTextureCount": 0,
  "handledMissingTextureCount": 23,
  "fallbackTextureCount": 23,
  "reducedMotionSupported": true,
  "performanceBudgetPassed": true,
  "firstLoopStillCompletes": true,
  "playtestMissingAssetsDerivedFromLoader": true
}
```

## GU-8 AI Playtest Harness Slice

The first-loop playtest gate now requires measured browser evidence before a generated pack can pass. The harness derives palette contrast, readability, style coherence, and prompt-alignment scores from the generated pack contract and browser runtime evidence, records screenshot evidence with a stable hash, fails bad contrast or invalid mapping packs, and preserves deterministic fallback playability by warning on handled fallback textures instead of requiring production image assets.

```json
{
  "firstLoopPlaytestAutomated": true,
  "measuredScoresRequired": true,
  "defaultScoresCannotPass": true,
  "badContrastPackRejected": true,
  "missingMappingPackRejected": true,
  "missingAssetFallbackWarningRecorded": true,
  "screenshotEvidenceRecorded": true,
  "consoleErrorGateExists": true,
  "firstLoopCompletionGateExists": true,
  "paletteContrastScoreMin": 0.85,
  "uiReadabilityScoreMin": 0.85,
  "styleCoherenceScoreMin": 0.85,
  "promptAlignmentScoreMin": 0.85
}
```
