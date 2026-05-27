# Agent Town V6 Security Product Release Review Foundation

Status: `research_only`

Milestone: M17 Security and product release review

Runtime contract: `server/world_civilization/release_review.js`

Security checklist: `docs/security/V6_AGENT_CIVILIZATION_RELEASE_REVIEW.md`

Test coverage: `tests/world_civilization_release_review.test.js`

## Boundary

This foundation creates the V6 release-review gate contract. It does not
approve V6 for normal gameplay, expose V6 tools, create public civic mechanics,
or replace human security/product signoff.

The review report is feature-gated, research-only, hidden from runtime/player
surfaces, non-executing, and blocked unless all required evidence and signoffs
are present.

## Required Review Gates

- Threat model: trust boundaries, assets, attacker capabilities, abuse paths,
  and mitigations.
- Privacy review: private town isolation, wallet and Brain secret exclusion,
  provider credential exclusion, and debug trace redaction.
- Abuse-case review: spam, harassment, impersonation, unauthorized mutation,
  store-backed delegated-agent proof, delegation scope mismatch, read-only
  delegation budget evidence, moderation escalation, and civic mutation
  security envelope evidence.
- Data-retention policy: audit retention, deletion policy, debug log retention,
  and export policy.
- Audit coverage: append-only ledger, owner indexes, migration versions,
  proposal review transition audit rows, reputation/moderation link evidence,
  schema metadata drift checks, migration rehearsal with unsupported
  upgrade/downgrade targets failing closed, replay reconstruction,
  store-specific audit-summary coverage, rollback handles, governance preflight
  evidence, and non-executing rollback recovery evidence.
- Validation evidence: targeted Node suite, split Playwright smokes,
  all-features regression, feature override safety, and load/rate replay
  evidence, including civic mutation security, proposal intake readiness, vote
  authorization readiness, reputation eligibility advice readiness, moderation
  privacy readiness, delegated-agent proof, and governance preflight, effect
  execution gate, agent participation enforcement gate, institution readiness
  gate, public works readiness gate, lab readiness gate, and resilience
  readiness gate contract coverage.
- Proposal intake readiness review: human submission envelope, worker-tool
  submission envelope, OpenClaw Lite worker origin, Skill Context and Worker
  Traffic observability, mutation security envelope, same-origin/CSRF/session
  auth, idempotent submission replay, review queue indexes, moderation decision
  links, proposal audit rows, public text rendering review, private-data
  exclusion, no backend shortcuts, no civic tool exposure, and no effect
  execution before any proposal route or worker tool can accept civic proposals.
- Vote authorization readiness review: server-verified voter authorization,
  eligibility rule verification, one-vote accounting, idempotent receipt replay,
  changed-vote replay rejection, proposal expiry denial, delegation policy
  review, per-institution voting templates, route-edge vote auth,
  quorum/threshold policy, governance-preflight integration, vote audit rows,
  private-data exclusion, and no effect application before any vote route or
  worker tool can influence civic outcomes.
- Reputation eligibility and advice review: eligibility policy review, advice
  policy review, source-policy coverage for every current reputation kind,
  moderation/dispute linkage, privacy/product review, public text rendering
  review, private-data exclusion, non-transferable reputation, anti-self-award,
  bounded deltas, duplicate-source protection, human dispute requesters,
  reputation/dispute audit rows, no player-visible reputation, no score
  mutation, and no world mutation before reputation can inform production
  eligibility or advice.
- Moderation privacy readiness review: proposal text, agent-authored content,
  public profile, attached media, sandbox artifact, and public works effect
  policies; surface-policy coverage; abuse-report triage; appeal operations;
  human review tooling; redaction, public-text rendering, and public-presence
  privacy review; private-data exclusion; review replay; moderation/appeal audit
  rows; no player-visible moderation; no moderation effect application; and no
  world mutation before moderation can cover production public surfaces.
- Effect execution and rollback review: typed apply handlers, typed rollback
  handlers, real before/after state, authorization enforcement, idempotent
  apply/rollback behavior, irreversible-action review, conservation tests,
  applied/rollback audit evidence, and worker/route security before any
  executable civic effect can exist.
- Agent participation enforcement review: worker-tool scope enforcement,
  route-edge scope checks, route-edge expiry checks, route-edge budget checks,
  route-edge revocation checks, principal wallet/session binding, idempotent
  budget consumption, store-backed delegation proof, delegation audit rows, no
  backend shortcuts, and no public autonomous mutation before delegated
  authority can affect any civic route or tool.
- Civic institution readiness review: release-reviewed charter templates,
  membership rules, eligibility rules, voting rules, moderation policies,
  proposal-type rules, public audit summaries, public text rendering, M12
  delegation policy linkage, charter-change execution/rollback review,
  private-data exclusion, institution audit rows, no player-visible
  institutions, and no world mutation before any institution can appear in
  normal gameplay.
- Public works readiness review: governed project review, worker/tool
  enforcement, wallet/session route authorization, durable idempotency, explicit
  inventory-spend authorization, inventory restart replay, resource
  conservation tests, reward conservation, contribution caps under retry,
  rollback execution review, public text rendering, private-data exclusion,
  public-works audit rows, process restart replay, no private-town mutation, and
  no public free play before any shared-resource public works surface can appear
  in normal gameplay.
- Worker tool surface review: runtime manifest source-of-truth evidence,
  OpenClaw Lite worker origin, Worker Traffic and Skill Context observability,
  mutation security envelope coverage, and no backend shortcuts before any
  civic tool exposure.
- Modal lab surface review: town hub modal launch, standalone route denial,
  worker continuity, debug observability, non-executing panels, browser visual
  coverage at 390/768/1280 widths, keyboard accessibility, focus trap review,
  runtime tool absence, normal gameplay exposure denial, and private debug-data
  exclusion before any internal V6 lab surface can become visible.
- Persistence replay resilience readiness review: all civic store restart
  probes, audit replay reconstruction, privacy-safe replay summaries,
  store-specific zero hash-only fallback proof, hash-chain integrity, migration
  upgrade/downgrade scripts, unsupported transition denial, backup/restore
  rehearsal, migration load replay rehearsal, production load/rate targets,
  multi-process write contention, duplicate retry bursts, rollback handle
  reconstruction, typed rollback execution recovery, private-data exclusion, and
  no effect application during replay before M16 can claim release-grade
  resilience.
- Product release signoff: player-visible scope, rollback plan, support runbook,
  and disable plan.

## Release Rule

M17 may move to `done` only when the review report can be built with complete
evidence and approved signoff for every gate. Even then, M18 remains separate:
controlled release still needs production-safe enablement, rollback/disable
controls, observability, and support runbooks before V6 becomes player-visible.
