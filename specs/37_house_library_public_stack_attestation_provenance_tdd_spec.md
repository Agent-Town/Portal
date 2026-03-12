# Phase 37 Spec: House Library Public Stack Attestation Provenance (TDD)

Status: Draft
Version: 1.0
Audience: frontend engineers, backend engineers, runtime engineers, security engineers, QA automation engineers, AI agent implementers, AI coding agents, UX designers, trust and safety reviewers, and evaluation engineers
Depends on:
1. [specs/33_house_library_public_stack_tdd_spec.md](./33_house_library_public_stack_tdd_spec.md)
2. [specs/34_house_library_public_stack_trust_tdd_spec.md](./34_house_library_public_stack_trust_tdd_spec.md)
3. [specs/35_house_library_public_stack_review_tiers_tdd_spec.md](./35_house_library_public_stack_review_tiers_tdd_spec.md)
4. [specs/36_house_library_public_stack_review_attestations_tdd_spec.md](./36_house_library_public_stack_review_attestations_tdd_spec.md)
5. [specs/02_api_contract.md](./02_api_contract.md)
6. [specs/03_skill_spec.md](./03_skill_spec.md)
7. [AGENTS.md](../AGENTS.md)

Goal: harden Public Stack review attestations with wallet-backed provenance, so a House can seal one published attestation with its connected wallet, another House can verify that seal inside the same Library shell, and users get a plain-language trust signal with no surprise redirects, no hidden server-side signing, and no mandatory chain writes.

Implementation constraints:

1. Reuse the existing House Library `Public Stacks` and `Exchange Counter` surfaces inside `/app`.
2. Preserve the current local review, verification, import, and attestation flows from Phases 33 to 36.
3. Keep the default path deterministic and offline-safe for Playwright coverage.
4. Preserve wallet-first identity and worker-first architecture. The server may store proofs, but it must not invent signatures.
5. Use plain-language RPG-facing copy for users. Internally this phase is signature-based, but the UI should prefer `seal`, `check seal`, and `verified seal`.
6. Do not introduce comment threads, follower graphs, scoreboards, or mandatory on-chain publication.

## 1. Executive Summary

Phase 36 made one House review visible to other Houses through a public attestation.
That is useful, but still incomplete.

Today a target House can see that another House published an attestation.
It cannot reliably answer:

1. was this attestation actually sealed by the publishing House wallet,
2. which wallet and chain produced the proof,
3. whether the active House has already checked that seal,
4. whether a preview or search result is showing a verified seal, an unchecked seal, or an invalid seal.

Phase 37 fills that gap with one narrow trust layer:

1. a House can seal one published attestation with one wallet-backed provenance envelope,
2. preview exposes plain-language seal posture without replacing local trust controls,
3. another House can check and store one local verification receipt,
4. search can filter by provenance posture without turning Public Stacks into a ranking market,
5. the entire loop stays inside `/app` and remains compatible with the current worker debug surfaces.

## 2. Why This Phase Exists

This phase is the next practical trust step because the platform already has the prerequisites:

1. House Library same-shell Public Stack search and preview are shipped,
2. local review tiers and public attestations are already shipped,
3. OpenClaw Lite already exposes wallet message signing primitives,
4. the current platform already treats the connected wallet as the durable user identity.

Design implication:

1. provenance should be layered on top of the published attestation row,
2. provenance must use an existing wallet capability instead of a backend shortcut,
3. verification must be visible in the same shell where preview and import already happen,
4. the UX must stay understandable for a user with no blockchain background.

## 3. Product Language Contract

User-facing copy should stay simple:

1. `Seal this attestation` means create a wallet-backed provenance proof for one published attestation.
2. `Check seal` means verify the proof from the active House and save a local verification receipt.
3. `Verified seal` means the proof was checked successfully by this House.
4. `Unchecked seal` means a proof exists but has not been checked by this House yet.
5. `Seal mismatch` means the proof was checked and failed validation.

Do not surface raw signature jargon as the first-line copy in the main shell.
Detailed proof fields may appear in debug or inspector surfaces.

## 4. Roadmap Waves

### Wave A - Provenance harness

1. `M37.0` add deterministic attestation-provenance fixtures, inspectors, and empty ledger tables

### Wave B - Seal publication

1. `M37.1` let a House seal one published Public Stack attestation with one canonical wallet-backed proof

### Wave C - Preview posture

1. `M37.2` project seal posture and signer details into Public Stack preview without replacing local review or attestation messaging

### Wave D - Search and filter posture

1. `M37.3` let Public Stacks search expose and filter provenance posture in deterministic results

### Wave E - Local verification receipts

1. `M37.4` let a target House check one seal, persist one local verification receipt, and replay that check idempotently

### Wave F - Joined same-shell proof

1. `M37.5` prove the full source-seal to target-verify loop inside `/app` with stable worker continuity

## 5. Reserved Playwright Block

1. `254` to `259`

Reserved tests:

1. `e2e/254_house_library_public_stack_attestation_provenance_harness.spec.js`
2. `e2e/255_house_library_public_stack_attestation_provenance_publish.spec.js`
3. `e2e/256_house_library_public_stack_attestation_provenance_preview.spec.js`
4. `e2e/257_house_library_public_stack_attestation_provenance_search.spec.js`
5. `e2e/258_house_library_public_stack_attestation_provenance_verify.spec.js`
6. `e2e/259_house_library_public_stack_attestation_provenance_full_smoke.spec.js`

## 6. Current Verified Baseline

Phase 37 starts from the shipped Phase 36 baseline already present in this repo:

1. one Public Stack can be published, searched, previewed, verified, reviewed locally, attested publicly, and imported,
2. local review tiers still govern import decisions,
3. Public Stack preview already exposes attestation counts and authored attestation cards,
4. House Library remains same-shell and modal-safe inside `/app`,
5. the worker runtime already exposes wallet signing primitives for connected wallets.

Phase 37 must therefore preserve:

1. local review remains local and authoritative,
2. attestation publication remains distinct from provenance sealing,
3. provenance verification adds trust context but does not override local blocked-here policy,
4. worker-observable traces remain available in debug tabs.

## 7. Provenance Model

### 7.1 New durable records

Phase 37 introduces two new record families:

1. `library_public_stack_attestation_provenance`
   Stores the source House seal attached to one published attestation.
2. `library_public_stack_attestation_verification_receipts`
   Stores one target-side verification receipt describing whether the active House checked a seal successfully, unsuccessfully, or not yet.

### 7.2 Provenance envelope fields

Every provenance row must store:

1. `libraryPublicStackAttestationProvenanceId`
2. `libraryPublicStackAttestationId`
3. `libraryPublicStackId`
4. `houseId`
5. `teamId`
6. `chain`
7. `walletAddress`
8. `messageVersion`
9. `message`
10. `messageDigest`
11. `signature`
12. `signedAt`
13. `createdAt`
14. `updatedAt`

Message content must canonically bind:

1. the attestation id,
2. the stack id,
3. the publishing House id,
4. the review tier,
5. the attestation summary,
6. the message version.

### 7.3 Verification receipt fields

Every verification receipt must store:

1. `libraryPublicStackAttestationVerificationReceiptId`
2. `libraryPublicStackAttestationProvenanceId`
3. `libraryPublicStackAttestationId`
4. `libraryPublicStackId`
5. `houseId`
6. `teamId`
7. `verificationStatus`
8. `verificationReason`
9. `verifiedSignerAddress`
10. `verifiedChain`
11. `verifiedAt`
12. `createdAt`
13. `updatedAt`

Allowed `verificationStatus` values for this phase:

1. `verified`
2. `mismatch`

This phase does not require a persistent `unchecked` receipt row.
Unchecked remains a derived UI state when provenance exists and no local receipt exists yet.

## 8. Global Measurable Metrics

### 8.1 Harness metrics

1. After reset, stats counts include `library_public_stack_attestation_provenance: 0`.
2. After reset, stats counts include `library_public_stack_attestation_verification_receipts: 0`.
3. Test inspectors expose `publicStackAttestationProvenance === true` and `publicStackAttestationVerificationReceipts === true`.
4. Export and import roundtrip preserve both new tables exactly.

### 8.2 Seal publication metrics

1. The first successful seal increments `library_public_stack_attestation_provenance` by exactly `1`.
2. Replaying the same provenance idempotency key does not create a second provenance row.
3. Sealing without an existing published attestation returns one stable `LIBRARY_PUBLIC_STACK_ATTESTATION_REQUIRED` error.
4. Sealing without a connected wallet proof path returns one stable `WALLET_SIGNATURE_REQUIRED` or equivalent stable platform error.
5. One successful seal emits exactly one wallet signing action in worker-observable traffic.

### 8.3 Preview metrics

1. Public Stack preview with no provenance preserves current local review and attestation fields.
2. Public Stack preview with one provenance row exposes one plain-language seal posture.
3. Preview exposes deterministic signer metadata: `houseId`, `chain`, `walletAddress`, and `signedAt`.
4. Preview distinguishes `verified seal`, `unchecked seal`, and `seal mismatch` without leaving `/app`.

### 8.4 Search metrics

1. Public Stack search preserves seeded result count after provenance publication.
2. Search result rows expose deterministic provenance summary fields.
3. Search supports deterministic filtering by seal posture without score-based ordering.
4. Default ordering remains deterministic and lexical, not trust-score ranked.

### 8.5 Verification receipt metrics

1. First successful verification increments `library_public_stack_attestation_verification_receipts` by exactly `1`.
2. Replaying the same verification idempotency key does not create a second receipt row.
3. Verified receipts store one exact signer address and chain from the provenance envelope.
4. Mismatch receipts store one stable `verificationReason`.

### 8.6 UX and trust metrics

1. Main-shell copy remains understandable without blockchain vocabulary.
2. No full-page navigation is introduced.
3. Local blocked-here policy remains stronger than foreign provenance.
4. The active worker session id stays stable through the full same-shell flow.

## 9. Milestones

### M37.0 Harness

Outcome:

1. unified-platform persistence exposes provenance and verification-receipt tables,
2. test stats expose provenance inspectors,
3. one seeded fixture family describes provenance expectations,
4. export and import include both new tables.

Primary test:

1. `e2e/254_house_library_public_stack_attestation_provenance_harness.spec.js`

Measurable success criteria:

1. fixture family `library_public_stack_attestation_provenance_seed` is listed,
2. stats include `inspectors.publicStackAttestationProvenance === true`,
3. stats include `inspectors.publicStackAttestationVerificationReceipts === true`,
4. stats counts include `library_public_stack_attestation_provenance: 0`,
5. stats counts include `library_public_stack_attestation_verification_receipts: 0`,
6. `GET /__test__/unified-platform/inspect/public-stack-attestation-provenance` returns deterministic empty arrays and empty filters,
7. `GET /__test__/unified-platform/inspect/public-stack-attestation-verification-receipts` returns deterministic empty arrays and empty filters.

### M37.1 Seal publication

Outcome:

1. one House can seal one existing published attestation,
2. the proof is wallet-backed and stored as a provenance row,
3. replay is idempotent and deterministic,
4. no server-side fake signing path is introduced.

Primary test:

1. `e2e/255_house_library_public_stack_attestation_provenance_publish.spec.js`

Measurable success criteria:

1. missing idempotency returns one stable `LIBRARY_IDEMPOTENCY_REQUIRED` error,
2. missing published attestation returns one stable `LIBRARY_PUBLIC_STACK_ATTESTATION_REQUIRED` error,
3. first provenance publish increments `library_public_stack_attestation_provenance` by exactly `1`,
4. replay does not change counts,
5. persisted provenance row stores non-empty `chain`, `walletAddress`, `messageVersion`, `messageDigest`, and `signature`,
6. worker-observable traffic includes exactly one successful wallet message signing action for the completed seal.

### M37.2 Preview surface

Outcome:

1. Public Stack preview exposes seal posture alongside the existing attestation card,
2. signer details are visible in plain language,
3. local review, verification, and import copy remain intact.

Primary test:

1. `e2e/256_house_library_public_stack_attestation_provenance_preview.spec.js`

Measurable success criteria:

1. seeded preview exposes one exact provenance badge or posture line,
2. preview exposes deterministic `chain`, masked `walletAddress`, and `signedAt`,
3. preview preserves existing local review fields,
4. preview preserves existing attestation counts and authored attestation cards,
5. preview distinguishes `unchecked seal` from `verified seal` when a verification receipt later exists.

### M37.3 Search posture

Outcome:

1. Public Stacks search exposes provenance summary fields,
2. users can filter by provenance posture in the same shell,
3. no ranking or score market is introduced.

Primary test:

1. `e2e/257_house_library_public_stack_attestation_provenance_search.spec.js`

Measurable success criteria:

1. search result count remains the seeded total when no filter is applied,
2. each seeded result row exposes deterministic provenance summary data,
3. `sealed only` filter returns only results with provenance rows,
4. `verified by this House` filter returns only results with a local verified receipt,
5. default result ordering remains deterministic and lexical.

### M37.4 Local verification receipts

Outcome:

1. a target House can check one seal from preview,
2. the result persists as one local verification receipt,
3. replay is idempotent,
4. mismatch is visible without overriding local import policy.

Primary test:

1. `e2e/258_house_library_public_stack_attestation_provenance_verify.spec.js`

Measurable success criteria:

1. missing idempotency returns one stable `LIBRARY_IDEMPOTENCY_REQUIRED` error,
2. missing provenance row returns one stable `LIBRARY_PUBLIC_STACK_ATTESTATION_PROVENANCE_REQUIRED` error,
3. first successful verification increments `library_public_stack_attestation_verification_receipts` by exactly `1`,
4. replay does not change counts,
5. verified receipt stores exact `verifiedSignerAddress` and `verifiedChain`,
6. mismatch receipt stores one stable `verificationReason`,
7. a verified or mismatch receipt does not mutate the local review tier row.

### M37.5 Full smoke

Outcome:

1. source House reviews one Public Stack,
2. source House publishes one attestation,
3. source House seals that attestation,
4. target House previews the sealed attestation,
5. target House checks the seal and sees the verified posture in the same shell,
6. local review and import policy remain independent.

Primary test:

1. `e2e/259_house_library_public_stack_attestation_provenance_full_smoke.spec.js`

Measurable success criteria:

1. page path stays `/app` for the full flow,
2. worker session id stays stable within the page session,
3. source-side status copy includes one attestation publication and one seal publication outcome,
4. target-side status copy includes one seal-check outcome,
5. final counts match the exact expected deltas for review, attestation, provenance, verification receipt, and import rows,
6. target-side local review state is unchanged unless the user explicitly performs a separate local review action.

## 10. Runtime, Skill, and Tool Contract Notes

Phase 37 should rely on the current worker-first model:

1. wallet-backed proof creation must route through existing wallet signing primitives or their direct successors,
2. the server must store the resulting proof envelope but must not synthesize signatures,
3. verification logic may run in platform routes or worker-aware helpers, but the result must stay observable through deterministic inspectors and debug surfaces.

Suggested implementation contract for AI agentic developers:

1. add one provenance publish action from the existing attestation preview card,
2. add one verification action from the target-side preview card,
3. project verification posture into both preview and search result rows,
4. keep `Worker Tools`, `Worker Traffic`, and `Session Context` useful for debugging.

## 11. Evaluation Notes for AI Agentic Developers

The phase should be judged on exact, measurable outcomes rather than subjective trust copy.

Minimum evaluation checklist:

1. every milestone has one primary Playwright file and exact pass criteria,
2. every provenance and verification mutation is idempotent,
3. every new trust status can be derived from stored rows and does not rely on ephemeral client-only memory,
4. every user-facing trust phrase has one deterministic backend or fixture source,
5. every new route or UI state remains same-shell and testable without live external services.

## 12. Phase Exit Criteria

Phase 37 is complete only when all of the following are true:

1. `e2e/254` through `e2e/259` are green,
2. existing Public Stack publication, trust, review, and attestation coverage still passes,
3. existing Registry and Satchel exchange coverage still passes,
4. full repo `npm test` passes,
5. same-shell House Library UX remains plain-language and pixel-RPG consistent,
6. no worker-first guardrail from `AGENTS.md` is violated.

## 13. Guardrails for AI Agentic Developers

1. Do not add server-side fake signatures or backend-only seal creation.
2. Do not require an on-chain transaction for the default deterministic path.
3. Do not let provenance verification override the active House's local review or blocked-here decision.
4. Do not introduce score-based ordering, karma, or popularity metrics.
5. Do not add a separate provenance page outside the existing House Library shell.
6. Do not add unexplained signature jargon to the main user flow.

## 14. Post-Phase Follow-ups

These are explicitly out of scope for Phase 37:

1. weighted trust or reputation aggregation across many Houses,
2. threaded public discussion or social graph features,
3. moderator appeals or dispute workflows,
4. default on-chain anchoring of attestation provenance,
5. cross-network replication of provenance receipts beyond the current House-local verification model.
