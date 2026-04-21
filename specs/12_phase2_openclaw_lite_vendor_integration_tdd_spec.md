# Phase 2 Spec: Vendor OpenClaw Lite Integration (TDD)

Status: Draft  
Audience: AI developers implementing this repo end-to-end  
Goal: replace the temporary in-app Lite automation with the real OpenClaw Lite runtime from `vendors/openclaw-lite-main`, while preserving deterministic Playwright verification.

## 1. Product intent (Phase 2)

Phase 2 MUST deliver:

1. The single-path Phase 1 UX remains:
   - Landing: logo, `Welcome to the Wild West!`, `Sign in`, `Sign up`, optional video slot.
   - Hatch -> sigil touch -> open press -> create -> ceremony -> house unlock.
2. The co-op partner is the **vendor OpenClaw Lite runtime**, not server-side autopilot logic.
3. User must configure the LLM for OpenClaw Lite before runtime-driven co-op actions begin.
4. Wallet existing-house detection still short-circuits to `/house?house=<id>`.
5. External agent API compatibility remains for migration/regression.

## 2. Hard constraints

1. Source of truth for Lite runtime is `vendors/openclaw-lite-main`.
2. No external identity providers; session-cookie model remains unchanged.
3. No external network dependency in e2e tests.
4. Preserve crypto boundaries:
   - server never receives plaintext `K_root`
   - ceremony reveal payloads remain sealed envelopes
5. Keep UI minimal.
6. Keep Playwright deterministic.

## 3. Out of scope

1. Full town/gateway UX from vendor app.
2. LLM productization or hosted model setup.
3. Replacing house cryptography or inbox protocol.

## 4. Integration contract

## 4.1 Runtime provenance contract (required)

Phase 2 MUST add a reproducible vendor build bridge:

1. A repo-local build step produces runtime assets in this app from vendor source.
2. A manifest is emitted and served at `/openclaw-lite/manifest.json` containing at minimum:
   - `vendorPath`
   - `vendorVersion`
   - `buildTime`
   - `entrypoints` (`gateway`, `worker`)
3. Runtime assets are loaded by landing flow only through the built vendor artifacts.

## 4.2 Runtime state contract (required)

`GET /api/state` MUST include:

```json
{
  "lite": {
    "driver": "phase1|vendor",
    "runtimeReady": false,
    "llmConfigured": false,
    "llmProvider": null,
    "llmModel": null,
    "runtimeVersion": null,
    "lastError": null
  }
}
```

Minimum semantics:

1. `lite.driver` identifies active implementation.
2. `lite.runtimeReady=true` only when vendor runtime is booted, connected, and LLM-configured.
3. `lite.runtimeVersion` maps to vendor manifest version.
4. `lite.llmConfigured=true` only after explicit user save action.
5. API key material must never be returned in `/api/state`.

## 4.3 Runtime config endpoint (required)

`GET /api/agent/lite/runtime` MUST return a deterministic runtime bootstrap payload:

1. current `teamCode`
2. allowed API base/origin
3. feature flags needed by runtime bridge
4. resolved runtime version info from manifest

## 4.4 Action ownership contract (required)

When `lite.driver="vendor"`:

1. Sigil match is performed by runtime through `POST /api/agent/select` (or equivalent adapter call), not server auto-mirroring.
2. Open press completion is performed by runtime through `POST /api/agent/open/press`.
3. Runtime contributes canvas paint through `POST /api/agent/canvas/paint`.
4. Runtime contributes ceremony material through:
   - `POST /api/agent/house/commit`
   - `POST /api/agent/house/reveal`

Backward compatibility:

1. Existing external-agent endpoints remain available.
2. A deterministic fallback mode (`phase1`) can be selected for regression isolation.

## 4.5 LLM configuration contract (required)

Phase 2 MUST expose an explicit user configuration step for LLM runtime credentials.

Required UI test ids:

1. `lite-llm-panel`
2. `lite-llm-provider`
3. `lite-llm-model`
4. `lite-llm-api-key`
5. `lite-llm-save`
6. `lite-llm-status`

Required API:

1. `POST /api/agent/lite/llm/config` (legacy in later revisions; replaced by client-only config plus `POST /api/onboarding/brain/complete`)
2. `GET /api/agent/lite/llm/config` (legacy compatibility probe only in later revisions)

Rules:

1. Before LLM config save: runtime may be booted but not action-ready (`lite.runtimeReady=false`).
2. After successful save: the browser keeps the LLM config locally; later revisions advance onboarding with a config-free completion route instead of sending config to the backend.
3. `GET` responses and `/api/state` MUST NOT expose raw API key (only boolean/metadata).
4. In test mode, a deterministic non-network provider profile must be supported (for example `provider=test-local`, `model=deterministic`).

## 4.6 Deterministic test mode contract (required)

1. E2E mode must run without external network.
2. Runtime behavior for sigil/open/canvas/ceremony must be bounded by fixed timeouts.
3. Tests may intercept network and assert exact API call ordering.
4. Reset endpoint remains mandatory before each test.

## 5. Milestones (test-driven)

Each milestone is complete only when:

1. its test file is green
2. all previous milestone files remain green

## M0: Harness + Driver Contract

Test file: `e2e/40_phase2_vendor_harness_contract.spec.js`

Acceptance criteria:

1. `/api/state.lite.driver` exists and is either `phase1` or `vendor`.
2. `/api/state.lite.runtimeReady` defaults to `false` after reset.
3. `/api/agent/lite/runtime` returns `ok: true`, `teamCode`, and runtime metadata.

## M1: Vendor Build Provenance

Test file: `e2e/41_phase2_vendor_bundle_provenance.spec.js`

Acceptance criteria:

1. `/openclaw-lite/manifest.json` exists and contains required fields.
2. `gateway` and `worker` assets referenced by manifest are served with `200`.
3. Bundle content does not include known test mocks (`openclaw-lite-mock`, `So1anaMock`).
4. Manifest `vendorVersion` is non-empty and matches vendored package metadata.

## M2: LLM Config + Runtime Bootstrap in Hatch Flow

Test file: `e2e/42_phase2_vendor_bootstrap.spec.js`

Acceptance criteria:

1. After `hatch-btn`, LLM config controls are visible.
2. Before save: `/api/state.lite.llmConfigured === false` and `/api/state.lite.runtimeReady === false`.
3. Saving provider/model/key transitions runtime to ready within 2000ms.
4. `lite-agent-status` displays connected state.
5. `/api/state.lite.llmConfigured === true` and provider/model are recorded.
6. Raw API key is not returned in `/api/state`.

## M3: Sigil Match Driven by Vendor Runtime

Test file: `e2e/43_phase2_vendor_sigil_match.spec.js`

Acceptance criteria:

1. Human chooses one sigil.
2. Runtime issues agent-select call within 2000ms.
3. `match-status` becomes `UNLOCKED`.
4. `open-btn` becomes enabled.
5. Match is not achieved before runtime agent action is observed.

## M4: Open Press Driven by Vendor Runtime

Test file: `e2e/44_phase2_vendor_open_press.spec.js`

Acceptance criteria:

1. Human clicks `open-btn`.
2. Runtime issues agent open-press within 2000ms.
3. Session signup is complete.
4. Browser navigates to `/create`.

## M5: Canvas Co-creation via Runtime

Test file: `e2e/45_phase2_vendor_canvas.spec.js`

Acceptance criteria:

1. Human paint is visible immediately.
2. Runtime paint contribution appears within 2000ms.
3. At least one non-human pixel is set by agent-side API action.

## M6: Ceremony + House Generation via Runtime

Test file: `e2e/46_phase2_vendor_ceremony.spec.js`

Acceptance criteria:

1. Runtime sends agent commit and reveal (sealed envelope only).
2. `Generate house key` succeeds and redirects to `/house?house=<id>`.
3. `/api/house/:id/meta` remains accessible with valid house-auth headers.

## M7: Wallet Existing-House Recovery Path

Test file: `e2e/47_phase2_vendor_wallet_recovery.spec.js`

Acceptance criteria:

1. Wallet with existing house mapping redirects to `/house?house=<id>` within 2000ms.
2. Wallet without mapping stays in hatch flow with hatch controls visible.
3. Runtime bootstrap does not break wallet lookup sequencing (`nonce` then `lookup`).

## M8: External-Agent Compatibility Gate

Test file: `e2e/48_phase2_external_agent_compat.spec.js`

Acceptance criteria:

1. External agent endpoints still perform connect/select/open successfully.
2. Legacy API flow can complete co-op unlock when vendor runtime driver is disabled.
3. No API contract regressions for `/api/agent/connect|select|open/press`.

## M9: Security + Determinism Gate

Test file: `e2e/49_phase2_vendor_security_determinism.spec.js`

Acceptance criteria:

1. Hatch->house happy path runs with zero outbound non-local network requests.
2. Runtime failures surface a clear UI status (`lite.lastError` + visible status text).
3. No plaintext ceremony reveal accepted by server.

## M10: Full Suite Gate

Command: `npm test`

Acceptance criteria:

1. All Phase 2 files (`40-51`) pass.
2. Phase 1 files (`30-39`) remain green.
3. Critical legacy regressions remain green:
   - co-op unlock/create/house
   - house auth append path
   - inbox navigation path

## M11: Runtime Bridge Ownership Gate

Test files:
- `e2e/50_phase2_runtime_bridge_boot.spec.js`
- `e2e/51_phase2_runtime_action_ownership.spec.js`

Acceptance criteria:

1. Vendor runtime bridge loads worker assets and remains bootstrapped in vendor driver mode.
2. Sigil, open press, canvas contribution, and ceremony commit/reveal are initiated through runtime bridge ownership.
3. End-to-end house generation still succeeds with no regression in state contracts.

## 6. AI developer execution protocol

For each milestone:

1. Write/adjust Playwright test first (red).
2. Implement minimal code change (green).
3. Refactor without behavior drift.
4. Re-run:
   - current milestone
   - all previous milestone files
   - full suite at M5, M8, M10, M11.

No milestone is complete without:

1. green tests
2. updated API documentation
3. readable integration notes for future agent maintainers

## 7. Definition of done (Phase 2)

Phase 2 is done when:

1. Vendor OpenClaw Lite runtime is the active co-op driver in happy path.
2. Phase 1 UX contract remains intact.
3. External-agent compatibility is preserved.
4. Phase 2 milestones and full suite gates pass.
5. `specs/02_api_contract.md` and `skill.md` are updated for the integrated runtime path.
