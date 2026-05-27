# Agent Town World Grid Ladder V5 To V6

Status: implementation planning

## Product Direction

Agent Town should grow into a world through staged governance, not unrestricted
free play.

The ladder is:

1. Single town.
2. Governed town.
3. Multiple towns.
4. Regional grid.
5. Territory claims and settler routes.
6. Public presence and safe player discovery.
7. Civic service advice prototype.
8. World events and public works.
9. Controlled free-play sandbox districts.
10. Agent civilization foundation.

## Zoom Model

| Zoom | Name | Player experience |
| --- | --- | --- |
| Z0 | Object focus | Inspect one building, Clover action, contract target. |
| Z1 | Settlement view | Founders Plot / town diorama. |
| Z2 | Territory grid | Outskirts, claims, roads, expansion cells. |
| Z3 | Regional map | Multiple towns and routes. |
| Z4 | World layer | Public districts, world events, other players. |
| Z5 | Sandbox district | Controlled player/agent co-presence. |

## Release Rule

Each step must prove one new decision layer. A feature can be implemented as
`prototype_gated`, but it cannot be player-visible by default until its release
gate, safety review, and retention dependency pass.

V5.0-V5.5 promotion is tracked in
`specs/release-gates/v5_world_grid_release_promotion_gate.md` and the
code-auditable target report in `server/world_grid/release_promotion.js`. V6
cannot depend on prototype-only V5 evidence unless the dependency is explicitly
excluded in the V6 milestone plan.

## Current Prototype Status

| Slice | release_status | Player-visible by default | Evidence |
| --- | --- | --- | --- |
| V5.0 Region Grid | `prototype_gated` | No | Deterministic region, read-only focus/camera coverage, no Founders Plot side effects, split Playwright smoke, and optional `WORLD_GRID_REGION_PREFS_SQLITE_PATH` restart proof for owner-indexed camera/focus preferences. |
| V5.1 Territory Claims and Settler Routes | `prototype_gated` | No | API, UI, Playwright coverage, and optional `WORLD_GRID_CLAIMS_SQLITE_PATH` restart proof for planned/claimed/cancel claim state plus cross-owner route-mutation denial. |
| V5.2 Public Presence and Safe Player Discovery | `prototype_gated` | No | Redaction, opt-in/out, follow, public summary coverage, abuse-report safety, and optional `WORLD_GRID_PUBLIC_PRESENCE_SQLITE_PATH` restart proof for public presence/follow/report state with private-text redaction. |
| V5.3 Civic Service Advice Prototype | `prototype_gated` | No | Redacted inputs, schema-shaped output, accept/report coverage, and optional `WORLD_GRID_SERVICES_SQLITE_PATH` restart proof for service request/reputation state. |
| V5.4 World Events and Public Works | `prototype_gated` | No | Preview, cap, idempotency, conservation, cosmetic reward coverage, and optional `WORLD_GRID_EVENTS_SQLITE_PATH` restart proof for contribution/reward state. |
| V5.5 Controlled Free-Play Sandbox Districts | `prototype_gated` | No | Typed props, moderation rejection, agent demo, rollback, private-town isolation coverage, and optional `WORLD_GRID_SANDBOX_SQLITE_PATH` restart proof for participant/action/snapshot/cell state. |
| V6.0 Agent Civilization Foundation | `research_only` | No | Worker-first civic tool draft and fail-closed tool exposure gate, civic mutation security envelope, proposal review transitions, governance preflight, reputation accountability foundation, moderation/privacy foundation, prepared-effect rollback foundation, scoped delegation foundation, civic institution charter foundation, public-works shared-resource foundation, modal lab surface and fail-closed launch-plan contracts, resilience baseline report, audit replay reconstruction, release-review gate, and controlled-release gate exist under `server/world_civilization/`, but runtime civic tools remain hidden until V5 safety, worker-origin evidence, rollback, redaction, retention, modal-first observability, replay resilience, security/product signoff, controlled rollout controls, and civic-governance gates are proven. |

Shared V5 storage evidence now includes optional `WORLD_GRID_AUDIT_SQLITE_PATH`
restart matrix coverage for all V5.1-V5.5 mutating route and tool surfaces,
including duplicate-replay suppression and private service-secret exclusion.
`server/world_grid/replay_reconstruction.js` now reconstructs current audit
rows without applying world state and checks hash-chain continuity,
privacy-safe snapshots, migration metadata, rollback counts, and aggregate
summary coverage. Complete exact per-record before-state reconstruction, final
session auth, production replay coverage, live Privy/provider logout signoff,
and trusted-proxy/risk-signal production rollout for risk-aware rate limits
remain promotion gates. Optional
`WORLD_GRID_CSRF_SQLITE_PATH` coverage now proves owner-bound hashed CSRF tokens
and hashed session-binding metadata persist across route restarts, Playwright
coverage now proves browser same-wallet cross-session CSRF token reuse is
denied, and CSRF storage coverage now proves same-session token rotation plus
explicit invalidation. Session reset now invalidates current-session
world-grid CSRF tokens, and wallet/provider disconnect cleanup now has an
explicit invalidation endpoint plus client hook and mocked provider disconnect
callback proof. Optional
`WORLD_GRID_RATE_LIMIT_SQLITE_PATH` coverage now proves owner/surface mutation
buckets persist across route restarts. Exact idempotent retries are replayed
before rate-limit consumption, and optional
`WORLD_GRID_RATE_LIMIT_IDENTITY_MODE=owner_session_ip_risk` coverage proves
session/IP/risk bucket identity is hashed without persisting raw session or IP
values. `server/world_grid/rate_limit_rollout.js` now defines the non-executing
trusted proxy, risk-signal, distributed-counter, calibration, abuse-burst, and
production-observability rollout target while keeping V5 prototype-gated and
not release-ready.

`server/world_grid/release_promotion.js` now names the V5.0-V5.5 release
promotion target matrix and keeps the report non-executing: it may record
evidence for durable storage, owner indexes, migration versions, restart
persistence, mutation security, CSRF, rate limits, idempotency, audit/replay,
public text privacy, player-route prerequisites, release replay reconstruction,
provider logout signoff, risk-rate-limit identity, and trusted
proxy/risk-signal rollout, but it may not mark V5 release-ready, enable V6,
expose prototype features by default, or mutate world state.
