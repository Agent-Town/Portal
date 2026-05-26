# V5 World Grid Release Promotion Gate

Status: `release_gate`

Blocks: `V6.0 Agent Civilization Foundation`

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
  or CSRF protection, rate limits, and idempotency keys.
- Every mutating route and tool writes append-only audit/replay records with
  actor, route/tool name, idempotency key, before/after summary, and rollback
  handle when applicable.
- Production feature override tests prove prototype flags cannot be forced on in
  production mode without the intended release controls.
- Public surfaces prove XSS-safe rendering, redaction, and no private Founders
  Plot data leakage.

## Slice Gates

| Slice | Promotion Evidence Required |
| --- | --- |
| V5.0 Region Grid | Deterministic region generation, read-only route coverage, no Founders Plot side-effect creation, restart-safe camera/focus preferences if preferences remain mutable, and renderer smoke tests for desktop/mobile framing. |
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
