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

## Machine Checks

```json
{
  "defaultPackLoads": true,
  "generatedPackLoads": true,
  "packSwitchWithRouteReload": true,
  "consoleErrors": 0,
  "missingTextures": 0,
  "visiblePackDifferenceScoreMin": 0.65,
  "canonicalPayloadIntegrity": true
}
```

