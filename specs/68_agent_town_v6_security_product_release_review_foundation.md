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
  and moderation escalation.
- Data-retention policy: audit retention, deletion policy, debug log retention,
  and export policy.
- Audit coverage: append-only ledger, owner indexes, migration versions,
  schema metadata drift checks, replay reconstruction, and rollback handles.
- Validation evidence: targeted Node suite, split Playwright smokes,
  all-features regression, and feature override safety.
- Product release signoff: player-visible scope, rollback plan, support runbook,
  and disable plan.

## Release Rule

M17 may move to `done` only when the review report can be built with complete
evidence and approved signoff for every gate. Even then, M18 remains separate:
controlled release still needs production-safe enablement, rollback/disable
controls, observability, and support runbooks before V6 becomes player-visible.
