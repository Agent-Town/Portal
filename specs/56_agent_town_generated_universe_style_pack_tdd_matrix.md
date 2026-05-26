---
schemaVersion: "agent-town-tdd-matrix-v1"
documentId: "specs/56_agent_town_generated_universe_style_pack_tdd_matrix"
title: "Generated Universe + Style Pack TDD Matrix"
status: "prototype_gated"
date: "2026-05-26"
owner: "Agent Town product"
---

# Generated Universe + Style Pack TDD Matrix

| ID | Layer | Acceptance | Evidence |
| --- | --- | --- | --- |
| GPACK-001 | Schema | Required schema files exist and fixture JSON is parseable | `tests/generated_pack_contract.test.js` |
| GPACK-002 | Security | Invalid pack with arbitrary formula/tool authority fails validation | `tests/generated_pack_contract.test.js` |
| GPACK-003 | Security | Invalid pack with secret-like fields fails validation | `tests/generated_pack_contract.test.js` |
| GPACK-004 | Mapping | Valid pack covers every required canonical gameplay mapping | `tests/generated_pack_contract.test.js` |
| GPACK-005 | API | Generated-pack APIs are hidden unless feature flag is enabled | `tests/generated_pack_contract.test.js` |
| GPACK-006 | API | Prompt-to-pack stores prompt hash, not raw prompt | `tests/generated_pack_contract.test.js` |
| GPACK-007 | Runtime | Generated palette reaches the Three.js scene info | `e2e/237_world_grid_generated_pack_demo.spec.js` |
| GPACK-008 | Runtime | Generated text appears in the playable route | `e2e/237_world_grid_generated_pack_demo.spec.js` |
| GPACK-009 | Gameplay | First claim loop completes with canonical server mutation | `e2e/237_world_grid_generated_pack_demo.spec.js` |
| GPACK-010 | Playtest | First-loop playtest report is recorded and passes | `e2e/237_world_grid_generated_pack_demo.spec.js` |
| GPACK-011 | Brief | Prompt normalization emits a structured `GenerationBrief` with safety status and no raw prompt | `tests/generated_pack_contract.test.js` |
| GPACK-012 | Security | Raw executable prompt instructions fail generated-pack validation | `tests/generated_pack_contract.test.js` |
| GPACK-013 | Assets | Invalid manifest entries fail validation before runtime load | `tests/generated_pack_contract.test.js` |
| GPACK-014 | Assets | Asset prompt plan covers 20 canonical image targets plus UI/postcard presentation targets with prompt hashes, target sizes, usage paths, negative prompts, and candidate paths | `tests/generated_pack_contract.test.js` |
| GPACK-015 | Assets | Candidate folders and JSONL job logs are scaffolded with zero production image assets | `tests/generated_pack_contract.test.js` |
| GPACK-016 | Replayability | Multiple prompts produce distinct deterministic pack signatures and themes | `tests/generated_pack_contract.test.js` |
| GPACK-017 | Browser | First-loop Playwright regression asserts `GenerationBrief`, prompt-plan, scaffold, Three.js load, generated text, and playtest report | `e2e/237_world_grid_generated_pack_demo.spec.js` |
| GPACK-018 | Brief | Roadmap-shaped `GenerationBrief` uses nested theme/tone/style/civilization/safety fields and no executable prompt text | `tests/generated_pack_generation_brief.test.js` |
| GPACK-019 | Assets | Roadmap-shaped `AssetPromptPlan` uses global style lock, target prompts, candidate paths, approved paths, and stable hashes | `tests/generated_pack_asset_prompt_plan.test.js` |
| GPACK-020 | Schema | Local schema registry validates generated-pack subdocuments independently | `tests/generated_pack_schema_validation.test.js` |
| GPACK-021 | Schema | Dangerous unknown fields across generated-pack subdocuments produce at least 20 schema/content rejections | `tests/generated_pack_schema_validation.test.js` |
| GPACK-022 | Jobs | Candidate generation job logs are written without image generation, include consent/cost/provenance/retry/resume metadata, and redact secrets | `tests/generated_pack_generation_job_scaffold.test.js` |
| GPACK-023 | Generation guard | Optional candidate-generation command exists, but generation is blocked without product approval, auth model, cost acceptance, and user/team consent | `tests/generated_pack_candidate_generation_guard.test.js` |
| GPACK-024 | Generation guard | Job-log preflight records never store raw provider secrets and failed attempts preserve deterministic fallback playability | `tests/generated_pack_candidate_generation_guard.test.js` |
| GPACK-025 | Generation guard | Candidate image attempts cannot create approved production assets or mutate canonical server gameplay mappings | `tests/generated_pack_candidate_generation_guard.test.js` |
| GPACK-026 | Postprocess | Asset postprocess plan/report schemas exist and reject arbitrary executable fields | `tests/generated_pack_contract.test.js`, `tests/generated_pack_asset_postprocess.test.js` |
| GPACK-027 | Postprocess | Missing candidate images write atlas metadata and visual sidecars while falling back to deterministic assets | `tests/generated_pack_asset_postprocess.test.js` |
| GPACK-028 | Postprocess | Adapter-produced candidate outputs stay in postprocessed candidate paths, never approved production paths | `tests/generated_pack_asset_postprocess.test.js` |
| GPACK-029 | Postprocess | Oversized processed outputs fail the byte budget and fall back instead of promoting | `tests/generated_pack_asset_postprocess.test.js` |
| GPACK-030 | Asset loader | Browser asset loader v2 converts generated manifest and prompt-plan targets into fallback-safe runtime metadata | `tests/generated_pack_asset_loader.test.js` |
| GPACK-031 | Asset loader | Runtime asset paths must stay under `public/experiences/world-grid/generated` and path traversal stays fallback-only | `tests/generated_pack_asset_loader.test.js` |
| GPACK-032 | Three.js | Scene info exposes asset-loader target counts, zero unhandled missing textures, performance budget pass, and first-loop safety | `e2e/237_world_grid_generated_pack_demo.spec.js` |
