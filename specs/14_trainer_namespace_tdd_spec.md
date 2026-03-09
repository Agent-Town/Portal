# Phase 4 Spec: Agent `trainer_*` Namespace (Plugin-Constrained, TDD)

Status: Draft  
Version: 1.0  
Audience: runtime engineers, app/backend engineers, security engineers, UX engineers, QA automation engineers  
Goal: allow the agent to use a safe, auditable `trainer_*` tool namespace so humans and agents can collaborate inside the trainer with deterministic evidence.

Implementation constraints:

1. Do not modify OpenClaw core runtime source under `vendors/openclaw-lite-main/src/openclaw-lite/*`.
2. Implement as a Portal-side plugin/bridge layer on top of existing runtime capabilities.
3. Preserve worker-first architecture; do not move agent decision logic into backend shortcuts.
4. Keep trainer as a modal over town UI.

## 1. Executive Summary

Current blocker:

1. Builders can use Trainer Tool Lab to prove actions are possible.
2. The agent cannot directly access trainer state/tools in a structured way.
3. Human and agent collaboration degrades when the agent forgets usable API/action patterns.

Proposed solution:

1. Introduce a controlled `trainer_*` namespace available to the agent during active experience sessions.
2. Expose read-only trainer observability tools by default and limited action-execution tools with policy guards.
3. Keep all calls auditable, rate-limited, and visible in trainer + agent debug tabs.
4. Maintain deterministic failure codes and full Playwright coverage milestone by milestone.

## 2. Product Outcomes

Required outcomes:

1. Agent can inspect traces, available skill actions, evidence, and session context using structured tools.
2. Agent can invoke skill actions via trainer bridge (`trainer.invoke_action`) and report tool-backed results.
3. Agent can verify critical claims (for example canvas draw completion) using evidence, not assumptions.
4. Builders can see what the agent attempted, why it failed, and what was blocked by policy.

Success metrics:

1. Reduction in turns where agent claims completion without a successful tool result.
2. Reduction in unresolved "agent says it cannot" loops for skill-defined API actions.
3. 100% deterministic pass rate for `trainer_*` Playwright acceptance suite.

## 3. Non-Goals

1. No arbitrary DOM manipulation capability for the agent.
2. No backend hacks that fake co-op outcomes.
3. No per-skill hardcoded tool code paths.
4. No replacement of generic runtime tools (`http_request`, etc.); this is an additive namespace.

## 4. Guardrails

1. Wallet/session identity remains authoritative.
2. Team Code remains session routing token.
3. Trainer remains minimal modal UI.
4. All mutating operations remain explicit and auditable.
5. Security defaults fail closed.

## 5. Proposed Architecture

## 5.1 Components

1. Trainer Namespace Plugin (TNP)
   - Lives in `public/`.
   - Registers and dispatches `trainer_*` tool handlers.
2. Policy Engine (PE)
   - Enforces allowlist, permissions, rate limits, and recursion guards.
3. Trainer Bridge (TB)
   - Maps `trainer_*` calls to existing gateway/trainer/plugin capabilities.
4. Audit Emitter (AE)
   - Emits deterministic records to trainer traces + worker traffic diagnostics.

## 5.2 Namespace Model

Namespace: `trainer.*` (displayed to agent as `trainer_*` aliases if needed for tool compatibility).

Canonical tool IDs (v1):

1. `trainer.list_runs`
2. `trainer.get_run`
3. `trainer.get_event`
4. `trainer.list_actions`
5. `trainer.invoke_action`
6. `trainer.list_evidence`
7. `trainer.get_transcript_integrity`
8. `trainer.get_session_context`
9. `trainer.explain_not_used`
10. `trainer.delete_trace` (approval-gated)
11. `trainer.clear_traces` (approval-gated)

Compatibility aliases (optional):

1. `trainer_list_runs` -> `trainer.list_runs`
2. `trainer_invoke_action` -> `trainer.invoke_action`
3. etc.

## 5.3 Permission Tiers

Tier A (read-only, default allowed):

1. `list_runs`, `get_run`, `get_event`
2. `list_actions`, `list_evidence`
3. `get_transcript_integrity`, `get_session_context`, `explain_not_used`

Tier B (non-destructive execute, default allowed with quota):

1. `invoke_action`

Tier C (destructive/admin, explicit human approval required):

1. `delete_trace`
2. `clear_traces`

Policy defaults:

1. Tier A: allowed.
2. Tier B: allowed with strict call budget.
3. Tier C: denied unless one-time approval token exists.

## 5.4 Anti-Loop and Safety Controls

1. Per-turn tool budget: default `maxTrainerCallsPerTurn = 6`.
2. Rolling window budget: default `maxTrainerCallsPerMinute = 20`.
3. Recursion guard: a `trainer.*` call cannot trigger another `trainer.*` call internally.
4. Approval token TTL: 60 seconds for Tier C actions.
5. Redaction policy: secrets/team-private sensitive fields are masked in logs and tool output summaries.

Deterministic block codes:

1. `TRAINER_UNAVAILABLE`
2. `TRAINER_PERMISSION_DENIED`
3. `TRAINER_APPROVAL_REQUIRED`
4. `TRAINER_RATE_LIMITED`
5. `TRAINER_RECURSION_BLOCKED`
6. `TRAINER_NOT_FOUND`
7. `TRAINER_PARAM_INVALID`

## 6. Tool Contracts (v1)

All responses include:

1. `ok` boolean
2. `tool` string
3. `durationMs` number
4. `code` nullable string
5. `message` nullable string

### 6.1 `trainer.list_runs`

Request:

```json
{
  "limit": 20,
  "cursor": null
}
```

Response:

```json
{
  "ok": true,
  "tool": "trainer.list_runs",
  "runs": [
    {
      "attemptId": "attempt_...",
      "result": "success|failed|unknown",
      "durationMs": 812,
      "toolFailures": 1,
      "createdAt": "2026-02-22T12:34:56.000Z"
    }
  ],
  "nextCursor": null
}
```

Acceptance rules:

1. Newest-first ordering.
2. Deterministic truncation by `limit`.

### 6.2 `trainer.get_run`

Request:

```json
{ "attemptId": "attempt_..." }
```

Response includes summary + event index metadata, not full transcript by default.

### 6.3 `trainer.get_event`

Request:

```json
{ "attemptId": "attempt_...", "seq": 14 }
```

Response returns the exact selected event payload and normalized inspector-friendly summary.

### 6.4 `trainer.list_actions`

Returns dynamic `skill_action.*` catalog plus metadata:

1. action id
2. method/url template
3. params
4. source/confidence
5. run stats (invocations/successes/failures)

### 6.5 `trainer.invoke_action`

Request:

```json
{
  "actionId": "canvas.image",
  "params": { "teamCode": "TEAM-XXXX-YYYY" }
}
```

Web Experience parity addendum:

```json
{
  "webSessionId": "we_1234567890",
  "actionId": "save_draft",
  "idempotencyKey": "act-web-001",
  "expectedRevision": 1,
  "params": { "draft": "Keep this local" }
}
```

Response:

```json
{
  "ok": true,
  "tool": "trainer.invoke_action",
  "actionId": "canvas.image",
  "request": {
    "method": "GET",
    "url": "http://localhost:4173/api/agent/canvas/image?teamCode=TEAM-XXXX-YYYY"
  },
  "response": { "ok": true, "image": { "w": 16, "h": 16, "pixels": [] } },
  "validation": { "ok": true },
  "evidence": [{ "evidenceKey": "canvas.image.ok", "ok": true, "ttlMs": 120000 }]
}
```

Acceptance rules:

1. Input params must override placeholder values in inferred templates.
2. All plugin security guards remain enforced (`ORIGIN_BLOCKED`, `METHOD_NOT_ALLOWED`, `SIZE_LIMIT`).
3. Failure codes are deterministic and stable.
4. When `webSessionId` is present, dispatch through `POST /api/web/sessions/:id/actions/:actionId/invoke`.
5. Reusing the same `idempotencyKey` for the same `webSessionId` and `actionId` must preserve backend `invocationId` parity instead of inventing a trainer-local id.

### 6.6 `trainer.list_evidence`

Request:

```json
{
  "actionId": "canvas.image",
  "freshOnly": true
}
```

Response includes evidence rows with `evidenceKey`, `atMs`, `ttlMs`, `expired`.

Web Experience parity addendum:

```json
{
  "webSessionId": "we_1234567890",
  "limit": 20,
  "freshOnly": true
}
```

When `webSessionId` is present, read the durable evidence ledger from `GET /api/web/sessions/:id/evidence` and preserve backend `evidenceId` values exactly.

### 6.7 `trainer.get_transcript_integrity`

Returns:

1. tool result stats
2. orphan/duplicate/displaced counts
3. synthetic transcript repair rows and related call ids

### 6.8 `trainer.get_session_context`

Returns runtime/session snapshot used by trainer namespace:

1. runtime context (`origin`, `teamCode`, `houseId`)
2. active skill path/source
3. action catalog size
4. recent reason codes
5. policy budget snapshot

Web Experience parity addendum:

```json
{ "webSessionId": "we_1234567890" }
```

When `webSessionId` is present, `trainer.get_session_context` must read the server-backed Web Experience session and return:

1. `sessionContext.webSession`
2. `sessionContext.activeIntegration`
3. `sessionContext.approvalQueue`
4. `sessionContext.lastCheckpoint`
5. `sessionContext.runtimeSnapshot`
6. `sessionContext.credentialStatusByOrigin`

### 6.9 `trainer.explain_not_used`

Request:

```json
{ "actionId": "canvas.image" }
```

Response includes:

1. whether action existed at turn time
2. whether compatible call was attempted
3. matching/missing-result diagnostics
4. reason codes (for example `TOOL_CALL_MISSING_RESULT`)

### 6.10 `trainer.delete_trace` and `trainer.clear_traces`

1. Require valid approval token.
2. Emit `TRAINER_APPROVAL_REQUIRED` when missing/expired.
3. Emit immutable audit record with actor, token id, and affected run count.

## 7. UX Requirements

1. No extra page chrome in trainer modal.
2. Agent panel tabs remain stable:
   - `Worker Tools`
   - `Skill Context`
   - `Worker Traffic`
   - `Brain`
   - `Session Context`
3. `Worker Tools` tab lists `trainer.*` availability.
4. `Session Context` includes `trainerNamespace` diagnostics:
   - `enabledTools`
   - `tierPolicy`
   - `budgetRemaining`
   - `pendingApprovals`
   - `recentBlockCodes`
5. Tool lab and traces remain human-operable (including `[x]` delete and clear all).

## 8. Security and Threat Model Requirements

Trust boundaries:

1. LLM output is untrusted.
2. Trainer namespace bridge is trusted but policy-constrained.
3. Server API remains authoritative for persistent state.

Mandatory controls:

1. Tool allowlist only (no eval/script execution).
2. Strict schema validation for every `trainer.*` call.
3. Same-origin enforcement for action execution.
4. Secret redaction in tool outputs, traces, and debug tabs.
5. Approval requirement for destructive operations.
6. Immutable audit trail for all agent-triggered trainer calls.

## 9. TDD Roadmap (Milestones + Acceptance)

## M0: Contract Harness and Namespace Discovery

Acceptance criteria:

1. Agent sees `trainer.list_runs`, `trainer.list_actions`, `trainer.invoke_action` in tool registry when trainer namespace feature flag is enabled.
2. Feature flag off -> tools absent.

Tests:

1. `e2e/98_trainer_namespace_contract_harness.spec.js`

## M1: Read-Only Introspection Tools

Acceptance criteria:

1. `trainer.list_runs` returns newest-first deterministic list.
2. `trainer.get_run` and `trainer.get_event` resolve stable payloads for known attempts.
3. `trainer.get_session_context` returns runtime + policy snapshot.

Tests:

1. `e2e/99_trainer_namespace_read_tools.spec.js`

## M2: Dynamic Action Catalog Bridge

Acceptance criteria:

1. `trainer.list_actions` returns dynamic action set from active skill.
2. Skill switch atomically replaces action catalog.
3. Catalog metadata includes source/confidence/params.

Tests:

1. `e2e/100_trainer_namespace_action_catalog.spec.js`

## M3: Action Invocation via Trainer Namespace

Acceptance criteria:

1. `trainer.invoke_action(canvas.image)` succeeds with provided `teamCode`.
2. Request URL contains provided team code, not placeholder defaults.
3. Failure paths return deterministic codes.

Tests:

1. `e2e/101_trainer_namespace_invoke_action.spec.js`

## M4: Evidence and Claim Verification Loop

Acceptance criteria:

1. After `trainer.invoke_action`, evidence rows are queryable via `trainer.list_evidence`.
2. Evidence freshness/expiry is deterministic and testable.
3. Canvas verification claims rely on evidence presence and TTL.

Tests:

1. `e2e/102_trainer_namespace_evidence_loop.spec.js`

## M5: Transcript Integrity and Why-Not-Used Diagnostics

Acceptance criteria:

1. `trainer.get_transcript_integrity` surfaces synthetic repair rows.
2. `trainer.explain_not_used` returns actionable reason codes.
3. Diagnostic output matches Session Context tab content.

Tests:

1. `e2e/103_trainer_namespace_diagnostics.spec.js`

## M6: Permission Tiers and Approval Gates

Acceptance criteria:

1. Tier C calls fail with `TRAINER_APPROVAL_REQUIRED` without token.
2. Human approval token enables one operation within TTL.
3. Expired token fails deterministically.

Tests:

1. `e2e/104_trainer_namespace_approval_gate.spec.js`

## M7: Rate Limits and Recursion Guards

Acceptance criteria:

1. Excess calls in one turn return `TRAINER_RATE_LIMITED`.
2. Recursive trainer dispatch attempts return `TRAINER_RECURSION_BLOCKED`.
3. Budgets reset deterministically at window boundaries.

Tests:

1. `e2e/105_trainer_namespace_rate_limit_recursion.spec.js`

## M8: Security Redaction and Safe Logging

Acceptance criteria:

1. Secret-like values are redacted from tool result text and traces.
2. Worker Traffic displays redacted payloads.
3. No raw secret appears in Session Context diagnostics.

Tests:

1. `e2e/106_trainer_namespace_redaction.spec.js`

## M9: End-to-End Human-Agent Cooperation Scenario

Acceptance criteria:

1. Agent uses `trainer.*` tools to diagnose blocked canvas task.
2. Human demonstrates action invocation once.
3. Agent repeats successfully and reports evidence-backed completion.
4. No false "done" claim without successful tool-backed verification.

Tests:

1. `e2e/107_trainer_namespace_coop_canvas.spec.js`

## M10: Web Experience Session Parity

Acceptance criteria:

1. `trainer.list_evidence` returns the same durable rows as `GET /api/web/sessions/:id/evidence` for the same `webSessionId`.
2. `trainer.invoke_action` returns the same backend `invocationId` as `POST /api/web/sessions/:id/actions/:actionId/invoke` for the same idempotent request.
3. `trainer.get_session_context` returns server-backed Web Experience session state when `webSessionId` is provided.
4. Contract docs stay aligned across skill, internal testline, and trainer namespace specs.

Tests:

1. `e2e/127_web_approval_roundtrip.spec.js`
2. `e2e/135_docs_contract_sync.spec.js`

## 10. Implementation Sequence (Test-First)

For each milestone:

1. Add failing Playwright test.
2. Implement minimal plugin/bridge code to pass.
3. Add regression assertion for previously fixed behavior.
4. Run full trainer subset:
   - `e2e/73_experience_*`
   - `e2e/84-97_skill_actions_*`
   - `e2e/98+ trainer_namespace_*`

## 11. API and Documentation Updates Required

When implementing milestones, update:

1. `specs/02_api_contract.md` (new trainer namespace endpoints/contracts if server routes are added).
2. `public/skill.md` (if trainer-specific guidance is added for agent playbook).
3. `docs/internal-skill-testline.md` (capability-to-test mapping for `trainer_*`).
4. `e2e/55_phase3_skill_contract_line.spec.js` or `e2e/56+` as needed for compatibility coverage.

## 12. Definition of Done

1. All `trainer_namespace` Playwright tests pass.
2. Existing trainer + skill action suites continue to pass.
3. No core runtime source modifications under `vendors/openclaw-lite-main/src/openclaw-lite/*`.
4. Session Context and Worker Traffic expose sufficient diagnostics to debug "agent did not use available action" cases.
5. Destructive operations remain human-gated and auditable.

## 13. Open Decisions (to resolve before implementation starts)

1. Final naming format exposed to the LLM: `trainer.*` vs `trainer_*` aliases or both.
2. Whether approval tokens are managed server-side or client-side ephemeral with signed nonce.
3. Budget defaults by environment (`dev`, `test`, `prod`).
4. Whether to expose a dedicated `trainer.verify_claim` helper in v1 or defer to `list_evidence` + policy evaluation.
