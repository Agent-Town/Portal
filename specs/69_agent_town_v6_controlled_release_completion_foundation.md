# Agent Town V6 Controlled Release Completion Foundation

Status: `research_only`

Milestone: M18 V6 controlled release completion

Runtime contracts:

- `server/world_civilization/readiness_gate.js`
- `server/world_civilization/blocker_exception_register.js`
- `server/world_civilization/controlled_release.js`
- `server/world_civilization/controlled_release_targets.js`

Runbook: `docs/ops/V6_AGENT_CIVILIZATION_CONTROLLED_RELEASE_RUNBOOK.md`

Test coverage: `tests/world_civilization_controlled_release.test.js`

Target coverage: `tests/world_civilization_controlled_release_targets.test.js`

## Boundary

This foundation defines the final controlled-release readiness contract. It does
not enable V6 in production, expose V6 civic mechanics in normal gameplay,
create public autonomous agents, or bypass any M0-M17 gate.

The report remains hidden from runtime/player surfaces and keeps
`productionEnabled: false`. It can report release readiness only when all prior
milestones are `done`, the M17 release-review report is ready, an explicit V6
readiness-gate report from `buildV6ReadinessGateReport()` is closed, and every
controlled-release gate has complete evidence and approved signoff. The
research-only target matrix records launch-control evidence without approving
release or enabling production.

## Required Controlled-Release Gates

- controlled release target gate for readiness closure, production flag safety,
  rollback/disable controls, privacy-safe observability, support runbook,
  blocker clearance, release window, canary exit, emergency disable, and
  post-release verification.
- V6 readiness gate closed, including an explicit closed readiness-gate report
  that remains hidden from runtime/player surfaces until controlled release and
  carries the M16/M17 audit-summary proof checks.
- Production feature flag safety.
- Rollback and disable controls.
- Release observability.
- Support runbook.
- Release blocker clearance through the blocker/exception register, including
  P0/P1 clearance, no expired exceptions, owner/expiry/mitigation records,
  security dependency review, QA signoff, product signoff, and private-data
  exclusion.
- Controlled release window.

## Release Rule

M18 may move to `done` only when the controlled-release report has complete
evidence for every gate, the V6 readiness-gate report is closed, and the
deployment path still requires an explicit production action outside this
research-only contract. A green report is a go/no-go artifact, not an automatic
player-visible enablement mechanism.

## Non-Goals

- No public autonomous agents mutating other users' worlds.
- No real public free play.
- No production rollout without M0-M17 completion.
- No release approval without security, QA, and product signoff.
