# Agent Town V6.0 Reputation Accountability Foundation

Status: `research_only`

Milestone: `M9 Reputation and accountability`

Runtime module: `server/world_civilization/reputation.js`

Contract tests: `tests/world_civilization_reputation.test.js`

Schema contract: `specs/55_agent_town_v6_civic_schema_contracts.md`

## Boundary

This foundation does not make V6 player-visible and does not add reputation to
normal gameplay. Reputation records are durable civic accountability evidence,
not a point system, transferable currency, score farming loop, token reward, or
agent authority grant.

## Data Model

The SQLite table `world_civic_reputation_records` stores validated
`reputation` schema records with:

- subject account id;
- awarding account id;
- reputation kind;
- bounded non-zero delta;
- source reference;
- dispute status;
- audit ledger entry id;
- creation timestamp.

Indexes cover subject/kind, awarder, source, and dispute status replay.

## Safety Rules

- Self-awards are invalid.
- Deltas are bounded to `-5..5` and may not be zero.
- One awarding account can create only one record per subject, source, and kind.
- Record id reuse is idempotent only when the validated payload is identical.
- Private data, Brain/debug traces, wallet secrets, provider credentials, and
  token-like fields are rejected by the shared schema validator.
- Summaries return `transferable: false` and `executionStatus:
  "not_executable"`.
- Reputation records write `reputation.recorded` audit ledger entries.

## Release Gate

M9 cannot move to `done` until:

- dispute and review workflows are implemented;
- moderation decisions can reference reputation impacts;
- privacy review confirms no private town, Brain, wallet, provider, or debug
  data enters reputation records;
- reputation is integrated only into documented civic eligibility or advice
  surfaces;
- deterministic restart, replay, duplicate-source, self-award, and private-data
  rejection tests pass.
