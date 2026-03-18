# ZHC1 Sandbox & Artifact System — Product Spec

Status: active
Version: 0.1.0
Branch: `zhc1-iterate-prototype`
Last updated: 2026-03-18
Audience: agentic AI developers, platform engineers, product designers
Predecessor: [specs/45_zhc1_iterate_prototype_spec.md](specs/45_zhc1_iterate_prototype_spec.md)
Predecessor: [specs/46_zhc1_iterate_prototype_tdd_spec.md](specs/46_zhc1_iterate_prototype_tdd_spec.md)
Depends on: [specs/02_api_contract.md](specs/02_api_contract.md), [specs/19_unified_experiences_trace_trainer_spec_v0.3.md](specs/19_unified_experiences_trace_trainer_spec_v0.3.md), [specs/28_house_library_memory_spec.md](specs/28_house_library_memory_spec.md), [AGENTS.md](AGENTS.md)

---

## 1. Executive summary

The iteration loop (spec 45) currently produces text proposals. This spec extends it to produce **executable TypeScript artifacts** that run in a browser sandbox, can be transferred between users as binary snapshots, minted on-chain as ERC-8004 tokens, and discovered through Atlas and the Registry.

Each user who solves a problem advances the system. The system records what worked, what was discarded, and what was abandoned — building a learning layer that makes recommendations better for the next person.

---

## 2. Core thesis

The iterate loop is an app factory. Its output is not advice — it is running code.

A user describes a problem. Their agent writes TypeScript that solves it. The agent runs the code in a sandbox, the user sees the result, gives feedback, and the agent iterates. When the solution converges, the user exports it as a portable snapshot. That snapshot is a transferable, mintable, forkable artifact that carries its full provenance.

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   Iterate Experience                          │
│                                                              │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐  │
│  │ Conversation │───▶│ Agent writes │───▶│ Sandbox runs   │  │
│  │ (human+agent)│    │ TypeScript   │    │ code, shows    │  │
│  │              │◀───│              │◀───│ output         │  │
│  └─────────────┘    └──────────────┘    └───────┬────────┘  │
│                                                  │           │
│  ┌──────────────────────────────────────────────▼────────┐  │
│  │                  Experiment Card                       │  │
│  │  code: TypeScript source                               │  │
│  │  output: rendered preview (screenshot / live iframe)    │  │
│  │  scores: self-assessed against confirmed metrics        │  │
│  │  trace: full modification history                       │  │
│  └──────────────────────────────────────────────┬────────┘  │
│                                                  │           │
│  ┌────────────┐  ┌──────────┐  ┌───────────────▼────────┐  │
│  │ Save Game  │  │ Publish  │  │ Export Snapshot         │  │
│  │ checkpoint │  │ to feed  │  │ (WebContainer binary)   │  │
│  └────────────┘  └────┬─────┘  └───────────────┬────────┘  │
│                        │                         │           │
└────────────────────────┼─────────────────────────┼───────────┘
                         │                         │
              ┌──────────▼─────────┐    ┌──────────▼──────────┐
              │ Discovery Feed     │    │ Library Item         │
              │ (keyword ranking,  │    │ (binary snapshot,    │
              │  pull-context)     │    │  versioned,          │
              └──────────┬─────────┘    │  shelf-assignable)   │
                         │              └──────────┬──────────┘
              ┌──────────▼─────────┐    ┌──────────▼──────────┐
              │ Registry Entity    │    │ Public Stack         │
              │ (family catalog,   │    │ (bundled artifacts,  │
              │  search, claims)   │    │  trust-verified)     │
              └──────────┬─────────┘    └──────────┬──────────┘
                         │                         │
              ┌──────────▼─────────────────────────▼──────────┐
              │ ERC-8004 Token                                 │
              │  agentURI: ipfs://snapshot                     │
              │  metadata: problem, metrics, convergence score │
              │  provenance: iteration trace + wallet sig      │
              └────────────────────────────────────────────────┘
```

---

## 4. Architectural rules

1. **All code execution happens in the browser.** The sandbox runs in a WebContainer (or sandboxed iframe with esbuild-wasm as fallback). The server never executes user/agent code.

2. **All LLM calls go through the OpenClaw Lite worker** using the user's own API key. The server stores artifacts only.

3. **Snapshots are the unit of transfer.** A WebContainer `export('/', { format: 'zip' })` produces a compressed `Uint8Array`. That zip is the artifact. It can be mounted, forked, published, minted. Zip is preferred over raw binary to minimize storage and transfer costs.

4. **The iteration trace is the reputation signal.** What the agent tried, what the user rejected, what converged — this is the evidence chain stored alongside the artifact.

5. **Worker-first, modal-compatible.** The sandbox must work standalone at `/iterate` and embedded as a modal in the portal (sharing the portal's agent dock and gateway).

---

## 5. Phases

### Phase S0: Sandbox Foundation

Boot a WebContainer in the browser. Compile and run TypeScript. Capture output.

**Components:**
- WebContainer instance management (boot, mount, export)
- TypeScript compilation (via WebContainer's npm ecosystem or esbuild-wasm fallback)
- Output capture: stdout/stderr for CLI programs, iframe preview for UI programs
- Resource limits: memory cap, execution timeout (30s default), no network access from sandbox

**User experience:**
- After metrics are confirmed, the agent writes TypeScript
- The sandbox compiles and runs it automatically
- Output appears in the experiment card as a live preview or terminal log
- Errors are shown inline; the agent can see them and fix in the next iteration

### Phase S1: Artifact Model

Extend experiment cards to hold code artifacts.

**Experiment card extensions:**
- `artifact.source`: TypeScript source files (FileSystemTree JSON)
- `artifact.compiled`: compiled JavaScript (for instant replay without recompilation)
- `artifact.snapshotZip`: WebContainer `export('/', { format: 'zip' })` compressed archive (Uint8Array)
- `artifact.outputType`: `'terminal'` | `'html'` | `'data'` — what the sandbox produced
- `artifact.outputPreview`: screenshot or rendered HTML string for card visual
- `artifact.entrypoint`: main file path (e.g., `src/index.ts`)

**Card visual** now shows the actual output, not a CSS gradient placeholder.

### Phase S2: Agent Code Generation

The agent (OpenClaw Lite worker) writes code through the iteration loop.

**Skill extensions** (`skill_iterate.md`):
- When generating experiments, the agent produces TypeScript files
- Each experiment modifies the codebase and runs it in the sandbox
- The agent reads stdout/stderr and self-assesses against metrics
- Three strategies apply to code: conservative (small refactors), aggressive (rewrite), creative (novel approach)

**Sub-agents / helper workers:**
- The main agent can delegate code tasks to specialized workers
- Communication protocol: main agent sends task description → helper produces code → main agent reviews and integrates
- Helpers run in the same WebContainer but separate files
- Orchestration through the skill system, not custom infrastructure

**Feedback integration:**
- User feedback on a card (e.g., "the output is wrong for edge case X") gets passed to the agent
- Agent reads the feedback + the code + the output → produces a modified version
- Modified code runs in the same WebContainer (incremental, not from scratch)

### Phase S3: Transferability

Export artifacts as portable snapshots that can be given to other users.

**Export flow:**
1. User clicks "Export" on a converged experiment
2. `webcontainer.export('/', { format: 'zip' })` → compressed `Uint8Array`
3. Snapshot stored as a `library_item` (type: `'sandbox_snapshot'`, content_type: `'application/zip'`)
4. `library_item_revisions` track each export version
5. Snapshot includes: source, compiled output, package.json, config
6. Zip format typically 3-10x smaller than raw binary, reducing storage + IPFS pinning costs

**Import flow:**
1. User discovers an artifact in the feed, registry, or library
2. Clicks "Import" → new WebContainer boots → `mount(snapshotBinary)`
3. Full workspace restored: code, dependencies, config
4. User can run it immediately or fork and modify

**Peer transfer** (uses existing infrastructure):
- `library_peer_relays` for individual artifact distribution
- `library_satchel_relays` for bulk workspace transfers
- `library_route_subscriptions` for continuous sync between houses

### Phase S4: Publication & Registry

Published artifacts become discoverable through the existing platform.

**Publication flow:**
1. Converged experiment → `PUT /api/problem-stories/:id/finish`
2. `POST /api/published-streams` enriches with `codeFingerprint` (SHA-256 of snapshot binary)
3. Artifact stored as `library_public_stack` with `family_slug: 'sandbox-artifacts'`
4. `library_public_stack_members` link individual source files / modules
5. Registry entity created via `POST /api/registry/import`

**Discovery:**
- Existing `/api/discovery-feed` returns published artifacts with similarity ranking
- `/api/registry/search` finds artifacts by keyword, family, problem domain
- Atlas shows artifacts as pins in the district map (new district: "Workshop" or integrated into existing)

**Forking:**
- Any discovered artifact can be forked via the save-game system
- `POST /api/save-games/:id/fork` creates a new problem story with the imported snapshot as starting point
- Fork preserves the parent's iteration trace as context

### Phase S5: ERC-8004 Minting

On-chain registration of artifacts with full provenance.

**Token structure:**
- `agentURI`: `ipfs://` pointing to the exported snapshot binary
- On-chain metadata (via `setMetadata`):
  - `problemDescription`: what the artifact solves
  - `convergenceScore`: final composite score
  - `totalIterations`: how many rounds to converge
  - `metricsUsed`: evaluation criteria names
  - `creatorWallet`: Privy-backed wallet address
  - `createdAt`: timestamp
- Off-chain metadata (at `agentURI`):
  - Full snapshot binary
  - Iteration trace (all cards with scores, feedback, status)
  - Problem story with constraints and preferences

**Minting flow** (extends existing ERC-8004 infra):
1. User has a converged, published artifact
2. Snapshot pinned to IPFS (via existing Pinata integration or similar)
3. ERC-8004 token minted via Agent0 SDK (Solana or EVM)
4. Token registered in `erc8004Registrations` table
5. Attestation provenance created: `library_public_stack_attestation_provenance` with wallet signature

**Reputation signal:**
- Iteration trace attached as validation evidence
- Cards marked `kept` vs `discarded` show decision quality
- Convergence speed (fast = strong signal, slow = exploratory)
- User satisfaction rating (1-5)
- Downstream forks and usage count

### Phase S6: Learning System

The system improves by observing how users solve problems.

**What is recorded** (per iteration session):
- Problem description + domain classification
- Metrics proposed vs. metrics accepted (agent accuracy)
- Experiments kept vs. discarded (solution quality signals)
- Feedback text → constraints extracted (preference patterns)
- Abandoned paths (experiments started but user moved on)
- Convergence trajectory (score over time)
- Time to convergence
- Fork genealogy (which artifacts spawn new work)

**How it improves recommendations:**
- Discovery feed ranking incorporates success signals (convergence score, downstream forks, user satisfaction)
- Pull-context extracts not just what worked but what was explicitly rejected (negative constraints)
- Metric proposals improve by learning which metrics users accept for similar problem domains
- Experiment strategies weighted by historical success (if conservative works 80% of the time for UI problems, lead with conservative)

**Privacy:**
- Raw user conversations are NOT shared. Only extracted constraints, metrics, and scores flow into the learning layer.
- Users opt-in to publication. Unpublished work stays private in their house.
- On-chain artifacts are public by design (user mints intentionally).

---

## 6. Data model extensions

### New fields on ExperimentCard

```javascript
{
  // ... existing fields ...
  artifact: {
    source: FileSystemTree | null,      // TypeScript source files
    compiled: FileSystemTree | null,     // Compiled JS output
    snapshotZip: Uint8Array | null,       // WebContainer export (zip compressed)
    outputType: 'terminal' | 'html' | 'data' | null,
    outputPreview: string | null,        // Rendered output for card visual
    entrypoint: string | null,          // e.g. 'src/index.ts'
    dependencies: string[] | null,       // npm packages used
    executionMs: number | null,         // How long the code ran
    exitCode: number | null,            // Process exit code
  }
}
```

### New library_item type

```javascript
{
  type: 'sandbox_snapshot',
  content_type: 'application/zip',
  content_hash: 'sha256:...',          // Hash of snapshot binary
  metadata: {
    problemDescription: string,
    convergenceScore: number,
    entrypoint: string,
    dependencies: string[],
    parentArtifactId: string | null,    // Fork parent
    iterationTrace: {
      totalRounds: number,
      totalCards: number,
      keptCards: number,
      discardedCards: number,
    }
  }
}
```

### New registry family

```javascript
{
  family_slug: 'iterate-artifacts',
  display_name: 'Iterate Artifacts',
  description: 'Executable solutions created through human-agent iteration loops'
}
```

---

## 7. Sandbox execution model

### WebContainer (primary path)

```javascript
import { WebContainer } from '@webcontainer/api';

// Boot
const wc = await WebContainer.boot();

// Mount agent-written code
await wc.mount({
  'src': {
    directory: {
      'index.ts': { file: { contents: agentCode } }
    }
  },
  'package.json': { file: { contents: JSON.stringify({ ... }) } },
  'tsconfig.json': { file: { contents: JSON.stringify({ ... }) } }
});

// Install + compile + run
await wc.spawn('npm', ['install']);
await wc.spawn('npx', ['tsc']);
const process = await wc.spawn('node', ['dist/index.js']);

// Capture output
process.output.pipeTo(new WritableStream({
  write(chunk) { capturedOutput += chunk; }
}));

// Export for transfer (zip for storage efficiency)
const snapshot = await wc.export('/', { format: 'zip' });
```

### Fallback: iframe + esbuild-wasm

For environments where WebContainers are unavailable (Safari, restricted CSP):

```javascript
import * as esbuild from 'esbuild-wasm';

// Compile TS → JS
const result = await esbuild.transform(tsSource, {
  loader: 'ts',
  target: 'es2020',
});

// Execute in sandboxed iframe
const iframe = document.createElement('iframe');
iframe.sandbox = 'allow-scripts';
iframe.srcdoc = `<script>${result.code}</script>`;
```

### Resource limits

| Limit | Value | Rationale |
|-------|-------|-----------|
| Execution timeout | 30 seconds | Prevents infinite loops |
| Memory | 256 MB | WebContainer default |
| Network | blocked | Sandbox isolation |
| Filesystem | 50 MB | Reasonable workspace size |
| npm install timeout | 60 seconds | Large dependency trees |

---

## 8. Non-goals (this version)

- **Server-side code execution.** All code runs in the browser sandbox. Server deployment is a future phase.
- **Multi-language support.** TypeScript/JavaScript only. Other languages deferred.
- **Real-time collaboration.** One user + one agent per sandbox. Multi-user editing deferred.
- **Billing / metering.** No usage-based charging for sandbox time. Future concern.
- **Network access from sandbox.** Sandboxed code cannot make HTTP requests. API integrations deferred.

---

## 9. Relationship to existing systems

| Existing system | How this spec connects |
|---|---|
| Experiment runner (`server/experiment-runner.js`) | Cards gain `artifact` field; agent-submitted cards replace simulated experiments |
| Publication (`server/publication.js`) | Published streams include snapshot `codeFingerprint`; artifacts join published cards |
| Discovery (`server/discovery.js`) | Discovery feed ranks artifacts by convergence quality + fork count |
| Library (`unified_platform_store.js`) | Snapshots stored as `library_item` type `sandbox_snapshot` |
| Public Stacks | Published artifacts become public stack members |
| Peer Relay / Satchel | Snapshot distribution uses existing relay infrastructure |
| Registry (`server/registry_routes.js`) | Artifacts registered under `iterate-artifacts` family |
| Trust / Attestation | Wallet-signed provenance for minted artifacts |
| ERC-8004 (`8004-solana`, Agent0 SDK) | Mint token with snapshot URI + iteration metadata |
| Trace system | Iteration trace stored as canonical trace events |
| OpenClaw Lite worker | Agent writes code via gateway; sandbox runs it |
| Agent dock (`agent_panel_full.html`) | Brain config + chat shared between iterate and sandbox |
