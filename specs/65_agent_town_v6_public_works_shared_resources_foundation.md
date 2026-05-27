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

The store records governed public-works project evidence and shared
contribution accounting against a research-only V6 institution charter. It is
readiness evidence for later M14 integration with V5.4-style public works, not
a public contribution endpoint.

The process-level restart proof currently covers reopening the institution and
public-works stores across separate Node process lifetimes, recording a
proposal/vote/moderation-gated project, recording capped contributions,
reconstructing privacy-safe audit replay, and proving exact retries do not
append duplicate project, contribution, or audit rows.

## Data Model

The SQLite table `world_civic_public_work_projects` stores validated
`publicWorksProject` schema records with:

- project id;
- institution id;
- institution scope target id;
- proposal id;
- human requester account id;
- approval receipt id;
- idempotency key;
- lifecycle status;
- cosmetic-rewards-only marker;
- audit ledger entry id;
- creation timestamp;
- goal, per-contribution cap, and per-contributor cap bundles;
- normalized project JSON.

Indexes cover institution/status replay, institution-scope/status replay, and
proposal replay.

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

- Projects must pass `validatePublicWorksProject` before persistence.
- Project creation records require an existing `public_works` institution, a
  non-expired `public_works` proposal scoped to that institution target, an
  approved moderation decision, more approval than rejection votes, a matching
  approval receipt, `public_works_accounting` preview effect, and affected
  public state for the project.
- Project idempotency is scoped to the institution and key, and exact retries
  must not append duplicate project or audit rows.
- Contributions must pass `validatePublicWorksContribution` before
  persistence.
- Private data, Brain/debug traces, wallet secrets, provider credentials, and
  token-like fields are rejected by the shared schema validator.
- The referenced institution must exist and must be scoped to `public_works`.
- The public works project must be known and must match the institution and
  institution scope.
- Accepted bundles are capped by per-contribution, per-contributor, and project
  goal limits.
- Idempotency reuse is accepted only when the validated contribution payload is
  identical.
- Summaries report `resourceConservationStatus:
  "accepted_inputs_equal_public_progress"`, `mutatesPrivateTown: false`,
  `cosmeticRewardsOnly: true`, and `executionStatus: "not_executable"`.
- Projects write `public_works.project.recorded` audit ledger entries;
  contributions write `public_works.contribution.recorded` audit ledger entries.

## M14 Readiness Gate

`buildV6PublicWorksReadinessGate()` records non-executing readiness evidence
for eventual release-grade shared-resource public works. It requires explicit
research opt-in and `FEATURE_WORLD_V60_AGENT_CIVILIZATION`; broad V5 prototype
overrides must not enable it.

The gate remains `research_only`, `releaseReady: false`, `playerVisible: false`,
`opensPublicContributionRoute: false`, `mutatesPrivateTown: false`,
`spendsPrivateInventory: false`, `grantsRewards: false`,
`publicFreePlayEnabled: false`, and `executionStatus: "not_executable"`. It
only passes research readiness when evidence covers governed project review,
worker/tool enforcement, wallet/session route authorization, durable
idempotency, explicit inventory-spend authorization, inventory restart replay,
resource conservation tests, reward conservation, contribution caps under
retry, rollback execution review, public text rendering, private-data
exclusion, public-works audit rows, process restart replay, no private-town
mutation, and no public free play across project creation, contribution,
inventory-spend, reward-claim, rollback, and public-surface route contracts.

The corresponding assertion rejects fake readiness that exposes public routes,
marks the gate release-ready, spends private inventory, grants rewards, mutates
private town state, or enables public free play.

## Release Gate

M14 cannot move to `done` until:

- public works project creation is connected to worker/tool enforcement,
  release-reviewed templates, explicit route authorization, and rollback
  execution;
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
