# OpenClaw Lite — Tools + Experience Engine Spec v1.0

**Status:** Draft (normative for upcoming milestones)  
**Version:** 1.0.0  
**Audience:** OpenClaw Lite implementers; AI developers shipping TDD milestones  
**Scope:** Browser-scoped tool platform that supports:
- the three reference skill files:
  - `https://agenttown.app/skill.md`
  - `https://www.moltbook.com/skill.md`
  - `http://localhost:4173/skill_agent_solo.md`
- forward-looking experience engine primitives (websocket control plane + WebMCP-ready adapter)

This spec extends:
- `specs/07_openclaw_lite_web_runtime_spec_v1_2.md`
- `specs/08_pi_ai_browser_port_spec_v1_0.md`

`specs/02_api_contract.md` remains the source of truth for currently implemented endpoints.  
Planned endpoints in this document MUST be added to `specs/02_api_contract.md` only when their milestones ship.

---

## 0) Normative constraints

### 0.1 Hard constraints (MUST)

- No host OS tools.
- No arbitrary host filesystem access.
- PI agent loop + PI-AI path remains mandatory.
- No runtime wallet mocks and no runtime LLM mocks.
- Session/transcript artifacts stay OpenClaw-compatible.

### 0.2 Browser-first security posture (MUST)

- Same-origin calls are allowed by default.
- Cross-origin network actions require explicit human approval and an origin grant.
- All sensitive tools (wallet signing, sending transactions, secret writes, cross-origin API calls) are approval-gated.

---

## 1) Capability targets

### 1.1 Required for reference skills

The runtime MUST provide enough capability for the three reference skills to execute without OS shell access.

| Capability | `agenttown.app/skill.md` | `moltbook.com/skill.md` | `skill_agent_solo.md` |
|---|---|---|---|
| Fetch remote docs (`web_fetch`) | Required | Required | Required |
| HTTP method + headers + JSON body (`curl` pendant) | Required | Required | Required |
| Polling loops | Required | Required | Required |
| Secret storage (API key / keys) | Recommended | Required | Required |
| Crypto primitives (SHA-256/HKDF/HMAC/AES-GCM/random) | Required | Optional | Required |
| Solana wallet connect/sign | Required | Optional | Required |
| EVM wallet support | Optional | Optional | Required for anchor flows |
| Workspace read/write files | Recommended | Recommended | Recommended |
| Websocket API tools | Future-friendly | Future-friendly | Future-friendly |

### 1.2 Forward-looking (experience engine)

The platform SHOULD support:
- realtime websocket API coordination with world/scene backends
- workspace-native experience files (`skill.md`, `heartbeat.md`, `goals.md`, `tools.md`, `penalty.md`)
- WebMCP-compatible discovery/invocation path

### 1.3 Agent workspace primitive (MUST)

OpenClaw Lite MUST expose a first-class in-browser Agent Workspace so users can configure/update the agent and inspect what the agent generated.

Minimum workspace requirements:
- one active workspace root at `workspace/`
- OpenClaw core identity files present in workspace:
  - `workspace/AGENTS.md`
  - `workspace/SOUL.md`
  - `workspace/USER.md`
  - `workspace/IDENTITY.md`
  - `workspace/TOOLS.md`
- optional-but-recommended files for experience flows:
  - `workspace/SKILL.md`
  - `workspace/HEARTBEAT.md`
  - `workspace/GOALS.md`
  - `workspace/PENALTY.md`

Initialization rules:
- If core files are missing, runtime MUST bootstrap them from deterministic templates.
- Bootstrap MUST be idempotent: repeated init does not overwrite existing user content.
- File paths and content format MUST remain OpenClaw-compatible.

User experience requirements:
- Gateway Panel MUST provide a Workspace view for:
  - browsing files
  - reading/editing files
  - seeing which files were created/updated by the agent
- The UI MUST show write provenance at minimum:
  - actor (`human|agent|system`)
  - path
  - timestamp

---

## 2) Security and trust model

### 2.1 Origin policy (MUST)

- Default policy is same-origin only.
- Cross-origin access is denied unless a grant exists.
- Grants are explicit and scoped by:
  - origin
  - capability (`web_fetch`, `http_request`, `ws_open`)
  - expiration
  - optional method restrictions

### 2.2 Grant classes (MUST)

- `once`: valid for exactly one matching call.
- `session`: valid until tab close/reload.
- `ttl`: valid until timestamp.

### 2.3 Approval requirements (MUST)

Approval is required before:
- first cross-origin request per origin+capability scope
- writing/deleting secrets
- wallet signing and wallet transaction submission
- websocket connect to non-same-origin

### 2.4 Secret leakage prevention (MUST)

- Secret values MUST NOT be written into transcript text or logs.
- Secret values MUST be redacted in tool result echoes.
- Redirects to a new origin MUST drop sensitive headers by default.

### 2.5 SSRF and local network controls (MUST)

For proxy-backed fetch/request tools:
- block private/internal IPs and blocked hostnames by default
- permit localhost/private-network only in explicit local-dev mode and only with approval
- enforce redirect limits and DNS pinning

---

## 3) Common tool contract

### 3.1 Tool result envelope (MUST)

Success:
```json
{
  "ok": true,
  "data": {},
  "meta": { "tool": "name", "durationMs": 12 }
}
```

Failure:
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "human readable",
    "retryable": false,
    "details": {}
  },
  "meta": { "tool": "name", "durationMs": 12 }
}
```

### 3.2 Standard error codes (minimum)

- `NETWORK_BLOCKED`
- `APPROVAL_REQUIRED`
- `APPROVAL_REJECTED`
- `INVALID_ARGUMENTS`
- `TIMEOUT`
- `SIZE_LIMIT`
- `NOT_FOUND`
- `UNAUTHORIZED`
- `UNSUPPORTED`

---

## 4) Tool specifications

### 4.0 Browser-native baseline tool set (MUST)

The baseline tool set MUST include:
- workspace tools on OPFS/IndexedDB-backed VFS: `workspace_read_file`, `workspace_write_file`, `workspace_edit_file` (plus mkdir/list/delete)
- `web_fetch` for page/document retrieval
- `http_request` as the curl pendant (typed, deterministic, policy-gated)
- websocket tools for API-grade workflows: `ws_open`, `ws_send`, `ws_recv`, `ws_close` (with `ws_status`)
- wallet tools (`wallet_*`) with mandatory approvals and explicit signing-intent display

## 4.1 `web_fetch`

Purpose: fetch pages/documents as text from same-origin or approved cross-origin.
Compatibility:
- `skill_fetch` MAY exist as a thin alias/wrapper over `web_fetch` for skill-centric prompts.
- `skill_fetch` MUST NOT bypass `web_fetch` policy gates.

Input:
```json
{
  "url": "https://...",
  "maxBytes": 262144,
  "followRedirects": true,
  "cacheMode": "allow-cache|bypass|revalidate",
  "expectedMime": "text/markdown|text/plain|application/json|any"
}
```

Output:
```json
{
  "ok": true,
  "data": {
    "url": "original",
    "finalUrl": "after redirects",
    "status": 200,
    "contentType": "text/markdown; charset=utf-8",
    "etag": "optional",
    "lastModified": "optional",
    "sha256B64": "...",
    "text": "document text",
    "truncated": false,
    "fromCache": false
  }
}
```

Rules:
- MUST support markdown/plain/json text payloads.
- MUST cap payload by `maxBytes` with `truncated=true`.
- MUST return `finalUrl` so agents can reason about redirected hosts.
- MUST deny disallowed origins with `NETWORK_BLOCKED`.

Implementation guidance:
- Same-origin direct fetch when possible.
- Proxy fallback for cross-origin (CORS-resistant path).

---

## 4.2 `http_request` (curl pendant)

Purpose: browser-safe equivalent of common `curl` workflows for skill/API interaction.
Execution rule:
- Requests MUST execute through browser/network APIs only (direct fetch or approved proxy path).
- Runtime MUST NOT call shell `curl`.

Input:
```json
{
  "url": "https://...",
  "method": "GET|POST|PUT|PATCH|DELETE|HEAD",
  "query": { "k": "v" },
  "headers": { "content-type": "application/json" },
  "body": {
    "kind": "text|json|base64",
    "text": "",
    "json": {},
    "base64": ""
  },
  "timeoutMs": 30000,
  "followRedirects": true,
  "maxBytes": 262144,
  "responseMode": "auto|json|text|base64",
  "auth": {
    "kind": "none|bearer_secret_ref",
    "secretRef": "moltbook.api_key"
  }
}
```

Output:
```json
{
  "ok": true,
  "data": {
    "status": 200,
    "finalUrl": "https://...",
    "headers": { "content-type": "application/json" },
    "bodyText": "...",
    "bodyJson": {},
    "bodyBase64": "",
    "truncated": false,
    "timing": {
      "startedAtMs": 0,
      "durationMs": 0
    }
  }
}
```

Rules:
- `body.kind` determines which body field is used.
- On cross-origin redirect, sensitive headers (authorization/cookie-like) MUST be removed unless an explicit grant allows forwarding.
- MUST support polling patterns (repeat calls) deterministically.
- Timeouts, truncation, and policy-block outcomes MUST use deterministic error codes.
- MUST enforce domain allowlist policy before request execution.
- MUST enforce method-level approvals for `POST|PUT|PATCH|DELETE`.
- MUST enforce per-origin rate limits.
- MUST enforce payload and response byte caps.

### 4.2.1 Optional `curl_parse` (subset)

Purpose: keep skill snippets with `curl ...` usable while preserving policy control.

Rules:
- `curl_parse` parses a constrained curl subset into an `http_request` object.
- Supported subset SHOULD include: `-X`, `-H`, `-d/--data`, URL, querystring.
- Unsupported flags MUST return `UNSUPPORTED` and MUST NOT execute.
- All execution MUST flow through `http_request`.

---

## 4.3 Websocket tools

Minimum set:
- `ws_open`
- `ws_send`
- `ws_recv`
- `ws_close`
- `ws_status`

### 4.3.1 `ws_open`

Input:
```json
{
  "url": "wss://...",
  "protocols": ["json"],
  "connectTimeoutMs": 10000
}
```

Output:
```json
{
  "ok": true,
  "data": {
    "sessionId": "ws_...",
    "url": "wss://...",
    "readyState": "open",
    "protocol": "json"
  }
}
```

### 4.3.2 `ws_send`

Input:
```json
{
  "sessionId": "ws_...",
  "text": "...",
  "json": {}
}
```

Rules:
- Exactly one of `text` or `json` MUST be present.

### 4.3.3 `ws_recv` (alias: `ws_receive`)

Input:
```json
{
  "sessionId": "ws_...",
  "maxMessages": 1,
  "waitMs": 5000
}
```

Output:
```json
{
  "ok": true,
  "data": {
    "messages": [
      { "type": "text|json|binary", "text": "...", "json": {} }
    ]
  }
}
```

Rules:
- `ws_recv` MUST return within `waitMs` with zero or more messages.
- `ws_close` MUST free session resources.

---

## 4.4 Workspace tools (OPFS/IndexedDB-backed browser VFS)

Purpose: create/read/edit files in browser workspace while preserving OpenClaw-compatible layout.

Minimum set:
- `workspace_mkdir`
- `workspace_list`
- `workspace_read_file`
- `workspace_write_file`
- `workspace_edit_file`
- `workspace_delete`

Path rules:
- All paths MUST be relative to VFS roots (for example `workspace/`).
- Path traversal (`..`) MUST be rejected.

### 4.4.0 Workspace bootstrap primitive

The runtime MUST provide a bootstrap primitive (tool or startup routine) that guarantees the core OpenClaw files exist in `workspace/`:
- `AGENTS.md`
- `SOUL.md`
- `USER.md`
- `IDENTITY.md`
- `TOOLS.md`

Rules:
- Bootstrap MUST preserve existing files and only create missing ones.
- Bootstrap output MUST report which files were created vs already present.
- Bootstrap writes MUST be visible in workspace provenance events.

### 4.4.1 `workspace_write_file`

Input:
```json
{
  "path": "workspace/tools.md",
  "text": "content",
  "createParents": true,
  "overwrite": true
}
```

Rules:
- Parent directories MAY be auto-created when `createParents=true`.
- Writes MUST be atomic.

### 4.4.2 `workspace_edit_file`

Input:
```json
{
  "path": "workspace/tools.md",
  "edits": [
    { "find": "old", "replace": "new", "all": false }
  ]
}
```

Rules:
- Must return number of replacements.
- Must fail with `NOT_FOUND` when target file is missing.

---

## 4.5 Secret tools

Purpose: keep credentials out of transcript/log while enabling authenticated API calls.

Minimum set:
- `secret_set`
- `secret_list`
- `secret_delete`

`secret_get` SHOULD NOT return raw values to the model in normal mode.

Recommended pattern:
- `http_request` resolves `secretRef` at execution time.
- tool response returns redacted marker (for example `Bearer ****`).

---

## 4.6 Wallet tools (Solana + EVM)

Minimum set:
- `wallet_connect`
- `wallet_get_accounts`
- `wallet_sign_message`
- `wallet_sign_typed_data` (EVM)
- `wallet_send_transaction`

### 4.6.1 `wallet_connect`

Input:
```json
{
  "chain": "solana|evm"
}
```

Output:
```json
{
  "ok": true,
  "data": {
    "chain": "solana",
    "address": "..."
  }
}
```

Rules:
- Solana path MUST support current runtime flow.
- EVM path MUST support extension wallet if present and deterministic local-test wallet fallback for E2E.

### 4.6.2 `wallet_sign_message`

Input:
```json
{
  "chain": "solana|evm",
  "message": "..."
}
```

Output:
```json
{
  "ok": true,
  "data": {
    "address": "...",
    "signature": "<base64|hex>",
    "encoding": "base64|hex"
  }
}
```

Rules:
- Signing requires explicit approval.
- Signing approval UI MUST display clear signing intent:
  - chain
  - account
  - message or typed-data summary
  - destination/value for transactions
- For backup/unlock flows, deterministic-signature checks remain enforced where required by current spec.

---

## 4.7 Crypto utility tools

Purpose: support skill instructions that explicitly require cryptographic derivations.

Minimum set:
- `crypto_random_bytes`
- `crypto_sha256`
- `crypto_hkdf_sha256`
- `crypto_hmac_sha256`
- `crypto_aes_gcm_encrypt`
- `crypto_aes_gcm_decrypt`

Rules:
- Inputs/outputs MUST declare encoding (`utf8|base64|hex`).
- Output determinism MUST match WebCrypto behavior.
- Tooling MUST stay in-browser; no native shell crypto calls.

---

## 4.8 WebMCP adapter tools (forward-looking)

Minimum set:
- `mcp_discover`
- `mcp_call`

Rules:
- MUST support browser-safe transport.
- MUST map MCP tool schemas to OpenClaw Lite tool-call/result transcript model.
- MUST preserve approval gates for side-effecting MCP calls.

---

## 5) Runtime behavior requirements

### 5.1 Tool registry and transcript hygiene (MUST)

- Tool calls MUST produce matching tool results.
- No orphan or duplicate tool results.
- Tool call IDs MUST be stable/safe for OpenClaw compatibility.

### 5.2 Retry/backoff policy (MUST)

- HTTP and websocket reconnect loops SHOULD expose configurable backoff.
- Default polling cadence SHOULD be 1 second for Agent Town style flows, with adaptive backoff under error.

### 5.3 Observability (MUST)

- Each tool execution logs structured metadata:
  - `tool`
  - `durationMs`
  - `status`
  - redacted request summary
- Secret payloads MUST never be logged.

---

## 6) Reference skill conformance

## 6.1 Conformance target A: `https://agenttown.app/skill.md`

Must be possible to:
- fetch skill text
- call `POST /api/agent/connect`
- poll `GET /api/agent/state`
- call select/open/canvas endpoints
- perform key derivation and house-auth HMAC workflows

## 6.2 Conformance target B: `https://www.moltbook.com/skill.md`

Must be possible to:
- fetch skill and companion docs
- register agent and persist API key securely
- send authenticated requests to `https://www.moltbook.com/api/v1/*`
- prevent API key leakage across redirects or logs

## 6.3 Conformance target C: `http://localhost:4173/skill_agent_solo.md`

Must be possible to:
- fetch local skill
- run solo session + paint + house init flow
- use Solana wallet path for required unlock/recovery
- support EVM wallet path for anchor-compatible flows

---

## 7) TDD milestones (granular)

Milestones extend existing M0-M8 and start at M9.
This sequence explicitly includes previously agreed tracks:
- Track 1: `web_fetch` (+ optional `curl_parse`) + `http_request` (`curl` pendant) -> M11-M13
- Track 2: Solana wallet toolization -> M17
- Track 3: EVM wallet bridge + server verification -> M18

## M9 — Tool Runtime Skeleton

Done when:
- Worker exposes a non-empty tool registry.
- Tool calls execute through one dispatcher path.
- Tool call/result pairing remains valid.

Tests:
- `e2e/openclaw_lite/10_tools_runtime_boot.spec.js`
- `e2e/openclaw_lite/10b_tool_pairing_invariants.spec.js`

Measurable criteria:
- At least 5 synthetic tool calls complete.
- 0 pairing violations in exported transcript.

## M10 — Origin Grants + Approval Scopes

Done when:
- Cross-origin call is blocked without grant.
- Human can approve `once` and `session` grants.
- Grant revocation works.

Tests:
- `e2e/openclaw_lite/11_origin_grants.spec.js`

Measurable criteria:
- First unauthorized call returns `NETWORK_BLOCKED`.
- `once` grant allows exactly one successful call.
- Revoked grant blocks next call.

## M11 — `web_fetch` (with `skill_fetch` alias)

Done when:
- Same-origin and cross-origin page/document fetch both work.
- Redirect tracking and truncation work.
- Proxy path enforces SSRF/local-network policy.

Tests:
- `e2e/openclaw_lite/12_web_fetch.spec.js`
- `e2e/openclaw_lite/12b_web_fetch_live_examples.spec.js` (nightly/integration)

Measurable criteria:
- Fetch returns `finalUrl`, `status`, `text`, and `sha256B64`.
- Live example checks:
  - `https://agenttown.app/skill.md` contains `Agent Town`
  - `https://www.moltbook.com/skill.md` contains `Moltbook`
  - `http://localhost:4173/skill_agent_solo.md` contains `Solo Agent`

## M12 — `http_request` (`curl` pendant)

Done when:
- Tool supports standard HTTP methods, headers, query, and body.
- Redirect and timeout handling is deterministic.
- Sensitive-header redirect stripping is enforced.
- Optional: `curl_parse` subset compiles curl snippets into `http_request`.

Tests:
- `e2e/openclaw_lite/13_http_request_tool.spec.js`

Measurable criteria:
- JSON POST roundtrip succeeds.
- Cross-origin redirect drops `Authorization` by default.
- Response-size cap sets `truncated=true`.
- Method-level approval required for `POST|PUT|PATCH|DELETE`.
- Rate limit and payload-limit errors are deterministic.

## M13 — Secret Store Integration

Done when:
- Secrets can be set/listed/deleted.
- `http_request` can use secret refs.
- Transcript/log redaction is enforced.

Tests:
- `e2e/openclaw_lite/14_secret_store.spec.js`

Measurable criteria:
- Raw secret value is absent from transcript and logs.
- Authenticated request succeeds via secret ref.

## M14 — Websocket API Tools

Done when:
- `ws_open/send/recv/close/status` work with stable session IDs.
- Timeout and closed-session errors are deterministic.

Tests:
- `e2e/openclaw_lite/15_ws_tools.spec.js`

Measurable criteria:
- Local ws echo/json-rpc fixture passes request/response cycle.
- `ws_recv` timeout returns empty list or `TIMEOUT` by contract.

## M15 — Workspace File Tools

Done when:
- Tooling can mkdir/list/read/write/edit/delete under VFS roots.
- Path traversal is blocked.
- Core OpenClaw workspace files are bootstrapped when missing.
- Users can inspect/edit workspace files and see agent-created updates in Gateway UI.

Tests:
- `e2e/openclaw_lite/16_workspace_tools.spec.js`
- `e2e/openclaw_lite/16b_workspace_core_bootstrap.spec.js`
- `e2e/openclaw_lite/16c_workspace_visibility.spec.js`

Measurable criteria:
- `workspace/skill.md` write+read roundtrip exact match.
- `../` path returns `INVALID_ARGUMENTS`.
- Bootstrap creates missing core files exactly once and does not overwrite existing files.
- Workspace UI lists agent-created/updated files with actor + path + timestamp.

## M16 — Tool Transcript + Export Compatibility

Done when:
- Tool-rich sessions still export OpenClaw-compatible artifacts.
- Compatibility validator still passes.

Tests:
- `e2e/openclaw_lite/17_tool_transcript_compat.spec.js`
- `e2e/13_openclaw_compat_validator.spec.js`

Measurable criteria:
- 0 orphan tool results.
- Export zip includes workspace artifacts created via tools.

## M17 — Solana Wallet Toolization

Done when:
- Solana wallet bridge is exposed as tools.
- Signing and house recovery flows work through tool path.

Tests:
- `e2e/openclaw_lite/18_wallet_solana_tools.spec.js`

Measurable criteria:
- `wallet_sign_message` yields valid 64-byte signature.
- `/api/wallet/lookup` accepts signature and returns expected house info.

## M18 — EVM Wallet Bridge + Verification

Done when:
- EVM wallet tools exist.
- Server verifies EVM signatures for lookup/init paths.

Tests:
- `e2e/openclaw_lite/19_wallet_evm_tools.spec.js`

Measurable criteria:
- `wallet_connect(chain=evm)` returns checksummed address.
- `wallet_sign_message(chain=evm)` verifies server-side.
- EVM unlock/keyWrap lookup path returns expected house record.

## M19 — Agent Town Skill Conformance

Done when:
- Runtime can execute core agent-town flow primitives via tools.

Tests:
- `e2e/openclaw_lite/20_skill_agenttown_conformance.spec.js`

Measurable criteria:
- Connect, poll, select, open sequence completes in fixture flow.
- Required API calls are observed in order.

## M20 — Moltbook Skill Conformance

Done when:
- Runtime can execute register/auth/feed/post primitives via tools.

Tests:
- `e2e/openclaw_lite/21_skill_moltbook_conformance.spec.js`

Measurable criteria:
- Registration response persisted to secret store.
- Authenticated feed + post calls succeed with secret-ref auth.

## M21 — Solo Skill Conformance (`skill_agent_solo.md`)

Done when:
- Runtime executes solo flow primitives end-to-end.

Tests:
- `e2e/openclaw_lite/22_skill_agent_solo_conformance.spec.js`

Measurable criteria:
- Session creation, paint threshold, commit/reveal, and house init complete.
- Derived key material exists in vault state.

## M22 — WebMCP Adapter (Forward-Looking)

Done when:
- Runtime can discover and invoke MCP tools via browser-safe transport.
- Design is compatible with Chrome WebMCP EPP rollout (Canary-first availability).

Tests:
- `e2e/openclaw_lite/23_webmcp_adapter.spec.js`

Measurable criteria:
- Discovery returns tool list.
- One tool call succeeds and is transcripted compatibly.

## M23 — Experience Engine Baseline

Done when:
- Agent can coordinate with an experience backend over websocket.
- Workspace files (`skill.md`, `heartbeat.md`, `goals.md`, `tools.md`, `penalty.md`) drive behavior.

Tests:
- `e2e/openclaw_lite/24_experience_engine_baseline.spec.js`

Measurable criteria:
- Agent reads all required files from workspace.
- Receives websocket command and produces expected API action.
- Penalty rule from `penalty.md` affects agent action policy deterministically.

---

## 8) Definition of done for this track

The tools track is complete when:
- M9-M23 pass.
- Existing global gates continue passing:
  - `e2e/13_openclaw_compat_validator.spec.js`
  - `e2e/14_openclaw_lite_pi_versions.spec.js`
  - `e2e/15_openclaw_lite_no_mocks.spec.js`
- `specs/02_api_contract.md` is updated for shipped endpoints only.
- No host OS tools were introduced.

---

## 9) Implementation notes for AI developers

- Prefer deterministic local fixtures for primary Playwright gating.
- Keep live internet checks in separate nightly integration tests.
- Add milestones in order; do not skip approval/origin/security layers.
- Any tool added MUST include:
  - schema validation
  - approval policy
  - redaction policy
  - transcript compatibility assertions
