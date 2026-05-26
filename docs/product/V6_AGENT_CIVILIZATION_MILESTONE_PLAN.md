# V6 Agent Civilization Milestone Plan

Status: `living_goal`

Source branch: `codex/v6-world-grid-hardening-readiness`

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
| M0 Hardened V5 world-grid baseline | `in_progress` | Establish the safe V5.0-V5.5 prototype baseline that V6 can build on. | Public presence XSS is covered, V5.1+ mutations require an existing plot, feature-gated tools have parity tests, V6 is still hidden, and split V5 Playwright coverage passes. |
| M1 Living V6 milestone contract | `done` | Keep the V6 path explicit and refine it as progress lands. | This document, `specs/54_agent_town_v6_agent_civilization_foundation.md`, and `specs/release-gates/v60_agent_civilization_readiness_gate.md` cross-link and tests prove the major milestones remain named. |
| M2 V5 evidence promotion gates | `in_progress` | Promote V5.0-V5.5 from prototype evidence to release-grade prerequisites. | Each V5 slice has owner/auth checks, restart persistence tests, audit/replay evidence, security notes, deterministic Node + Playwright coverage, and `specs/release-gates/v5_world_grid_release_promotion_gate.md` coverage. |
| M3 Release-grade world storage | `planned` | Replace process-local world-grid stores before public civic systems depend on them. | Durable owner indexes, migration versioning, idempotency records, audit/replay rows, restart persistence tests, and rollback handles exist for every mutating world endpoint. |
| M4 Civic schema contracts | `in_progress` | Define the stable data contracts for V6 institutions. | Proposal, vote, delegation, civic action, reputation, moderation decision, rollback, and audit ledger schemas are documented in `specs/55_agent_town_v6_civic_schema_contracts.md` and validated by `tests/world_civilization_schemas.test.js`. |
| M5 Mutation security controls | `planned` | Make civic mutations safe against cross-origin, replay, and abuse paths. | Same-origin/CSRF checks, session/wallet auth, rate limits, idempotency keys, ownership checks, and production feature override safety tests are enforced for mutating civic routes. |
| M6 Worker-first V6 tool surface | `planned` | Preserve the OpenClaw Lite worker as the authority for agent behavior. | V6 tools are feature-gated, visible in the runtime tool manifest, traceable in Worker Traffic, and exercised through worker/tool flows rather than backend shortcuts. |
| M7 Internal proposal lifecycle | `planned` | Let humans or agents draft bounded civic proposals without executing them. | Proposals have scope, proposer identity, effect preview, moderation class, expiry, private-data redaction, and no state mutation until approved. |
| M8 Vote authorization and delegation | `planned` | Add explicit consent mechanics for civic decisions. | Vote auth prevents forgery/replay, enforces eligibility, records receipts, handles abstain/revoke/delegation policy, and proves one-vote accounting. |
| M9 Reputation and accountability | `planned` | Add bounded trust signals without turning reputation into farmable currency. | Reputation cannot be self-awarded or transferred, has dispute/review paths, is privacy-bounded, and affects only documented civic eligibility or advice surfaces. |
| M10 Moderation and privacy layer | `planned` | Moderate public civic text, profiles, agent content, media, and public effects. | Moderation covers proposal text, agent-authored content, public profile fields, sandbox artifacts, abuse reports, redaction, and appeal/review states. |
| M11 Civic effect execution and rollback | `planned` | Execute approved civic effects safely and reversibly. | Approved effects apply through typed handlers with before/after summaries, audit ledger entries, rollback handles, irreversible-action exclusions, and conservation tests. |
| M12 Agent participation controls | `planned` | Allow agents to participate without silent authority escalation. | Agents may propose or advise by default; execution requires human approval or explicit scoped delegation, with delegation limits, expiry, receipts, and debug traceability. |
| M13 Civic institutions and charters | `planned` | Define the first player-visible civic structures. | Institutions have charters, scope boundaries, membership/eligibility rules, moderation policy, proposal types, voting rules, and public audit summaries. |
| M14 Public works and shared resources integration | `planned` | Connect V6 institutions to V5.4-style public works without unsafe free play. | Shared resources conserve inputs/outputs, cap contributions/rewards, reject private-town mutation, and record ledger/audit/replay evidence. |
| M15 Modal-first V6 lab surface | `planned` | Expose V6 work through a safe internal modal flow before release. | Any V6 lab UI stays modal-first from the town hub, hidden behind feature gates, with Worker Tools, Skill Context, Worker Traffic, Brain, and Session Context observability intact. |
| M16 Persistence, replay, and resilience hardening | `planned` | Prove V6 survives restarts and failure modes. | Restart tests, replay reconstruction, idempotent retries, duplicate suppression, load/rate tests, rollback recovery, and migration downgrade/upgrade checks pass. |
| M17 Security and product release review | `planned` | Close the release gate before normal gameplay exposure. | Threat model, privacy review, abuse-case review, data-retention policy, audit coverage, Playwright/Node validation, and signoff checklist are complete. |
| M18 V6 controlled release completion | `planned` | Make V6 player-visible only after all gates are closed. | V6 is enabled through production-safe flags, has rollback/disable controls, observability, docs, support runbooks, and no unresolved release blockers. |

## Immediate Working Order

1. Keep M0/M1 green while the hardening branch is reviewed.
2. Close M2 by promoting V5 prototype evidence into release-grade gates.
3. Build M3/M4 before adding any player-visible V6 behavior.
4. Add M5/M6 controls before any mutating V6 tool or route exists.
5. Implement M7-M12 behind research/internal flags only.
6. Add M13-M15 once schemas, auth, moderation, privacy, and rollback are proven.
7. Treat M16-M18 as release hardening, not prototype discovery.

## Completion Rule

V6 is complete only when M0-M18 are `done`, the V6 readiness gate is closed,
and the normal player flow can enable V6 without hidden mutation, private-data
leakage, unaudited civic effects, or public autonomous agents acting outside
explicit human approval or delegation.
