# V5 World Grid Release Promotion Gate

Status: `release_gate`

Blocks: `V6.0 Agent Civilization Foundation`

Runtime target report: `server/world_grid/release_promotion.js`

Target coverage: `tests/world_grid_release_promotion.test.js`

This gate promotes V5.0-V5.5 world-grid slices from prototype evidence to
release-grade prerequisites. Passing Playwright demos is not enough: each slice
must prove durable state, owner safety, auditability, rollback policy, and
production feature-flag safety before V6 can depend on it.

## Global Promotion Requirements

Every V5 world-grid slice must satisfy the following before its status can move
from `prototype_gated` to `release_ready`:

- Durable persistence replaces process-local world-grid stores.
- Owner indexes exist for every private and public record type.
- Schema migration versions are explicit and covered by migration tests.
- Restart persistence tests prove state survives server restarts without silent
  recreation, reassignment, or loss.
- Every mutating route and tool requires session/wallet ownership, same-origin
  context, session-bound CSRF protection when a browser session is available,
  rate limits, and idempotency keys.
- Current V5 CSRF evidence includes `e2e/243_world_grid_csrf_session_binding.spec.js`,
  which proves a token issued in one same-wallet browser session cannot mutate
  from another same-wallet browser session while a same-session token succeeds;
  current store coverage proves same-session token rotation plus explicit
  invalidation; current browser coverage proves pre-reset tokens fail after
  `/api/session/reset` and proves old-token rejection after
  `/api/session/world-grid-csrf/invalidate`; wallet/provider disconnect cleanup
  calls that endpoint before local wallet identity is cleared; browser coverage
  also proves a mocked provider disconnect callback invalidates the old token;
  release promotion still requires live Privy/provider logout signoff and
  session-auth integration.
- Every mutating route and tool writes append-only audit/replay records with
  actor, route/tool name, idempotency key, before/after summary, and rollback
  handle when applicable. Current V5 audit evidence proves privacy-safe
  before/after route snapshots with public presence, services, events, and
  sandbox aggregate summaries across the V5.1-V5.5 mutating route/tool matrix;
  promotion still requires complete exact per-record before-state reconstruction
  and release replay reconstruction.
- Production feature override tests prove prototype flags cannot be forced on in
  production mode without the intended release controls.
- Public surfaces prove XSS-safe rendering, redaction, and no private Founders
  Plot data leakage.
- Browser player-route coverage proves a same-session `/app` Founders Plot
  entry creates the prerequisite before V5.1+ World Grid mutation, and that the
  same mutation returns `WORLD_GRID_PLOT_REQUIRED` without creating a plot before
  that entry. Current test-mode coverage is
  `e2e/245_world_grid_player_route_prerequisite.spec.js`; release promotion
  still requires live account/wallet provider signoff.
- `server/world_grid/release_promotion.js` keeps the promotion matrix
  code-auditable by naming every V5.0-V5.5 slice plus durable storage,
  owner-index, migration-version, restart-persistence, route/tool mutation
  security, session-bound CSRF, rate-limit, idempotency, audit/replay,
  production override, public-text privacy, player-route prerequisite,
  release replay reconstruction, live provider logout signoff, and
  risk-rate-limit identity targets. The report is non-executing and may not mark
  V5 `releaseReady`, may not enable V6, may not expose player-visible defaults,
  and may not mutate world state.

## Slice Gates

| Slice | Promotion Evidence Required |
| --- | --- |
| V5.0 Region Grid | Deterministic region generation, read-only route coverage, no Founders Plot side-effect creation, restart-safe camera/focus preferences through `WORLD_GRID_REGION_PREFS_SQLITE_PATH` or equivalent release storage if preferences remain mutable, and renderer smoke tests for desktop/mobile framing. |
| V5.1 Territory Claims and Settler Routes | Existing valid plot prerequisite, owner/adjacency checks, resource conservation, idempotent claim/complete/cancel flows, route replay records, and restart-safe claim state. |
| V5.2 Public Presence and Safe Player Discovery | Explicit opt-in/out, public-safe profile schema, malicious name rendering tests, follow/unfollow owner checks, abuse report hooks, and redaction/privacy review. |
| V5.3 Civic Service Advice Prototype | Redacted request inputs, typed advice output schema, no private-state mutation, bounded reputation updates, dispute/report flow, and audit records for accept/report actions. |
| V5.4 World Events and Public Works | Contribution caps, reward conservation, idempotent contribution/reward claim, public ledger entries, rollback policy for event accounting mistakes, and restart-safe contribution records. |
| V5.5 Controlled Free-Play Sandbox Districts | Typed action schemas, moderation before public placement, rollback snapshots, private-town isolation, rate limits, abuse reporting, and restart-safe participant/action/snapshot/cell records. |

## V6 Dependency Rule

V6 civic institutions may not become player-visible until:

1. Every V5 slice above is either `release_ready` or explicitly excluded from the
   V6 dependency surface.
2. Exclusions are documented in the V6 milestone plan with their impact.
3. The V6 readiness gate references the promoted evidence and has deterministic
   Node and Playwright coverage for each dependency.
