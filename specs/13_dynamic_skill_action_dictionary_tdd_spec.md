# Phase 3 Spec: Dynamic Skill Action Dictionary + Modal Experience Trainer (TDD)

Status: Draft  
Version: 1.1 (plugin-constrained)  
Audience: runtime engineers, backend engineers, security engineers, UX engineers, QA automation engineers  
Goal: make every `skill.md` dynamically executable, inspectable, and auditable in a minimal modal trainer without hardcoding one tool per skill file.

Implementation constraint update:

1. Do not modify OpenClaw core runtime source under `vendors/openclaw-lite-main/src/openclaw-lite/*`.
2. Implement as a Portal-side plugin layer that composes existing runtime capabilities (`http_request`, `workspace_read_file`, transcript APIs).
3. Preserve worker-first architecture by avoiding backend decision shortcuts.

## 1. Executive Summary

This phase addresses a repeated production blocker:

1. The agent can execute generic tools (`http_request`) but often fails to use the right API shape from `skill.md` at the right time.
2. Builders cannot quickly prove feasibility to the agent when it stalls or claims completion without evidence.
3. Canvas and other visual tasks have weak verification loops.
4. Transcript repair artifacts (synthetic tool-result errors) are hidden from builders, making debugging opaque.

This spec introduces a dynamic, per-skill action system:

1. Parse `skill.md` into a machine-readable Skill Action Dictionary.
2. Register ephemeral `skill_action.*` entries in the plugin tool surface (trainer + debug), mapped to existing runtime tools.
3. Capture action evidence with freshness windows (TTL).
4. Surface verification gaps deterministically in plugin diagnostics (claim hard-gating in core runtime is deferred).
5. Expose all action availability, usage, failures, and transcript integrity in trainer + agent debug tabs.

The design is generic and must work for future skill files without adding dedicated backend code for each one.

## 2. Root Cause Analysis (Why this keeps recurring)

Primary root causes:

1. Cognitive load mismatch:
   - `skill.md` encodes API details in prose.
   - Runtime tool list exposes generic primitives.
   - The model must re-derive payloads under pressure each turn.
2. Weak runtime grounding:
   - Tool execution may be missing or repaired in transcript history.
   - Completion language can appear without fresh verification evidence.
3. Missing human override ergonomics:
   - Builders need a fast way to run the exact action from skill context and show the result to the agent.
4. Visibility gap:
   - Builders cannot answer: "Was the action available?", "Was it chosen?", "If not, why not?".

Architectural conclusion:

1. This is not a one-off prompt issue.
2. This is a product/runtime contract issue and must be solved as a reusable system.

## 3. Scope and Non-Goals

In scope:

1. Dynamic action extraction from `skill.md`.
2. Ephemeral plugin tool registration from extracted actions.
3. Generic execution engine + response validation + evidence ledger.
4. Trainer modal support for action invocation and diagnostics.
5. Session Context and Worker Tabs observability upgrades.
6. Deterministic TDD coverage for the full flow.

Out of scope:

1. Replacing OpenClaw Lite runtime architecture.
2. Moving agent reasoning into backend handlers.
3. Building a dedicated handcrafted tool per experience skill.
4. Any gamification or additional non-minimal UX layers.

## 4. Design Guardrails (Must Hold)

1. Worker-first architecture remains authoritative.
2. Shared-state co-op model remains authoritative.
3. Session identity remains wallet-first; Team Code remains routing token.
4. Trainer remains modal over town UI (no separate full page).
5. Minimal UI principle remains: no redundant header/page chrome, no duplicate bottom panel.
6. Deterministic Playwright coverage is mandatory for every capability.
7. Security defaults fail closed.

## 5. Product Requirements by Discipline

## 5.1 AI Agent and LLM Requirements

1. Plugin layer must expose action-centric tools (`skill_action.*`) in addition to generic runtime primitives.
2. Assistant may only claim completion for verification-critical outcomes when evidence is fresh and valid.
3. Runtime must expose deterministic reason codes when an available action was not used.
4. Prompting must include a compact Skill Action Quick Reference for top relevant actions.
5. Tool-result truthfulness remains mandatory: no "done" claims without actual successful tool outputs.

## 5.2 Security Requirements

1. Action execution defaults to same-origin only.
2. Method and payload size constraints must be enforced per action.
3. Secret values must be redacted in trainer, worker traffic, and session context.
4. Structured action parsing must reject executable/script payloads.
5. Cross-origin execution requires explicit policy allowlist and test coverage.

## 5.3 UX Requirements

1. Trainer opens as a modal on top of town UI.
2. No duplicate global page header or duplicate bottom panel in trainer mode.
3. Ceremony trainer view contains only required controls:
   - canvas,
   - palette,
   - commit/lock-in action.
4. Agent debugging remains available via right-side panel tabs:
   - Worker Tools,
   - Skill Context,
   - Worker Traffic,
   - Brain,
   - Session Context.
5. Session Context must never silently fail; it must render data or explicit error state.
6. Builders must be able to delete individual trace rows and clear all traces.

## 5.4 Architecture Requirements

1. No per-skill hardcoded route adapters.
2. Skill action extraction must be deterministic for identical input.
3. Dynamic plugin action tools must atomically replace previous action set on skill switch.
4. All action invocations must produce auditable records (request summary, result, evidence, diagnostics).

## 6. Target User Journeys

## 6.1 Builder-Coaches-Agent Journey

1. Builder asks agent to perform action X.
2. Agent stalls or picks wrong action.
3. Builder opens Trainer Tool Lab, runs action X directly, and sees successful result.
4. Builder asks agent why action was not used.
5. Agent references deterministic reason code and corrected plan.
6. Agent proceeds with evidence-backed execution.

## 6.2 Canvas Verification Journey

1. Agent paints pixels through API.
2. Runtime fetches image/pixel snapshot action for confirmation where available.
3. Evidence ledger records fresh visual verification.
4. Completion claim is accepted only if evidence freshness is within policy.

## 6.3 Transcript Integrity Journey

1. Tool result missing from transcript.
2. Runtime records repair event (`synthetic`).
3. Trainer integrity panel surfaces the event and correlated call id.
4. Builder can inspect and re-run exact action.

## 7. System Architecture

## 7.1 Components

1. Skill Action Dictionary Compiler (SADC)
   - Input: imported skill text, runtime context.
   - Output: normalized `SkillAction[]`.
2. Dynamic Action Tool Registry (DATR)
   - Registers ephemeral `skill_action.<id>` callable tools.
3. Generic Action Executor (GAE)
   - Resolves templates, executes action, validates success, emits evidence.
4. Evidence Ledger (EL)
   - Stores evidence keys, timestamps, summaries, and freshness.
5. Claim Gate Engine (CGE)
   - Validates claim markers against evidence requirements.
6. Diagnostics Engine (DE)
   - Computes why-not-used reason codes and transcript integrity metrics.
7. Trainer Modal UI + Agent Panel
   - Surfaces actions, invocations, evidence, diagnostics, and integrity.

## 7.2 Runtime Data Flow

1. Skill import completes.
2. SADC parses explicit block or fallback infers actions.
3. DATR registers tools atomically.
4. Agent turn runs with quick-reference + dynamic tools.
5. Any action invocation passes through GAE.
6. GAE writes EL and DE events.
7. CGE evaluates claims before assistant message finalization.
8. Trainer and Session Context poll `list/evidence/diagnostics`.

## 7.3 Failure Semantics

All failures must emit deterministic codes:

1. `PARSE_INVALID`
2. `PARAM_UNRESOLVED`
3. `METHOD_NOT_ALLOWED`
4. `ORIGIN_BLOCKED`
5. `SIZE_LIMIT`
6. `SUCCESS_RULE_FAILED`
7. `TOOL_CALL_MISSING_RESULT`
8. `CLAIM_BLOCKED`

## 8. Skill Action Dictionary Contract

## 8.1 `skill.md` Source of Truth

Preferred format in `public/skill.md`:

1. Keep human-readable prose unchanged.
2. Add optional fenced block `skill-actions-v1` with JSON content.
3. Explicit block has priority over inferred extraction.

Example:

```skill-actions-v1
{
  "version": "1",
  "actions": [
    {
      "id": "canvas.paint",
      "title": "Paint one pixel",
      "transport": "http",
      "request": {
        "method": "POST",
        "urlTemplate": "{origin}/api/agent/canvas/paint",
        "bodyTemplate": {
          "teamCode": "{teamCode}",
          "x": "{x}",
          "y": "{y}",
          "color": "{color}"
        }
      },
      "params": [
        { "name": "x", "type": "integer", "required": true, "min": 0, "max": 15 },
        { "name": "y", "type": "integer", "required": true, "min": 0, "max": 15 },
        { "name": "color", "type": "integer", "required": true, "min": 0, "max": 7 }
      ],
      "success": {
        "httpStatus": "2xx",
        "jsonRules": [{ "path": "ok", "equals": true }]
      },
      "evidence": {
        "produces": ["canvas.paint.ok"],
        "ttlMs": 120000
      }
    },
    {
      "id": "canvas.image",
      "title": "Fetch canvas image snapshot",
      "transport": "http",
      "request": {
        "method": "GET",
        "urlTemplate": "{origin}/api/agent/canvas/image?teamCode={teamCode}"
      },
      "params": [],
      "success": {
        "httpStatus": "2xx",
        "jsonRules": [{ "path": "ok", "equals": true }]
      },
      "evidence": {
        "produces": ["canvas.image.ok"],
        "ttlMs": 120000
      },
      "claim": {
        "requiredFor": ["canvas.draw.complete"]
      }
    }
  ]
}
```

## 8.2 Fallback Inference (when explicit block absent)

1. Parse markdown for endpoint signatures:
   - method + route,
   - body fields,
   - success requirements (`ok: true`, `2xx`).
2. Create inferred actions with:
   - `source=inferred`,
   - `confidence` score.
3. Do not infer disallowed methods by default (`DELETE`, `PATCH`) without explicit policy.
4. Show inferred confidence in Trainer Tool Lab.

## 8.3 Normalized Internal Shape

```json
{
  "id": "canvas.image",
  "source": "explicit",
  "confidence": 1,
  "request": {
    "method": "GET",
    "urlTemplate": "{origin}/api/agent/canvas/image?teamCode={teamCode}"
  },
  "params": [],
  "success": {
    "httpStatus": "2xx",
    "jsonRules": [{ "path": "ok", "equals": true }]
  },
  "evidence": {
    "produces": ["canvas.image.ok"],
    "ttlMs": 120000
  },
  "claim": {
    "requiredFor": ["canvas.draw.complete"]
  },
  "security": {
    "sameOriginOnly": true,
    "allowMethods": ["GET"],
    "maxBodyBytes": 0
  }
}
```

## 9. Dynamic Tooling and Evidence Model

## 9.1 Tool Registration

For each action:

1. Tool name: `skill_action.<actionId>`.
2. Schema generated from action params.
3. Runtime-bound params (`teamCode`, `origin`, `houseId`) auto-filled when available.
4. Registration is atomic on skill switch.

## 9.2 Invocation Record

```json
{
  "actionId": "canvas.paint",
  "requestId": "act_01H...",
  "status": "ok",
  "startedAtMs": 1730000000000,
  "finishedAtMs": 1730000000120,
  "requestSummary": {
    "method": "POST",
    "url": "/api/agent/canvas/paint"
  },
  "responseSummary": {
    "httpStatus": 200,
    "ok": true
  },
  "redactionApplied": true
}
```

## 9.3 Evidence Record

```json
{
  "evidenceKey": "canvas.image.ok",
  "actionId": "canvas.image",
  "ok": true,
  "atMs": 1730000000999,
  "ttlMs": 120000,
  "summary": {
    "httpStatus": 200
  }
}
```

## 9.4 Claim Requirement

```json
{
  "claimId": "canvas.draw.complete",
  "requires": ["canvas.paint.ok", "canvas.image.ok"],
  "maxAgeMs": 120000
}
```

## 10. Claim Gating Protocol

1. Verification-critical claims use marker syntax `[[CLAIM:<claimId>]]`.
2. Runtime intercepts outgoing assistant message and evaluates requirements.
3. If evidence missing or stale:
   - block/transform claim output,
   - emit `CLAIM_BLOCKED:<claimId>:<missingOrStaleEvidence>`,
   - write diagnostic event.
4. If valid evidence exists:
   - allow claim marker resolution,
   - emit `claim.accepted`.

Compatibility rule:

1. In v1, missing marker does not hard-fail all turns.
2. For verification-critical objectives, runtime still surfaces a warning until markers are adopted.

## 11. Security Specification

## 11.1 Threat Boundaries

1. Skill content may be malformed or malicious.
2. Agent-generated params may be adversarial.
3. Debug surfaces may leak secrets if not redacted.
4. Generic HTTP tools can become SSRF vector if policy is weak.

## 11.2 Mandatory Controls

1. Same-origin default allow policy.
2. Optional explicit cross-origin allowlist per deployment.
3. Method allowlist per action.
4. Max body size enforcement.
5. Template variable escaping and strict type validation.
6. Redaction pipeline before storing/displaying request and response fields.
7. Structured block parser must reject executable markup/code payloads.
8. Security audit event on every blocked action.

## 11.3 Security Acceptance Criteria

1. No raw secrets in Worker Traffic, Tool Lab output, Session Context, or traces.
2. Cross-origin actions fail closed with `ORIGIN_BLOCKED` unless allowlisted.
3. Disallowed method fails with `METHOD_NOT_ALLOWED`.
4. Oversized payload fails with `SIZE_LIMIT`.

## 12. UX Specification (Modal + Debug Surfaces)

## 12.1 Modal Composition

Trainer mode must:

1. Render as modal overlay on top of town UI.
2. Reuse existing environment; do not navigate to separate full-page trainer route.
3. Avoid duplicate top-level page header.
4. Avoid duplicate bottom comms panel.
5. Keep ceremony panel minimal:
   - title/context line,
   - canvas + palette,
   - single commit button.

## 12.2 Tool Lab Tab

Required capabilities:

1. List all extracted actions with `explicit|inferred` badge.
2. Show action schema, defaults, runtime substitutions.
3. Let builder edit params and invoke action.
4. Show redacted request/response result.
5. Show evidence produced and freshness age.
6. Show per-action counters:
   - available,
   - invoked,
   - success,
   - last error.

## 12.3 Trace Tab

1. Each trace row supports individual delete via `[x]`.
2. `Clear all` button removes all traces deterministically.
3. Deleted rows are excluded from compare/export views.

## 12.4 Transcript Integrity Panel

Display:

1. orphan tool calls,
2. duplicate result rows,
3. displaced result pairs,
4. synthetic repair count,
5. last N repaired call ids.

## 12.5 Session Context Tab (Reliability Requirement)

1. Must always render one of:
   - valid session payload,
   - explicit fetch/parse error.
2. Must include:
   - active action count,
   - claim gate status,
   - evidence freshness summary,
   - transcript integrity summary.

## 13. LLM Runtime Behavior Contract

1. Inject concise Action Quick Reference each turn:
   - top 5 relevant actions by lexical ranking.
2. If objective implies verification-critical outcome:
   - include required evidence reminder.
3. Enforce act-first policy:
   - call tools before completion language.
4. Emit deterministic audit when blocked:
   - last 3 tool calls with outcomes.
5. No model retraining required for v1.
   - This phase is orchestration, schema, tooling, and guardrails.

## 14. API and Gateway Addenda

Gateway command additions (runtime-facing):

1. `gateway.command.skillActions.list`
2. `gateway.command.skillActions.invoke`
3. `gateway.command.skillActions.evidence`
4. `gateway.command.skillActions.diagnostics`
5. `gateway.command.skillActions.integrity`

Response envelope:

```json
{
  "ok": true,
  "actions": [],
  "evidence": [],
  "diagnostics": [],
  "integrity": {}
}
```

Backward compatibility:

1. Existing worker tools remain.
2. Existing external-agent API endpoints remain.
3. Existing phase tests remain green.

## 15. TDD Implementation Roadmap

Milestone completion rule:

1. New milestone test file passes.
2. All previous milestone files pass.
3. Relevant regression gates pass.

## M0: Fixtures and Contracts

Test: `e2e/84_skill_actions_contract_harness.spec.js`

Acceptance criteria:

1. Skill fixture loader can inject explicit and inferred fixtures.
2. Runtime returns deterministic parser version metadata.
3. Command `skillActions.list` responds within 500ms in local e2e mode.

## M1: Explicit Block Parsing

Test: `e2e/85_skill_actions_explicit_parse.spec.js`

Acceptance criteria:

1. Explicit `skill-actions-v1` returns exact declared actions.
2. Stable IDs and params across repeated imports.
3. Invalid block returns `PARSE_INVALID` and does not crash session.

## M2: Fallback Inference Parsing

Test: `e2e/86_skill_actions_inferred_parse.spec.js`

Acceptance criteria:

1. Prose endpoint definitions are extracted when no explicit block exists.
2. Inferred actions include `source=inferred` and confidence score.
3. Inference is deterministic for same input text.

## M3: Dynamic Tool Registry

Test: `e2e/87_skill_actions_dynamic_registry.spec.js`

Acceptance criteria:

1. `skill_action.*` tools appear in Worker Tools after skill import.
2. Tool set is atomically replaced after switching skill.
3. No stale action tools remain after switch.

## M4: Generic Action Invocation

Test: `e2e/88_skill_actions_invoke_and_validate.spec.js`

Acceptance criteria:

1. Invocation maps to correct HTTP request shape.
2. Success requires `2xx` plus success predicates (`ok: true` or equivalent).
3. Failed predicates return `SUCCESS_RULE_FAILED`.
4. Redacted invocation record is visible in Worker Traffic.

## M5: Evidence Ledger and Freshness

Test: `e2e/89_skill_actions_evidence_ledger.spec.js`

Acceptance criteria:

1. Successful action writes evidence record with timestamp.
2. Evidence expiration marks stale state after `ttlMs`.
3. Evidence query reports freshness age and required missing keys.

## M6: Claim Gate for Verification-Critical Outcomes

Test: `e2e/90_skill_actions_claim_gate.spec.js`

Acceptance criteria:

1. `[[CLAIM:...]]` is blocked when evidence missing/stale.
2. Block emits deterministic format `CLAIM_BLOCKED:<claimId>:<reason>`.
3. Claim passes only with fresh required evidence.
4. `claim.blocked` and `claim.accepted` events are auditable.

## M7: Trainer Tool Lab UX

Test: `e2e/91_trainer_tool_lab_actions.spec.js`

Acceptance criteria:

1. Tool Lab lists action catalog with confidence badges.
2. Builder can parameterize and invoke action from UI.
3. Result and evidence update in UI within 500ms.
4. Usage counters increment deterministically.

## M8: Trace Management Controls

Test: `e2e/92_trainer_trace_delete_clear.spec.js`

Acceptance criteria:

1. Each trace row has working `[x]` delete control.
2. `Clear all` removes all trace rows.
3. Deleted traces do not reappear after panel refresh.

## M9: Session Context Reliability and Integrity Visibility

Test: `e2e/93_session_context_integrity_visibility.spec.js`

Acceptance criteria:

1. Session Context never renders blank.
2. Displays action counts, claim status, evidence freshness.
3. Displays synthetic repair and missing tool-result metrics.

## M10: Modal-Only Ceremony Trainer Layout

Test: `e2e/94_trainer_modal_minimal_layout.spec.js`

Acceptance criteria:

1. Trainer opens as overlay modal over town UI.
2. No duplicated page header in trainer mode.
3. No duplicated bottom comms panel in trainer mode.
4. Ceremony panel contains only required controls (canvas + commit flow).

## M11: Security Guardrails

Test: `e2e/95_skill_actions_security_guards.spec.js`

Acceptance criteria:

1. Cross-origin action blocked by default.
2. Disallowed methods rejected with `METHOD_NOT_ALLOWED`.
3. Oversized body rejected with `SIZE_LIMIT`.
4. Sensitive values are redacted in all debug surfaces.

## M12: Multi-Skill Generalization

Test: `e2e/96_skill_actions_multiskill_generalization.spec.js`

Acceptance criteria:

1. Two unrelated skill fixtures produce different action sets without code changes.
2. Tool Lab and Worker Tools reflect active skill action set immediately.
3. No per-skill backend route/tool hardcoding is introduced.

## M13: Canvas Collaboration Reliability

Test: `e2e/97_canvas_claim_verification_loop.spec.js`

Acceptance criteria:

1. Canvas completion claim is blocked without fresh image/pixel evidence when required by policy.
2. Human-run Tool Lab action can generate missing evidence and unblock claim.
3. Agent response includes reason code when claim was blocked.

## M14: Full Regression Gate

Command: `npm test`

Acceptance criteria:

1. Existing critical suites stay green:
   - `e2e/53_agent_panel_global_presence.spec.js`
   - `e2e/57_phase3_onboarding_wallet_llm_persist.spec.js`
   - `e2e/60_agent_panel_worker_session_context.spec.js`
   - `e2e/73-83` trainer suites
2. New suites `84-97` are green.
3. No regressions in documented API contract behavior.

## 16. Cross-Functional Delivery Plan

## 16.1 Workstreams

1. Runtime and Parser stream:
   - SADC, DATR, GAE, EL, CGE.
2. UX and Frontend stream:
   - modal trainer layout, Tool Lab, integrity panel, trace controls.
3. Security stream:
   - policy engine, redaction, abuse tests.
4. QA stream:
   - deterministic fixtures, milestone tests, regression gates.

## 16.2 Suggested Sequencing

1. Week 1: M0-M4.
2. Week 2: M5-M8.
3. Week 3: M9-M12.
4. Week 4: M13-M14 hardening and release readiness.

## 17. Documentation Deliverables

1. Update `specs/02_api_contract.md` with new gateway command contracts and error codes.
2. Update `public/skill.md` with optional `skill-actions-v1` guidance and examples.
3. Update `docs/internal-skill-testline.md` mapping:
   - capability -> test file -> acceptance criteria.
4. Add operator note describing synthetic transcript repair semantics for builders.

## 18. Release Readiness Checklist

1. Full test suite green.
2. Security acceptance floor passed.
3. Modal minimal UX accepted by product owner.
4. Session Context reliability verified under transient failure simulation.
5. Claim gating validated for at least one visual and one non-visual task.
6. No hardcoded per-skill backend adapters introduced.

## 19. Definition of Done

This phase is done when all are true:

1. Any new `skill.md` can produce executable, visible actions without code changes per skill.
2. Builders can run those actions directly in trainer and show results to the agent.
3. Agent can explain non-usage via deterministic reason codes.
4. Verification-critical completion claims are evidence-backed.
5. Trainer remains modal, minimal, and non-duplicative.
6. Security policy and redaction controls are enforced and tested.
7. All milestone and regression tests pass.
