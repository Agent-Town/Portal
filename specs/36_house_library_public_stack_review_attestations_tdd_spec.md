# Phase 36 Spec: House Library Public Stack Review Attestations (TDD)

Status: Draft
Version: 1.0
Audience: frontend engineers, backend engineers, runtime engineers, security engineers, QA automation engineers, AI agent implementers, and AI coding agents
Depends on:
1. [specs/33_house_library_public_stack_tdd_spec.md](./33_house_library_public_stack_tdd_spec.md)
2. [specs/34_house_library_public_stack_trust_tdd_spec.md](./34_house_library_public_stack_trust_tdd_spec.md)
3. [specs/35_house_library_public_stack_review_tiers_tdd_spec.md](./35_house_library_public_stack_review_tiers_tdd_spec.md)
4. [specs/02_api_contract.md](./02_api_contract.md)
5. [specs/03_skill_spec.md](./03_skill_spec.md)
6. [AGENTS.md](../AGENTS.md)

Goal: extend Public Stacks from house-local review tiers into published review attestations, so a House that has already reviewed a Public Stack can publish one durable attestation of its local posture, other Houses can inspect that attested review signal in preview, and the feature stays plain-language, same-shell, and non-social.

Implementation constraints:

1. Reuse the existing Public Stacks search, preview, and trust surfaces instead of adding a comment feed or separate reputation page.
2. Keep attestation rows distinct from local review rows. A local review may exist without a public attestation.
3. Keep default tests deterministic and offline-safe.
4. Preserve wallet-first and House-first identity. Attestations are House/team authored artifacts, not anonymous global reactions.
5. Do not add likes, threaded comments, or opaque ranking algorithms in this phase.
6. Same-shell House Library continuity remains mandatory.

## 1. Executive Summary

Phase 35 lets one House decide how it feels about one Public Stack.
That solves local trust posture, but not public trust signaling.

Today a target House can verify a stack and mark it trusted here, review later, or blocked here.
It cannot:

1. publish one durable attested review signal for other Houses,
2. distinguish unpublished local review from published attestation,
3. inspect attested review signals in Public Stack preview,
4. understand which attested review tier came from which House.

Phase 36 fills that gap with one minimal public trust layer:

1. one House can publish one attestation from one existing local review,
2. preview exposes attestation counts and authored attestation cards,
3. import policy stays local even when attestations exist,
4. the entire flow stays inside `/app`.

## 2. Roadmap Waves

### Wave A - Attestation harness

1. `M36.0` add deterministic Public Stack review-attestation fixtures, inspectors, and empty ledger tables

### Wave B - Attestation ledger

1. `M36.1` publish one review attestation from one existing local review with idempotent replay

### Wave C - Preview surface

1. `M36.2` Public Stack preview exposes attestation counts and authored attestation cards without changing local review semantics

### Wave D - Search posture

1. `M36.3` Public Stacks search exposes attestation summaries in deterministic storefront results

### Wave E - Joined same-shell proof

1. `M36.4` source House reviews and attests one Public Stack, target House previews that attestation, and local import policy remains independent

## 3. Reserved Playwright Block

1. `249` to `253`

Reserved tests:

1. `e2e/249_house_library_public_stack_attestation_harness.spec.js`
2. `e2e/250_house_library_public_stack_attestation_publish.spec.js`
3. `e2e/251_house_library_public_stack_attestation_preview.spec.js`
4. `e2e/252_house_library_public_stack_attestation_search.spec.js`
5. `e2e/253_house_library_public_stack_attestation_full_smoke.spec.js`

## 4. Current Verified Baseline

Phase 36 starts from the shipped Phase 35 baseline already present in this repo:

1. one Public Stack can be published, searched, previewed, verified, locally reviewed, filtered by review tier, and imported,
2. blocked-here policy already blocks local import,
3. same-shell Public Stack review flow is green inside `/app`.

Design implication:

1. public attestation must layer on top of existing local review rows,
2. attestation preview must not overwrite local review messaging,
3. search should surface attestation summaries without becoming a reputation leaderboard.

## 5. Global Measurable Metrics

### 5.1 Attestation ledger metrics

1. Publishing one first attestation increments `library_public_stack_attestations` by exactly `1`.
2. Replaying the same attestation idempotency key does not create a second attestation row.
3. Every attestation row stores one non-empty `libraryPublicStackId`, `houseId`, `teamId`, and `reviewTier`.
4. Every attestation row stores one plain-language summary and may store one optional short note.
5. Every attestation row references one source local review row.

### 5.2 Preview metrics

1. Public Stack preview with no attestations preserves current local review and verification fields.
2. Public Stack preview with one or more attestations exposes exact attestation counts by tier.
3. Preview surfaces authored attestation cards with deterministic House identifiers and plain-language summaries.
4. Existing Registry artifact preview remains unchanged.

### 5.3 Search metrics

1. Public Stack search preserves seeded result count after attestation publication.
2. Search result rows expose deterministic attestation summary fields.
3. Search does not sort or rank by reputation score in this phase.

### 5.4 UX and trust metrics

1. Public attestation copy stays plain-language and avoids social-network vocabulary.
2. Local import policy still depends on the active House’s local review, not on foreign attestations.
3. Same-shell `/app` path and worker continuity remain intact.

## 6. Milestones

### M36.0 Harness

Outcome:

1. unified-platform persistence exposes Public Stack attestation tables,
2. test stats expose a `publicStackAttestations` inspector,
3. one seeded fixture family describes attestation expectations,
4. export and import include the new attestation table.

Primary test:

1. `e2e/249_house_library_public_stack_attestation_harness.spec.js`

Measurable success criteria:

1. fixture family `library_public_stack_attestation_seed` is listed,
2. stats include `inspectors.publicStackAttestations === true`,
3. stats counts include `library_public_stack_attestations: 0` after reset,
4. `GET /__test__/unified-platform/inspect/public-stack-attestations` returns deterministic empty arrays and empty filters.

### M36.1 Attestation publish

Outcome:

1. one House can publish one review attestation from an existing local review,
2. replay is idempotent and deterministic,
3. publishing without a local review is rejected.

Primary test:

1. `e2e/250_house_library_public_stack_attestation_publish.spec.js`

Measurable success criteria:

1. missing idempotency returns one stable `LIBRARY_IDEMPOTENCY_REQUIRED` error,
2. missing local review returns one stable `LIBRARY_PUBLIC_STACK_REVIEW_REQUIRED` error,
3. first attestation publish increments `library_public_stack_attestations` by exactly `1`,
4. replay does not change counts.

### M36.2 Preview surface

Outcome:

1. Public Stack preview exposes attestation counts and authored cards,
2. local review and verification fields remain intact,
3. Registry artifact preview remains unchanged.

Primary test:

1. `e2e/251_house_library_public_stack_attestation_preview.spec.js`

Measurable success criteria:

1. seeded preview exposes exact tier counts,
2. attestation cards expose deterministic `houseId`, `reviewTier`, and `summary`,
3. local review fields still reflect the active House team,
4. seeded Registry preview does not gain attestation fields.

### M36.3 Search posture

Outcome:

1. Public Stack search exposes attestation summary fields,
2. attestation counts remain deterministic in result rows,
3. no reputation ordering is introduced.

Primary test:

1. `e2e/252_house_library_public_stack_attestation_search.spec.js`

Measurable success criteria:

1. result count remains the seeded total,
2. result storefront exposes exact attestation counts,
3. default ordering remains deterministic and lexical, not score-based.

### M36.4 Full smoke

Outcome:

1. source House reviews one Public Stack,
2. source House publishes one attestation,
3. target House previews that attestation in the same shell,
4. target House import behavior still follows its own local review.

Primary test:

1. `e2e/253_house_library_public_stack_attestation_full_smoke.spec.js`

Measurable success criteria:

1. page path stays `/app` for the full flow,
2. worker session id stays stable within the page session,
3. action copy shows one attestation outcome and one target-side preview or import outcome,
4. final counts match the exact expected deltas for review, attestation, verification reuse, and import rows.

## 7. Phase Exit Criteria

Phase 36 is complete only when all of the following are true:

1. `e2e/249` through `e2e/253` are green,
2. existing Public Stack trust, review, and import coverage still passes,
3. existing Registry preview coverage still passes,
4. full repo `npm test` passes,
5. same-shell House Library UX remains plain-language and pixel-RPG consistent.

## 8. Guardrails for AI Agentic Developers

1. Do not add likes, reactions, or threaded comments in this phase.
2. Do not convert attestation counts into opaque global reputation scores.
3. Do not let public attestations override the local review or blocked-here policy of the active House.
4. Do not fork Public Stacks into a second trust screen.
5. Do not require chain writes or on-chain proofs for the default deterministic path.

## 9. Post-Phase Follow-ups

These are explicitly out of scope for Phase 36:

1. threaded public discussion under Public Stacks,
2. weighted reputation scoring or ranking algorithms,
3. on-chain publication of review attestations by default,
4. moderation appeals or dispute workflows.
