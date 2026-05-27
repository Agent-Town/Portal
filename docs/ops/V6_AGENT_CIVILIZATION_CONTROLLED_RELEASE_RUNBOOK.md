# V6 Agent Civilization Controlled Release Runbook

Status: `research_only`

Runtime gate: `server/world_civilization/controlled_release.js`

Runtime target matrix: `server/world_civilization/controlled_release_targets.js`

Blocker register: `server/world_civilization/blocker_exception_register.js`

Release evidence manifest: `server/world_civilization/release_evidence_manifest.js`

Observability handoff: `server/world_civilization/release_observability.js`

Support runbook handoff: `server/world_civilization/release_support.js`

Release operations gate: `server/world_civilization/release_operations.js`

Release signoff packet: `server/world_civilization/release_signoff_packet.js`

Readiness gate source: `server/world_civilization/readiness_gate.js`

Milestone: M18 V6 controlled release completion

This runbook records the required controlled-release evidence. It is not a
production enablement switch and does not approve player-visible V6.

## Required Evidence

| Gate | Required Checks | Current Status |
| --- | --- | --- |
| Controlled release target gate | Readiness gate closed target, production flag safety target, rollback/disable target, release evidence manifest target, observability target, release observability handoff, release operations target, release signoff packet target, support runbook target, release support runbook, blocker clearance target, blocker/exception register, controlled release window target, canary exit target, emergency disable target, post-release verification target | Pending |
| V6 readiness gate closed | M0-M17 done, explicit closed V6.0 readiness-gate report from `buildV6ReadinessGateReport()`, readiness report hidden until controlled release, readiness audit-summary proof, release review ready | Pending |
| Production feature flag safety | Release operations gate, production flag control, default off, admin-only enablement, broad override exclusion, canary cohort, emergency disable | Pending |
| Rollback and disable controls | Release operations gate, disable plan, rollback owner, rollback window, rollback rehearsal, rollback/disable drill, data preservation, post-disable verification | Pending |
| Release evidence manifest | Release-candidate environment, command transcripts, targeted Node results, split Playwright results, all-features regression, production override recheck, runtime tool absence recheck, browser console error budget, Playwright trace archive, blocker register, release signoff packet, operations handoff, observability handoff, support handoff, audit/replay health, controlled-release runbook | Pending |
| Release observability | Audit metrics, Worker Traffic trace, error alerts, privacy-safe logs, feature flag dashboard, monitoring owner, runtime tool absence monitor, support escalation link | Pending |
| Support runbook | Known issues, support triage, incident response, user communications, rollback contact, support on-call, escalation owners, privacy-safe support view, blocker register link, observability link | Pending |
| Release signoff packet | Product owner approval, QA owner signoff, security owner signoff, privacy owner signoff, support owner signoff, release manager approval, engineering owner approval, blocker register acceptance, release-candidate packet acceptance, operations handoff acceptance, observability handoff acceptance, support runbook acceptance | Pending |
| Release blocker clearance | Blocker/exception register, no P0 blockers, no P1 blockers, no expired exceptions, exception owner/expiry/mitigation, security dependency review, QA signoff, product signoff | Pending |
| Controlled release window | Release operations gate, release window, canary scope, canary exit criteria, emergency disable, rollback window, monitoring owner, go/no-go record, post-release verification, normal gameplay baseline, audit/replay health check, evidence archive | Pending |
| Controlled release operations | Production flag control, release window, go/no-go record, canary scope, canary exit, emergency disable, rollback window, rollback/disable drill, post-release verification, normal gameplay baseline, audit/replay health check, evidence archive | Pending |

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
