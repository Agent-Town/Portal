# Agent Town V6 Persistence Replay Resilience Foundation

Status: `research_only`

Milestone: M16 Persistence, replay, and resilience hardening

Runtime contract: `server/world_civilization/resilience.js`

Test coverage: `tests/world_civilization_resilience.test.js`

## Boundary

This foundation records the current V6 civic persistence and replay evidence
without claiming release-grade resilience. It does not add player-visible V6
mechanics, autonomous civic agents, mutating civic routes, or production
storage promotion.

The baseline is intentionally fail-closed:

- It requires explicit `FEATURE_WORLD_V60_AGENT_CIVILIZATION` research opt-in.
- Broad V5 prototype overrides such as `WORLD_GRID_FEATURE_FLAGS=all` do not
  enable the resilience report.
- The report stays `research_only`, hidden from players, hidden from runtime
  tools, non-executing, and `releaseReady: false`.

## Current Evidence

`server/world_civilization/resilience.js` checks the current SQLite-backed V6
research stores:

- Civic audit ledger.
- Proposal lifecycle.
- Vote authorization.
- Reputation accountability.
- Moderation privacy.
- Civic effect rollback preparation.
- Agent participation delegation.
- Civic institution charters.
- Public works shared-resource accounting.

For each store, the baseline verifies that a SQLite path exists, the expected
v1 migration marker is documented, restart-style test coverage is named, and
the required replay/list/count methods are present. It also rejects forbidden
execution methods such as direct proposal/effect execution or private inventory
spend.

## Open Release Gaps

M16 remains incomplete until all of these gates close:

- Process restart tests, not only same-process close/reopen tests.
- Replay reconstruction tests that rebuild civic summaries from audit records.
- Migration upgrade and downgrade tests for every civic table.
- Load/rate tests for duplicate suppression, idempotent retries, and replay
  pagination.
- Rollback recovery tests that prove prepared rollback handles can survive
  failure and drive real recovery once effect execution exists.

## Definition Of Done

M16 may move to `done` only when the current resilience report is replaced or
extended by release-grade evidence for every store, every mutating route, and
every replay/rollback path. Until then, this foundation is a baseline contract
for tracking gaps, not a production persistence claim.
