# Generated Universe + Style Pack Production Readiness Evidence — 2026-05-26

Branch: `codex/generated-universe-style-pack-v02-schema-validation`

## Scope

This artifact audits the Generated Universe + Style Pack lane against the roadmap in `specs/55_agent_town_generated_universe_style_pack_roadmap.md` and the TDD matrix in `specs/56_agent_town_generated_universe_style_pack_tdd_matrix.md`.

It is evidence for a prototype-gated production-readiness lane, not a public release approval. Public release remains blocked until explicit auth/cost/consent approval, candidate asset review, and human review signoff are recorded in a valid production release gate.

Those approvals must be represented by `release_approval_evidence.schema.json`. Candidate review must also be represented by `candidate_review_manifest.schema.json`, and the release gate requires the approval-evidence candidate-manifest hash to match the reviewed manifest before candidate assets count as reviewed. The release gate derives approval booleans from that versioned evidence and ignores loose approval flags. Evidence or review manifests containing secret-like fields, raw prompt instructions, insufficient candidate-review coverage, production image promotion, normal gameplay exposure, canonical server-rule changes, or V6 civic changes fail validation.

## Boundary Statement

```json
{
  "normalGameplayVisibilityChanged": false,
  "canonicalServerRulesChanged": false,
  "v6CivicMechanicsTouched": false,
  "generatedPackMutationAuthority": false,
  "newExternalImageGenerationUsed": false,
  "productionImageAssetsCreated": false,
  "publicReleaseApproved": false
}
```

## Roadmap Coverage

| Milestone | Current Evidence | Status |
| --- | --- | --- |
| GU-0 V0 demo baseline | `e2e/237_world_grid_generated_pack_demo.spec.js` verifies prompt-to-pack, generated visuals/text, Three.js load, playtest recording, and first-loop completion. | Covered |
| GU-1 V0.1 contract-first pipeline | `tests/generated_pack_contract.test.js`, `tests/generated_pack_generation_brief.test.js`, and `tests/generated_pack_asset_prompt_plan.test.js` cover structured brief, schema contracts, invalid fixtures, prompt plan, scaffolding, fallback, and browser loop. | Covered |
| GU-2 strict schema validation | `server/world_grid/generated_schema.js` plus `tests/generated_pack_schema_validation.test.js` validate generated-pack subdocuments independently and reject dangerous unknown fields. | Covered |
| GU-3 asset prompt-plan expansion | `tests/generated_pack_asset_prompt_plan.test.js` verifies stable prompt hashes, canonical targets, sizes, usage paths, negative prompts, candidate paths, and approved paths. | Covered |
| GU-4 candidate job scaffolding | `tests/generated_pack_generation_job_scaffold.test.js` verifies JSONL job logs, provenance, cost/consent placeholders, redaction, and zero generation outputs. | Covered |
| GU-5 candidate image generation guard | `scripts/generated_pack_candidate_generation_spike.js`, `schemas/generated-packs/candidate_generation_run.schema.json`, `schemas/generated-packs/asset_generation_job_log.schema.json`, `tests/generated_pack_candidate_generation_guard.test.js`, and `tests/generated_pack_candidate_generation_run.test.js` prove live generation is blocked without approval/auth/cost/consent, run/job evidence is strict and hashed, unsafe fields/paths/target drift/fractional counters fail, and candidate attempts cannot promote production assets. | Covered as guard only |
| GU-6 post-processing contract | `server/world_grid/generated_asset_postprocess.js` and `tests/generated_pack_asset_postprocess.test.js` cover postprocess plans/reports, atlas metadata, sidecars, budget failure fallback, and candidate-only outputs. | Covered |
| GU-7 Three.js loader v2 | `public/experiences/world-grid/asset_loader.js`, `tests/generated_pack_asset_loader.test.js`, and `e2e/237_world_grid_generated_pack_demo.spec.js` verify fallback-safe runtime asset metadata and first-loop safety. | Covered |
| GU-8 AI playtest harness | `tests/generated_pack_playtest_harness.test.js` verifies measured scores, screenshot evidence, bad-pack rejection, missing asset warnings, and no default-score pass. | Covered |
| GU-9 replayability/diversity | `tests/generated_pack_replayability_diversity.test.js` and `e2e/238_world_grid_generated_pack_replayability.spec.js` verify the ten-prompt suite, distinct signatures, screenshot hashes, and diversity thresholds. | Covered |
| GU-10 save/reload/remix | `tests/generated_pack_persistence.test.js` verifies durable storage, reload after memory reset, export/import, invalid import rejection, and remix lineage. | Covered |
| GU-11 public-safe cards | `tests/generated_pack_public_card.test.js` verifies unlisted auth-free card reads, redaction, screenshot metadata, asset summaries, and moderation rejection. | Covered |
| GU-12 curated gallery | `tests/generated_pack_gallery.test.js` verifies approved-only gallery visibility, moderation metadata, search/filter/sort/pagination, and unpublish rollback. | Covered |
| GU-13 approved modifiers | `tests/generated_pack_approved_modifiers.test.js` verifies enum-only modifiers, formula/custom authority rejection, balance simulation, and canonical rule preservation. | Covered |
| GU-14 tech flavor tree | `tests/generated_pack_tech_flavor_tree.test.js` verifies canonical capability/effect coverage, generated lore, missing effect rejection, and unchanged unlock rules. | Covered |
| GU-15 requester voices | `tests/generated_pack_requester_voice.test.js` verifies canonical contract templates, requester archetypes, Clover identity stability, unsafe text rejection, and disabled rewrite policy. | Covered |
| GU-16 inhabitant overlay | `tests/generated_pack_inhabitant_overlay.test.js` verifies visual-only inhabitants, server-owned state reads, role budget, sprite prompt scaffolding, and no per-inhabitant external model use. | Covered |
| GU-17 multi-surface compatibility | `tests/generated_pack_multi_surface_compatibility.test.js` verifies Z1/Z2/route/public-card/sandbox surfaces, public safety, sandbox safety, and unchanged V5 tools. | Covered |
| GU-18 production release gate | `schemas/generated-packs/production_release_gate.schema.json`, `schemas/generated-packs/release_approval_evidence.schema.json`, `schemas/generated-packs/candidate_review_manifest.schema.json`, `tests/generated_pack_candidate_review_manifest.test.js`, and `tests/generated_pack_production_release_gate.test.js` verify fail-closed reports, hash-bound versioned approval evidence, timestamp-coherent approval events, candidate-review manifest matching, loose-boolean rejection, mixed-pack approval rejection, unsafe evidence rejection, full evidence approval path, tamper rejection, and feature-gated API. | Covered as fail-closed gate |
| GU-19 release evidence bundle | `schemas/generated-packs/release_evidence_bundle.schema.json` and `tests/generated_pack_production_release_gate.test.js` bind release-gate reports to stable hashes and schema-bounded source pack ids, reject source drift, invalid source pack-id shapes, mixed-pack evidence, or missing ready-gate evidence, expose a generated-pack feature-gated QA endpoint, reject unsafe or oversized release API request bodies before echo, and keep production/default/V6 boundaries closed. | Covered as evidence integrity |

## Current Validation Set

The generated-pack lane is validated by:

```bash
node --test tests/generated_pack_contract.test.js tests/generated_pack_generation_brief.test.js tests/generated_pack_asset_prompt_plan.test.js tests/generated_pack_schema_validation.test.js tests/generated_pack_generation_job_scaffold.test.js tests/generated_pack_candidate_generation_guard.test.js tests/generated_pack_candidate_generation_run.test.js tests/generated_pack_asset_postprocess.test.js tests/generated_pack_asset_loader.test.js tests/generated_pack_playtest_harness.test.js tests/generated_pack_replayability_diversity.test.js tests/generated_pack_persistence.test.js tests/generated_pack_public_card.test.js tests/generated_pack_gallery.test.js tests/generated_pack_approved_modifiers.test.js tests/generated_pack_tech_flavor_tree.test.js tests/generated_pack_requester_voice.test.js tests/generated_pack_inhabitant_overlay.test.js tests/generated_pack_multi_surface_compatibility.test.js tests/generated_pack_candidate_review_manifest.test.js tests/generated_pack_production_release_gate.test.js
npx playwright test e2e/237_world_grid_generated_pack_demo.spec.js e2e/238_world_grid_generated_pack_replayability.spec.js
```

## Release Gate Interpretation

`publicReleaseEligible=true` is not the default target of this evidence artifact. The correct current public-release stance is fail-closed until a production release gate includes:

```json
{
  "schemaValid": true,
  "moderationPassed": true,
  "playtestPassed": true,
  "assetManifestValid": true,
  "fallbackVerified": true,
  "diversitySuitePassed": true,
  "packSaveReloadPassed": true,
  "publicCardPrivacyPassed": true,
  "costConsentModelApproved": true,
  "candidateAssetsReviewed": true,
  "privateDataLeakCount": 0,
  "humanReviewComplete": true,
  "publicReleaseEligible": true
}
```

Absent those explicit approvals, the release gate should remain:

```json
{
  "releaseMode": "prototype-gated",
  "publicReleaseEligible": false,
  "blockingReasonsMatchFailedPrerequisites": true
}
```

## Remaining Non-Code Approvals

| Item | Required Evidence |
| --- | --- |
| Auth model approved | Product/security-reviewed auth model for any external image generation provider. |
| Cost model accepted | Explicit cost estimate and acceptance record for candidate generation. |
| User/team consent recorded | Consent record that allows candidate generation for a specific pack/run. |
| Candidate assets reviewed | Human review of generated candidates before any production promotion, recorded in a matching candidate-review manifest. |
| Human release signoff | 64-hex signoff hash recorded in the production release gate. |

Each item must be recorded as versioned release approval evidence. Boolean approval summaries are informational only and are not sufficient for public release eligibility.

## Full-Suite Caveat

The generated-pack focused Node suite and generated-pack browser regressions are the authoritative checks for this lane. A full `npm test` run on this branch is not currently a clean release signal because unrelated Privy/Founders Plot/OpenClaw runtime tests fail outside the generated-pack code path. Those failures do not prove a generated-pack regression, but they do prevent claiming the entire repository is globally green.
