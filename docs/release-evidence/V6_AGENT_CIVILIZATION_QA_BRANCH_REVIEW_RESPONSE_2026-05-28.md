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
| M8 worker-tool vote registration was pending | `server/world_civilization/worker_vote_adapter.js` now adds disabled-by-default `et.world.civic.votes.cast` worker vote registration behind `V6_CIVIC_WORKER_VOTE_ADAPTER_ENABLED`, requiring OpenClaw Lite observability, store-backed `vote_advice` delegation, same-origin/CSRF-reviewed M5 mutation security, the M8 `worker_tool_vote_surface` route-edge envelope, idempotent vote receipts, no runtime civic tool exposure, and no outcome application. | Browser worker/runtime registration, release-reviewed voting templates, production browser coverage, and security/product signoff remain gates before M8 can be called `done`. |
| Delegated worker action budgets needed real accounting | The hidden research proposal/vote routes and internal worker proposal/vote adapters now consume scoped delegated action budget idempotently for successful receipts. Exact replays return the existing `delegation.action_consumed` usage row, distinct proposal/vote attempts fail once the delegation budget is exhausted, and proposal/vote receipt conflicts are rejected before consuming another delegated action. | This remains internal research-only evidence; browser worker/runtime registration, delegated effect execution, and release signoff remain gates. |
| Milestone source branch label was stale | `docs/product/V6_AGENT_CIVILIZATION_MILESTONE_PLAN.md` now names `codex/v6-agent-civilization-milestones`. | Keep the branch label current when the living plan moves. |
| Public presence XSS rule should become reusable | `docs/security/PUBLIC_TEXT_RENDERING_POLICY.md` defines the reusable rule. `public/experiences/world-grid/app.js` now renders the public town list with DOM construction through `appendPublicText()`, and the split V5.2 browser smoke proves malicious public names do not execute or create HTML nodes. | Future V6 proposals, votes, charters, moderation reasons, public works, and agent-authored public text need equivalent DOM/XSS tests before visibility. |
| Non-production feature overrides are broad | Existing production override tests remain part of the roadmap compliance suite and V5 evidence. | Keep non-production `all` useful for QA, but continue proving production ignores player-supplied overrides. |
| Browser/test helper seeding still differs from the real player route | `e2e/245_world_grid_player_route_prerequisite.spec.js` now covers the same-session player route: V5.1 claim mutation fails with `WORLD_GRID_PLOT_REQUIRED` and creates no Founders Plot public row before the player opens `/app?district=founders-plot&entry=play-first`; after the app-created Founders Plot has an HQ, the same browser session can plan a World Grid claim while V6 civic runtime tools remain hidden. | This is still test-mode account/session continuity evidence, not final live wallet/Privy release signoff. |
| M16 needs migration load replay evidence | `server/world_civilization/migration_load_replay.js` and `tests/world_civilization_migration_load_replay.test.js` now add research-only evidence that current v1 schema inventory can be paired with bounded privacy-safe audit replay while executing no migration scripts, exposing no row payloads, and applying no world state. | This is not release-grade migration coverage. Release still needs real upgrade/downgrade scripts, pre-migration backup discipline, post-migration replay diffs, and production replay SLO targets. |
| M16 needs multi-process write-contention evidence | `server/world_civilization/write_contention.js` and `tests/world_civilization_write_contention.test.js` now add research-only audit-ledger contention evidence: concurrent child Node writers serialize before reading the latest hash-chain head, exact duplicate retries are suppressed, replay stays privacy-safe, and the report excludes row payloads while applying no world state. | This is not a production SLO result. Release still needs route/store contention targets, backoff strategy, WAL checkpointing policy, and production rate-limit/load signoff. |

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
