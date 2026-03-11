# Phase 29 Spec: House Library, Guided Memory, and Public Knowledge Exchange (Contracts First, TDD)

Status: Draft
Version: 1.0
Audience: frontend engineers, backend engineers, runtime engineers, UX engineers, security engineers, QA automation engineers, AI agent implementers, and AI coding agents
Depends on:
1. [specs/28_house_library_memory_spec.md](./28_house_library_memory_spec.md)
2. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
3. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
4. [specs/02_api_contract.md](./02_api_contract.md)
5. [specs/03_skill_spec.md](./03_skill_spec.md)
6. [docs/internal-skill-testline.md](../docs/internal-skill-testline.md)
7. [AGENTS.md](../AGENTS.md)

Goal: turn the House Library product concept into a deterministic, worker-first, House-native implementation plan with measurable success criteria at every step.

Implementation constraints:

1. Keep House modal-first and shell-preserving.
2. Keep worker-first architecture. The browser worker decides how memory is used; the server stores and enforces durable policy.
3. Keep Archive append-only and factual.
4. Keep Workshop as the editable surface for files and packs.
5. Keep House Library as the curated layer rather than a replacement for Archive or Workshop.
6. Keep Registry as the canonical public publishing and import surface.
7. Keep Pony or bittorrent-style transport out of the critical path for the default test gate.
8. Keep `public/skill.md` stable; the House Library skill pack must be additive.
9. Keep all default tests offline-safe and seeded.
10. A milestone is not complete until its docs, routes, tools, fixtures, and tests are updated together.

## 1. Executive Summary

This phase closes the memory-management gap between the existing House surfaces and the new House Library vision.

Implementation order:

1. harness and observability,
2. House Library read surface,
3. curated item creation and provenance linking,
4. guided scope selection,
5. worker prompt and skill-pack integration,
6. Workshop editor read surface,
7. Workshop write approval plus Library snapshotting,
8. Archive-to-Library promotion,
9. Registry publication,
10. Registry import,
11. seal-aware visibility and publish blocking,
12. end-to-end smoke.

The design target is not a generic knowledge-management app.
It is a House-native memory system that feels like the rest of Portal:

1. pixel-RPG readable,
2. plain-language labels,
3. deterministic ids and counters,
4. explicit human control over what is in scope,
5. honest worker behavior.

### 1.1 Roadmap waves

#### Wave A - Private House Library

1. `M29.0` to `M29.4`
2. House Library surface
3. item creation
4. scope sets
5. worker prompt and skill routing

#### Wave B - Guided Workshop integration

1. `M29.5` to `M29.7`
2. file editor read surface
3. approval-gated writes
4. trace or trainer promotion into Library

#### Wave C - Public exchange

1. `M29.8` to `M29.10`
2. publish to Registry
3. import from Registry
4. seal and policy enforcement

#### Wave D - Joined proof

1. `M29.11`
2. one full House memory loop inside the existing shell

#### Wave E - Post-phase transport extension

1. not in the default Phase 29 gate
2. optional Pony or bittorrent-style replication layered on top of Registry publication contracts
3. must preserve the same ids, hashes, visibility rules, and approval model established in Wave C

### 1.2 Reserved Playwright block

1. `195` to `206`

Reserved tests:

1. `e2e/195_library_harness.spec.js`
2. `e2e/196_house_library_surface.spec.js`
3. `e2e/197_library_item_create_link.spec.js`
4. `e2e/198_library_scope_selection.spec.js`
5. `e2e/199_library_skill_pack_scope_prompt.spec.js`
6. `e2e/200_workshop_editor_surface.spec.js`
7. `e2e/201_workshop_editor_approval_snapshot.spec.js`
8. `e2e/202_library_trace_promotion.spec.js`
9. `e2e/203_library_publish_registry.spec.js`
10. `e2e/204_library_import_registry.spec.js`
11. `e2e/205_library_seal_policy.spec.js`
12. `e2e/206_house_library_full_smoke.spec.js`

### 1.3 Current verified platform baseline

This phase starts from verified platform surfaces that already exist in the repo.
AI agent developers should extend these contracts rather than creating parallel systems.

Current verified baseline:

1. House Console already exposes `Experiences`, `Workshop`, `Tracks`, `Archive`, and `Trainer` inside the same shell.
2. Current House read routes already exist for:
   - `GET /api/platform/experiences`
   - `GET /api/platform/workshop`
   - `GET /api/platform/archive`
   - `GET /api/platform/tracks`
   - `GET /api/platform/trainer`
3. Unified-platform test stats already expose deterministic `fixtureManifest`, `fixtureManifestHash`, and `inspectors.artifacts|seals|house|tracks`.
4. The runtime already exposes production workspace primitives:
   - `workspace_list`
   - `workspace_read_file`
   - `workspace_write_file`
   - `workspace_edit_file`
   - `workspace_delete`
5. Persistent workspace writes are already approval-gated in the runtime and must remain so.
6. The current platform already has deterministic House fixture families such as `house_workshop_seed`, `tracks_core_seed`, and `joined_completion_smoke_seed`.
7. Repo-workbench behavior already proves the platform can support approval-gated read, patch, and PR-oriented workflows without bypassing the worker contract.

Design implication:

1. House Library is an additive House surface, not a replacement shell.
2. Workshop editor work should reuse the existing workspace/VFS path and approval model.
3. New Library observability should extend the current unified-platform stats surface instead of inventing a second test harness.
4. Public exchange should extend Registry rather than introducing a second publication system.

## 2. Global Measurable Metrics

Every milestone must publish measurable proof using the metric classes below.

### 2.1 House Library surface metrics

1. Opening House Library keeps the browser on `/app`.
2. Opening House Library does not rotate the active worker session id.
3. Library list and detail content are deterministic for seeded fixtures.
4. Empty states are deterministic and distinct from Archive or Workshop empty states.
5. House/team context is explicit in the Library read payload.

### 2.2 Curation and provenance metrics

1. Creating one Library item increments `library_items` by exactly `1`.
2. Creating one source link increments `library_links` by exactly `1`.
3. Adding a Library item does not mutate source Archive rows, Workshop rows, or Trainer rows.
4. Each created item stores a stable `contentHash`.
5. Each created item exposes stable `sourceKind` and `sourceRef`.

### 2.3 Scope and prompt metrics

1. The active scope set contains exactly the item ids the user selected, in deterministic order.
2. Removing an item from scope does not delete the underlying Library item.
3. Worker prompt preview includes selected Library items and excludes unselected private items.
4. Runtime/session context exposes a stable `activeScopeSetId` or equivalent.
5. A scope-aware turn does not silently widen selection beyond the explicit scope set.

### 2.4 Workshop editor metrics

1. The editor opens inside the current shell and preserves worker continuity.
2. Reading a Workshop file returns the same content as the current workspace/VFS state.
3. Persistent writes fail closed without approval.
4. Approved writes create exactly one durable or inspectable write event.
5. Optional Library snapshots created from Workshop edits preserve source linkage back to the file path or config version.

### 2.5 Publication and import metrics

1. Publishing without approval fails with a stable error code.
2. Approved publish creates exactly one durable publication row.
3. Replaying the same publish idempotency key does not create a second publication row.
4. Imported artifacts preserve `registryId`, `contentHash`, and provenance refs.
5. Imported artifacts are read-only until explicitly copied into Workshop or re-curated into a new local item.

### 2.6 Seal and trust metrics

1. Seal-aware Library reads either redact, filter, or reject deterministically.
2. Sealed-source items cannot be published when policy forbids publication.
3. Publication failures caused by seals are auditable through one durable row or equivalent stable ledger entry.
4. Public exchange never bypasses House-private visibility defaults.
5. Provenance labels remain visible on imported and published artifacts.

### 2.7 Skill and tool metrics

1. The House Library skill pack compiles through the existing internal pack model.
2. The router skill selects exactly one specialized skill before acting.
3. The `House Librarian` skill uses Library tools rather than raw unrelated workarounds.
4. The `Workshop Scribe` skill uses workspace tools for file operations.
5. `public/skill.md` remains externally stable and readable.

### 2.8 Portability metrics

1. Platform export includes new Library-related tables once they are introduced.
2. Export row counts match live Library-related row counts at export time.
3. Import into an empty store reproduces the same Library-related counts.
4. Verification reports exact mismatches by table and id.

### 2.9 Plain-language UX metrics

1. House Library labels remain readable without AI, ML, or computer-science knowledge.
2. Primary user-facing labels use Library, Workshop, Archive, Registry, Reading Table, Satchel, or similarly plain terms.
3. Default Library surfaces do not require the user to understand terms such as `embedding`, `vector`, `RAG`, `retrieval`, or `context window`.
4. Scope-selection copy makes it explicit that the user is choosing what the agent may use in this chat.
5. Public/private state is explained with plain visibility labels rather than implementation jargon.

### 2.10 Agent developer scorecard

Every milestone should be judged with the scorecard below in addition to its primary test.
A milestone is only complete when every applicable scorecard item is green.

1. Contract score:
   - all required route names, tool names, error codes, and test ids match this spec exactly or the spec is updated in the same change.
2. Determinism score:
   - the milestone primary test passes `3` consecutive local runs with identical counts, ids, hashes, and prompt-preview assertions for the same seeded reset.
3. Continuity score:
   - any milestone that opens a House surface or Workshop editor preserves `pathname == "/app"` and keeps the active worker session id unchanged.
4. Approval score:
   - any milestone with a write, publish, or policy block path proves both deny and allow branches with exact row-count assertions.
5. Observability score:
   - every new durable object or runtime state introduced by the milestone is inspectable through one deterministic test-mode surface.
6. Documentation score:
   - every required doc-sync item listed under the milestone is updated in the same change before the milestone is considered complete.

Recommended developer gate:

1. primary milestone test passes,
2. touched regression tests pass,
3. scorecard items are all green,
4. phase exit still requires full `npm test`.

## 3. Test Harness Rules

1. Default `npm test` must remain deterministic and offline-safe.
2. All Library tests must use seeded fixtures only.
3. Prompt-preview assertions must rely on deterministic runtime inspection, not subjective reading of chat output.
4. Registry publish or import tests must not call live public services.
5. Workshop editor tests must use the production worker/VFS path, not a fake editor implementation.
6. If a milestone adds a skill pack, it must be test-first and compatible with the existing internal compiled-pack model.
7. Any new approval path must have deterministic allow and deny coverage.
8. Any new sealed/private behavior must have deterministic allow, redact, and reject coverage where applicable.
9. Full smoke must remain inside the current House shell and preserve worker continuity.
10. Structural refactors are allowed only after the contract is locked by the milestone test.

## 4. Required Fixtures and Observability

### 4.1 Fixture families

This phase requires at least:

1. `library_private_seed`
2. `library_item_link_seed`
3. `library_scope_seed`
4. `library_prompt_scope_seed`
5. `library_workshop_seed`
6. `library_trace_promotion_seed`
7. `library_publish_seed`
8. `library_import_seed`
9. `library_seal_seed`
10. `library_skill_pack_seed`
11. `library_full_smoke_seed`

### 4.2 Test-mode observability

At least one deterministic mechanism must exist to inspect:

1. counts for `library_items`, `library_links`, `scope_sets`, `scope_set_items`, and `library_publications`,
2. the active worker session id,
3. the active scope set and its ordered item ids,
4. the last Library-aware worker prompt preview or equivalent prompt-context snapshot,
5. Workshop editor file content, diff preview, and write event count,
6. publication records and idempotent replay behavior,
7. seal-related read or publish audit outcomes,
8. Library-related export/import counts,
9. conversation-derived item provenance or equivalent approved conversation-source refs.

Equivalent mechanisms are allowed.

### 4.3 Required `__test__/unified-platform/stats` expansion

By the end of `M29.0`, the unified platform test stats endpoint must expose:

1. `fixtureManifest`
2. `fixtureManifestHash`
3. `inspectors.library`
4. `inspectors.scopes`
5. `inspectors.publications`
6. `inspectors.promptPreview`
7. `inspectors.editor`

## 5. Milestone Map

### 5.1 Milestone implementation contract

Unless a milestone explicitly says otherwise, the implementing change set should contain all of the following:

1. one new failing Playwright spec or one expanded existing reserved Playwright spec first,
2. fixture-family or seed updates required by that spec,
3. route, store, UI, or worker changes required to make the test pass,
4. test-mode observability required to prove the measurable metrics,
5. doc-sync updates listed under the milestone,
6. no backend shortcut that bypasses worker-first or modal-first rules.

Milestone review questions for AI agent developers:

1. Did this change extend the existing House shell or accidentally create a competing path?
2. Can the measurable metrics be asserted by code, not by human interpretation?
3. Is every new write path approval-gated or explicitly user-triggered?
4. Did this change preserve Archive immutability and Workshop ownership boundaries?
5. Can another agent reproduce the same result after `__test__/reset` with no hidden setup?

Milestones must be implemented in order.
Do not start GREEN work on a later milestone until the immediately prior milestone is passing.

### M29.0 - Library harness and fixture alignment

Purpose:

1. reserve the Phase 29 block,
2. add required fixture families,
3. extend unified-platform stats and observability for Library work.

Primary test:

1. `e2e/195_library_harness.spec.js`

RED gate:

1. fixture families are missing,
2. unified-platform stats expose no Library inspectors,
3. there is no deterministic way to inspect scope sets or prompt preview state.

GREEN gate:

1. all required fixture families load deterministically,
2. stats expose the required inspectors,
3. Library-related counts start at `0` after reset.

Measurable metrics:

1. repeated `__test__/reset` yields identical fixture manifest hashes,
2. `library_items`, `library_links`, `scope_sets`, `scope_set_items`, and `library_publications` all equal `0` after reset,
3. `inspectors.library|scopes|publications|promptPreview|editor` all equal `true`,
4. the fixture loader returns non-empty data for `library_private_seed`, `library_skill_pack_seed`, and `library_full_smoke_seed`.

Required doc sync:

1. `specs/28_house_library_memory_spec.md`
2. `specs/29_house_library_memory_tdd_spec.md`

Verification:

1. `npx playwright test e2e/195_library_harness.spec.js`

### M29.1 - House Library surface

Purpose:

1. add the House Library button and panel,
2. preserve same-shell continuity,
3. expose deterministic Library list and empty-state behavior.

Primary test:

1. `e2e/196_house_library_surface.spec.js`

RED gate:

1. House Console exposes no Library surface,
2. opening Library causes full-page navigation or worker restart,
3. Library reads are missing House or team context.

GREEN gate:

1. House exposes a Library button and panel,
2. opening Library preserves worker continuity,
3. `GET /api/platform/library` returns a deterministic payload with `houseId`, `teamId`, `items`, and `emptyStateText`.

Measurable metrics:

1. opening Library leaves `window.location.pathname == "/app"`,
2. active worker session id stays unchanged before and after opening Library,
3. seeded items render in stable order,
4. empty state text is exactly `No curated Library items yet.`,
5. Library list count equals seeded payload item count exactly.

Implementation notes:

1. `GET /api/platform/library` is the first mandatory read route,
2. House Library should reuse the current list/detail/action panel shape from House,
3. player-facing copy must avoid technical memory jargon.

Required doc sync:

1. `specs/28_house_library_memory_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/196_house_library_surface.spec.js`

### M29.2 - Library item creation and source linking

Purpose:

1. let the platform create curated Library items,
2. preserve explicit provenance to source objects,
3. keep Archive and Workshop immutable from the Library side.

Primary test:

1. `e2e/197_library_item_create_link.spec.js`

RED gate:

1. Library items cannot be created through a stable route,
2. created items lose source provenance,
3. creating a Library item mutates the underlying source record.

GREEN gate:

1. `POST /api/platform/library/items` accepts stable creation payloads,
2. each created item persists one `library_items` row plus the expected `library_links` rows,
3. source rows remain unchanged.

Measurable metrics:

1. creating one item increments `library_items` by exactly `1`,
2. creating one source link increments `library_links` by exactly `1`,
3. created item returns non-empty `libraryItemId` and `contentHash`,
4. replaying the same idempotency key returns the same `libraryItemId`,
5. source trace or config counts are unchanged after item creation,
6. creating one item from an approved conversation-derived source preserves `sourceKind` and `sourceRef` exactly.

Implementation notes:

1. `sourceKind` must be explicit and validated,
2. supported first-pass source kinds must include `trace`, `trainer_result`, `config_version`, `workspace_file`, and at least one conversation-derived source such as `conversation_excerpt` or `inbox_message`,
3. stable failure codes should include `LIBRARY_SOURCE_REQUIRED`, `LIBRARY_SOURCE_INVALID`, and `LIBRARY_IDEMPOTENCY_REQUIRED` if those constraints are chosen.

Required doc sync:

1. `specs/28_house_library_memory_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/197_library_item_create_link.spec.js`

### M29.3 - Scope set selection

Purpose:

1. make in-scope context visible,
2. keep user control over what the agent may use,
3. separate curation from conversation scoping.

Primary test:

1. `e2e/198_library_scope_selection.spec.js`

RED gate:

1. users cannot explicitly add or remove Library items from the current chat scope,
2. scope selection deletes or mutates Library items,
3. scope ordering is unstable.

GREEN gate:

1. `GET /api/platform/library/scope` and `POST /api/platform/library/scope` expose a stable scope contract,
2. selected items appear in deterministic order,
3. removing an item from scope does not delete the underlying item.

Measurable metrics:

1. creating one scope set increments `scope_sets` by exactly `1`,
2. adding `N` items increments `scope_set_items` by exactly `N`,
3. the returned ordered item ids exactly match the selected order,
4. removing one item decrements only `scope_set_items`,
5. `library_items` row count stays unchanged during scope edits.

Implementation notes:

1. the UI label should be `Selected for this chat` or equivalent Reading Table copy,
2. scope set should be attached to active House/team context,
3. production path should not assume a hidden default item order.

Required doc sync:

1. `specs/28_house_library_memory_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/198_library_scope_selection.spec.js`

### M29.4 - Skill pack routing and scope-aware prompt contract

Purpose:

1. add the House Library skill pack through the internal pack model,
2. ensure the router selects one specialized skill,
3. ensure the worker prompt sees the active scope set.

Primary test:

1. `e2e/199_library_skill_pack_scope_prompt.spec.js`

RED gate:

1. no skill pack exists for House Library behaviors,
2. selected scope items do not reach the worker prompt,
3. router skill does not choose exactly one specialized skill.

GREEN gate:

1. the House Library skill pack compiles into the current internal pack shape,
2. prompt preview includes active scope set ids or refs,
3. the router skill chooses exactly one specialized skill,
4. `House Librarian` and `Workshop Scribe` choose the correct tool families for the request type.

Measurable metrics:

1. compiled pack exposes stable `packVersionId` and `contentHash`,
2. prompt preview includes all selected item ids and excludes unselected private item ids,
3. tool registry exposes the new Library tool names when the feature is enabled,
4. router selection is deterministic across repeated runs against the same seeded request,
5. `public/skill.md` content hash remains unchanged unless explicitly updated in the same milestone.

Implementation notes:

1. use the existing compiled-pack bridge rather than a separate skill runtime,
2. prompt preview should remain inspectable through the current debug APIs,
3. do not auto-activate the public Registry Curator skill during private-only flows,
4. the pack should expose the router plus `House Librarian`, `Archive Clerk`, `Workshop Scribe`, and `Registry Curator` as named specialized skills.

Required doc sync:

1. `specs/03_skill_spec.md`
2. `docs/internal-skill-testline.md`
3. `specs/28_house_library_memory_spec.md`

Verification:

1. `npx playwright test e2e/199_library_skill_pack_scope_prompt.spec.js`

### M29.5 - Workshop editor read surface

Purpose:

1. expose first-class file reading in Workshop,
2. preserve existing worker/VFS behavior,
3. keep editing inside the House shell.

Primary test:

1. `e2e/200_workshop_editor_surface.spec.js`

RED gate:

1. Workshop still shows only lineage metadata,
2. files cannot be browsed or read from the House shell,
3. opening the editor breaks continuity.

GREEN gate:

1. Workshop exposes a minimal file browser and read view,
2. file reads reflect the current workspace/VFS state,
3. opening files keeps the same worker session id and shell path.

Measurable metrics:

1. file list order is deterministic for seeded workspace content,
2. reading a seeded file returns exact text content,
3. opening the editor leaves `pathname == "/app"`,
4. worker session id remains unchanged across editor open and file read,
5. Library or Archive row counts remain unchanged during read-only editor use.

Implementation notes:

1. first pass is read-only,
2. reuse existing `workspace_list` and `workspace_read_file` tool paths,
3. do not introduce a second workspace persistence model.

Required doc sync:

1. `specs/28_house_library_memory_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/200_workshop_editor_surface.spec.js`

### M29.6 - Workshop write approval and Library snapshotting

Purpose:

1. expose file editing through Workshop,
2. require approval for persistent writes,
3. optionally save edit snapshots or playbooks into Library.

Primary test:

1. `e2e/201_workshop_editor_approval_snapshot.spec.js`

RED gate:

1. persistent writes bypass approval,
2. approved writes are not durable or observable,
3. snapshotting to Library loses source linkage.

GREEN gate:

1. Workshop writes fail closed without approval,
2. approved writes persist exactly one write event,
3. optional Library snapshot rows preserve file-path provenance.

Measurable metrics:

1. denied write attempts create `0` workspace write events,
2. approved write attempts create exactly `1` workspace write event,
3. approved write changes are visible on reread of the file,
4. optional snapshot creation increments `library_items` by exactly `1`,
5. snapshot link row increments `library_links` by exactly `1`.

Implementation notes:

1. use the production approval path used by workspace write tools,
2. diff preview must be visible before approval,
3. snapshot or playbook creation should remain explicit and optional.

Required doc sync:

1. `specs/28_house_library_memory_spec.md`
2. `specs/02_api_contract.md`
3. `docs/internal-skill-testline.md`

Verification:

1. `npx playwright test e2e/201_workshop_editor_approval_snapshot.spec.js`

### M29.7 - Archive or Trainer promotion into Library

Purpose:

1. let the platform promote raw traces or trainer results into curated items,
2. keep provenance explicit,
3. avoid fixture-only summarization paths.

Primary test:

1. `e2e/202_library_trace_promotion.spec.js`

RED gate:

1. Library items can only be handwritten and not promoted from existing platform truth,
2. promoted items are fixture-only blobs,
3. promoted items do not preserve provenance to trace ids or trainer result ids.

GREEN gate:

1. one seeded trace or trainer result can produce a non-empty Library item through the production path,
2. the promoted item stores stable provenance links,
3. Archive and Trainer source rows remain unchanged.

Measurable metrics:

1. promotion increments `library_items` by exactly `1`,
2. provenance links increment `library_links` by the expected exact amount,
3. promoted item summary is non-empty and not byte-identical to a static fixture placeholder,
4. repeated idempotent promotion returns the same `libraryItemId`,
5. source trace and trainer row counts remain unchanged.

Implementation notes:

1. promotion may be human-triggered or trainer-triggered,
2. first pass may allow one source item -> one promoted item only,
3. promotion output must stay deterministic for seeded inputs.

Required doc sync:

1. `specs/28_house_library_memory_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/202_library_trace_promotion.spec.js`

### M29.8 - Registry publication contract

Purpose:

1. publish selected Library items or bundles to Registry,
2. keep approval explicit,
3. preserve stable provenance and idempotency.

Primary test:

1. `e2e/203_library_publish_registry.spec.js`

RED gate:

1. Library items cannot be published through a stable contract,
2. publication bypasses approval,
3. idempotent replay creates duplicate publication rows.

GREEN gate:

1. publication requires approval,
2. approved publication creates exactly one durable publication row,
3. published payload preserves `contentHash`, item refs, and Registry linkage.

Measurable metrics:

1. missing approval fails with a stable code such as `APPROVAL_REQUIRED` or `LIBRARY_PUBLISH_APPROVAL_REQUIRED`,
2. approved publication increments `library_publications` by exactly `1`,
3. idempotent replay does not increment `library_publications`,
4. published record includes non-empty `registryId` or equivalent Registry reference,
5. publishing does not mutate the original `library_items` rows.

Implementation notes:

1. Registry remains the canonical publication surface,
2. first pass may publish one item or one bundle only,
3. public trust labels must remain visible.

Required doc sync:

1. `specs/28_house_library_memory_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/203_library_publish_registry.spec.js`

### M29.9 - Registry import contract

Purpose:

1. import public Registry artifacts into House Library,
2. preserve provenance,
3. avoid silent mutability of imported artifacts.

Primary test:

1. `e2e/204_library_import_registry.spec.js`

RED gate:

1. imported public artifacts lose their source identity,
2. imported artifacts are indistinguishable from local items,
3. import creates unstable ids or duplicate rows on replay.

GREEN gate:

1. import creates stable Library-side rows with Registry provenance,
2. imported artifacts remain read-only until explicitly localized,
3. repeated idempotent import returns the same local import identity.

Measurable metrics:

1. import increments `library_items` by the expected exact amount,
2. imported items expose non-empty `registryId`, `contentHash`, and `sourceRef`,
3. imported items carry a stable read-only or `imported_artifact` state flag,
4. idempotent replay creates no additional import rows,
5. imported item detail payloads are deterministic across repeated reads.

Implementation notes:

1. import route may be `POST /api/platform/library/imports` or equivalent,
2. imported artifacts should be label-visible in the UI,
3. copying imported content into Workshop should remain a separate later action.

Required doc sync:

1. `specs/28_house_library_memory_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/204_library_import_registry.spec.js`

### M29.10 - Seal-aware Library policy

Purpose:

1. enforce source-derived seal policy inside Library,
2. block forbidden publication,
3. keep violations auditable.

Primary test:

1. `e2e/205_library_seal_policy.spec.js`

RED gate:

1. sealed-source items are treated like normal public items,
2. blocked publication is not auditable,
3. private or sealed details leak in read payloads.

GREEN gate:

1. seal-aware items are filtered, redacted, or rejected deterministically,
2. blocked publication fails with a stable code,
3. one auditable durable row or equivalent stable ledger entry is created per blocked attempt.

Measurable metrics:

1. protected fields are absent or redacted on sealed Library reads,
2. publication of blocked sealed items returns a stable error code such as `LIBRARY_SEAL_BLOCKED`,
3. repeated identical blocked attempts do not create duplicate audit rows beyond the documented rule,
4. `library_publications` row count remains unchanged after blocked publish,
5. public or team-visible items not under seal continue to read and publish normally.

Implementation notes:

1. seal policy may inherit from source trace or source result metadata,
2. auditable blocked attempts may use `usage_ledger`, `sealed_context_violations`, or an equivalent durable store,
3. first-pass rule should prioritize determinism over policy complexity.

Required doc sync:

1. `specs/28_house_library_memory_spec.md`
2. `specs/02_api_contract.md`

Verification:

1. `npx playwright test e2e/205_library_seal_policy.spec.js`

### M29.11 - House Library full smoke

Purpose:

1. prove the joined product loop works in one shell,
2. verify continuity,
3. verify the private-to-public ladder behaves coherently.

Primary test:

1. `e2e/206_house_library_full_smoke.spec.js`

RED gate:

1. the private Library flow works only in isolation,
2. Workshop integration breaks Library or vice versa,
3. publication or import paths break continuity or provenance.

GREEN gate:

1. the shell can open Library,
2. one curated item can be created,
3. the item can be scoped into chat,
4. Workshop can read or edit a file with approval,
5. a later scoped turn can still bring the curated item back into scope for future communication,
6. one publish or import action can complete without breaking continuity,
7. export stats include Library-related rows.

Measurable metrics:

1. worker session id remains stable through the full flow,
2. final counts for `library_items`, `scope_sets`, and `library_publications` match the seeded expected totals exactly,
3. prompt preview confirms the selected scope item during the scoped turn,
4. prompt preview confirms the same curated item can be re-selected in a later turn without silent scope widening,
5. export snapshot includes Library-related tables with matching counts,
6. the final UI remains on `/app`.

Required doc sync:

1. `specs/28_house_library_memory_spec.md`
2. `specs/29_house_library_memory_tdd_spec.md`
3. `docs/internal-skill-testline.md`

Verification:

1. `npx playwright test e2e/206_house_library_full_smoke.spec.js`

Implementation note:

1. the first joined smoke may mix same-shell UI actions with stable House Library route updates, provided the worker session id stays stable, the browser remains on `/app`, and the visible Library state reflects the final scoped selection.

## 6. Final Delivery Rule

This phase is complete only when all of the following are true:

1. House Library exists as a same-shell surface,
2. users can explicitly choose what the agent may use in a turn,
3. Workshop editing is visible and approval-gated,
4. Registry publication and import work with provenance,
5. sealed/private policy is enforced deterministically,
6. the House Library skill pack is test-backed and readable,
7. the full smoke passes without breaking the existing House model,
8. full-repo Playwright verification passes with `npm test`.

## 7. Post-Phase Extension Track

The ideas around public peer exchange through Pony or bittorrent-style transport are covered as a deliberate follow-on track rather than a default Phase 29 gate.
That keeps the core Library, Workshop, and Registry contracts deterministic and offline-safe first.

Extension requirements:

1. transport replication must layer on top of the Wave C publication model rather than replacing Registry ids or publication rows,
2. replicated manifests and payloads must preserve `contentHash`, provenance refs, and visibility policy,
3. no peer transport may bypass approval, seal policy, or House-private defaults,
4. any future transport tests must remain deterministic through local seeded peers or fixtures rather than live public networks.
