# V6 Agent Civilization QA Branch Review Response

Status: `review_response`

Reviewed branch: `codex/v6-agent-civilization-milestones`

QA review date: 2026-05-26

Response date: 2026-05-28

This note records how the branch is absorbing the QA review that classified the
work as a V5/V6 containment and readiness pass, not a player-visible V6 gameplay
implementation. It is evidence for planning and hardening only; it is not a
release approval.

## Current Response

| QA item | Current branch response | Remaining gate |
| --- | --- | --- |
| Do not start player-visible V6 civic mechanics before M3-M6 | `docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md` keeps V6 research-only, requires M3-M6 before runtime exposure, and keeps M7-M12 behind internal flags. | Keep future V6 civic route/tool work hidden, disabled by default, and non-player-visible until release gates close. |
| World-grid stores were process-local | Optional SQLite foundations now exist for camera preferences, claims, public presence, services, events, sandbox, CSRF, rate limits, idempotency, and audit rows, with restart probes. | V5 is still not `release_ready` until final session-auth integration, release replay reconstruction, complete before-state reconstruction, and production signoff exist. |
| Mutating world routes need release security controls | V5 mutating routes now require idempotency keys, same-origin context in production, owner-bound CSRF when configured, owner/surface rate limits, and audit rows when SQLite audit is configured. | Live provider logout signoff, final production session-auth middleware, IP/risk-aware shared rate limits, and release replay remain gates. |
| Idempotency was incomplete | `server/world_grid/routes.js`, `tests/world_grid_region.test.js`, and `tests/world_grid_idempotency_persistence.test.js` now cover exact replay and changed-payload rejection across the V5.1-V5.5 mutating route/tool matrix. | Keep every new externally visible mutation in the same idempotency matrix before it can ship. |
| Explicit V6 feature flag required before routes/tools exist | `FEATURE_WORLD_V60_AGENT_CIVILIZATION` defaults off; broad V5 `all` overrides do not enable it; production player query/header overrides cannot enable V6. | Any future V6 route/tool must keep `FEATURE_DISABLED` behavior unless intentionally server-enabled for internal research. |
| Milestone source branch label was stale | `docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md` now names `codex/v6-agent-civilization-milestones`. | Keep the branch label current when the living plan moves. |
| Public presence XSS rule should become reusable | `docs/security/PUBLIC_TEXT_RENDERING_POLICY.md` defines the reusable rule. `public/experiences/world-grid/app.js` now renders the public town list with DOM construction through `appendPublicText()`, and the split V5.2 browser smoke proves malicious public names do not execute or create HTML nodes. | Future V6 proposals, votes, charters, moderation reasons, public works, and agent-authored public text need equivalent DOM/XSS tests before visibility. |
| Non-production feature overrides are broad | Existing production override tests remain part of the roadmap compliance suite and V5 evidence. | Keep non-production `all` useful for QA, but continue proving production ignores player-supplied overrides. |
| Browser/test helper seeding still differs from the real player route | The split V5 smokes and all-features regression are deterministic prototype coverage, not final release proof. | Add release-candidate player-route proof from Start Gate/account continuity to Founders Plot creation to World Grid mutation before V5 release promotion. |

## Working Order From This Review

1. Keep M0-M2 green and treat V5 hardening as the active prerequisite track.
2. Close M3 durable storage and replay requirements before V5 can be called
   release-ready.
3. Keep M4-M6 as internal contract work, not player-visible civic mechanics.
4. Keep M7+ civic foundations research-only until V5 release promotion,
   mutation security, worker-first runtime exposure, moderation, rollback,
   privacy, and audit gates are complete.
5. Do not add public autonomous agent mutation, Generated Universe pack work,
   public free play, or V6 civic UI in this track.
