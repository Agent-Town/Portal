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
| G19 | Generation cost/auth/consent model | Versioned release approval evidence and candidate-review manifest; consent, cost estimate, candidate review, human signoff, no secret logs |
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
  "rawInstructionKeyRedacted": true,
  "rawExecutablePromptInstructionCount": 0,
  "secretLikeFieldCount": 0,
  "secretLikeKeyRedacted": true,
  "secretLikeValueRejected": true,
  "candidateGenerationUnsafeKeyValueRedacted": true,
  "candidateGenerationExpandedCredentialFamiliesRejected": true,
  "releaseEvidenceUnsafeKeyValueRedacted": true,
  "unsafeTargetLabelRedacted": true,
  "unsafeHashAndPackIdRedacted": true,
  "presentationReportUnsafeValueRedacted": true,
  "coreContractReportUnsafeValueRedacted": true,
  "aggregateReportUnsafeValueRedacted": true,
  "releaseGateReportUnsafeValueRedacted": true,
  "releaseEvidenceBundleReportUnsafeValueRedacted": true,
  "generatedPackApiErrorDetailsRedacted": true,
  "credentialPromptFragmentsRedacted": true,
  "expandedCredentialPromptFamiliesRedacted": true,
  "releaseApiExpandedCredentialFamiliesRejected": true,
  "canonicalMappingCoverage": 1.0,
  "arbitraryToolMutationFormulaCount": 0,
  "invalidAssetManifestEntryCount": 0,
  "assetPromptPlanCoverage": 1.0,
  "assetPromptPlanAssetCount": 23,
  "candidateOutputPathCount": 23,
  "candidateFolderCount": 23,
  "generationJobLogCount": 23,
  "candidateGenerationJobLogWritablePathsCandidateOnly": true,
  "candidateGenerationAdapterPathsPreflighted": true,
  "productionImageAssetCount": 0,
  "externalImageModelUsed": false,
  "explicitConsentRequiredForImageGeneration": true,
  "candidateGenerationPreflightExists": true,
  "candidateGenerationBlockedWithoutConsentAuthCost": true,
  "assetPostprocessPlanExists": true,
  "assetPostprocessReportExists": true,
  "assetPostprocessUnsafeSchemaErrorsRedacted": true,
  "assetPostprocessWritablePathsCandidateOnly": true,
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
  "replayabilityPromptCount": 10,
  "replayabilityValidPackCount": 10,
  "replayabilityFirstLoopPassCount": 10,
  "meaningfulDifferenceScoreMin": 0.65,
  "replayabilityScreenshotHashCount": 10,
  "forbiddenAuthorityCount": 0,
  "replayabilityDistinctSignatureRatioMin": 1.0,
  "replayabilityDistinctThemeRatioMin": 0.75
}
```

## GU-2 Schema Validation Engine Slice

The first production-roadmap continuation adds a local JSON Schema registry and runner for generated-pack subdocuments. The runner validates the pack, brief, style bible, universe bible, gameplay mapping, asset prompt plan, and asset manifest independently before a generated pack can pass validation. Core contract validation reports redact unsafe submitted generation-brief, asset-manifest, and asset-prompt-plan measured metadata values. Aggregate generated-pack validation reports also redact unsafe submitted schema-version, mapping-id, palette, and scaffold metadata values. Credential-like prompt spans are marked for review and removed before runtime keyword extraction so secret fragments cannot become generated runtime labels. Expanded credential-token families, including GitHub OAuth/app tokens, GitLab PATs, Google API keys, AWS access-key IDs, Slack token prefixes, Stripe key prefixes, and JWT-shaped values, are stripped through the same shared matcher before API generation builds pack copy.

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
  "runtimeRejectsInvalidPack": true,
  "credentialPromptFragmentsRedacted": true,
  "expandedCredentialPromptFamiliesRedacted": true
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

Candidate-generation run reports and asset-generation job logs now have strict schemas. The run report carries a stable hash, bounded integer rate/retry/count policy, redacted consent/cost/auth evidence, canonical mapping fingerprints, prompt-plan target checks, and zero production-promotion claims. Job-log validation enforces safe candidate/approved paths, known canonical prompt-plan targets, candidate-only output status, no raw prompt instructions, no secret-like fields or values, expanded credential-token-family rejection, no production assets, and status/output-count coherence. The preflight runner also rejects tampered job-log, candidate-output, or approved-output paths before writing evidence outside generated-pack roots, and rejects root-tampered candidate-output paths before invoking any approved adapter even when job-log writing is disabled. Validation reports must redact submitted secret-looking keys, secret-looking values, expanded credential-token-family values, raw-instruction keys, executable instruction values, unsafe canonical target labels, and unsafe measured metadata values from content, schema-error, and measured-problem evidence.

```json
{
  "optionalGenerationCommandExists": true,
  "candidateGenerationRunSchemaExists": true,
  "assetGenerationJobLogSchemaExists": true,
  "candidateGenerationRunHashStable": true,
  "assetGenerationJobLogPathsSafe": true,
  "candidateGenerationRunCanonicalTargetProblemCount": 0,
  "assetGenerationJobLogTargetDriftCount": 0,
  "integerCounterValidation": true,
  "generationDisabledWithoutConsentAuthCost": true,
  "productSecurityApprovalRequired": true,
  "authModelDocumentedRequired": true,
  "costConsentRequired": true,
  "jobLogsNeverStoreProviderSecrets": true,
  "failedJobsFallbackToDeterministicPack": true,
  "generatedImageAssetsCanChangeServerRules": false,
  "approvedAssetsRequireHumanSignoff": true,
  "assetGenerationJobLogSecretLikeCount": 0,
  "candidateGenerationExpandedCredentialFamiliesRejected": true,
  "assetGenerationJobLogRawInstructionCount": 0,
  "candidateGenerationUnsafeReportEchoCount": 0,
  "candidateImagesGenerated": false
}
```

## GU-6 Post-Processing Contract Slice

The post-processing lane now has a deterministic contract layer for future approved image candidates. It builds a postprocess plan from the `AssetPromptPlan`, validates standalone plan/report schemas, redacts unsafe submitted schema-error paths and actual values from plan/report diagnostics, enforces candidate-only writable roots before sidecar, atlas, or processed-output writes, records crop/resize/alpha/conversion policy, writes per-target visual sidecars, writes texture-atlas metadata, enforces per-target byte budgets, and falls back to deterministic runtime assets when candidate files or conversion are absent. The runner writes postprocessed candidate outputs only; it does not promote production assets or change server gameplay rules.

```json
{
  "assetPostprocessPlanSchemaExists": true,
  "assetPostprocessReportSchemaExists": true,
  "assetPostprocessUnsafeSchemaErrorsRedacted": true,
  "assetPostprocessWritablePathsCandidateOnly": true,
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

## GU-9 Replayability and Diversity Suite

The replayability suite now uses the roadmap ten-prompt seed set as a deterministic contract. Each prompt must generate a schema-valid pack, pass the measured first-loop playtest report, keep raw prompt instructions and forbidden authority out of the generated pack, produce a distinct replayability signature, and contribute to pairwise diversity measurements across palette, label/name, motif, and screenshot hash evidence. Diversity reports redact unsafe submitted pack ids, prompt hashes, and replayability signatures from pack-level and pairwise evidence.

```json
{
  "promptCount": 10,
  "validPackCount": 10,
  "firstLoopPassCount": 10,
  "pairwiseComparisonCount": 45,
  "uniqueReplayabilitySignatures": 10,
  "uniqueScreenshotHashes": 10,
  "minimumPaletteDistanceGreaterThan": 0,
  "minimumLabelNameDistanceMin": 0.65,
  "meaningfulDifferenceScoreMin": 0.65,
  "forbiddenAuthorityCount": 0,
  "rawPromptLeakCount": 0,
  "unsafeDiversityReportValueRedacted": true
}
```

## GU-10 Pack Save, Reload, and Remix Slice

Generated packs now have a durable ignored-data contract for prototype reload, export/import, and remix lineage. The store writes validated pack records under the generated-pack durable root, reloads the current pack after memory reset, falls back to the current durable pack when a requested pack is missing, exports a redacted owner-safe envelope, imports only hash-valid exports, and records remix parent/root/generation metadata without changing canonical world rules.

```json
{
  "durablePackStorage": true,
  "samePromptSameOwnerStablePack": true,
  "restartReloadPass": true,
  "exportImportRoundTrip": true,
  "invalidImportRejected": true,
  "remixLineageRecorded": true,
  "migrationVersion": 1,
  "missingPackFallback": true,
  "privateDataLeakCount": 0,
  "rawPromptStored": false
}
```

## GU-11 Public-Safe Pack Cards Slice

Generated packs can now publish an unlisted public card after a measured playtest screenshot exists. Publishing remains authenticated and feature-gated, but the card read endpoint is auth-free by card ID. Cards include generated title, style summary, prompt keyword hints only, screenshot metadata, asset-manifest summary, and moderation metrics. Raw prompts, Brain/provider/debug/wallet fields, account/session identifiers, and unsafe card content fail moderation, and validation reports redact unsafe submitted asset-summary values from measured evidence.

```json
{
  "publicCardSchemaExists": true,
  "authNotRequiredForPublicCard": true,
  "publicCardPublishFeatureGated": true,
  "generatedTitlePresent": true,
  "styleSummaryPresent": true,
  "promptKeywordHintsOnly": true,
  "assetManifestSummaryPresent": true,
  "screenshotPresent": true,
  "unsafePackCardRejected": true,
  "unsafeAssetSummaryValueRedacted": true,
  "privateDataLeakCount": 0,
  "rawPromptStored": false
}
```

## GU-12 Curated Pack Gallery Slice

Approved public cards can now be promoted into a public-safe curated gallery without exposing generated-pack records, owner/session identifiers, raw prompts, Brain/provider/debug fields, or private review notes. Gallery review and unpublish controls remain authenticated and generated-pack feature-gated. The gallery read route is auth-free, returns only approved entries, supports search/filter/sort/pagination, requires moderation metadata plus reviewer signoff, and removes unpublished cards from public lookup and gallery results.

```json
{
  "publicGallerySchemaExists": true,
  "approvedOnlyGallery": true,
  "pendingRejectedHidden": true,
  "authNotRequiredForPublicGallery": true,
  "galleryReviewFeatureGated": true,
  "moderationMetadataRequired": true,
  "reviewerSignoffRequired": true,
  "packTagsPresent": true,
  "searchFilterSortPagination": true,
  "unpublishWorks": true,
  "publicCardRemovedOnUnpublish": true,
  "privateDataLeakCount": 0,
  "rawPromptStored": false
}
```

## GU-13 Approved Modifier System Slice

Generated packs now include an `approvedModifiers` contract that can influence presentation feel only through approved enum values. The selected modifiers are deterministic, schema-validated, and projected into a read-only modifier view that may add flavor/tutorial/cosmetic copy while preserving canonical claim costs, mechanical keys, server rules, permissions, and tools. Unknown modifiers, formula fields, custom resource math, mutation authority, custom permissions, and agent authority fail validation, and validation reports redact unsafe submitted unknown enum values.

```json
{
  "approvedModifierSchemaExists": true,
  "enumOnlyModifiers": true,
  "unknownModifierRejected": true,
  "formulaInjectionRejected": true,
  "customResourceMathRejected": true,
  "customMutationToolRejected": true,
  "customPermissionRejected": true,
  "balanceSimulationPassed": true,
  "canonicalRulesPreserved": true,
  "claimCostHashPreserved": true,
  "firstLoopStillCompletes": true,
  "privateDataLeakCount": 0,
  "unsafeUnknownModifierValueRedacted": true
}
```

## GU-14 Generated Tech Flavor Tree Slice

Generated packs now include a strict `techFlavorTree` contract that renames and reframes canonical progression without adding unlock rules or custom effects. Every generated tech node maps to an approved canonical capability/effect pair, carries generated name and lore text, records metadata-only V3/V5 compatibility hooks, and proves through balance simulation that canonical unlock effects, first-loop viability, and V6 civic mechanics remain unchanged. Validation reports redact unsafe submitted effect IDs and balance hashes from measured evidence.

```json
{
  "techFlavorTreeSchemaExists": true,
  "canonicalEffectCoverage": 1.0,
  "missingCanonicalEffectsRejected": true,
  "customEffectCount": 0,
  "customMechanicsRejected": true,
  "generatedTechNamesVisible": true,
  "unlockRulesPreserved": true,
  "v5WorldGridCompatible": true,
  "v6CivicMechanicsTouched": false,
  "unsafeTechFlavorReportValueRedacted": true,
  "firstLoopStillCompletes": true
}
```

## GU-15 Generated Requesters, Contracts, and Voices Slice

Generated packs now include a `requesterVoicePack` contract for presentation-only requester archetypes, canonical contract flavor templates, town murmurs, and Clover style-aware copy. Each contract template maps to one approved canonical contract/action pair and proves through balance simulation that no hidden mechanics, formulas, reward changes, or V6 civic authority were introduced. The cached LLM rewrite path remains a disabled future hook requiring explicit consent and cost approval before use. Validation reports redact unsafe submitted Clover voice and rewrite-policy values from measured evidence.

```json
{
  "requesterVoicePackSchemaExists": true,
  "requesterArchetypesGenerated": true,
  "contractFlavorGenerated": true,
  "canonicalContractCoverage": 1.0,
  "canonicalContractRulesPreserved": true,
  "hiddenContractMechanics": 0,
  "unsafeTextRejectCount": 0,
  "townMurmurTemplateCountMin": 3,
  "cloverIdentityStable": true,
  "cachedRewriteDisabled": true,
  "externalModelUsed": false,
  "unsafeVoiceReportValueRedacted": true,
  "firstLoopStillCompletes": true
}
```

## GU-16 Town Life + Inhabitant Style Overlay Slice

Generated packs now include an `inhabitantStyleOverlay` contract for passive town-life visual actors. The overlay can name and style workers, haulers, messengers, and farmers, scaffold future sprite prompts, and add short voice templates, but every role is visual-only, reads server-owned state, has no resource mutation authority, and cannot become an autonomous agent. Browser rendering uses a small generated-pack-only stage overlay with reduced-motion static markers. Validation reports redact unsafe submitted policy and balance values from measured evidence.

```json
{
  "inhabitantOverlaySchemaExists": true,
  "inhabitantsAreVisualActorsOnly": true,
  "serverStateAuthorityPreserved": true,
  "actorBudgetPassed": true,
  "generatedStyleApplied": true,
  "inhabitantRoleCount": 4,
  "inhabitantSpritePromptCount": 4,
  "externalModelPerInhabitant": false,
  "resourceMutationCount": 0,
  "reducedMotionFallback": "static-markers",
  "unsafeInhabitantReportValueRedacted": true,
  "firstLoopStillCompletes": true
}
```

## GU-17 World Grid and Multi-Settlement Compatibility Slice

Generated packs now include a `multiSurfaceCompatibility` contract that maps one universe across Z1 settlement nodes, Z2 region grids, route edges, public pack cards, and sandbox districts. Each surface skin is visual-only, reads existing server-owned state, carries public-safe generated names, and records no V5 tool or server-rule impact. Public card copy can use the generated card skin while preserving screenshot, prompt-hint, and private-data redaction gates. Validation reports redact unsafe submitted multi-town naming values from measured evidence.

```json
{
  "multiSurfaceCompatibilitySchemaExists": true,
  "z1Z2Compatibility": true,
  "surfaceSkinCount": 5,
  "multiTownNamesGenerated": 6,
  "publicCardSafe": true,
  "sandboxSkinSafe": true,
  "v5ToolsUnaffected": true,
  "serverRuleChangeCount": 0,
  "unsafeTextRejectCount": 0,
  "unsafeNamingValueRedacted": true,
  "firstLoopStillCompletes": true
}
```

## GU-18 Production Release Gate Slice

Generated packs now have a standalone `productionReleaseGate` contract for controlled player-facing readiness. The gate is a report, not a generated-pack subdocument and not default gameplay visibility. It evaluates strict schemas, safety/moderation, measured first-loop evidence, asset manifest and prompt-plan validity, deterministic fallback safety, ten-prompt diversity that includes the release pack, same-pack durable save/reload/import evidence, same-pack public-card privacy, candidate asset review, explicit auth/cost/consent approval, and human review signoff. It fails closed by default: missing approval evidence produces a valid `prototype-gated` report with blocking reasons, not a public release claim.

Release approval is now a versioned evidence object, not a loose set of booleans. `release_approval_evidence.schema.json` records an auth model, cost model, consent record, candidate-review coverage, human release review, hard boundary constraints, and a stable `evidenceHash`. Approved, accepted, recorded, reviewed, and complete approval events must include timestamps no later than the evidence creation time, and accepted cost evidence must include a nonzero max estimate so no-op/default budgets cannot satisfy cost approval. `candidate_review_manifest.schema.json` records per-target candidate review decisions and its `manifestHash` must match the candidate-manifest hash recorded inside approval evidence before candidate assets count as reviewed. Candidate-review manifest metrics must match actual row review statuses, candidate-review approval evidence must also be timestamp-ordered after the manifest creation time, its expected/reviewed/approved/rejected counts must match the matching manifest metrics, its approved/rejected disposition total must exactly match the reviewed-candidate count, and approved or rejected candidate rows must have actual candidate content metadata rather than planned-only placeholders. The production release gate records and validates generated-pack id shape, diversity pack inclusion, diversity metric-to-row coherence, same-pack persistence evidence, same-pack public-card evidence, and a non-future evaluation timestamp. Public eligibility ignores `approvalInputs` unless they match the derived evidence summary, and unsafe evidence or review manifests with secret-like fields, secret-looking values, raw prompt instructions, hash drift, invalid release-gate pack ids, diversity evidence that excludes the release pack, metric-only diversity claims, mixed persistence evidence, mixed public-card evidence, future-dated approvals, future-dated release gates, mixed pack ids, zero-cost approval evidence, stale candidate-review timing, planned-only candidate approvals, short candidate-review coverage, approval-evidence/manifest candidate-count drift, incoherent candidate-review disposition counts, candidate-review metric/row-status drift, production image promotion, normal gameplay exposure, canonical rule changes, or V6 civic changes fail validation. Standalone evidence validation reports redact submitted secret-looking keys, secret-looking values, raw-instruction keys, executable instruction values, manifest hashes, evidence hashes, and pack ids from content, schema-error, and measured evidence. Production release-gate validation reports also redact unsafe submitted release modes, prerequisite keys, blocking reasons, approval fields, and metric values before returning diagnostics.

```json
{
  "productionReleaseGateSchemaExists": true,
  "releaseApprovalEvidenceSchemaExists": true,
  "candidateReviewManifestSchemaExists": true,
  "releaseGateFeatureGated": true,
  "invalidReleaseGatePackIdRejected": true,
  "diversityPackIdMatches": true,
  "diversityReportMetricsCoherent": true,
  "metricOnlyDiversityClaimRejected": true,
  "mixedDiversityEvidenceRejected": true,
  "persistencePackIdMatches": true,
  "mixedPersistenceEvidenceRejected": true,
  "publicCardPackIdMatches": true,
  "mixedPublicCardEvidenceRejected": true,
  "looseApprovalBooleansIgnored": true,
  "approvalInputsDerivedFromEvidence": true,
  "approvalEvidenceSecretLikeCount": 0,
  "approvalEvidenceRawInstructionCount": 0,
  "approvalEvidenceHashMatches": true,
  "approvalEvidencePackIdMatches": true,
  "approvalEvidenceTimestampProblemCount": 0,
  "futureDatedApprovalEvidenceRejected": true,
  "releaseGateEvaluatedAtNotFuture": true,
  "futureDatedReleaseGateRejected": true,
  "releaseGateReportUnsafeValueRedacted": true,
  "zeroCostApprovalEvidenceRejected": true,
  "mixedPackApprovalEvidenceRejected": true,
  "candidateReviewManifestHashMatchesEvidence": true,
  "candidateReviewManifestTimeMatchesEvidence": true,
  "candidateReviewManifestCountsMatchEvidence": true,
  "staleCandidateReviewEvidenceRejected": true,
  "plannedOnlyReviewedCandidateRejected": true,
  "plannedOnlyReviewedCandidateCount": 0,
  "reviewedCandidateContentCountMin": 23,
  "candidateReviewManifestProductionImageAssetCount": 0,
  "candidateReviewCoverageCountMin": 23,
  "candidateReviewDispositionCountsCoherent": true,
  "incoherentCandidateReviewDispositionRejected": true,
  "candidateReviewRowStatusCountsMatch": true,
  "candidateReviewMetricDriftRejected": true,
  "approvalEvidenceManifestCandidateCountDriftRejected": true,
  "schemaValid": true,
  "moderationPassed": true,
  "playtestPassed": true,
  "assetManifestValid": true,
  "fallbackVerified": true,
  "diversitySuitePassed": true,
  "packSaveReloadPassed": true,
  "publicCardPrivacyPassed": true,
  "costConsentModelApproved": true,
  "costEstimateHasNonZeroBudget": true,
  "candidateAssetsReviewed": true,
  "privateDataLeakCount": 0,
  "humanReviewComplete": true,
  "blockingReasonsMatchFailedPrerequisites": true,
  "failClosedWithoutApprovals": true,
  "publicReleaseEligible": true
}
```

## GU-19 Tamper-Evident Release Evidence Bundle Slice

Release gates now have a companion `releaseEvidenceBundle` contract. The bundle is evidence-only: it does not approve production release, promote assets, expose generated packs in default gameplay, or alter server rules. It records stable hashes for the generated pack, measured playtest report, replayability diversity report, public card, persistence report, release approval evidence, candidate-review manifest, and release gate. It also records schema-bounded `sourcePackIds`, bundle/gate timestamp ordering, blocking-reason binding, release-prerequisite snapshot binding, ready-evidence source binding, release-gate hash-match binding, generated-pack-source validation, playtest-source validation, persistence-source validation, public-card-source validation, approval-evidence-source validation, candidate-review manifest source validation, diversity-source pack inclusion/coherence, and candidate-review manifest hash/time/count-match metrics so single-pack evidence cannot be mixed into another pack's ready-gate bundle and review-order or count-match evidence cannot be hidden even when the supplied source hashes are stable. A release evidence bundle must be validated with its bound release gate, and a ready gate requires every source hash to be present and to match the supplied source evidence and bound release gate; fail-closed bundles also reject hashes or pack ids claimed for unsupplied sources. Missing release-gate context, missing sources, unsupplied source hashes, unsupplied source pack ids, drifted evidence, invalid source pack-id shapes, mismatched pack ids, bundles that predate the gate, forged blocking reasons, forged prerequisite snapshots, failing generated-pack sources, failing playtest sources, failing persistence sources, failing public-card sources, failing approval-evidence sources, failing candidate-review manifest sources, copied diversity reports, approval evidence drift from the gate, tampered release-gate hash-match metrics, tampered candidate-review time-order metrics, or tampered candidate-review count-match metrics fail validation. Bundle validation reports redact unsafe submitted bundle hashes, source pack ids, release modes, prerequisite keys, blocking reasons, boundary values, and metric values from measured evidence.

The evidence bundle has a generated-pack feature-gated API endpoint for QA review: `POST /api/world/generated-pack/release-evidence-bundle`. The endpoint returns the release gate, release-gate validation, hash-bound bundle, and bundle validation report. It remains hidden unless `FEATURE_WORLD_GRID_GENERATED_PACKS` is enabled and does not approve public release by itself.

Release-gate API ingress, including the generic tool dispatcher, now rejects secret-like fields, semantic token field names, secret-looking keys or values, expanded credential-token families, raw executable prompt-instruction keys, executable instruction text, oversized object keys, and oversized/noisy evidence bodies before building or echoing release reports. Rejection responses include counts, limits, and safe field paths only, not submitted secret, token field, instruction, oversized key, or evidence values.

Generated-pack API error responses redact unsafe submitted pack ids, public-card ids, and route/tool detail values before returning diagnostics, so missing-pack and missing-card errors cannot echo raw instructions or secret-looking strings.

```json
{
  "releaseEvidenceBundleSchemaExists": true,
  "releaseGateHashStable": true,
  "releaseGateHashMatches": true,
  "releaseGateHashMetricTamperRejected": true,
  "sourceHashCount": 7,
  "sourceHashMismatchCount": 0,
  "sourcePackIdMismatchCount": 0,
  "readyGateRequiresAllSourceEvidence": true,
  "releaseGateContextRequired": true,
  "unsuppliedSourceHashRejected": true,
  "unsuppliedSourcePackIdRejected": true,
  "sourceDriftRejected": true,
  "mixedPackEvidenceRejected": true,
  "invalidSourcePackIdShapeRejected": true,
  "bundleCreatedAtOrAfterGate": true,
  "preGateReleaseBundleRejected": true,
  "bundleCreatedAtNotFuture": true,
  "futureDatedReleaseBundleRejected": true,
  "blockingReasonsMatchGate": true,
  "forgedBlockingReasonsRejected": true,
  "prerequisiteSnapshotMatchesGate": true,
  "forgedPrerequisiteSnapshotRejected": true,
  "readyEvidenceSourcesMatchGate": true,
  "generatedPackSourcePassed": true,
  "failingGeneratedPackSourceRejected": true,
  "playtestSourcePassed": true,
  "failingPlaytestSourceRejected": true,
  "persistenceSourcePassed": true,
  "failingPersistenceSourceRejected": true,
  "publicCardSourcePassed": true,
  "failingPublicCardSourceRejected": true,
  "approvalEvidenceSourcePassed": true,
  "failingApprovalEvidenceSourceRejected": true,
  "candidateReviewManifestSourcePassed": true,
  "failingCandidateReviewManifestSourceRejected": true,
  "diversitySourceIncludesGatePack": true,
  "diversitySourceMetricsCoherent": true,
  "validationReportSourceMetricsMirrored": true,
  "mixedDiversitySourceRejected": true,
  "approvalEvidenceGateDriftRejected": true,
  "candidateReviewManifestHashMatchesEvidence": true,
  "candidateReviewManifestTimeMatchesEvidence": true,
  "candidateReviewManifestCountsMatchEvidence": true,
  "candidateReviewManifestTimeMetricTamperRejected": true,
  "candidateReviewManifestCountMetricTamperRejected": true,
  "releaseEvidenceBundleApiFeatureGated": true,
  "failClosedBundleApiValid": true,
  "releaseApiRequestBounded": true,
  "releaseApiOversizedEvidenceRejected": true,
  "releaseApiOversizedKeyRedacted": true,
  "releaseApiSemanticSecretKeyRedacted": true,
  "releaseApiSecretValueRejected": true,
  "releaseApiSecretKeyRedacted": true,
  "releaseApiExpandedCredentialFamiliesRejected": true,
  "releaseApiSecretEchoCount": 0,
  "releaseApiRawInstructionKeyRedacted": true,
  "releaseApiExecutableInstructionValueRejected": true,
  "releaseApiRawInstructionEchoCount": 0,
  "unsafeHashAndPackIdRedacted": true,
  "releaseEvidenceBundleReportUnsafeValueRedacted": true,
  "generatedPackApiErrorDetailsRedacted": true,
  "releaseApiOversizedEvidenceEchoCount": 0,
  "productionImageAssetCount": 0,
  "privateDataLeakCount": 0,
  "canonicalServerRulesChanged": false,
  "v6CivicMechanicsTouched": false,
  "normalGameplayVisibilityChanged": false,
  "generatedPackDefaultExposure": false
}
```
