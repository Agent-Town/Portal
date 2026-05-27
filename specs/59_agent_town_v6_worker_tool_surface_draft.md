# Agent Town V6.0 Worker-First Civic Tool Surface Draft

Status: `research_only`

Milestone: `M6 Worker-first V6 tool surface`

Runtime module: `server/world_civilization/tools.js`

Exposure gate: `server/world_civilization/tool_exposure_gate.js`

Worker proposal adapter: `server/world_civilization/worker_tool_adapter.js`

Worker vote adapter: `server/world_civilization/worker_vote_adapter.js`

Worker runtime registration target:
`server/world_civilization/worker_runtime_registration.js`

Contract tests: `tests/world_civilization_tools.test.js`

Exposure gate tests: `tests/world_civilization_tool_exposure_gate.test.js`

Worker adapter tests: `tests/world_civilization_worker_tool_adapter.test.js`

Worker vote adapter tests: `tests/world_civilization_worker_vote_adapter.test.js`

Worker runtime registration target tests:
`tests/world_civilization_worker_runtime_registration.test.js`

Worker runtime browser smoke:
`e2e/246_v6_worker_runtime_registration_smoke.spec.js`

Production override tests: `tests/world_grid_region.test.js`

Feature flag: `FEATURE_WORLD_V60_AGENT_CIVILIZATION`

## Boundary

This is a contract draft, not a player-visible runtime surface. It does not add
V6 routes, UI, public civic mechanics, or autonomous agent authority. Runtime
`/api/world/tools` remains the source of truth for currently callable world
tools and must not expose `et.world.civic.*` tools until M6 is intentionally
implemented through the OpenClaw Lite worker path.

## Tool Drafts

The first civic tool family is limited to proposal review, vote receipt, and
delegation policy preparation:

- `et.world.civic.proposals.list`
- `et.world.civic.proposals.preview`
- `et.world.civic.proposals.draft`
- `et.world.civic.proposals.submit_for_review`
- `et.world.civic.votes.preview`
- `et.world.civic.votes.cast`
- `et.world.civic.delegation.get_policy`
- `et.world.civic.delegation.set_policy`

## Safety Rules

- Every draft tool is feature-gated by `FEATURE_WORLD_V60_AGENT_CIVILIZATION`.
- Broad V5 prototype overrides such as `WORLD_GRID_FEATURE_FLAGS=all` do not
  expose these drafts.
- Production player query/header overrides such as `worldGridFeatureFlags=all,v60`
  cannot enable the V6 flag or publish civic tools, even when V5 is
  server-enabled.
- A server-side `FEATURE_WORLD_V60_AGENT_CIVILIZATION=1` flag may make the V6
  feature flag visible in internal evidence, but it still must not publish
  `et.world.civic.*` tools through runtime `/api/world/tools` until M6/M17/M18
  gates are closed.
- Draft tools are returned only by explicit internal research calls that opt in
  to draft visibility.
- No draft tool executes civic effects, mutates private towns, or mutates
  another user's world.
- Tools that submit review, cast a vote receipt, or change delegation policy
  require explicit human approval and an idempotency key.
- Vote casting records a receipt only; civic effect execution is out of scope
  until moderation, rollback, audit, and release gates are closed.
- Agent-authored proposal drafts remain draft/review inputs. Agents may not
  silently apply civic effects.

## Worker Tool Adapter

`server/world_civilization/worker_tool_adapter.js` is the current internal
worker-first wiring foundation for `et.world.civic.proposals.submit_for_review`.
It is not registered in runtime `/api/world/tools`, does not add player-visible
UI, and is disabled unless `V6_CIVIC_WORKER_TOOL_ADAPTER_ENABLED=1`,
`FEATURE_WORLD_V60_AGENT_CIVILIZATION`, and explicit research opt-in are all
present.

The adapter requires:

- OpenClaw Lite worker origin.
- No backend shortcut.
- Worker Tools, Skill Context, Worker Traffic, Brain, and Session Context
  observability.
- Same-origin/CSRF-reviewed M5 civic mutation security.
- Store-backed `proposal_drafting` delegation for the agent proposer.
- Explicit approval receipt and idempotency key.
- Idempotent delegated action-budget consumption for successful proposal
  receipts; exact replays return the existing usage row, and distinct actions
  fail when the delegation budget is exhausted.
- No proposal effect execution and no runtime civic tool exposure.

The adapter may persist a proposal only into the internal M7 review queue. It
must never apply a civic effect, mutate private town state, mutate another
user's world, or publish `et.world.civic.*` through runtime tool manifests.

## Worker Vote Adapter

`server/world_civilization/worker_vote_adapter.js` is the current internal
worker-first wiring foundation for `et.world.civic.votes.cast`. It is not
registered in runtime `/api/world/tools`, does not add player-visible UI, and
is disabled unless `V6_CIVIC_WORKER_VOTE_ADAPTER_ENABLED=1`,
`FEATURE_WORLD_V60_AGENT_CIVILIZATION`, and explicit research opt-in are all
present.

The adapter requires:

- OpenClaw Lite worker origin.
- No backend shortcut.
- Worker Tools, Skill Context, Worker Traffic, Brain, and Session Context
  observability.
- Same-origin/CSRF-reviewed M5 civic mutation security.
- Store-backed `vote_advice` delegation for the agent vote-advice actor.
- A reviewed `ready_for_vote` proposal.
- A server-attested delegation vote authorization and idempotency key.
- The M8 `buildV6VoteRouteAuthorizationEnvelope()` for the
  `worker_tool_vote_surface`.
- Idempotent delegated action-budget consumption for successful vote receipts;
  exact replays return the existing usage row, and distinct votes fail when
  the delegation budget is exhausted.
- No vote outcome application and no runtime civic tool exposure.

The adapter may persist only a vote receipt. It must never apply a proposal
effect, mutate private town state, mutate another user's world, expose private
data, or publish `et.world.civic.*` through runtime tool manifests.

## Worker-First Requirement

Before any V6 civic draft becomes callable, it must be routed through the
OpenClaw Lite worker/tool path and appear in worker observability surfaces:

- `Worker Tools`
- `Skill Context`
- `Worker Traffic`
- `Brain`
- `Session Context`

Backend handlers may validate, persist, and audit tool requests, but they must
not contain agent decision policy or bypass shared-state human approval.

## Exposure Gate

`server/world_civilization/tool_exposure_gate.js` is the research-only contract
that future work must satisfy before any `et.world.civic.*` draft can become a
runtime-callable tool. The gate remains non-executing and keeps
`releaseReady: false`; it only records readiness evidence.

The current gate requires:

- `/api/world/tools` to remain the runtime source of truth.
- No `et.world.civic.*` entry in the runtime tool manifest.
- OpenClaw Lite worker origin and no backend shortcut.
- Worker Tools, Skill Context, Worker Traffic, Brain, and Session Context
  observability.
- V6 civic mutation security evidence covering same-origin, session/wallet
  binding, store-backed delegated-agent proof, delegation scope mismatch,
  read-only delegation budget handling, idempotency, rate limits, and hidden
  runtime status.
- Non-executing draft metadata and approval/idempotency binding for future
  review, vote receipt, and delegation-policy mutations.

## Worker Runtime Registration Target

`server/world_civilization/worker_runtime_registration.js` is the
research-only target matrix for the browser worker registration gap. It does
not register `et.world.civic.*` tools and does not claim browser release
coverage. It records the evidence required before civic tools can become
callable through the OpenClaw Lite worker runtime:

- browser OpenClaw Lite worker boot evidence;
- runtime `/api/world/tools` manifest sync;
- civic tool absence before release;
- Worker Tools, Skill Context, Worker Traffic, Brain, and Session Context
  observability;
- skill context import and worker traffic traces;
- session/wallet context linkage;
- modal lifetime continuity for the page-scoped worker;
- shared-state route adapter evidence;
- production player override denial.

`e2e/246_v6_worker_runtime_registration_smoke.spec.js` adds current browser
smoke evidence that normal `/app` with broad `all,v60` style overrides keeps
runtime civic tools absent while Worker Tools, Skill Context, Worker Traffic,
Brain, and Session Context remain observable.

`e2e/247_v6_production_override_browser_smoke.spec.js` adds production-mode
browser evidence that player `all,v60` query/header overrides cannot enable
V6, publish civic tools, or open the V6 lab while V5 is server-enabled.

`e2e/248_v6_production_worker_runtime_smoke.spec.js` adds production-mode
browser evidence that Worker Tools, Skill Context, Worker Traffic, Brain, and
Session Context stay observable while player `all,v60` overrides are ignored
for V6 and runtime civic tools remain absent.

The report remains `research_only`, `releaseReady: false`, does not register
runtime civic tools, forbids backend shortcuts, and treats browser worker
registration plus full production browser coverage as release gaps.

## Release Gate

M6 can move to `done` only after:

- runtime tool manifest exposure is intentionally implemented behind V6 flags;
- production player overrides cannot expose the tools;
- `server/world_civilization/tool_exposure_gate.js` passes with real worker
  origin and observability evidence;
- `server/world_civilization/worker_runtime_registration.js` is backed by real
  browser worker boot, manifest parity, shared-state route, modal-continuity,
  and production override traces;
- worker-origin and worker-traffic coverage proves the worker path is used;
- every mutating civic route has same-origin, CSRF, session/wallet auth, rate
  limits, idempotency, audit, moderation, rollback, and privacy coverage;
- no V6 tool is visible in normal gameplay before the V6 readiness gate closes.
