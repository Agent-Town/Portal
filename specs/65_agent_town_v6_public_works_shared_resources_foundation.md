# Agent Town V6.0 Public Works Shared Resources Foundation

Status: `research_only`

Milestone: `M14 Public works and shared resources integration`

Runtime module: `server/world_civilization/public_works.js`

Contract tests:

- `tests/world_civilization_public_works.test.js`
- `tests/world_civilization_public_works_process_restart.test.js`

Schema contract: `specs/55_agent_town_v6_civic_schema_contracts.md`

## Boundary

This foundation does not make V6 player-visible, does not expose public works
routes or tools, does not spend private Founders Plot inventory, and does not
grant rewards.

The store records shared public-works contribution accounting against a
research-only V6 institution charter. It is readiness evidence for later M14
integration with V5.4-style public works, not a public contribution endpoint.

The process-level restart proof currently covers reopening the institution and
public-works stores across separate Node process lifetimes, recording capped
contributions, reconstructing privacy-safe audit replay, and proving exact
retries do not append duplicate contribution or audit rows.

## Data Model

The SQLite table `world_civic_public_work_contributions` stores validated
`publicWorksContribution` schema records with:

- contribution id;
- institution id;
- public works project id;
- contributor account id;
- source reference;
- idempotency key;
- lifecycle status;
- accepted resource totals;
- audit ledger entry id;
- creation timestamp;
- requested, accepted, and capped resource bundles;
- normalized contribution JSON.

Indexes cover project/status replay, institution replay, and contributor replay.

## Safety Rules

- Contributions must pass `validatePublicWorksContribution` before persistence.
- Private data, Brain/debug traces, wallet secrets, provider credentials, and
  token-like fields are rejected by the shared schema validator.
- The referenced institution must exist and must be scoped to `public_works`.
- The public works project must be known and must match the institution scope.
- Accepted bundles are capped by per-contribution, per-contributor, and project
  goal limits.
- Idempotency reuse is accepted only when the validated contribution payload is
  identical.
- Summaries report `resourceConservationStatus:
  "accepted_inputs_equal_public_progress"`, `mutatesPrivateTown: false`,
  `cosmeticRewardsOnly: true`, and `executionStatus: "not_executable"`.
- Contributions write `public_works.contribution.recorded` audit ledger entries.

## Release Gate

M14 cannot move to `done` until:

- public works projects are created and governed by proposal, vote, moderation,
  institution, and rollback flows;
- contribution routes verify wallet/session ownership and durable idempotency;
- private inventory spending is explicit, authorized, replayable, and covered by
  restart persistence tests;
- reward claims remain cosmetic/status-safe or have separate conservation tests;
- shared resource inputs, public progress, caps, and rollbacks conserve exactly
  under load and retry;
- public works surfaces use the public text rendering policy and include no
  private Founders Plot, wallet, Brain, provider, debug, or transcript data;
- deterministic schema, caps, conservation, audit, replay, restart, and
  private-data rejection tests pass.
