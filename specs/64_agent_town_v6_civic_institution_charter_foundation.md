# Agent Town V6.0 Civic Institution Charter Foundation

Status: `research_only`

Milestone: `M13 Civic institutions and charters`

Runtime module: `server/world_civilization/institutions.js`

Contract tests: `tests/world_civilization_institutions.test.js`

Schema contract: `specs/55_agent_town_v6_civic_schema_contracts.md`

## Boundary

This foundation does not make V6 player-visible, does not expose institution
routes or tools, and does not create civic mechanics in normal gameplay.

The store records public-safe institution charters as durable civic evidence so
later proposal, voting, moderation, and effect handlers can attach to explicit
institution boundaries instead of implicit text labels.

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
- Summaries return `playerVisible: false` and `executionStatus:
  "not_executable"`.
- Institution charters write `institution.chartered` audit ledger entries.

## Release Gate

M13 cannot move to `done` until:

- institutions have release-reviewed charter templates, membership rules,
  eligibility rules, proposal type rules, voting rules, moderation policies, and
  public audit summaries;
- charter changes require proposal/vote/moderation flow instead of direct store
  writes;
- institutions are connected to M12 delegation policy without granting silent
  agent authority;
- institutions can own only documented public civic effects through M11 typed
  handlers and rollback gates;
- public institution surfaces use the public text rendering policy and include
  no private Founders Plot, wallet, Brain, provider, debug, or transcript data;
- deterministic schema, privacy, idempotency, audit, replay, and restart tests
  pass.
