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
| G1 | Schema suite and fixtures | 8 schemas exist, valid fixture passes, invalid fixtures fail |
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
  "assetPromptPlanAssetCount": 20,
  "candidateOutputPathCount": 40,
  "candidateFolderCount": 20,
  "generationJobLogCount": 20,
  "productionImageAssetCount": 0,
  "externalImageModelUsed": false,
  "explicitConsentRequiredForImageGeneration": true,
  "deterministicFallbackPlayable": true,
  "firstLoopCompleted": true,
  "replayabilityDistinctSignatureRatioMin": 1.0,
  "replayabilityDistinctThemeRatioMin": 0.75
}
```
