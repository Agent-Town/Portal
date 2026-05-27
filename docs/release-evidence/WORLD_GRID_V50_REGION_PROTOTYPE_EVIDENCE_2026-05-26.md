# World Grid V5.0 Region Prototype Evidence - 2026-05-26

Original branch: `codex/v5-v6-world-grid-feedback`

Current hardening branch: `codex/v6-agent-civilization-milestones`

Status: `prototype_gated` for V5.0-V5.5 starter workflow

## Evidence

| Area | Evidence |
| --- | --- |
| Feature gate | `FEATURE_WORLD_GRID_V50_REGION` defaults off; `/api/world/region` returns `FEATURE_DISABLED` unless server/dev/QA enables it. |
| Production override safety | `server/world_grid/feature_flags.js` reuses the production admin/QA override guard before honoring `worldGridFeatureFlags` or `x-world-grid-feature-flags`; broad `all` V5 prototype overrides do not enable the V6.0 research flag. |
| Mutation origin guard | `server/world_grid/mutation_origin.js` rejects explicit cross-origin mutation metadata and requires positive same-origin context for mutating world-grid routes/tools in production. |
| Mutation CSRF guard | `server/world_grid/csrf.js` issues owner-bound process-local tokens through `/api/world/mutation-token`; production mutating routes/tools reject missing, invalid, or cross-owner tokens. |
| Mutation rate-limit guard | `server/world_grid/rate_limit.js` applies owner/surface buckets to mutating world-grid routes/tools and returns `RATE_LIMITED` with retry headers when exceeded; `tests/world_grid_rate_limit_persistence.test.js` proves optional SQLite `WORLD_GRID_RATE_LIMIT_SQLITE_PATH` counters survive separate Node process restarts and block mutating routes after restart. |
| Mutation audit log | `server/world_grid/audit_log.js` writes hash-chained SQLite audit/replay rows for successful mutating V5.1+ routes/tools when `WORLD_GRID_AUDIT_SQLITE_PATH` is configured; `tests/world_grid_audit_persistence.test.js` proves every V5.1-V5.5 mutating route/tool surface writes durable audit rows across separate Node process restarts, exact idempotent replay does not duplicate audit rows, changed-payload conflicts add no audit rows, and private-looking service secrets stay out of entries. Release promotion still needs full before-state snapshots and release replay reconstruction. |
| Server-authoritative region | `server/world_grid/region.js` deterministically generates `WorldRegion`, `WorldCell`, `SettlementNode`, and `RouteEdge` data from owner identity. |
| Read-only V5.0 APIs | `server/world_grid/routes.js` exposes region, focus, camera, and read-only tool endpoints without claim/build/resource mutation. |
| Durable V5.0 preferences foundation | `server/world_grid/preferences.js` can write SQLite `world_grid_region_preferences` rows when `WORLD_GRID_REGION_PREFS_SQLITE_PATH` is configured; `tests/world_grid_region_preferences_persistence.test.js` proves selected-cell and camera preferences reopen across restarts and stay isolated by owner/region. |
| V5.1 Territory Claims and Settler Routes | `server/world_grid/claims.js` adds gated adjacent claim options, plan/complete/cancel tools, exact resource spend, route preview, and terrain tradeoff copy. |
| Browser prototype | `public/experiences/world-grid/` renders a Three.js territory grid and DOM cell mirror when the prototype flag is enabled. |
| Tests | `tests/world_grid_region.test.js`; split Playwright coverage in `e2e/236_world_grid_v50_region_prototype.spec.js`, `e2e/237_world_grid_v51_claims_prototype.spec.js`, `e2e/238_world_grid_v52_public_presence_prototype.spec.js`, `e2e/239_world_grid_v53_service_redaction_prototype.spec.js`, `e2e/240_world_grid_v54_event_accounting_prototype.spec.js`, `e2e/241_world_grid_v55_sandbox_prototype.spec.js`; and all-features regression `e2e/242_world_grid_all_features_demo_regression.spec.js`. |
| V5.2 Public Presence and Safe Player Discovery | `server/world_grid/public_presence.js` adds opt-in public cards, redacted list/lookup, follow-town, summarize-neighbor, and opt-out removal. |
| V5.3 Civic Service Advice Prototype | `server/world_grid/services.js` adds bounded service listings, redacted service requests, schema-shaped recommendations, accept-as-advice only, report flow, and reputation bookkeeping. |
| V5.4 World Events and Public Works | `server/world_grid/events.js` adds one capped public-works event, preview-before-contribute, idempotent contribution accounting, exact resource spend, public progress, personal recap, and cosmetic reward claim. |
| V5.5 Controlled Free-Play Sandbox Districts | `server/world_grid/sandbox.js` adds one typed sandbox district with redacted public presence, allowed prop placement, rejected forbidden props, typed agent demo, and rollback snapshots. |
| Idempotency replay guard | `server/world_grid/idempotency.js` records process-local request hashes and success responses for mutating V5.1+ routes/tools, replays exact retries, and rejects changed payload reuse with `IDEMPOTENCY_CONFLICT`; `tests/world_grid_region.test.js` now proves exact replay and conflict rejection across every externally visible V5.1-V5.5 mutating route surface. |
| Durable idempotency foundation | `server/world_grid/idempotency.js` can write SQLite `world_grid_idempotency_records` rows when `WORLD_GRID_IDEMPOTENCY_SQLITE_PATH` is configured; `tests/world_grid_idempotency_persistence.test.js` proves planned-claim replay and conflict detection after separate Node process restarts without recreating process-local claim state, then proves exact replay and changed-payload conflict rejection across V5.1-V5.5 mutating route and tool surfaces after separate Node process restarts. |
| Durable claims foundation | `server/world_grid/claims.js` can write SQLite `world_grid_claims` rows when `WORLD_GRID_CLAIMS_SQLITE_PATH` is configured; `tests/world_grid_claims_persistence.test.js` proves planned claims reopen after restart, complete from durable claim state, reopen again as claimed routes, reject a different owner mutating the persisted claim region, and remove durable rows on cancel after restart. |
| Durable public presence foundation | `server/world_grid/public_presence.js` can write SQLite `world_grid_public_presence`, `world_grid_public_follows`, and `world_grid_public_abuse_reports` rows when `WORLD_GRID_PUBLIC_PRESENCE_SQLITE_PATH` is configured; `tests/world_grid_public_presence_persistence.test.js` proves opt-in/list/lookup/follow/summary/opt-out/report across restarts, clears inbound follows on opt-out, suppresses duplicate reporter/town reports, rejects self-reports, and redacts private-looking abuse-report text. |
| Durable services foundation | `server/world_grid/services.js` can write SQLite `world_grid_service_requests` and `world_grid_service_reputation` rows when `WORLD_GRID_SERVICES_SQLITE_PATH` is configured; `tests/world_grid_services_persistence.test.js` proves redacted request inputs, accepted/reported request state, reputation counters, and duplicate accept/report safety across restarts. |
| Durable events foundation | `server/world_grid/events.js` can write SQLite `world_grid_event_contributions` and `world_grid_event_rewards` rows when `WORLD_GRID_EVENTS_SQLITE_PATH` is configured; `tests/world_grid_events_persistence.test.js` proves contribution totals, reward claims, cap replay, and duplicate contribution/reward safety across restarts. |
| Durable sandbox foundation | `server/world_grid/sandbox.js` can write SQLite `world_grid_sandbox_participants`, `world_grid_sandbox_actions`, `world_grid_sandbox_snapshots`, and `world_grid_sandbox_cells` rows when `WORLD_GRID_SANDBOX_SQLITE_PATH` is configured; `tests/world_grid_sandbox_persistence.test.js` proves participants, moderated action records, rejected action records, rollback snapshots, cell props, leave state, and private-town isolation across restarts. |
| Screenshots | `artifacts/world-grid-v50-region-prototype.png`, `artifacts/world-grid-v51-territory-claim-prototype.png`, `artifacts/world-grid-v53-agent-services-prototype.png`, `artifacts/world-grid-v54-world-event-prototype.png`, and `artifacts/world-grid-v55-sandbox-prototype.png`. |
| Live sanity | Local route reported `renderer: "three"`, `payloadCells: 19`, a claimed route after V5.1 completion, V5.2 opt-in/out, V5.3 civic service request/accept, V5.4 preview/contribute/reward, V5.5 enter/place/reject/agent-demo/rollback/leave, no horizontal overflow at 291px, and no console/page errors. |

## Release Stance

This is not a public release claim. V5.0 remains hidden from the normal player
route and requires the recurring Three.js runtime gate before promotion beyond
prototype review.

## Prototype Persistence Warning

All V5.0-V5.5 world-grid stores remain prototype/ephemeral unless explicitly
replaced by durable release-grade storage. Process-local state includes claims,
public presence, follows, service requests/reputation, event contribution
bookkeeping, rewards, sandbox participants/actions/snapshots/cells, CSRF mutation
tokens, rate-limit buckets, and camera preferences. The optional SQLite audit log,
optional SQLite region preference rows, optional SQLite idempotency rows, optional
SQLite claim rows, optional SQLite public presence/follow/report rows, optional
SQLite service request/reputation rows, optional SQLite event contribution/reward
rows, and optional SQLite sandbox participant/action/snapshot/cell rows are durable
foundations. Optional SQLite audit rows now have route/tool-surface restart
matrix coverage, and optional SQLite rate-limit rows now have owner/surface route
restart coverage, but release promotion still requires durable owner indexes,
migration versioning, complete before-state snapshots, durable idempotency
integration with final session-auth production replay, CSRF-token/session-auth
integration, IP/risk-aware production rate limits, and release replay
reconstruction for every world-grid store.
