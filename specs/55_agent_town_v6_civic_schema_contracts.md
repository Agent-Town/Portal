# Agent Town V6.0 Civic Schema Contracts

Status: `research_only`

Milestone: `M4 Civic schema contracts`

Runtime module: `server/world_civilization/schemas.js`

Contract tests: `tests/world_civilization_schemas.test.js`

## Boundary

These schemas do not make V6 player-visible. They define the fail-closed
contracts that later V6 routes, worker tools, and audit stores must use.

No V6 proposal, vote, delegation, reputation update, moderation decision, civic
effect, rollback, or audit ledger row may be accepted without passing the
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
| Proposal | Proposer identity, public scope, affected public state, preview-only effect, moderation class, expiry, rollback plan, and redacted privacy envelope. |
| Vote | Human voter identity, server-verified authorization, eligibility proof, explicit choice, receipt id, and idempotency key. |
| Delegation | Principal account, delegate agent, scoped authority, expiry, action cap, approval receipt, revocability, and explicit civic-effect execution permission. |
| Reputation | Subject, awarding account, bounded non-zero delta, source reference, dispute status, and audit entry reference. Self-awards are invalid. |
| Moderation Decision | Subject reference, public surface, approved/rejected/review status, policy version, reviewer kind, reasons, and redacted fields. |
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
