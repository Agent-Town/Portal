# Phase 35 Spec: House Library Public Stack Review Tiers and Discovery Controls (TDD)

Status: Draft
Version: 1.0
Audience: frontend engineers, backend engineers, runtime engineers, security engineers, QA automation engineers, AI agent implementers, and AI coding agents
Depends on:
1. [specs/28_house_library_memory_spec.md](./28_house_library_memory_spec.md)
2. [specs/29_house_library_memory_tdd_spec.md](./29_house_library_memory_tdd_spec.md)
3. [specs/30_house_library_authoring_exchange_tdd_spec.md](./30_house_library_authoring_exchange_tdd_spec.md)
4. [specs/33_house_library_public_stack_tdd_spec.md](./33_house_library_public_stack_tdd_spec.md)
5. [specs/34_house_library_public_stack_trust_tdd_spec.md](./34_house_library_public_stack_trust_tdd_spec.md)
6. [specs/02_api_contract.md](./02_api_contract.md)
7. [specs/03_skill_spec.md](./03_skill_spec.md)
8. [AGENTS.md](../AGENTS.md)

Goal: extend Public Stacks from verification-only trust into house-local review tiers and discovery controls, so a House can mark a stack as trusted here, review later, or blocked here, see that state in preview, filter discovery by trust posture, and keep import behavior predictable inside `/app`.

Implementation constraints:

1. Reuse the existing Public Stacks search, preview, verify, and import surfaces instead of adding a separate moderation screen.
2. Keep all review tiers local to one House team. This phase does not create global ratings or cross-user ranking.
3. Keep default tests deterministic and offline-safe.
4. Preserve Phase 34 verification receipts and do not replace them with review rows.
5. Review-tier changes are local policy decisions and must not mutate source `library_public_stacks`, `library_publications`, or Registry rows.
6. Blocked-here policy must affect local import behavior only.
7. Same-shell House Library continuity remains mandatory.

## 1. Executive Summary

Phase 34 proved bundle integrity and import continuity.
That answers "does this stack still match its published members?"
It does not answer "what does this House want to do with it later?"

Today a target House can verify a Public Stack, but it cannot:

1. mark one stack as trusted for this House,
2. defer one stack for later review,
3. locally block one stack from import,
4. search Public Stacks by local trust posture,
5. attach one short review note that survives future sessions.

Phase 35 fills that gap with one local review layer on top of verification:

1. one House can save one review tier per Public Stack,
2. preview shows the saved local trust posture in plain language,
3. Public Stacks search can filter by local trust posture,
4. blocked-here stacks refuse guided import with a stable policy message,
5. the whole flow stays inside `/app`.

## 2. Roadmap Waves

### Wave A - Review harness

1. `M35.0` add deterministic Public Stack review fixtures, inspectors, and empty ledger tables

### Wave B - Local review ledger

1. `M35.1` save one house-local Public Stack review tier with idempotent replay

### Wave C - Discovery controls

1. `M35.2` Public Stacks search and preview expose local review tiers and deterministic trust filters

### Wave D - Import policy

1. `M35.3` blocked-here review tiers block import locally while trusted and review-later tiers remain importable

### Wave E - Joined same-shell proof

1. `M35.4` search, review, filter, and import one Public Stack without leaving `/app`

## 3. Reserved Playwright Block

1. `244` to `248`

Reserved tests:

1. `e2e/244_house_library_public_stack_review_harness.spec.js`
2. `e2e/245_house_library_public_stack_review_tiers.spec.js`
3. `e2e/246_house_library_public_stack_review_filters.spec.js`
4. `e2e/247_house_library_public_stack_review_import_policy.spec.js`
5. `e2e/248_house_library_public_stack_review_full_smoke.spec.js`

## 4. Current Verified Baseline

Phase 35 starts from the shipped Phase 34 baseline already present in this repo:

1. one Public Stack can be published, searched, previewed, verified, and imported,
2. preview already shows bundle trust overlays and local verification state,
3. import already stamps verification refs into imported items and recreated Satchels,
4. full same-shell trust smoke is green.

Design implication:

1. local review tiers should attach to `library_public_stack_id` plus target House/team,
2. review filters should layer on top of the existing Public Stacks search controls,
3. import policy should branch on the local review tier before import begins.

## 5. Global Measurable Metrics

### 5.1 Review ledger metrics

1. Saving one first local review increments `library_public_stack_reviews` by exactly `1`.
2. Replaying the same review idempotency key does not create a second review row.
3. Updating the same Public Stack review by a new idempotency key still leaves exactly `1` review row for that House/team/stack tuple.
4. Every review row stores one non-empty `libraryPublicStackId`, `houseId`, `teamId`, and `reviewTier`.
5. Every review row stores one plain-language `summary` and may store one optional short `note`.

### 5.2 Discovery metrics

1. Public Stacks search with no trust filter preserves current result counts for seeded queries.
2. Filtering by `trusted_here`, `review_later`, or `blocked_here` returns the exact expected local result counts for the seeded review mix.
3. Preview exposes the saved local review tier and review summary for the active House team.
4. Existing Registry artifact preview remains unchanged.

### 5.3 Import policy metrics

1. A stack marked `blocked_here` returns one stable local-policy error and creates `0` imported item rows.
2. A stack marked `review_later` remains importable.
3. A stack marked `trusted_here` remains importable.
4. Import replay stays idempotent after a local review is saved.

### 5.4 UX and trust metrics

1. Local review copy stays plain-language and avoids moderation jargon on first read.
2. Search and preview keep the same-shell `/app` path and worker continuity.
3. Local review state does not leak into source House records.
4. Local review state does not replace or weaken verification receipts.

## 6. Milestones

### M35.0 Harness

Outcome:

1. unified-platform persistence exposes Public Stack review tables,
2. test stats expose a `publicStackReviews` inspector,
3. one seeded fixture family describes local review tiers and filter expectations,
4. export and import include the new review table.

Primary test:

1. `e2e/244_house_library_public_stack_review_harness.spec.js`

Measurable success criteria:

1. fixture family `library_public_stack_review_seed` is listed,
2. stats include `inspectors.publicStackReviews === true`,
3. stats counts include `library_public_stack_reviews: 0` after reset,
4. `GET /__test__/unified-platform/inspect/public-stack-reviews` returns deterministic empty arrays and empty filters.

### M35.1 Local review ledger

Outcome:

1. one target House can save one local review tier for one Public Stack,
2. the latest review row stays unique per House/team/stack tuple,
3. replay is idempotent and updates are deterministic.

Primary test:

1. `e2e/245_house_library_public_stack_review_tiers.spec.js`

Measurable success criteria:

1. missing idempotency returns one stable `LIBRARY_IDEMPOTENCY_REQUIRED` error,
2. missing stack returns one stable `PUBLIC_STACK_NOT_FOUND` error,
3. first review save increments `library_public_stack_reviews` by exactly `1`,
4. replay does not change counts,
5. updating the review tier changes the saved tier while keeping the row count stable.

### M35.2 Discovery controls

Outcome:

1. Public Stacks search can filter by local review tier,
2. preview exposes the local review tier and note for the active House team,
3. Registry artifact preview remains unchanged.

Primary test:

1. `e2e/246_house_library_public_stack_review_filters.spec.js`

Measurable success criteria:

1. unfiltered search preserves the seeded total count,
2. each trust filter returns the exact expected seeded count,
3. preview exposes the expected `reviewTier`,
4. seeded Registry preview does not gain bundle-only review fields.

### M35.3 Import policy

Outcome:

1. blocked-here Public Stacks refuse import for that House team,
2. trusted-here and review-later stacks remain importable,
3. import replays remain deterministic after review-tier changes.

Primary test:

1. `e2e/247_house_library_public_stack_review_import_policy.spec.js`

Measurable success criteria:

1. blocked-here import returns one stable `LIBRARY_PUBLIC_STACK_BLOCKED_HERE` error,
2. blocked-here import changes `0` Library, link, or scope counts,
3. trusted-here import succeeds with the exact expected count deltas,
4. review-later import succeeds with the exact expected count deltas.

### M35.4 Full smoke

Outcome:

1. target House searches one Public Stack,
2. target House marks it with one local review tier,
3. target House filters discovery using that tier,
4. target House imports or is blocked according to that tier,
5. the flow stays inside `/app`.

Primary test:

1. `e2e/248_house_library_public_stack_review_full_smoke.spec.js`

Measurable success criteria:

1. page path stays `/app` for the full flow,
2. worker session id stays stable within the page session,
3. action copy shows one local review outcome and one import or block outcome,
4. final counts match the exact expected deltas for review, verification reuse, and import rows.

## 7. Phase Exit Criteria

Phase 35 is complete only when all of the following are true:

1. `e2e/244` through `e2e/248` are green,
2. existing Public Stack search, trust, and import coverage still passes,
3. existing Registry preview coverage still passes,
4. full repo `npm test` passes,
5. same-shell House Library UX remains plain-language and pixel-RPG consistent.

## 8. Guardrails for AI Agentic Developers

1. Do not add global ratings, reviews, or social ranking in this phase.
2. Do not turn local review tiers into source-side mutations on Public Stack rows.
3. Do not bypass Phase 34 verification receipts.
4. Do not weaken local read-only or blocked-here import policy.
5. Do not fork Public Stacks into a second discovery screen.
6. Do not add opaque moderation vocabulary when plain language is enough.

## 9. Post-Phase Follow-ups

These are explicitly out of scope for Phase 35:

1. cross-user comments, likes, or threaded reviews for Public Stacks,
2. shared/global moderation tiers,
3. signed review attestations,
4. public reputation scoring or ranking algorithms.
