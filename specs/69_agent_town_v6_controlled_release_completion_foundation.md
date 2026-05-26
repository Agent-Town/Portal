# Agent Town V6 Controlled Release Completion Foundation

Status: `research_only`

Milestone: M18 V6 controlled release completion

Runtime contract: `server/world_civilization/controlled_release.js`

Runbook: `docs/ops/V6_AGENT_CIVILIZATION_CONTROLLED_RELEASE_RUNBOOK.md`

Test coverage: `tests/world_civilization_controlled_release.test.js`

## Boundary

This foundation defines the final controlled-release readiness contract. It does
not enable V6 in production, expose V6 civic mechanics in normal gameplay,
create public autonomous agents, or bypass any M0-M17 gate.

The report remains hidden from runtime/player surfaces and keeps
`productionEnabled: false`. It can report release readiness only when all prior
milestones are `done`, the M17 release-review report is ready, and every
controlled-release gate has complete evidence and approved signoff.

## Required Controlled-Release Gates

- V6 readiness gate closed.
- Production feature flag safety.
- Rollback and disable controls.
- Release observability.
- Support runbook.
- Release blocker clearance.
- Controlled release window.

## Release Rule

M18 may move to `done` only when the controlled-release report has complete
evidence for every gate and the deployment path still requires an explicit
production action outside this research-only contract. A green report is a
go/no-go artifact, not an automatic player-visible enablement mechanism.

## Non-Goals

- No public autonomous agents mutating other users' worlds.
- No real public free play.
- No production rollout without M0-M17 completion.
- No release approval without security, QA, and product signoff.
