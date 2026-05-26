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
- Browser runtime asset loading must use safe public generated-pack paths only; private candidate roots, path traversal, data URLs, provider URLs, and unapproved outputs must fall back without player exposure.
- First-loop playtest pass status requires measured browser evidence, screenshot evidence, clean console state, canonical payload integrity, and generated-pack validation. Default or placeholder scores cannot pass release gates.
- Replayability diversity pass status requires the ten-prompt seed suite, measured first-loop pass evidence, distinct replayability signatures, screenshot-hash comparison, and zero forbidden authority or raw prompt leaks.
- Generated-pack exports must redact owner/session/private identifiers, omit raw prompts, include a content hash, and reject import if the hash or generated-pack validation fails.
- Public pack cards must be unlisted by ID, auth-free only for read, generated from validated packs, backed by screenshot evidence, and rejected if raw prompts, Brain/provider/debug/wallet terms, private identifiers, or executable instructions appear.
- Curated public gallery entries must be approved-card derivatives with moderation metadata, reviewer signoff, tags, screenshot metadata, asset summary, and zero private-state fields; pending, rejected, and unpublished cards must not appear.
- Approved generated-pack modifiers must be enum-only, presentation-scoped, and balance-simulated; unknown modifiers, formula strings, custom resource math, mutation tools, custom permissions, custom agent authority, and nonzero canonical rule impact are forbidden.
- Generated tech flavor trees must map every node to an approved canonical capability/effect pair; missing effects, custom effects, custom mechanics, formulas, changed unlock rules, V6 civic changes, and hidden progression authority are forbidden.
- Generated requester voice packs must map every contract flavor template to approved canonical contract/action pairs; missing mappings, unknown contracts/actions, hidden mechanics, reward deltas, formulas, mutation authority, secret-like fields, raw executable instructions, and provider/debug jargon are forbidden.
- Generated inhabitant style overlays must remain passive visual actors only; unknown roles, autonomous-agent claims, hidden simulation, resource mutation, tool authority, unsafe text, per-inhabitant external model use, and actor counts above budget are forbidden.
- Generated multi-surface compatibility profiles must remain visual-only across Z1 settlement, Z2 region, route, public-card, and sandbox surfaces; private public-card data, unsafe sandbox labels, V5 tool changes, server-rule changes, unknown surfaces, formulas, and tool authority are forbidden.
- Player-visible generated text must be escaped in DOM rendering.
- Production image generation requires explicit consent and a documented cost/auth model before any user-facing release claim.
- Public release eligibility must come from the standalone `productionReleaseGate` report, which fails closed unless every prerequisite, explicit approval, candidate review, and human signoff is present.

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
  "productionReleaseGateSchemaExists": true,
  "releaseGateFeatureGated": true,
  "releaseModeWhenIncomplete": "prototype-gated",
  "failClosedWithoutApprovals": true,
  "blockingReasonsMatchFailedPrerequisites": true,
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
  "assetAwareLoaderExists": true,
  "runtimeAssetPathTraversalRejected": true,
  "missingTextureCount": 0,
  "handledMissingTextureCount": 23,
  "firstLoopPlaytestAutomated": true,
  "measuredScoresRequired": true,
  "defaultScoresCannotPass": true,
  "badContrastPackRejected": true,
  "screenshotEvidenceRecorded": true,
  "replayabilityPromptCount": 10,
  "replayabilityValidPackCount": 10,
  "replayabilityFirstLoopPassCount": 10,
  "meaningfulDifferenceScoreMin": 0.65,
  "replayabilityForbiddenAuthorityCount": 0,
  "durablePackStorage": true,
  "exportImportRoundTrip": true,
  "invalidImportRejected": true,
  "remixLineageRecorded": true,
  "privateDataLeakCount": 0,
  "publicCardSchemaExists": true,
  "authNotRequiredForPublicCard": true,
  "promptKeywordHintsOnly": true,
  "publicCardScreenshotPresent": true,
  "unsafePackCardRejected": true,
  "publicGallerySchemaExists": true,
  "authNotRequiredForPublicGallery": true,
  "approvedOnlyGallery": true,
  "moderationMetadataRequired": true,
  "unpublishWorks": true,
  "approvedModifierSchemaExists": true,
  "enumOnlyModifiers": true,
  "formulaInjectionRejected": true,
  "balanceSimulationPassed": true,
  "canonicalRulesPreserved": true,
  "techFlavorTreeSchemaExists": true,
  "canonicalEffectCoverage": 1.0,
  "customEffectCount": 0,
  "generatedTechNamesVisible": true,
  "unlockRulesPreserved": true,
  "requesterVoicePackSchemaExists": true,
  "requesterArchetypesGenerated": true,
  "contractFlavorGenerated": true,
  "canonicalContractCoverage": 1.0,
  "canonicalContractRulesPreserved": true,
  "unsafeTextRejectCount": 0,
  "cloverIdentityStable": true,
  "cachedRewriteDisabled": true,
  "inhabitantOverlaySchemaExists": true,
  "inhabitantsAreVisualActorsOnly": true,
  "serverStateAuthorityPreserved": true,
  "actorBudgetPassed": true,
  "generatedStyleApplied": true,
  "inhabitantSpritePromptCount": 4,
  "externalModelPerInhabitant": false,
  "inhabitantResourceMutationCount": 0,
  "multiSurfaceCompatibilitySchemaExists": true,
  "z1Z2Compatibility": true,
  "publicCardSafe": true,
  "sandboxSkinSafe": true,
  "v5ToolsUnaffected": true,
  "serverRuleChangeCount": 0,
  "approvedProductionAssetCount": 0,
  "generatedImageAssetsCanChangeServerRules": false,
  "productionImageAssetCount": 0,
  "externalImageModelUsed": false,
  "explicitConsentRequiredForImageGeneration": true,
  "costConsentModelApproved": true,
  "candidateAssetsReviewed": true,
  "fallbackVerified": true,
  "humanReviewComplete": true,
  "publicReleaseEligible": true
}
```
