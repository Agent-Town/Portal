# Phase 33 Spec: House Library Public Stack Publication and Bundle Discovery (TDD)

Status: Draft
Version: 1.0
Audience: frontend engineers, backend engineers, runtime engineers, security engineers, QA automation engineers, AI agent implementers, and AI coding agents
Depends on:
1. [specs/28_house_library_memory_spec.md](./28_house_library_memory_spec.md)
2. [specs/29_house_library_memory_tdd_spec.md](./29_house_library_memory_tdd_spec.md)
3. [specs/30_house_library_authoring_exchange_tdd_spec.md](./30_house_library_authoring_exchange_tdd_spec.md)
4. [specs/31_house_library_peer_relay_tdd_spec.md](./31_house_library_peer_relay_tdd_spec.md)
5. [specs/32_house_library_satchel_exchange_tdd_spec.md](./32_house_library_satchel_exchange_tdd_spec.md)
6. [specs/02_api_contract.md](./02_api_contract.md)
7. [specs/03_skill_spec.md](./03_skill_spec.md)
8. [AGENTS.md](../AGENTS.md)

Goal: let one saved House Library Satchel or Reading Table become a first-class Public Stack that can be published with approval, searched through the existing Public Stacks flow, previewed in the same Library panel, and imported into another House as a read-only Satchel pack.

Implementation constraints:

1. Reuse the current Public Stacks browse and preview surfaces instead of creating a second public catalog UI.
2. Keep current Registry artifact search, preview, and import behavior intact.
3. Require every member item in a published Satchel stack to already have a durable `library_publications` row.
4. Require explicit approval before publishing a Satchel stack publicly.
5. Preserve per-item `registryId`, `libraryPublicationId`, `contentHash`, and seal rules.
6. Keep Public Stack import read-only and recreate one local Satchel shell on top of imported items.
7. Keep default tests deterministic and offline-safe.
8. Keep House Library flows same-shell and modal-first.
9. Do not move decision logic into the backend; the server stores and enforces policy while the worker and UI choose actions.

## 1. Executive Summary

Phase 30 introduced Satchels as reusable Library scope bundles.
Phase 31 let one published artifact move between Houses.
Phase 32 let one Satchel move privately between Houses through Pony relay.

The remaining gap is public reuse.
Today the Public Stacks panel only browses seeded Registry entities.
It does not let a human publish one curated Satchel as a reusable public bundle and then rediscover or import it through the same Public Stacks loop.

Phase 33 fills that gap without inventing a second catalog:

1. one saved Satchel can be published as one public bundle record,
2. public bundle records appear alongside existing Registry entities in Public Stacks search,
3. preview shows bundle members and provenance in plain language,
4. import creates read-only Library artifacts plus one recreated local Satchel,
5. the full journey stays inside `/app`.

## 2. Roadmap Waves

### Wave A - Harness and publication ledger

1. `M33.0` add deterministic public-stack bundle fixtures, inspectors, and empty ledger tables

### Wave B - Source-side publication

1. `M33.1` publish one Satchel or Reading Table as one public stack bundle with approval and idempotency

### Wave C - Search and preview integration

1. `M33.2` Public Stacks search includes published Satchel bundles
2. preview resolves both seeded Registry artifacts and published Satchel bundles through one route family

### Wave D - Target-side import

1. `M33.3` import one public Satchel bundle as read-only Library items plus one local Satchel shell

### Wave E - Joined same-shell proof

1. `M33.4` publish, discover, preview, and import one public Satchel bundle without leaving `/app`

## 3. Reserved Playwright Block

1. `234` to `238`

Reserved tests:

1. `e2e/234_house_library_public_stack_harness.spec.js`
2. `e2e/235_house_library_public_stack_publish.spec.js`
3. `e2e/236_house_library_public_stack_search_preview.spec.js`
4. `e2e/237_house_library_public_stack_import.spec.js`
5. `e2e/238_house_library_public_stack_full_smoke.spec.js`

## 4. Current Verified Baseline

Phase 33 starts from the shipped House Library surfaces already present in this repo:

1. Satchels and Reading Tables already persist through `scope_sets`,
2. individual Library items can already be published to Registry with approval,
3. the Public Stacks panel already supports same-shell search and preview for Registry artifacts,
4. private Satchel exchange already works through Pony relay,
5. full same-shell House Library smoke coverage is already green.

Design implication:

1. public Satchel bundles should layer on top of `scope_sets` and `library_publications`,
2. Public Stacks search should merge public bundle results into the existing search payload,
3. preview and import should branch by entity kind while preserving the current Registry artifact path.

## 5. Global Measurable Metrics

### 5.1 Publication ledger metrics

1. Publishing one Satchel bundle increments `library_public_stacks` by exactly `1`.
2. Publishing a Satchel with `N` ordered members increments `library_public_stack_members` by exactly `N`.
3. Replaying the same publication idempotency key does not create a second public stack row.
4. Every public stack row stores one non-empty `scopeSetId`.
5. Every public stack row stores one non-empty ordered member list anchored to existing `libraryPublicationId` values.

### 5.2 Search and preview metrics

1. Public Stacks search returns the same seeded Registry results it returned before this phase.
2. Searching for a seeded published Satchel bundle returns one deterministic result with the expected family slug.
3. Preview for a Satchel bundle includes one non-empty ordered member list and one non-empty provenance summary.
4. Family filters keep Registry-only and Satchel-bundle results deterministic.

### 5.3 Import metrics

1. Importing one public Satchel bundle with `N` members increments `library_items` by exactly `N`.
2. Importing one public Satchel bundle increments `scope_sets` by exactly `1`.
3. Importing one public Satchel bundle increments `scope_set_items` by exactly `N`.
4. Replay does not duplicate imported items, links, or recreated local Satchel rows.
5. Imported items remain read-only and preserve their source `registryId`.

### 5.4 Trust and policy metrics

1. Satchel bundle publication is blocked when any member item is missing a `library_publications` row.
2. Satchel bundle publication is blocked when any member item is seal-blocked.
3. Importing a public Satchel bundle never mutates source `scopeSetId`, `libraryPublicationId`, or source `registryId`.
4. Public bundle discovery does not bypass explicit approval for source-side publication.

## 6. Milestones

### M33.0 Harness

Outcome:

1. unified-platform persistence exposes public Satchel bundle publication and member tables,
2. test stats expose a `publicStacks` inspector,
3. one seeded fixture family describes one source Satchel bundle and one target import contract,
4. export and import include the new publication tables.

Primary test:

1. `e2e/234_house_library_public_stack_harness.spec.js`

Measurable success criteria:

1. fixture family `library_public_stack_seed` is listed,
2. stats include `inspectors.publicStacks === true`,
3. stats counts include `library_public_stacks: 0` and `library_public_stack_members: 0` after reset,
4. `GET /__test__/unified-platform/inspect/public-stacks` returns deterministic empty arrays and empty filters.

### M33.1 Source-side publication

Outcome:

1. the source House can publish one saved Satchel or Reading Table as one public bundle with approval and idempotency,
2. the publication row stores source `scopeSetId`, ordered member publication refs, and one deterministic public stack id.

Primary test:

1. `e2e/235_house_library_public_stack_publish.spec.js`

Measurable success criteria:

1. blocked publish without approval returns one stable approval-required error,
2. blocked publish when any member lacks a `library_publications` row returns one stable publication-required error,
3. one approved publish increments `library_public_stacks` by exactly `1`,
4. one approved publish increments `library_public_stack_members` by exactly the Satchel member count,
5. replay returns the same public stack id and does not change counts.

### M33.2 Search and preview integration

Outcome:

1. the Public Stacks search route returns seeded Satchel bundle results alongside Registry results,
2. preview resolves either a Registry artifact or a Satchel bundle through one same-shell preview contract,
3. the preview payload stays plain-language and provenance-first.

Primary test:

1. `e2e/236_house_library_public_stack_search_preview.spec.js`

Measurable success criteria:

1. seeded search returns the exact expected result count for the seeded query,
2. preview for a seeded Satchel bundle includes the exact expected ordered member ids,
3. preview response includes one stable `entityKind` identifying the bundle kind,
4. existing Registry artifact preview remains unchanged for the seeded Registry fixture.

### M33.3 Target-side import

Outcome:

1. one target House can import one public Satchel bundle through the Public Stacks flow,
2. import creates read-only Library artifacts per member,
3. one local Satchel shell is recreated with the imported ordered item ids.

Primary test:

1. `e2e/237_house_library_public_stack_import.spec.js`

Measurable success criteria:

1. importing the seeded bundle creates the exact expected count deltas for `library_items`, `scope_sets`, and `scope_set_items`,
2. the recreated local Satchel uses the imported item ids in the source order,
3. every imported item is read-only and marked as imported,
4. replay does not create duplicates.

### M33.4 Full smoke

Outcome:

1. source House selects or reopens one Satchel,
2. source House publishes the Satchel as a Public Stack,
3. target House searches and previews the published stack in the same Public Stacks panel,
4. target House imports it,
5. the whole journey stays inside `/app` with one stable worker session per page.

Primary test:

1. `e2e/238_house_library_public_stack_full_smoke.spec.js`

Measurable success criteria:

1. page path stays `/app` for the full flow,
2. worker session id stays stable within each page session,
3. final table counts match the exact expected deltas,
4. target House ends with one recreated local Satchel referencing the imported item ids in the published order.

## 7. Phase Exit Criteria

Phase 33 is complete only when all of the following are true:

1. `e2e/234` through `e2e/238` are green,
2. existing Public Stacks Registry browse coverage still passes,
3. existing Satchel relay coverage still passes,
4. full repo `npm test` passes,
5. same-shell House Library UX remains plain-language and pixel-RPG consistent.

## 8. Guardrails for AI Agentic Developers

1. Do not fork the Public Stacks UI into a separate public bundle page.
2. Do not break the existing Registry artifact import route while adding bundle import.
3. Do not invent a new bundle primitive when `scope_sets` already carries ordered Satchel membership.
4. Do not publish a Satchel bundle by silently publishing missing member items first; approval remains explicit.
5. Do not weaken read-only behavior for imported public bundle members.
6. Do not change the current worker-first architecture or move Library decisions into backend-only logic.

## 9. Post-Phase Follow-ups

These are explicitly out of scope for Phase 33:

1. public bundle ratings, reviews, or social ranking,
2. bittorrent-style bundle replication,
3. cross-user comments or collaborative editing on Public Stacks,
4. automatic publication of private Satchels without explicit approval.
