# Agent Town V6 Persistence Replay Resilience Foundation

Status: `research_only`

Milestone: M16 Persistence, replay, and resilience hardening

Runtime contracts:

- `server/world_civilization/resilience.js`
- `server/world_civilization/replay_reconstruction.js`

Test coverage:

- `tests/world_civilization_resilience.test.js`
- `tests/world_civilization_replay_reconstruction.test.js`
- `tests/world_civilization_process_restart.test.js`
- `tests/world_civilization_proposal_vote_process_restart.test.js`
- `tests/world_civilization_reputation_moderation_process_restart.test.js`
- `tests/world_civilization_effect_process_restart.test.js`
- `tests/world_civilization_delegation_process_restart.test.js`
- `tests/world_civilization_institution_process_restart.test.js`
- `tests/world_civilization_public_works_process_restart.test.js`
- `tests/world_civilization_schema_metadata.test.js`
- `tests/world_civilization_load_rate.test.js`

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
v1 migration marker is stamped into on-disk schema metadata, restart-style test
coverage is named, and the required replay/list/count/schema metadata methods
are present. It also rejects forbidden execution methods such as direct
proposal/effect execution or private inventory spend.

`server/world_civilization/sqlite_schema.js` centralizes the current
research-only SQLite schema metadata contract. Every current V6 civic store
records a `world_civic_schema_metadata` row with `migrationVersion: v1`,
`schemaUserVersion: 1`, the module path, and `releaseStatus: research_only`.
The metadata layer fails closed when a database advertises an unsupported
SQLite `user_version` or a mismatched store migration marker.

`server/world_civilization/replay_reconstruction.js` reconstructs a
privacy-safe summary from civic audit ledger replay rows. The reconstruction
verifies sequence order, hash-chain continuity, redacted privacy envelopes,
action counts, migration-version counts, rollback handle counts, and paginated
ledger replay without applying world state or exposing actor account ids.

`tests/world_civilization_process_restart.test.js` adds process-level restart
evidence for the civic audit ledger by seeding, closing, reopening, replaying,
and retrying exact idempotent writes across separate Node process lifetimes
against the same SQLite file.

`tests/world_civilization_proposal_vote_process_restart.test.js` extends the
same process-level evidence to dependent proposal and vote stores: one process
drafts a proposal, a later process records a vote against the reopened proposal
store, a third process reconstructs the audit replay, and exact retries remain
idempotent after restart.

`tests/world_civilization_reputation_moderation_process_restart.test.js`
extends the same process-level evidence to reputation and moderation stores:
separate processes record a bounded reputation entry and a redacted moderation
decision, reconstruct the privacy-safe audit replay, and prove exact retries do
not add duplicate store rows or audit entries after restart.

`tests/world_civilization_effect_process_restart.test.js` extends the
process-level evidence to civic effect rollback preparation: one process seeds
the proposal, approved moderation decision, and approval vote prerequisites, a
later process prepares the non-executing civic action and rollback handle, a
third process reconstructs replay, and exact retries do not append duplicate
effect, rollback, or audit rows after restart.

`tests/world_civilization_delegation_process_restart.test.js` extends the
process-level evidence to agent participation controls: separate processes
record scoped advice and explicit civic-execution delegations, revoke the
advice delegation through the principal account, reconstruct privacy-safe audit
replay, and prove exact retries do not append duplicate delegation or audit
rows after restart.

`tests/world_civilization_institution_process_restart.test.js` extends the
process-level evidence to civic institution charters: separate processes record
public-works and sandbox-policy charters, reconstruct privacy-safe audit replay,
and prove exact retries do not append duplicate institution or audit rows after
restart.

`tests/world_civilization_public_works_process_restart.test.js` extends the
process-level evidence to shared public-works accounting: separate processes
reopen the required institution and public-works stores, record capped
contributions, reconstruct privacy-safe audit replay, and prove exact retries
do not append duplicate contribution or audit rows after restart.

`tests/world_civilization_schema_metadata.test.js` proves every current civic
store exposes v1 schema metadata to the resilience report and rejects version
drift before the store can be used.

`tests/world_civilization_load_rate.test.js` adds research-scale load/rate
evidence for the civic audit ledger: a larger append burst is replayed through
bounded pages, exact duplicate retries do not create new rows, changed
idempotency-key reuse fails closed, and replay reconstruction remains
privacy-safe and non-executing.

## Open Release Gaps

M16 remains incomplete until all of these gates close:

- Release-grade process restart tests for every civic store beyond the current
  research-only audit-ledger, proposal/vote, reputation/moderation,
  effect/rollback, delegation, institution, and public-works restart replay
  probes.
- Release-grade replay reconstruction across process restart, larger datasets,
  and every civic summary surface.
- Release-grade migration upgrade and downgrade scripts/tests for every civic
  table beyond the current v1 metadata and fail-closed drift checks.
- Release-grade load/rate tests for production route limits, store-specific
  throughput targets, multi-process write contention, and replay pagination
  beyond the current research-scale duplicate/replay probe.
- Rollback recovery tests that prove prepared rollback handles can survive
  failure and drive real recovery once effect execution exists.

## Definition Of Done

M16 may move to `done` only when the current resilience report is replaced or
extended by release-grade evidence for every store, every mutating route, and
every replay/rollback path. Until then, this foundation is a baseline contract
for tracking gaps, not a production persistence claim.
