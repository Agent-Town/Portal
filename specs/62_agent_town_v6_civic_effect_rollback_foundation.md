# Agent Town V6.0 Civic Effect Rollback Foundation

Status: `research_only`

Milestone: `M11 Civic effect execution and rollback`

Runtime module: `server/world_civilization/effects.js`

Contract tests: `tests/world_civilization_effects.test.js`

Schema contract: `specs/55_agent_town_v6_civic_schema_contracts.md`

## Boundary

This foundation does not make V6 player-visible, does not expose civic routes or
tools, and does not mutate world-grid, Founders Plot, public works, sandbox, or
normal gameplay state.

The store records a prepared civic effect and rollback handle only after the
proposal, vote, and moderation foundations can prove the action has a valid
public proposal, an approved moderation decision, and a human approval receipt.
It is readiness evidence for later typed execution handlers, not an execution
engine.

## Data Model

The SQLite table `world_civic_effect_actions` stores validated `action` schema
records with:

- action id;
- proposal id;
- public effect type;
- handler name;
- execution authority kind and receipt;
- rollback id;
- idempotency key;
- status;
- audit ledger entry id;
- creation timestamp;
- normalized action JSON;
- normalized rollback plan JSON.

The SQLite table `world_civic_rollback_records` stores rollback handles with:

- rollback id;
- action id;
- proposal id;
- rollback plan id;
- rollback status;
- maximum rollback window;
- creation timestamp;
- normalized rollback plan JSON.

Indexes cover proposal/status replay, effect-type replay, and rollback
proposal/status replay.

## Safety Rules

- Actions must pass `validateCivicAction` before persistence.
- Rollback plans must pass `validateRollbackPlan` before persistence.
- The referenced proposal must exist and must not be expired.
- The action effect type must match the proposal preview effect type.
- The rollback plan id must match the proposal rollback plan id.
- The proposal must have an approved moderation decision for its moderation
  class.
- The proposal must have at least one approving vote and more approvals than
  rejections.
- Human-approved actions must reference an approving vote receipt.
- Delegated execution is rejected until M12 defines scoped delegation storage
  and enforcement.
- Idempotency reuse is accepted only when the validated action and rollback
  plan are identical.
- Summaries return `appliesWorldState: false` and `executionStatus:
  "not_executable"`.
- Prepared effects write `civic_action.prepared` audit ledger entries, not
  `civic_action.applied`.

## Release Gate

M11 cannot move to `done` until:

- typed effect handlers exist for every supported public civic effect;
- execution is authorized by human approval or a valid M12 delegation;
- before/after summaries are generated from real pre/post state;
- rollback handlers are implemented, tested, and linked to each applied effect;
- irreversible actions are explicitly excluded or separately reviewed;
- restart replay can reconstruct prepared, applied, rolled back, and failed
  effect states;
- conservation tests prove public works/shared resources do not create or lose
  resources outside documented rules;
- deterministic schema, prerequisite, idempotency, rollback, audit, replay, and
  private-data rejection tests pass.
