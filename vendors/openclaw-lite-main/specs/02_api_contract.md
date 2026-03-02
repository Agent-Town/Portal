# API Contract (HTTP) — OpenClaw Lite (Server Storage)

This document is **normative** for the OpenClaw Lite standalone repo.

Principles:
- Session identity is a cookie (`et_session`). No external auth providers.
- House-scoped mutations are authenticated with **HMAC** derived from `K_auth` (see “House Auth”).
- Vault backups are **opaque ciphertext** to the server.
- The LLM proxy MUST NOT persist API keys.
- `NODE_ENV=test` enables deterministic test-only endpoints for Playwright.

---

## Session Identity

- The server assigns a session cookie: `et_session`.
- The cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` in production.

---

## Health

### GET `/api/health`

Response:
```json
{ "ok": true, "time": "2026-02-07T00:00:00.000Z" }
```

---

## Runtime Capabilities

### GET `/api/runtime/capabilities`

Response:
```json
{ "ok": true, "llm": { "codexCli": false } }
```

Notes:
- `llm.codexCli=true` means the server is configured with `OPENCLAW_LITE_CODEX_CLI=1` and will route LLM requests via the local Codex CLI session (see LLM Proxy).

---

## Tool Proxy: Web Fetch

### POST `/api/tools/web_fetch`

Purpose:
- Same-origin worker endpoint for cross-origin `web_fetch`/`skill_fetch` retrieval.
- Enables deterministic text fetch without exposing OS-level `curl`.

Request:
```json
{
  "url": "https://example.com/skill.md",
  "maxBytes": 262144,
  "followRedirects": true,
  "cacheMode": "allow-cache|bypass|revalidate",
  "expectedMime": "text/markdown|text/plain|application/json|any"
}
```

Success response:
```json
{
  "ok": true,
  "data": {
    "url": "https://example.com/skill.md",
    "finalUrl": "https://example.com/skill.md",
    "status": 200,
    "contentType": "text/markdown; charset=utf-8",
    "etag": "\"abc\"",
    "lastModified": "Mon, 01 Jan 2024 00:00:00 GMT",
    "sha256B64": "...",
    "text": "...",
    "truncated": false,
    "fromCache": false
  },
  "meta": { "tool": "web_fetch", "durationMs": 12 }
}
```

Failure response:
```json
{
  "ok": false,
  "error": {
    "code": "NETWORK_BLOCKED|INVALID_ARGUMENTS|TIMEOUT|UNSUPPORTED|NOT_FOUND",
    "message": "...",
    "retryable": false,
    "details": {}
  },
  "meta": { "tool": "web_fetch", "durationMs": 12 }
}
```

Policy:
- Local/private hosts are blocked on proxy path and return `NETWORK_BLOCKED`.
- Redirects are bounded and resolved manually.
- Response bodies are UTF-8 truncated at `maxBytes` with `truncated=true`.

---

## Tool Proxy: HTTP Request (`curl` Pendant)

### POST `/api/tools/http_request`

Purpose:
- Same-origin proxy path for cross-origin `http_request` tool execution.
- Browser-native `curl` equivalent for structured API calls.

Request:
```json
{
  "url": "https://example.com/api",
  "method": "GET|POST|PUT|PATCH|DELETE|HEAD",
  "query": { "k": "v" },
  "headers": { "content-type": "application/json" },
  "body": { "kind": "json|text|base64", "json": {}, "text": "", "base64": "" },
  "timeoutMs": 30000,
  "followRedirects": true,
  "maxBytes": 262144,
  "responseMode": "auto|json|text|base64"
}
```

Success response:
```json
{
  "ok": true,
  "data": {
    "status": 200,
    "finalUrl": "https://example.com/api",
    "headers": { "content-type": "application/json" },
    "bodyText": "...",
    "bodyJson": {},
    "bodyBase64": "",
    "truncated": false,
    "timing": { "startedAtMs": 0, "durationMs": 12 }
  },
  "meta": { "tool": "http_request", "durationMs": 12 }
}
```

Failure response:
```json
{
  "ok": false,
  "error": {
    "code": "NETWORK_BLOCKED|INVALID_ARGUMENTS|TIMEOUT|UNSUPPORTED|NOT_FOUND|SIZE_LIMIT",
    "message": "...",
    "retryable": false,
    "details": {}
  },
  "meta": { "tool": "http_request", "durationMs": 12 }
}
```

Policy:
- Local/private hosts are blocked on proxy path.
- Redirects are bounded and followed manually.
- On cross-origin redirect, sensitive headers (`authorization`, `cookie`, `proxy-authorization`, `x-api-key`) are stripped by default.
- Response payloads are capped by `maxBytes` with `truncated=true`.

---

## LLM Proxy (OpenAI-Compatible)

Browsers call the same-origin proxy; the proxy forwards to OpenAI in production.

Security:
- The server MUST NOT store any user API keys.
- OpenAI proxy mode (default): requests MUST include `Authorization: Bearer <OPENAI_API_KEY>`.
- Codex CLI bridge mode (`OPENCLAW_LITE_CODEX_CLI=1`): `Authorization` is ignored/optional; requests are localhost-only.
- Test (`NODE_ENV=test`): `Authorization` is ignored.

### POST `/api/llm/openai/v1/chat/completions`

- Production: proxies to `https://api.openai.com/v1/chat/completions` and streams bytes back.
- Codex CLI bridge (`OPENCLAW_LITE_CODEX_CLI=1`): proxies via the local `codex` CLI session (localhost-only).
- Test (`NODE_ENV=test`): returns deterministic SSE chunks and increments test stats.

### POST `/api/llm/openai/v1/responses`

- Production: proxies to `https://api.openai.com/v1/responses`.
- Test (`NODE_ENV=test`): returns `501 TEST_RESPONSES_NOT_IMPLEMENTED`.
Notes:
- Codex CLI bridge mode does not currently implement `/responses`.

### ALL `/api/llm/proxy/:encodedBase/*`

Purpose:
- Same-origin generic passthrough for PI providers whose vendor endpoints are not browser-CORS accessible.
- `:encodedBase` is URL-encoded upstream base URL (for example `https%3A%2F%2Fapi.anthropic.com%2Fv1`).
- Any path suffix after `:encodedBase` is appended to the upstream base path.

Behavior:
- Forwards request method, body, and request headers (excluding hop-by-hop headers, `host`, `content-length`, and `cookie`).
- Streams upstream response bytes and status back to browser.
- Does not persist API keys or provider tokens.

Errors:
- `400 INVALID_UPSTREAM_BASE` for invalid/missing upstream base URL.
- `502 UPSTREAM_UNAVAILABLE` when upstream cannot be reached.

---

## Wallet Lookup (House Recovery)

Wallet signatures are verified server-side for:
- Solana (`chain=solana`, Ed25519 `signMessage`)
- EVM (`chain=evm`, `personal_sign` / EIP-191 message signatures)

### GET `/api/wallet/nonce`

Creates a one-time nonce stored in the session.

Response:
```json
{ "ok": true, "nonce": "wn_..." }
```

### POST `/api/wallet/lookup`

Purpose:
- Resolve `address -> latest houseId (+ keyWrap)` for that address.
- Optionally restrict lookup to a specific `houseId`.

Request (nonce mode, preferred):
```json
{
  "chain": "solana|evm",
  "address": "<base58 pubkey>",
  "nonce": "wn_...",
  "houseId": "<optional base58 houseId>",
  "signature": "<base64 ed25519 signature OR 0x... evm signature>"
}
```

Signature message (nonce mode):
```
ElizaTown House Lookup
address: <address>
nonce: <nonce>
houseId: <houseId>        (only if provided)
```

Request (legacy mode, no nonce):
```json
{
  "chain": "solana|evm",
  "address": "<base58 pubkey>",
  "houseId": "<base58 houseId>",
  "signature": "<base64 ed25519 signature OR 0x... evm signature>"
}
```

Signature message (legacy mode):
```
ElizaTown House Key Wrap
houseId: <houseId>
```

Response (found):
```json
{
  "ok": true,
  "houseId": "<base58>",
  "keyWrap": { "alg": "AES-GCM", "iv": "<base64>", "ct": "<base64>" }
}
```

Response (not found):
```json
{ "ok": true, "houseId": null, "keyWrap": null }
```

Errors:
- `MISSING_ADDRESS`
- `MISSING_SIGNATURE`
- `NONCE_MISMATCH`
- `BAD_SIGNATURE`
- `INVALID_ADDRESS`
- `UNSUPPORTED_CHAIN`
- `HOUSE_NOT_FOUND` (when `houseId` is provided but not owned by the address)

---

## House Ceremony Material (Compatibility Endpoint)

### GET `/api/human/house/material`

OpenClaw Lite prefers “no-server-reveal” flows, so this endpoint intentionally returns no reveal material.
It exists to keep the legacy `/house` viewer compatible.

Response:
```json
{ "ok": true, "houseId": null, "humanReveal": null, "agentReveal": null }
```

---

## Houses (Server Storage)

### GET `/api/house/nonce`

Creates a one-time nonce stored in the session for `POST /api/house/init`.

Response:
```json
{ "ok": true, "nonce": "n_..." }
```

### POST `/api/house/init`

Registers a new house record.

Request:
```json
{
  "houseId": "<base58>",
  "housePubKey": "<must equal houseId>",
  "nonce": "n_...",
  "keyMode": "ceremony",
  "unlock": { "kind": "solana-wallet-signature", "address": "<base58>" },
  "keyWrap": { "alg": "AES-GCM", "iv": "<base64>", "ct": "<base64>" },
  "houseAuthKey": "<base64 K_auth bytes>"
}
```

EVM unlock variant:
```json
{
  "unlock": {
    "kind": "evm-wallet-signature",
    "address": "0x...",
    "nonce": "n_...",
    "signature": "0x..."
  }
}
```

EVM unlock signature message:
```
ElizaTown EVM House Init
address: <address>
houseId: <houseId>
nonce: <nonce>
```

Response:
```json
{ "ok": true, "houseId": "<base58>" }
```

Errors:
- `MISSING_HOUSE_ID`
- `HOUSE_ID_MISMATCH`
- `MISSING_NONCE`
- `NONCE_MISMATCH`
- `MISSING_HOUSE_AUTH`
- `INVALID_HOUSE_AUTH`
- `CEREMONY_ONLY`
- `INVALID_KEY_WRAP`
- `INVALID_UNLOCK`
- `BAD_SIGNATURE`
- `HOUSE_EXISTS`

---

## House Auth (HMAC)

House-scoped endpoints require:
- `x-house-ts`: unix ms timestamp (string)
- `x-house-auth`: base64 HMAC-SHA256 signature

Body hash:
- `bodyHashB64 = base64( sha256( utf8(rawBodyString) ) )`
- For GET requests: raw body is `""`.

Message:
```
<houseId>.<ts>.<METHOD>.<PATH>.<bodyHashB64>
```

Signature:
- `x-house-auth = base64( HMAC_SHA256(K_auth, message) )`

Server rejects:
- missing headers (`HOUSE_AUTH_REQUIRED`)
- skew > 2 minutes (`HOUSE_AUTH_EXPIRED`)
- bad HMAC (`HOUSE_AUTH_INVALID`)

---

## House Log

### GET `/api/house/:id/log`

Response:
```json
{ "ok": true, "entries": [ { "id": "...", "createdAt": "...", "author": "lite", "ciphertext": { "iv": "...", "ct": "..." } } ] }
```

### POST `/api/house/:id/append`

Request:
```json
{
  "author": "lite",
  "ciphertext": { "alg": "AES-GCM", "iv": "<base64>", "ct": "<base64>" }
}
```

Response:
```json
{ "ok": true }
```

Errors:
- `INVALID_CIPHERTEXT`
- `HOUSE_FULL`
- plus House Auth errors

---

## Vault Backups (Encrypted, Server-Opaque)

### POST `/api/house/:id/vault/backup`

Request:
```json
{ "vault": { "v": 1, "alg": "AES-GCM", "kdf": { "houseId": "..." }, "iv": "...", "ct": "..." } }
```

Response:
```json
{ "ok": true, "backupId": "vb_...", "pointer": { "houseId": "...", "latestBackupId": "vb_...", "updatedAt": "..." } }
```

Errors:
- `INVALID_VAULT`
- `HOUSE_ID_MISMATCH`
- `VAULT_TOO_LARGE`
- plus House Auth errors

### GET `/api/house/:id/vault/latest`

Response (no backup):
```json
{ "ok": true, "backupId": null, "vault": null }
```

Response (has backup):
```json
{ "ok": true, "backupId": "vb_...", "vault": { "v": 1, "alg": "AES-GCM", "iv": "...", "ct": "..." } }
```

---

## Public Profiles + Town Grid

Public profiles are sanitized server-side. HTML tags are stripped; control chars are removed.
`displayName`/`tagline` collapse whitespace; `promptMd` preserves newlines.

### POST `/api/house/:id/public-profile`

Request:
```json
{
  "housePublicJson": { "v": 1, "displayName": "Lite House", "tagline": "hello from lite" },
  "promptMd": "Hello from OpenClaw Lite.",
  "previewImage": null,
  "clear": false
}
```

Response:
```json
{ "ok": true, "profile": { "houseId": "...", "updatedAt": "...", "housePublicJson": { "v": 1, "displayName": "House", "tagline": "" }, "promptMd": "", "previewImageUrl": null } }
```

### GET `/api/house/:id/public-profile`

Response:
```json
{ "ok": true, "profile": null }
```

### GET `/api/house/:id/public-profile/preview`

Returns the image bytes (if `previewImage` is set).

### GET `/api/town/grid`

Response:
```json
{ "ok": true, "houses": [ { "houseId": "...", "updatedAt": "...", "housePublicJson": { "v": 1, "displayName": "House", "tagline": "" }, "previewImageUrl": null } ] }
```

---

## Test-Only Endpoints (`NODE_ENV=test`)

These endpoints MUST NOT exist in production.

### GET `/__test__/wallet/seed`

Returns the deterministic Ed25519 seed used by the in-browser local wallet in e2e tests.

Response:
```json
{ "ok": true, "seedHex": "<64 hex chars>", "address": "<base58 pubkey>" }
```

### GET `/__test__/llm/stats`

Response:
```json
{ "ok": true, "chatCompletions": 1, "responses": 0, "lastPath": "/api/llm/openai/v1/chat/completions" }
```

### POST `/__test__/reset`

Resets server state for deterministic Playwright runs.

Required header:
- `x-test-reset: <TEST_RESET_TOKEN>`

Response:
```json
{ "ok": true }
```
