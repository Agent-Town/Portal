# Agent Town V6 Governance Preflight Foundation

Status: `research_only`

Milestones: `M7 Internal proposal lifecycle`, `M8 Vote authorization and
delegation`, `M10 Moderation and privacy layer`, `M11 Civic effect execution
and rollback`

Runtime contract: `server/world_civilization/governance_preflight.js`

Call site: `server/world_civilization/effects.js`

Contract tests: `tests/world_civilization_governance_preflight.test.js`

## Boundary

This preflight is an internal prerequisite report. It does not expose V6 routes,
create player-visible civic mechanics, execute civic effects, apply public
world state, or grant delegated execution authority.

The current effect store calls the preflight before writing a prepared civic
action. A failed preflight throws the existing `CIVIC_EFFECT_*` prerequisite
errors before persistence, rollback handles, or audit rows are written.

## Required Checks

- Civic action schema validation.
- Rollback plan schema validation.
- Existing proposal record.
- Matching proposal rollback plan.
- Non-expired proposal.
- Action effect type matches the proposal preview effect type.
- Approved moderation decision for the proposal moderation class.
- Proposal review-ready state: proposal status `ready_for_vote` and moderation
  status `approved`.
- Vote approval with at least one approving vote and more approvals than
  rejections.
- Delegated execution remains rejected until M12 worker/tool enforcement and
  route-edge authorization are release-ready.
- Human-approved execution authority must reference an approving vote receipt.
- Preflight report remains research-only and non-executing.

## Release Gate

This foundation is not execution readiness. M7-M11 cannot move to `done` until:

- proposal state transitions remain explicit, durable, audited, and connected to
  moderation review outcomes before vote/effect preparation;
- vote quorum and threshold rules are release-reviewed;
- moderation review and appeal outcomes are connected to proposal state;
- delegated execution is authorized through M12 route/tool enforcement or
  remains disabled;
- executable apply and rollback handlers use the same preflight or a
  release-reviewed successor before touching public state;
- browser and Node coverage prove failed preflights leave civic stores,
  rollback records, and audit ledgers unchanged.
