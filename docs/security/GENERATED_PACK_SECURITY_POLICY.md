# Generated Pack Security Policy

Status: prototype-gated

## Hard Rules

- A generated pack is untrusted input until schema validation, content validation, asset manifest validation, and first-loop playtest pass.
- Generated packs cannot introduce tool handlers, formulas, script fields, eval fields, server-rule overrides, mutation handlers, secret-like fields, secret-looking object keys, or secret-looking values.
- Generated packs cannot store raw prompts or raw-instruction object keys as executable instructions. Runtime packs store a prompt hash, safe keyword hints, and a structured `GenerationBrief`.
- Generated packs cannot carry raw executable prompt instructions in generated copy, prompt metadata, asset manifests, or asset prompt-plan records.
- Asset manifests and asset prompt plans are allowlisted by canonical target, relative path, prompt hash, size, status, source, and no-production-image policy.
- Generated-pack subdocuments must pass the local schema registry independently before runtime validation can pass.
- Generated packs cannot store provider credentials, API keys, access tokens, refresh tokens, session/auth/id/bearer/provider tokens, wallet secrets, Brain vault data, private event logs, account recovery material, or secret-looking credential strings under harmless generated-copy keys.
- Credential-like prompt spans, including expanded GitHub, GitLab, Google, AWS, Slack, Stripe, and JWT-shaped token families, must be marked for review and stripped before runtime keyword extraction so secret fragments cannot become generated labels, names, titles, or hints.
- Scaffolded generation job logs must record `authMode=not_configured`, `externalImageGenerationUsed=false`, zero outputs, and no production approval until a separate consent/auth/cost model is approved.
- Optional candidate-generation preflights must fail closed unless product/security approval, documented auth model, documented cost model, accepted cost estimate, and user/team consent are all present.
- Candidate-generation preflights must reject tampered job-log, candidate-output, or approved-output paths before writing job-log evidence outside the generated-pack candidate roots.
- Candidate-generation preflights must reject root-tampered candidate-output paths before invoking an approved adapter, even when job-log writing is disabled.
- Candidate-generation preflight records must never persist raw provider credentials, and failure records must keep `fallbackStillPlayable=true` for valid deterministic packs.
- Candidate-generation run and job-log validation reports must reject and redact submitted secret-looking keys, secret-looking values, expanded credential-token-family values, raw-instruction keys, and executable instruction values from both content checks and schema-error paths.
- Asset prompt-plan, candidate-review, and candidate-generation validation reports must redact unsafe submitted canonical target labels from measured problem lists.
- Candidate-review, release-approval, and release-evidence-bundle validation reports must redact unsafe submitted manifest hashes, evidence hashes, bundle hashes, and pack ids from measured problem lists.
- Public-card, approved-modifier, requester-voice, and multi-surface validation reports must redact unsafe submitted measured values before returning evidence to callers.
- Generation-brief, asset-manifest, asset-prompt-plan, tech-flavor, and inhabitant-overlay validation reports must redact unsafe submitted measured metadata values before returning evidence to callers.
- Generated-pack aggregate validation and replayability diversity reports must redact unsafe submitted pack ids, prompt hashes, schema versions, mapping ids, palette values, scaffold metadata, and replayability signatures before returning evidence to callers.
- Production release-gate and release-evidence-bundle validation reports must redact unsafe submitted release modes, prerequisite keys, blocking reasons, approval fields, boundary values, and metrics before returning evidence to callers.
- Generated-pack API and tool error responses must redact unsafe submitted pack ids, public-card ids, and detail values before returning diagnostics to callers.
- Postprocess plans and reports are standalone contracts; they may write postprocessed candidate artifacts and metadata, but must not write approved production assets or alter canonical gameplay mappings.
- Postprocess plan/report validation reports must redact unsafe submitted schema-error paths and actual values before returning diagnostics to callers.
- Postprocess runners must reject tampered writable paths before writing sidecars, atlas metadata, visual manifests, or processed candidates outside the pack's postprocessed candidate roots.
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
- Production image generation requires explicit consent and a documented cost/auth model before any user-facing release claim; accepted cost evidence must include a nonzero max estimate.
- Public release eligibility must come from the standalone `productionReleaseGate` report, which fails closed unless the gate uses a valid generated-pack id and every prerequisite, diversity evidence including the release pack, diversity metrics coherent with per-pack rows/signatures/screenshots/comparisons, same-pack persistence proof, same-pack public-card proof, explicit approval, candidate review, human signoff, and non-future gate evaluation timestamp is present.
- Release approval evidence must be hash-bound, match the current generated pack id, contain timestamp-coherent approval events, include a nonzero accepted cost estimate, and remain candidate-only; stale hashes, future-dated approvals, zero-cost approval evidence, candidate reviews that predate their manifest, planned-only candidate approvals, or evidence copied from another pack cannot unlock production readiness.
- Candidate-review and release-approval evidence validation reports must redact submitted secret-looking keys, secret-looking values, raw-instruction keys, and executable instruction values from content and schema-error evidence.
- Release evidence bundles must be created at or after the bound release gate evaluation time, must not be future-dated relative to validation time, and must bind ready evidence sources, generated-pack-source validation, playtest-source validation, persistence-source validation, public-card-source validation, approval-evidence-source validation, candidate-review manifest source validation, diversity-source pack inclusion/coherence, blocking reasons, and prerequisite snapshots back to the release gate; missing release-gate context, claimed hashes or pack ids for unsupplied sources, failing generated-pack sources, failing playtest sources, failing persistence sources, failing public-card sources, failing approval-evidence sources, failing candidate-review manifest sources, approval evidence drift, or copied diversity reports from another suite fail validation even when supplied source hashes are stable.
- Release evidence report measured fields must redact unsafe submitted manifest hashes, evidence hashes, bundle hashes, and pack ids before returning validation reports to callers.
- Release-gate and release-evidence-bundle API requests must reject secret-like fields, semantic token fields, secret-looking keys or values, expanded credential-token-family values, raw prompt-instruction keys, executable instruction values, oversized object keys, and oversized/noisy evidence bodies before report construction; rejection responses may include counts, redacted paths, and limits, but not submitted evidence values, token field names, executable instruction text, or oversized key text.

## Release Gate

```json
{
  "schemaValid": true,
  "moderationPassed": true,
  "playtestPassed": true,
  "assetManifestValid": true,
  "assetPromptPlanValid": true,
  "secretLeakCount": 0,
  "secretLikeKeyRedacted": true,
  "secretLikeValueRejected": true,
  "rawInstructionKeyRedacted": true,
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
  "rawExecutablePromptInstructionCount": 0,
  "arbitraryToolMutationFormulaCount": 0,
  "schemaRegistryExists": true,
  "schemasValidatedIndependently": true,
  "productionReleaseGateSchemaExists": true,
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
  "releaseApiRequestBounded": true,
  "releaseApiOversizedEvidenceRejected": true,
  "releaseApiOversizedKeyRedacted": true,
  "releaseApiSemanticSecretKeyRedacted": true,
  "releaseApiSecretValueRejected": true,
  "releaseApiSecretKeyRedacted": true,
  "releaseApiExpandedCredentialFamiliesRejected": true,
  "releaseModeWhenIncomplete": "prototype-gated",
  "releaseApiRawInstructionKeyRedacted": true,
  "releaseApiExecutableInstructionValueRejected": true,
  "failClosedWithoutApprovals": true,
  "blockingReasonsMatchFailedPrerequisites": true,
  "approvalEvidenceHashMatches": true,
  "approvalEvidencePackIdMatches": true,
  "approvalEvidenceTimestampProblemCount": 0,
  "futureDatedApprovalEvidenceRejected": true,
  "releaseGateEvaluatedAtNotFuture": true,
  "futureDatedReleaseGateRejected": true,
  "mixedPackApprovalEvidenceRejected": true,
  "candidateReviewManifestTimeMatchesEvidence": true,
  "staleCandidateReviewEvidenceRejected": true,
  "bundleCreatedAtOrAfterGate": true,
  "preGateReleaseBundleRejected": true,
  "bundleCreatedAtNotFuture": true,
  "futureDatedReleaseBundleRejected": true,
  "generatedPackSourcePassed": true,
  "failingGeneratedPackSourceRejected": true,
  "playtestSourcePassed": true,
  "failingPlaytestSourceRejected": true,
  "persistenceSourcePassed": true,
  "failingPersistenceSourceRejected": true,
  "diversitySourceIncludesGatePack": true,
  "diversitySourceMetricsCoherent": true,
  "approvalEvidenceSourcePassed": true,
  "failingApprovalEvidenceSourceRejected": true,
  "validationReportSourceMetricsMirrored": true,
  "mixedDiversitySourceRejected": true,
  "dangerousFieldRejectCountMin": 20,
  "candidateFolderCount": 23,
  "generationJobLogCount": 23,
  "jobLogsReplayableFromPromptPlan": true,
  "candidateGenerationJobLogWritablePathsCandidateOnly": true,
  "candidateGenerationAdapterPathsPreflighted": true,
  "candidateGenerationPreflightExists": true,
  "generationDisabledWithoutConsentAuthCost": true,
  "productSecurityApprovalRequired": true,
  "assetPostprocessPlanExists": true,
  "assetPostprocessReportExists": true,
  "assetPostprocessUnsafeSchemaErrorsRedacted": true,
  "assetPostprocessWritablePathsCandidateOnly": true,
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
  "unsafeAssetSummaryValueRedacted": true,
  "publicGallerySchemaExists": true,
  "authNotRequiredForPublicGallery": true,
  "approvedOnlyGallery": true,
  "moderationMetadataRequired": true,
  "unpublishWorks": true,
  "approvedModifierSchemaExists": true,
  "enumOnlyModifiers": true,
  "unsafeUnknownModifierValueRedacted": true,
  "formulaInjectionRejected": true,
  "balanceSimulationPassed": true,
  "canonicalRulesPreserved": true,
  "techFlavorTreeSchemaExists": true,
  "canonicalEffectCoverage": 1.0,
  "customEffectCount": 0,
  "generatedTechNamesVisible": true,
  "unlockRulesPreserved": true,
  "unsafeTechFlavorReportValueRedacted": true,
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
  "unsafeInhabitantReportValueRedacted": true,
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
  "costEstimateHasNonZeroBudget": true,
  "candidateAssetsReviewed": true,
  "fallbackVerified": true,
  "releaseEvidenceGeneratedPackSourcePassed": true,
  "releaseEvidenceFailingGeneratedPackSourceRejected": true,
  "releaseEvidencePublicCardSourcePassed": true,
  "releaseEvidenceFailingPublicCardSourceRejected": true,
  "releaseEvidenceApprovalEvidenceSourcePassed": true,
  "releaseEvidenceFailingApprovalEvidenceSourceRejected": true,
  "releaseEvidenceCandidateReviewManifestSourcePassed": true,
  "releaseEvidenceFailingCandidateReviewManifestSourceRejected": true,
  "humanReviewComplete": true,
  "publicReleaseEligible": true
}
```
