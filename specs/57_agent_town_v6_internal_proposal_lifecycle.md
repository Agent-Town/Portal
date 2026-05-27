# Agent Town V6.0 Internal Proposal Lifecycle

Status: `research_only`

Milestone: `M7 Internal proposal lifecycle`

Runtime module: `server/world_civilization/proposals.js`

Governance preflight: `server/world_civilization/governance_preflight.js`

Contract tests: `tests/world_civilization_proposals.test.js`

## Boundary

This lifecycle drafts and stores bounded civic proposals. It does not expose V6
to normal gameplay, render player-visible civic institutions, execute civic
effects, count votes, or authorize autonomous public agent action.

## Drafting Rules

- Proposal payloads must pass `validateCivicProposal`.
- Proposal effects must remain `preview_only`.
- Proposal creation requires an idempotency key.
- Expired proposals are rejected before persistence.
- Private data, Brain/debug traces, provider credentials, wallet secrets, and
  secret-like text are rejected before persistence.
- Drafted proposals start with status `drafted`.
- Drafted proposals start with moderation status `needs_review`.
- Drafting appends exactly one `proposal.created` audit ledger entry with a
  privacy-safe before/after summary of the proposal scope, preview effect type,
  and moderation state.

## Idempotency Rule

Repeating the same proposer account and idempotency key with the same normalized
proposal returns the existing draft and does not append another audit record.
Changing content with the same proposer/idempotency pair fails with
`CIVIC_PROPOSAL_IDEMPOTENCY_CONFLICT`.

## Review Transition Rules

`recordProposalReview()` consumes a validated V6 moderation decision contract.
Malformed decisions fail with
`CIVIC_PROPOSAL_REVIEW_MODERATION_DECISION_INVALID` before proposal rows or audit
rows are touched.

Allowed research-only transitions:

- `approved` moderation decisions move a `drafted` proposal to
  `ready_for_vote` with moderation status `approved`.
- `rejected` moderation decisions move a `drafted` proposal to `rejected` with
  moderation status `rejected`.

The review decision must reference the proposal id as `subjectRef`, and its
surface must match the proposal moderation class. Missing proposals, expired
proposals, unsupported review statuses, and surface mismatches fail before
persistence. Successful transitions append a replayable `proposal.reviewed`
audit ledger entry with privacy-safe before/after status summaries and do not
execute proposal effects.

## Non-Execution Rule

The proposal store intentionally has no apply or execute method. Later V6
milestones must add vote authorization, moderation decisions, execution
authority, rollback, and audit checks before any civic effect can be applied.

The current research-only governance preflight consumes proposal records before
prepared effect persistence. It requires an existing, non-expired proposal whose
review transition has reached `ready_for_vote` with approved moderation status
and whose effect preview and rollback plan match the proposed civic action.

## Submission Envelope

`buildV6ProposalSubmissionEnvelope()` is the internal route/tool submission
guard. It is research-only and requires `FEATURE_WORLD_V60_AGENT_CIVILIZATION`
plus explicit proposal-submission opt-in.

The envelope supports two non-public source surfaces:

- `human_route_submission`, bound to a human proposer, explicit approval
  receipt, and an M5 mutation-security envelope whose actor/session/owner and
  idempotency key match the proposal.
- `worker_tool_submission`, bound to an agent proposer, a store-backed
  `proposal_drafting` delegation proof inside the M5 mutation-security
  envelope, and OpenClaw Lite worker evidence with Skill Context and Worker
  Traffic observability.

`submitProposalForReview()` uses an accepted envelope to draft the proposal and
place it in the internal review queue. A denied envelope throws
`CIVIC_PROPOSAL_SUBMISSION_DENIED` before proposal or audit rows are persisted.
The submission contract remains hidden from runtime `/api/world/tools`, normal
gameplay, and player-visible proposal UI. It does not execute effects or expose
V6 civic tools.

The internal worker proposal adapter consumes `proposal_drafting` delegated
action budget exactly once for successful receipts. Exact replays return the
existing proposal and delegated usage row, while a second distinct proposal is
denied once the delegation budget is exhausted and no extra proposal is
persisted.

`server/world_civilization/routes.js` mounts the research-only
`POST /api/world/civilization/proposals/submit` route. The route is disabled by
default unless `V6_CIVIC_PROPOSAL_SUBMISSION_ROUTE_ENABLED=1`, requires a civic
identity resolved from the existing server session, requires
`FEATURE_WORLD_V60_AGENT_CIVILIZATION`, and composes the M5 civic
mutation-security envelope with same-origin, CSRF-reviewed, session/wallet,
idempotency, rate-limit, and delegated-agent evidence before calling
`submitProposalForReview()`. `server/world_civilization/store_wiring.js` may
provide env-gated SQLite proposal/audit/delegation stores only when
`V6_CIVIC_PROPOSAL_STORE_WIRING_ENABLED=1`,
`V6_CIVIC_AUDIT_SQLITE_PATH`, and `V6_CIVIC_PROPOSAL_SQLITE_PATH` are present;
`V6_CIVIC_DELEGATION_SQLITE_PATH` wires the optional store-backed delegation
proof path for worker submissions. The default app mount still fails closed if
someone enables the route flag without explicit research store setup. This route
adds no runtime tool, player-visible UI, normal gameplay exposure, civic effect
execution, release approval, or public autonomous-agent mutation.

## Review Queue Snapshot

`getProposalReviewQueueSnapshot()` returns a research-only internal queue using
`V6_PROPOSAL_REVIEW_QUEUE_VERSION`. The snapshot lists only proposals whose
status is `drafted` and moderation status is `needs_review`.

By default the queue excludes expired proposals. Once a moderation decision
moves a proposal to `ready_for_vote` or `rejected`, the proposal is no longer in
the queue. Queue entries contain metadata only: proposal id, proposer ids, scope,
review surface, effect type, public-state count, timestamps, and non-executing
safety flags. They do not include the full proposal payload, private data,
runtime civic tools, player-visible surfaces, or effect execution authority.

## Proposal Intake Readiness Gate

`buildV6ProposalIntakeReadinessGate()` is a research-only M7 gate for reviewing
future route and worker-tool submission paths. It requires
`FEATURE_WORLD_V60_AGENT_CIVILIZATION` plus explicit research opt-in and stays
hidden from runtime tools and normal gameplay.

The gate requires evidence for:

- human route submission and worker-tool submission envelopes;
- approval-receipt binding, proposal-submission mutation security, and
  worker-tool origin enforcement;
- OpenClaw Lite worker origin, Skill Context observability, and Worker Traffic
  observability;
- civic mutation security envelope, same-origin/CSRF/session-auth controls, and
  idempotent submission replay;
- review-queue indexes, queue snapshots, reviewed/expired proposal exclusion,
  and moderation-decision linkage;
- `proposal.created` and `proposal.reviewed` audit rows;
- public text rendering review, private-data exclusion, and no backend
  shortcuts.

Even when research-ready, the gate keeps `releaseReady: false`,
`executionStatus: "not_executable"`, `exposesCivicTools: false`,
`executesProposalEffects: false`, `mutatesWorldState: false`,
`runtimeExposed: false`, and `playerVisible: false`. It does not add a public
route, runtime civic tool, proposal UI, review queue UI, or effect execution
path.

## Worker-First Rule

Agent-authored proposals may be stored through
`server/world_civilization/worker_tool_adapter.js` only when the
`et.world.civic.proposals.submit_for_review` adapter receives OpenClaw Lite
worker-origin evidence, Worker Tools, Skill Context, Worker Traffic, Brain, and
Session Context observability, store-backed `proposal_drafting` delegation,
same-origin/CSRF-reviewed M5 mutation security, explicit approval, and
idempotency, with idempotent delegated action-budget consumption. This adapter
is still research-only and does not register a runtime civic tool, proposal UI,
review queue UI, effect execution path, or public autonomous-agent mutation.
