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
| Validation evidence | Targeted Node suite, split Playwright smokes, all-features regression, feature override safety, vote authorization readiness gate, store-backed delegation proof, effect execution gate, agent participation enforcement gate, institution readiness gate, public works readiness gate, lab readiness gate, resilience readiness gate | Includes mutation security, vote approval policy, delegated-agent proof, governance preflight, non-executing M8 vote authorization readiness gate, non-executing M11 effect execution gate, non-executing M12 agent participation enforcement gate, non-executing M13 institution readiness gate, non-executing M14 public works readiness gate, non-executing M15 lab readiness gate, and non-executing M16 resilience readiness gate contract coverage; pending release-candidate run |
| Effect execution and rollback review | Typed apply handlers, typed rollback handlers, real before/after state, authorization enforcement, idempotent apply/rollback, irreversible-action review, conservation tests, applied/rollback audit, worker/route security | Research-only M11 execution gate exists and remains non-executing; pending real typed handlers, rollback execution, conservation proof, and security/product signoff |
| Vote authorization readiness review | Server-verified voter authorization, eligibility rule verification, one-vote accounting, idempotent receipt replay, changed-vote replay rejection, proposal expiry denial, delegation policy review, per-institution voting templates, route-edge vote auth, quorum/threshold policy, governance-preflight integration, vote audit rows, private-data exclusion, no effect application | Research-only M8 vote authorization readiness gate exists and remains non-executing with no vote-outcome application and no runtime/player exposure; pending route-edge vote auth, release-reviewed per-institution voting templates, and security/product signoff |
| Agent participation enforcement review | Worker-tool scope enforcement, route-edge scope/expiry/budget/revocation checks, principal wallet/session binding, idempotent budget consumption, store-backed delegation proof, delegation audit rows, no backend shortcuts, no public autonomous mutation | Research-only M12 enforcement gate exists and remains non-executing; pending real worker/tool enforcement, route-edge authorization, and security/product signoff |
| Civic institution readiness review | Release-reviewed charter templates, membership rules, eligibility rules, voting rules, moderation policies, proposal-type rules, public audit summaries, public text rendering, delegation policy linkage, charter-change execution/rollback review, private-data exclusion, institution audit rows, no player-visible institutions, no world mutation | Research-only M13 institution readiness gate exists and remains non-executing; pending real worker/tool integration, public surface review, applied charter-change execution/rollback implementation, and security/product signoff |
| Public works readiness review | Governed project review, worker/tool enforcement, wallet/session route authorization, durable idempotency, explicit inventory-spend authorization, inventory restart replay, resource conservation tests, reward conservation, contribution caps under retry, rollback execution review, public text rendering, private-data exclusion, public-works audit rows, process restart replay, no private-town mutation, no public free play | Research-only M14 public works readiness gate exists and remains non-executing; pending real worker/tool integration, authorized private-inventory spend, reward/rollback execution, public surface review, and security/product signoff |
| Worker tool surface review | Runtime manifest source of truth, OpenClaw Lite worker origin, Worker Traffic and Skill Context observability, mutation security envelope, no backend shortcuts | Research-only tool exposure gate exists; pending real worker routing, production override/browser coverage, and release signoff |
| Modal lab surface review | Town hub modal launch, standalone route denial, worker continuity, debug observability, non-executing panels, browser visual 390/768/1280 coverage, keyboard accessibility, focus trap review, runtime tool absence, normal gameplay exposure denial, private debug-data exclusion | Research-only M15 lab readiness gate exists and remains non-executing; pending real modal UI, screenshot review, accessibility review, and release signoff |
| Persistence replay resilience readiness review | All civic store restart probes, audit replay reconstruction, privacy-safe replay summaries, hash-chain integrity, migration upgrade/downgrade scripts, unsupported transition denial, backup/restore rehearsal, migration load replay rehearsal, production load/rate targets, multi-process write contention, duplicate retry bursts, rollback handle reconstruction, typed rollback execution recovery, private-data exclusion, no effect application during replay | Research-only M16 resilience readiness gate exists and remains non-executing with no migration application, no rollback application, no world mutation, and no runtime/player exposure; pending release-grade migration scripts, backup/restore rehearsal, production load/rate evidence, multi-process write-contention evidence, and real rollback execution recovery |
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
