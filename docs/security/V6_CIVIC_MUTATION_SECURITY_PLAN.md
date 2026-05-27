# V6 Civic Mutation Security Plan

Status: `research_only`

Runtime contract: `server/world_civilization/mutation_security.js`

Milestone: M5 Mutation security controls

This plan records the security envelope required before any V6 civic mutation
route or worker tool can call proposal, vote, delegation, moderation,
reputation, effect, institution, or public-works stores. It is not a release
approval and does not expose V6 in normal gameplay.

## Current Baseline

- V6 civic mutations remain route-less and tool-hidden by default.
- Broad V5 world-grid overrides do not enable the V6 mutation envelope.
- The envelope requires explicit V6 feature flag enablement and an internal
  research mutation opt-in.
- Production/security-required mode reuses the V5 same-origin mutation-origin
  guard and requires CSRF verification before allowing a store call.
- Session and wallet state must be server verified and bound to the same
  account.
- Human actors must match the authenticated session account.
- Agent actors require verified, unexpired delegation from the authenticated
  principal and a human approval receipt.
- Mutations require an idempotency key before any future store call.
- Owner/surface rate limiting uses the current prototype bucket shape.
- The report remains `research_only`, `runtimeExposed: false`,
  `playerVisible: false`, `productionEnabled: false`, and
  `mutationApplied: false`.

## Required Release Controls

- durable/session-bound CSRF token issuance and verification.
- Durable or shared rate-limit counters across production instances.
- Final session/wallet ownership middleware connected to every mutating V6
  route and worker tool.
- Idempotency records bound to session, wallet, actor, route/tool surface, and
  normalized request hash.
- Audit ledger entries for successful authorized mutations, with replay and
  rollback handles where relevant.
- Browser coverage for same-origin, cross-origin, stale session, cross-wallet,
  delegated-agent, retry, and rate-limit cases.
- M17 security/product signoff before any player-visible V6 civic mutation.

## Out Of Scope

This foundation does not implement public V6 routes, durable CSRF storage,
distributed rate limits, civic effect application, or public autonomous agents.
