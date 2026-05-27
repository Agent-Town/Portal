# Agent Town V6.0 Worker-First Civic Tool Surface Draft

Status: `research_only`

Milestone: `M6 Worker-first V6 tool surface`

Runtime module: `server/world_civilization/tools.js`

Exposure gate: `server/world_civilization/tool_exposure_gate.js`

Contract tests: `tests/world_civilization_tools.test.js`

Exposure gate tests: `tests/world_civilization_tool_exposure_gate.test.js`

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

## Release Gate

M6 can move to `done` only after:

- runtime tool manifest exposure is intentionally implemented behind V6 flags;
- production player overrides cannot expose the tools;
- `server/world_civilization/tool_exposure_gate.js` passes with real worker
  origin and observability evidence;
- worker-origin and worker-traffic coverage proves the worker path is used;
- every mutating civic route has same-origin, CSRF, session/wallet auth, rate
  limits, idempotency, audit, moderation, rollback, and privacy coverage;
- no V6 tool is visible in normal gameplay before the V6 readiness gate closes.
