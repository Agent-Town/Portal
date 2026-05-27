# V6 Agent Civilization Controlled Release Runbook

Status: `research_only`

Runtime gate: `server/world_civilization/controlled_release.js`

Runtime target matrix: `server/world_civilization/controlled_release_targets.js`

Readiness gate source: `server/world_civilization/readiness_gate.js`

Milestone: M18 V6 controlled release completion

This runbook records the required controlled-release evidence. It is not a
production enablement switch and does not approve player-visible V6.

## Required Evidence

| Gate | Required Checks | Current Status |
| --- | --- | --- |
| Controlled release target gate | Readiness gate closed target, production flag safety target, rollback/disable target, observability target, support runbook target, blocker clearance target, controlled release window target, canary exit target, emergency disable target, post-release verification target | Pending |
| V6 readiness gate closed | M0-M17 done, explicit closed V6.0 readiness-gate report from `buildV6ReadinessGateReport()`, readiness report hidden until controlled release, readiness audit-summary proof, release review ready | Pending |
| Production feature flag safety | Default off, admin-only enablement, broad override exclusion, canary cohort, emergency disable | Pending |
| Rollback and disable controls | Disable plan, rollback owner, rollback rehearsal, data preservation, post-disable verification | Pending |
| Release observability | Audit metrics, Worker Traffic trace, error alerts, privacy-safe logs, feature flag dashboard | Pending |
| Support runbook | Known issues, support triage, incident response, user communications, rollback contact | Pending |
| Release blocker clearance | No P0 blockers, no P1 blockers, security dependency review, QA signoff, product signoff | Pending |
| Controlled release window | Release window, canary exit criteria, rollback window, monitoring owner, go/no-go record | Pending |

## Production Enablement Rule

The code-level controlled-release report must keep `productionEnabled: false`.
Actual production enablement must be an explicit deployment action after all
M0-M18 gates are complete and signed off.

## Emergency Disable Requirements

- One owner must be named for the disable action.
- Disable must be reversible without data loss.
- Public civic effects must stop accepting new writes immediately.
- Existing audit records must remain replayable.
- Support and QA must verify normal gameplay visibility returns to the
  pre-release baseline.

## Current Decision

Final V6 release decision: `not_approved`
