# V6 Agent Civilization Release Review

Status: `research_only`

Runtime gate: `server/world_civilization/release_review.js`

Milestone: M17 Security and product release review

This document is the security/product review checklist for V6 Agent
Civilization. It records required evidence only. It is not a release approval,
and it must not be used to make V6 player-visible by itself.

## Review Gates

| Gate | Required Evidence | Current Status |
| --- | --- | --- |
| Threat model | Trust boundaries, assets, attacker capabilities, abuse paths, mitigations | Pending full review |
| Privacy review | Private town isolation, wallet secret exclusion, Brain/provider secret exclusion, debug trace redaction | Pending full review |
| Abuse-case review | Spam, harassment, impersonation, unauthorized mutation, moderation escalation | Pending full review |
| Data-retention policy | Audit retention, deletion policy, debug log retention, export policy | Pending full review |
| Audit coverage | Append-only ledger, owner indexes, migration versions, replay reconstruction, rollback handles | Research-only replay reconstruction and audit-ledger process restart probe exist; pending M16 release completion |
| Validation evidence | Targeted Node suite, split Playwright smokes, all-features regression, feature override safety | Pending release-candidate run |
| Product signoff | Player-visible scope, rollback plan, support runbook, disable plan | Pending product review |

## Non-Approval Statement

Current V6 work remains research-only. The branch may contain schemas, stores,
contracts, and deterministic tests, but normal gameplay exposure requires every
gate above to have complete evidence and explicit signoff, followed by the M18
controlled release gate.

## Required Signoff Fields

These fields intentionally remain unapproved until a release-candidate review:

- Security reviewer: `pending`
- Privacy reviewer: `pending`
- Trust and safety reviewer: `pending`
- QA reviewer: `pending`
- Product reviewer: `pending`
- Final release decision: `not_approved`
