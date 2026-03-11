# Phase 30 Spec: House Library Authoring, Shelves, Guided Exchange, and Evaluation (TDD)

Status: Draft
Version: 1.0
Audience: frontend engineers, backend engineers, runtime engineers, UX engineers, security engineers, QA automation engineers, AI agent implementers, ML evaluation engineers, product designers, and AI coding agents
Depends on:
1. [specs/28_house_library_memory_spec.md](./28_house_library_memory_spec.md)
2. [specs/29_house_library_memory_tdd_spec.md](./29_house_library_memory_tdd_spec.md)
3. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
4. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
5. [specs/02_api_contract.md](./02_api_contract.md)
6. [specs/03_skill_spec.md](./03_skill_spec.md)
7. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md)
8. [AGENTS.md](../AGENTS.md)

Goal: turn the shipped M29 House Library baseline into a novice-friendly, same-shell knowledge system with deterministic authoring, editing, conversation capture, organization, Registry exchange, and evaluation gates.

Implementation constraints:

1. Keep every shipped M29 Library contract green while extending it.
2. Keep House modal-first and shell-preserving. The browser must stay on `/app` during Library work.
3. Keep worker-first architecture. The worker decides how knowledge is used; the server stores durable state and enforces policy.
4. Keep `scope_sets` as the canonical ordered in-chat scope model. Do not create a competing pack system unless this spec is updated in the same change.
5. Keep direct Library authoring and editing local-first. Imported or sealed material must remain constrained by explicit trust rules.
6. Reuse existing Registry primitives where they already exist, especially `GET /api/registry/search`, `GET /api/registry/entities/:id`, and `GET /api/registry/proof/:registryId`.
7. Keep `public/skill.md` externally stable. House Library skill-pack growth must be additive and test-first.
8. Keep all default tests offline-safe and seeded. No milestone may require a live LLM, live chain, or live public Registry service.
9. Keep player-facing copy plain-language and pixel-RPG legible. Users must not need AI, ML, or CS knowledge to succeed.
10. A milestone is not complete until its docs, fixtures, routes, UI, worker tool surface, observability, and tests are updated together.

## 1. Executive Summary

Phase 29 shipped the core House Library loop:

1. curated Library items,
2. explicit Reading Table scope control,
3. Workshop snapshotting,
4. Archive or Trainer promotion,
5. Registry publication and import,
6. seal-aware publish blocking,
7. same-shell reopen and reuse.

Phase 30 closes the next product gap.
Today the Library is strong at curation and reuse, but weaker at direct authorship, organization, guided capture, and public discovery.

This phase adds:

1. direct Library note authoring,
2. local-item editing with revision history,
3. user-reviewed conversation capture,
4. shelves and deterministic filters,
5. saved Satchels built on top of the existing Reading Table model,
6. same-shell Registry browse and preview,
7. guided import and publish flows that explain trust and provenance,
8. a deterministic benchmark harness so AI agent developers can measure success beyond "it seems to work."

The design target is still not a generic note app.
It is a House-native memory layer that fits the current shell, language, worker contract, and pixel-RPG tone:

1. simple enough for first-time users,
2. explicit enough for trust-sensitive memory work,
3. deterministic enough for Playwright and AI coding agents,
4. strong enough that future peer transport can layer on top without changing ids or policy.

### 1.1 Roadmap waves

#### Wave A - The Librarian Desk

1. `M30.0` to `M30.3`
2. harness and contract freeze
3. direct authoring
4. revisions
5. conversation capture

#### Wave B - Organization and reuse

1. `M30.4` to `M30.5`
2. shelves and filters
3. Satchels built on `scope_sets`

#### Wave C - Public Stacks and trust

1. `M30.6` to `M30.7`
2. Registry browse and preview
3. guided publish and import

#### Wave D - Copy, skills, and evaluation

1. `M30.8` to `M30.10`
2. pixel-RPG copy and accessibility contract
3. worker skill and tool contract v2
4. benchmark harness

#### Wave E - Joined proof

1. `M30.11`
2. one full guided memory journey inside the existing House shell

#### Wave F - Post-phase transport extension

1. not part of the default Phase 30 gate
2. optional Pony or bittorrent-style replication may layer on top of Registry publication and import once Phase 30 is green
3. transport work must preserve the same local ids, `contentHash` rules, trust labels, approval model, and seal policy established by M29 and Phase 30

### 1.2 Reserved Playwright block

1. `212` to `223`

Reserved tests:

1. `e2e/212_house_library_authoring_harness.spec.js`
2. `e2e/213_house_library_note_authoring_ui.spec.js`
3. `e2e/214_house_library_item_revision_history.spec.js`
4. `e2e/215_house_library_conversation_capture.spec.js`
5. `e2e/216_house_library_shelves_and_filters.spec.js`
6. `e2e/217_house_library_satchel_scope_sets.spec.js`
7. `e2e/218_house_library_registry_browse_preview.spec.js`
8. `e2e/219_house_library_guided_exchange_wizard.spec.js`
9. `e2e/220_house_library_pixel_rpg_copy_a11y.spec.js`
10. `e2e/221_house_library_skill_tool_contract_v2.spec.js`
11. `e2e/222_house_library_benchmark_harness.spec.js`
12. `e2e/223_house_library_guided_memory_loop.spec.js`

### 1.3 Current verified platform baseline

Phase 30 starts from verified surfaces already present in the repo.
AI agent developers should extend these contracts rather than creating parallel products.

Current verified baseline:

1. The House shell already exposes `Library`, `Workshop`, `Archive`, `Trainer`, `Tracks`, and `Experiences` inside `/app`.
2. The current House Library already supports:
   - curated item browse and detail,
   - explicit Reading Table scope selection,
   - save or reopen prior Reading Tables,
   - open selected items in Workshop or Archive,
   - promote Archive or Trainer material into Library,
   - import Registry artifacts by id,
   - publish local Library items with approval,
   - enforce seal-aware publish blocking.
3. Current Library routes already exist for:
   - `GET /api/platform/library`
   - `POST /api/platform/library/items`
   - `POST /api/platform/library/promotions`
   - `GET /api/platform/library/scope`
   - `POST /api/platform/library/scope`
   - `POST /api/platform/library/imports`
   - `POST /api/platform/library/publications`
4. Current Registry routes already exist for:
   - `GET /api/registry/search`
   - `GET /api/registry/entities/:id`
   - `GET /api/registry/proof/:registryId`
5. Current runtime tool support already exists for:
   - `house_library_list_items`
   - `house_library_read_scope`
   - `house_library_set_scope`
   - `house_library_create_item`
   - `agent_town_ui_registry_search`
6. Current unified-platform persistence already includes:
   - `library_items`
   - `library_links`
   - `scope_sets`
   - `scope_set_items`
   - `library_publications`
7. Current M29 UI gaps still visible in the shipped product are:
   - no direct note authoring inside Library,
   - no direct editing of local Library items,
   - no revision history,
   - no guided conversation capture inside Library,
   - no shelf system,
   - no in-shell Registry browse workflow,
   - no benchmark harness for AI agent developer measurement.

Design implication:

1. Phase 30 is additive and must not regress the shipped M29 path.
2. `scope_sets` remains the source of truth for ordered chat scope, even when new UI labels such as `Satchel` are introduced.
3. Registry browse should reuse existing Registry routes rather than inventing a second discovery backend.
4. The worker tool surface must grow with the product so House agents can perform the same operations that humans can inspect in the UI.

### 1.4 House furniture map

To keep the UI readable and RPG-like without becoming cute or unclear, the House Library should map to a small set of stable furniture metaphors:

1. `Library`: the overall House memory room
2. `Librarian Desk`: create, edit, review, and capture actions
3. `Shelves`: durable organization by topic or room
4. `Reading Table`: what is selected for this chat right now
5. `Satchel`: a saved reusable Reading Table
6. `Public Stacks`: the Registry browse and preview area
7. `Workshop`: file editing and build artifacts
8. `Archive`: raw traces and records

Rule:

1. Player-facing labels may use these metaphors, but the actual action text must still be plain.
2. The user must always understand what the agent may read, what it may not read, and what will become public.

## 2. Global Measurable Metrics

Every milestone must publish measurable proof using the metric classes below.

### 2.1 Authoring and revision metrics

1. Creating one direct Library note increments `library_items` by exactly `1`.
2. Creating one direct Library note increments `library_item_revisions` by exactly `1`.
3. Editing one local Library note keeps the same `libraryItemId`.
4. Editing one local Library note increments `library_item_revisions` by exactly `1`.
5. Imported or read-only items reject edit attempts with a stable failure contract.
6. The latest revision exposes a non-empty `contentHash`.
7. Revision history remains readable after refresh and reset-seeded replay.

### 2.2 Conversation capture metrics

1. Capturing `N` selected conversation messages creates exactly `1` `conversation_artifacts` row.
2. Saving one reviewed conversation capture to Library increments `library_items` by exactly `1`.
3. Saving one reviewed conversation capture increments `library_links` by exactly `1`.
4. Saving one reviewed conversation capture increments `library_item_revisions` by exactly `1`.
5. Captured text contains only the selected message ids and no unselected message ids.
6. Conversation capture does not silently widen the active Reading Table.

### 2.3 Shelf and filter metrics

1. Creating one shelf increments `library_shelves` by exactly `1`.
2. Assigning `N` items to a shelf increments `library_shelf_items` by exactly `N`.
3. Replaying the same shelf assignment does not create duplicate `library_shelf_items` rows.
4. Removing one item from a shelf decrements only `library_shelf_items`.
5. Filtering by shelf returns the exact expected ordered item ids.
6. Filtering by `sourceKind`, `visibility`, or `importState` remains deterministic for the same seeded reset.

### 2.4 Satchel and Reading Table metrics

1. Saving one Satchel increments `scope_sets` by exactly `1`.
2. Saving a Satchel with `N` items increments `scope_set_items` by exactly `N`.
3. Reopening a Satchel sets the active scope to the exact saved ordered item ids and no others.
4. Reordering a Satchel changes only its ordered scope rows, not the underlying shelf membership.
5. Switching between Satchels keeps titles stable and does not rename older saved sets.

### 2.5 Registry browse and exchange metrics

1. Searching Public Stacks returns deterministic seeded result counts for the same query and family.
2. Previewing one Registry entity inside Library preserves `pathname == "/app"` and worker continuity.
3. Preview shows non-empty provenance, family, and Registry reference fields.
4. Publishing without approval fails with a stable error code.
5. Approved publish creates exactly one durable publication row.
6. Import replay does not create duplicate imported items for the same `registryId`.
7. Import preview and publish preview both show trust labels before the final action.

### 2.6 Plain-language and pixel-RPG metrics

1. Primary user-facing labels remain readable without AI, ML, or computer-science knowledge.
2. The default path uses Library, Workshop, Archive, Shelves, Reading Table, Satchel, Registry, or similarly plain terms.
3. The default Library path does not require users to understand `embedding`, `vector`, `RAG`, `retrieval`, `context window`, `idempotency`, or `manifest hash`.
4. Copy makes public versus private state explicit before a publish or import action.
5. Keyboard navigation reaches every Library action without requiring a pointer.
6. Status messages and validation errors are available through deterministic accessible names or live regions.

### 2.7 Skill and tool metrics

1. The House Library skill pack compiles through the existing internal pack model.
2. The router selects exactly one specialized skill before acting.
3. `House Librarian` handles author, edit, capture, shelf, and Satchel operations through Library tools.
4. `Registry Curator` handles Registry search, preview, publish, and import through Registry or Library tools.
5. `Workshop Scribe` remains the only skill that edits workspace files.
6. `public/skill.md` remains externally stable and readable.
7. Worker Traffic and Worker Tools panels expose every new callable Library capability deterministically.

### 2.8 Benchmark and evaluation metrics

1. The benchmark harness publishes a deterministic scorecard JSON for the seeded Library tasks.
2. `scopePrecision` equals `1.0` for the positive seeded scenario.
3. `scopeLeakRate` equals `0.0` for the seeded blocked-leak scenario.
4. `unsafePublishBlockRate` equals `1.0` for the sealed-item publish scenario.
5. `provenanceVisibilityRate` equals `1.0` for imported and published artifact previews.
6. `noviceCopyPassRate` equals `1.0` for the seeded copy audit fixture.
7. The same seeded reset produces identical benchmark output hashes across three consecutive local runs.

### 2.9 Portability metrics

1. Platform export includes all new Phase 30 Library tables once introduced.
2. Export row counts match live row counts at export time.
3. Import into an empty store reproduces the same Phase 30 row counts.
4. Verification reports exact mismatches by table and id.

## 3. Test Harness Rules

1. Default `npm test` must remain deterministic and offline-safe.
2. Phase 30 Library tests must use seeded fixtures only.
3. Prompt-preview assertions must rely on deterministic runtime inspection, not subjective reading of chat output.
4. Registry browse, preview, publish, and import tests must not call a live public service.
5. Conversation capture tests must operate on deterministic seeded transcripts or seeded runtime conversation fixtures.
6. Revision-history tests must assert actual stored revisions, not only visible text.
7. Any new approval path must prove both deny and allow branches with exact row-count assertions.
8. Any new sealed or read-only behavior must prove allow, redact, or reject branches where applicable.
9. All same-shell tests must assert `pathname == "/app"` and stable worker session id before and after the action.
10. The benchmark harness must not call a live LLM or rely on human scoring.
11. Structural refactors are allowed only after the milestone contract is locked by the reserved Playwright test.
12. No milestone may remove the current M29 raw import or publish path until the M30 guided replacement is green.

## 4. Required Fixtures and Observability

### 4.1 Fixture families

This phase requires at least:

1. `library_authoring_seed`
2. `library_revision_seed`
3. `library_conversation_capture_seed`
4. `library_shelf_seed`
5. `library_satchel_seed`
6. `library_registry_browse_seed`
7. `library_guided_exchange_seed`
8. `library_copy_a11y_seed`
9. `library_skill_contract_v2_seed`
10. `library_benchmark_seed`
11. `library_guided_flow_seed`

### 4.2 Test-mode observability

At least one deterministic mechanism must exist to inspect:

1. counts for `library_items`, `library_links`, `library_item_revisions`, `conversation_artifacts`, `library_shelves`, `library_shelf_items`, `scope_sets`, `scope_set_items`, and `library_publications`,
2. the active worker session id,
3. the active scope set and its ordered item ids,
4. the last Library-aware worker prompt preview or equivalent prompt-context snapshot,
5. direct-note source metadata and conversation-capture source metadata,
6. revision history and the latest revision hash for one Library item,
7. Registry preview metadata used by the House Library drawer or modal,
8. seal-related read or publish audit outcomes,
9. benchmark results and benchmark output hash,
10. Library-related export and import counts.

Equivalent mechanisms are allowed.

### 4.3 Required `__test__/unified-platform/stats` expansion

By the end of `M30.0`, the unified-platform test stats endpoint must expose:

1. `inspectors.revisions`
2. `inspectors.conversationArtifacts`
3. `inspectors.shelves`
4. `inspectors.registryPreview`
5. `inspectors.benchmarks`

## 5. Milestone Map

### 5.1 Milestone implementation contract

Unless a milestone explicitly says otherwise, the implementing change set should contain all of the following:

1. one new failing reserved Playwright spec first,
2. fixture-family or seed updates required by that spec,
3. route, store, UI, or worker changes required to make the test pass,
4. test-mode observability required to prove the measurable metrics,
5. doc-sync updates listed under the milestone,
6. no backend shortcut that bypasses worker-first or modal-first rules.

Milestone review questions for AI agent developers:

1. Did this change extend the existing House shell or accidentally create a competing path?
2. Can the success criteria be asserted by code, not by human interpretation?
3. Is every new write path approval-gated or explicitly human-triggered?
4. Did this change preserve Reading Table continuity instead of inventing a silent second scope model?
5. Can another agent reproduce the same result after `__test__/reset` with no hidden setup?

Milestones must be implemented in order.
Do not start GREEN work on a later milestone until the immediately prior milestone is passing.

### M30.0 - Authoring harness and baseline freeze

Purpose:

1. reserve the Phase 30 block,
2. add required fixture families,
3. extend unified-platform stats and observability for authoring, revisions, shelves, and benchmarks,
4. freeze the M29 baseline so Phase 30 additions cannot quietly regress it.

Primary test:

1. `e2e/212_house_library_authoring_harness.spec.js`

RED gate:

1. fixture families are missing,
2. Phase 30 inspectors are missing,
3. there is no deterministic way to inspect revisions, shelves, or benchmark output,
4. the harness cannot report the shipped M29 baseline counts before Phase 30 writes begin.

GREEN gate:

1. all required Phase 30 fixture families load deterministically,
2. Phase 30 inspectors are visible through test-mode stats,
3. new Phase 30 table counts start at `0` after reset,
4. the M29 baseline remains readable through the same stats surface.

Measurable metrics:

1. repeated `__test__/reset` yields identical fixture manifest hashes,
2. `library_item_revisions`, `conversation_artifacts`, `library_shelves`, and `library_shelf_items` all equal `0` after reset,
3. `inspectors.revisions|conversationArtifacts|shelves|registryPreview|benchmarks` all equal `true`,
4. the fixture loader returns non-empty data for `library_authoring_seed`, `library_registry_browse_seed`, and `library_guided_flow_seed`.

Required doc sync:

1. `specs/30_house_library_authoring_exchange_tdd_spec.md`

Verification:

1. `npx playwright test e2e/212_house_library_authoring_harness.spec.js`

### M30.1 - Direct Library note authoring shell

Purpose:

1. let users write a local Library note directly inside House Library,
2. keep the authoring path simple for users without technical background,
3. persist note provenance as `user_note` or equivalent local-first source.

Primary test:

1. `e2e/213_house_library_note_authoring_ui.spec.js`

RED gate:

1. there is no same-shell authoring UI in Library,
2. creating a note requires Workshop or an unrelated surface,
3. saved notes cannot be distinguished from imported or promoted items.

GREEN gate:

1. House Library exposes a direct-note authoring path inside `/app`,
2. saving one note persists a local editable Library item,
3. the note appears immediately in the Library list with local provenance and no worker restart.

Measurable metrics:

1. opening the note composer preserves `pathname == "/app"`,
2. active worker session id stays unchanged before and after save,
3. saving one note increments `library_items` by exactly `1`,
4. saving one note increments `library_item_revisions` by exactly `1`,
5. saving one direct note leaves `library_links` unchanged,
6. the saved item exposes `sourceKind == "user_note"` or equivalent,
7. the newly saved note renders at the top of the Library list in deterministic newest-first order.

Implementation notes:

1. first-pass fields should be minimal:
   - `Title`
   - `What should the agent remember?`
2. the initial authoring path should be plain text only,
3. direct-note authoring should default to private and local.

Required doc sync:

1. `specs/30_house_library_authoring_exchange_tdd_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/213_house_library_note_authoring_ui.spec.js`

### M30.2 - Local item editing and revision history

Purpose:

1. let users edit local Library items,
2. preserve prior versions,
3. block edits for imported or read-only items.

Primary test:

1. `e2e/214_house_library_item_revision_history.spec.js`

RED gate:

1. local Library items cannot be edited,
2. edits overwrite the only stored version,
3. imported items appear editable even though they are not.

GREEN gate:

1. local items are editable from the Library surface,
2. each edit stores a new revision row while keeping the same `libraryItemId`,
3. imported or read-only items reject edits through both UI and route contract.

Measurable metrics:

1. editing one local item increments `library_item_revisions` by exactly `1`,
2. editing one local item leaves `library_items` row count unchanged,
3. the latest revision `contentHash` differs from the previous revision hash after a text change,
4. `GET /api/platform/library/items/:id/revisions` or equivalent returns both old and new versions in deterministic order,
5. editing an imported item returns a stable error such as `LIBRARY_ITEM_READ_ONLY`,
6. after refresh, the latest item view matches the latest revision exactly.

Implementation notes:

1. first-pass revision history may be text-summary or simple diff preview only,
2. Phase 30 does not require multi-user merge handling,
3. the edit surface should remain in Library for notes and local captures; Workshop remains the file-editing surface.

Required doc sync:

1. `specs/30_house_library_authoring_exchange_tdd_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/214_house_library_item_revision_history.spec.js`

### M30.3 - Conversation capture desk

Purpose:

1. let users capture selected conversation material into the Library,
2. require a review step before saving,
3. preserve exact source provenance back to the chosen messages.

Primary test:

1. `e2e/215_house_library_conversation_capture.spec.js`

RED gate:

1. Library has no conversation-capture path,
2. capture saves raw conversation material without review,
3. saved capture includes unselected turns or hidden scope expansion.

GREEN gate:

1. House exposes a reviewable conversation-capture path,
2. the reviewed capture saves exactly the selected messages,
3. the resulting Library item records conversation provenance deterministically.

Measurable metrics:

1. capturing selected conversation messages creates exactly `1` `conversation_artifacts` row,
2. saving the reviewed capture increments `library_items` by exactly `1`,
3. saving the reviewed capture increments `library_links` by exactly `1`,
4. saving the reviewed capture increments `library_item_revisions` by exactly `1`,
5. stored `sourceKind` equals `conversation_artifact` or equivalent stable value,
6. the stored conversation-artifact message id list matches the selected ids exactly and in order,
7. the active Reading Table is unchanged unless the user explicitly chooses `Bring to chat now`.

Implementation notes:

1. the review step should show speaker labels and the selected excerpt text,
2. users should be able to rename the capture before saving,
3. capture should stay private and local by default.

Required doc sync:

1. `specs/30_house_library_authoring_exchange_tdd_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/215_house_library_conversation_capture.spec.js`

### M30.4 - Shelves and deterministic filters

Purpose:

1. organize Library items without turning the product into a cluttered database admin UI,
2. let users group items by room, topic, or project,
3. provide deterministic filters that reduce search burden.

Primary test:

1. `e2e/216_house_library_shelves_and_filters.spec.js`

RED gate:

1. Library items cannot be organized into shelves,
2. filtering is missing or unstable,
3. assigning items to shelves duplicates rows on replay.

GREEN gate:

1. users can create shelves and assign items to them,
2. the Library list can filter by shelf and basic facets,
3. shelf membership is deterministic and replay-safe.

Measurable metrics:

1. creating one shelf increments `library_shelves` by exactly `1`,
2. assigning `N` items to one shelf increments `library_shelf_items` by exactly `N`,
3. reassigning the same item to the same shelf creates `0` additional rows,
4. removing one item from the shelf decrements only `library_shelf_items`,
5. filtering by shelf returns the exact expected ordered item ids,
6. filtering by `sourceKind` or `importState` remains deterministic across three consecutive seeded runs.

Implementation notes:

1. drag-and-drop is not required in Phase 30,
2. the initial shelf UI may be button-driven or menu-driven,
3. filter vocabulary should stay plain:
   - `Local`
   - `Imported`
   - `From conversation`
   - `From Workshop`
   - `Published`

Required doc sync:

1. `specs/30_house_library_authoring_exchange_tdd_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/216_house_library_shelves_and_filters.spec.js`

### M30.5 - Satchels and guided scope reuse

Purpose:

1. turn current ad hoc Reading Table selection into a clearer reusable pack flow,
2. preserve the existing `scope_sets` contract,
3. make saved scope reuse easier for non-technical users.

Primary test:

1. `e2e/217_house_library_satchel_scope_sets.spec.js`

RED gate:

1. users cannot save a reusable Satchel from the current selection or a shelf,
2. Satchel reopen mutates items beyond the saved ordered ids,
3. the UI introduces a second hidden scope model separate from `scope_sets`.

GREEN gate:

1. the user can save the current Reading Table or a shelf selection as a Satchel,
2. reopening a Satchel restores the exact saved ordered item ids,
3. the same operation still maps to the canonical `scope_sets` and `scope_set_items` contract.

Measurable metrics:

1. saving one Satchel increments `scope_sets` by exactly `1`,
2. saving a Satchel with `N` items increments `scope_set_items` by exactly `N`,
3. reopening a Satchel updates the active scope ids exactly once and with no extra ids,
4. reordering items inside a Satchel affects only the saved scope order and not shelf membership,
5. reusing an existing Satchel keeps the saved title unchanged.

Implementation notes:

1. `Reading Table` should remain the label for the active current-chat selection,
2. `Satchel` should mean a saved reusable Reading Table,
3. do not introduce a new durable pack table unless `scope_sets` is proven insufficient and the spec is updated in the same change.

Required doc sync:

1. `specs/30_house_library_authoring_exchange_tdd_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/217_house_library_satchel_scope_sets.spec.js`

### M30.6 - Public Stacks browse and preview

Purpose:

1. let users discover public artifacts from inside the Library shell,
2. reuse existing Registry search and detail primitives,
3. make preview possible before import.

Primary test:

1. `e2e/218_house_library_registry_browse_preview.spec.js`

RED gate:

1. Public Stacks browse is missing from the Library panel,
2. Registry search requires leaving `/app`,
3. users can import only by typing a raw Registry id with no preview.

GREEN gate:

1. House Library exposes a same-shell Public Stacks search and preview path,
2. search results and previews come from the existing Registry contract,
3. preview makes trust and provenance visible before import.

Measurable metrics:

1. Public Stacks search returns the exact seeded result count for the seeded query,
2. opening a preview preserves `pathname == "/app"`,
3. active worker session id stays unchanged before and after preview,
4. preview shows non-empty `registryId`, family, and provenance fields,
5. selecting `Import` from preview pre-populates or launches the guided import flow for the same `registryId`,
6. direct page navigation to standalone Registry pages is not required for this flow.

Implementation notes:

1. reuse `GET /api/registry/search`, `GET /api/registry/entities/:id`, and `GET /api/registry/proof/:registryId` where possible,
2. reuse `agent_town_ui_registry_search` or expose an equivalent Library-specific wrapper without changing the Registry backend contract,
3. keep Public Stacks deterministic and seeded in test mode.

Required doc sync:

1. `specs/30_house_library_authoring_exchange_tdd_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/218_house_library_registry_browse_preview.spec.js`

### M30.7 - Guided publish and import wizard

Purpose:

1. replace the current raw-field import and publish flow with a guided flow,
2. make trust, provenance, and approval explicit before the action,
3. preserve the existing M29 durable publication and import rules.

Primary test:

1. `e2e/219_house_library_guided_exchange_wizard.spec.js`

RED gate:

1. publish and import still rely only on raw text inputs,
2. trust and approval state are unclear before the action,
3. replay and duplicate import behavior is not visible to the user.

GREEN gate:

1. Library exposes guided publish and import steps inside the existing shell,
2. publish preview shows the selected local item, approval requirement, and trust labels,
3. import preview shows the selected Registry artifact, provenance, and duplicate handling.

Measurable metrics:

1. publishing without approval returns a stable error code and creates `0` new publication rows,
2. approved publish creates exactly `1` new `library_publications` row,
3. replaying the same publish idempotency key creates `0` additional publication rows,
4. importing the same `registryId` twice creates exactly `1` imported Library item total,
5. sealed-source items remain blocked from publication with a visible policy explanation,
6. publish and import previews both display non-empty trust labels before confirmation.

Implementation notes:

1. the old M29 raw input controls may remain behind the scenes until this milestone is green, but the user-facing path should become the guided wizard,
2. proof or receipt details may appear as secondary detail, not as required jargon on the first screen,
3. the final action must stay explicit and human-triggered.

Required doc sync:

1. `specs/30_house_library_authoring_exchange_tdd_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/219_house_library_guided_exchange_wizard.spec.js`

### M30.8 - Pixel-RPG copy and accessibility contract

Purpose:

1. keep the Library readable and welcoming for non-technical users,
2. preserve the current Portal style instead of introducing a disconnected UI language,
3. make the House Library operable with keyboard and assistive naming.

Primary test:

1. `e2e/220_house_library_pixel_rpg_copy_a11y.spec.js`

RED gate:

1. primary Library copy uses unexplained technical jargon,
2. keyboard navigation misses critical actions,
3. validation and status messages are not exposed through accessible names or live regions.

GREEN gate:

1. the primary Library path uses plain language and House-native labels,
2. keyboard users can complete create, edit, shelf, Satchel, browse, import, and publish flows,
3. validation and success states are screen-readable.

Measurable metrics:

1. primary headings include `Library`, `Reading Table`, and `Public Stacks` or approved plain-language equivalents,
2. the copy audit finds `0` appearances of `embedding`, `vector`, `RAG`, `retrieval`, or `context window` on the primary Library path,
3. the main create-note flow is completable using only keyboard interactions in deterministic tab order,
4. the publish or import wizard exposes one deterministic status region with non-empty text on success and failure,
5. every button in the main Library action row has a non-empty accessible name.

Implementation notes:

1. this milestone should refine language and accessibility, not replace the House visual system,
2. keep copy concrete:
   - `Choose what the agent may use in this chat.`
   - `Save this note to your Library.`
   - `This item is imported and read only.`
3. avoid gamified clutter, currencies, or noisy progress metaphors.

Required doc sync:

1. `specs/30_house_library_authoring_exchange_tdd_spec.md`
2. `specs/28_house_library_memory_spec.md`

Verification:

1. `npx playwright test e2e/220_house_library_pixel_rpg_copy_a11y.spec.js`

### M30.9 - House Library skill and tool contract v2

Purpose:

1. expose every new Phase 30 capability through the worker tool surface,
2. keep the House Library skill pack aligned with the actual UI and storage model,
3. preserve worker-first behavior for agent-driven Library work.

Primary test:

1. `e2e/221_house_library_skill_tool_contract_v2.spec.js`

RED gate:

1. new Library capabilities are human-only and hidden from the worker tool surface,
2. the router chooses the wrong specialist skill family,
3. `Workshop Scribe` or another skill starts editing Library notes through the wrong tool family.

GREEN gate:

1. the worker tool surface exposes stable Phase 30 Library capabilities,
2. the House Library pack compiles and routes correctly,
3. worker observability panels show the new capabilities deterministically.

Measurable metrics:

1. the Worker Tools tab exposes at least these new stable tool names or exact equivalents:
   - `house_library_update_item`
   - `house_library_read_revisions`
   - `house_library_capture_conversation`
   - `house_library_list_shelves`
   - `house_library_write_shelf`
   - `house_library_preview_registry_artifact`
2. `House Librarian` handles direct note authoring, note edits, shelf actions, and Satchel actions,
3. `Registry Curator` handles Public Stacks search, preview, import, and publish assistance,
4. `Workshop Scribe` remains the only skill that calls workspace write or edit tools,
5. the Worker Traffic pane shows at least one deterministic call trace for a Phase 30 Library action,
6. `public/skill.md` remains present and readable.

Implementation notes:

1. do not add a new specialist unless the existing four-role pack proves insufficient and the routing evidence is updated in the same change,
2. if tool names differ, the spec must be updated in the same change so the contract remains exact,
3. the worker path should use the same durable APIs as the human path.

Required doc sync:

1. `specs/30_house_library_authoring_exchange_tdd_spec.md`
2. `specs/03_skill_spec.md`
3. `docs/internal-skill-testline.md`

Verification:

1. `npx playwright test e2e/221_house_library_skill_tool_contract_v2.spec.js`

### M30.10 - Benchmark and evaluation harness

Purpose:

1. give AI agent developers a deterministic scorecard for Library quality,
2. move beyond "test passes" toward measured scope precision, trust behavior, and copy quality,
3. keep evaluation offline-safe and reproducible.

Primary test:

1. `e2e/222_house_library_benchmark_harness.spec.js`

RED gate:

1. there is no deterministic benchmark report,
2. scope precision, leakage, or unsafe publish behavior are not measurable,
3. benchmark output changes across identical seeded resets.

GREEN gate:

1. the benchmark harness publishes a deterministic scorecard JSON,
2. the defined evaluation metrics match the seeded expected values exactly,
3. the same reset yields the same benchmark output hash across repeated runs.

Measurable metrics:

1. `scopePrecision == 1.0`,
2. `scopeLeakRate == 0.0`,
3. `unsafePublishBlockRate == 1.0`,
4. `provenanceVisibilityRate == 1.0`,
5. `noviceCopyPassRate == 1.0`,
6. `benchmarkOutputHash` remains identical across three consecutive runs of the same seeded fixture.

Implementation notes:

1. the benchmark harness is a contract test surface, not a live-model leaderboard,
2. use seeded scenarios and deterministic inspectors rather than subjective scoring,
3. make the benchmark JSON inspectable by AI coding agents and humans.

Required doc sync:

1. `specs/30_house_library_authoring_exchange_tdd_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/222_house_library_benchmark_harness.spec.js`

### M30.11 - Full guided memory journey smoke

Purpose:

1. prove the full Phase 30 user journey in one deterministic flow,
2. verify same-shell continuity from start to finish,
3. show that Library authoring, capture, organization, reuse, and exchange work together.

Primary test:

1. `e2e/223_house_library_guided_memory_loop.spec.js`

RED gate:

1. one or more earlier milestones works in isolation but not together,
2. the full journey forces full-page navigation, worker restart, or scope drift,
3. the full journey creates inconsistent counts or mismatched prompt preview state.

GREEN gate:

1. one same-shell House run completes the full guided journey,
2. worker continuity is preserved,
3. counts, provenance, and prompt scope all match the seeded expected values exactly.

Measurable metrics:

1. the browser stays on `/app` for the full flow,
2. active worker session id is unchanged from start to finish,
3. the full flow creates exactly:
   - `+1` direct note,
   - `+1` conversation artifact,
   - `+1` conversation-derived Library item,
   - `+1` shelf,
   - `+1` Satchel or saved Reading Table,
   - `+1` import,
   - `+1` publication,
4. the final prompt preview contains only the Satchel-selected ordered item ids and no extras,
5. the imported item remains read-only after the full flow,
6. the final Library view shows visible provenance for the note, the conversation-derived item, the imported item, and the published item.

Implementation notes:

1. the smoke should start from a seeded House Library baseline, not a hidden backend shortcut,
2. the smoke should use the player-facing UI path, not private helper routes,
3. the smoke should preserve the current Portal look and same-shell flow.

Required doc sync:

1. `specs/30_house_library_authoring_exchange_tdd_spec.md`
2. `specs/28_house_library_memory_spec.md`
3. `specs/29_house_library_memory_tdd_spec.md`

Verification:

1. `npx playwright test e2e/223_house_library_guided_memory_loop.spec.js`

## 6. Phase Exit Criteria

Phase 30 is complete only when all of the following are true:

1. `e2e/212` through `e2e/223` are green,
2. the shipped M29 Library block `e2e/195` through `e2e/209` remains green,
3. all touched Library-related regressions outside the reserved block are green,
4. the full repo gate `npm test` is green,
5. the benchmark harness reports the exact expected scorecard values,
6. no milestone regresses the worker-first, modal-first, or wallet-first platform rules in `AGENTS.md`.

## 7. Developer Roadmap Summary

Recommended implementation order for AI agent developers:

1. Lock the harness first with `M30.0`.
2. Ship authoring and revisions before adding more Library surface area.
3. Add conversation capture before shelves so captured knowledge has a first-class destination.
4. Add shelves before Satchels so reusable packs can be built from meaningful organization.
5. Reuse existing Registry primitives for browse before redesigning publish or import.
6. Replace raw-field exchange UX only after preview and trust labels exist.
7. Audit copy and accessibility before freezing the worker-tool contract.
8. Add the benchmark harness before the full journey smoke so the smoke has a measurable scorecard.
9. Finish with the joined proof and only then plan peer transport extensions.

## 8. Post-phase extension track

Not part of the Phase 30 default gate, but explicitly planned next:

1. Registry-backed peer relay or Pony-network replication for public artifacts,
2. opt-in pack sharing between Houses,
3. signed or chain-anchored publication receipts as secondary proof,
4. moderation or trust-tier overlays for imported public artifacts.

Rules for the extension track:

1. Do not replace Registry ids with transport-specific ids.
2. Do not weaken local read-only, approval, or seal rules.
3. Do not make peer transport a required dependency for private Library use.
4. Do not change the Reading Table or Satchel scope contract without a new spec and new reserved tests.
