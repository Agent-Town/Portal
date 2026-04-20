# Agent Town: Founders Plot V1.2 Hardening Specification

**Spec ID:** `AT-FP-V1.2-HARDENING-001`  
**Date:** 2026-04-20  
**Target branch:** `codex/founders-plot-v1-2-hardening`  
**Base branch/archive:** `codex/founders-plot-v1-2-living-town`  
**Product label:** **Agent Town: Founders Plot**  
**Implementation audience:** agentic AI developers, frontend engineers, game-system engineers, OpenClaw Lite runtime engineers, QA agents  
**Spec status:** implementation-ready narrow hardening pass

---

## 0. LLM handoff summary

This spec defines a **narrow V1.2 hardening sprint**. It is **not V1.3** and must not add broad new gameplay systems.

The implementation must fix exactly these five issues before the team moves on:

1. Add a real **in-session interval scheduler** for the Foreman, using the OpenClaw Lite worker path.
2. Enforce **worker-origin metadata** on Foreman mutation routes.
3. Fix the **contract-resource scoring bug** in Foreman candidate selection.
4. Update **manifest/tool parity** and make `heartbeat.md` scheduler-aware.
5. Fix **reload/runtime-token truth** in the Founders Plot UI.

The hero acceptance test is:

> A player starts Clover, enables **Collect Ready Outputs**, leaves the Founders Plot page open, does **not** click `Run now`, and Clover automatically collects a ready output through the OpenClaw Lite worker path. The event log proves worker origin, the UI shows a clear receipt, and a page reload never falsely shows an old runtime as actionable.

---

## 1. Why this hardening pass exists

V1.2 successfully added the living-town layer: requesters, institutions, town signals, preparation contracts, a Public Square / Welcome Sign sink, Town Journal, richer recap, and a worker-mediated manual Foreman tick.

The remaining problem is that the implementation can still be read by players as **manual automation dressed as an agent**, because the Foreman does not yet act automatically on interval and the server does not fully reject mutation calls that bypass the OpenClaw Lite worker metadata.

This matters because Agent Town’s differentiator is not only a town-builder loop. The differentiator is:

> I can hand routine responsibilities to my AI Foreman, and the town can prove what it did, why it did it, and under which authority.

This hardening sprint turns the current V1.2 implementation from **worker-mediated Run Now** into **true in-session delegated routine automation**.

---

## 2. Product boundary

### 2.1 In scope

This sprint includes only:

1. **OpenClaw Lite worker scheduler loop** for the existing `COLLECT_READY_OUTPUTS` preset.
2. **Server route hardening** so Foreman mutations require worker-origin metadata.
3. **Candidate scoring bug fix** for active contract resource requirements.
4. **Experience-pack correctness**: manifest tool list and heartbeat instructions.
5. **UI runtime truth** after reload or token loss.
6. TDD tests and measurable acceptance metrics for the above.

### 2.2 Explicit non-goals

Do **not** implement these in this hardening sprint:

- persistent/off-session backend Foreman;
- cloud/backend-pool executor integration;
- new contract kinds;
- new resources;
- new buildings;
- generalized cron UI;
- multiple scheduler presets;
- worker-side LLM decision making;
- specialist Foremen;
- full doctrine board;
- public sharing/social features;
- major UI redesign;
- token, ERC-8004, or marketplace changes.

The only scheduler preset in scope is:

```text
COLLECT_READY_OUTPUTS
```

---

## 3. Current code reality to preserve

The current V1.2 code already provides these foundations and should not be rewritten:

- `server/founders_plot/engine.js`: server-authoritative simulation, Foreman observation, safe candidates, scheduler state, contract logic.
- `server/founders_plot/routes.js`: state, tools, Foreman session, Foreman observation, Foreman tool route.
- `server/founders_plot/tools.js`: canonical tool specs.
- `public/experiences/founders-plot/app.js`: Founders Plot UI and current `Run now` path.
- `public/openclaw-lite/worker.js`: current worker command handler for `gateway.command.foundersPlot.foremanTick`.
- `public/openclaw-lite/gateway.js`: current gateway function `foundersPlotForemanTick`.
- Existing E2E tests `146` through `150` should remain passing.

Do not bulk-rewrite Founders Plot. This is a stabilization pass on top of the current branch.

---

## 4. Architectural decisions

### 4.1 Scheduler is in-session only

The V1.2 hardening scheduler runs only while the browser page and OpenClaw Lite worker are alive.

It may continue best-effort while the tab is hidden, but browser throttling must be expected and documented. The UI must not promise off-session automation.

### 4.2 Worker owns the scheduler loop

The page may start, stop, and display scheduler status, but the repeated interval loop must live inside `public/openclaw-lite/worker.js`, not as a plain page `setInterval` that repeatedly calls the API.

Allowed page responsibility:

```text
Human clicks “Enable collect ready outputs”
Page tells OpenClaw Lite worker: start Founders Plot scheduler for this runtime token
Page renders worker status
```

Forbidden page responsibility:

```text
Page setInterval directly calls /api/founders-plot/foreman/tool/*
Page setInterval repeatedly calls gateway.foundersPlotForemanTick itself
Page marks an action as AGENT without worker command metadata
```

### 4.3 Server remains world-owned reality

The OpenClaw Lite worker may initiate scheduler ticks, but every mutation still goes through server-authoritative Founders Plot routes.

The server must validate:

- runtime token;
- runtime status;
- worker-origin metadata for mutation tools;
- idempotency key;
- permissions;
- scheduler preset state;
- lease/no-duplicate execution;
- tool legality.

### 4.4 Current decision model remains deterministic

The current implementation has the server/test-brain produce safe candidates and choose the candidate. That is acceptable for this hardening sprint.

Do not change the product copy to claim deep independent Foreman reasoning. The correct player-facing language is:

> Clover followed the safe plan for this town state.

not:

> Clover freely reasoned and invented a strategy.

### 4.5 Runtime bearer tokens must not be persisted

Do not store the Foreman runtime bearer token in `localStorage`, IndexedDB, cookies, or any durable browser storage.

After reload, the token is gone. The UI must treat the old server runtime as **not locally actionable** and require a fresh start/restart.

---

## 5. Canonical terms

| Term | Meaning |
|---|---|
| **Foreman runtime** | The current Clover runtime session for one Founders Plot page session. |
| **Runtime token** | Short-lived bearer token returned by `/api/founders-plot/foreman/session/start`. Must stay memory-only. |
| **Worker-origin metadata** | `origin`, `workerCommandId`, `workerTraceId`, and `runtimeId` included by OpenClaw Lite worker when it invokes a Foreman mutation. |
| **Scheduler preset** | A bounded named automation routine. V1.2 hardening supports only `COLLECT_READY_OUTPUTS`. |
| **In-session scheduler** | Scheduler that works while the browser worker is alive. Not persistent/off-session. |
| **Actionable runtime** | Server runtime is healthy **and** the local page/worker holds a matching runtime token. |
| **Needs restart** | Server says a runtime exists, but the local page does not have the token needed to control it. |

---

## 6. Work package A — OpenClaw Lite in-session scheduler loop

### 6.1 Current gap

The current V1.2 code has:

- scheduler state such as `enabled`, `paused`, `nextRunAtMs`, and `runCount`;
- a `Run now` button;
- a worker-mediated `foundersPlotForemanTick` command;
- a 5-second UI polling loop.

It does **not** have a true interval scheduler that automatically triggers Foreman ticks when the task is due.

### 6.2 Required behavior

When all conditions are true:

```text
server runtime status is OBSERVING or equivalent healthy state
local OpenClaw Lite worker has the matching runtime token
COLLECT_READY_OUTPUTS is enabled
COLLECT_READY_OUTPUTS is not paused
Date.now() >= collectReadyOutputs.nextRunAtMs
there is at least one output-ready building that the Foreman may collect
```

then the OpenClaw Lite worker must automatically run one Foreman tick without the human clicking `Run now`.

### 6.3 Files expected to change

Primary:

- `public/openclaw-lite/worker.js`
- `public/openclaw-lite/gateway.js`
- `public/experiences/founders-plot/app.js`

Possible supporting changes:

- `server/founders_plot/engine.js`
- `server/founders_plot/routes.js`
- `public/experiences/founders-plot/heartbeat.md`
- `e2e/helpers/founders_plot.js`

### 6.4 Worker API additions

Add these gateway functions in `public/openclaw-lite/gateway.js`:

```js
gateway.foundersPlotSchedulerStart({
  token,
  taskKind: 'COLLECT_READY_OUTPUTS'
})

gateway.foundersPlotSchedulerStop({
  reason: 'HUMAN_PAUSED' | 'RUNTIME_RESTART' | 'PAGE_UNLOAD' | 'ERROR'
})

gateway.foundersPlotSchedulerStatus()
```

These map to worker commands:

```text
gateway.command.foundersPlot.scheduler.start
gateway.command.foundersPlot.scheduler.stop
gateway.command.foundersPlot.scheduler.status
```

and worker responses/events:

```text
worker.foundersPlot.scheduler.status
worker.foundersPlot.scheduler.tick.started
worker.foundersPlot.scheduler.tick.completed
worker.foundersPlot.scheduler.tick.noop
worker.foundersPlot.scheduler.tick.failed
```

The exact event names may vary if the current gateway uses a request/response wrapper, but the test-visible semantics must exist.

### 6.5 Worker-local scheduler state

Inside `worker.js`, maintain a memory-only scheduler state like:

```ts
type FoundersPlotWorkerSchedulerState = {
  active: boolean;
  taskKind: 'COLLECT_READY_OUTPUTS';
  token: string;                 // memory-only, never persisted
  timerId: number | null;
  tickRunning: boolean;
  nextRunAtMs: number;
  lastRunAtMs: number;
  lastStatus: 'STOPPED' | 'WAITING' | 'DUE' | 'RUNNING' | 'NOOP' | 'ERROR' | 'STALE' | 'TOKEN_MISSING';
  lastErrorCode: string;
  consecutiveErrors: number;
};
```

The worker must never persist `token` into IndexedDB or any durable store.

### 6.6 Scheduling algorithm

Use `setTimeout` based on the server’s `nextRunAtMs`, not a blind short `setInterval`.

Normative pseudocode:

```js
async function startFoundersPlotScheduler({ token, taskKind }) {
  assert(taskKind === 'COLLECT_READY_OUTPUTS');
  scheduler.active = true;
  scheduler.token = token;
  scheduler.taskKind = taskKind;
  scheduler.consecutiveErrors = 0;
  scheduleFoundersPlotDueCheck(0);
}

function scheduleFoundersPlotDueCheck(delayMs) {
  clearExistingTimer();
  if (!scheduler.active) return;
  scheduler.timerId = setTimeout(() => runFoundersPlotSchedulerDueCheck(), clamp(delayMs, 250, 30000));
}

async function runFoundersPlotSchedulerDueCheck() {
  if (!scheduler.active || scheduler.tickRunning) return;
  if (!scheduler.token) {
    scheduler.lastStatus = 'TOKEN_MISSING';
    scheduler.active = false;
    postSchedulerStatus();
    return;
  }

  scheduler.tickRunning = true;
  try {
    const observationPayload = await getFoundersPlotForemanObservationOrStatus(scheduler.token);
    const task = observationPayload?.observation?.scheduler?.collectReadyOutputs
      || observationPayload?.scheduler?.collectReadyOutputs
      || null;

    if (!task?.enabled || task.paused) {
      scheduler.lastStatus = 'WAITING';
      scheduleFoundersPlotDueCheck(5000);
      return;
    }

    const now = Date.now();
    const nextRunAtMs = Number(task.nextRunAtMs || 0);
    scheduler.nextRunAtMs = nextRunAtMs;

    if (nextRunAtMs > now) {
      scheduler.lastStatus = 'WAITING';
      scheduleFoundersPlotDueCheck(nextRunAtMs - now);
      return;
    }

    const hasActionableCandidate = Array.isArray(observationPayload.safeCandidates)
      && observationPayload.safeCandidates.some((candidate) => candidate?.canActNow === true);

    if (!hasActionableCandidate) {
      scheduler.lastStatus = 'NOOP';
      scheduler.lastRunAtMs = now;
      scheduleFoundersPlotDueCheck(15000);
      return;
    }

    scheduler.lastStatus = 'RUNNING';
    await runFoundersPlotForemanTick({ token: scheduler.token });
    scheduler.lastRunAtMs = Date.now();
    scheduler.consecutiveErrors = 0;
    scheduleFoundersPlotDueCheck(0);
  } catch (error) {
    const code = String(error?.message || error?.payload?.error?.code || 'SCHEDULER_ERROR');
    scheduler.lastErrorCode = code;
    if (code === 'FOREMAN_RUNTIME_REQUIRED' || code === 'STALE_RUNTIME') {
      scheduler.lastStatus = 'STALE';
      scheduler.active = false;
      postSchedulerStatus();
      return;
    }
    scheduler.lastStatus = 'ERROR';
    scheduler.consecutiveErrors += 1;
    scheduleFoundersPlotDueCheck(Math.min(30000, 5000 * scheduler.consecutiveErrors));
  } finally {
    scheduler.tickRunning = false;
    postSchedulerStatus();
  }
}
```

Implementation may refactor this, but all invariants below must hold.

### 6.7 Scheduler invariants

The implementation must satisfy:

1. **No click required:** due automation occurs without pressing `Run now`.
2. **No overlap:** if a tick is already running, another tick must not start.
3. **No direct mutation from page loop:** repeated scheduler mutations must go through OpenClaw Lite worker command path.
4. **No token persistence:** reload loses local runtime token and requires restart.
5. **No hidden-tab false promise:** hidden tabs may delay ticks; on return, at most one catch-up action may execute immediately.
6. **No duplicate collect:** the same ready output cannot be collected twice.
7. **No action while paused/stale:** paused or stale runtime stops scheduler execution.
8. **No action without permission:** `collectOutputs` policy must remain server-enforced.
9. **No action without enabled preset:** scheduler must not collect unless `COLLECT_READY_OUTPUTS` is enabled.
10. **Audit always present:** successful automated mutation must emit worker-origin events and a receipt.

### 6.8 UI behavior

Update the Foreman routine card:

- When preset is enabled and local worker scheduler is active:
  - show `Clover is watching for ready outputs while this tab is open.`
- When preset is enabled but local token is missing:
  - show `Restart Clover to resume this routine.`
- When preset is paused:
  - show `Clover will ask next time.`
- When scheduler failed:
  - show `Clover needs a fresh start.`

The `Run now` button may remain, but it is no longer evidence that scheduler automation works.

### 6.9 TDD tests

Add:

```text
e2e/151_founders_plot_v12_hardening_scheduler_interval.spec.js
```

#### Test A1 — automatic interval collect, no Run Now

Setup:

1. Reset test state.
2. Open Founders Plot.
3. Start Foreman runtime.
4. Place Lumber Camp.
5. Advance construction.
6. Queue a Lumber Camp job.
7. Advance production until output is ready.
8. Enable `collectOutputs` policy.
9. Enable `COLLECT_READY_OUTPUTS` scheduler preset.
10. Do **not** click `Run now`.

Acceptance:

- Within one scheduler window, inventory increases by the ready output amount.
- Output buffer is cleared.
- `state.foreman.scheduler.collectReadyOutputs.runCount` increments.
- `state.foreman.receipt.action === 'collect_ready_outputs'`.
- Replay contains `FOREMAN_WORKER_COMMAND_STARTED`.
- Replay contains `FOREMAN_WORKER_COMMAND_COMPLETED`.
- Replay contains `AGENT_ACTION_EXECUTED` with:

```js
{
  origin: 'OPENCLAW_LITE_WORKER',
  workerCommandId: expect.stringMatching(/^fpwcmd_/),
  workerTraceId: expect.stringMatching(/^fpwtrace_/),
  runtimeId: started.runtime.runtimeId
}
```

- The test must fail if the test clicks `foreman-run-now-btn`.

#### Test A2 — no duplicate collect under close ticks

Setup:

- Same as A1, but force two scheduler due checks close together by test helper or gateway command.

Acceptance:

- Exactly one `AGENT_ACTION_EXECUTED` collect event occurs for the ready output.
- Inventory increases once.
- Output buffer is empty.
- No idempotency conflict appears in UI.

#### Test A3 — paused scheduler does not act

Setup:

- Ready output exists.
- Scheduler enabled, then paused.

Acceptance:

- Wait one scheduler window.
- Inventory does not change.
- No new `AGENT_ACTION_EXECUTED` event appears.
- UI says the routine is paused or asks next time.

---

## 7. Work package B — Foreman worker-origin enforcement

### 7.1 Current gap

The Foreman route currently validates runtime bearer token, but mutation tools can still execute as `actor: 'AGENT'` when `origin: 'OPENCLAW_LITE_WORKER'` metadata is missing.

That is not strict enough for an agentic game where “Clover acted” must mean a real worker-owned command path.

### 7.2 Required behavior

For mutation tools on:

```text
POST /api/founders-plot/foreman/tool/:toolName
```

the server must reject requests unless worker-origin metadata is present and valid.

### 7.3 Foreman mutation tools requiring worker metadata

The following tools require worker metadata on the Foreman route:

```text
et.plot.collect_outputs
et.plot.queue_job
et.plot.place_building
et.plot.upgrade_building
```

Read-only tool exemption:

```text
et.plot.get_state
```

`et.plot.get_state` may be allowed with runtime token only.

If future Foreman mutation tools are added, they must default to requiring worker-origin metadata unless explicitly marked read-only.

### 7.4 Required request metadata

Every Foreman mutation request must include:

```json
{
  "origin": "OPENCLAW_LITE_WORKER",
  "workerCommandId": "fpwcmd_<timestamp>_<hex>",
  "workerTraceId": "fpwtrace_<timestamp>_<hex>",
  "runtimeId": "<current runtime id>"
}
```

Validation rules:

```text
origin must equal OPENCLAW_LITE_WORKER exactly after uppercase normalization
workerCommandId must be non-empty and begin with fpwcmd_
workerTraceId must be non-empty and begin with fpwtrace_
runtimeId must be non-empty and match the authenticated runtime.runtimeId
```

Recommended regex:

```js
/^fpwcmd_\d+_[a-f0-9]+$/i
/^fpwtrace_\d+_[a-f0-9]+$/i
```

### 7.5 Error response

If metadata is missing or invalid, return HTTP `403` with:

```json
{
  "ok": false,
  "error": {
    "code": "FOREMAN_WORKER_ORIGIN_REQUIRED",
    "message": "Foreman mutations must originate from the OpenClaw Lite worker command path.",
    "retryable": false
  }
}
```

If `runtimeId` is present but mismatched, return the same code or a more specific code:

```text
FOREMAN_WORKER_RUNTIME_MISMATCH
```

Either is acceptable if tests assert no mutation.

### 7.6 Event behavior

For a successful worker-origin mutation:

- emit `FOREMAN_WORKER_COMMAND_STARTED`;
- emit the normal action event, such as `AGENT_ACTION_EXECUTED`;
- emit `FOREMAN_WORKER_COMMAND_COMPLETED`;
- include `origin`, `workerCommandId`, `workerTraceId`, `runtimeId`, and `foremanSessionId` in agent action event metadata.

For a failed worker-origin mutation after metadata validates:

- emit `FOREMAN_WORKER_COMMAND_FAILED`.

For an invalid direct call without worker metadata:

- do not mutate world state;
- do not create a Foreman receipt;
- do not increment scheduler run count;
- it is acceptable to avoid appending a gameplay event, because no valid worker command existed.

### 7.7 TDD tests

Add:

```text
e2e/152_founders_plot_v12_hardening_worker_origin.spec.js
```

#### Test B1 — direct runtime-token mutation is rejected

Setup:

1. Start Foreman runtime through UI helper.
2. Prepare an output-ready Lumber Camp.
3. Enable collect policy.
4. Obtain the runtime token through the existing test helper or exposed test-only start response.

Action:

Call directly:

```text
POST /api/founders-plot/foreman/tool/et.plot.collect_outputs
Authorization: Bearer <runtimeToken>
```

Body:

```json
{
  "buildingId": "<lumber building id>",
  "idempotencyKey": "direct-call-should-fail"
}
```

Acceptance:

- HTTP status is `403`.
- Response error code is `FOREMAN_WORKER_ORIGIN_REQUIRED` or `FOREMAN_WORKER_RUNTIME_MISMATCH` if runtime mismatch is tested.
- Inventory does not change.
- Building output buffer remains.
- No Foreman receipt is created.
- No scheduler run count increment occurs.

#### Test B2 — worker-mediated mutation still succeeds

Setup:

- Same as B1.

Action:

Call through:

```js
await gateway.foundersPlotForemanTick({ token: runtimeToken })
```

or the page helper that wraps the gateway call.

Acceptance:

- Mutation succeeds.
- Inventory changes.
- Output buffer clears.
- Replay contains worker start/completed events.
- Action metadata contains `OPENCLAW_LITE_WORKER`.

#### Test B3 — forged runtime id is rejected

Action:

Call Foreman mutation route with:

```json
{
  "origin": "OPENCLAW_LITE_WORKER",
  "workerCommandId": "fpwcmd_123_abc",
  "workerTraceId": "fpwtrace_123_abc",
  "runtimeId": "wrong_runtime",
  "buildingId": "<id>",
  "idempotencyKey": "forged-runtime"
}
```

Acceptance:

- HTTP status is `403`.
- No mutation occurs.

---

## 8. Work package C — Contract-resource candidate scoring bug

### 8.1 Current gap

`scoreCollectCandidate` currently checks active contract requirements at the wrong path:

```js
contract?.requirements?.[resource]
```

but V1.2 contract resources are nested under:

```js
contract.requirements.resources[resource]
```

As a result, a contract requiring wood may not cause the Foreman to prioritize collecting wood over food.

### 8.2 Required behavior

When an active or ready-to-turn-in contract requires a resource, collecting that resource must receive the contract-priority boost.

Correct path:

```js
contract?.requirements?.resources?.[resource]
```

### 8.3 Implementation requirement

Update `scoreCollectCandidate` in `server/founders_plot/engine.js` to support the nested requirements path.

Recommended implementation:

```js
const requirementResource = ['wood', 'stone', 'food', 'coin'].find((resource) => (
  normalizeCount(contract?.requirements?.resources?.[resource]) > 0
)) || '';
```

Optional backwards compatibility:

```js
const requirementResource = ['wood', 'stone', 'food', 'coin'].find((resource) => (
  normalizeCount(contract?.requirements?.resources?.[resource]) > 0
  || normalizeCount(contract?.requirements?.[resource]) > 0
)) || '';
```

Backwards compatibility is acceptable if it does not hide schema mistakes elsewhere.

### 8.4 TDD tests

Add:

```text
e2e/153_founders_plot_v12_hardening_contract_scoring.spec.js
```

This can be a Playwright test that imports Node modules directly, as existing Founders Plot tests already do.

#### Test C1 — active wood contract boosts Lumber Camp collection

Setup with engine helpers:

- create plot state;
- create or inject an active contract:

```js
{
  contractId: 'contract_test_wood',
  kind: 'SUPPLY',
  status: 'ACTIVE',
  requirements: {
    resources: { wood: 3 }
  }
}
```

- set Lumber Camp to `OUTPUT_READY` with `{ wood: 2 }`;
- set Farm Plot to `OUTPUT_READY` with `{ food: 2 }`;
- set standing order to `CAREFUL_STEWARD`, because this previously made Farm Plot likely to win;
- enable `collectOutputs` policy;
- enable scheduler preset;
- build Foreman observation;
- call `buildSafeForemanCandidates(state, observation)`.

Acceptance:

- The first candidate targets the Lumber Camp.
- The Lumber Camp candidate score is greater than the Farm Plot candidate score.
- The candidate reason or goal served may remain unchanged, but the prioritization must be correct.

#### Test C2 — no active contract falls back to standing order

Setup:

- no active contract;
- same Lumber Camp and Farm Plot output-ready setup;
- standing order `CAREFUL_STEWARD`.

Acceptance:

- Farm Plot may rank higher than Lumber Camp, proving the contract boost is what changes C1.

#### Metric

```text
ContractResourcePriorityAccuracy = 100% for supplied fixtures
```

---

## 9. Work package D — Manifest/tool parity and scheduler-aware heartbeat docs

### 9.1 Current gap

`public/experiences/founders-plot/manifest.json` lists only the original Phase 1 tools and omits V1.1/V1.2 tools.

`heartbeat.md` is too thin for a scheduler-capable Foreman and does not define cadence, next-run handling, hidden-tab behavior, or retry/backoff.

### 9.2 Required manifest behavior

The manifest must list the same tool names as `FOUNDERS_PLOT_TOOL_SPECS` in `server/founders_plot/tools.js`.

Required invariant:

```text
sort(manifest.tools) === sort(FOUNDERS_PLOT_TOOL_SPECS.map(tool => tool.name))
```

### 9.3 Required tool list

At minimum, manifest must include:

```text
et.plot.get_state
et.plot.place_building
et.plot.queue_job
et.plot.collect_outputs
et.plot.upgrade_building
et.plot.set_priority
et.plot.claim_reward
et.plot.request_user_approval
et.plot.town.get_signals
et.plot.town.upgrade_landmark
et.plot.journal.get_entries
et.plot.contracts.get_state
et.plot.contracts.accept
et.plot.contracts.turn_in
et.foreman.policy.get_standing_order
et.foreman.policy.set_standing_order
et.foreman.scheduler.get_status
et.foreman.scheduler.enable_collect_ready_outputs
et.foreman.scheduler.pause
et.foreman.scheduler.resume
```

If `tools.js` contains additional names at implementation time, manifest must include them too.

### 9.4 Required `heartbeat.md` content

Rewrite `public/experiences/founders-plot/heartbeat.md` to include these sections:

```md
# Founders Plot Heartbeat

## Runtime boundary
- Clover runs in-session only in V1.2.
- Clover does not keep acting after the page closes.
- If the page reloads, Clover needs a fresh runtime start.

## Human-facing promise
- When Collect Ready Outputs is enabled and this page remains open, Clover checks for ready outputs and may collect one safe output at a time.

## Cadence
- Default scheduler preset: COLLECT_READY_OUTPUTS.
- Default interval after a successful collect: 15 seconds.
- The worker should schedule from server-provided nextRunAtMs.
- The worker must not run overlapping ticks.

## Hidden-tab behavior
- Browser throttling may delay ticks while the tab is hidden.
- On return to visible, Clover may perform at most one immediate catch-up action if a task is due.
- Do not promise off-session automation.

## Retry and backoff
- On transient error: back off 5s, 10s, then cap at 30s.
- On FOREMAN_RUNTIME_REQUIRED or STALE_RUNTIME: stop the scheduler and ask the human to restart Clover.
- On RATE_LIMITED: respect retryAfterMs if present.

## Tool route rules
- Foreman mutations must go through the OpenClaw Lite worker path.
- Foreman mutation calls must include OPENCLAW_LITE_WORKER origin metadata.
- The server remains the source of truth.

## Recommended loop
1. Observe state and scheduler status.
2. If preset is disabled or paused, wait.
3. If nextRunAtMs is in the future, wait until due.
4. If due and output is ready, run one worker-owned Foreman tick.
5. Record receipt and return to waiting.
```

The final wording may use the project’s frontier tone, but all normative facts above must remain.

### 9.5 Required `tools.md` consistency

`public/experiences/founders-plot/tools.md` must be updated if it omits any V1.2 tools or describes scheduler behavior incorrectly.

Minimum content requirement:

- names all tools in `FOUNDERS_PLOT_TOOL_SPECS`;
- states that `COLLECT_READY_OUTPUTS` is the only V1.2 scheduler preset;
- states that scheduler automation is in-session only;
- states that mutation outcomes are server-validated.

### 9.6 TDD tests

Add:

```text
e2e/154_founders_plot_v12_hardening_pack_contract.spec.js
```

#### Test D1 — manifest/server tool parity

Implementation:

```js
const manifest = require('../public/experiences/founders-plot/manifest.json');
const { FOUNDERS_PLOT_TOOL_SPECS } = require('../server/founders_plot/tools');
expect([...manifest.tools].sort()).toEqual(FOUNDERS_PLOT_TOOL_SPECS.map((tool) => tool.name).sort());
```

Acceptance:

- test fails if manifest has missing or extra tool names;
- test fails if `manifest.tools` is not an array of strings.

#### Test D2 — heartbeat contains scheduler contract

Read `public/experiences/founders-plot/heartbeat.md` and assert it contains these phrases or equivalent exact anchors:

```text
in-session only
COLLECT_READY_OUTPUTS
nextRunAtMs
hidden
FOREMAN_RUNTIME_REQUIRED
STALE_RUNTIME
OPENCLAW_LITE_WORKER
```

#### Test D3 — tools.md contains all tool names

Read `tools.md` and assert every `FOUNDERS_PLOT_TOOL_SPECS.name` appears at least once.

---

## 10. Work package E — Reload/runtime-token truth in UI

### 10.1 Current gap

The server may remember a Foreman runtime as `OBSERVING`, while the page has lost the memory-only runtime token after reload.

Current UI can then enable controls based on `runtime.runtimeId`, even though calls fail with `FOREMAN_RUNTIME_REQUIRED` because `foremanRuntimeToken` is empty.

### 10.2 Required product behavior

After page reload:

- the UI must not show Clover as locally actionable;
- `Run now` must be disabled;
- scheduler enable/active state must not imply automation is running;
- the UI must show a clear restart-needed message;
- restarting Clover must create a fresh actionable runtime and allow scheduler operation again.

### 10.3 Do not persist runtime token

Do **not** fix this by writing the runtime token to localStorage, IndexedDB, or cookies.

Correct fix: derive local actionability from memory-only token presence and runtime id match.

### 10.4 UI derivation contract

In `public/experiences/founders-plot/app.js`, replace checks based only on `runtime.runtimeId` with a derived status.

Recommended helper:

```js
let foremanRuntimeToken = '';
let localForemanRuntimeId = '';

function localForemanRuntimeStatus(serverRuntime = {}) {
  const serverRuntimeId = String(serverRuntime?.runtimeId || '');
  const hasServerRuntime = !!serverRuntimeId;
  const hasLocalToken = !!foremanRuntimeToken && localForemanRuntimeId === serverRuntimeId;
  const serverStatus = String(serverRuntime?.status || 'NOT_STARTED').toUpperCase();
  const serverHealthy = ['BOOTING', 'OBSERVING', 'THINKING', 'ACTING'].includes(serverStatus);
  const needsRestart = hasServerRuntime && serverHealthy && !hasLocalToken;
  const actionable = hasServerRuntime && hasLocalToken && serverHealthy;
  return { hasServerRuntime, hasLocalToken, needsRestart, actionable, serverStatus };
}
```

On successful `startForemanRuntime()`:

```js
foremanRuntimeToken = String(payload?.runtime?.token || '');
localForemanRuntimeId = String(payload?.runtime?.runtimeId || '');
```

### 10.5 Button rules

| UI element | Enabled when |
|---|---|
| `Start Clover` / `Restart Clover` | always enabled unless `pendingAction` |
| `Run now` | `runtimeLocal.actionable === true` and status is not paused/stale/error |
| `Pause` | `runtimeLocal.actionable === true` and status is not already paused |
| `Enable collect ready outputs` | may be allowed as a human preference, but must show `Restart Clover to run it` if no local actionable runtime |
| Scheduler automatic loop | only if `runtimeLocal.actionable === true` |

Recommended conservative implementation: disable scheduler toggle unless `runtimeLocal.actionable === true`.

### 10.6 Text requirements

When server runtime exists but no local token exists, show this or close equivalent:

```text
Clover needs a fresh start after reload.
```

The Foreman tools/status line should say:

```text
Restart Clover before any routine can run in this tab.
```

Forbidden in the player-facing main loop:

```text
runtime token
bearer
worker trace
json
schema
```

Tests should preserve the existing no-jargon requirement.

### 10.7 TDD tests

Add:

```text
e2e/155_founders_plot_v12_hardening_reload_runtime_truth.spec.js
```

#### Test E1 — reload shows restart-needed, not actionable runtime

Setup:

1. Open Founders Plot.
2. Start Foreman runtime.
3. Assert `Run now` is enabled or can become enabled when healthy.
4. Reload the page.

Acceptance after reload:

- text includes `fresh start` or `Restart Clover`;
- `foreman-run-now-btn` is disabled;
- scheduler automation is not running;
- clicking disabled controls is impossible or no-op;
- no `FOREMAN_RUNTIME_REQUIRED` error appears from an enabled button click.

#### Test E2 — restart restores actionability

Continuation from E1:

1. Click `Restart Clover`.
2. Verify new runtime token is stored in memory.
3. Verify local runtime id matches server runtime id.
4. Verify `Run now` can be enabled when runtime is healthy.
5. Enable scheduler and verify worker scheduler status becomes active.

#### Test E3 — scheduler does not run with missing local token

Setup:

1. Start Foreman.
2. Enable collect-ready preset.
3. Reload.
4. Prepare output-ready building.
5. Wait one scheduler window.

Acceptance:

- inventory does not change;
- no new `AGENT_ACTION_EXECUTED` event appears;
- UI still asks for restart.

---

## 11. Combined release test matrix

| ID | Test file | Purpose | Must fail on current V1.2 base? |
|---|---|---|---|
| A1 | `151_founders_plot_v12_hardening_scheduler_interval.spec.js` | Prove no-click scheduled collect through worker | Yes |
| A2 | same | Prove no duplicate close ticks | Likely yes |
| A3 | same | Prove paused scheduler does not act | Maybe |
| B1 | `152_founders_plot_v12_hardening_worker_origin.spec.js` | Reject direct runtime-token mutation without worker metadata | Yes |
| B2 | same | Preserve worker-mediated success | No, should pass before and after if metadata valid |
| B3 | same | Reject forged runtime id | Likely yes |
| C1 | `153_founders_plot_v12_hardening_contract_scoring.spec.js` | Active resource contract boosts correct output | Yes |
| C2 | same | No contract preserves standing-order fallback | No |
| D1 | `154_founders_plot_v12_hardening_pack_contract.spec.js` | Manifest equals server tool specs | Yes |
| D2 | same | Heartbeat contains scheduler contract | Yes |
| D3 | same | Tools.md names all tool specs | Maybe |
| E1 | `155_founders_plot_v12_hardening_reload_runtime_truth.spec.js` | Reload shows restart-needed and disables action | Yes |
| E2 | same | Restart restores local actionability | Likely no after implementation |
| E3 | same | Missing token prevents scheduler action | Yes |

Existing tests `132` through `150` must continue passing.

---

## 12. Measurable acceptance metrics

| Metric | Required value | Measurement method |
|---|---:|---|
| `ScheduledForemanActionWithoutRunNow` | `true` | E2E A1 |
| `SchedulerDueTaskLatencyP95` | `<= 10_000 ms` in test profile | Timestamp between enable/due and collect event |
| `DuplicateSchedulerExecutionRate` | `0` | A2 repeated/close tick test |
| `DirectForemanMutationBypassRate` | `0` | B1/B3 negative tests |
| `WorkerOriginAttributionCoverage` | `100%` | Every Foreman mutation event has origin + command + trace |
| `ContractResourcePriorityAccuracy` | `100%` | C1/C2 unit fixtures |
| `ManifestToolParity` | `100%` | D1 |
| `SchedulerHeartbeatDocCoverage` | `100%` required anchors | D2 |
| `StaleRuntimeShownAsHealthy` | `0` | E1/E3 |
| `RuntimeTokenPersistentStorageWrites` | `0` | Static check or manual review; token must remain memory-only |
| `GoldenPathConsoleErrors` | `0` | Existing UI test plus new scheduler test |

---

## 13. Implementation roadmap

### Milestone 0 — Characterization tests first

Add the new tests with TODO/expected failures if needed. The first pass should demonstrate the current branch fails at least:

- no-click scheduler action;
- direct runtime-token mutation rejection;
- contract scoring;
- manifest parity;
- reload actionability.

### Milestone 1 — Worker scheduler loop

Implement:

- gateway scheduler start/stop/status methods;
- worker-local scheduler state;
- due-check loop;
- no-overlap guard;
- hidden-tab/catch-up behavior;
- UI wiring when Foreman starts, scheduler enabled, scheduler paused, or runtime restarted.

Pass A1/A2/A3.

### Milestone 2 — Server origin enforcement

Implement:

- strict `normalizeWorkerCommandMeta` validation;
- mutation route rejection for missing/invalid metadata;
- runtimeId matching;
- no world mutation on rejected direct calls.

Pass B1/B2/B3.

### Milestone 3 — Candidate scoring correctness

Implement:

- nested `contract.requirements.resources` lookup;
- unit-level scoring fixtures.

Pass C1/C2.

### Milestone 4 — Experience pack correctness

Implement:

- full `manifest.tools` parity;
- scheduler-aware heartbeat doc;
- `tools.md` coverage if missing.

Pass D1/D2/D3.

### Milestone 5 — Reload/runtime truth

Implement:

- local runtime id tracking;
- derived actionability status;
- restart-needed UI state;
- no token persistence;
- disabled controls when local token missing;
- scheduler stop/idle behavior after reload.

Pass E1/E2/E3.

### Milestone 6 — Full regression

Run full test suite used by branch CI.

Required:

```text
all existing Founders Plot tests pass
all new hardening tests pass
no visible forbidden jargon in player-facing UI
no syntax errors in modified files
```

---

## 14. File checklist

Expected modified files:

```text
public/openclaw-lite/worker.js
public/openclaw-lite/gateway.js
public/experiences/founders-plot/app.js
public/experiences/founders-plot/manifest.json
public/experiences/founders-plot/heartbeat.md
public/experiences/founders-plot/tools.md
server/founders_plot/engine.js
server/founders_plot/routes.js
e2e/helpers/founders_plot.js
e2e/151_founders_plot_v12_hardening_scheduler_interval.spec.js
e2e/152_founders_plot_v12_hardening_worker_origin.spec.js
e2e/153_founders_plot_v12_hardening_contract_scoring.spec.js
e2e/154_founders_plot_v12_hardening_pack_contract.spec.js
e2e/155_founders_plot_v12_hardening_reload_runtime_truth.spec.js
```

Optional modified files:

```text
server/founders_plot/tools.js       # only if schemas or tool metadata need strictness
public/founders-plot.html           # only if UI text/testids are missing
specs/20_founders_plot_v1_2_living_town.md  # optional note that V1.2 is hardened
```

Do not modify unrelated district, wallet, Atlas, Pony, or Town Hall flows unless a failing shared helper requires it.

---

## 15. Definition of Done

The hardening branch is done only when all are true:

1. The no-click scheduler test proves Clover automatically collects a ready output through OpenClaw Lite worker.
2. Direct Foreman mutation route calls with only a runtime token are rejected.
3. Worker-mediated Foreman mutations still succeed.
4. Active contract resource requirements correctly influence collect candidate priority.
5. Manifest tools match server tool specs exactly.
6. `heartbeat.md` describes real scheduler cadence, hidden-tab limits, and stale/runtime handling.
7. Reloaded pages do not show old server runtimes as locally actionable.
8. Runtime token is never persisted.
9. Existing V1.2 living-town surfaces remain intact.
10. Existing V1.2 tests plus new hardening tests pass.

---

## 16. Player-facing copy guidance

Use this tone:

- `Clover is watching for ready outputs while this tab is open.`
- `Clover collected ready lumber because your town had a safe routine ready.`
- `Restart Clover to resume this routine after reload.`
- `Clover will ask next time.`

Avoid this tone:

- `Clover will keep working after you close the tab.`
- `Autonomous cloud Foreman is running.`
- `Runtime token missing.`
- `Bearer auth failed.`
- `Worker trace invalid.`
- `Schema mismatch.`

The player should understand the trust boundary without seeing implementation jargon.

---

## 17. Security notes

- Treat runtime tokens as sensitive bearer credentials.
- Keep runtime token memory-only.
- Do not add localStorage/IndexedDB persistence for runtime token.
- Reject mutation route calls that lack worker-origin metadata.
- Validate runtime id matches authenticated runtime.
- Preserve idempotency conflict handling.
- Preserve server-side permission checks.
- Never let the page set `actor: 'AGENT'` without the worker path.

---

## 18. Future work explicitly deferred

After this hardening pass, future specs may address:

- persistent/off-session Foreman through backend-pool executor;
- broader scheduler presets;
- persistent exception inbox;
- richer doctrine board;
- worker-side candidate selection using LLM/Test Brain boundary;
- specialist Foremen;
- public plot cards and sharing;
- social/cooperative projects.

Do not implement these now.

---

## 19. Machine-readable summary

```yaml
spec_id: AT-FP-V1.2-HARDENING-001
product: Agent Town
chapter: Founders Plot
base_branch: codex/founders-plot-v1-2-living-town
target_branch: codex/founders-plot-v1-2-hardening
scope_type: narrow_hardening
hero_moment: >
  Clover automatically collects a ready output through the OpenClaw Lite worker
  without the player clicking Run Now, while the page is open.
in_scope:
  - worker_interval_scheduler
  - foreman_worker_origin_enforcement
  - contract_resource_scoring_fix
  - manifest_tool_parity
  - scheduler_heartbeat_docs
  - reload_runtime_token_truth
out_of_scope:
  - persistent_off_session_foreman
  - backend_pool_executor
  - new_contract_kinds
  - new_resources
  - new_buildings
  - generalized_cron_ui
  - specialist_foremen
  - full_doctrine_board
  - public_social_features
required_tests:
  - e2e/151_founders_plot_v12_hardening_scheduler_interval.spec.js
  - e2e/152_founders_plot_v12_hardening_worker_origin.spec.js
  - e2e/153_founders_plot_v12_hardening_contract_scoring.spec.js
  - e2e/154_founders_plot_v12_hardening_pack_contract.spec.js
  - e2e/155_founders_plot_v12_hardening_reload_runtime_truth.spec.js
critical_metrics:
  ScheduledForemanActionWithoutRunNow: true
  DuplicateSchedulerExecutionRate: 0
  DirectForemanMutationBypassRate: 0
  WorkerOriginAttributionCoverage: 100
  ContractResourcePriorityAccuracy: 100
  ManifestToolParity: 100
  StaleRuntimeShownAsHealthy: 0
  RuntimeTokenPersistentStorageWrites: 0
release_gate: >
  Existing V1.2 tests plus all hardening tests pass; Clover can perform one
  due automatic collect through the OpenClaw Lite worker path; direct mutation
  bypasses are rejected; reload never lies about Foreman actionability.
```
