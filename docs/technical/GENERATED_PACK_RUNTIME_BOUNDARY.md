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
- Credential-like prompt spans, including expanded GitHub, GitLab, Google, AWS, Slack, Stripe, and JWT-shaped token families, are marked for review and removed before runtime keyword extraction, so secret fragments cannot become generated labels, names, titles, or hints.
- Generated packs include an `AssetPromptPlan` for canonical image targets only; plan entries carry prompt hashes, target sizes, usage paths, negative prompts, candidate output paths, and JSONL job-log paths.
- Candidate folders and job logs are scaffolded under `data/generated-packs*`; no production image asset is required for runtime playability.
- Deterministic fallback materials, shape tokens, sprites, and generated text remain the playable runtime source until an explicit auth, consent, cost, review, and promotion model exists for production image generation.

## GU-2 Schema Validation Slice

- `server/world_grid/generated_schema.js` is the local schema registry and minimal JSON Schema runner for generated-pack contracts.
- Generated packs now validate `GenerationBrief`, `StyleBible`, `UniverseBible`, `GameplayMapping`, `AssetPromptPlan`, `GeneratedAssetManifest`, and the outer generated pack independently.
- Runtime pack validation fails closed when schema validation finds missing required fields, unknown fields in strict subdocuments, wrong enum values, raw-prompt forbidden fields, raw-instruction object keys, semantic token fields such as `sessionToken`, secret-looking object keys, or secret-looking values under harmless generated-copy keys. Final generated-pack validation reports redact secret-looking and raw-instruction object keys from content and schema-error paths.
- Generation-brief, asset-manifest, and asset-prompt-plan validation reports redact unsafe submitted measured metadata values.
- Aggregate generated-pack validation reports redact unsafe submitted schema versions, mapping ids, palette values, and scaffold metadata from measured evidence.
- The schema runner is intentionally local and deterministic; it does not call external validators or image/model services.

## GU-4 Job Scaffold Slice

- Each asset prompt target writes a scaffolded JSONL generation job record under the configured candidate root.
- Job logs record `authMode=not_configured`, `costConsentStatus=not_required_for_scaffold`, `externalImageGenerationUsed=false`, zero outputs, and no production approval.
- Job logs include prompt-plan hash, source provenance, retry metadata, and a resume pointer so a future approved image-generation runner can replay from the prompt plan without inventing state.

## GU-5 Candidate Generation Guard Slice

- `server/world_grid/generated_asset_generation.js` provides the preflight boundary for future candidate image generation.
- `scripts/generated_pack_candidate_generation_spike.js` is the optional command surface; by default it only reports blocked preflight state and can append candidate-generation evidence to JSONL job logs.
- `candidate_generation_run.schema.json` and `asset_generation_job_log.schema.json` validate preflight run reports and per-target job records before they can be used as production-readiness evidence.
- The guard requires product/security approval, documented auth, documented cost, accepted cost estimate, and user/team consent before any adapter can run.
- No adapter is wired by default. Failed or blocked attempts keep deterministic fallback packs playable, write zero production outputs, preserve canonical gameplay mappings, and reject secret-like fields and values, expanded credential-token-family values, raw prompt instructions, unsafe paths, unknown/duplicate prompt-plan targets, fractional counters, unstable run hashes, or production-promotion claims.
- The candidate-generation runner validates prompt-plan writable paths before job-log file I/O, rejecting tampered job-log, candidate-output, or approved-output paths that escape the generated-pack roots.
- The same path preflight runs before an approved adapter can execute, so disabling job-log writes cannot hand a root-tampered candidate-output path to the adapter.
- Candidate-generation run and job-log validation reports redact submitted secret-looking keys, secret-looking values, expanded credential-token-family values, raw-instruction keys, and executable instruction values from content and schema-error evidence before callers can inspect the report.
- Asset prompt-plan, candidate-review manifest, and candidate-generation run reports redact unsafe submitted canonical target labels from measured problem lists while preserving approved canonical target names for QA diagnostics.
- Core generated-pack contract reports also redact unsafe submitted measured metadata values before returning diagnostics to callers.

## GU-6 Post-Processing Contract Slice

- `server/world_grid/generated_asset_postprocess.js` builds standalone postprocess plans and reports from an `AssetPromptPlan`.
- Postprocess plans record crop, resize, alpha, WebP/PNG fallback, shelf-atlas metadata, per-target byte budgets, candidate input paths, postprocessed candidate output paths, and human-promotion paths.
- The runner writes texture-atlas metadata, visual manifest sidecars, and per-target sidecars even when candidate files are absent, so missing assets fall back deterministically instead of blocking the first loop.
- Postprocessed outputs remain candidate artifacts under `data/generated-packs*/<packId>/postprocessed`; production promotion paths under `approved` are not written without later human signoff.
- Postprocess plan/report validators redact unsafe submitted schema-error paths and actual values before callers can inspect diagnostics.
- The postprocess runner validates writable paths before file I/O, rejecting tampered sidecar, atlas, manifest, processed-output, candidate-input, or promotion paths that escape the pack's generated candidate roots.

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
- Replayability diversity reports redact unsafe submitted pack ids, prompt hashes, and replayability signatures from pack-level and pairwise evidence.
- Prompt-derived palette variants keep same-preset packs visually distinct while preserving readable text contrast and canonical gameplay mappings.
- Browser coverage runs all ten prompts through the real world-grid first loop and reuses the same diversity analyzer on the returned packs and measured playtest reports.

## GU-10 Pack Save, Reload, and Remix Slice

- Generated-pack records are persisted under an ignored durable root, defaulting to `data/generated-packs-durable`.
- `reloadGeneratedPack` reloads a saved pack by ID, reloads the current pack after memory reset, and falls back to the current durable pack when a requested pack is missing.
- `exportGeneratedPack` writes an owner-redacted export envelope with a stable content hash, migration version, vault compatibility metadata, and no raw prompt text.
- `importGeneratedPack` accepts only hash-valid generated-pack exports, rejects tampering or private owner fields, migrates the pack to the current owner, and validates before saving.
- `remixGeneratedPack` creates a child pack with parent/root/generation lineage while preserving canonical mappings and zero server-rule overrides.

## GU-11 Public-Safe Pack Card Slice

- `public_pack_card.schema.json` defines the unlisted public-card contract.
- `publishPublicPackCard` is authenticated and generated-pack feature-gated; `GET /api/world/generated-pack/public-card/:cardId` is auth-free and returns only the already-published card.
- Public cards include generated title, style summary, prompt keyword hints only, screenshot metadata, and asset-manifest summary.
- Public-card moderation rejects raw prompt fields, Brain/provider/debug/wallet terms, executable prompt text, private owner/session data, missing screenshots, and invalid asset summaries.
- Public-card validation reports redact unsafe submitted asset-summary values from measured evidence.

## GU-12 Curated Pack Gallery Slice

- `public_pack_gallery.schema.json` defines the public gallery response contract.
- `GET /api/world/generated-pack/gallery` is auth-free and returns only approved public-card derivatives, never full generated-pack records.
- `POST /api/world/generated-pack/gallery/review` and `/gallery/unpublish` remain authenticated and generated-pack feature-gated.
- Gallery entries require approval status, moderation metadata, reviewer signoff hash, pack tags, screenshot metadata, and asset-manifest summary.
- Pending and rejected cards are hidden from the gallery; unpublished cards are removed from direct public-card lookup and gallery results.

## GU-13 Approved Modifier Slice

- `approved_modifiers.schema.json` defines the enum-only modifier contract.
- `createGeneratedPack` selects from the approved modifier enum deterministically; generated packs cannot provide unknown modifiers.
- `projectApprovedModifierView` produces presentation-only flavor/tutorial/cosmetic hints and copies claim costs unchanged.
- Modifier validation rejects formula fields, custom resource math, mutation/tool authority, custom permissions, custom agent authority, and nonzero canonical rule impact.
- Modifier validation reports redact unsafe submitted unknown enum values from measured evidence.
- Balance simulation requires the canonical claim-cost hash to remain unchanged and first-loop playability to remain true.

## GU-14 Generated Tech Flavor Tree Slice

- `tech_flavor_tree.schema.json` defines generated tech names, lore, canonical capability IDs, canonical effect IDs, unlock rules, and metadata-only compatibility hooks.
- Each generated tech node maps to one approved canonical capability/effect pair; missing or unknown effects fail validation.
- Tech flavor trees can rename and explain progression, but cannot add formulas, custom mechanics, permissions, tools, or altered unlock rules.
- `projectTechFlavorView` exposes only public generated names/lore/effect metadata for generated-pack UI surfaces.
- Balance simulation requires canonical effect coverage of 1.0, zero custom effects, unchanged unlock rules, no V6 civic mechanics touched, and first-loop playability.
- Tech-flavor validation reports redact unsafe submitted effect IDs and balance hashes from measured evidence.

## GU-15 Generated Requester Voice Slice

- `requester_voice_pack.schema.json` defines requester archetypes, canonical contract flavor templates, town murmur templates, Clover style-aware copy, a disabled cached rewrite policy, and a balance simulation record.
- Every contract flavor template maps to one approved canonical contract/action pair: plan claim, complete claim, public presence, and civic service.
- Requester voice packs can change presentation copy only; unknown contract IDs, unknown action IDs, formulas, hidden mechanics, reward deltas, mutation authority, secret-like fields, raw executable instructions, and provider/debug jargon fail validation.
- `projectRequesterVoiceView` exposes generated requester copy and contract flavor metadata only when generated packs are enabled.
- Requester voice validation reports redact unsafe submitted Clover voice and rewrite-policy values from measured evidence.
- Balance simulation requires canonical contract coverage of 1.0, no hidden mechanics, canonical contract rules preserved, and first-loop playability.

## GU-16 Town Life + Inhabitant Overlay Slice

- `inhabitant_style_overlay.schema.json` defines passive worker, hauler, messenger, and farmer roles, sprite prompt scaffolding, voice templates, animation policy, safety policy, and balance simulation.
- Inhabitants are visual actors only. They read from server-owned region/territory state sources and cannot mutate resources, own tools, change contracts, or act as autonomous agents.
- Sprite prompt targets are role-scoped `character-sprite` candidates with prompt hashes, usage paths, candidate paths, and no production image requirement.
- `projectInhabitantStyleOverlayView` exposes only generated role/voice/sprite-plan metadata when generated packs are enabled.
- Browser rendering uses a generated-pack-only stage overlay; reduced-motion mode switches the overlay to static markers.
- Inhabitant-overlay validation reports redact unsafe submitted policy and balance values from measured evidence.

## GU-17 Multi-Surface Compatibility Slice

- `multi_surface_compatibility.schema.json` defines visual skins for Z1 settlement node, Z2 region grid, route network, public pack card, and sandbox commons.
- Surface skins are presentation contracts only: they read `region.settlements`, `region.cells`, `region.routes`, redacted public-card pack data, or typed sandbox state.
- Surface skins cannot mutate server state, include private data, alter V5 tool catalogs, add formulas, or change canonical server rules.
- `projectMultiSurfaceCompatibilityView` exposes generated surface names and naming conventions only when generated packs are enabled.
- Public cards may use the generated public-card title/style summary from the compatibility profile, but still pass raw-prompt, private-data, screenshot, and blocked-field gates.
- Multi-surface validation reports redact unsafe submitted naming values from measured evidence.

## Production Release Gate Boundary

- `buildProductionReleaseGate` creates a standalone readiness report and does not embed release approval state inside generated packs or default gameplay payloads.
- `release_approval_evidence.schema.json` is the auditable auth/cost/consent/candidate-review/human-review contract used by the release gate. It carries a stable `evidenceHash`, requires timestamp-coherent approval events, a nonzero accepted cost estimate, and coherent candidate-review disposition counts, and must match the generated pack id before it can unlock release prerequisites.
- `candidate_review_manifest.schema.json` records every asset prompt-plan target's candidate review status, content hash, note hash, candidate path, postprocess path, and approved-output placeholder. It must remain candidate-only, its `manifestHash` must match the candidate-manifest hash recorded inside approval evidence, its metrics must match actual row review statuses, the approval evidence review timestamp must not predate the manifest, approval-evidence candidate-review counts must match the manifest metrics, and reviewed rows must have candidate content metadata before candidate assets can count as reviewed.
- `validateProductionReleaseGate` checks schema validity, generated-pack id shape, diversity-suite release-pack inclusion, diversity metric-to-row coherence, same-pack persistence binding, same-pack public-card binding, source/evidence metric mirroring, prerequisite coherence, fail-closed behavior, release-gate timestamp coherence, explicit approval evidence, known prerequisite mirroring, approval/candidate-review readiness mirroring, bounded approval-evidence/candidate-review diagnostic mirroring, zero public/private asset leaks, and validation-report boundary indicators.
- The gate can be valid while `publicReleaseEligible=false`; that is the expected result when playtest evidence, diversity evidence, persistence evidence, public-card privacy evidence, candidate review, consent/cost/auth approval, or human signoff is absent.
- `publicReleaseEligible=true` requires every prerequisite to be true and `blockingReasons=[]`; forged eligibility or missing blocking reasons fail validation.
- Approval evidence, candidate-review manifests, diversity reports, persistence reports, public cards, or release gates with secret-like fields, raw prompt instructions, hash drift, invalid pack ids, diversity evidence that excludes the release pack, metric-only diversity claims, mixed persistence evidence, mixed public-card evidence, future-dated approvals, future-dated gate evaluations, mixed pack ids, zero-cost approval evidence, stale candidate-review timing, planned-only reviewed candidates, short candidate-review coverage, candidate-review metric/row-status drift, approval-evidence/manifest candidate-count drift, incoherent candidate-review disposition counts, production image promotion, canonical rule changes, V6 civic changes, or default gameplay exposure fail closed.
- Candidate-review and release-approval evidence validation reports redact submitted secret-looking keys, secret-looking values, raw-instruction keys, executable instruction values, manifest hashes, evidence hashes, and pack ids from content checks, schema-error paths, and measured evidence.
- Production release-gate validation reports mirror known release-prerequisite booleans/counts, bounded diversity/public-card/persistence/missing-asset/replayability evidence metrics, bounded approval-evidence and candidate-review diagnostic counts, explicit auth/cost/consent, candidate-review binding, human-review, and production/private/default/V6 boundary indicators, and redact unsafe submitted release modes, prerequisite keys, blocking reasons, approval fields, and metric values from measured evidence.
- `POST /api/world/generated-pack/release-gate` and `et.world.generated_pack.release_gate` remain behind `FEATURE_WORLD_GRID_GENERATED_PACKS`; they can return a ready controlled-release report from complete machine, persistence, versioned approval, and candidate-review evidence, and expose validation-report approval, evidence-diagnostic, and boundary indicators for QA clients, but do not change canonical world-grid rules, V6 civic systems, pack visibility, or production image policy.

## GU-19 Release Evidence Bundle Slice

- `release_evidence_bundle.schema.json` defines the tamper-evident evidence envelope for release-gate source inputs.
- `buildReleaseEvidenceBundle` records stable hashes for the generated pack, measured playtest report, diversity report, public card, persistence report, release approval evidence, candidate-review manifest, and release gate. It also records source-count metrics, source-problem count metrics, source-presence/hash coherence, source-coverage coherence, release-gate validity and public-eligibility binding, bundle/gate timestamp ordering, future-date rejection metrics, blocking-reason binding, release-prerequisite snapshot binding, ready-evidence source binding, release-gate hash-match binding, generated-pack-source validation, playtest-source validation, persistence-source validation, public-card-source validation, approval-evidence-source validation, candidate-review manifest source validation, diversity-source pack inclusion/coherence, candidate-review manifest hash, time-order, and count-match metrics, and bounded approval-evidence/candidate-review diagnostic counts from the reviewed evidence path.
- The bundle records schema-bounded `sourcePackIds` for single-pack evidence sources, plus the release gate, so QA can detect mixed-pack evidence even when every supplied source hash is internally stable.
- `validateReleaseEvidenceBundle` rejects missing release-gate context, drifted source evidence, unsupplied claimed source hashes, unsupplied claimed source pack ids, mixed-pack source evidence, failing generated-pack sources, failing playtest sources, failing persistence sources, failing public-card sources, failing approval-evidence sources, failing candidate-review manifest sources, copied diversity reports that exclude the release pack, invalid source pack-id shapes, missing source hashes for ready gates, bundles created before their bound release gate, future-dated bundles, forged blocking reasons, forged prerequisite snapshots, approval evidence drift from the bound release gate, release-gate validity metric tampering, release-gate public-eligibility metric tampering, bundle/gate timing metric tampering, gate-context metric tampering, ready-evidence aggregate metric tampering, primary source-pass metric tampering, review/diversity source metric tampering, production-boundary metric tampering, source-count metric tampering, source-problem count metric tampering, source-coverage metric tampering, source-presence metric tampering, release-gate hash-match metric tampering, candidate-review hash-match metric tampering, candidate-review time-order metric tampering, candidate-review count-match metric tampering, secret-like fields, raw prompt instructions, production image assets, private-data leaks, default generated-pack exposure, V6 civic changes, or canonical server-rule changes.
- `validateReleaseEvidenceBundle` mirrors present, missing, required, and supplied source counts, bounded approval-evidence/candidate-review diagnostic counts, plus production/private/default/V6 boundary indicators in `validationReport.metrics` so QA can classify omitted bundle evidence, omitted validation inputs, evidence-diagnostic failures, and boundary failures without inspecting bundle internals.
- `validateReleaseEvidenceBundle` redacts unsafe submitted bundle hashes, source pack ids, release modes, prerequisite keys, blocking reasons, boundary values, and metric values from measured validation-report fields.
- `POST /api/world/generated-pack/release-evidence-bundle` and `et.world.generated_pack.release_evidence_bundle` are feature-gated by `FEATURE_WORLD_GRID_GENERATED_PACKS`, return validation-report source-count metrics, approval-evidence/candidate-review diagnostic counts, and production/private/default/V6 boundary indicators, including fail-closed private-data boundary failures and a ready controlled-release evidence path, and return only evidence reports; loose approval inputs do not satisfy release prerequisites without versioned approval evidence, and the endpoints do not approve release or change gameplay.
- Release-gate and release-evidence-bundle API ingress, including the generic tool dispatcher, rejects secret-like fields, semantic token fields, secret-looking keys or values, expanded credential-token-family values, raw executable prompt-instruction keys, executable instruction values, oversized object keys, or oversized/noisy evidence bodies before constructing reports, so unsafe submitted values, token field names, executable instruction text, and oversized key text are not echoed back to callers.
- Generated-pack API and tool error responses redact unsafe submitted pack ids, public-card ids, and detail values before returning diagnostics, including missing-pack and missing-card errors.
- The bundle is not a release approval surface. It only makes the release-gate evidence replayable and hash-bound for review.

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
  "credentialPromptFragmentsRedacted": true,
  "expandedCredentialPromptFamiliesRedacted": true,
  "dangerousFieldRejectCountMin": 20,
  "jobLogsReplayableFromPromptPlan": true,
  "costConsentStatus": "not_required_for_scaffold",
  "candidateGenerationPreflightExists": true,
  "candidateGenerationRunSchemaExists": true,
  "assetGenerationJobLogSchemaExists": true,
  "candidateGenerationRunHashStable": true,
  "assetGenerationJobLogPathsSafe": true,
  "candidateGenerationJobLogWritablePathsCandidateOnly": true,
  "candidateGenerationAdapterPathsPreflighted": true,
  "candidateGenerationRunCanonicalTargetProblemCount": 0,
  "candidateGenerationExpandedCredentialFamiliesRejected": true,
  "assetGenerationJobLogTargetDriftCount": 0,
  "integerCounterValidation": true,
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
  "migrationVersion": 1,
  "publicCardSchemaExists": true,
  "authNotRequiredForPublicCard": true,
  "publicCardPublishFeatureGated": true,
  "promptKeywordHintsOnly": true,
  "publicCardScreenshotPresent": true,
  "unsafePackCardRejected": true,
  "publicGallerySchemaExists": true,
  "authNotRequiredForPublicGallery": true,
  "galleryReviewFeatureGated": true,
  "approvedOnlyGallery": true,
  "moderationMetadataRequired": true,
  "pendingRejectedHidden": true,
  "unpublishWorks": true,
  "approvedModifierSchemaExists": true,
  "enumOnlyModifiers": true,
  "formulaInjectionRejected": true,
  "balanceSimulationPassed": true,
  "canonicalRulesPreserved": true,
  "claimCostHashPreserved": true,
  "techFlavorTreeSchemaExists": true,
  "canonicalEffectCoverage": 1.0,
  "customEffectCount": 0,
  "generatedTechNamesVisible": true,
  "unlockRulesPreserved": true,
  "v6CivicMechanicsTouched": false,
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
  "inhabitantRoleCount": 4,
  "inhabitantSpritePromptCount": 4,
  "externalModelPerInhabitant": false,
  "inhabitantResourceMutationCount": 0,
  "reducedMotionFallback": "static-markers",
  "multiSurfaceCompatibilitySchemaExists": true,
  "z1Z2Compatibility": true,
  "surfaceSkinCount": 5,
  "multiTownNamesGenerated": 6,
  "publicCardSafe": true,
  "sandboxSkinSafe": true,
  "v5ToolsUnaffected": true,
  "serverRuleChangeCount": 0,
  "productionReleaseGateSchemaExists": true,
  "releaseApprovalEvidenceSchemaExists": true,
  "candidateReviewManifestSchemaExists": true,
  "releaseEvidenceBundleSchemaExists": true,
  "releaseGateFeatureGated": true,
  "releaseGateValidationReportBoundaryMetricsMirrored": true,
  "releaseGateValidationReportApprovalMetricsMirrored": true,
  "releaseGateValidationReportPrerequisiteMetricsMirrored": true,
  "releaseGateValidationReportSourceMetricsMirrored": true,
  "releaseGateValidationReportEvidenceDiagnosticsMirrored": true,
  "releaseEvidenceBundleValidationReportEvidenceDiagnosticsMirrored": true,
  "invalidReleaseGatePackIdRejected": true,
  "diversityPackIdMatches": true,
  "diversityReportMetricsCoherent": true,
  "metricOnlyDiversityClaimRejected": true,
  "mixedDiversityEvidenceRejected": true,
  "persistencePackIdMatches": true,
  "mixedPersistenceEvidenceRejected": true,
  "publicCardPackIdMatches": true,
  "mixedPublicCardEvidenceRejected": true,
  "releaseGateFailsClosedWithoutApprovals": true,
  "blockingReasonsMatchFailedPrerequisites": true,
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
  "mixedPackApprovalEvidenceRejected": true,
  "candidateReviewManifestHashMatchesEvidence": true,
  "candidateReviewManifestTimeMatchesEvidence": true,
  "candidateReviewManifestCountsMatchEvidence": true,
  "staleCandidateReviewEvidenceRejected": true,
  "releaseGateHashStable": true,
  "releaseGateValid": true,
  "releaseEvidenceGateValidMetricTamperRejected": true,
  "releaseGatePublicEligible": true,
  "releaseEvidenceGatePublicEligibleMetricTamperRejected": true,
  "releaseGateHashMatches": true,
  "releaseEvidenceGateHashMetricTamperRejected": true,
  "releaseEvidenceSourceHashCount": 7,
  "releaseEvidenceSourceHashMismatchCount": 0,
  "releaseEvidenceSourcePresenceMatchesHashes": true,
  "releaseEvidenceSourcePresenceMetricTamperRejected": true,
  "releaseEvidenceSourceCoverageOk": true,
  "releaseEvidenceSourceCoverageMetricTamperRejected": true,
  "releaseEvidenceSourcePackIdMismatchCount": 0,
  "readyGateRequiresAllSourceEvidence": true,
  "releaseEvidenceGateContextRequired": true,
  "releaseEvidenceUnsuppliedSourceHashRejected": true,
  "releaseEvidenceUnsuppliedSourcePackIdRejected": true,
  "releaseEvidenceSourceDriftRejected": true,
  "releaseEvidenceMixedPackRejected": true,
  "releaseEvidenceGeneratedPackSourcePassed": true,
  "releaseEvidenceFailingGeneratedPackSourceRejected": true,
  "releaseEvidencePlaytestSourcePassed": true,
  "releaseEvidenceFailingPlaytestSourceRejected": true,
  "releaseEvidencePersistenceSourcePassed": true,
  "releaseEvidenceFailingPersistenceSourceRejected": true,
  "releaseEvidencePublicCardSourcePassed": true,
  "releaseEvidenceFailingPublicCardSourceRejected": true,
  "releaseEvidenceApprovalEvidenceSourcePassed": true,
  "releaseEvidenceFailingApprovalEvidenceSourceRejected": true,
  "releaseEvidenceCandidateReviewManifestSourcePassed": true,
  "releaseEvidenceFailingCandidateReviewManifestSourceRejected": true,
  "releaseEvidenceDiversitySourceIncludesGatePack": true,
  "releaseEvidenceDiversitySourceMetricsCoherent": true,
  "releaseEvidenceValidationReportSourceMetricsMirrored": true,
  "releaseEvidenceMixedDiversitySourceRejected": true,
  "releaseEvidenceInvalidSourcePackIdRejected": true,
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
  "releaseEvidenceBundleReportUnsafeValueRedacted": true,
  "generatedPackApiErrorDetailsRedacted": true,
  "releaseApiOversizedEvidenceEchoCount": 0,
  "candidateReviewManifestProductionImageAssetCount": 0,
  "candidateReviewCoverageCountMin": 23,
  "costConsentModelApproved": true,
  "costEstimateHasNonZeroBudget": true,
  "candidateAssetsReviewed": true,
  "candidateReviewDispositionCountsCoherent": true,
  "candidateReviewRowStatusCountsMatch": true,
  "candidateReviewManifestCountsMatchEvidence": true,
  "humanReviewComplete": true,
  "publicReleaseEligibleRequiresAllPrerequisites": true
}
```
