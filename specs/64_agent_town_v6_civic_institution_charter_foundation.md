# Agent Town V6.0 Civic Institution Charter Foundation

Status: `research_only`

Milestone: `M13 Civic institutions and charters`

Runtime module: `server/world_civilization/institutions.js`

Contract tests:

- `tests/world_civilization_institutions.test.js`
- `tests/world_civilization_institution_process_restart.test.js`

Schema contract: `specs/55_agent_town_v6_civic_schema_contracts.md`

## Boundary

This foundation does not make V6 player-visible, does not expose institution
routes or tools, and does not create civic mechanics in normal gameplay.

The store records public-safe institution charters and governed charter
amendment records as durable civic evidence so later proposal, voting,
moderation, and effect handlers can attach to explicit institution boundaries
instead of implicit text labels.

The process-level restart proof currently covers separate public-works and
sandbox-policy charters, a proposal/vote/moderation-gated charter amendment,
privacy-safe audit replay reconstruction, and exact retry idempotency across
separate Node process lifetimes without exposing player-visible institution
surfaces.

## Data Model

The SQLite table `world_civic_institutions` stores validated `institution`
schema records with:

- institution id;
- charter id;
- human chartering account id;
- public display name;
- scope kind and scope target;
- moderation policy id;
- voting rule id;
- membership rule id;
- eligibility rule id;
- lifecycle status;
- audit ledger entry id;
- effective, creation, and update timestamps;
- normalized institution JSON.

Indexes cover scope/status replay, moderation/voting policy lookup, and
chartering-account replay.

The SQLite table `world_civic_institution_charter_amendments` stores validated
charter amendment schema records with:

- amendment id;
- institution id;
- proposal id;
- human requester account id;
- approval receipt id;
- replacement charter id;
- idempotency key;
- lifecycle status;
- audit ledger entry id;
- effective and creation timestamps;
- normalized amendment JSON.

Indexes cover institution/status replay, proposal replay, and requester replay.

## Safety Rules

- Institution charters must pass `validateCivicInstitution` before persistence.
- Chartering actor must be human; agent-authored charters require later review
  and approval flows.
- Private data, Brain/debug traces, wallet secrets, provider credentials, and
  token-like fields are rejected by the shared schema validator.
- Proposal types must be public civic proposal scopes.
- One scope target may not reuse the same charter id for different institution
  content.
- Institution id reuse is idempotent only when the validated payload is
  identical.
- Charter amendments must pass `validateCivicInstitutionAmendment`, reference an
  existing institution, and require a non-expired `institution_charter`
  proposal with approved moderation, more approval than rejection votes, an
  approval receipt, `charter_update` preview effect, and affected public state
  for the institution.
- Charter amendment idempotency is scoped to the institution and key, and exact
  retries must not append duplicate amendment or audit rows.
- Summaries return `playerVisible: false` and `executionStatus:
  "not_executable"`.
- Institution charters write `institution.chartered` audit ledger entries;
  charter amendments write `institution.charter_amendment.recorded` audit rows
  without applying the replacement charter.

## Release Gate

M13 cannot move to `done` until:

- institutions have release-reviewed charter templates, membership rules,
  eligibility rules, proposal type rules, voting rules, moderation policies, and
  public audit summaries;
- applied charter changes require worker/tool enforcement, release-reviewed
  templates, and explicit execution/rollback handling;
- institutions are connected to M12 delegation policy without granting silent
  agent authority;
- institutions can own only documented public civic effects through M11 typed
  handlers and rollback gates;
- public institution surfaces use the public text rendering policy and include
  no private Founders Plot, wallet, Brain, provider, debug, or transcript data;
- deterministic schema, privacy, idempotency, audit, replay, and restart tests
  pass.
