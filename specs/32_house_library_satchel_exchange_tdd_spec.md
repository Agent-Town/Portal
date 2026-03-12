# Phase 32 Spec: House Library Satchel Exchange and Bundle Relay (TDD)

Status: Draft
Version: 1.0
Audience: frontend engineers, backend engineers, runtime engineers, security engineers, QA automation engineers, AI agent implementers, and AI coding agents
Depends on:
1. [specs/28_house_library_memory_spec.md](./28_house_library_memory_spec.md)
2. [specs/29_house_library_memory_tdd_spec.md](./29_house_library_memory_tdd_spec.md)
3. [specs/30_house_library_authoring_exchange_tdd_spec.md](./30_house_library_authoring_exchange_tdd_spec.md)
4. [specs/31_house_library_peer_relay_tdd_spec.md](./31_house_library_peer_relay_tdd_spec.md)
5. [specs/02_api_contract.md](./02_api_contract.md)
6. [specs/03_skill_spec.md](./03_skill_spec.md)
7. [AGENTS.md](../AGENTS.md)

Goal: extend House Library from single-item peer relay into opt-in Satchel exchange, where one curated Reading Table or Satchel can be shared between Houses as a deterministic bundle without replacing per-item Registry ids, approvals, or seal rules.

Implementation constraints:

1. Keep Satchels and Reading Tables as the human-facing bundle primitive.
2. Reuse existing Library publication and peer relay contracts instead of inventing transport-only ids.
3. Preserve per-item `registryId`, `contentHash`, `sourceRef`, approval rules, and seal blocking.
4. Keep all default tests offline-safe and seeded.
5. Keep House and Library flows same-shell and modal-first.
6. Keep worker-first architecture. The worker decides when to assemble or import a Satchel; the server stores bundle state and enforces policy.
7. Do not require peer transport for private Satchel use.
8. Do not weaken imported-item read-only behavior.
9. Do not mutate the existing Reading Table or Satchel scope contract while adding exchange.

## 1. Executive Summary

Phase 30 introduced Satchels as reusable scope bundles.
Phase 31 proved that one published Library artifact can move safely between Houses.
Phase 32 extends that relay model from one artifact to a curated pack:

1. one Satchel can reference multiple published artifacts,
2. one bundle relay can deliver the Satchel manifest and item refs to another House,
3. the target House can preview the whole bundle before import,
4. the target House can import the full Satchel or only selected items while keeping per-item provenance visible.

This is still not bittorrent-style public crawling or autonomous network exchange.
It is a deterministic local proof that bundle sharing can sit on top of the current Library, Registry, and Pony contracts.

## 2. Roadmap Waves

### Wave A - Harness and bundle ledger

1. `M32.0` harness, fixtures, and inspectors
2. bundle relay rows and bundle receipt rows in unified-platform persistence

### Wave B - Source-side Satchel relay creation

1. `M32.1` one Satchel bundle relay can be created from an existing `scope_set`
2. bundle creation is approval-gated and idempotent

### Wave C - Delivery and receipt proof

1. `M32.2` Satchel manifest delivery lands deterministically in Pony-backed inbox state
2. one accepted delivery creates one durable bundle receipt row

### Wave D - Target-side preview and selective import

1. `M32.3` target House previews bundle contents and provenance
2. target House imports the whole Satchel or a selected subset as read-only Library artifacts
3. imported Satchel scope is recreated locally without mutating the source House ids

### Wave E - Joined proof

1. `M32.4` one full source-to-target Satchel exchange stays inside the current shell model

## 3. Reserved Playwright Block

1. `229` to `233`

Reserved tests:

1. `e2e/229_house_library_satchel_exchange_harness.spec.js`
2. `e2e/230_house_library_satchel_bundle_create.spec.js`
3. `e2e/231_house_library_satchel_bundle_receipts.spec.js`
4. `e2e/232_house_library_satchel_bundle_import.spec.js`
5. `e2e/233_house_library_satchel_bundle_full_smoke.spec.js`

## 4. Current Verified Baseline

Phase 32 starts from shipped and verified contracts already in this repo:

1. Satchels and Reading Tables already persist through `scope_sets`,
2. House Library already supports same-shell bundle selection and ordering,
3. single-item peer relay already persists source relay rows, receipt rows, target preview, and read-only import,
4. Pony transport already carries deterministic relay envelopes,
5. the full House Library and peer relay smoke blocks are green.

Design implication:

1. Satchel exchange should reuse existing `scope_sets` rather than inventing a second bundle primitive,
2. bundle relays should point to the source `scope_set` plus the relayed publication refs,
3. target-side import should reuse the normal read-only Library import pattern per item while recreating one local Satchel shell on top.

## 5. Global Measurable Metrics

### 5.1 Bundle ledger metrics

1. Creating one Satchel bundle relay increments `library_satchel_relays` by exactly `1`.
2. Replaying the same bundle idempotency key does not create a second bundle relay row.
3. Each bundle relay row stores one non-empty source `scopeSetId`.
4. Each bundle relay row stores one non-empty `targetHouseId`.
5. Each bundle relay row stores one non-empty ordered list of relayed publication refs.

### 5.2 Bundle receipt metrics

1. Recording one accepted bundle delivery increments `library_satchel_receipts` by exactly `1`.
2. Bundle receipt rows preserve the parent `librarySatchelRelayId`.
3. Bundle receipts do not mutate per-item `library_publications` row counts.

### 5.3 Trust metrics

1. Bundle creation is blocked when any included Library item is seal-blocked for publication.
2. Bundle transport cannot bypass approval-gated publication for any member item.
3. Target import remains read-only unless explicitly copied into a new local item later.
4. Target-side Satchel recreation never rewrites source `scopeSetId`, `libraryPublicationId`, or per-item `registryId`.

## 6. Milestones

### M32.0 Harness

Outcome:

1. unified-platform persistence exposes Satchel bundle relay and receipt tables,
2. test stats expose a `satchelExchange` inspector,
3. one seeded fixture family describes the source Satchel and target House contract,
4. export/import includes the new bundle transport tables.

Primary test:

1. `e2e/229_house_library_satchel_exchange_harness.spec.js`

Measurable success criteria:

1. fixture family `library_satchel_exchange_seed` is listed,
2. stats include `inspectors.satchelExchange === true`,
3. stats counts include `library_satchel_relays: 0` and `library_satchel_receipts: 0` after reset,
4. `GET /__test__/unified-platform/inspect/satchel-exchange` returns deterministic empty arrays and empty filters.

### M32.1 Source-side Satchel bundle creation

Outcome:

1. source House can create one bundle relay from one Satchel with approval and idempotency,
2. bundle relay row stores source `scopeSetId`, target House, and ordered publication refs.

Primary test:

1. `e2e/230_house_library_satchel_bundle_create.spec.js`

Measurable success criteria:

1. blocked creation without approval returns one stable approval-required error,
2. one approved create increments `library_satchel_relays` by exactly `1`,
3. replay returns the same bundle relay id and does not change counts.

### M32.2 Delivery and receipts

Outcome:

1. Satchel manifest delivery records one bundle receipt row,
2. Pony-backed delivery remains additive to current inbox behavior,
3. the source item publication model remains unchanged.

Primary test:

1. `e2e/231_house_library_satchel_bundle_receipts.spec.js`

Measurable success criteria:

1. one accepted delivery increments `library_satchel_receipts` by exactly `1`,
2. target inbox receives one deterministic bundle notice,
3. `library_publications` count stays unchanged through delivery.

### M32.3 Target-side preview and selective import

Outcome:

1. target House previews bundle title, member items, and provenance,
2. target House imports the full Satchel or a subset as read-only Library artifacts,
3. one local Satchel shell is recreated for the imported set.

Primary test:

1. `e2e/232_house_library_satchel_bundle_import.spec.js`

Measurable success criteria:

1. preview shows one non-empty ordered list of member items,
2. importing a subset creates only the chosen read-only Library artifacts,
3. importing the full bundle recreates one local Satchel with the imported item ids in the same order,
4. replay does not duplicate items, links, or local Satchel rows.

### M32.4 Full smoke

Outcome:

1. source builds or selects a Satchel,
2. source publishes any missing member artifacts,
3. source relays the Satchel,
4. target receives and previews the bundle,
5. target imports the full pack,
6. the whole flow stays inside `/app` with one stable worker session.

Primary test:

1. `e2e/233_house_library_satchel_bundle_full_smoke.spec.js`

Measurable success criteria:

1. page path stays `/app` for the full journey,
2. worker session id stays stable during the same-shell bundle exchange,
3. all final counts match the exact expected deltas,
4. target House ends with one local Satchel referencing the imported item ids in bundle order.

## 7. Phase Exit Criteria

Phase 32 is complete only when all of the following are true:

1. `e2e/229` through `e2e/233` are green,
2. Phase 29 through Phase 31 Library blocks remain green,
3. `npm test` is green,
4. bundle ids never replace or rewrite per-item `registryId` values,
5. seal and approval rules remain intact through the Satchel exchange path.

## 8. Developer Roadmap Summary

Recommended implementation order for AI agent developers:

1. lock the harness and tables first,
2. reuse the existing Satchel and peer relay contracts instead of introducing a third bundle model,
3. treat source bundle creation as a manifest-building step, not an item-copy step,
4. add delivery and receipt proof before target import UI,
5. make selective import deterministic before shipping the full-bundle convenience flow,
6. finish with the joined same-shell smoke and only then plan stronger trust overlays or external public replication.
