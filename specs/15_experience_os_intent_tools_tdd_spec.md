# Phase 5 Spec: Experience OS Intent Tools (State + UI) (TDD)

Status: Draft  
Version: 1.0  
Audience: runtime engineers, frontend engineers, backend engineers, QA automation engineers  
Goal: define a reusable "experience OS" where the agent can safely manipulate application state and visible UI through explicit tools, with deterministic behavior and Playwright coverage.

Implementation constraints:

1. Keep worker-first architecture. Agent reasoning remains in browser worker/runtime.
2. Keep modal-first UX so worker context is not lost by page replacement.
3. Do not allow arbitrary DOM selector access from tools.
4. Keep deterministic testability for all new capabilities.

## 1. Executive Summary

This spec introduces two explicit tool families in `public/skill.md`:

1. `agent_town_state_*`: state/data tools backed by existing backend APIs.
2. `agent_town_ui_*`: browser intent tools that manipulate visible UI through a strict intent dispatcher.

The dispatcher is whitelist-only and deterministic:

1. no raw DOM control,
2. no unrestricted selectors,
3. stable response envelope:
   - `{ ok, applied, stateSnapshot?, error? }`.

This creates a reusable platform pattern for future experiences:

1. add or evolve tool definitions in `skill.md`,
2. implement intent handlers in one dispatcher,
3. add Playwright tests that prove behavior end-to-end.

## 2. Product Goals

1. Agent can open key experiences (Atlas, Pony, Town Hall, etc.) without leaving `/app`.
2. Agent can execute scoped UI actions (Atlas search/filter, Pony compose prefill) through tools.
3. Agent can read state through deterministic data tools before/after UI actions.
4. Worker remains connected during UI actions and modal transitions.

## 3. Non-Goals

1. No generic "execute JavaScript" or arbitrary DOM mutation tools.
2. No backend route that directly "opens a modal" server-side.
3. No bypass of user consent for irreversible actions.
4. No full-page route navigation as the primary control path.

## 4. Architecture

## 4.1 Tool Families

Family A: `agent_town_state_*`

1. Read or mutate backend state through explicit API contracts.
2. Transport is HTTP and existing server routes.
3. Used for session/co-op/house/pony data and workflow context checks.

Family B: `agent_town_ui_*`

1. Dispatches browser intents through a single local intent bus/dispatcher.
2. Dispatcher calls existing modal/router/UI functions.
3. No selector arguments, no node references, no HTML payloads.

## 4.2 Runtime Boundaries

1. Worker decides what tool to call.
2. State tool calls hit backend APIs.
3. UI tool calls hit client intent dispatcher and update UI state.
4. Dispatcher returns deterministic result snapshot to worker.

## 4.3 Modal Continuity Rule

All experience transitions controlled by `agent_town_ui_*` MUST preserve runtime continuity:

1. prefer modal/iframe presentation in `/app`,
2. avoid full page swap that would reset worker JS context,
3. maintain connected agent session identity.

## 5. Skill Contract Changes (`public/skill.md`)

Add a new section:

1. `## Experience Tools (State + UI)`

Define explicit tools and parameters for at least:

1. `agent_town_ui_open_modal({ modal, params })`
2. `agent_town_ui_atlas_search({ q, family, searchType })`
3. `agent_town_ui_registry_search({ q, family })`
4. `agent_town_ui_web_open({ webSessionId, sessionId, url, title })`
5. `agent_town_ui_pony_compose({ toHouseId, subject, draft })`
6. selected `agent_town_state_*` tools listed in section 7.

Tool docs in `skill.md` must include:

1. purpose,
2. required/optional params,
3. deterministic success conditions,
4. explicit non-capabilities (for UI tools: no arbitrary DOM).

## 6. UI Intent Dispatcher Contract

## 6.1 Dispatcher Interface

Create one dispatcher entrypoint in frontend runtime:

1. `dispatchExperienceIntent(intentType, payload)`

The only accepted `intentType` values are from a static whitelist.

## 6.2 Deterministic Response Envelope

All `agent_town_ui_*` tools return:

```json
{
  "ok": true,
  "applied": true,
  "stateSnapshot": {
    "path": "/app",
    "activeDistrict": "atlas",
    "modal": {
      "open": true,
      "title": "Atlas Depot"
    }
  },
  "error": null
}
```

Failure example:

```json
{
  "ok": false,
  "applied": false,
  "stateSnapshot": {
    "path": "/app",
    "activeDistrict": "atlas",
    "modal": {
      "open": true,
      "title": "Atlas Depot"
    }
  },
  "error": {
    "code": "UI_INTENT_INVALID_PARAM",
    "message": "family must be one of: all, ethereum, monad, base, gnosis"
  }
}
```

## 6.3 State Snapshot Minimum Fields

1. `path`
2. `activeDistrict`
3. `modal.open`
4. `modal.title`
5. `worker.connected`
6. `worker.teamCode` (redacted/short form allowed)
7. intent-specific fields:
   - Atlas: `atlas.query`, `atlas.family`, `atlas.searchType`
   - Pony compose: `pony.composeOpen`, `pony.composeTo`, `pony.subject`

## 6.4 Error Codes (UI)

1. `UI_INTENT_UNKNOWN`
2. `UI_INTENT_INVALID_PARAM`
3. `UI_INTENT_UNAVAILABLE`
4. `UI_INTENT_BLOCKED_BY_POLICY`
5. `UI_INTENT_INTERNAL`

## 6.5 Explicit Prohibitions

The dispatcher MUST reject:

1. CSS selectors as parameters,
2. raw HTML insertion,
3. arbitrary JS expressions,
4. direct mutation of nodes outside whitelisted handlers.

## 7. Tool Contracts v1

## 7.1 UI Tools

### `agent_town_ui_open_modal`

Input:

```json
{
  "modal": "atlas|registry|poker|pony|townhall|saloon|leaderboard|house|brain|sigil",
  "params": {
    "district": "optional",
    "agent": "optional"
  }
}
```

Behavior:

1. Opens selected modal in current `/app` experience.
2. Must not hard-navigate away from `/app`.
3. `registry` and `poker` render through the modal iframe/embed path so the worker runtime stays on the hub page.

### `agent_town_ui_atlas_search`

Input:

```json
{
  "q": "string",
  "family": "all|ethereum|monad|base|gnosis",
  "searchType": "keyword|semantic"
}
```

Behavior:

1. Ensures Atlas modal is open.
2. Applies filter/search state through existing Atlas UI state model.
3. Returns snapshot containing active Atlas filter state.

### `agent_town_ui_web_open`

Input:

```json
{
  "webSessionId": "optional we_* id",
  "sessionId": "optional alias for webSessionId",
  "url": "optional http(s) URL or same-origin relative path",
  "title": "optional string"
}
```

Behavior:

1. Opens a Web target inside the hub modal frame without replacing `/app`.
2. Accepts either a durable Web session id or a direct URL.
3. Returns snapshot containing the stable Web target state.

### `agent_town_ui_pony_compose`

Input:

```json
{
  "toHouseId": "optional string",
  "subject": "optional string",
  "draft": "optional string"
}
```

Behavior:

1. Ensures Pony modal is open.
2. Opens compose view.
3. Prefills fields with validated content.

## 7.2 State Tools (Initial Set)

### `agent_town_ui_registry_search`

Purpose:
- open Registry in the town hub modal flow
- apply registry discovery query/filter state without mutating Atlas search state

Allowed params:
- `q` (string, optional)
- `family` (string, optional)

Contract:
- current path remains `/app`
- modal title becomes `Registry`
- Atlas snapshot state is preserved unless an Atlas tool is called explicitly

### `agent_town_state_get_session`

Maps to `GET /api/session`.

### `agent_town_state_get_agent_state`

Maps to `GET /api/agent/state?teamCode=...`.

### `agent_town_state_get_house_context`

Maps to `GET /api/house/:id/meta` or current house context endpoint.

### `agent_town_state_get_pony_inbox`

Maps to `GET /api/pony/inbox?houseId=...`.

### `agent_town_state_get_registry_entity`

Maps to `GET /api/registry/entities/:id`.

Required durable fields:

1. `registryId`
2. `entityVersionId`

### `agent_town_state_get_web_session`

Maps to `GET /api/web/sessions/:id`.

Required durable fields:

1. `sessionId`
2. `lastCheckpointIdentity`

State tool envelope:

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

## 8. Confirmation Policy Matrix

No confirmation required:

1. view/navigation intents (`open_modal`, `atlas_search`, `registry_search`, `web_open`, `pony_compose`),
2. read-only state tools.

Confirmation required:

1. wallet signing,
2. publishing/posting externally,
3. destructive writes (delete/clear/overwrite),
4. irreversible onchain actions.

When confirmation is required, response MUST be deterministic:

1. `ok: false`,
2. `applied: false`,
3. `error.code: "CONFIRMATION_REQUIRED"`.

## 9. Security and Safety Requirements

1. Validate all tool params against JSON schema.
2. Enforce enum constraints for modal names and filter values.
3. Enforce max lengths for `subject`, `draft`, and `q`.
4. Redact sensitive values in debug traces.
5. Rate limit UI intents per turn/session to prevent runaway loops.

## 10. Observability Requirements

1. Worker Tools tab shows both tool families.
2. Worker Traffic tab shows every intent call and response.
3. Session Context tab reflects snapshot fields returned from UI intents.
4. Deterministic reason codes shown for blocked intents.

## 11. TDD Plan (Playwright First, Measurable AC per Test)

Every AI-developer test in this phase MUST include explicit measurable acceptance criteria with stable, binary pass/fail assertions.

Suggested test files:

1. `e2e/58_experience_intent_open_modal.spec.js`
2. `e2e/59_experience_intent_atlas_search.spec.js`
3. `e2e/60_experience_intent_pony_compose.spec.js`
4. `e2e/61_experience_intent_worker_continuity.spec.js`
5. `e2e/172_web_tool_state_surface.spec.js`

Required acceptance criteria:

### Test 58: intent opens modal without route change

1. AC-58.1: After `agent_town_ui_open_modal({ modal: "atlas" })`, `window.location.pathname === "/app"`.
2. AC-58.2: `#districtModalBackdrop` is visible within 2000ms.
3. AC-58.3: `#districtModalTitle` text equals `Atlas Depot`.
4. AC-58.4: Tool response contains `ok === true`, `applied === true`, and `stateSnapshot.modal.open === true`.
5. AC-58.5: Tool response `error === null`.

### Test 59: intent executes Atlas query in modal

1. AC-59.1: After `agent_town_ui_atlas_search({ q: "sentinel", family: "ethereum", searchType: "keyword" })`, Atlas modal is visible and focused.
2. AC-59.2: Atlas UI inputs reflect exact requested state:
   - search input value is `sentinel`,
   - family select value is `ethereum`,
   - search type value is `keyword`.
3. AC-59.3: District/storefront list reflects filter deterministically in fixture data:
   - Ethereum entry present,
   - non-matching family entry (for example Monad) absent.
4. AC-59.4: Tool response includes `stateSnapshot.atlas.query === "sentinel"` and `stateSnapshot.atlas.family === "ethereum"`.

### Test 60: intent opens Pony compose with prefilled draft

1. AC-60.1: After `agent_town_ui_pony_compose({ toHouseId, subject, draft })`, Pony modal is visible within 2000ms.
2. AC-60.2: Compose panel is open (no navigation to another route).
3. AC-60.3: Compose fields exactly match provided values:
   - recipient equals `toHouseId`,
   - subject equals provided subject,
   - body equals provided draft.
4. AC-60.4: Tool response contains `ok === true`, `applied === true`, `error === null`.

### Test 61: worker continuity during UI intent sequence

1. AC-61.1: Capture initial worker session identifiers (`teamCode`, worker connected state).
2. AC-61.2: Run sequence:
   - `agent_town_ui_open_modal(atlas)`,
   - `agent_town_ui_atlas_search(...)`,
   - `agent_town_ui_open_modal(pony)`,
   - `agent_town_ui_pony_compose(...)`.
3. AC-61.3: After sequence, worker remains connected (`connected === true`).
4. AC-61.4: `teamCode` is unchanged from initial snapshot.
5. AC-61.5: No full-page route replacement occurred (`pathname` remained `/app` for all steps).
6. AC-61.6: Worker traffic/debug trace contains one success record per intent call.

### Test 62: worker-visible Web and Registry tool/state surface

1. AC-62.1: Worker tool registry exposes `agent_town_ui_web_open`, `agent_town_state_get_registry_entity`, and `agent_town_state_get_web_session`.
2. AC-62.2: Invoking those tools from the hub leaves the root path at `/app`.
3. AC-62.3: `agent_town_state_get_registry_entity` returns stable `registryId` and `entityVersionId`.
4. AC-62.4: `agent_town_state_get_web_session` returns stable `sessionId` and `lastCheckpointIdentity`.
5. AC-62.5: `agent_town_ui_web_open` returns `ok === true`, `applied === true`, and a snapshot containing the requested Web target.

### Negative and policy tests (required for same phase)

1. AC-N1: Unknown UI intent returns `ok === false`, `applied === false`, `error.code === "UI_INTENT_UNKNOWN"`.
2. AC-N2: Invalid params return `error.code === "UI_INTENT_INVALID_PARAM"` with deterministic message.
3. AC-N3: Attempted selector-style payload is rejected and does not mutate UI.
4. AC-N4: Irreversible action without approval returns `error.code === "CONFIRMATION_REQUIRED"`.

## 12. Implementation Plan (MVP)

Phase A: Contract

1. Extend `public/skill.md` with tool family definitions.
2. Add/extend server endpoints only where missing for state tools.

Phase B: Frontend Dispatcher

1. Implement whitelist dispatcher in `public/app.js`.
2. Wire intent handlers to existing modal and feature controllers.
3. Return deterministic response envelope and snapshot.

Phase C: Coverage

1. Add Playwright tests listed in section 11.
2. Ensure `npm test` passes with deterministic behavior.

## 13. Acceptance Criteria

1. `skill.md` defines both tool families and their strict parameters.
2. UI tools cannot execute arbitrary selector/DOM actions.
3. `agent_town_ui_open_modal`, `agent_town_ui_atlas_search`, `agent_town_ui_registry_search`, `agent_town_ui_web_open`, and `agent_town_ui_pony_compose` work end-to-end.
4. Worker session remains connected across UI intent flow.
5. Confirmation gate is enforced for irreversible actions.
6. Each new Playwright test includes explicit AC IDs and measurable assertions (no narrative-only checks).
7. New Playwright tests pass in CI and locally.

## 14. Future Extension: Experience Canvas

This architecture intentionally supports later addition of canvas-building intents through the same pattern:

1. declarative, schema-validated canvas operations,
2. whitelist renderer components,
3. deterministic state snapshots and test coverage.

That future work is out of scope for this MVP but compatible with this contract.
