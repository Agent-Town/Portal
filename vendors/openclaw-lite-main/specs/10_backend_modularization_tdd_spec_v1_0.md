# OpenClaw Lite — Backend Modularization TDD Spec v1.0

**Status:** Draft (normative for Finding #1 remediation)  
**Version:** 1.0.0  
**Audience:** AI developers implementing server modularization via test-first workflow  
**Scope:** Refactor `server/index.js` into focused modules without changing user-visible behavior

This spec targets finding:
- `[P3] Backend is over-concentrated in a single security-critical module`

It extends:
- `specs/04_tdd_milestones.md`
- `specs/02_api_contract.md` (API behavior MUST remain compatible unless explicitly updated)

---

## 0) Goals and constraints

### 0.1 Primary goal (MUST)

Reduce concentration risk by splitting backend responsibilities into isolated modules/routers while preserving behavior.

### 0.2 Constraints (MUST)

- Do not break existing API contract (`specs/02_api_contract.md`) during refactor.
- Keep existing Playwright suites passing as milestones progress.
- Keep runtime security headers and approval/security semantics unchanged unless separately specified.
- Use small, reviewable steps with one measurable outcome per new test.

### 0.3 Non-goals (for this track)

- No new product features.
- No redesign of browser runtime flow.
- No wallet/LLM mock introduction.

---

## 1) Target module boundaries

By the end of this track, backend code SHOULD follow this shape:

- `server/index.js`: process bootstrap only (wiring + listen).
- `server/app.js`: app factory and top-level middleware composition.
- `server/routes/tools.js`: `/api/tools/*` endpoints and helpers.
- `server/routes/llm.js`: `/api/llm/openai/v1/*` endpoints and helpers.
- `server/routes/house.js`: house/wallet/session-bound route handlers.
- `server/session.js`: session store + cookie/session helpers.
- `server/routes/test_only.js`: `NODE_ENV=test` fixtures and reset routes.
- `server/test_ws.js`: websocket fixture bootstrap for test mode.

Exact filenames may vary, but boundaries and measurable outcomes MUST hold.

---

## 2) TDD protocol (MUST)

For each milestone:
1. Add the new milestone test file with failing assertions first.
2. Run only that test file and confirm failure.
3. Implement the smallest refactor to satisfy the test.
4. Re-run the milestone test and the milestone regression subset.
5. Commit when green.

Recommended command pattern:
```bash
npx playwright test e2e/openclaw_lite/<milestone_file>.spec.js
```

---

## 3) Milestones (M24-M29)

## M24 — Bootstrap Split

### Test file
- `e2e/openclaw_lite/26_backend_bootstrap_split.spec.js`

### Measurable outcomes
- `server/app.js` (or equivalent app factory module) exists.
- `server/index.js` line count is `<= 1700`.
- `GET /api/health` still returns `200` and `{ ok: true }`.

### Minimal implementation intent
- Extract app construction from `server/index.js` into a factory module.
- Keep route behavior unchanged.

### Regression subset
- `e2e/openclaw_lite/01_gateway_boot.spec.js`
- `e2e/openclaw_lite/10_tools_runtime_boot.spec.js`

---

## M25 — Session Isolation

### Test file
- `e2e/openclaw_lite/27_backend_session_module.spec.js`

### Measurable outcomes
- Dedicated session module exists (`server/session.js` or equivalent).
- `server/index.js` no longer defines `sessionsById` directly.
- `server/index.js` line count is `<= 1450`.
- Session cookie roundtrip still works:
  - first session-bound request sets `et_session`,
  - second request in same context reuses session.

### Minimal implementation intent
- Move session map/TTL/ensure logic into session module.
- Inject session helper into routes that require it.

### Regression subset
- `e2e/openclaw_lite/04_house_ceremony_and_append.spec.js`
- `e2e/openclaw_lite/06_device_loss_restore.spec.js`

---

## M26 — Tool Proxy Router Extraction

### Test file
- `e2e/openclaw_lite/28_backend_tools_router_split.spec.js`

### Measurable outcomes
- Dedicated tools router module exists.
- `server/index.js` no longer defines:
  - `executeWebFetchProxy`
  - `executeHttpRequestProxy`
- `server/index.js` line count is `<= 1200`.
- Behavior parity checks:
  - `POST /api/tools/web_fetch` invalid payload -> `400` + `INVALID_ARGUMENTS`
  - `POST /api/tools/http_request` invalid payload -> `400` + `INVALID_ARGUMENTS`

### Minimal implementation intent
- Move tools endpoints + helper functions into isolated router.
- Keep existing request/response envelopes unchanged.

### Regression subset
- `e2e/openclaw_lite/12_web_fetch.spec.js`
- `e2e/openclaw_lite/13_http_request_tool.spec.js`

---

## M27 — LLM Router Extraction

### Test file
- `e2e/openclaw_lite/29_backend_llm_router_split.spec.js`

### Measurable outcomes
- Dedicated LLM router module exists.
- `server/index.js` no longer defines `proxyToOpenAI`.
- `server/index.js` line count is `<= 950`.
- Test-mode behavior parity:
  - `POST /api/llm/openai/v1/chat/completions` returns SSE with `[DONE]`.
  - `POST /api/llm/openai/v1/responses` returns `501` + `TEST_RESPONSES_NOT_IMPLEMENTED` in `NODE_ENV=test`.

### Minimal implementation intent
- Move LLM proxy + test handlers into LLM module.
- Preserve auth and streaming behavior.

### Regression subset
- `e2e/openclaw_lite/09_pi_ai_llm_integration.spec.js`
- `e2e/openclaw_lite/17_tool_transcript_compat.spec.js`

---

## M28 — House/Wallet Route Extraction

### Test file
- `e2e/openclaw_lite/30_backend_house_router_split.spec.js`

### Measurable outcomes
- Dedicated house/wallet router module exists.
- `server/index.js` no longer defines:
  - `verifyHouseAuth`
  - wallet nonce/lookup handlers
- `server/index.js` line count is `<= 700`.
- Behavior parity checks for house/wallet flow remain green.

### Minimal implementation intent
- Move house + wallet handlers and helpers into dedicated module.
- Keep signature verification and auth checks intact.

### Regression subset
- `e2e/openclaw_lite/04_house_ceremony_and_append.spec.js`
- `e2e/openclaw_lite/05_vault_backup_roundtrip.spec.js`
- `e2e/openclaw_lite/06_device_loss_restore.spec.js`

---

## M29 — Test Surface Isolation + Final Budget

### Test file
- `e2e/openclaw_lite/31_backend_final_modularity_gate.spec.js`

### Measurable outcomes
- Test-only routes are isolated behind `NODE_ENV=test`.
- Production-mode server returns `404` for `/__test__/reset`.
- `server/index.js` line count is `<= 450`.
- No single server runtime module exceeds `900` lines.
- Route parity is preserved across core endpoints:
  - `/api/health`
  - `/api/runtime/capabilities`
  - `/api/tools/web_fetch`
  - `/api/tools/http_request`
  - `/api/llm/openai/v1/chat/completions`

### Minimal implementation intent
- Move remaining test fixtures/ws helpers out of index bootstrap.
- Keep index as composition root only.

### Regression subset
- `npm test`

---

## 4) Definition of done for this finding

Finding #1 is considered remediated only when:

- Milestones M24-M29 tests are all green.
- Existing suite remains green (`npm test`).
- `server/index.js` acts as bootstrap/composition root, not feature implementation container.
- Module boundaries in Section 1 are represented in code and reviewable in isolation.

---

## 5) AI implementation notes

- Favor pure extraction first; avoid behavioral edits in the same commit unless required by tests.
- Keep each milestone PR small (target: one module extraction + one new test file).
- If API behavior intentionally changes, update:
  - `specs/02_api_contract.md`
  - affected milestone tests
  - changelog/PR notes with explicit migration statement
