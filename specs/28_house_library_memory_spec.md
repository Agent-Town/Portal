# Phase 28 Spec: House Library, Guided Memory, and Public Knowledge Exchange

Status: Draft
Version: 1.0
Audience: product, frontend, runtime, AI-agent, UX, security, infra, QA, content design, and AI coding agents
Depends on:
1. [specs/19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md](./19_agent_town_unified_experiences_trace_trainer_spec_v0.3.md)
2. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
3. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
4. [specs/02_api_contract.md](./02_api_contract.md)
5. [specs/03_skill_spec.md](./03_skill_spec.md)
6. [AGENTS.md](../AGENTS.md)

## 1. Purpose

This document defines the next House-native layer after Archive, Workshop, Trainer, Inbox, and Tracks:

1. a private House Library for curated digital artifacts,
2. guided conversation scoping so humans can decide what the agent should bring into a turn,
3. a later shared-public exchange path through Registry rather than an unrelated second product.

This spec intentionally covers the path from the earlier option set:

1. private House Library,
2. House Library plus guided scoping plus editable Workshop workbench,
3. public exchange and publishing through Registry.

The design target is simple:

- no machine learning jargon,
- no need for the user to understand agent architecture,
- minimal UI in the existing pixel RPG style,
- deterministic Playwright coverage,
- worker-first behavior,
- wallet-first identity,
- and clean fit with the current House Console shell.

## 2. Executive Summary

The platform already has the bones of a memory system:

1. Archive stores canonical traces.
2. Workshop stores active config lineage.
3. Trainer produces durable analysis and patch outputs.
4. Inbox stores house-to-house correspondence.
5. The runtime already supports workspace file reads and edits.

What is missing is the user-facing layer that makes these understandable as one coherent memory model.

The House Library is that layer.

It is not a replacement for Archive.
It is not a second Trainer.
It is not a separate app.

It is a curated shelf system that sits between raw trace history and active work.

The user should understand the model without knowing any of the following terms:

- embeddings,
- retrieval augmented generation,
- vector search,
- cognitive architecture,
- or agent memory compression.

The product language should instead be:

- shelves,
- books,
- notes,
- bundles,
- reading table,
- satchel,
- workshop,
- archive,
- and registry.

## 3. Non-Negotiable Design Rules

1. Keep the current minimal Portal posture. The Library is a House surface, not a new home page.
2. Keep modal-first and in-shell continuity. The worker must not restart because the user opened the Library.
3. Keep worker-first architecture. The browser worker decides how to use memory; the server stores durable state and enforces policy.
4. Keep wallet-first continuity. A house and its library belong to the connected wallet-backed House context.
5. Keep Archive append-only. Archive is factual history; Library is curated interpretation.
6. Keep Workshop editable and lineaged. File editing belongs in Workshop, not in Archive.
7. Keep public exchange opt-in. Nothing becomes public by default.
8. Do not introduce token farming, points, or reputation gimmicks.
9. Do not require blockchain anchoring for all memories. Provenance receipts may exist, but chain-first storage is not a requirement for private House memory.
10. Every major behavior must be testable with seeded fixtures and Playwright.

## 4. Fit With the Existing Platform

The platform spec already defines House as the long-term root and names Archive, Workshop, Inbox, and Trainer as first-class House functions.

This spec extends that exact shape rather than inventing a competing IA.

### 4.1 Existing surfaces that remain authoritative

1. Archive remains the canonical record of runs, traces, and artifacts.
2. Workshop remains the lineaged place for config, packs, overlays, and editable work.
3. Trainer remains the analysis and recommendation surface.
4. Inbox remains the correspondence surface.
5. Registry remains the correct place for public publishing, discovery, proof, and exchange.

### 4.2 New surface

Add `Library` to House Console as a first-class button between `Workshop` and `Tracks`.

Recommended House Console order:

1. `Experiences`
2. `Workshop`
3. `Library`
4. `Tracks`
5. `Archive`
6. `Trainer`

Reasoning:

1. Workshop is active making.
2. Library is curated knowledge.
3. Tracks are read-only progression summaries.
4. Archive is raw history.
5. Trainer is analysis and change-making on top of the other three.

### 4.3 Office scaffold compatibility

The emerging House office/staff scaffold should be able to host this model later without changing the user-facing IA.

Recommended future-compatible office types:

1. `office_library`
2. `office_workshop`
3. `office_registry`

Recommended future-compatible staff roles:

1. `staff_librarian`
2. `staff_archive_clerk`
3. `staff_workshop_scribe`
4. `staff_registry_curator`

These should remain serialization and assignment concepts first, not autonomous background actors by default.

## 5. Player-Facing Information Architecture

The interface must feel like it belongs to the same world as the current House Console.

Do not add a generic enterprise dashboard.
Do not add a dense knowledge graph UI.
Do not add a notebook app with unrelated visual language.

### 5.1 Surface names

| Platform concept | Player-facing name | Notes |
| --- | --- | --- |
| Curated private knowledge | House Library | New House panel |
| Current session scope | Reading Table | Selected items for this conversation |
| Temporary selected set | Satchel | User-picked items not yet filed |
| Raw traces | Archive | Existing surface |
| Editable work area | Workshop | Existing surface |
| Durable analysis | Trainer | Existing surface |
| Public exchange | Registry | Existing surface |
| Sensitive/private items | Restricted Shelf | Seal-aware or private |

### 5.2 Library layout

The minimal layout should mirror the current House panel pattern:

1. one title and one short sentence,
2. one list pane,
3. one detail pane,
4. one action strip,
5. deterministic empty states.

Recommended panel sections:

1. `Shelves`
2. `Selected for this chat`
3. `Item details`
4. `Actions`

### 5.3 Allowed user verbs

Only use plain verbs:

1. `Save to Library`
2. `Bring to Chat`
3. `Remove from Chat`
4. `Open in Workshop`
5. `Open in Archive`
6. `Open in Inbox`
7. `Publish to Registry`
8. `Import to Library`

Avoid terms such as:

1. `embed`
2. `index`
3. `hydrate`
4. `vectorize`
5. `semantic recall`

## 6. Memory Model

The thread’s strongest idea is correct: one memory type is not enough.
Portal should use a typed model, but it should map to existing product objects instead of inventing a separate cognition engine.

### 6.1 Memory types

| Memory type | Purpose | Main current source | House surface |
| --- | --- | --- | --- |
| `episodic` | what happened | canonical traces, inbox exchanges, trainer runs | Archive -> Library |
| `semantic` | what we know | curated notes, verified facts, distilled summaries | Library |
| `procedural` | how we do it | Workshop configs, skill packs, playbooks, runbooks | Workshop + Library |
| `self_model` | how this House/team prefers to operate | House policy, team notes, explicit preferences, approved operating rules | Library + Workshop |

### 6.2 Platform rule

The Library is not the only memory store.

It is the curated and human-legible layer built from:

1. Archive events and artifacts,
2. Workshop files and versions,
3. Trainer results,
4. Inbox messages,
5. Registry imports,
6. user-authored notes and bundles.

### 6.3 Important constraint

`self_model` must not become hidden psychoanalysis.

Allowed `self_model` content:

1. writing preferences,
2. response style preferences,
3. team operating rules,
4. house policies,
5. user-approved standing goals.

Disallowed:

1. speculative personality labels,
2. hidden scoring of the user,
3. inferred medical or legal traits,
4. silent profile drift without user review.

## 7. Core Object Model

The following durable objects are required for the Library layer.

### 7.1 `library_items`

Represents one curated artifact.

Required fields:

1. `libraryItemId`
2. `houseId`
3. `teamId`
4. `itemType`
5. `title`
6. `summary`
7. `contentRef`
8. `sourceKind`
9. `sourceRef`
10. `visibility`
11. `sealPolicy`
12. `contentHash`
13. `createdAt`
14. `updatedAt`

Supported `itemType` values:

1. `episodic_note`
2. `fact_note`
3. `playbook`
4. `config_note`
5. `conversation_excerpt`
6. `file_snapshot`
7. `trainer_insight`
8. `bundle`
9. `imported_artifact`

### 7.2 `library_links`

Represents typed links between curated items and existing platform records.

Supported link kinds:

1. `derived_from_trace`
2. `derived_from_trainer_result`
3. `derived_from_workshop_config`
4. `replies_to_inbox_message`
5. `supersedes`
6. `included_in_bundle`
7. `published_as_registry_artifact`
8. `imported_from_registry`
9. `contradicts`

### 7.3 `scope_sets`

Represents the selected artifacts explicitly brought into one conversation or task.

Purpose:

1. make context selection user-visible,
2. reduce prompt noise,
3. keep the agent honest about what is in scope,
4. keep deterministic tests possible.

Required fields:

1. `scopeSetId`
2. `houseId`
3. `teamId`
4. `title`
5. `itemIds`
6. `createdBy`
7. `createdAt`
8. `updatedAt`

### 7.4 `library_publications`

Represents later-phase publication or import between House Library and Registry.

Publication states:

1. `draft`
2. `approved`
3. `published`
4. `revoked`

## 8. Mapping to Existing Durable State

The Library must reuse existing platform truth wherever possible.

| Existing durable object | Library role |
| --- | --- |
| `runs`, `trace_events`, `trace_artifacts` | primary episodic source |
| `trainer_jobs`, `trainer_results` | derived analysis source |
| `config_versions`, `config_component_versions` | procedural source |
| `integration_pack_versions`, `integration_executions` | procedural and evidence source |
| Inbox messages | episodic correspondence source |
| exported platform snapshot | portability and backup source |

Rule:

1. Archive rows are never rewritten because a Library item changes.
2. Workshop files are never silently rewritten because a Library item changes.
3. Library items point at durable truth; they do not replace it.

## 9. Guided User Flows

### 9.1 Save something important

User flow:

1. open House Library,
2. choose `Save to Library`,
3. pick source:
   - current conversation excerpt,
   - Archive trace,
   - Workshop file snapshot,
   - Trainer result,
   - Inbox message,
4. choose shelf type:
   - `Story`
   - `Fact`
   - `How-To`
   - `House Rule`
5. confirm.

Agent behavior:

1. suggest title and short summary,
2. never file silently when the source is ambiguous,
3. never collapse multiple unrelated facts into one item without confirmation.

### 9.2 Start a focused conversation

User flow:

1. open House Library,
2. select up to `N` items,
3. click `Bring to Chat`,
4. start or continue chat.

System behavior:

1. create or update a `scope_set`,
2. show a visible list of selected items,
3. pass only these items plus required runtime context into the worker prompt.

### 9.3 Edit files with the agent

User flow:

1. open Workshop,
2. open a file or pack item,
3. ask the agent to draft or edit,
4. review diff,
5. approve write,
6. optionally save a snapshot or explanation to Library.

Rule:

Workshop is the editing surface.
Library stores curated explanations, snapshots, and playbooks that may come from Workshop work.

### 9.4 Publish something for others

User flow:

1. choose one Library item or bundle,
2. click `Publish to Registry`,
3. review audience and provenance,
4. approve,
5. publish.

The first public layer should go through Registry, not through a parallel public-memory product.

### 9.5 Continue a future conversation

User flow:

1. return to House later,
2. open House Library,
3. reopen one saved item, bundle, or prior scope set,
4. click `Bring to Chat`,
5. continue the conversation with those same artifacts in scope.

System behavior:

1. previously saved Library items remain accessible for future communications,
2. the user can explicitly reselect what should be in scope rather than relying on hidden recall,
3. the worker prompt stays limited to the active scope set plus required runtime context,
4. future turns must not silently widen scope beyond the user-visible selection.

## 10. Essential OpenClaw Lite Skill Package

This phase should not mutate `public/skill.md`.
Instead, it should add a new House-native skill pack later, compiled through the same internal-pack model.

Recommended package shape:

```text
library-skill-pack/
├── skill.md
├── rules.md
└── skills/
    ├── librarian/skill.md
    ├── archive-clerk/skill.md
    ├── workshop-scribe/skill.md
    └── registry-curator/skill.md
```

Implementation bridge in Portal:

- manifest route: `/api/platform/library/skill-pack`
- compiled entry: `/__compiled/library-skill-pack/skill.md`
- active chat scope prompt context: `house-library/scope.md` inside worker prompt preview

### 10.1 Router skill

Purpose:

1. choose exactly one specialized memory-management skill before acting,
2. preserve the current multi-skill selection behavior,
3. keep prompts small and deterministic.

Draft contract:

```md
---
name: house-library-router
description: Pick one House Library skill before taking action.
version: 1
---

# House Library Router

Use exactly one specialized skill before acting:

- [House Librarian](./skills/librarian/skill.md)
- [Archive Clerk](./skills/archive-clerk/skill.md)
- [Workshop Scribe](./skills/workshop-scribe/skill.md)
- [Registry Curator](./skills/registry-curator/skill.md)
- [Rules](./rules.md)
```

### 10.2 House Librarian skill

Use when:

1. the user wants to find something,
2. the user wants to bring certain items into scope,
3. the user wants to save a conversation excerpt, note, or fact.

Rules:

1. prefer explicit user selection over speculative retrieval,
2. if the user says "make sure the agent knows X", save or scope it explicitly,
3. if multiple items could match, show choices instead of silently choosing one,
4. never claim an item is in scope unless the active scope set confirms it.

### 10.3 Archive Clerk skill

Use when:

1. the user wants "what happened",
2. the user wants to inspect runs or traces,
3. the user wants a trace turned into a Library item.

Rules:

1. Archive is factual and append-only,
2. do not rewrite history,
3. derived summaries must link back to trace ids,
4. if information is sealed or redacted, say so plainly.

### 10.4 Workshop Scribe skill

Use when:

1. the user wants to create or edit files,
2. the user wants to turn a note into a playbook,
3. the user wants to compare or stage changes.

Rules:

1. editing happens in Workshop, not Library,
2. use diffable edits and approval-gated writes,
3. when helpful, save a file snapshot or explanation into Library after the edit,
4. never perform persistent writes without approval.

### 10.5 Registry Curator skill

Use when:

1. the user wants to publish an artifact,
2. the user wants to import a public artifact,
3. the user wants provenance or proof context.

Rules:

1. publishing is opt-in,
2. private by default,
3. imported artifacts must preserve source refs and trust labels,
4. do not auto-trust public artifacts merely because they exist.

## 11. Required Tool Surface

### 11.1 Existing tool support that should be reused

The runtime already has the right base primitives and they should be kept:

1. `workspace_list`
2. `workspace_read_file`
3. `workspace_write_file`
4. `workspace_edit_file`
5. `workspace_delete`
6. `trainer.*` runtime inspection tools
7. `agent_town_state_get_*` tools
8. existing UI intent tools for modal-safe opening

### 11.2 New read tools required

1. `agent_town_state_get_library`
2. `agent_town_library_get_item`
3. `agent_town_library_search`
4. `agent_town_library_get_scope`

### 11.3 New write tools required

1. `agent_town_library_create_item`
2. `agent_town_library_update_scope`
3. `agent_town_library_link_item`
4. `agent_town_library_publish`

### 11.4 Tool policy rules

1. Read tools should be available without approval once the House context is active.
2. Write tools must require either explicit user action in UI or approval-gated agent action.
3. Publication tools must always require approval.
4. Tools that create curated summaries from traces must preserve source refs.
5. Tools must return stable ids and stable error codes.

## 12. Route and Persistence Additions

Recommended initial route family:

1. `GET /api/platform/library`
2. `POST /api/platform/library/items`
3. `GET /api/platform/library/items/:libraryItemId`
4. `POST /api/platform/library/scope`
5. `GET /api/platform/library/scope`
6. `POST /api/platform/library/publications`
7. `POST /api/platform/library/imports`

Recommended initial tables:

1. `library_items`
2. `library_links`
3. `scope_sets`
4. `scope_set_items`
5. `library_publications`

All routes must follow existing Portal success and error envelopes.

## 13. Security, Trust, and Provenance

### 13.1 Private-first

Default visibility must be:

1. `house_private`
2. `team_shared`
3. `allowlisted`
4. `registry_public`

### 13.2 Seals

If a Library item is derived from sealed or restricted source material:

1. the Library item must preserve seal policy,
2. redaction behavior must remain deterministic,
3. publication must be blocked unless policy allows it,
4. blocked publication attempts should write one stable audit record per idempotent attempt.

### 13.3 Provenance receipts

For private Library items, the platform only needs:

1. durable ids,
2. source refs,
3. content hashes,
4. exportable snapshots.

Optional later enhancement:

1. allow a published Registry artifact to attach an external receipt or chain anchor.

This keeps blockchain use where it is justified:

1. provenance,
2. proof,
3. public verifiability,

and avoids forcing chain complexity into every private memory operation.

### 13.4 Pony and bittorrent-style exchange

Pony or bittorrent-style distribution may later be used as a transport layer for public bundles, manifests, or replicated artifact payloads.

Rules:

1. transport is not the source of truth,
2. Registry remains the canonical discovery and publication surface,
3. House Library remains the canonical private curation surface,
4. transport-level replication must preserve content hashes, provenance refs, and visibility policy,
5. no public peer exchange may bypass approval or seal policy.

Implementation note:

1. the first shipped public product path should still be `Library -> Registry`,
2. Pony or bittorrent-style transport should layer on top later without changing Library ids, publication ids, or visibility rules.

## 14. Pixel RPG UX Rules

1. Reuse the current type, color, button, panel, pill, and modal language.
2. Keep one short instructional sentence per panel.
3. Prefer `Open Library`, `Save to Library`, and `Bring to Chat` over expert terminology.
4. Use icons and section names that feel like shelves, ledgers, desks, and satchels, not folders and admin tables.
5. Keep the screen density close to current House panels.
6. Never require the user to understand why the agent needs "context management"; show it as item selection.
7. Show provenance in plain language:
   - `From Archive`
   - `From Workshop`
   - `From Trainer`
   - `From Inbox`
   - `Imported from Registry`

## 15. Benchmarking and Evaluation

This feature set should be benchmarked like product infrastructure, not just UI polish.

### 15.1 User simplicity metrics

1. First-time user can save one item to Library in under `30` seconds.
2. First-time user can start a scoped chat with selected items in under `45` seconds.
3. Users can explain the difference between `Archive`, `Library`, and `Workshop` after one guided session.

### 15.2 Agent effectiveness metrics

1. The worker can retrieve the correct scoped items with stable ids.
2. The worker does not claim unscoped facts are in scope.
3. The worker can turn one trace or workshop file into a Library item with correct provenance.
4. The worker can edit Workshop files through approval-gated writes and optionally save explanations back to Library.

### 15.3 Deterministic test metrics

1. Library list order is deterministic for seeded fixtures.
2. Scope set contents are deterministic after repeated seeded actions.
3. Publish actions fail closed without approval.
4. Worker session continuity survives Library open and close.

## 16. Rollout Plan

### L28.1 - Private House Library

Scope:

1. House Library panel,
2. curated private items,
3. source links to Archive, Workshop, Trainer, and Inbox,
4. scoped conversation selection.

Execution mapping:

1. `M29.0` Library harness and fixture alignment
2. `M29.1` House Library surface
3. `M29.2` Library item creation and source linking
4. `M29.3` Scope set selection
5. `M29.4` Skill pack routing and scope-aware prompt contract

### L28.2 - Guided Workshop Workbench

Scope:

1. first-class file browser/editor in Workshop,
2. diff and approval flow,
3. save file snapshots and playbooks into Library,
4. House Librarian plus Workshop Scribe skill pack.

Execution mapping:

1. `M29.5` Workshop editor read surface
   - same-shell Workshop file browser backed by worker `workspace_list` and `workspace_read_file` over `workspace/.agent-town/`
2. `M29.6` Workshop write approval and Library snapshotting
   - same-shell draft pane shows a deterministic diff preview before the worker requests persistent-write approval
   - approved writes use the existing worker persistent storage policy path and optional snapshots persist through `POST /api/platform/library/items` with `workspace_file` provenance
3. `M29.7` Archive or Trainer promotion into Library
   - Archive and Trainer each expose an explicit `Save to Library` action inside the House shell
   - promotions persist through `POST /api/platform/library/promotions` and derive content from canonical trace or trainer-result state instead of static fixtures

### L28.3 - Registry publication and import

Scope:

1. publish selected Library items or bundles to Registry,
2. import Registry artifacts back into Library,
3. provenance and trust labels,
4. optional external receipt support for public artifacts.

Execution mapping:

1. `M29.8` Registry publication contract
   - `POST /api/platform/library/publications` publishes one curated Library item to Registry only after explicit approval and replays idempotently by `Idempotency-Key`
2. `M29.9` Registry import contract
   - `POST /api/platform/library/imports` imports one Registry artifact into House Library as a read-only `imported_artifact` with visible Registry provenance
3. `M29.10` Seal-aware Library policy
   - sealed trace-derived Library items redact protected fields on read and `POST /api/platform/library/publications` returns `LIBRARY_SEAL_BLOCKED` while the inherited seal remains active
4. `M29.11` House Library full smoke

## 17. Proposed Playwright Program

Detailed execution contract lives in [specs/29_house_library_memory_tdd_spec.md](./29_house_library_memory_tdd_spec.md).

Reserved late-phase test block recommendation:

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

### Required deterministic assertions

1. Opening Library does not leave `/app`.
2. Opening Library does not rotate the worker session id.
3. Saving a Library item stores a stable id and source ref.
4. Selecting `Bring to Chat` updates the active scope set deterministically.
5. Workshop writes require approval and preserve diff visibility.
6. Registry publication requires approval and creates one durable publication row.
7. Registry import preserves provenance and read-only imported state.
8. Seal-aware publish blocking is auditable and deterministic.
9. Full smoke preserves same-shell continuity from private curation through public exchange.

## 18. Final Product Principle

The core idea is simple:

1. Archive is the ledger of what happened.
2. Library is the shelf of what matters.
3. Workshop is the desk where work changes.
4. Trainer is the coach that suggests improvements.
5. Registry is the public exchange hall.

If this is implemented well, users will not feel like they are managing an AI memory system.
They will feel like they are keeping a clean, living House in a pixel RPG world where the agent can remember the right things, with their help, and without mystery.
