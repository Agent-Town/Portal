# Agent Town V6.0 Agent Participation Delegation Foundation

Status: `research_only`

Milestone: `M12 Agent participation controls`

Runtime module: `server/world_civilization/delegations.js`

Contract tests:

- `tests/world_civilization_delegations.test.js`
- `tests/world_civilization_delegation_process_restart.test.js`

Schema contract: `specs/55_agent_town_v6_civic_schema_contracts.md`

## Boundary

This foundation does not make V6 player-visible, does not expose delegation
routes or tools, and does not grant agents authority to mutate public or private
world state.

The store records scoped delegation lifecycle and action-budget evidence only.
Later worker-first tools and civic effect handlers may consult a compatible
delegation store, but this foundation does not connect delegation policy to
runtime execution.

`server/world_civilization/governance_preflight.js` may validate delegation
proof read-only for a delegated civic action. That proof requires an active
`civic_execution` delegation whose principal, delegate, approval receipt,
permission flag, expiry, and remaining action budget match the action context.
The preflight does not consume delegation budget and does not make delegated
effect preparation available.

`server/world_civilization/mutation_security.js` also validates delegated-agent
proof read-only for future route/tool mutations. Future route/tool adapters
must name the required delegation scope, and the envelope must see a matching
active delegation with remaining budget before an agent actor can reach any
civic store.

The process-level restart proof currently covers creation of scoped advice and
explicit civic-execution delegations, idempotent budget consumption, and
principal-owned revocation. It proves policy summaries and audit replay survive
separate Node process lifetimes, and exact retries do not append duplicate
delegation, usage, or audit rows.

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

The SQLite table `world_civic_delegation_action_uses` stores normalized action
budget usage records with:

- usage id;
- delegation id;
- principal account id;
- delegate agent id;
- scope;
- action reference;
- idempotency key;
- audit ledger entry id;
- creation timestamp;
- normalized usage JSON.

Indexes cover delegation replay, principal/scope replay, and agent/scope replay.

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
- Delegated action budget usage is idempotent by delegation/idempotency key,
  audited, and rejected when the delegation is missing, mismatched, expired,
  revoked, or budget-exhausted.
- Governance preflight delegation proof is read-only; the legacy
  `allowDelegatedExecution` boolean cannot grant authority without a matching
  active delegation proof, and delegated preparation remains blocked while M12
  route/tool enforcement is incomplete.
- Mutation security delegated-agent proof is store-backed and scope-bound; a
  loose `verified: true` proof object is not enough to bind an agent actor.
- Participation policy summaries return `executionStatus: "not_executable"`.
- Delegation creation writes `delegation.created` audit entries; action-budget
  usage writes `delegation.action_consumed` audit entries; revocation writes
  `delegation.revoked` audit entries.

## Release Gate

M12 cannot move to `done` until:

- worker-first V6 tools consult delegation policy instead of backend shortcuts;
- action budgets are consulted by worker-first tools and route-edge guards
  before any delegated action runs;
- delegated vote/advice/proposal scopes are enforced at every route/tool edge;
- delegated civic execution can only be used after M11 executable effect
  handlers and rollback gates are release-ready;
- delegation revocation takes effect before any later delegated action can run;
- session/wallet continuity proves the principal authorized the delegation;
- deterministic expiry, revocation, replay, duplicate receipt, duplicate usage,
  self-delegation, private-data, and budget-exhaustion tests pass.
