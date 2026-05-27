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
| Abuse-case review | Spam, harassment, impersonation, unauthorized mutation, store-backed delegation proof, delegation scope mismatch, delegation budget read-only proof, moderation escalation | Research-only V6 civic mutation security envelope exists with store-backed delegated-agent proof coverage; pending trust and safety review |
| Data-retention policy | Audit retention, deletion policy, debug log retention, export policy | Pending full review |
| Audit coverage | Append-only ledger, owner indexes, migration versions, proposal review transitions, reputation/moderation links, replay reconstruction, governance preflight, rollback handles | Research-only proposal `ready_for_vote`/`rejected` transitions write `proposal.reviewed` audit rows, reputation disputes can require linked moderation decisions before persistence, replay reconstruction, v1 schema metadata drift checks, migration rehearsal with unsupported upgrade/downgrade targets failing closed, process restart probes for all current civic stores, audit-ledger load/rate replay evidence, governance preflight coverage, and non-executing rollback recovery handle reconstruction exist; pending M16 release-grade replay, migration scripts, production load/rate, and real rollback recovery completion |
| Validation evidence | Targeted Node suite, split Playwright smokes, all-features regression, feature override safety, store-backed delegation proof, effect execution gate, agent participation enforcement gate | Includes mutation security, vote approval policy, delegated-agent proof, governance preflight, non-executing M11 effect execution gate, and non-executing M12 agent participation enforcement gate contract coverage; pending release-candidate run |
| Effect execution and rollback review | Typed apply handlers, typed rollback handlers, real before/after state, authorization enforcement, idempotent apply/rollback, irreversible-action review, conservation tests, applied/rollback audit, worker/route security | Research-only M11 execution gate exists and remains non-executing; pending real typed handlers, rollback execution, conservation proof, and security/product signoff |
| Agent participation enforcement review | Worker-tool scope enforcement, route-edge scope/expiry/budget/revocation checks, principal wallet/session binding, idempotent budget consumption, store-backed delegation proof, delegation audit rows, no backend shortcuts, no public autonomous mutation | Research-only M12 enforcement gate exists and remains non-executing; pending real worker/tool enforcement, route-edge authorization, and security/product signoff |
| Worker tool surface review | Runtime manifest source of truth, OpenClaw Lite worker origin, Worker Traffic and Skill Context observability, mutation security envelope, no backend shortcuts | Research-only tool exposure gate exists; pending real worker routing, production override/browser coverage, and release signoff |
| Modal lab surface review | Town hub modal launch, standalone route denial, worker continuity, debug observability, non-executing panels | Research-only launch-plan contract and Node coverage exist; pending real modal UI and Playwright visual review |
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
