# Phase 1 Spec: OpenClaw Lite Single-Path Flow (TDD)

Status: Draft  
Audience: AI developers implementing this repo end-to-end  
Primary objective: replace the multi-path landing with a single OpenClaw Lite path while preserving the proven co-op mechanics after hatch.

## 1. Product intent (Phase 1 only)

Phase 1 MUST deliver this user flow:

1. Landing shows only:
   - logo
   - `Welcome to the Wild West!`
   - `Sign in` and `Sign up` actions
   - optional video slot
2. User enters hatch flow.
3. If user wallet already maps to a house+agent profile, route directly to house.
4. If no existing profile, hatch OpenClaw Lite in-browser.
5. After hatch, run the existing co-op sequence:
   - sigil touch/match
   - open press
   - create/canvas
   - key ceremony
   - house generation and unlock

No external AI operator is required in the happy path. The in-browser OpenClaw Lite agent is the co-op partner.

## 2. Hard constraints

1. Keep UI minimal and single-purpose.
2. Keep session-cookie identity model. No external identity providers.
3. Keep deterministic Playwright testability.
4. Keep crypto boundaries unchanged:
   - server never gets raw `K_root`
   - ceremony reveal material stays sealed as already specified
5. Do not break house/inbox/share core regressions.

## 3. Out of scope for Phase 1

1. Full vendor `openclaw-lite-main` runtime parity.
2. New points, dashboards, or gamification layers.
3. Replacing existing house cryptography.
4. Replacing all legacy endpoints in this phase.

## 4. Implementation contract for AI developers

## 4.1 State model deltas (required)

`GET /api/state` MUST include:

```json
{
  "hatch": {
    "complete": false,
    "createdAt": null,
    "agentKind": null
  },
  "agent": {
    "connected": false,
    "source": "external|openclaw-lite|null"
  }
}
```

Minimum semantics:

1. `hatch.complete=true` gates entry to sigil/open/create sequence.
2. `agent.source="openclaw-lite"` indicates local in-browser agent is active.

## 4.2 API additions (required)

Phase 1 MUST add these endpoints:

1. `POST /api/hatch/complete`
   - Marks hatch completion for current human session.
   - Sets `hatch.complete=true`, `hatch.agentKind="openclaw-lite"`.
2. `POST /api/agent/lite/connect`
   - Connects local agent to current human session.
   - Sets `agent.connected=true`, `agent.source="openclaw-lite"`.

Backward compatibility requirement:

1. Existing external-agent endpoints (`/api/agent/connect`, `/api/agent/select`, `/api/agent/open/press`) MUST continue to work for regression and migration.

## 4.3 UI test-id contract (required)

Phase 1 UI MUST provide stable selectors:

1. `landing-title`
2. `auth-signin`
3. `auth-signup`
4. `landing-video` (if video is rendered)
5. `hatch-panel`
6. `hatch-btn`
7. `hatch-status`
8. `lite-agent-status`
9. Existing co-op ids remain valid once hatch is complete:
   - `sigil-*`
   - `match-status`
   - `open-btn`
   - `share-btn`

Legacy path selectors MUST be removed from DOM:

1. `path-human`
2. `path-coop`
3. `path-agent`

## 4.4 Test determinism rules (required)

1. Every Phase 1 e2e test MUST reset state via `POST /__test__/reset`.
2. Time-based expectations MUST use explicit upper bounds.
3. Wallet interactions in e2e MUST use deterministic wallet mocks or deterministic test wallets.
4. No test may depend on external network availability.

## 5. Milestones (test-driven)

Each milestone is done only when its test file is green and all prior milestone tests remain green.

## M0: Test Harness + Contracts

Test file: `e2e/30_phase1_harness_contract.spec.js`

Acceptance criteria:

1. Reset endpoint clears state (`/__test__/reset` returns `ok: true`).
2. New `api/state` fields exist with default values:
   - `hatch.complete === false`
   - `hatch.agentKind === null`
   - `agent.source === null` or missing (temporary compatibility is acceptable only before M3).
3. Test fails if fields are missing after M3 implementation is merged.

## M1: Minimal Landing

Test file: `e2e/31_phase1_landing_minimal.spec.js`

Acceptance criteria:

1. `GET /` renders `landing-title` with exact text `Welcome to the Wild West!`.
2. `auth-signin` and `auth-signup` are visible within 1000ms.
3. Legacy path controls are absent:
   - no element with `path-human`, `path-coop`, `path-agent`.
4. Sigil and open controls are hidden before hatch.

## M2: Auth Intent Transition

Test file: `e2e/32_phase1_auth_intent.spec.js`

Acceptance criteria:

1. Clicking `auth-signin` reveals `hatch-panel` within 500ms.
2. Clicking `auth-signup` reveals `hatch-panel` within 500ms.
3. Both buttons lead to the same hatch state machine (same visible hatch controls).
4. Reload preserves hatch-step visibility for the current session.

## M3: Wallet Existing-Profile Check

Test file: `e2e/33_phase1_wallet_profile_check.spec.js`

Acceptance criteria:

1. In hatch flow, wallet connect triggers nonce + lookup sequence.
2. For wallet with existing house mapping:
   - browser redirects to `/house?house=<id>` within 2000ms.
3. For wallet without mapping:
   - user remains on hatch flow and sees hatch controls.

## M4: Hatch Completion Gate

Test file: `e2e/34_phase1_hatch_gate.spec.js`

Acceptance criteria:

1. Before hatch completion:
   - sigil grid hidden
   - open button hidden or disabled.
2. Clicking `hatch-btn` marks `hatch.complete=true` via API.
3. `hatch-status` shows completion within 1000ms.
4. `api/state.hatch.agentKind === "openclaw-lite"`.

## M5: Local Agent Connect

Test file: `e2e/35_phase1_lite_agent_connect.spec.js`

Acceptance criteria:

1. After hatch complete, local agent connects automatically or via explicit action.
2. `lite-agent-status` shows connected state within 2000ms.
3. `api/state.agent.connected === true`.
4. `api/state.agent.source === "openclaw-lite"`.

## M6: Sigil Match with Local Agent

Test file: `e2e/36_phase1_lite_agent_sigil_match.spec.js`

Acceptance criteria:

1. Human selects one sigil.
2. Local agent selects same sigil within 2000ms.
3. `match-status` transitions to `UNLOCKED`.
4. `open-btn` becomes enabled.

## M7: Open Press with Local Agent

Test file: `e2e/37_phase1_lite_agent_open_press.spec.js`

Acceptance criteria:

1. Human presses `open-btn`.
2. Local agent performs open-press within 2000ms.
3. Session signup is complete.
4. Browser navigates to `/create`.

## M8: Create + Ceremony + House Generation Regression

Test file: `e2e/38_phase1_create_ceremony_regression.spec.js`

Acceptance criteria:

1. Human pixel paint is visible.
2. Local agent pixel contribution is visible.
3. House generation succeeds and redirects to `/house?house=<id>`.
4. House metadata endpoint remains accessible with house-auth.

## M9: House Unlock + Inbox Navigation Regression

Test file: `e2e/39_phase1_house_unlock_regression.spec.js`

Acceptance criteria:

1. Wallet unlock still works using existing unlock flow.
2. Inbox link remains correct for unlocked house.
3. Reload and lock/unlock transitions do not lose house navigation context.

## M10: Full Suite Gate

Command: `npm test`

Acceptance criteria:

1. All Phase 1 test files pass.
2. No legacy-path UI test remains that depends on `path-human|path-coop|path-agent`.
3. Existing non-Phase-1 critical regressions still pass:
   - create/house/share path
   - house auth + encrypted append path
   - inbox visibility path

## 6. Milestone execution protocol (AI developer workflow)

For each milestone:

1. Write/adjust the Playwright test first (red).
2. Implement smallest code change to satisfy the test (green).
3. Refactor without changing behavior.
4. Re-run:
   - milestone test file
   - all previous milestone files
   - then `npm test` at milestone boundaries M5, M8, M10.

No milestone is complete without green tests and updated docs for changed contracts.

## 7. Definition of done (Phase 1)

Phase 1 is done when:

1. Single-path landing + hatch flow is live in `/`.
2. In-browser OpenClaw Lite agent replaces external agent in happy path.
3. Post-hatch co-op flow (sigil/open/create/ceremony/house unlock) is preserved.
4. All milestone acceptance criteria and full test gate pass.
5. API contract updates are reflected in `specs/02_api_contract.md`.
