# Phase 37 Spec: House Worker Runtime Reality, Managed Sharing, and Live Confidence

Status: Implemented
Version: 0.1
Audience: product, frontend, backend, runtime, UX, QA, security, benchmarking, store-and-growth, and AI-agent implementers
Implementation branch target: `codex/house-worker-packages-spawn-v0-1`
Implementation baseline: `37da502`
Current proof state:
1. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md) is implemented.
2. [specs/35_house_worker_packages_and_spawn_tdd_spec.md](./35_house_worker_packages_and_spawn_tdd_spec.md) is implemented.
3. [specs/36_house_worker_packages_and_spawn_agent_runbook.md](./36_house_worker_packages_and_spawn_agent_runbook.md) is completed.
4. `e2e/236` through `e2e/245` and `e2e/247` are green.
5. `e2e/246_house_worker_operator_live_gate.spec.js` is implemented as an operator-assisted live gate and remains intentionally skipped in the default deterministic suite until live prerequisites are present.
6. Full deterministic suite is green at `368 passed, 5 skipped`.
Depends on:
1. [specs/34_house_worker_packages_and_spawn_spec.md](./34_house_worker_packages_and_spawn_spec.md)
2. [specs/35_house_worker_packages_and_spawn_tdd_spec.md](./35_house_worker_packages_and_spawn_tdd_spec.md)
3. [specs/36_house_worker_packages_and_spawn_agent_runbook.md](./36_house_worker_packages_and_spawn_agent_runbook.md)
4. [specs/28_house_office_star_office_inspired_extension_spec.md](./28_house_office_star_office_inspired_extension_spec.md)
5. [specs/31_house_office_reality_hardening_spec.md](./31_house_office_reality_hardening_spec.md)
6. [specs/02_api_contract.md](./02_api_contract.md)
7. [docs/live_lane_audit.md](../docs/live_lane_audit.md)
8. [public/app.js](../public/app.js)
9. [public/registry.js](../public/registry.js)
10. [public/views/house.html](../public/views/house.html)
11. [server/platform_read_routes.js](../server/platform_read_routes.js)
12. [server/unified_platform_store.js](../server/unified_platform_store.js)
13. [server/platform_export.js](../server/platform_export.js)
14. [server/live_suite_manifest.js](../server/live_suite_manifest.js)
15. [vendors/openclaw-lite-main/src/openclaw-lite/gateway.js](../vendors/openclaw-lite-main/src/openclaw-lite/gateway.js)
16. [vendors/openclaw-lite-main/src/openclaw-lite/worker.js](../vendors/openclaw-lite-main/src/openclaw-lite/worker.js)
17. [AGENTS.md](../AGENTS.md)

# 1. Purpose

Phase 34 through Phase 36 successfully shipped:

1. Registry-backed worker packages,
2. House helper deployments,
3. exact-version friend installs,
4. one-helper runtime supervision,
5. non-technical copy for the first install and takeover path.

What remains is the gap between "implemented" and "fully real for normal users."

The next hardening phase exists to make House workers:

1. truthful about the runtime profile they actually use,
2. durable enough that session truth is not merely tab-local optimism,
3. manageable as products people can install, update, pause, remove, and share safely,
4. understandable for end users who do not know what a brain profile, workspace seed, or loadout is,
5. credible in live-environment validation, not only deterministic fixtures.

This is not a redesign of Registry, House Office, or the worker-first architecture.
It is a follow-on reality-hardening phase for the House worker layer.

The executable companion docs for this phase are:

1. [specs/38_house_worker_runtime_reality_hardening_tdd_spec.md](./38_house_worker_runtime_reality_hardening_tdd_spec.md)
2. [specs/39_house_worker_runtime_reality_hardening_agent_runbook.md](./39_house_worker_runtime_reality_hardening_agent_runbook.md)

# 2. Review Findings This Phase Must Close

The implementation review produced nine important findings:

1. Per-helper runtime profile values are persisted, but not proven to affect actual child runtime behavior.
2. Active helper truth is still tab-local and can drift from durable session state after refresh or browser loss.
3. Share links behave like durable package locators, not managed invitations with revoke or expiry semantics.
4. Installed helpers do not yet have a full lifecycle surface for pause, archive, remove, or update.
5. Sharing a useful office setup still requires helper-by-helper repetition instead of one end-user friendly office pack path.
6. Delegation remains limited to one generation and does not yet support controlled nested helper work.
7. Advanced spawn overrides are only syntactically validated and can still name nonexistent or incompatible runtime references.
8. Session UX still shows more runtime internals than a normal user should need, while missing a plain-language recovery summary.
9. There is still no true House worker external live lane; confidence is mostly deterministic plus manual validation.

This phase exists to close those gaps with one additive, deterministic, and end-user-first implementation path.

# 3. End-User Product Thesis

Normal users do not want to "manage child runtimes."
They want to:

1. install a helper that saves time,
2. understand what it is good at,
3. trust whether it is ready,
4. resume safely after interruption,
5. share the same helper setup with a friend,
6. let one helper ask another helper for support when that genuinely helps.

Therefore the worker layer must feel less like a developer supervisor and more like:

1. a helper shelf in the House Office,
2. a clear "ready / waiting / needs setup / stale / update available" product state model,
3. a simple "share to friend" and "share this office team" flow,
4. a plain-language activity and recovery view,
5. a guarded delegation model that stays visible and understandable.

# 4. Non-Negotiable Decisions

## 4.1 Runtime profile truth, not profile theater

If the UI exposes per-helper `brainProfileId`, `workspaceSeedRef`, `configVersionId`, or `loadoutId`, the child runtime must actually bind to those references or fail closed.

Normative rules:

1. Spawned helper sessions must persist both:
   A. `requestedRuntimeProfile`
   B. `appliedRuntimeProfile`
2. `appliedRuntimeProfile` must be based on runtime behavior, not only on request echoing.
3. If a requested profile cannot be resolved or applied, spawn must fail before the helper is marked active.
4. The default path may still inherit the current browser brain, but that inheritance must be explicit in the runtime evidence.
5. The default end-user view must explain this without raw implementation jargon.

## 4.2 Runtime ownership must be durable and honest

An "active" helper must have durable ownership and freshness evidence.

Normative rules:

1. Active helper sessions must expose:
   A. `ownerKind`
   B. `ownerLabel`
   C. `leaseStatus`
   D. `leaseExpiresAt`
   E. `lastHeartbeatAt`
2. Durable session state must distinguish:
   A. `active_attached`
   B. `active_detached`
   C. `stale`
   D. `stopped`
   E. `blocked`
3. "Take Over Here" must reflect real claim-transfer or real restart semantics, not just optimistic UI copy.
4. A stale helper must not remain "running" indefinitely without heartbeat evidence.
5. This phase may add additive durable lease fields or one additive lease table if needed.

## 4.3 Sharing must become managed, not merely copyable

Sharing to a friend is product behavior, not just a clipboard side effect.

Normative rules:

1. House worker shares must gain:
   A. `shareStatus`
   B. `createdAt`
   C. `expiresAt`
   D. `revokedAt`
   E. `installCount`
2. A revoked or expired share must fail closed on preview and install.
3. The sharer must be able to view and revoke existing shares from the product.
4. Share payloads still must not carry secrets.
5. Exact Registry version identity remains mandatory.

## 4.4 Installed helpers need a real lifecycle

Normal users need simple lifecycle actions, not only spawn and stop.

Normative rules:

1. A deployment may be:
   A. `ready`
   B. `brain_binding_required`
   C. `paused`
   D. `archived`
   E. `update_available`
   F. `removed`
2. The product must support:
   A. pause or disable,
   B. archive,
   C. uninstall or remove,
   D. update or reinstall from Registry,
   E. reconnect local brain when needed.
3. Removed deployments must not leave live sessions behind.
4. Archived or paused deployments must not spawn.
5. Default copy must stay end-user friendly.

## 4.5 Office pack sharing is first-class scope

Users should be able to share a useful worker setup, not only one worker at a time.

Normative rules:

1. The product must support a portable `house_worker_pack` or equivalent additive share object.
2. A pack contains:
   A. exact member helper package identities,
   B. office placement recommendations,
   C. display labels,
   D. safe default runtime references,
   E. no secrets.
3. Friend install of a pack must recreate the same helper set and office placement intent.
4. Default pack install must require at most:
   A. choose a destination office scope if needed,
   B. confirm install.
5. A single-helper share remains supported.

## 4.6 Nested delegation is allowed only with visible guardrails

Controlled multi-step delegation is in scope. Runaway helper trees are not.

Normative rules:

1. Nested delegation may extend to depth `2` at most in this phase.
2. A helper may delegate only when:
   A. its package allows delegation,
   B. the target helper package allows delegated use,
   C. team-level concurrency budget allows it.
3. Every delegated child must persist:
   A. `parentWorkerSessionId`
   B. `rootWorkerSessionId`
   C. `delegationDepth`
   D. `delegationReason`
4. The UI must show delegated lineage in plain language.
5. Exceeding depth or budget must fail closed with a stable error code and user-readable explanation.

## 4.7 Runtime reference validation must be semantic

Safety requires existence and compatibility checks, not only safe character checks.

Normative rules:

1. `brainProfileId` must resolve to a usable local brain binding or to an explicit "inherit current browser brain" profile.
2. `configVersionId` must resolve to an existing house-visible config version when provided.
3. `loadoutId` must resolve to the expected Registry or trainer loadout when provided.
4. `workspaceSeedRef` must follow an allowlisted namespace policy.
5. Invalid or incompatible references must fail before spawn with stable error codes.

## 4.8 Recovery UX must be plain language first

Default users must not need to parse runtime ids to recover work.

Normative rules:

1. Default helper cards and session cards must show:
   A. `lastCompletedSummary`
   B. `lastActiveAgoLabel`
   C. `nextRecommendedAction`
   D. `resumeSafetyLabel`
2. Raw ids remain available only in explicit advanced disclosure.
3. A user must be able to decide "resume", "take over", "wait", or "stop" from plain-language guidance alone.
4. Recovery copy must avoid raw LLM and runtime jargon by default.

## 4.9 House worker live confidence must become explicit release evidence

This phase must reduce the gap between deterministic proof and real-user proof.

Normative rules:

1. Add a House worker live-readiness contract for the current live session and browser.
2. Add an operator-assisted live gate for House worker flows.
3. The live gate must not rely on `__test__` helper shortcuts or seeded fake success.
4. The live gate may remain headed and operator-assisted, but it must be scriptable and measurable.
5. Deterministic tests remain the default merge gate; the live gate becomes release evidence.

# 5. Delivery Shape

This phase is an additive hardening phase with one execution order:

1. make runtime profile truth real,
2. make runtime ownership durable and honest,
3. add managed share lifecycle and deployment lifecycle,
4. add office pack sharing,
5. add guarded nested delegation,
6. add semantic runtime reference validation,
7. improve recovery UX and end-user language,
8. add live-readiness and operator gate,
9. prove everything in one integrated smoke.

Reserved Playwright block:

1. `236` through `247`

Reserved tests:

1. `e2e/236_house_worker_runtime_profile_execution_contract.spec.js`
2. `e2e/237_house_worker_runtime_lease_truth_contract.spec.js`
3. `e2e/238_house_worker_share_lifecycle_contract.spec.js`
4. `e2e/239_house_worker_deployment_lifecycle_contract.spec.js`
5. `e2e/240_house_worker_office_pack_share_contract.spec.js`
6. `e2e/241_house_worker_nested_delegation_contract.spec.js`
7. `e2e/242_house_worker_profile_reference_validation.spec.js`
8. `e2e/243_house_worker_recovery_summary_ux.spec.js`
9. `e2e/244_house_worker_default_user_language_guard.spec.js`
10. `e2e/245_house_worker_live_readiness_contract.spec.js`
11. `e2e/246_house_worker_operator_live_gate.spec.js`
12. `e2e/247_house_worker_runtime_reality_smoke.spec.js`

# 6. Expected User Outcomes

When this phase is complete, a normal user should be able to do all of the following without understanding AI internals:

1. install a helper and know whether it is ready,
2. see what the helper last completed,
3. safely resume or take over that helper,
4. pause, archive, update, or remove it,
5. share one helper or a useful worker pack with a friend,
6. see when a helper asked another helper for support,
7. trust that "running" means real active ownership, not stale state,
8. trust that release confidence includes a real House worker live gate.

# 7. Non-Goals For This Phase

The following remain out of scope:

1. server-side fake child-agent completion,
2. public marketplace monetization or payments,
3. public shared office microsites,
4. desktop companion or desktop pet work,
5. unlimited recursive helper spawning,
6. portable export of browser secrets or local wallet secrets,
7. replacing House Office with a separate full-page worker console.
