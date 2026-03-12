# Phase 31 Spec: House Library Peer Relay and Publication Transport (TDD)

Status: Draft
Version: 1.0
Audience: frontend engineers, backend engineers, runtime engineers, security engineers, QA automation engineers, AI agent implementers, and AI coding agents
Depends on:
1. [specs/28_house_library_memory_spec.md](./28_house_library_memory_spec.md)
2. [specs/29_house_library_memory_tdd_spec.md](./29_house_library_memory_tdd_spec.md)
3. [specs/30_house_library_authoring_exchange_tdd_spec.md](./30_house_library_authoring_exchange_tdd_spec.md)
4. [specs/02_api_contract.md](./02_api_contract.md)
5. [specs/03_skill_spec.md](./03_skill_spec.md)
6. [AGENTS.md](../AGENTS.md)

Goal: extend House Library beyond Registry publish and import into deterministic, opt-in peer relay layered on top of existing publication rows, Registry ids, and seal rules.

Implementation constraints:

1. Keep Registry publication as the canonical public artifact contract.
2. Treat peer relay as an additive transport layer, not a replacement id system.
3. Preserve `registryId`, `contentHash`, `sourceRef`, approval rules, and seal blocking.
4. Keep all default tests offline-safe and seeded.
5. Keep House and Library surfaces same-shell and modal-first.
6. Keep worker-first architecture. The worker decides when to share; the server stores relay state and enforces policy.
7. Do not require Pony transport for private Library use.
8. Do not weaken imported-item read-only behavior.

## 1. Executive Summary

Phase 29 established publication and import.
Phase 30 established authoring, organization, guided exchange, and evaluation.
Phase 31 starts the next planned extension track: moving published artifacts between Houses through a deterministic peer relay model.

This phase is not about public crawling or live decentralized networking first.
It is about proving the transport contract locally:

1. one published artifact can be relayed to another House,
2. the relay references the existing publication row and `registryId`,
3. delivery and receipt state are durable and inspectable,
4. import into the target House still respects local trust and read-only rules.

## 2. Roadmap Waves

### Wave A - Harness and transport ledger

1. `M31.0` harness, fixtures, and inspectors
2. relay rows and receipt rows in unified-platform persistence

### Wave B - Source-side relay creation

1. `M31.1` approval-gated relay creation from an existing Library publication
2. idempotent replay keyed by source House and publication

### Wave C - Target-side receipt and inbox surfacing

1. `M31.2` Pony-backed relay envelope lands deterministically
2. receipt rows are persisted without changing publication ids

### Wave D - Guided import from relay

1. `M31.3` target House can preview and import a relayed publication
2. imported item remains read-only and provenance-visible

### Wave E - Joined proof

1. `M31.4` one full source-to-target relay journey inside the current shell model

## 3. Reserved Playwright Block

1. `224` to `228`

Reserved tests:

1. `e2e/224_house_library_peer_relay_harness.spec.js`
2. `e2e/225_house_library_peer_relay_create.spec.js`
3. `e2e/226_house_library_peer_relay_receipts.spec.js`
4. `e2e/227_house_library_peer_relay_import.spec.js`
5. `e2e/228_house_library_peer_relay_full_smoke.spec.js`

## 4. Current Verified Baseline

Phase 31 starts from shipped and verified contracts already in this repo:

1. House Library publishes curated items into `library_publications`.
2. Registry browse, preview, import, and provenance surfaces are already same-shell.
3. Pony transport already has a pluggable relay adapter model.
4. Unified-platform export/import already tracks Library and publication tables.
5. House Library benchmark and full guided loop are already green.

Design implication:

1. relay rows should point back to existing publication rows,
2. receipt rows should record transport proof without mutating Registry ids,
3. target-side import should still use the normal Library import path once relay trust is accepted.

## 5. Global Measurable Metrics

### 5.1 Relay ledger metrics

1. Creating one relay increments `library_peer_relays` by exactly `1`.
2. Replaying the same relay idempotency key does not create a second relay row.
3. Each relay row stores one non-empty `libraryPublicationId`.
4. Each relay row stores one non-empty `registryId`.
5. Each relay row stores one non-empty `targetHouseId`.

### 5.2 Receipt metrics

1. Recording one accepted delivery increments `library_peer_receipts` by exactly `1`.
2. Receipt rows preserve the parent `libraryPeerRelayId`.
3. Receipts do not mutate the source `library_publications` row count.

### 5.3 Trust metrics

1. Relay creation is blocked when the underlying Library item is seal-blocked for publication.
2. Target import remains read-only unless explicitly copied into a new local item.
3. Relay transport cannot bypass approval-gated publication.

## 6. Milestones

### M31.0 Harness

Outcome:

1. unified-platform persistence exposes `library_peer_relays` and `library_peer_receipts`,
2. test stats expose a `peerRelay` inspector,
3. a seeded fixture family describes the source publication and target House contract,
4. export/import includes the new transport tables.

Primary test:

1. `e2e/224_house_library_peer_relay_harness.spec.js`

Measurable success criteria:

1. fixture family `library_peer_relay_seed` is listed,
2. stats include `inspectors.peerRelay === true`,
3. stats counts include `library_peer_relays: 0` and `library_peer_receipts: 0` after reset,
4. `GET /__test__/unified-platform/inspect/peer-relay` returns:
   - `relays: []`
   - `receipts: []`
   - deterministic empty filters

### M31.1 Source-side relay creation

Outcome:

1. source House can create one relay from one publication with approval and idempotency,
2. relay row persists transport kind and target House.

### M31.2 Target-side receipt ledger

Outcome:

1. transport delivery records one receipt row,
2. Pony-backed delivery remains additive to current inbox behavior.

### M31.3 Relay preview and import

Outcome:

1. target House previews the relayed publication,
2. target House imports it as a read-only Library item with provenance.

### M31.4 Full relay smoke

Outcome:

1. source publishes,
2. source relays,
3. target receives,
4. target previews,
5. target imports,
6. all counts and provenance stay deterministic.

## 7. Phase Exit Criteria

Phase 31 is complete only when all of the following are true:

1. `e2e/224` through `e2e/228` are green,
2. Phase 29 and Phase 30 Library blocks remain green,
3. `npm test` is green,
4. relay ids never replace or rewrite `registryId` values,
5. seal and approval rules remain intact through the relay path.
