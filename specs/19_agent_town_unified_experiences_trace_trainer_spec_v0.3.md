# Agent Town v0.3 - Unified House, Experiences, Web Portals, Poker Arena, and Trace + Trainer Spec

**Status:** implementation revision
**Date:** 2026-03-09
**Audience:** product, frontend, runtime, infra, AI-agent, security, blockchain, QA, and AI coding agents
**Document type:** implementation-facing source of truth
**Supersedes:** `/Users/robin/Downloads/agent-town-unified-experiences-trace-trainer-spec-v0.2.md`

---

## 0. What this document does

This document keeps the core ambition of v0.2 and fixes the parts that were not precise enough to ship safely:

- House remains the long-term root object.
- Experiences remain first-class and plural.
- Web Experiences, Poker, and Werewolf still share one trace and trainer substrate.
- Human + agent co-op remains the product posture.
- Self-hosted-first and portability remain mandatory.

This revision adds the missing implementation detail needed to make that vision buildable in the current Portal codebase:

- explicit namespace ownership,
- explicit identity and auth rules,
- explicit API envelopes and job semantics,
- explicit trace authority and sequencing rules,
- explicit config pinning rules,
- explicit migration from current Portal storage/runtime behavior,
- and deterministic release gates.

This document is normative for new platform work.
Current MVP routes and flows under `specs/02_api_contract.md` remain normative until a matching `/v1/*` contract is implemented and tested.

---

## 0.1 Normative corrections from v0.2

1. `trainer.*` is reserved for agent-facing worker tools.
2. Durable trainer job kinds move to `trainer_job.*`.
3. Canonical trace immutability applies to archived traces and artifacts, not to disposable local caches.
4. One trace authority per run assigns canonical order and integrity fields.
5. Audience and seal are separate concepts; `SEALED` is no longer a peer visibility class.
6. Every published config must resolve to immutable component versions and content hashes.
7. External `skill.md` files remain stable public manuals; internal packs are compiled from them before execution.
8. `/v1/*` routes now define auth, error envelopes, idempotency, pagination, and job states.
9. Web execution remains worker-first. The server stores intents, approvals, artifacts, and brokered execution records. The server does not make agent decisions.
10. The current Portal remains minimal and modal-first during migration. Direct standalone experience pages should redirect back into modal entry paths when a modal flow exists.

---

## 1. Executive summary

Agent Town is a human + agent improvement system built from four durable layers:

1. House and team identity
2. experiences and integrations
3. canonical traces and sealed contexts
4. trainer jobs and versioned configs

The first connected cycle is:

```text
House/team enters an experience
-> one authority writes the canonical run trace
-> traces are archived and indexed
-> trainer_job.* jobs analyze them
-> results propose config or pack changes
-> the human reviews and approves
-> a new immutable config version is promoted
-> the improved team re-enters an experience
```

This document intentionally separates three things that v0.2 blurred together:

- agent-facing trainer tools (`trainer.*`)
- durable trainer jobs (`trainer_job.*`)
- raw trace intake vs canonical trace events

That separation is required to preserve the current Portal runtime while adding a future platform behind it.

---

## 2. Goals and non-goals

## 2.1 Goals

This version must:

1. preserve the current minimal Portal UX while defining the larger platform safely,
2. define one canonical trace model across web and arena experiences,
3. define one durable trainer job model across experiences,
4. preserve wallet-first continuity and current Team Code co-op,
5. define exact auth for every new platform surface,
6. define immutable, replayable config versions,
7. define a migration path from current Portal storage to the target storage model,
8. preserve `public/skill.md` compatibility,
9. keep worker-first execution intact,
10. define deterministic acceptance criteria that can be automated.

## 2.2 Non-goals

This version does not require:

- a token economy,
- unrestricted browser automation by default,
- backend shortcuts for agent behavior,
- final end-state House UI in one release,
- or replacement of the current Portal MVP before the new platform contracts are ready.

---

## 3. Compatibility commitments with the current Portal

The current repo is a minimal Agent Town landing page with deterministic Playwright coverage and strict worker-first rules.
This revised spec must preserve that.

### 3.1 Current surfaces that remain authoritative now

- `public/skill.md` remains the stable external-agent playbook.
- `specs/02_api_contract.md` remains authoritative for existing `/api/*` routes.
- `trainer.*` remains the current worker tool namespace inside the trainer/runtime.
- the town hub remains modal-first for Atlas and should become modal-first for Trainer as well.

### 3.2 Compatibility rules

1. No new spec may silently repurpose an existing public namespace already used by the runtime.
2. No new platform feature may require breaking `public/skill.md` without an explicit compatibility shim and tests.
3. No new experience surface should force full-page navigation if a modal/frame flow can preserve runtime continuity.
4. Current browser-local trainer state is treated as cache or local working state until explicitly imported into the canonical archive.

---

## 4. Product scope and IA

## 4.1 Product posture

There are two legitimate truths at once:

- **Current Portal truth:** a minimal town-hub/onboarding product with modal district experiences.
- **Platform truth:** a House-centric system that will later expose Trainer, Workshop, Archive, Inbox, and Tracks as first-class surfaces.

This spec must bridge them instead of pretending the platform already shipped.

## 4.2 IA rule

House is the long-term root user-facing object.
The current town hub is the short-term entry shell.

### Phase 0 Portal shell

- town hub,
- modal district experiences,
- onboarding,
- current trainer modal.

### Phase 1+ House shell

- Team,
- Experiences,
- Trainer,
- Workshop,
- Archive,
- Inbox,
- Tracks.

### Rule

Phase 1+ House UI must be reachable from the current shell without breaking the current modal/runtime continuity rules.

## 4.3 Modal-first continuity

The following are normative:

1. Atlas must remain modal-first.
2. Trainer must become modal-first from the town hub.
3. Direct `/atlas` and `/trainer` hits should redirect back into the hub modal entry path when modal continuity is available.
4. If a standalone page exists temporarily for bootstrap or recovery, it must be treated as a compatibility path, not the primary UX.

Recommended deep links:

- `/atlas` -> `/?district=atlas`
- `/trainer` -> `/app?modal=trainer`

---

## 5. Core object model

## 5.1 Object table

| Object | Purpose | Mutable? | Notes |
| --- | --- | --- | --- |
| House | primary workspace and private shard | yes | durable owner of teams, configs, traces, integrations |
| Team | active human + agent operating unit | yes | may change over time via new config versions |
| Experience | a runnable domain such as web.portal, arena.poker, arena.werewolf | yes | experience definition is versioned separately from runs |
| Experience Pack | compiled internal execution pack for one experience | immutable once published | may be derived from public manuals |
| Integration Pack | compiled internal pack for one website/integration | immutable once published | may come from native pack, API, MCP, or Parse |
| Run | one execution instance of an experience or trainer job | mutable while active | becomes read-only at completion except status annotations |
| Trace Intake Record | raw event or artifact submitted to the authority | immutable | not yet canonical order |
| Canonical Trace | authoritative append-only event record for one run | immutable after completion | written by one authority only |
| Trainer Job | durable analysis or synthesis job | mutable while active | job kinds are `trainer_job.*` |
| Trainer Result | durable artifact emitted by a trainer job | immutable | may recommend patches |
| Config Version | immutable published team build | immutable after publish | resolved to immutable component versions |
| Sealed Context | fairness boundary for protected runs | mutable while live | release state changes over time |
| Track | future progression surface | mutable | non-normative for MVP behavior |

## 5.2 Namespace ownership

The following namespace ownership is normative:

- `trainer.*` = agent-facing runtime tools only
- `trainer_job.*` = durable trainer job kinds only
- `skill_action.*` = compiled skill/integration actions callable by runtime policy
- event types such as `trainer.job.started` are trace event families, not tool IDs and not job kinds

This separation exists to avoid semantic collisions between current Portal runtime tools and future platform jobs.

## 5.3 Current Trainer compatibility object

The current Portal trainer remains a valid product surface, but it is scoped as:

- a local or cache-backed experience trainer for current quest/runtime diagnostics,
- a human-operable modal,
- an agent-observable tool surface via `trainer.*`,
- not yet the full durable House-wide trainer platform.

The future durable trainer platform must integrate with it without redefining the current meaning of `trainer.*`.

---

## 6. Experience packs and external skill compatibility

## 6.1 Two layers

This spec distinguishes:

1. **external manuals**
2. **internal executable packs**

### External manuals

Examples:

- `public/skill.md`
- site-published `skill.md`
- `SKILL.md`

External manuals are readable contracts for humans and agents.
They are not directly trusted as executable authority in the platform model.

### Internal executable packs

Internal packs are compiled, validated, hashed assets the runtime may execute.

## 6.2 Public compatibility rule

`public/skill.md` remains the stable external contract for the current Portal product.

That means:

1. Its URL stays stable.
2. Its current contract line remains test-locked.
3. Changes still require `public/skill.md`, `e2e/55_phase3_skill_contract_line.spec.js`, and `docs/internal-skill-testline.md` updates.

## 6.3 Pack compiler rule

The runtime may auto-import a same-origin default skill only by compiling it into an internal pack first.

For the current Portal, the compiler must be able to derive an internal pack from `public/skill.md` and well-known defaults:

- `heartbeat.md` may be synthesized from runtime policy defaults if not authored explicitly,
- `tools.md` may be synthesized from the validated tool registry if not authored explicitly,
- `trace_map.json` must be authored or generated before the experience is considered trainer-compatible.

If required data cannot be derived safely, compilation must fail closed.

## 6.4 Required internal pack files

Every published internal pack must include:

- `manifest.json`
- `manual/skill.md`
- `heartbeat.md`
- `tools.md`
- `trace_map.json`

Recommended:

- `trainer.md`
- `security.md`
- `goals.md`
- `penalty.md`

## 6.5 Manifest requirements

Every internal pack manifest must include:

```json
{
  "packId": "pack_portal_onboarding_v1",
  "packVersionId": "packv_01H...",
  "displayName": "Portal Onboarding",
  "sourceKind": "public_manual|native_pack|native_api|mcp|parse",
  "sourceRefs": [
    {
      "path": "/skill.md",
      "hash": "sha256:..."
    }
  ],
  "contentHash": "sha256:...",
  "fileHashes": {
    "manual/skill.md": "sha256:...",
    "heartbeat.md": "sha256:...",
    "tools.md": "sha256:...",
    "trace_map.json": "sha256:..."
  },
  "compatibility": {
    "experienceKind": "web.portal",
    "minClientVersion": "0.1.0"
  }
}
```

## 6.6 Execution trust rule

Execution trust comes from the compiled internal pack, not raw remote text.
The current stable public skill surface is preserved by compiling from it, not by bypassing it.

---

## 7. Web Experiences and worker-first execution

## 7.1 Capability source order

When opening a website, resolve capabilities in this order:

1. native Agent Town-compatible pack
2. native API/OpenAPI/MCP surface
3. Parse-generated metadata compiled into an internal pack
4. browser automation fallback only if explicitly allowed

## 7.2 Worker-first execution rule

The browser worker remains authoritative for:

- deciding what to do next,
- deciding whether to request approval,
- selecting tools or actions from the internal pack,
- and deciding how to respond to observed results.

The server may:

- resolve integrations,
- compile packs,
- create execution records,
- enforce auth and approval policies,
- persist artifacts and traces,
- and broker approved execution requests to permitted services.

The server may not:

- invent the agent's next action,
- claim an action succeeded without a real result,
- or bypass worker/runtime tool policy.

## 7.3 Execution record model

To avoid ambiguity, the platform uses execution records instead of an underspecified `execute` shortcut.

### Route

`POST /v1/integrations/:integrationId/executions`

### Meaning

Create one execution request or brokered execution record for a worker-selected action.

### It does not mean

- "the backend decides what to do"
- or "the backend is now the agent runtime"

## 7.4 Execution record schema

```json
{
  "executionId": "exec_01H...",
  "integrationId": "itg_example_v1",
  "runId": "run_01H...",
  "requestedBy": {
    "actorType": "worker|human|service",
    "actorId": "worker_main"
  },
  "actionId": "web.example.add_to_watchlist",
  "request": {
    "params": {},
    "approvalId": null
  },
  "status": "queued|running|succeeded|failed|blocked",
  "resultArtifactIds": [],
  "traceEventRefs": [],
  "idempotencyKey": "..."
}
```

## 7.5 Approval rule

All high-impact writes require explicit approval by default.
Execution records for write actions without approval must fail with `APPROVAL_REQUIRED`.

---

## 8. Competitive arenas and sealed contexts

## 8.1 Fairness principle

Actor-neutral participation, entrant-specific live isolation, effect-based enforcement.

Humans, agents, and hybrid teams may all participate where the experience allows.
What matters is whether protected context leaks, not whether the actor is "AI" or "human".

## 8.2 Audience model

Audience is two-layered:

1. base audience
2. optional seal overlay

### Base audience

```json
{
  "class": "PUBLIC|HOUSE|TEAM|ENTRANT|PRIVATE",
  "houseId": "house_abc",
  "teamId": "team_main",
  "entrantId": "entrant_03",
  "readerIds": []
}
```

### Seal overlay

```json
{
  "active": true,
  "sealedContextId": "seal_01H...",
  "releasePolicy": "post_match|post_season|manual|never"
}
```

`SEALED` is not a peer audience class.
It is an overlay that further restricts access to the base audience.

## 8.3 Sealed context object

```json
{
  "sealedContextId": "seal_01H...",
  "scopeType": "entrant|seat|role|team_play|website_session",
  "scopeKey": "entrant_team_main_seat3",
  "entrantId": "entrant_team_main_seat3",
  "experienceId": "arena.poker.season0",
  "runId": "run_01H...",
  "status": "active|released|expired|revoked",
  "releasePolicy": "post_match|post_season|manual|never",
  "allowedReaders": [
    { "actorId": "agent_player_1", "capability": "read_write" },
    { "actorId": "user_owner", "capability": "read_only" }
  ],
  "forbiddenSources": [
    "other_entrant_private",
    "shared_live_service_memory",
    "undelayed_opponent_private_trace"
  ]
}
```

## 8.4 Shared-service rule

During a protected live window, a shared service agent must either:

1. operate with storage and memory partitioned by `sealedContextId`, or
2. be blocked from reading entrant-private live data.

## 8.5 Live-window phases

- `pre_lock`
- `locked_pre_match`
- `live_match`
- `post_match_review`

The strictest restrictions apply during `live_match`.

---

## 9. Canonical trace system

## 9.1 Principles

Canonical traces must be:

- append-only,
- replayable,
- visibility-aware,
- authority-written,
- content-addressed at the artifact layer,
- and queryable enough for trainer jobs.

## 9.2 Raw intake vs canonical events

Raw producers do not write canonical trace events directly.

Raw producers may include:

- browser worker runtime,
- website integration broker,
- arena operator,
- approval service,
- replay generator,
- trainer ingestion pipeline.

They submit **trace intake records**.

Exactly one **trace authority** per run turns intake records into canonical events.

## 9.3 Trace authority

Every run must declare one authority:

```json
{
  "traceAuthorityType": "house_trace_ingester|poker_operator|arena_adapter|service_authority",
  "traceAuthorityRef": "svc_trace_ingester_main"
}
```

Authority responsibilities:

1. validate intake records,
2. dedupe by `ingestKey`,
3. assign canonical `seq`,
4. compute `prevEventHash` and `eventHash`,
5. reject or quarantine late/invalid records,
6. publish canonical trace completion.

## 9.4 Intake record

```json
{
  "intakeId": "intk_01H...",
  "runId": "run_01H...",
  "sourceType": "worker|operator|approval|service|artifact_import",
  "sourceRef": "worker_main",
  "sourceSeq": 42,
  "ingestKey": "worker_main:42",
  "observedAt": "2026-03-09T10:00:00.000Z",
  "payloadSchema": "raw.web.observation/v1",
  "payload": {},
  "artifactRefs": []
}
```

## 9.5 Dedupe and late-arrival policy

The authority must implement the following rules:

1. If `ingestKey` already exists for the run, the intake is ignored as duplicate.
2. If the run is open and the intake validates, the authority may emit a canonical event.
3. If the run is completed and the intake would change historical facts, reject it with `TRACE_LATE_EVENT_REJECTED`.
4. If the run is completed and the intake is a legitimate post-run annotation, attach it as a new post-run canonical event or artifact without mutating prior events.
5. The ingestion response must include accepted, ignored, and rejected counts.

## 9.6 Canonical trace event envelope

```json
{
  "traceEventId": "01HRZ9N6V0YH6QH7P4PZ6N2A1K",
  "traceId": "trace_01HR...",
  "runId": "run_01HR...",
  "houseId": "house_abc",
  "teamId": "team_main",
  "experienceId": "arena.poker.season0",
  "experienceKind": "arena.poker",
  "phase": "pre_match|live|post_match|review|build",
  "seq": 128,
  "at": "2026-03-06T10:00:00.000Z",
  "authority": {
    "type": "poker_operator",
    "ref": "svc_poker_operator"
  },
  "actor": {
    "actorType": "human|agent|system|engine|tool|trainer|service_agent",
    "actorId": "agent_analyst_1",
    "role": "analyst"
  },
  "audience": {
    "class": "ENTRANT",
    "houseId": "house_abc",
    "teamId": "team_main",
    "entrantId": "entrant_team_main_seat3",
    "readerIds": []
  },
  "seal": {
    "active": true,
    "sealedContextId": "seal_01HR...",
    "releasePolicy": "post_match"
  },
  "type": "poker.decision.submitted",
  "payloadSchema": "et.trace.poker.decision.submitted/v1",
  "payload": {},
  "causal": {
    "parentEventId": "01HR...",
    "rootEventId": "01HR...",
    "correlationId": "corr_123",
    "causedByApprovalId": null,
    "causedByToolCallId": null
  },
  "artifacts": [
    {
      "artifactId": "art_01HR...",
      "kind": "observation_blob",
      "hash": "sha256:...",
      "uri": "cas://sha256/...",
      "sealed": true
    }
  ],
  "integrity": {
    "runFingerprint": "sha256:...",
    "prevEventHash": "sha256:...",
    "eventHash": "sha256:..."
  },
  "version": "trace-envelope/v2"
}
```

## 9.7 Immutability and deletion rule

Once a run is complete:

1. the canonical trace is immutable,
2. canonical artifacts referenced by that trace are immutable,
3. corrections are appended as new events or artifacts,
4. canonical traces are not removed by normal end-user delete actions.

Local caches may still be cleared.

Examples of allowed cache deletion:

- clearing browser IndexedDB copies,
- deleting local replay cache,
- deleting local trainer attempt bundles.

Those actions must not be described as deleting the canonical archive.

## 9.8 Storage rule

The durable stored form of a completed canonical trace is:

- append-only JSONL event file or event stream export,
- relational metadata index,
- content-addressed artifacts.

---

## 10. Trainer platform

## 10.1 Surface split

There are two trainer surfaces:

### A. Runtime trainer tools

- namespace: `trainer.*`
- audience: agent runtime and current trainer modal
- examples: `trainer.list_runs`, `trainer.get_run`, `trainer.invoke_action`

### B. Durable trainer jobs

- namespace: `trainer_job.*`
- audience: platform job system and archive/trainer UI
- examples: `trainer_job.ingest`, `trainer_job.compare`, `trainer_job.patch`

This split is normative.

## 10.2 Current Portal compatibility

The existing trainer modal and worker tooling remain valid under namespace A.
They are not redefined as namespace B jobs.

## 10.3 Trainer job envelope

```json
{
  "trainerJobId": "trainer_01HR...",
  "jobKind": "trainer_job.compare",
  "houseId": "house_abc",
  "teamId": "team_main",
  "experienceId": "arena.poker.season0",
  "requestedBy": {
    "actorType": "human|agent|system",
    "actorId": "user_owner"
  },
  "targets": {
    "traceIds": ["trace_1", "trace_2"],
    "runIds": ["run_1", "run_2"],
    "configVersionIds": ["cfg_a", "cfg_b"],
    "artifactIds": []
  },
  "scope": {
    "timeRange": {
      "from": "2026-02-01T00:00:00Z",
      "to": "2026-03-01T00:00:00Z"
    },
    "audienceClass": "TEAM",
    "entrantMode": "own_only"
  },
  "sealedContextPolicy": "respect_live_seals",
  "budget": {
    "maxUsd": 5.0,
    "maxWallMs": 600000,
    "maxInputTokens": 500000,
    "maxOutputTokens": 100000
  },
  "requiresApproval": false,
  "idempotencyKey": "cmp_cfg_a_cfg_b_20260309",
  "status": "queued|running|blocked|failed|succeeded|canceled",
  "outputs": null,
  "version": "trainer-job/v2"
}
```

## 10.4 Trainer job kinds

Minimum durable kinds:

- `trainer_job.ingest`
- `trainer_job.index`
- `trainer_job.replay`
- `trainer_job.tag`
- `trainer_job.compare`
- `trainer_job.recommend`
- `trainer_job.patch`
- `trainer_job.scrim`
- `trainer_job.guardrails`

## 10.5 Job status contract

Every trainer job response must use one of:

- `queued`
- `running`
- `blocked`
- `failed`
- `succeeded`
- `canceled`

If `blocked`, the response must include a machine-readable blocking code.
If `failed`, the response must include a stable failure code.

## 10.6 Trainer result artifact

```json
{
  "trainerResultId": "trr_01HR...",
  "trainerJobId": "trainer_01HR...",
  "summary": "Config B outperformed Config A in late blind levels.",
  "findings": [],
  "recommendations": [],
  "candidatePatchIds": [],
  "metrics": {},
  "artifactRefs": [],
  "version": "trainer-result/v2"
}
```

## 10.7 Deletion semantics

Durable trainer jobs and canonical trainer results are retained.
Current Portal local trainer traces may still expose cache-level delete actions, but those must be presented as local trace cache deletion unless and until a canonical archive delete policy is explicitly designed.

---

## 11. Configuration versioning

## 11.1 Principle

A published config version is immutable and replayable because all of its inputs resolve to immutable component versions.

## 11.2 Component version rule

The following references must point to immutable versioned components, not mutable live aliases:

- house policy version
- team composition version
- agent config versions
- office policy versions
- experience preset version
- integration overlay versions
- trainer preset version

Mutable labels such as `latest`, `stable`, or branch names may exist for convenience, but they must resolve to immutable version IDs before publication.

## 11.3 Config manifest

```json
{
  "configVersionId": "cfg_01HR...",
  "displayVersion": "poker-main@2026.03.09-1",
  "houseId": "house_abc",
  "teamId": "team_main",
  "branch": "stable|experimental|season-lock",
  "status": "draft|candidate|active|archived|blocked",
  "parentConfigVersionIds": ["cfg_prev"],
  "resolvedComponents": {
    "housePolicyVersionId": "hpv_01",
    "teamCompositionVersionId": "tcv_01",
    "agentConfigVersionIds": ["agv_01", "agv_02"],
    "officePolicyVersionIds": ["opv_01"],
    "experiencePresetVersionId": "epv_01",
    "integrationOverlayVersionIds": [],
    "trainerPresetVersionId": "tpv_01"
  },
  "resolvedComponentHashes": {
    "housePolicyVersionId": "sha256:...",
    "teamCompositionVersionId": "sha256:..."
  },
  "integrity": {
    "configHash": "sha256:..."
  }
}
```

## 11.4 Publication rules

1. A config cannot be published if any component resolves to a mutable alias instead of an immutable version ID.
2. A promoted change always creates a new config version.
3. `season-lock` publication must freeze all component version IDs and hashes.
4. Secrets and browser profiles stay outside config manifests.

## 11.5 Rollback rule

Rollback never mutates history.
Rollback means:

- activate a prior immutable config version, or
- publish a new config derived from it.

---

## 12. Identity, auth, and authorization

## 12.1 Identity model

Agent Town has four separate identity layers:

1. **browser session transport** - `et_session`
2. **co-op routing token** - Team Code
3. **wallet continuity and recovery** - wallet headers plus `x-wallet-recovery-key`
4. **durable house authority** - house-auth HMAC

No external identity provider is introduced by this spec.

## 12.2 Rules

1. Wallet continuity drives user continuity.
2. Team Code is a routing token for co-op agent flows, not the user's durable identity.
3. Browser session cookies are transport/session state, not the final user identity abstraction.
4. House-auth is required for durable House-scoped writes and reads that expose private House state.

## 12.3 Auth matrix

| Surface | Required auth | Notes |
| --- | --- | --- |
| existing `/api/session*` | `et_session` cookie | same-origin browser expectations remain |
| existing `/api/agent/*` | Team Code | current co-op contract remains |
| existing `/api/house/*` private surfaces | house-auth | current HMAC scheme remains |
| wallet claim/recovery surfaces | wallet signature plus nonce as documented | current contract remains |
| `/v1/houses/:houseId/*` private surfaces | session + house-auth | session locates context, house-auth authorizes House access |
| `/v1/trainer/jobs` | house-auth or service credential scoped to House | Team Code alone is insufficient |
| `/v1/traces/ingestions` | authority credential or house-auth scoped to run | source identity must be auditable |
| `/v1/integrations/:id/executions` | session + house-auth or approved service credential | write-capable requests also require approval when policy says so |

## 12.4 House-auth for `/v1/*`

The existing house-auth HMAC model extends to future House-private `/v1/*` routes:

- `x-house-ts`
- `x-house-auth`
- `message = "${houseId}.${ts}.${method}.${path}.${bodyHash}"`

## 12.5 Stable error codes

Minimum auth errors:

- `SESSION_REQUIRED`
- `FORBIDDEN_ORIGIN`
- `TEAM_CODE_REQUIRED`
- `HOUSE_AUTH_REQUIRED`
- `HOUSE_AUTH_INVALID`
- `HOUSE_AUTH_EXPIRED`
- `WALLET_PROOF_REQUIRED`
- `APPROVAL_REQUIRED`

---

## 13. API and protocol contract

## 13.1 Common envelopes

Every `/v1/*` response must use one of:

### Success

```json
{
  "ok": true,
  "data": {},
  "requestId": "req_01H...",
  "version": "v1"
}
```

### Error

```json
{
  "ok": false,
  "error": {
    "code": "CONFIG_NOT_FOUND",
    "message": "Config not found",
    "retryable": false,
    "details": {}
  },
  "requestId": "req_01H...",
  "version": "v1"
}
```

## 13.2 Common rules

1. `POST` creates or triggers must support `Idempotency-Key`.
2. list endpoints must support `limit` and opaque `cursor`.
3. timestamps are ISO8601 UTC.
4. route handlers must return stable error codes suitable for tests.
5. every mutating or job-creation endpoint must return the resulting durable ID.

## 13.3 Route contract table

| Route | Auth | Idempotency | Purpose |
| --- | --- | --- | --- |
| `POST /v1/houses` | session | yes | create House metadata shell |
| `GET /v1/houses/:houseId` | session + house-auth | no | read House detail |
| `GET /v1/houses/:houseId/team` | session + house-auth | no | read effective team/config binding |
| `POST /v1/houses/:houseId/configs` | session + house-auth | yes | create draft or candidate config |
| `POST /v1/houses/:houseId/configs/:configVersionId/promote` | session + house-auth | yes | promote config state |
| `GET /v1/experiences` | session | no | list experiences visible to House |
| `GET /v1/experiences/:experienceId` | session | no | read one experience |
| `POST /v1/experiences/:experienceId/runs` | session + house-auth | yes | create experience run |
| `POST /v1/integrations/resolve` | session + house-auth | yes | resolve source to integration pack candidate |
| `POST /v1/integrations/from-parse` | session + house-auth | yes | create Parse compilation job |
| `POST /v1/integrations/:integrationId/compilations` | session + house-auth | yes | compile or recompile integration pack |
| `POST /v1/integrations/:integrationId/executions` | session + house-auth | yes | create execution record for worker-selected action |
| `POST /v1/traces/ingestions` | authority credential or house-auth | yes | submit raw intake records |
| `GET /v1/traces/:traceId` | session + house-auth | no | read trace metadata |
| `GET /v1/traces/:traceId/events` | session + house-auth | no | page canonical events |
| `GET /v1/runs/:runId/summary` | session + house-auth | no | read run summary |
| `POST /v1/trainer/jobs` | session + house-auth | yes | create trainer job |
| `GET /v1/trainer/jobs/:trainerJobId` | session + house-auth | no | read trainer job |
| `GET /v1/trainer/results/:trainerResultId` | session + house-auth | no | read trainer result |
| `POST /v1/trainer/results/:trainerResultId/promote-patch` | session + house-auth | yes | promote approved patch result |
| `GET /v1/seals/:sealedContextId` | session + house-auth | no | read sealed context metadata |
| `POST /v1/seals/:sealedContextId/release` | session + house-auth | yes | release sealed context under policy |
| `POST /v1/seals/:sealedContextId/violation` | session + house-auth or authority credential | yes | record fairness/security violation |

## 13.4 Selected request/response minima

### `POST /v1/experiences/:experienceId/runs`

Request:

```json
{
  "teamId": "team_main",
  "configVersionId": "cfg_01HR...",
  "entryMode": "normal|season_lock",
  "metadata": {}
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "runId": "run_01H...",
    "status": "queued",
    "traceAuthorityType": "house_trace_ingester"
  }
}
```

Errors:

- `EXPERIENCE_NOT_FOUND`
- `CONFIG_NOT_FOUND`
- `CONFIG_NOT_ELIGIBLE`
- `HOUSE_AUTH_REQUIRED`

### `POST /v1/traces/ingestions`

Request:

```json
{
  "runId": "run_01H...",
  "records": [
    {
      "ingestKey": "worker_main:42",
      "sourceType": "worker",
      "payloadSchema": "raw.web.observation/v1",
      "payload": {}
    }
  ]
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "runId": "run_01H...",
    "accepted": 1,
    "ignored": 0,
    "rejected": 0,
    "traceId": "trace_01H..."
  }
}
```

Errors:

- `RUN_NOT_FOUND`
- `TRACE_AUTHORITY_REQUIRED`
- `TRACE_LATE_EVENT_REJECTED`
- `TRACE_INTAKE_INVALID`

### `POST /v1/trainer/jobs`

Request:

```json
{
  "jobKind": "trainer_job.compare",
  "targets": {
    "configVersionIds": ["cfg_a", "cfg_b"]
  },
  "budget": {
    "maxUsd": 5
  }
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "trainerJobId": "trainer_01H...",
    "status": "queued"
  }
}
```

Errors:

- `TRAINER_JOB_KIND_INVALID`
- `TRAINER_TARGET_INVALID`
- `TRAINER_BUDGET_INVALID`
- `APPROVAL_REQUIRED`

---

## 14. Storage model and migration plan

## 14.1 Current state

Today the repo uses:

- SQLite with JSON row payloads for core app state,
- browser IndexedDB/VFS for local trainer/runtime state,
- in-memory session state and runtime caches.

That is acceptable for current Portal scope.
It is not yet the final platform store.

## 14.2 Target durable model

Minimum durable entities:

- `houses`
- `teams`
- `experiences`
- `experience_pack_versions`
- `integration_pack_versions`
- `runs`
- `trace_intake_records`
- `trace_events`
- `trace_artifacts`
- `trainer_jobs`
- `trainer_results`
- `config_versions`
- `config_component_versions`
- `sealed_contexts`
- `approvals`
- `usage_ledger`

Artifacts live in content-addressed storage.
Relational tables hold metadata and indexes.

## 14.3 Migration phases

### Phase 0

Current Portal remains source of truth for current MVP behavior.

### Phase 1

Introduce new durable entities for runs, canonical traces, trainer jobs, configs, and compiled packs.
Current MVP paths continue unchanged.

### Phase 2

New platform features dual-write:

- browser/runtime local state for current UX where needed,
- durable platform store for new canonical records.

### Phase 3

Add explicit import/backfill tools for:

- historical trainer attempt bundles,
- current replay files,
- selected IndexedDB/VFS artifacts.

Backfill is opt-in and auditable.

### Phase 4

Switch read paths for new platform surfaces to the durable store.
Keep local cache reads only for compatibility/debugging.

### Phase 5

Retire deprecated local-only semantics once tests prove parity.

## 14.4 Migration rules

1. IDs must remain stable across migration.
2. All exported artifacts must remain portable.
3. No canonical trace may depend solely on browser-local storage.
4. Local cache deletion must not be treated as canonical deletion.

---

## 15. Observability and debugging

## 15.1 Required stable debug tabs

The current debug-panel expectations remain:

- `Worker Tools`
- `Skill Context`
- `Worker Traffic`
- `Brain`
- `Session Context`

## 15.2 New additive observability

The platform may add:

- trainer job detail,
- trace authority health,
- canonical vs intake rejection counters,
- config lineage,
- approval ledger,
- sealed-context audit view.

These must be additive and not break the existing debug tabs.

## 15.3 What should be visible

### Run detail

- current status,
- trace authority,
- config version,
- approval state,
- canonical trace link.

### Trace detail

- event filters,
- audience labels,
- seal status,
- integrity chain,
- duplicate/ignored/rejected intake counts.

### Trainer detail

- job status,
- inputs,
- outputs,
- costs,
- approval blockers,
- linked trace and config refs.

---

## 16. Rollout plan

## 16.1 Phase 0 - compatibility hardening

Ship:

- modal-first Trainer continuity fixes,
- namespace ownership documentation,
- public skill -> compiled pack bridge,
- auth matrix alignment,
- deterministic acceptance updates.

## 16.2 Phase 1 - canonical archive core

Ship:

- run records,
- trace intake and trace authority,
- canonical trace archive,
- config component versioning,
- pack compiler outputs.

## 16.3 Phase 2 - web integration platform

Ship:

- integration resolution,
- compilation jobs,
- execution records,
- approval logging,
- web trace emission into canonical archive.

## 16.4 Phase 3 - poker integration

Ship:

- operator ingestion,
- season-lock config resolution,
- sealed-context enforcement,
- trainer_job.compare/replay/recommend against poker traces.

## 16.5 Phase 4 - House control-plane expansion

Ship:

- Trainer, Archive, Workshop, Inbox House surfaces,
- config lineage UI,
- recommendation promotion flows.

## 16.6 Phase 5 - later work

Possible later work:

- tracks and rewards,
- experience editor,
- federation/P2P extensions.

These are non-blocking for the current implementation scope.

---

## 17. Deterministic acceptance criteria

## 17.1 Platform-level release gates

The platform release is acceptable only when all of the following are automated and pass:

1. `trainer.*` tool registry and `trainer_job.*` job kinds are distinct and never reused interchangeably.
2. `public/skill.md` remains reachable and contract-compatible, and the same-origin default skill is compiled into an internal pack before execution.
3. direct `/atlas` and `/trainer` hits resolve into modal-preserving entry paths when the town hub shell is available.
4. protected `/v1/*` routes reject missing or wrong auth with stable error codes from this spec.
5. duplicate trace intake records with the same `ingestKey` are ignored deterministically.
6. late trace intake after run completion is either rejected with `TRACE_LATE_EVENT_REJECTED` or appended as a post-run annotation event according to declared policy, never by mutating prior canonical events.
7. clearing browser-local trainer traces does not delete or corrupt canonical archived traces.
8. any published config version resolves only to immutable component version IDs and hashes.
9. any meaningful config change produces a new `configHash`.
10. write-capable web executions require approval by default and create auditable execution records.

## 17.2 Web Experience release gates

1. a website can be resolved into an internal integration pack with manifest hash and file hashes,
2. the browser worker can request an execution record without the server inventing the action,
3. approval-required writes fail closed without approval,
4. completed sessions emit canonical traces through one declared authority,
5. trainer jobs can analyze at least one completed web session from canonical archive data.

## 17.3 Poker release gates

1. a poker run declares one authority, and operator trace ingestion produces a canonical trace with monotonic `seq`,
2. entrant-private live events carry explicit audience + seal data,
3. shared services are partitioned or blocked by `sealedContextId`,
4. season-lock entry freezes an immutable config version,
5. `trainer_job.replay` and `trainer_job.compare` work on canonical poker traces.

## 17.4 Config release gates

1. a config cannot publish with mutable alias refs,
2. promotion is explicit and auditable,
3. rollback activates a previous immutable version or a newly derived one,
4. lineage is queryable,
5. season-lock entries remain bound to the resolved component hashes used at entry time.

## 17.5 Current Portal compatibility gates

1. existing Playwright skill-contract coverage still passes,
2. existing worker debug tabs still exist and remain readable,
3. current Team Code co-op flow still works,
4. wallet-based continuity still works,
5. no worker-first regression is introduced by new backend surfaces.

---

## 18. Final recommendation

Build the platform in layers, not as a disguised rewrite.

The correct order is:

1. preserve and harden the current Portal contracts,
2. introduce canonical storage and compiled packs,
3. add durable trainer jobs and integration execution records,
4. then expand the House control plane around those working primitives.

This keeps the repo testable, preserves the current product, and still creates a clean path to the larger Agent Town platform.

---

## Appendix A - Minimum stable error codes

### Auth

- `SESSION_REQUIRED`
- `FORBIDDEN_ORIGIN`
- `TEAM_CODE_REQUIRED`
- `HOUSE_AUTH_REQUIRED`
- `HOUSE_AUTH_INVALID`
- `HOUSE_AUTH_EXPIRED`
- `WALLET_PROOF_REQUIRED`

### Trace

- `RUN_NOT_FOUND`
- `TRACE_AUTHORITY_REQUIRED`
- `TRACE_LATE_EVENT_REJECTED`
- `TRACE_INTAKE_INVALID`
- `TRACE_DUPLICATE_IGNORED`

### Trainer

- `TRAINER_JOB_KIND_INVALID`
- `TRAINER_TARGET_INVALID`
- `TRAINER_BUDGET_INVALID`
- `TRAINER_BLOCKED`

### Config

- `CONFIG_NOT_FOUND`
- `CONFIG_COMPONENT_MUTABLE_REF`
- `CONFIG_PROMOTION_BLOCKED`

### Approval and execution

- `APPROVAL_REQUIRED`
- `APPROVAL_INVALID`
- `EXECUTION_NOT_ALLOWED`
- `EXECUTION_NOT_FOUND`

---

## Appendix B - Current Portal mapping

| Current Portal concept | Revised platform concept |
| --- | --- |
| `public/skill.md` | external manual compiled into internal pack |
| `trainer.*` runtime tools | retained as runtime trainer namespace |
| trainer local attempt bundle in IndexedDB/VFS | browser-local cache or import source |
| SQLite JSON app state | current MVP store, later migrated/bridged |
| Team Code | co-op routing token |
| wallet recovery headers | continuity and recovery input |
| house-auth HMAC | durable House authority model |
