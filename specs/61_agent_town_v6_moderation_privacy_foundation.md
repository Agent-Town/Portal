# Agent Town V6.0 Moderation Privacy Foundation

Status: `research_only`

Milestone: `M10 Moderation and privacy layer`

Runtime module: `server/world_civilization/moderation.js`

Contract tests: `tests/world_civilization_moderation.test.js`

Schema contract: `specs/55_agent_town_v6_civic_schema_contracts.md`

## Boundary

This foundation does not make V6 player-visible, does not add civic UI, and
does not apply moderation effects to gameplay. Moderation decisions are durable
research-only civic evidence for later proposal, public works, sandbox, and
agent-authored public surfaces.

No V6 route, worker tool, or normal gameplay surface consumes these decisions
yet. The store exists so later V6 work can depend on validated, replayable,
privacy-reviewed moderation records instead of ad hoc public text flags.

## Data Model

The SQLite table `world_civic_moderation_decisions` stores validated
`moderation` schema decisions with:

- decision id;
- subject reference;
- public surface class;
- decision status;
- policy version;
- reviewer kind;
- audit ledger entry id;
- creation timestamp;
- normalized validated decision JSON.

Indexes cover subject replay, surface/status review queues, policy replay, and
reviewer-kind replay.

The SQLite table `world_civic_moderation_reviews` stores validated
`moderationReview` schema records with:

- review id;
- moderation decision id;
- subject reference;
- public surface class;
- policy version;
- review type (`human_review` or `appeal`);
- queue/outcome status;
- human requester account id;
- reviewer kind;
- audit ledger entry id;
- creation timestamp;
- normalized validated review JSON.

Indexes cover decision replay, subject replay, review-type/status queues, and
requester replay. Review and appeal records may reference public source ids such
as V5.2 abuse reports, but they do not import private town state or execute
moderation effects.

## Safety Rules

- Decisions must pass `validateModerationDecision` before persistence.
- Private data, Brain/debug traces, wallet secrets, provider credentials, and
  token-like fields are rejected by the shared schema validator.
- Decision id reuse is idempotent only when the validated payload is identical.
- Review id reuse is idempotent only when the validated payload is identical.
- A subject, surface, and policy version may have one canonical decision.
- Review and appeal records must reference an existing decision and match its
  subject, surface, and policy version.
- Appeals require a human requester and human reviewer kind; agents cannot file
  or decide appeals.
- Summaries return `executionStatus: "not_executable"` and
  `privateDataIncluded: false`.
- Redacted field counts and latest-decision references are summary evidence,
  not public profile data.
- Decisions write `moderation.decided` audit ledger entries with redacted
  public-audit summaries. Review records write `moderation.reviewed` entries;
  appeal records write `moderation.appealed` entries.

## Release Gate

M10 cannot move to `done` until:

- proposal text, agent-authored content, public profile fields, attached media,
  sandbox artifacts, public works effects, abuse reports, and appeals all flow
  through one moderation policy model;
- production human review tooling, appeal operations, and source-report
  triage are implemented and audited;
- redaction rules are reviewed against the public text rendering and public
  presence privacy policies;
- moderation outcomes can be replayed after restart and migrated across schema
  versions;
- no moderation decision can expose private town state, wallet secrets, Brain
  credentials, provider credentials, debug traces, or unapproved transcript
  content;
- deterministic schema, store, replay, duplicate, and private-data rejection
  tests pass.
