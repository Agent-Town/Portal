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

The SQLite table `world_civic_reputation_disputes` stores validated
`reputationDispute` schema records with:

- dispute id;
- reputation record id;
- subject account id;
- human dispute requester account id;
- queue/outcome status;
- reviewer kind;
- optional moderation decision id;
- audit ledger entry id;
- creation timestamp;
- normalized validated dispute JSON.

Indexes cover record replay, subject replay, dispute status queues, and
requester replay. Dispute records may reference public moderation decision ids,
but they do not mutate reputation scores or create eligibility authority.

## Safety Rules

- Self-awards are invalid.
- Deltas are bounded to `-5..5` and may not be zero.
- One awarding account can create only one record per subject, source, and kind.
- Record id reuse is idempotent only when the validated payload is identical.
- Dispute id reuse is idempotent only when the validated payload is identical.
- A requester can open only one dispute per reputation record.
- Dispute and review records must reference an existing reputation record and
  match its subject account.
- Dispute requesters must be human actors; reviewed dispute outcomes require a
  human reviewer kind.
- Private data, Brain/debug traces, wallet secrets, provider credentials, and
  token-like fields are rejected by the shared schema validator.
- Summaries return `transferable: false` and `executionStatus:
  "not_executable"`.
- Reputation records write `reputation.recorded` audit ledger entries. Opened
  disputes write `reputation.disputed` entries; reviewed dispute outcomes write
  `reputation.reviewed` entries.

## Release Gate

M9 cannot move to `done` until:

- production eligibility/advice integrations consume reputation only through a
  reviewed, privacy-approved policy;
- moderation decisions and dispute reviews can reference reputation impacts
  without importing private data;
- privacy review confirms no private town, Brain, wallet, provider, or debug
  data enters reputation records;
- reputation is integrated only into documented civic eligibility or advice
  surfaces;
- deterministic restart, replay, duplicate-source, self-award, and private-data
  rejection tests pass.
