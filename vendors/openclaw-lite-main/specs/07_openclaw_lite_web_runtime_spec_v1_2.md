# OpenClaw Lite — Web-First Runtime Spec v1.2 (Server Storage)

**Status:** Draft (normative)  
**Version:** 1.2.0  
**Audience:** Eliza Town / Agent Town engineers; OpenClaw Lite implementers  
**Scope:** Web-first OpenClaw Lite runtime using server storage for:
- encrypted private vault backups
- public house profiles and platform augmentations

This spec is written to be implemented **test-first**: every milestone below MUST be verifiable with Playwright (`npm test`).

---

## 0) Document conventions

### 0.1 Normative language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as described in RFC 2119.

### 0.2 Repo constraints (MUST)

Implementations targeting this repo MUST preserve the repo’s working agreements:
- Minimal UI (single-purpose, no clutter).
- Human + agent co-op is real: runtime actions require human approval gates.
- Session-token identity only (no external identity providers).
- Deterministic Playwright testability for each milestone.
- No real API keys committed; LLM API keys MUST remain client-side and MUST NOT be persisted by the server.

### 0.3 PI (pi-mono) hard requirement (MUST)

OpenClaw is built on **PI (pi-mono)**. OpenClaw Lite MUST also be built on PI.

Hard requirements:
- Lite MUST use PI’s core runtime primitives (agent loop + message/transcript types) rather than reimplementing them.
- Lite MUST NOT fork PI logic into a separate bespoke implementation.
- Lite’s PI package versions MUST be pinned to match OpenClaw’s pinned PI versions (source of truth: `vendor/openclaw-main/package.json`).

This requirement exists so that upstream security and transcript hygiene fixes in OpenClaw/PI apply to Lite by construction.

### 0.4 Terms

- **Gateway Panel:** the always-present website UI that supervises Lite (chat + approvals + logs).
- **Lite Runtime:** the in-browser agent runtime (Web Worker in Phase 1).
- **House:** an E2EE identity and append-only log, keyed by `houseId` (base58).
- **Vault:** encrypted private state bundle for a house (secrets + runtime state), stored locally and as encrypted server backups.
- **Checkpoint:** a local, frequent snapshot of runtime state used for crash recovery.
- **Pointer:** a small server record that points to the latest object (vault backup / profile artifact).
- **Object store:** server storage for binary blobs (may be implemented as local disk in this repo).

---

## 1) What OpenClaw Lite is

OpenClaw Lite is a browser-native agent runtime (Web Worker / PWA) that:
- runs lightweight playbooks and an event-driven cognition loop,
- can perform house ceremony and E2EE appends,
- persists secrets locally and via encrypted server-hosted vault backups,
- integrates with an always-present website Gateway Panel.

OpenClaw Lite v1.2 is **not** full OpenClaw parity:
- no host OS tools in v1.2: the runtime MUST NOT execute host shell commands or read/write arbitrary host filesystem paths. Tooling MUST be browser-scoped only (Web APIs, IndexedDB/OPFS, and explicitly user-granted file handles).
- no background daemon expectations beyond Worker/PWA constraints

---

## 2) Phase priorities

### Phase 1 (MVP, required for v1.2)

**Embedded Gateway Panel** supervising Lite:
- Chat (human <-> runtime).
- Approvals (runtime proposes an action; human accepts/rejects).
- Logs (structured, filterable).

### Phase 2 (out of scope for v1.2)

Generalized experience gateway (packs, streams, generalized tool invocation UI).

---

## 3) Architecture (server storage)

```mermaid
flowchart LR
  UI["Website UI<br/>(Gateway Panel)"] <--> |postMessage| W["Lite Runtime<br/>(Web Worker)"]
  W --> |HTTP (allowlisted)| API["Agent Town / Eliza Town APIs"]
  API --> STORE["Server Storage<br/>(Object store + pointers)"]
  UI --> |HTTP (allowlisted)| API
```

### 3.1 Hard boundaries (MUST)

- The server MUST treat all vault backups as **opaque ciphertext**.
- The server MUST treat public profile text as **untrusted input** and sanitize on read and/or write.
- The Lite Runtime MUST enforce a networking allowlist (see Section 9).

---

## 4) Storage model (two-tier)

### 4.1 Tier 1 — Local checkpoints (MUST)

Lite MUST checkpoint frequently and on meaningful steps:
- after processing a new observation / inbound event
- after a tool call result is received
- after model output is produced
- on `visibilitychange` and `pagehide`
- on manual “Freeze now”

**Checkpoint format (MUST, stable JSON):**
```json
{
  "v": 1,
  "checkpointId": "cp_...",
  "createdAtMs": 0,
  "houseId": "base58|optional",
  "reason": "observation|tool_result|model_output|pagehide|manual",
  "state": { "runtime": {}, "vaultPointer": {} }
}
```

**Local persistence (MUST):**
- Use IndexedDB.
- Maintain a bounded history (default **50** checkpoints per house; MAY be configurable).
- Writes MUST be atomic at the app level: a checkpoint is either visible in full, or not visible.

### 4.2 Tier 2 — Server-hosted encrypted vault backups (MUST)

Lite MUST support:
- **Lock house:** derive `K_vault` via wallet `signMessage` -> encrypt vault -> upload -> pointers updated.
- **Unlock house:** download latest vault -> derive `K_vault` -> decrypt -> restore locally.

Backups MUST be **E2EE**: server sees only ciphertext + minimal metadata (size, hashes, timestamps, version).

### 4.3 OpenClaw-compatible artifact layout (MUST)

All OpenClaw Lite “memories and runtime artifacts” MUST be **100% compatible with OpenClaw’s on-disk formats**.

Because Lite runs in the browser (no direct filesystem access), it MUST model its persistence as a **virtual filesystem (VFS)** whose paths and file contents match OpenClaw.

Minimum required VFS roots:
- `workspace/` (OpenClaw workspace files: `AGENTS.md`, `SOUL.md`, `USER.md`, `IDENTITY.md`, `TOOLS.md`, optional `MEMORY.md`, and `memory/YYYY-MM-DD.md`)
- `.openclaw/agents/<agentId>/sessions/` (OpenClaw session store + transcripts)

Rules:
- The VFS MUST be the source of truth for exports (Section 10) and for encrypted vault backups (Section 5.4).
- Lite MUST NOT invent a parallel “Lite-only” memory format. Any Lite-only metadata MUST live in a separate `lite/` namespace and MUST NOT be required to restore an OpenClaw-compatible state.
- Session transcript JSONL lines MUST be PI/OpenClaw-compatible message objects (do not introduce a new transcript schema).

Interop note:
- OpenClaw has additional capabilities (OS tools, filesystem tools, sandboxing, credentials). Lite MUST ignore those capabilities, but MUST preserve compatible artifacts so that a state exported from Lite can be loaded into OpenClaw and extended there.

---

## 5) Cryptography (normative)

This spec intentionally mirrors the crypto already used in this repo for house E2EE.

### 5.1 Primitives (MUST)

- Hash: SHA-256
- KDF: HKDF-SHA256
- AEAD: AES-256-GCM
  - IV: 12 bytes random
  - Ciphertext encoding: `ct = ciphertext || tag` (WebCrypto-compatible), base64

### 5.2 House keys (MUST)

House keys are derived from House Ceremony material:
- `K_root` (32 bytes) is derived by ceremony (Section 6).
- `K_enc = HKDF-SHA256(K_root, info="elizatown-house-enc-v1", len=32)`
- `K_auth = HKDF-SHA256(K_root, info="elizatown-house-auth-v1", len=32)`

`K_auth` is used to authenticate house-scoped server calls via HMAC headers (see `specs/02_api_contract.md`).

### 5.3 Vault backup encryption key (MUST)

Vault backups MUST be encrypted with `K_vault` derived from a **deterministic wallet signature**.

1) The client forms a canonical message:
```
ElizaTown Vault Backup Key Wrap
houseId: <houseId>
origin: <origin>
```

2) The client obtains `sigBytes = wallet.signMessage(messageBytes)`.

3) Derive:
- `wrapKeyBytes = SHA-256(sigBytes)` (32 bytes)
- `K_vault = HKDF-SHA256(wrapKeyBytes, info="elizatown-vault-backup-v1", len=32)`

**Determinism requirement (MUST):**
- A wallet implementation used for backups MUST produce the same signature for the same message.
- If the runtime detects a non-deterministic signer (sign same message twice, compare bytes), it MUST refuse to enable backups and surface `NON_DETERMINISTIC_SIGNATURES`.

**Rationale:** if signatures vary, `K_vault` is not recoverable and backups are unrecoverable.

### 5.4 Vault backup envelope (MUST)

Backups uploaded to the server MUST use this envelope:
```json
{
  "v": 1,
  "alg": "AES-GCM",
  "kdf": {
    "kind": "wallet-signature",
    "wallet": "solana|evm",
    "message": "ElizaTown Vault Backup Key Wrap\\nhouseId: ...\\norigin: ...",
    "origin": "https://...",
    "houseId": "base58"
  },
  "iv": "<base64 12 bytes>",
  "ct": "<base64 ciphertext||tag>",
  "meta": {
    "schema": "openclaw-lite-vault@1",
    "createdAtMs": 0,
    "byteLength": 1234,
    "sha256": "<base64 sha256(rawCiphertextBytes)>"
  }
}
```

Notes:
- `kdf.message` MUST be stored to support deterministic restore across devices.
- `meta.sha256` is integrity metadata; it MUST NOT be treated as authentication.

---

## 6) House ceremony (required)

Lite MUST implement House Ceremony v1.1 and prefer **Flow A (no-server-reveal)** when possible.

### 6.1 Ceremony outcomes (MUST)

After successful ceremony:
- `houseId` MUST be derived as `houseIdBytes = SHA-256(K_root)` then base58-encoded.
- `K_root`, `K_enc`, and `K_auth` MUST be derived (Section 5.2).

### 6.2 Flow A — Local ceremony (preferred; no server reveal)

Use when both participants are in the same browser context:
- Human entropy `R_h` is derived locally (implementation-defined; in this repo, the 16x16 canvas can be used).
- Runtime entropy `R_a` is generated in the Worker (`crypto.getRandomValues`).
- `K_root = SHA-256(R_h || R_a)`.

The server MUST receive:
- `houseId`
- `houseAuthKey` (base64 of `K_auth`)
- `keyWrap` (wallet-wrapped `K_root` for recovery; see existing `/api/house/init`)

The server MUST NOT receive `R_h` or `R_a` in Flow A.

### 6.3 Flow B — Manual ceremony packets (interop)

Use when ceremony material must cross a trust boundary (remote runtime):
- The spec MUST define a compact “ceremony packet” encoding as JSON:
```json
{
  "v": 1,
  "houseId": null,
  "commit": "<base64 sha256(reveal)>",
  "reveal": "<base64 32 bytes>",
  "createdAtMs": 0
}
```
- Packet exchange MAY be done via copy/paste or QR.

### 6.4 Key persistence requirement (MUST)

After deriving `K_enc`, Lite MUST persist it inside its private vault under a stable key.

Recommended key namespace:
- `room:<roomId>:kenc`

Where `roomId` is implementation-defined; in this repo, using `houseId` as `roomId` is acceptable for v1.2.

---

## 7) Gateway Panel (Phase 1, required)

### 7.1 UI requirements (MUST)

Gateway Panel MUST provide:
- Chat transcript (human + runtime).
- Pending approvals list.
- Runtime logs (at least: info/warn/error).
- A visible indicator of runtime status: `starting|ready|error`.

UI MUST remain minimal:
- no dashboards
- no feeds
- no points/badges

### 7.1.1 Routes + stable selectors (MUST)

- The Gateway Panel MUST be reachable at `GET /lite`.
- UI elements used by Playwright MUST have stable `data-testid` attributes (no brittle CSS/text selectors).

Minimum required test IDs:
- `gateway`
- `runtime-status`
- `runtime-logs`
- `approvals`
- `chat-input`
- `chat-send`
- `chat-transcript`
- `house-id` (once a house exists)
- `vault-backup-status` (once backups exist)

### 7.2 Approval model (MUST)

By default, the Lite Runtime MUST require a human approval before:
- any network call (fetch) to an allowlisted origin
- any write to server storage (vault backup upload, profile publish)
- any action that writes to the house log

Approval objects MUST be explicit and replayable:
```json
{
  "approvalId": "ap_...",
  "createdAtMs": 0,
  "kind": "net.fetch|house.append|vault.backup|profile.publish",
  "summary": "Human readable one-liner",
  "details": { "method": "GET", "url": "https://...", "bodyPreview": "..." }
}
```

### 7.3 UI <-> Worker protocol (MUST)

The UI and Worker MUST communicate via `postMessage` using a stable message envelope:
```json
{
  "v": 1,
  "id": "msg_...",
  "type": "ui.chat.send",
  "payload": {}
}
```

Required message types (minimum):
- `ui.runtime.start` -> Worker boots playbook/runtime.
- `worker.runtime.ready` -> UI sets status.
- `ui.chat.send` / `worker.chat.message`
- `worker.approval.request` / `ui.approval.respond`
- `worker.log`

All messages MUST be JSON-serializable and versioned (`v`).

---

## 8) Public profile + town view support

Lite MUST support creating/updating public house profile artifacts:
- `house.public.json` (required to publish)
- `prompt.md` (optional)
- `preview.png` (optional)

### 8.1 Public profile rules (MUST)

- Public profile text is untrusted and MUST be sanitized before rendering.
- The town grid MUST render safely even if a profile contains HTML/JS payloads.
- Public artifacts MUST be size-bounded (recommendations):
  - `house.public.json` <= 32 KB
  - `prompt.md` <= 16 KB
  - `preview.png` <= 1 MB

### 8.2 Town grid (MUST)

The product MUST have a “town view” that renders a grid/list of public houses:
- shows preview image (if any)
- shows display name and a short tagline (from `house.public.json`)
- MAY show augmentations (e.g., ERC-8004 id) if available

Town view MUST be public read-only.

Route requirement:
- Town view MUST be reachable at `GET /town`.
- The root element MUST include `data-testid="town-grid"` for Playwright.

---

## 9) Networking allowlist (MUST)

Lite runtime MUST only call:
- Agent Town / Eliza Town API origins (same-origin in this repo)
- user-configured LLM provider endpoint (optional)

Implementation MUST enforce this allowlist at the runtime layer:
- If a playbook/tool attempts to call a disallowed origin, runtime MUST block and log `NETWORK_BLOCKED`.

---

## 10) Export/import (OpenClaw compatibility)

Lite MUST export OpenClaw-compatible artifacts such that a user (or automated tool) can restore them into a full OpenClaw environment.

### 10.1 Export bundle layout (MUST)

The export MUST be a zip file with this top-level layout:

```
manifest.json
workspace/
  AGENTS.md
  SOUL.md
  USER.md
  IDENTITY.md
  TOOLS.md
  MEMORY.md                 (optional)
  memory/                   (optional)
    YYYY-MM-DD.md
.openclaw/
  agents/
    <agentId>/
      sessions/
        sessions.json
        <sessionId>.jsonl
```

Notes:
- `<agentId>` MUST default to `main` for compatibility.
- `sessions.json` MUST be strict JSON (not JSON5).
- Transcript files MUST be JSONL (one JSON object per line).

### 10.2 Manifest (MUST)

`manifest.json` MUST be stable and machine-validated in tests:

```json
{
  "v": 1,
  "kind": "openclaw-lite-export",
  "createdAtMs": 0,
  "openclaw": {
    "agentId": "main",
    "mainSessionKey": "agent:main:main",
    "compat": {
      "openclawVersion": "2026.2.4",
      "piVersions": {
        "@mariozechner/pi-agent-core": "0.52.6",
        "@mariozechner/pi-ai": "0.52.6",
        "@mariozechner/pi-coding-agent": "0.52.6",
        "@mariozechner/pi-tui": "0.52.6"
      }
    }
  }
}
```

Rules:
- `openclaw.compat.openclawVersion` MUST match the vendored OpenClaw reference (`vendor/openclaw-main/package.json`).
- `openclaw.compat.piVersions` MUST match OpenClaw’s pinned PI versions (same source of truth).

### 10.3 Privacy rules (MUST)

- Private house secrets MUST NOT be present in plaintext export.
  - Secrets MAY be present only inside encrypted vault backups (Section 4.2) or an explicitly encrypted export mode (out of scope for v1.2).
- Export MAY include memory files and session transcripts (these are considered user-owned artifacts).

### 10.4 Transcript hygiene (MUST)

Before writing `*.jsonl` transcripts to the VFS and before exporting, Lite MUST ensure transcripts satisfy OpenClaw’s transcript hygiene rules.

Hard requirement:
- Lite MUST use OpenClaw’s transcript repair implementation as the source of truth (vendored reference: `vendor/openclaw-main/src/agents/session-transcript-repair.ts`) and MUST NOT reimplement a divergent repair algorithm.

At minimum, exported transcripts MUST have:
- no orphan `toolResult` messages
- no duplicate tool results for the same tool call id
- no displaced tool results (tool results must appear directly after matching assistant tool calls)
- no tool calls with missing/empty inputs

### 10.5 Import (optional for v1.2)

For v1.2, **export-only** is required; import MAY be deferred.
However, the export format MUST be compatible immediately: unzipping and copying files into an OpenClaw workspace/state dir MUST work without transformation.

---

## 11) Definition of done (v1.2)

All items MUST be demonstrable locally and covered by Playwright:

1) Create house via ceremony and append a proof entry.  
2) Upload public house profile; render it in a town grid.  
3) Lock house -> upload encrypted vault -> pointers updated.  
4) Simulate device loss -> unlock -> restore from vault.  
5) Chat with agent in Gateway Panel; approvals and logs function.  
6) Export OpenClaw-compatible state zip.

---

## 12) TDD milestones (Playwright-verifiable)

Each milestone MUST add/enable a Playwright test file. Keep tests deterministic by:
- using a deterministic **test wallet seed** (real Ed25519 signatures; no injected wallet mocks)
- using a same-origin **OpenAI-compatible LLM proxy** (real PI-AI provider path; deterministic responses in `NODE_ENV=test`)
- using test-only reset (`POST /__test__/reset`)

### M0 — Routes + boot handshake

**Goal:** `/lite` loads and Worker handshake works.

Done when:
- `/lite` renders minimal Gateway Panel.
- Worker posts `worker.runtime.ready` within 1s.

Test: `e2e/openclaw_lite/01_gateway_boot.spec.js`

### M1 — Approvals + logs plumbing

Done when:
- Runtime can request an approval.
- UI can accept/reject.
- Decision is delivered back to runtime and logged.

Test: `e2e/openclaw_lite/02_approvals.spec.js`

### M2 — Local checkpoints

Done when:
- Checkpoints are written on `ui.chat.send` (observation) and `pagehide`.
- Checkpoints are bounded (<= 50) and ordered newest-first or oldest-first (must be specified and tested).

Test: `e2e/openclaw_lite/03_checkpoints.spec.js`

### M3 — House ceremony (Flow A) + E2EE append

Done when:
- Lite derives `houseId`, `K_enc`, `K_auth` locally.
- Creates house via existing `/api/house/init`.
- Appends an encrypted entry via `/api/house/:id/append`.
- House UI can decrypt and render the entry.

Test: `e2e/openclaw_lite/04_house_ceremony_and_append.spec.js`

### M4 — Vault backup upload/download

Done when:
- Runtime encrypts vault into envelope and uploads to server (house-auth).
- Server pointer updates to latest.
- Runtime can download latest and decrypt.

Test: `e2e/openclaw_lite/05_vault_backup_roundtrip.spec.js`

### M5 — Device loss simulation restore

Done when:
- Test clears local storage + IndexedDB.
- Restores house access via wallet unwrap (`/api/wallet/lookup` + keyWrap decrypt).
- Downloads vault backup and restores runtime state (at least: `houseId` + one secret marker).

Test: `e2e/openclaw_lite/06_device_loss_restore.spec.js`

### M6 — Public profile + town grid

Done when:
- House-authenticated publish of `house.public.json` (plus optional artifacts).
- `GET /api/town/grid` returns public entries.
- Town page renders sanitized text.

Test: `e2e/openclaw_lite/07_public_profile_town_grid.spec.js`

### M7 — Export zip

Done when:
- Gateway offers “Export”.
- Downloaded file is a `.zip` containing `manifest.json` + sessions JSONL.
- Export passes the OpenClaw compatibility validator:
  - file tree matches Section 10.1
  - `manifest.json` matches vendored OpenClaw + PI versions
  - all JSONL lines parse and satisfy transcript hygiene checks

Test: `e2e/openclaw_lite/08_export_zip.spec.js`

### M8 — PI-AI LLM integration (NO MOCKS)

Done when:
- Sending a chat message causes Lite to call the OpenAI-compatible proxy endpoint:
  - `POST /api/llm/openai/v1/chat/completions`
- The assistant response is rendered in the Gateway Panel.
- Playwright asserts that the server observed an LLM call (no in-runtime mock adapters).

Test: `e2e/openclaw_lite/09_pi_ai_llm_integration.spec.js`

---

## 13) Required API extensions

All server endpoints and auth rules for vault backups and public profiles MUST be documented in `specs/02_api_contract.md`.
