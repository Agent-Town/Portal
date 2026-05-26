# V6 Agent Civilization Milestone Plan

Status: `living_goal`

Source branch: `codex/v6-agent-civilization-milestones`

This document is the working ladder from the hardened V5 world-grid prototype
to V6.0 Agent Civilization completion. Keep it current as implementation lands:
when a milestone moves, update its status, evidence links, release gates, and
tests in the same change.

## Product Boundary

V6 is not "more autonomous agents everywhere." V6 is the first release where
humans and agents can participate in bounded, auditable civic institutions.

Until every prerequisite below is met:

- V6 remains research-only.
- No V6 civic mechanics are player-visible in normal gameplay.
- No public autonomous agent may mutate another user's world.
- No private Founders Plot state may leak into public civic surfaces.
- Human approval or explicit delegation is required for civic effects.

## Milestone Status Vocabulary

- `done`: implemented, tested, documented, and merged into the V6 baseline.
- `in_progress`: active work exists but the release gate is not closed.
- `planned`: specified enough to start but not yet implemented.
- `blocked`: known dependency or safety gap prevents implementation.
- `research_only`: allowed for internal docs/tests/prototypes only.

## V6 Ladder

| Milestone | Status | Purpose | Definition of Done |
| --- | --- | --- | --- |
| M0 Hardened V5 world-grid baseline | `in_progress` | Establish the safe V5.0-V5.5 prototype baseline that V6 can build on. | Public presence XSS is covered, V5.1+ mutations require an existing plot, all externally visible mutating prototype routes replay exact idempotent retries and reject changed key reuse, production mutations require same-origin context and owner-bound CSRF tokens, owner/surface prototype rate limits are enforced, feature-gated tools have parity tests, V6 is still hidden, and split V5 Playwright coverage passes. |
| M1 Living V6 milestone contract | `done` | Keep the V6 path explicit and refine it as progress lands. | This document, `specs/54_agent_town_v6_agent_civilization_foundation.md`, and `specs/release-gates/v60_agent_civilization_readiness_gate.md` cross-link and tests prove the major milestones remain named. |
| M2 V5 evidence promotion gates | `in_progress` | Promote V5.0-V5.5 from prototype evidence to release-grade prerequisites. | Each V5 slice has owner/auth checks, restart persistence tests, durable audit/replay evidence beyond the current process-local idempotency guard, security notes, deterministic Node + Playwright coverage, and `specs/release-gates/v5_world_grid_release_promotion_gate.md` coverage. |
| M3 Release-grade world storage | `in_progress` | Replace process-local world-grid stores before public civic systems depend on them. | Durable owner indexes, migration versioning, idempotency records, audit/replay rows, restart persistence tests, rollback handles, the durable world-grid audit log foundation, the `WORLD_GRID_IDEMPOTENCY_SQLITE_PATH` durable idempotency foundation with restart replay proof, the `WORLD_GRID_CLAIMS_SQLITE_PATH` durable V5.1 claims foundation with planned/claimed restart proof, the `WORLD_GRID_PUBLIC_PRESENCE_SQLITE_PATH` durable V5.2 public presence/follow foundation with restart proof, and the `server/world_civilization/audit_ledger.js` foundation exist for every mutating world endpoint. |
| M4 Civic schema contracts | `done` | Define the stable data contracts for V6 institutions. | Proposal, vote, delegation, institution charter, civic action, reputation, moderation decision, rollback, and audit ledger schemas are documented in `specs/55_agent_town_v6_civic_schema_contracts.md` and validated by `tests/world_civilization_schemas.test.js`. |
| M5 Mutation security controls | `in_progress` | Make civic mutations safe against cross-origin, replay, and abuse paths. | Same-origin/CSRF checks, session/wallet auth, rate limits, idempotency keys, ownership checks, and production feature override safety tests are enforced for mutating civic routes. |
| M6 Worker-first V6 tool surface | `in_progress` | Preserve the OpenClaw Lite worker as the authority for agent behavior. | `FEATURE_WORLD_V60_AGENT_CIVILIZATION` defaults off, broad V5 prototype overrides do not enable V6, `server/world_civilization/tools.js` defines a research-only non-executing civic tool draft, V6 tools are feature-gated, visible in the runtime tool manifest only when intentionally implemented, traceable in Worker Traffic, and exercised through worker/tool flows rather than backend shortcuts. |
| M7 Internal proposal lifecycle | `in_progress` | Let humans or agents draft bounded civic proposals without executing them. | Proposals have scope, proposer identity, effect preview, moderation class, expiry, idempotency, private-data redaction, audit records, and no state mutation until approved. |
| M8 Vote authorization and delegation | `in_progress` | Add explicit consent mechanics for civic decisions. | Vote auth prevents forgery/replay, enforces eligibility, records receipts, handles abstain/revoke/delegation policy, proves one-vote accounting, and starts with `server/world_civilization/votes.js`. |
| M9 Reputation and accountability | `in_progress` | Add bounded trust signals without turning reputation into farmable currency. | `server/world_civilization/reputation.js` stores durable research-only reputation records with audit entries, duplicate-source protection, self-award rejection, private-data rejection, non-transferable summaries, and dispute replay indexes; M9 still needs full dispute/review workflow integration before `done`. |
| M10 Moderation and privacy layer | `in_progress` | Moderate public civic text, profiles, agent content, media, and public effects. | `server/world_civilization/moderation.js` stores durable research-only moderation decisions with private-data rejection, redacted-field evidence, canonical subject/policy decisions, reviewer/status replay indexes, audit entries, and non-executable summaries; M10 still needs full appeals, review workflow, media, abuse-report, and public-surface integration before `done`. |
| M11 Civic effect execution and rollback | `in_progress` | Execute approved civic effects safely and reversibly. | `server/world_civilization/effects.js` stores research-only prepared civic effects and rollback handles after proposal, approved moderation, and human approval receipt prerequisites; `server/world_civilization/rollback_recovery.js` reconstructs prepared rollback handles from reopened effect/audit stores without executing state; records remain non-executing with `civic_action.prepared` audit entries, and M11 still needs typed handlers, real before/after state, applied/rollback states, irreversible-action review, and conservation tests before `done`. |
| M12 Agent participation controls | `in_progress` | Allow agents to participate without silent authority escalation. | `server/world_civilization/delegations.js` stores research-only scoped delegations with expiry, action limits, approval receipts, revocation, audit entries, and non-executable participation summaries; M12 still needs worker/tool enforcement, action-budget consumption, route-edge authorization, and delegated execution integration after M11 release gates close. |
| M13 Civic institutions and charters | `in_progress` | Define the first player-visible civic structures. | `server/world_civilization/institutions.js` stores research-only public-safe institution charters with human chartering actors, scope boundaries, membership/eligibility rules, moderation policy, proposal types, voting rules, audit entries, and non-executable summaries; M13 still needs proposal/vote-governed charter changes, worker/tool integration, release-reviewed templates, and public surfaces before `done`. |
| M14 Public works and shared resources integration | `in_progress` | Connect V6 institutions to V5.4-style public works without unsafe free play. | `server/world_civilization/public_works.js` stores research-only institution-scoped public works contributions with per-contribution/per-contributor/project caps, accepted-vs-capped bundles, audit entries, replay indexes, and conservation summaries that do not mutate private inventory or grant rewards; M14 still needs governed project creation, wallet/session route auth, explicit inventory spend, rollback execution, restart tests, and public surfaces before `done`. |
| M15 Modal-first V6 lab surface | `in_progress` | Expose V6 work through a safe internal modal flow before release. | `server/world_civilization/lab_surface.js` defines a route-neutral, feature-gated, non-executing lab surface contract. Any later V6 lab UI stays modal-first from the town hub, hidden from players, with Worker Tools, Skill Context, Worker Traffic, Brain, and Session Context observability intact. |
| M16 Persistence, replay, and resilience hardening | `in_progress` | Prove V6 survives restarts and failure modes. | `server/world_civilization/resilience.js` defines a research-only baseline report over the current SQLite civic stores, `server/world_civilization/sqlite_schema.js` stamps v1 on-disk schema metadata with fail-closed drift checks, `server/world_civilization/replay_reconstruction.js` reconstructs privacy-safe audit summaries without applying effects, `server/world_civilization/migration_rehearsal.js` inventories current v1 store metadata while `tests/world_civilization_migration_rehearsal.test.js` proves unsupported upgrade/downgrade targets fail closed, process restart probes now cover audit-ledger, proposal/vote, reputation/moderation, effect/rollback, delegation, institution, and public-works replay across separate Node lifetimes, `tests/world_civilization_load_rate.test.js` covers research-scale replay pagination plus duplicate retry bursts, and `tests/world_civilization_rollback_recovery.test.js` covers non-executing prepared rollback-handle reconstruction after reopen. M16 keeps `releaseReady: false` until release-grade replay reconstruction, production load/rate tests, real rollback recovery execution, and migration downgrade/upgrade scripts pass. |
| M17 Security and product release review | `in_progress` | Close the release gate before normal gameplay exposure. | `server/world_civilization/release_review.js` defines a research-only release-review gate covering threat model, privacy review, abuse-case review, data-retention policy, audit coverage, Playwright/Node validation, and product signoff; V6 remains blocked until all evidence and signoffs are complete. |
| M18 V6 controlled release completion | `in_progress` | Make V6 player-visible only after all gates are closed. | `server/world_civilization/controlled_release.js` defines a research-only controlled-release gate that requires M0-M17 completion, release-review readiness, production-safe flags, rollback/disable controls, observability, support runbooks, blocker clearance, and a controlled release window before any explicit production enablement. |

## Immediate Working Order

1. Keep M0/M1 green while the hardening branch is reviewed.
2. Close M2 by promoting V5 prototype evidence into release-grade gates.
3. Close M3-M6 before expanding V6 civic mechanics beyond research-only
   contracts/foundations.
4. Keep the M6 civic tool draft non-executing and hidden until worker/runtime
   exposure, observability, and mutating-route security controls are complete.
5. Keep M7-M12 behind research/internal flags only until V5 hardening gates are
   closed.
6. Add M13-M15 once schemas, auth, moderation, privacy, and rollback are proven.
7. Treat M16-M18 as release hardening, not prototype discovery.

## Completion Rule

V6 is complete only when M0-M18 are `done`, the V6 readiness gate is closed,
and the normal player flow can enable V6 without hidden mutation, private-data
leakage, unaudited civic effects, or public autonomous agents acting outside
explicit human approval or delegation.
