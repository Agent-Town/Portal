# ZHC1 Sandbox & Artifact System — TDD Spec

Status: implementation-driving spec
Version: 0.1.0
Branch: `zhc1-iterate-prototype`
Last updated: 2026-03-18
Audience: agentic AI developers
Predecessor: [specs/47_zhc1_sandbox_artifact_system_spec.md](specs/47_zhc1_sandbox_artifact_system_spec.md)
Predecessor: [specs/46_zhc1_iterate_prototype_tdd_spec.md](specs/46_zhc1_iterate_prototype_tdd_spec.md)
Depends on: [specs/02_api_contract.md](specs/02_api_contract.md), [specs/19_unified_experiences_trace_trainer_spec_v0.3.md](specs/19_unified_experiences_trace_trainer_spec_v0.3.md), [AGENTS.md](AGENTS.md)

---

## 1. Document purpose

Every feature is defined as a test with a measurable success metric. An agentic AI developer reads a test, builds the artifact, verifies the result, and moves to the next test. No ambiguity. Every assertion is deterministic.

## 2. Test anatomy

```
### SA-Txxx: [Title]

Phase: [phase_name]
Priority: P0 | P1 | P2
Dependencies: [test IDs or "none"]

Given: [initial state — what the system looks like before]
When: [the action — what the developer builds or what the user does]
Then: [measurable outcome — what must be true after]

Success metric: [exact assertion — Playwright command, API response shape, or unit test]
```

## 3. Measurable metric classes

All tests must satisfy at least one of these metric classes:

| Class | What it proves | Assertion pattern |
|-------|---------------|-------------------|
| **Sandbox boot** | WebContainer or fallback initializes | `typeof wc.spawn === 'function'` returns true |
| **Compilation** | TypeScript compiles without errors | Exit code 0, no `error TS` in stderr |
| **Execution** | Code runs and produces output | `process.exitCode === 0`, stdout non-empty |
| **Isolation** | Sandbox cannot escape boundaries | Network requests fail, filesystem capped |
| **Snapshot fidelity** | Zip export/import produces identical workspace | Re-mounted zip produces same file contents and execution output |
| **Card artifact** | Experiment card contains code + output | `card.artifact.source !== null && card.artifact.outputPreview !== null` |
| **Snapshot size** | Zip export is smaller than raw binary | `zipSnapshot.length < binarySnapshot.length` |
| **Transfer** | Snapshot loads in a different session | Mount succeeds, entrypoint executes, output matches |
| **Registry presence** | Artifact discoverable in catalog | `GET /api/registry/search?q=...` returns entity with matching `content_hash` |
| **ERC-8004 mint** | Token exists on-chain with correct URI | `erc8004Registrations` row exists, `agentURI` starts with `ipfs://` |
| **Learning signal** | Discarded paths recorded | Published stream contains cards with `status: 'discarded'` and feedback text |

---

## Phase S0: Sandbox Foundation

### SA-T001: WebContainer boots in browser

Phase: sandbox_foundation
Priority: P0
Dependencies: none

Given: Iterate page is loaded, browser supports WebContainer API (SharedArrayBuffer + COOP/COEP headers)
When: User enters the active loop phase
Then: A WebContainer instance is booted and ready. `wc.spawn` is a callable function.

Success metric: `page.evaluate(async () => { const { WebContainer } = await import('@webcontainer/api'); const wc = await WebContainer.boot(); return typeof wc.spawn === 'function'; })` returns `true`

### SA-T002: Fallback sandbox boots when WebContainer unavailable

Phase: sandbox_foundation
Priority: P1
Dependencies: none

Given: Browser does not support SharedArrayBuffer (no COOP/COEP, or Safari)
When: Sandbox initialization runs
Then: Fallback iframe+esbuild-wasm sandbox boots. `sandbox.compile` is a callable function.

Success metric: `data-testid="sandbox-status"` text is `'ready (fallback)'` or `'ready'`, never `'failed'`

### SA-T003: TypeScript compiles in sandbox

Phase: sandbox_foundation
Priority: P0
Dependencies: SA-T001

Given: WebContainer is booted
When: TypeScript source `const x: number = 42; console.log(x);` is mounted at `src/index.ts` and compiled
Then: Compilation succeeds with exit code 0. No TypeScript errors in stderr.

Success metric: Compilation process `exitCode === 0`. stderr does not contain `error TS`.

### SA-T004: Compiled code executes and produces output

Phase: sandbox_foundation
Priority: P0
Dependencies: SA-T003

Given: TypeScript has been compiled to JavaScript
When: `node dist/index.js` is spawned in the WebContainer
Then: stdout contains `42`. Exit code is 0.

Success metric: `capturedStdout.includes('42') === true && process.exitCode === 0`

### SA-T005: Execution timeout enforced

Phase: sandbox_foundation
Priority: P0
Dependencies: SA-T004

Given: Sandbox is ready
When: Code containing `while(true){}` is executed
Then: Process is killed after 30 seconds. Card records `exitCode !== 0` and `executionMs <= 31000`.

Success metric: `card.artifact.executionMs <= 31000 && card.artifact.exitCode !== 0`

### SA-T006: Filesystem size limit enforced

Phase: sandbox_foundation
Priority: P1
Dependencies: SA-T001

Given: Sandbox is booted
When: Code attempts to write a 60MB file
Then: Write fails or sandbox rejects. Filesystem stays under 50MB.

Success metric: Sandbox emits error or write returns failure. Total filesystem size < 50MB.

### SA-T007: Network access blocked in sandbox

Phase: sandbox_foundation
Priority: P0
Dependencies: SA-T004

Given: Sandbox is executing code
When: Code attempts `fetch('https://example.com')`
Then: Request fails. No outbound network from sandbox.

Success metric: `fetch` throws or returns error. No HTTP request observable in browser network tab.

---

## Phase S1: Artifact Model

### SA-T010: Experiment card stores TypeScript source

Phase: artifact_model
Priority: P0
Dependencies: SA-T003, IT-T060

Given: Agent has generated TypeScript code for an experiment
When: Experiment card is created via API
Then: `card.artifact.source` is a non-null FileSystemTree containing at least one `.ts` file.

Success metric: `card.artifact.source !== null && Object.keys(card.artifact.source).some(k => k.endsWith('.ts') || card.artifact.source[k]?.directory)`

### SA-T011: Experiment card stores execution output

Phase: artifact_model
Priority: P0
Dependencies: SA-T004

Given: Code has been compiled and executed in sandbox
When: Experiment card is saved
Then: `card.artifact.outputPreview` is a non-empty string. `card.artifact.outputType` is one of `'terminal'`, `'html'`, `'data'`.

Success metric: `typeof card.artifact.outputPreview === 'string' && card.artifact.outputPreview.length > 0 && ['terminal','html','data'].includes(card.artifact.outputType)`

### SA-T012: Card visual shows real output instead of gradient

Phase: artifact_model
Priority: P0
Dependencies: SA-T011

Given: Experiment card has `artifact.outputPreview`
When: Card renders in the feed
Then: `data-testid="card-visual"` displays the output preview, not a CSS gradient placeholder.

Success metric: `page.locator('[data-testid="card-visual"]').first()` does not have `style` containing `linear-gradient`. Content is derived from `artifact.outputPreview`.

### SA-T013: Experiment card stores snapshot binary

Phase: artifact_model
Priority: P1
Dependencies: SA-T001

Given: Experiment round is complete
When: Agent marks best card
Then: `card.artifact.snapshotZip` is a non-null Uint8Array (zip) with length > 0.

Success metric: `card.artifact.snapshotZip instanceof Uint8Array && card.artifact.snapshotZip.length > 0`

### SA-T014: Agent-submitted card with artifact accepted by API

Phase: artifact_model
Priority: P0
Dependencies: SA-T010

Given: Problem story is active with confirmed metrics
When: `POST /api/problem-stories/:id/experiment-cards` is called with a card containing `artifact.source` and `artifact.outputPreview`
Then: API returns `201` with the stored card. Card is retrievable via `GET /api/problem-stories/:id/experiment-cards`.

Success metric: POST returns `{ ok: true, card: { artifact: { source: {...} } } }`. GET returns card in array.

---

## Phase S2: Agent Code Generation

### SA-T020: Agent produces TypeScript when instructed

Phase: agent_code_gen
Priority: P0
Dependencies: SA-T010, IT-T050

Given: Problem story is active, user has described a problem, metrics are confirmed
When: Agent receives the problem context and is asked to produce a solution
Then: Agent's response includes a TypeScript code block that can be extracted and compiled.

Success metric: Gateway message from agent contains a fenced code block with language `typescript` or `ts`. Extracted code compiles in sandbox with exit code 0.

### SA-T021: Agent iterates on code after feedback

Phase: agent_code_gen
Priority: P0
Dependencies: SA-T020, IT-T070

Given: Agent has produced experiment card with code, user gives feedback "handle edge case where input is empty"
When: Feedback is sent via conversation
Then: Agent produces modified TypeScript that addresses the feedback. New card has different `artifact.source` than previous card.

Success metric: New card's `sha256(JSON.stringify(artifact.source))` differs from previous card's. New code contains logic related to the feedback (e.g., empty check).

### SA-T022: Agent reads sandbox output for self-assessment

Phase: agent_code_gen
Priority: P0
Dependencies: SA-T004

Given: Agent-written code has been executed in sandbox
When: Sandbox output is returned to the agent
Then: Agent's self-assessment scores reference the actual output (not generic placeholder scores).

Success metric: Card `agentSummary` references specific output values or behaviors observed in `artifact.outputPreview`.

### SA-T023: Sub-agent produces specialized code module

Phase: agent_code_gen
Priority: P2
Dependencies: SA-T020

Given: Main agent is working on a complex problem
When: Main agent delegates a sub-task (e.g., "write a data parser for CSV input")
Then: Helper worker produces a TypeScript module. Main agent integrates it into the workspace.

Success metric: Workspace contains at least 2 `.ts` files where one was not present in the prior round. Both compile together.

---

## Phase S3: Transferability

### SA-T030: Export produces valid binary snapshot

Phase: transferability
Priority: P0
Dependencies: SA-T013

Given: Experiment card has a workspace with TypeScript source and compiled output
When: User clicks "Export" (or equivalent)
Then: `webcontainer.export('/', { format: 'zip' })` returns a compressed `Uint8Array` with valid zip header (first 2 bytes `0x50 0x4B`).

Success metric: `snapshot instanceof Uint8Array && snapshot.length > 100 && snapshot[0] === 0x50 && snapshot[1] === 0x4B`

### SA-T031: Exported snapshot can be re-mounted

Phase: transferability
Priority: P0
Dependencies: SA-T030

Given: A zip snapshot has been exported
When: A new WebContainer boots and calls `mount(snapshotZip)`
Then: Mount succeeds. Files from original workspace are present. `src/index.ts` (or entrypoint) exists.

Success metric: `await wc2.fs.readFile(entrypoint, 'utf-8')` returns non-empty string matching original source.

### SA-T032: Re-mounted snapshot produces same output

Phase: transferability
Priority: P0
Dependencies: SA-T031

Given: Zip snapshot has been exported and re-mounted in a new WebContainer
When: Code is compiled and executed in the new container
Then: stdout matches the original execution output.

Success metric: `stdout2.trim() === stdout1.trim()`

### SA-T033: Snapshot stored as library item

Phase: transferability
Priority: P0
Dependencies: SA-T030

Given: Zip snapshot has been exported
When: Stored via library API
Then: `library_item` row exists with `type: 'sandbox_snapshot'`, `content_type: 'application/zip'`, `content_hash: 'sha256:...'`. Item retrievable by ID.

Success metric: `getLibraryItemById(id)` returns item with `type === 'sandbox_snapshot'` and `content_type === 'application/zip'` and `content_hash` starting with `sha256:`.

### SA-T034: Snapshot importable by different user

Phase: transferability
Priority: P0
Dependencies: SA-T033

Given: Library item exists with a sandbox snapshot
When: A different user (different house_id) imports it via `library_peer_relays`
Then: Peer relay receipt created. User can mount the snapshot in their own WebContainer.

Success metric: `library_peer_receipts` row exists linking source and target house_ids. Mount in target context succeeds per SA-T031 criteria.

### SA-T035: Fork preserves parent lineage

Phase: transferability
Priority: P1
Dependencies: SA-T034

Given: User has imported a snapshot and modified it
When: User exports the modified version
Then: New `library_item` has `metadata.parentArtifactId` pointing to the original item ID.

Success metric: `newItem.metadata.parentArtifactId === originalItem.id`

---

## Phase S4: Publication & Registry

### SA-T040: Published stream includes code fingerprint

Phase: publication
Priority: P0
Dependencies: SA-T013, IT-T080

Given: Problem story is converged with code artifacts
When: `POST /api/published-streams` is called
Then: Published stream has `codeFingerprint` computed as SHA-256 of the best card's snapshot zip.

Success metric: `publishedStream.codeFingerprint` is a 64-character hex string. `publishedStream.codeFingerprint === sha256hex(bestCard.artifact.snapshotZip)`.

### SA-T041: Artifact registered in registry

Phase: publication
Priority: P0
Dependencies: SA-T040

Given: Artifact has been published
When: Registry import triggered
Then: `GET /api/registry/search?q={problemDomain}` returns an entity with matching `content_hash`.

Success metric: Search results contain entity where `entity.content_hash === publishedStream.codeFingerprint`. Entity `family_slug === 'iterate-artifacts'`.

### SA-T042: Artifact discoverable in feed

Phase: publication
Priority: P0
Dependencies: SA-T040

Given: Artifact has been published
When: Another user queries `GET /api/discovery-feed?problemStoryId=...` with a similar problem
Then: Published artifact appears in results, ranked by similarity.

Success metric: Discovery response array contains entry where `problemStoryId` matches the published artifact. `similarityScore > 0`.

### SA-T043: Fork from discovered artifact

Phase: publication
Priority: P1
Dependencies: SA-T042, SA-T034

Given: User discovers an artifact in the feed
When: User clicks "Fork" → `POST /api/save-games/:id/fork`
Then: New problem story created with parent reference. Snapshot mounted as starting workspace.

Success metric: New story has `parentStoryId` set. New story's first experiment card contains the forked `artifact.source`.

---

## Phase S5: ERC-8004 Minting

### SA-T050: Snapshot pinned to IPFS

Phase: erc8004
Priority: P1
Dependencies: SA-T030

Given: Converged artifact with exported zip snapshot
When: User initiates minting flow
Then: Zip snapshot is pinned to IPFS. An `ipfs://` URI is returned.

Success metric: Pin response contains `IpfsHash` (CID). URI format: `ipfs://{CID}`. Pinned content is valid zip (starts with `PK` header).

### SA-T051: ERC-8004 token minted with artifact URI

Phase: erc8004
Priority: P1
Dependencies: SA-T050

Given: Snapshot pinned to IPFS, user has Privy wallet
When: Mint transaction submitted via Agent0 SDK
Then: `erc8004Registrations` row created. Token `agentURI` equals the IPFS URI.

Success metric: `store.erc8004Registrations` contains row where `data.agentURI === ipfsUri`.

### SA-T052: On-chain metadata includes iteration provenance

Phase: erc8004
Priority: P1
Dependencies: SA-T051

Given: Token minted
When: Metadata queried
Then: Metadata contains `problemDescription`, `convergenceScore`, `totalIterations`, `metricsUsed`.

Success metric: All four fields present and non-empty. `convergenceScore` is a number between 0 and 1.

### SA-T053: Attestation provenance with wallet signature

Phase: erc8004
Priority: P2
Dependencies: SA-T051

Given: Token minted
When: Attestation created
Then: `library_public_stack_attestation_provenance` row exists with `wallet_address`, `signature`, `message_digest`, `chain`.

Success metric: Provenance row `verified_signer_address` matches user's Privy wallet address.

---

## Phase S6: Learning System

### SA-T060: Discarded experiments recorded in published stream

Phase: learning
Priority: P0
Dependencies: SA-T040

Given: Iteration session has 6 cards: 3 kept, 2 discarded, 1 abandoned
When: Stream is published
Then: Published stream `cards` array includes all 6 cards with correct `status` values.

Success metric: `publishedStream.cards.filter(c => c.status === 'discarded').length === 2`. `publishedStream.cards.filter(c => c.status === 'kept').length === 3`.

### SA-T061: Feedback text preserved in published stream

Phase: learning
Priority: P0
Dependencies: SA-T060

Given: User gave text feedback on 3 cards during iteration
When: Stream is published
Then: `feedbackRounds` array has entries with `text`, `sentiment`, `constraintsExtracted`.

Success metric: `publishedStream.feedbackRounds.length >= 1`. At least one entry has non-empty `text`.

### SA-T062: Pull-context extracts negative constraints

Phase: learning
Priority: P1
Dependencies: SA-T061

Given: Published stream has discarded experiments with feedback "remove the sidebar, it's distracting"
When: Another user calls `POST /api/discovery-feed/:id/pull-context`
Then: Pulled insights include a negative constraint: `"no sidebar"` or equivalent.

Success metric: Requester's `story.context` array contains an insight with source matching the published stream. Insight text references the rejected approach.

### SA-T063: Metric proposal accuracy tracked

Phase: learning
Priority: P2
Dependencies: SA-T060

Given: Multiple published streams exist for similar problem domains
When: System analyzes metric acceptance rates
Then: For each problem domain, the ratio of `proposed metrics accepted / proposed metrics total` is recorded.

Success metric: Published stream metadata includes `metricsProposed` (count) and `metricsAccepted` (count). Ratio computable.

### SA-T064: Fork genealogy queryable

Phase: learning
Priority: P2
Dependencies: SA-T035

Given: Artifact A was forked to create B, which was forked to create C
When: `GET /api/library/items/:id/lineage` is called for C
Then: Response includes chain: `[A.id, B.id, C.id]`.

Success metric: Lineage array length >= 2. First element is the root ancestor. Last element is the queried item.

---

## Phase S7: Integration Smoke Tests

### SA-T090: Full sandbox iteration smoke test

Phase: smoke
Priority: P0
Dependencies: SA-T004, SA-T010, SA-T011, SA-T020

Given: Fresh server, clean state
When: User completes: identity → brain → problem ("write a function that reverses a string") → agent writes TypeScript → sandbox compiles and runs → output appears in card → user gives feedback → agent iterates → 2 rounds complete
Then: At least 2 experiment cards with `artifact.source` containing TypeScript. At least one card with `artifact.outputPreview` containing the reversed string.

Success metric: `experimentCards.length >= 2`. `experimentCards.some(c => c.artifact?.source && c.artifact?.outputPreview)`.

### SA-T091: Full transfer smoke test

Phase: smoke
Priority: P0
Dependencies: SA-T030, SA-T031, SA-T032, SA-T033

Given: Converged experiment with code artifact
When: Export → store as library item → import in new session → mount → compile → run
Then: Output matches original. Library item exists. Round-trip complete.

Success metric: `output2 === output1`. `libraryItem.type === 'sandbox_snapshot'`. `libraryItem.content_type === 'application/zip'`. `libraryItem.content_hash` is valid SHA-256.

### SA-T092: Full publication + discovery smoke test

Phase: smoke
Priority: P1
Dependencies: SA-T040, SA-T041, SA-T042

Given: Published artifact in registry
When: New user searches for similar problem → discovers artifact → forks it
Then: Fork produces new problem story with parent reference. Forked workspace compiles and runs.

Success metric: New story `parentStoryId` is set. Forked code compiles with exit code 0.

### SA-T093: Full ERC-8004 mint smoke test

Phase: smoke
Priority: P2
Dependencies: SA-T050, SA-T051, SA-T052

Given: Converged artifact, Privy wallet available, IPFS pin configured
When: User mints ERC-8004 token
Then: Token registered with `agentURI` pointing to IPFS. Metadata contains problem description and convergence score.

Success metric: `erc8004Registrations` row exists. `agentURI` starts with `ipfs://`. `metadata.convergenceScore > 0`.

---

## 4. Test count summary

| Phase | ID range | Tests | P0 | P1 | P2 |
|-------|----------|-------|----|----|-----|
| S0: Sandbox Foundation | SA-T001–T007 | 7 | 5 | 2 | 0 |
| S1: Artifact Model | SA-T010–T014 | 5 | 4 | 1 | 0 |
| S2: Agent Code Gen | SA-T020–T023 | 4 | 3 | 0 | 1 |
| S3: Transferability | SA-T030–T035 | 6 | 4 | 2 | 0 |
| S4: Publication & Registry | SA-T040–T043 | 4 | 3 | 1 | 0 |
| S5: ERC-8004 Minting | SA-T050–T053 | 4 | 0 | 3 | 1 |
| S6: Learning System | SA-T060–T064 | 5 | 2 | 1 | 2 |
| S7: Smoke Tests | SA-T090–T093 | 4 | 2 | 1 | 1 |
| **Total** | | **39** | **23** | **11** | **5** |

---

## 5. Implementation order

Recommended build sequence for an agentic AI developer:

1. **SA-T001–T007** (Sandbox Foundation) — boot WebContainer, compile TS, enforce limits
2. **SA-T010–T014** (Artifact Model) — extend cards with code + output
3. **SA-T020–T022** (Agent Code Gen) — agent writes and iterates on code
4. **SA-T090** (Smoke) — verify the sandbox iteration loop works end-to-end
5. **SA-T030–T035** (Transferability) — export/import snapshots
6. **SA-T040–T043** (Publication & Registry) — publish and discover artifacts
7. **SA-T091–T092** (Smoke) — verify transfer and discovery
8. **SA-T060–T064** (Learning System) — record and extract learning signals
9. **SA-T050–T053** (ERC-8004) — on-chain minting
10. **SA-T093** (Smoke) — verify mint flow
11. **SA-T023** (Sub-agents) — multi-worker code generation

Each phase produces a testable increment. No phase requires a later phase.

---

## 6. Server route extensions needed

| Route | Method | Purpose | Phase |
|-------|--------|---------|-------|
| `POST /api/problem-stories/:id/experiment-cards` | POST | Agent submits card with artifact | S1 |
| `POST /api/sandbox/snapshot` | POST | Store snapshot binary | S3 |
| `GET /api/sandbox/snapshot/:id` | GET | Retrieve snapshot binary | S3 |
| `GET /api/library/items/:id/lineage` | GET | Fork genealogy chain | S6 |
| `POST /api/iterate/mint` | POST | Initiate ERC-8004 mint flow | S5 |

All other routes use existing infrastructure (library, registry, publication, discovery, save-game).

---

## 7. Browser requirements

| Requirement | WebContainer path | Fallback path |
|---|---|---|
| SharedArrayBuffer | Required | Not needed |
| Cross-Origin-Opener-Policy | `same-origin` | Any |
| Cross-Origin-Embedder-Policy | `require-corp` | Any |
| Service Worker | Optional | Not needed |
| esbuild-wasm | Not needed | Required |
| Minimum browser | Chrome 90+, Firefox 95+ | All modern browsers |

The server must set COOP/COEP headers for the `/iterate` route when WebContainer is the primary path. Fallback detection is automatic.
