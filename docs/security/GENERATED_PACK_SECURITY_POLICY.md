# Generated Pack Security Policy

Status: prototype-gated

## Hard Rules

- A generated pack is untrusted input until schema validation, content validation, asset manifest validation, and first-loop playtest pass.
- Generated packs cannot introduce tool handlers, formulas, script fields, eval fields, server-rule overrides, mutation handlers, or secret-like fields.
- Generated packs cannot store raw prompts as executable instructions. Runtime packs store a prompt hash, safe keyword hints, and a structured `GenerationBrief`.
- Generated packs cannot carry raw executable prompt instructions in generated copy, prompt metadata, asset manifests, or asset prompt-plan records.
- Asset manifests and asset prompt plans are allowlisted by canonical target, relative path, prompt hash, size, status, source, and no-production-image policy.
- Generated packs cannot store provider credentials, API keys, access tokens, refresh tokens, wallet secrets, Brain vault data, private event logs, or account recovery material.
- Player-visible generated text must be escaped in DOM rendering.
- Production image generation requires explicit consent and a documented cost/auth model before any user-facing release claim.

## Release Gate

```json
{
  "schemaValid": true,
  "moderationPassed": true,
  "playtestPassed": true,
  "assetManifestValid": true,
  "assetPromptPlanValid": true,
  "secretLeakCount": 0,
  "rawExecutablePromptInstructionCount": 0,
  "arbitraryToolMutationFormulaCount": 0,
  "candidateFolderCount": 20,
  "generationJobLogCount": 20,
  "productionImageAssetCount": 0,
  "externalImageModelUsed": false,
  "explicitConsentRequiredForImageGeneration": true,
  "fallbackVerified": true,
  "humanReviewComplete": true,
  "publicReleaseEligible": true
}
```
