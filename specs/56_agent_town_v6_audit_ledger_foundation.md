# Agent Town V6.0 Civic Audit Ledger Foundation

Status: `research_only`

Milestones: `M3 Release-grade world storage`, `M11 Civic effect execution and rollback`, `M16 Persistence, replay, and resilience hardening`

Runtime module: `server/world_civilization/audit_ledger.js`

Contract tests: `tests/world_civilization_audit_ledger.test.js`

## Boundary

The civic audit ledger is a route-neutral persistence foundation. It does not
enable player-visible V6 mechanics, proposals, votes, or autonomous civic
effects. Later V6 routes and worker tools must use this foundation, or a
compatible stronger store, before accepting mutating civic actions.

## Storage Properties

- SQLite-backed durable table, not a process-local `Map`.
- Append-only records with monotonically increasing `seq`.
- Stable hash chain using `prevEntryHash` and `entryHash`.
- Unique `entryId`.
- Unique `(actorAccountId, idempotencyKey)` pair.
- Owner, object, and action indexes for replay and audit lookup.
- Validates every row with `server/world_civilization/schemas.js` before insert.
- Rejects private data, unredacted audit payloads, and unsupported schema
  versions before persistence.

## Replay Properties

Replay returns entries in ascending sequence order. Consumers can replay all
entries, replay by actor account, replay by object reference, or continue after a
known sequence number.

Prepared civic effects use `civic_action.prepared` audit entries. They are
readiness evidence for rollback handles and must not be treated as
`civic_action.applied` world-state mutations.

Delegation lifecycle changes use `delegation.created` and
`delegation.revoked` audit entries. They are participation-control evidence and
must not be treated as agent execution authority unless later route/tool checks
verify active scope, expiry, budget, and principal approval.

Research-only institution charters use `institution.chartered` audit entries.
They are charter evidence and must not be treated as player-visible civic
institutions until the M13 release gate closes.

## Idempotency Rule

Repeating the same `(actorAccountId, idempotencyKey)` with the same normalized
entry returns the original ledger row and does not append. Reusing the pair with
different content fails with `CIVIC_AUDIT_IDEMPOTENCY_CONFLICT`.

## Release Boundary

This foundation is necessary but not sufficient for release-grade V6 storage.
Before V6 release, civic proposal, vote, delegation, reputation, moderation,
rollback, and public-effect state must also have durable owner indexes,
migration tests, backup/restore procedures, and restart persistence tests.
