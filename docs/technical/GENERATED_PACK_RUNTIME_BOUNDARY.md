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
  "candidateFolderCount": 20,
  "generationJobLogCount": 20,
  "productionImageAssetCount": 0,
  "externalImageModelUsed": false,
  "replayabilityDistinctSignatureRatioMin": 1.0
}
```
