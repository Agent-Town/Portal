# Generated Pack Security Policy

Status: prototype-gated

## Hard Rules

- A generated pack is untrusted input until schema validation, content validation, asset manifest validation, and first-loop playtest pass.
- Generated packs cannot introduce tool handlers, formulas, script fields, eval fields, server-rule overrides, mutation handlers, or secret-like fields.
- Generated packs cannot store raw prompts as executable instructions. Runtime packs store a prompt hash, safe keyword hints, and a structured `GenerationBrief`.
- Generated packs cannot carry raw executable prompt instructions in generated copy, prompt metadata, asset manifests, or asset prompt-plan records.
- Asset manifests and asset prompt plans are allowlisted by canonical target, relative path, prompt hash, size, status, source, and no-production-image policy.
- Generated-pack subdocuments must pass the local schema registry independently before runtime validation can pass.
- Generated packs cannot store provider credentials, API keys, access tokens, refresh tokens, wallet secrets, Brain vault data, private event logs, or account recovery material.
- Scaffolded generation job logs must record `authMode=not_configured`, `externalImageGenerationUsed=false`, zero outputs, and no production approval until a separate consent/auth/cost model is approved.
- Optional candidate-generation preflights must fail closed unless product/security approval, documented auth model, documented cost model, accepted cost estimate, and user/team consent are all present.
- Candidate-generation preflight records must never persist raw provider credentials, and failure records must keep `fallbackStillPlayable=true` for valid deterministic packs.
- Postprocess plans and reports are standalone contracts; they may write postprocessed candidate artifacts and metadata, but must not write approved production assets or alter canonical gameplay mappings.
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
  "schemaRegistryExists": true,
  "schemasValidatedIndependently": true,
  "dangerousFieldRejectCountMin": 20,
  "candidateFolderCount": 23,
  "generationJobLogCount": 23,
  "jobLogsReplayableFromPromptPlan": true,
  "candidateGenerationPreflightExists": true,
  "generationDisabledWithoutConsentAuthCost": true,
  "productSecurityApprovalRequired": true,
  "assetPostprocessPlanExists": true,
  "assetPostprocessReportExists": true,
  "postprocessedOutputsStayCandidateOnly": true,
  "approvedProductionAssetCount": 0,
  "generatedImageAssetsCanChangeServerRules": false,
  "productionImageAssetCount": 0,
  "externalImageModelUsed": false,
  "explicitConsentRequiredForImageGeneration": true,
  "fallbackVerified": true,
  "humanReviewComplete": true,
  "publicReleaseEligible": true
}
```
