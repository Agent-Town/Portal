# Agent Town V6.0 Civic Effect Rollback Foundation

Status: `research_only`

Milestone: `M11 Civic effect execution and rollback`

Runtime module: `server/world_civilization/effects.js`

Governance preflight: `server/world_civilization/governance_preflight.js`

Recovery report: `server/world_civilization/rollback_recovery.js`

Contract tests:

- `tests/world_civilization_effects.test.js`
- `tests/world_civilization_governance_preflight.test.js`
- `tests/world_civilization_effect_process_restart.test.js`
- `tests/world_civilization_rollback_recovery.test.js`

Schema contract: `specs/55_agent_town_v6_civic_schema_contracts.md`

## Boundary

This foundation does not make V6 player-visible, does not expose civic routes or
tools, and does not mutate world-grid, Founders Plot, public works, sandbox, or
normal gameplay state.

The store records a prepared civic effect and rollback handle only after the
proposal, vote, and moderation foundations can prove the action has a valid
public proposal, a completed approved proposal review transition, an approved
moderation decision, and a human approval receipt. It is readiness evidence for
later typed execution handlers, not an execution engine.

Those prerequisites are centralized in
`server/world_civilization/governance_preflight.js`. `effects.js` calls the
preflight before any prepared action, rollback record, or audit row is written,
and failed preflights preserve the existing `CIVIC_EFFECT_*` error surface.

The schema layer now has a typed effect handler registry for
`public_summary`, `public_works_accounting`, `sandbox_policy`, and
`charter_update`. The registry only validates that a prepared action references
the correct future handler name for its effect type. It does not expose apply or
rollback functions.

The process-level restart proof currently covers prepared-effect and rollback
handle persistence only. It proves a prepared action can be created after
proposal, approved moderation, and approval-vote prerequisites are reopened in
a later Node process, and that exact retries do not append duplicate effect,
rollback, or audit rows.

The rollback recovery report is also research-only. It reconstructs prepared
rollback handles from the effect store and audit ledger after restart, verifies
that the handle is still linked to a redacted `civic_action.prepared` audit
entry, and returns `executionStatus: "not_executable"` with
`releaseReady: false`. It does not apply or roll back world state.

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
- Action handler names must match the typed effect handler registry before
  persistence.
- Rollback plans must pass `validateRollbackPlan` before persistence.
- The referenced proposal must exist and must not be expired.
- The referenced proposal must be review-ready: status `ready_for_vote` and
  moderation status `approved`.
- The action effect type must match the proposal preview effect type.
- The rollback plan id must match the proposal rollback plan id.
- The proposal must have an approved moderation decision for its moderation
  class.
- The proposal must have at least one approving vote and more approvals than
  rejections.
- Human-approved actions must reference an approving vote receipt.
- Delegated execution is rejected until M12 defines scoped delegation storage
  and enforcement.
- `server/world_civilization/governance_preflight.js` must pass before
  prepared effect persistence.
- Idempotency reuse is accepted only when the validated action and rollback
  plan are identical.
- Summaries return `appliesWorldState: false` and `executionStatus:
  "not_executable"`.
- Prepared effects write `civic_action.prepared` audit ledger entries, not
  `civic_action.applied`.
- Rollback recovery reports may validate handle availability and audit linkage,
  but must not call an apply or rollback handler until typed execution exists.

## Release Gate

M11 cannot move to `done` until:

- executable apply and rollback handlers exist for every supported public civic
  effect;
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
