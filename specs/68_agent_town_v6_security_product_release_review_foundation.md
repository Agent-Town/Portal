# Agent Town V6 Security Product Release Review Foundation

Status: `research_only`

Milestone: M17 Security and product release review

Runtime contract: `server/world_civilization/release_review.js`

Security checklist: `docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md`

Test coverage: `tests/world_civilization_release_review.test.js`

## Boundary

This foundation creates the V6 release-review gate contract. It does not
approve V6 for normal gameplay, expose V6 tools, create public civic mechanics,
or replace human security/product signoff.

The review report is feature-gated, research-only, hidden from runtime/player
surfaces, non-executing, and blocked unless all required evidence and signoffs
are present.

## Required Review Gates

- Threat model: trust boundaries, assets, attacker capabilities, abuse paths,
  and mitigations.
- Privacy review: private town isolation, wallet and Brain secret exclusion,
  provider credential exclusion, and debug trace redaction.
- Abuse-case review: spam, harassment, impersonation, unauthorized mutation,
  moderation escalation, and civic mutation security envelope evidence.
- Data-retention policy: audit retention, deletion policy, debug log retention,
  and export policy.
- Audit coverage: append-only ledger, owner indexes, migration versions,
  proposal review transition audit rows, schema metadata drift checks,
  migration rehearsal with unsupported upgrade/downgrade targets failing
  closed, replay reconstruction, rollback handles, governance preflight
  evidence, and non-executing rollback recovery evidence.
- Validation evidence: targeted Node suite, split Playwright smokes,
  all-features regression, feature override safety, and load/rate replay
  evidence, including civic mutation security and governance preflight contract
  coverage.
- Worker tool surface review: runtime manifest source-of-truth evidence,
  OpenClaw Lite worker origin, Worker Traffic and Skill Context observability,
  mutation security envelope coverage, and no backend shortcuts before any
  civic tool exposure.
- Modal lab surface review: town hub modal launch, standalone route denial,
  worker continuity, debug observability, and non-executing panels.
- Product release signoff: player-visible scope, rollback plan, support runbook,
  and disable plan.

## Release Rule

M17 may move to `done` only when the review report can be built with complete
evidence and approved signoff for every gate. Even then, M18 remains separate:
controlled release still needs production-safe enablement, rollback/disable
controls, observability, and support runbooks before V6 becomes player-visible.
