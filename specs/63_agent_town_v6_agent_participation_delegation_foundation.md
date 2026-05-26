# Agent Town V6.0 Agent Participation Delegation Foundation

Status: `research_only`

Milestone: `M12 Agent participation controls`

Runtime module: `server/world_civilization/delegations.js`

Contract tests: `tests/world_civilization_delegations.test.js`

Schema contract: `specs/55_agent_town_v6_civic_schema_contracts.md`

## Boundary

This foundation does not make V6 player-visible, does not expose delegation
routes or tools, and does not grant agents authority to mutate public or private
world state.

The store records scoped delegation lifecycle evidence only. Later worker-first
tools and civic effect handlers may consult a compatible delegation store, but
this foundation does not connect delegation policy to runtime execution.

## Data Model

The SQLite table `world_civic_delegations` stores validated `delegation` schema
records with:

- delegation id;
- principal account id;
- delegate agent id;
- scope;
- expiry;
- maximum action budget;
- approval receipt id;
- explicit civic-effect execution permission flag;
- lifecycle status;
- audit ledger entry id;
- creation and update timestamps;
- normalized delegation JSON.

Indexes cover principal/status replay, delegate/scope lookup, and expiry review.

## Safety Rules

- Delegations must pass `validateCivicDelegation` before persistence.
- Private data, Brain/debug traces, wallet secrets, provider credentials, and
  token-like fields are rejected by the shared schema validator.
- Delegations must be unexpired when recorded.
- The same principal/approval receipt pair can be retried only with identical
  normalized delegation content.
- Same-string principal/delegate self-delegation is rejected until policy rules
  explicitly allow it.
- `civic_execution` scope requires `canExecuteCivicEffects: true`.
- Non-execution scopes cannot set civic-effect execution permission.
- Revocation is principal-owned, audited, and removes the delegation from active
  participation policy summaries.
- Participation policy summaries return `executionStatus: "not_executable"`.
- Delegation creation writes `delegation.created` audit entries; revocation
  writes `delegation.revoked` audit entries.

## Release Gate

M12 cannot move to `done` until:

- worker-first V6 tools consult delegation policy instead of backend shortcuts;
- action budgets are consumed atomically and replayably;
- delegated vote/advice/proposal scopes are enforced at every route/tool edge;
- delegated civic execution can only be used after M11 typed handlers and
  rollback gates are release-ready;
- delegation revocation takes effect before any later delegated action can run;
- session/wallet continuity proves the principal authorized the delegation;
- deterministic expiry, revocation, replay, duplicate receipt, self-delegation,
  private-data, and budget-exhaustion tests pass.
