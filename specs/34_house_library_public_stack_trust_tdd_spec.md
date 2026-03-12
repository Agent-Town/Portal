# Phase 34 Spec: House Library Public Stack Trust Verification (TDD)

Status: Draft
Version: 1.0
Audience: frontend engineers, backend engineers, runtime engineers, security engineers, QA automation engineers, AI agent implementers, and AI coding agents
Depends on:
1. [specs/28_house_library_memory_spec.md](./28_house_library_memory_spec.md)
2. [specs/29_house_library_memory_tdd_spec.md](./29_house_library_memory_tdd_spec.md)
3. [specs/30_house_library_authoring_exchange_tdd_spec.md](./30_house_library_authoring_exchange_tdd_spec.md)
4. [specs/31_house_library_peer_relay_tdd_spec.md](./31_house_library_peer_relay_tdd_spec.md)
5. [specs/32_house_library_satchel_exchange_tdd_spec.md](./32_house_library_satchel_exchange_tdd_spec.md)
6. [specs/33_house_library_public_stack_tdd_spec.md](./33_house_library_public_stack_tdd_spec.md)
7. [specs/02_api_contract.md](./02_api_contract.md)
8. [specs/03_skill_spec.md](./03_skill_spec.md)
9. [AGENTS.md](../AGENTS.md)

Goal: extend Public Stacks from discoverable public bundles into trust-aware public bundles, where a House can verify bundle integrity, see plain-language proof overlays in preview, and import with a durable local verification receipt without leaving `/app`.

Implementation constraints:

1. Reuse the existing Public Stacks search, preview, and import surfaces instead of creating a separate trust dashboard.
2. Keep Registry artifact preview behavior intact while adding bundle-only verification overlays.
3. Verification must be deterministic and offline-safe in default tests.
4. Verification must not require approval because it is a local read/consistency action, not a publication or relay action.
5. Import must preserve current read-only behavior and continue to respect seal, registry id, and publication id rules.
6. Same-shell House Library continuity remains mandatory.
7. Do not move trust decisions into backend-only product logic; the backend stores receipts and enforces stable policy while the UI and worker decide when to verify.

## 1. Executive Summary

Phase 33 made one Satchel reusable through Public Stacks search, preview, and import.
That solved public discovery, but not public trust.

Today a target House can see plain provenance text for a Public Stack, but it cannot:

1. verify that the stored bundle hash still matches the ordered published members,
2. persist one local verification receipt for later review,
3. see a stable trust overlay in preview before or after import,
4. prove that imported items and the recreated Satchel still match the verified bundle.

Phase 34 fills that gap without adding a second UX layer:

1. one target House can verify a Public Stack bundle,
2. verification creates durable ledger rows and member proof rows,
3. preview shows verification state and proof cards in plain language,
4. import reuses or creates a verification receipt and stamps imported metadata with it,
5. the full flow stays inside `/app`.

## 2. Roadmap Waves

### Wave A - Trust harness

1. `M34.0` add deterministic verification fixtures, inspectors, and empty ledger tables

### Wave B - Verification ledger

1. `M34.1` verify one Public Stack bundle with idempotent local receipts and member proof rows

### Wave C - Preview overlays

1. `M34.2` Public Stack preview exposes latest verification state and plain-language proof cards

### Wave D - Verification-aware import

1. `M34.3` import reuses or creates a verification receipt and stamps imported artifacts plus recreated Satchel metadata

### Wave E - Joined same-shell proof

1. `M34.4` search, preview, verify, and import one Public Stack in the same shell with a visible trust outcome

## 3. Reserved Playwright Block

1. `239` to `243`

Reserved tests:

1. `e2e/239_house_library_public_stack_trust_harness.spec.js`
2. `e2e/240_house_library_public_stack_verify.spec.js`
3. `e2e/241_house_library_public_stack_trust_preview.spec.js`
4. `e2e/242_house_library_public_stack_verified_import.spec.js`
5. `e2e/243_house_library_public_stack_trust_full_smoke.spec.js`

## 4. Current Verified Baseline

Phase 34 starts from the shipped Phase 33 baseline already present in this repo:

1. a Satchel can be published as one Public Stack bundle,
2. Public Stacks search merges Registry entities and House Library bundles,
3. preview resolves bundle provenance in the same Library shell,
4. import recreates one read-only local Satchel plus imported member artifacts,
5. Phase 33 full smoke is green.

Design implication:

1. trust overlays must attach to existing `library_public_stacks` records,
2. verification must reuse the existing bundle manifest and `bundleHash` model,
3. import should attach verification metadata instead of inventing a second import primitive.

## 5. Global Measurable Metrics

### 5.1 Verification ledger metrics

1. Verifying one Public Stack bundle increments `library_public_stack_verifications` by exactly `1`.
2. Verifying one Public Stack bundle with `N` members increments `library_public_stack_verification_members` by exactly `N`.
3. Replaying the same verification idempotency key does not create a second verification row.
4. Every verification row stores one non-empty `libraryPublicStackId`, `bundleHash`, and `verificationState`.
5. Every member proof row stores one non-empty `libraryPublicationId`, `registryId`, and ordered `sortIndex`.

### 5.2 Preview metrics

1. Before verification, preview exposes a deterministic `verificationState` of `unverified`.
2. After verification, preview exposes the latest verification id and bundle hash for the active House.
3. After verification, preview returns at least `2` plain-language proof cards for bundle integrity and local status.
4. Existing Registry artifact preview remains unchanged for seeded Registry fixtures.

### 5.3 Import metrics

1. Importing a Public Stack without a prior verification still results in exactly `1` durable verification row for that House team.
2. Importing a verified Public Stack does not create a second verification row when the same verification can be reused.
3. Every newly imported item stores the expected verification ref in metadata.
4. The recreated local Satchel stores the expected verification ref in metadata.
5. Replay import does not duplicate verification, imported items, links, or recreated Satchel rows.

### 5.4 Trust and policy metrics

1. Verification fails with a stable not-found error when the Public Stack does not exist.
2. Verification never mutates source publication ids, registry ids, or source bundle ids.
3. Verification and import do not weaken read-only behavior for imported members.
4. Bundle preview keeps trust copy plain-language and avoids raw jargon as the first explanation.

## 6. Milestones

### M34.0 Harness

Outcome:

1. unified-platform persistence exposes Public Stack verification and verification-member tables,
2. test stats expose a `publicStackTrust` inspector,
3. one seeded fixture family describes trust verification expectations,
4. export and import include the new verification tables.

Primary test:

1. `e2e/239_house_library_public_stack_trust_harness.spec.js`

Measurable success criteria:

1. fixture family `library_public_stack_trust_seed` is listed,
2. stats include `inspectors.publicStackTrust === true`,
3. stats counts include `library_public_stack_verifications: 0` and `library_public_stack_verification_members: 0` after reset,
4. `GET /__test__/unified-platform/inspect/public-stack-trust` returns deterministic empty arrays and empty filters.

### M34.1 Verification ledger

Outcome:

1. one target House can verify one Public Stack bundle by id,
2. verification recomputes the expected bundle hash from the stored ordered members,
3. one durable verification row plus ordered member proof rows are persisted,
4. replay stays idempotent.

Primary test:

1. `e2e/240_house_library_public_stack_verify.spec.js`

Measurable success criteria:

1. verifying without an idempotency key returns one stable `LIBRARY_IDEMPOTENCY_REQUIRED` error,
2. verifying a missing Public Stack returns one stable `PUBLIC_STACK_NOT_FOUND` error,
3. one successful verification increments `library_public_stack_verifications` by exactly `1`,
4. one successful verification increments `library_public_stack_verification_members` by exactly the member count,
5. replay returns the same verification id and does not change counts.

### M34.2 Preview trust overlay

Outcome:

1. Public Stack preview includes the latest verification snapshot for the active House team,
2. preview exposes plain-language proof cards for bundle integrity and import state,
3. Registry artifact preview remains unchanged.

Primary test:

1. `e2e/241_house_library_public_stack_trust_preview.spec.js`

Measurable success criteria:

1. unverified preview exposes `verificationState: "unverified"`,
2. verified preview exposes the expected verification id and `verificationState: "verified"`,
3. verified preview includes the exact expected proof-card titles,
4. seeded Registry preview does not gain bundle-only verification fields.

### M34.3 Verification-aware import

Outcome:

1. import reuses the latest verification when present,
2. import creates one verification automatically when none exists yet,
3. imported items and recreated local Satchel metadata reference the verification receipt,
4. idempotent replay remains stable.

Primary test:

1. `e2e/242_house_library_public_stack_verified_import.spec.js`

Measurable success criteria:

1. importing an unverified bundle results in exactly `+1` verification row,
2. importing the same verified bundle again results in `+0` additional verification rows,
3. every imported item metadata contains the expected verification id,
4. recreated local Satchel metadata contains the expected verification id,
5. replay does not duplicate imported rows or verification rows.

### M34.4 Full smoke

Outcome:

1. source House publishes one Public Stack,
2. target House searches and previews it,
3. target House verifies it in the same shell,
4. target House imports it,
5. preview and local Satchel show the trust outcome without leaving `/app`.

Primary test:

1. `e2e/243_house_library_public_stack_trust_full_smoke.spec.js`

Measurable success criteria:

1. page path stays `/app` for the full flow,
2. worker session id stays stable within the page session,
3. action copy shows one verification success outcome and one import success outcome,
4. final counts match the exact expected deltas for public stack, verification, imported item, and scope rows.

## 7. Phase Exit Criteria

Phase 34 is complete only when all of the following are true:

1. `e2e/239` through `e2e/243` are green,
2. existing Public Stack publication, search, and import coverage still passes,
3. existing Registry preview coverage still passes,
4. full repo `npm test` passes,
5. same-shell House Library UX remains plain-language and pixel-RPG consistent.

## 8. Guardrails for AI Agentic Developers

1. Do not fork Public Stack trust into a separate verification page.
2. Do not break existing Registry artifact preview while adding bundle trust overlays.
3. Do not invent a new bundle hash model when the current manifest hash is already deterministic.
4. Do not make verification approval-gated.
5. Do not allow verification to mutate source publication rows or bundle rows.
6. Do not weaken read-only import behavior or source provenance fields.

## 9. Post-Phase Follow-ups

These are explicitly out of scope for Phase 34:

1. cross-user ratings, reviews, or moderation tiers for Public Stacks,
2. bittorrent-style public replication,
3. chain-anchored or signed trust receipts as required proof,
4. collaborative editing or comments on imported public bundles.
