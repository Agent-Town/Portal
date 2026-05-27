# Agent Town V6.0 Civic Schema Contracts

Status: `research_only`

Milestone: `M4 Civic schema contracts`

Runtime module: `server/world_civilization/schemas.js`

Contract tests: `tests/world_civilization_schemas.test.js`

Worker-first tool draft: `specs/59_agent_town_v6_worker_tool_surface_draft.md`

Reputation accountability foundation:
`specs/60_agent_town_v6_reputation_accountability_foundation.md`

Moderation privacy foundation:
`specs/61_agent_town_v6_moderation_privacy_foundation.md`

Civic effect rollback foundation:
`specs/62_agent_town_v6_civic_effect_rollback_foundation.md`

Agent participation delegation foundation:
`specs/63_agent_town_v6_agent_participation_delegation_foundation.md`

Civic institution charter foundation:
`specs/64_agent_town_v6_civic_institution_charter_foundation.md`

Public works shared resources foundation:
`specs/65_agent_town_v6_public_works_shared_resources_foundation.md`

## Boundary

These schemas do not make V6 player-visible. They define the fail-closed
contracts that later V6 routes, worker tools, and audit stores must use.

No V6 proposal, vote, delegation, institution charter, public works
contribution, reputation update, moderation decision, moderation review/appeal,
civic effect, rollback, or audit ledger row may be accepted without passing the
matching schema validator.

## Schema Version

All V6 civic contracts use:

```text
agent-town.v6.civic.v1
```

Versioned civic payloads must be migration-aware before release. Prototype or
unversioned payloads are invalid for V6 civic state.

## Contracts

| Contract | Required Safety Properties |
| --- | --- |
| Proposal | Proposer identity, public scope, affected public state, preview-only effect, moderation class, expiry, idempotency key, rollback plan, and redacted privacy envelope. |
| Vote | Human voter identity, server-verified authorization, eligibility proof, explicit choice, receipt id, and idempotency key. |
| Delegation | Principal account, delegate agent, scoped authority, expiry, action cap, approval receipt, revocability, and explicit civic-effect execution permission. |
| Institution | Human chartering actor, public scope, proposal types, membership and eligibility rules, moderation policy, voting rule, public audit summary, effective timestamp, and redacted privacy envelope. |
| Public Works Contribution | Institution, project, contributor, source reference, requested public resource bundle, idempotency key, public summary, and redacted privacy envelope. |
| Reputation | Subject, awarding account, bounded non-zero delta, source reference, dispute status, and audit entry reference. Self-awards are invalid. |
| Moderation Decision | Subject reference, public surface, approved/rejected/review status, policy version, reviewer kind, reasons, and redacted fields. |
| Moderation Review/Appeal | Decision reference, human requester, review type, queue/outcome status, policy version, reviewer kind, public source references such as abuse reports, reasons, and redacted privacy envelope. |
| Civic Action | Proposal reference, typed public effect, execution authority, handler name, before/after summaries, audit entry, rollback id, and idempotency key. |
| Rollback Plan | Plan id, strategy, explicit rollback support, irreversible-effect list, and maximum rollback window. |
| Audit Ledger Entry | Actor, action type, object reference, idempotency key, before/after hashes, migration version, replayability, rollback handle, and redacted privacy envelope. |

## Privacy Rule

Validators reject private data classes, wallet secrets, provider credentials,
Brain/debug traces, OAuth tokens, bearer tokens, API keys, and secret-like text.
Public civic surfaces may only carry public profile, public world state, and
public audit summary data classes.

## Authorization Rule

Schema validation is not final authorization. Later V6 vote and execution
routes must still verify wallet/session continuity, eligibility, same-origin or
CSRF requirements, rate limits, idempotency, and proposal state. The schema
contract ensures those routes cannot accept a vote without an authorization
object marked as server-verified.

## Worker-First Rule

These contracts are route/tool input contracts, not backend agent policy.
Agent-authored proposals or advice must still be routed through the OpenClaw
Lite worker/tool path and remain visible in worker observability surfaces before
any execution step is considered.

The current V6 civic tool surface remains a research-only draft in
`server/world_civilization/tools.js`. It does not expose runtime tools or
player-visible civic mechanics.
