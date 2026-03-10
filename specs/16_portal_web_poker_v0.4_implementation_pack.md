# Portal Web + Poker Implementation Pack v0.4

Status: Revised planning pack  
Date: 2026-03-09  
Scope: Portal-side implementation contract for Registry, Web Experience runtime, and Poker operator integration
Companion TDD spec: [specs/18_portal_web_poker_tdd_spec.md](/Users/robin/Projects/Portal/specs/18_portal_web_poker_tdd_spec.md)

This document supersedes the external v0.3 implementation pack for implementation planning. It narrows scope where the prior draft overreached, preserves the repo's live guardrails, and fills in the missing wire-contract, authority, identity, credential, and persistence details needed for deterministic implementation and Playwright coverage.

## 1. Decided compatibility rules

The following decisions are normative.

1. Atlas remains the chain/district exploration surface.
2. Registry becomes the capability and storefront discovery surface.
3. Atlas is modal-first from the town hub. Standalone `/atlas` and `/atlas.html` are redirect entry points, not first-class full-page UX.
4. Portal Poker pages are modal-first from the town hub. Standalone `/poker*` routes redirect back to the hub with an embedded poker target.
5. The in-browser worker remains authoritative for agent planning, tool selection, and co-op behavior.
6. The server is authoritative only for durable shared state, policy enforcement, persistence, and externally visible API contracts.
7. Town Hall and Town Board keep their current product semantics. Poker is a separate module.
8. Wallet continuity remains the primary human identity anchor. Cookie and Team Code are routing and recovery instruments, not identity replacements.

## 2. Cross-cutting API rules

All new endpoints in this pack use a stable JSON envelope.

Success:

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "requestId": "req_01H...",
    "apiVersion": "2026-03-09"
  }
}
```

Failure:

```json
{
  "ok": false,
  "error": {
    "code": "WEB_UNSUPPORTED_SITE",
    "message": "No supported integration is available for this origin.",
    "retryable": false,
    "details": {}
  },
  "meta": {
    "requestId": "req_01H...",
    "apiVersion": "2026-03-09"
  }
}
```

Rules:

- `error.code` is stable and testable.
- `message` is human-readable but secondary to `code`.
- `retryable` is required on all failures.
- `details` may contain structured context but must not contain secrets.
- New mutable endpoints require an idempotency key, either as `Idempotency-Key` header or request-body `idempotencyKey`.
- List endpoints use cursor pagination with stable ordering.

### 2.1 Shared error taxonomy

Common codes:

- `INVALID_ARGUMENT`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `IDEMPOTENCY_REPLAY`
- `UNSAFE_TARGET`
- `PRIVATE_NETWORK_BLOCKED`
- `INTERNAL_ERROR`
- `UPSTREAM_UNAVAILABLE`

Web-runtime-specific codes:

- `WEB_UNSUPPORTED_SITE`
- `WEB_IMPORT_REQUIRED`
- `WEB_RENDER_MODE_UNAVAILABLE`
- `WEB_APPROVAL_REQUIRED`
- `WEB_APPROVAL_EXPIRED`
- `WEB_CREDENTIAL_REQUIRED`
- `WEB_CREDENTIAL_SCOPE_MISMATCH`
- `WEB_ORIGIN_BLOCKED`
- `WEB_SESSION_STALE`
- `WEB_CHECKPOINT_CONFLICT`

Poker-specific codes:

- `POKER_SEASON_CLOSED`
- `POKER_SUBMISSION_DUPLICATE`
- `POKER_INVALID_BUNDLE`
- `POKER_BATCH_NOT_READY`
- `POKER_REPLAY_NOT_READY`
- `POKER_OPERATOR_AUTH_REQUIRED`
- `POKER_OPERATOR_SCHEMA_MISMATCH`

## 3. Authority and shared-state model

The repo's worker-first rules remain intact.

### 3.1 Authority matrix

| Concern | Authoritative layer | Notes |
|---|---|---|
| Agent planning and next-step selection | Browser worker | No backend shortcutting of decisions |
| Tool execution intent | Browser worker | Worker chooses tool/action; server validates and executes policy |
| Durable web session state | Server | Shared across refresh/recovery |
| Approval tokens and decisions | Server | Browser renders and requests, server stores authoritative decision |
| Evidence ledger persistence | Server | Browser may cache, but server ledger is durable source |
| Evidence freshness evaluation | Shared | Server stores `createdAt` + `freshnessTtlMs`; browser may compute local expired state from those fields |
| Trainer previews and smoke tests | Browser plugin bridged to server data | Must reflect same underlying server state for sessions that opt into `web_experiences` |
| Poker scoring, legality, replay truth | Poker operator | Portal mirrors, never rewrites |

### 3.2 Worker and server coexistence

Rules:

1. `skill-actions-v1` remains the canonical action definition format.
2. The worker extracts and selects actions; the server never invents the next step.
3. A selected action becomes durable only after the server records an invocation or approval row.
4. Trainer namespace tools must read from the same action, approval, invocation, and evidence state that backs `web_experiences`, not a parallel ledger.
5. Existing local-only trainer/evidence facilities remain valid only for non-`web_experiences` sessions. Web Experience sessions must bridge to server-backed rows.

### 3.3 Synchronization contract

For a Web Experience session:

1. Browser opens or resumes the session from `/api/web/sessions/:id`.
2. Browser renders current state and locally caches the latest `revision`.
3. Action invoke or approval decision includes `expectedRevision`.
4. Server rejects stale writes with `CONFLICT` or `WEB_CHECKPOINT_CONFLICT`.
5. Browser checkpoints periodically and on lifecycle boundaries.

## 4. Identity and session continuity

### 4.1 Identity primitives

| Primitive | Meaning | Authority |
|---|---|---|
| Connected wallet(s) | Human identity anchor | Wallet signature plus current session binding |
| `et_session` cookie | Browser session locator | Portal server |
| `teamCode` | Human-agent routing token | Portal server |
| `houseId` | Co-op house identity | House ceremony state |
| `walletRecoveryKey` | Session recovery proof | Portal server plus browser |

### 4.2 Continuity rules

Rules:

1. Wallet continuity is primary. If a valid wallet-bound session can be recovered, it outranks an empty cookie-only session.
2. `et_session` remains the browser locator used by Portal routes.
3. `teamCode` remains stable for the life of a live co-op session unless the session is intentionally rotated.
4. `WebExperienceSession.teamCode` and `houseId` are denormalized routing fields, not independent identity claims.
5. Poker submission ownership binds to the submitting wallet subject and the active Portal session at submit time.
6. A recovered session must restore the same `teamCode`, `houseId`, and wallet subject unless the user intentionally starts over.

### 4.3 Wallet subject format

Portal stores wallet bindings as:

```ts
interface WalletSubject {
  chain: 'evm' | 'solana';
  address: string;
  normalizedAddress: string;
  boundAt: string;
}
```

`WebExperienceSession` persists `walletSubjectsJson` so restart recovery and audit trails can bind actions, approvals, and submissions to the same wallet set.

### 4.4 Recovery behavior

If `et_session` is missing or stale:

1. Portal may recover by wallet headers plus `x-wallet-recovery-key`.
2. `x-team-code-hint` is a tiebreaker only when it matches the recovered wallet-bound session.
3. Recovery must not rotate `teamCode` or `houseId`.
4. Web sessions linked to that Portal session become resumable via `checkpointRef`.

## 5. Atlas, Registry, Poker, and modal-first UI rules

Rules:

1. `/atlas` remains the Atlas render route.
2. Atlas is opened from the town hub modal flow or same-origin iframe path.
3. Standalone `/atlas` requests redirect back to the town hub modal entry route.
4. `agent_town_ui_atlas_search` remains supported and maps only to Atlas filters and view state.
5. Registry discovery uses separate tools:
   - `agent_town_ui_registry_search`
   - `agent_town_state_get_registry_entity`
6. Registry must not replace Atlas district semantics.
7. `/poker`, `/poker/seasons/:seasonId`, `/poker/leaderboards/:seasonId`, `/poker/replays/:runId`, and `/poker/submissions/:submissionId` are render routes only for same-origin modal/embed usage.
8. Standalone `/poker*` requests redirect back to the town hub modal entry route with the requested poker path preserved.
9. Poker links rendered inside the embed surface must preserve `embed=1` so navigation stays inside the modal frame.
10. `agent_town_ui_open_modal({ modal: "poker" })` opens the poker index inside the town-hub modal without changing the top-level page path.

## 6. Web Experience runtime contract

### 6.1 Session model

```ts
interface WebExperienceSession {
  webSessionId: string;              // we_*
  portalSessionId: string;           // current Portal session id
  teamCode: string | null;
  houseId: string | null;
  walletSubjectsJson: WalletSubject[];
  url: string;
  origin: string;
  websiteRegistryId: string | null;
  integrationRegistryId: string | null;
  versionId: string | null;
  renderMode: 'embedded' | 'companion';
  autonomyMode: 'observe' | 'assist' | 'auto';
  runtimeState:
    | 'booting'
    | 'resolving'
    | 'ready'
    | 'drafting'
    | 'approval_pending'
    | 'executing'
    | 'verifying'
    | 'complete'
    | 'error'
    | 'stale';
  pageClass: string | null;
  activeRevision: number;
  checkpointRef: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### 6.2 `POST /api/web/resolve`

Purpose: resolve a URL into a website entity, integration candidate, fallback behavior, and safe render mode.

Request:

```json
{
  "url": "https://github.com/openai/openai-codex/issues/1",
  "preferredMode": "auto",
  "sourceHints": {
    "expectedPageClass": "issue_detail"
  }
}
```

Response for supported site:

```json
{
  "ok": true,
  "data": {
    "resolutionState": "supported",
    "website": {
      "origin": "https://github.com",
      "canonicalUrl": "https://github.com/openai/openai-codex/issues/1",
      "registryId": "ws_01",
      "displayName": "GitHub",
      "trustTier": "A",
      "domainProofState": "verified"
    },
    "integration": {
      "integrationRegistryId": "wi_01",
      "versionId": "rv_01",
      "sourceType": "native_pack",
      "authModel": "oauth",
      "renderMode": "companion",
      "pageClass": "issue_detail"
    },
    "alternatives": [],
    "fallback": null
  },
  "meta": {
    "requestId": "req_01",
    "apiVersion": "2026-03-09"
  }
}
```

Response for unsupported site:

```json
{
  "ok": true,
  "data": {
    "resolutionState": "unsupported",
    "website": {
      "origin": "https://example.invalid",
      "canonicalUrl": "https://example.invalid/"
    },
    "integration": null,
    "alternatives": [],
    "fallback": {
      "reasonCode": "WEB_UNSUPPORTED_SITE",
      "importAllowed": true,
      "suggestedImportKinds": ["site_origin", "openapi_url"],
      "automationFallbackAllowed": false
    }
  },
  "meta": {
    "requestId": "req_02",
    "apiVersion": "2026-03-09"
  }
}
```

Failure cases:

- `INVALID_ARGUMENT` for malformed URL
- `UNSAFE_TARGET` for loopback or blocked network targets
- `RATE_LIMITED`

### 6.3 `POST /api/web/import`

Auth:

- human Portal session required
- wallet-bound recovery allowed
- per-session and per-IP rate limits required

Request:

```json
{
  "url": "https://example.com",
  "requestKind": "site_origin",
  "parseFallbackAllowed": true,
  "sourceHints": {
    "expectedObjectKind": "website",
    "parentWebsiteOrigin": "https://example.com"
  },
  "idempotencyKey": "imp_01H..."
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "importJobId": "rj_01",
    "status": "queued",
    "requestKind": "site_origin"
  },
  "meta": {
    "requestId": "req_03",
    "apiVersion": "2026-03-09"
  }
}
```

Required behavior:

- duplicate idempotency key returns the same `importJobId`
- unsafe targets fail closed with `UNSAFE_TARGET` or `PRIVATE_NETWORK_BLOCKED`
- queued jobs must be auditable with actor session, wallet subject, source URL, and result

### 6.4 `POST /api/web/sessions`

Auth:

- human Portal session required
- resulting web session is bound to current `portalSessionId`, `teamCode`, `houseId`, and `walletSubjectsJson`

Request:

```json
{
  "url": "https://github.com/openai/openai-codex/issues/1",
  "integrationRegistryId": "wi_01",
  "versionId": "rv_01",
  "renderMode": "auto",
  "autonomyMode": "assist"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "session": {
      "webSessionId": "we_01",
      "teamCode": "TEAM-ABCD-EFGH",
      "houseId": "house_01",
      "renderMode": "companion",
      "autonomyMode": "assist",
      "runtimeState": "ready",
      "activeRevision": 1
    },
    "activeIntegration": {
      "integrationRegistryId": "wi_01",
      "versionId": "rv_01"
    },
    "policy": {
      "sameOriginOnlyDefault": true,
      "allowExternalCredentials": false
    }
  }
}
```

### 6.5 `GET /api/web/sessions/:id`

Response fields:

- `session`
- `activeIntegration`
- `approvalQueue`
- `lastCheckpoint`
- `runtimeSnapshot`
- `credentialStatusByOrigin`

### 6.6 `POST /api/web/sessions/:id/checkpoint`

Request:

```json
{
  "expectedRevision": 4,
  "idempotencyKey": "ckp_01H...",
  "checkpoint": {
    "pageClass": "issue_detail",
    "draftBuffers": {
      "replyBody": "Draft body"
    },
    "approvalQueueState": {
      "pendingApprovalIds": ["apr_01"]
    },
    "evidenceCursor": "ev_50",
    "agentDockState": {
      "selectedTaskFlowId": "draft_comment"
    },
    "renderMode": "companion",
    "companionWindow": {
      "tabId": "tab_12",
      "lastKnownUrl": "https://github.com/openai/openai-codex/issues/1"
    }
  }
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "checkpointRef": "wcp_01",
    "writtenRevision": 5,
    "writtenAt": "2026-03-09T12:00:00.000Z"
  }
}
```

### 6.7 `POST /api/web/sessions/:id/actions/:actionId/invoke`

Request:

```json
{
  "expectedRevision": 5,
  "params": {
    "threadId": "123",
    "draft": "Hello world"
  },
  "idempotencyKey": "act_01H...",
  "dryRun": false,
  "approvalId": "apr_01",
  "credentialGrantId": "wcg_01"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "invocation": {
      "invocationId": "act_01",
      "actionId": "submit_reply",
      "status": "success",
      "verificationStatus": "pending",
      "durationMs": 842,
      "usedApprovalId": "apr_01",
      "usedCredentialGrantId": "wcg_01"
    },
    "evidence": [
      {
        "evidenceId": "ev_01",
        "category": "tool_invoked",
        "status": "success",
        "freshnessTtlMs": 300000
      }
    ]
  }
}
```

Possible deterministic failures:

- `WEB_APPROVAL_REQUIRED`
- `WEB_APPROVAL_EXPIRED`
- `WEB_CREDENTIAL_REQUIRED`
- `WEB_CREDENTIAL_SCOPE_MISMATCH`
- `WEB_ORIGIN_BLOCKED`
- `IDEMPOTENCY_REPLAY`

### 6.8 `POST /api/web/approvals/:approvalId/decision`

Request:

```json
{
  "decision": "approved",
  "reason": "Human confirmed publication target",
  "expectedRevision": 6,
  "idempotencyKey": "aprdec_01H..."
}
```

Rules:

- only the human side of the bound Portal session may decide
- expired approvals return `WEB_APPROVAL_EXPIRED`
- successful decision emits an evidence row

### 6.9 `GET /api/web/sessions/:id/evidence`

Query:

- `limit` default `50`, max `200`
- `cursor`
- `freshOnly=true|false`

Response:

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "evidenceId": "ev_01",
        "invocationId": "act_01",
        "category": "tool_invoked",
        "status": "success",
        "createdAt": "2026-03-09T12:00:00.000Z",
        "freshnessTtlMs": 300000,
        "expiresAt": "2026-03-09T12:05:00.000Z"
      }
    ],
    "nextCursor": null
  }
}
```

## 7. External credential model

This section replaces the prior hand-wavy credential text.

### 7.1 Core rules

1. Raw third-party access tokens, refresh tokens, cookies, and signed session material are never exposed to the model or worker.
2. Credentials are stored server-side in an encrypted origin-scoped vault.
3. A credential grant is bound to exactly one origin, one Portal session, and one scope set.
4. Cross-origin reuse is forbidden.
5. Each write-capable action declares the scopes it needs.

### 7.2 Data model

```ts
interface OriginCredentialGrant {
  credentialGrantId: string;         // wcg_*
  portalSessionId: string;
  webSessionId: string | null;
  origin: string;
  authClass: 'oauth' | 'cookie' | 'manual_header';
  scopesJson: string[];
  status: 'pending' | 'active' | 'expired' | 'revoked';
  redactedLabel: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### 7.3 Credential acquisition flow

1. An action invoke without a valid grant returns `WEB_CREDENTIAL_REQUIRED`.
2. Browser requests a grant start:

```json
POST /api/web/credentials/start
{
  "webSessionId": "we_01",
  "origin": "https://github.com",
  "authClass": "oauth",
  "scopes": ["repo:issue:write"]
}
```

3. Server returns a same-origin broker session:

```json
{
  "ok": true,
  "data": {
    "brokerSessionId": "wcb_01",
    "approvalId": "apr_02",
    "authUrl": "/auth-broker/github/start?brokerSessionId=wcb_01"
  }
}
```

4. Human completes the broker flow in a same-origin popup or companion window.
5. Server stores encrypted credential material and activates `credentialGrantId`.
6. Future invokes reference only `credentialGrantId`.

### 7.4 Companion mode rule

Companion mode may use the user's live browser session for visual continuity, but action execution still runs through explicit integrations and server policy. The model never receives a DOM handle or raw cookie jar.

## 8. Persistence minimum

SQLite remains acceptable for Phase 0 and Phase 1 if the following are enforced on every connection:

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
```

### 8.1 Required durable tables

```sql
CREATE TABLE web_sessions (
  web_session_id TEXT PRIMARY KEY,
  portal_session_id TEXT NOT NULL,
  team_code TEXT,
  house_id TEXT,
  wallet_subjects_json TEXT NOT NULL,
  url TEXT NOT NULL,
  origin TEXT NOT NULL,
  website_registry_id TEXT,
  integration_registry_id TEXT,
  version_id TEXT,
  render_mode TEXT NOT NULL,
  autonomy_mode TEXT NOT NULL,
  runtime_state TEXT NOT NULL,
  page_class TEXT,
  active_revision INTEGER NOT NULL DEFAULT 1,
  checkpoint_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE web_approval_requests (
  approval_id TEXT PRIMARY KEY,
  web_session_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  status TEXT NOT NULL,
  reason TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  decision_by TEXT,
  decision_reason TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (web_session_id) REFERENCES web_sessions(web_session_id)
);

CREATE TABLE web_action_invocations (
  invocation_id TEXT PRIMARY KEY,
  web_session_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  approval_id TEXT,
  credential_grant_id TEXT,
  status TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  request_json TEXT NOT NULL,
  response_json TEXT,
  error_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (web_session_id, idempotency_key),
  FOREIGN KEY (web_session_id) REFERENCES web_sessions(web_session_id),
  FOREIGN KEY (approval_id) REFERENCES web_approval_requests(approval_id)
);

CREATE TABLE web_evidence_items (
  evidence_id TEXT PRIMARY KEY,
  web_session_id TEXT NOT NULL,
  invocation_id TEXT,
  category TEXT NOT NULL,
  actor TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  target_url TEXT,
  page_class TEXT,
  artifact_refs_json TEXT NOT NULL,
  freshness_ttl_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (web_session_id) REFERENCES web_sessions(web_session_id),
  FOREIGN KEY (invocation_id) REFERENCES web_action_invocations(invocation_id)
);

CREATE TABLE web_checkpoints (
  checkpoint_ref TEXT PRIMARY KEY,
  web_session_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (web_session_id) REFERENCES web_sessions(web_session_id)
);

CREATE TABLE origin_credential_grants (
  credential_grant_id TEXT PRIMARY KEY,
  portal_session_id TEXT NOT NULL,
  web_session_id TEXT,
  origin TEXT NOT NULL,
  auth_class TEXT NOT NULL,
  scopes_json TEXT NOT NULL,
  status TEXT NOT NULL,
  redacted_label TEXT,
  encrypted_secret_ref TEXT NOT NULL,
  issued_at TEXT,
  expires_at TEXT,
  last_used_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 8.2 Required indexes

```sql
CREATE INDEX web_sessions_origin_updated_idx
  ON web_sessions(origin, updated_at DESC);

CREATE INDEX web_sessions_team_code_idx
  ON web_sessions(team_code);

CREATE INDEX web_approvals_session_status_idx
  ON web_approval_requests(web_session_id, status, created_at DESC);

CREATE INDEX web_invocations_session_action_idx
  ON web_action_invocations(web_session_id, action_id, created_at DESC);

CREATE INDEX web_evidence_session_created_idx
  ON web_evidence_items(web_session_id, created_at DESC);

CREATE INDEX credential_grants_origin_status_idx
  ON origin_credential_grants(origin, status, updated_at DESC);
```

### 8.3 Poker persistence minimum

Portal must persist the following as durable tables, not just TS interfaces:

- `poker_seasons`
- `poker_divisions`
- `poker_setup_submissions`
- `poker_batches`
- `poker_runs`
- `poker_replay_artifacts`
- `poker_leaderboard_snapshots`

Minimum indexes:

- seasons by `season_slug`
- submissions by `season_id, submitter_wallet, created_at`
- runs by `batch_id, created_at`
- leaderboard snapshots by `season_id, created_at`

## 9. Poker operator contract

The operator contract below is the stable Portal-facing version.

### 9.1 Auth model

Public read endpoints:

- `GET /v1/health`
- `GET /v1/seasons`
- `GET /v1/seasons/:seasonId`
- `GET /v1/batches/:batchId`
- `GET /v1/runs/:runId`
- `GET /v1/runs/:runId/replay`
- `GET /v1/leaderboards/:seasonId/latest`
- `GET /v1/leaderboards/:seasonId/snapshots/:snapshotId`

Protected mutation endpoints:

- `POST /v1/seasons`
- `POST /v1/seasons/:seasonId/submissions`
- `POST /v1/seasons/:seasonId/batches`

Protected mutation requirements:

- `Authorization: Bearer <operator-or-portal-service-token>`
- `Idempotency-Key: <ulid-or-uuid>`
- actor identity recorded in audit log

### 9.2 Pagination

`GET /v1/seasons` supports:

- `cursor`
- `limit` default `20`, max `100`
- `status`

Response includes:

```json
{
  "ok": true,
  "data": {
    "items": [],
    "nextCursor": null
  },
  "meta": {
    "requestId": "req_11",
    "apiVersion": "2026-03-09"
  }
}
```

### 9.3 `GET /v1/health`

Response:

```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "operatorVersion": "0.9.0",
    "schemaVersion": "2026-03-09",
    "time": "2026-03-09T12:00:00.000Z"
  }
}
```

### 9.4 `GET /v1/seasons/:seasonId`

Returns:

- season metadata
- rules summary
- divisions
- submission window state
- latest leaderboard snapshot metadata
- latest replay highlight metadata

### 9.5 `POST /v1/seasons`

Request:

```json
{
  "seasonSlug": "spring-2026",
  "displayName": "Spring 2026",
  "rulesVersion": "poker-rules-v3",
  "operatorVersion": "0.9.0",
  "submissionOpenAt": "2026-04-01T00:00:00.000Z",
  "submissionCloseAt": "2026-04-15T00:00:00.000Z",
  "divisions": [
    { "divisionSlug": "standard", "runnerKind": "native" }
  ]
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "seasonId": "pks_01",
    "status": "created"
  }
}
```

### 9.6 `POST /v1/seasons/:seasonId/submissions`

Request:

```json
{
  "portalSubmissionId": "pksub_01",
  "submitterWallet": {
    "chain": "evm",
    "address": "0x1234"
  },
  "bundle": {
    "contentAddress": "sha256:abcd...",
    "manifestHash": "sha256:efgh...",
    "artifactUri": "s3://operator/submissions/pksub_01.zip",
    "entrypoint": "play.py"
  },
  "declaredCapabilities": {
    "browserCompatible": false
  }
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "submissionId": "pksub_01",
    "status": "accepted",
    "validation": {
      "status": "pending"
    }
  }
}
```

Possible stable failures:

- `POKER_SEASON_CLOSED`
- `POKER_SUBMISSION_DUPLICATE`
- `POKER_INVALID_BUNDLE`
- `IDEMPOTENCY_REPLAY`

### 9.7 `POST /v1/seasons/:seasonId/batches`

Request:

```json
{
  "batchKind": "season_eval",
  "submissionIds": ["pksub_01", "pksub_02"],
  "batchConfig": {
    "seedSetVersion": "seed-v4",
    "gamesPerPairing": 40
  }
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "batchId": "pkb_01",
    "status": "queued"
  }
}
```

### 9.8 `GET /v1/runs/:runId/replay`

Response:

```json
{
  "ok": true,
  "data": {
    "runId": "pkr_01",
    "replay": {
      "replayFormat": "poker-run-replay-v1",
      "summaryJson": {
        "winnerSeat": 2,
        "turns": 184,
        "seed": "seed-v4-008"
      },
      "eventsJsonlUri": "s3://operator/replays/pkr_01/events.jsonl",
      "artifactSha256": "sha256:1234...",
      "contentType": "application/x-ndjson"
    }
  }
}
```

Replay format rules:

- events are newline-delimited JSON
- each record includes `seq`, `timestamp`, `actorSeat`, `eventType`, `payload`
- format version is pinned by `replayFormat`

### 9.9 `GET /v1/leaderboards/:seasonId/latest`

Returns latest snapshot metadata plus rankings array.

Rank entry minimum:

```json
{
  "submissionId": "pksub_01",
  "displayName": "PortalBot",
  "rank": 1,
  "rating": 42.8,
  "games": 320,
  "wins": 188
}
```

## 10. Import, admin, and abuse controls

### 10.1 Required auth and quotas

| Endpoint | Auth | Idempotency | Quotas | Audit |
|---|---|---|---|---|
| `POST /api/registry/import` | human Portal session | required | per-IP and per-session | required |
| `POST /api/web/import` | human Portal session | required | per-IP and per-session | required |
| `POST /api/web/sessions` | human Portal session | not required | per-session | optional |
| `POST /api/web/sessions/:id/checkpoint` | owning Portal session | required | per-session | optional |
| `POST /api/web/sessions/:id/actions/:actionId/invoke` | owning Portal session | required | per-session and per-action budget | required |
| `POST /api/web/approvals/:approvalId/decision` | owning Portal session human side | required | per-session | required |
| `POST /v1/seasons` | operator service token | required | service quota | required |
| `POST /v1/seasons/:seasonId/submissions` | portal service token | required | per-wallet and per-season | required |
| `POST /v1/seasons/:seasonId/batches` | operator service token | required | service quota | required |

### 10.2 Unsafe fetch policy

Remote fetch and import endpoints must reject:

- loopback hosts
- RFC1918 private ranges
- link-local targets
- file URLs
- non-HTTP(S) schemes unless explicitly supported

## 11. Implementation readiness checklist

This pack is implementation-ready only if the following remain true during rollout:

1. Every new route has a concrete request/response/error contract.
2. Worker-first authority remains intact.
3. Atlas modal-first behavior is explicitly preserved.
4. Web session identity binds to wallet continuity, cookie recovery, Team Code, and house state.
5. External credentials use origin-scoped opaque grants, never raw secret exposure.
6. Durable tables exist for web sessions, invocations, evidence, checkpoints, credentials, and poker mirrors.
7. Backlog tickets explicitly carry required doc-sync and deterministic test obligations.
