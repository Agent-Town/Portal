# Phase 31 Spec: House Office Reality and Hardening

Status: Proposed
Version: 0.1
Audience: product, frontend, backend, UX, QA, security, benchmarking, AI-agent, and architecture teams
Implementation baseline: `codex/house-office-options-v0-1` at commit `9525d4d`
Depends on:
1. [specs/28_house_office_star_office_inspired_extension_spec.md](./28_house_office_star_office_inspired_extension_spec.md)
2. [specs/29_house_office_extension_tdd_spec.md](./29_house_office_extension_tdd_spec.md)
3. [specs/30_house_office_extension_agent_runbook.md](./30_house_office_extension_agent_runbook.md)
4. [specs/02_api_contract.md](./02_api_contract.md)
5. [docs/live_lane_audit.md](../docs/live_lane_audit.md)
6. [public/views/house.html](../public/views/house.html)
7. [public/app.js](../public/app.js)
8. [server/platform_read_routes.js](../server/platform_read_routes.js)
9. [server/unified_platform_store.js](../server/unified_platform_store.js)
10. [AGENTS.md](../AGENTS.md)

# 1. Purpose

Phase 28 through Phase 30 successfully shipped the House Office shell.
This Phase 31 document closes the review findings that remain after implementation.

The goal is to make House Office:

1. honest about where its data comes from,
2. exact about what each citation and attention item opens,
3. safe at write-time and not only at projection-time,
4. broad enough to reflect real House operations,
5. operationally trustworthy for manual validation.

This is a follow-on hardening phase, not a restart of the House Office design.
It preserves the current House shell, modal-first continuity, wallet-first identity, and deterministic Playwright coverage.

The executable companion docs for this phase are:

1. [specs/32_house_office_reality_hardening_tdd_spec.md](./32_house_office_reality_hardening_tdd_spec.md)
2. [specs/33_house_office_reality_hardening_agent_runbook.md](./33_house_office_reality_hardening_agent_runbook.md)

# 2. Review Findings This Phase Must Close

The implementation review produced seven important findings:

1. House Office structure is still fixture-backed and inconsistent across routes.
2. House readiness reports are checklist-driven and can claim green without real route-level evidence.
3. Briefing citations and attention links open generic surfaces rather than exact records.
4. Sensitive assignment focus text can still be persisted raw and is only redacted on output.
5. House Office assignment source references are not validated against real source records.
6. House Office under-represents operational signals from experiences, poker, and web flows.
7. Optional `teamId` overrides on House Office reads are weaker than the active-team write guard.

This phase exists to close those gaps with one deterministic implementation path.

# 3. Non-Negotiable Decisions

## 3.1 Canonical Structure Truth

House Office offices and staff agents must stop being runtime fixture truth once a house is attached.

Normative rules:

1. `GET /api/platform/house-structure` becomes the canonical structure source for House Office.
2. `GET /api/platform/house-office` must reuse that canonical structure source and must not independently assemble office or staff identities from a second fixture family.
3. The implementation may add up to `2` additive durable tables:
   A. `house_offices`
   B. `house_staff_agents`
4. The existing `house_staff_assignments` table remains the assignment truth.
5. Test fixtures may still seed structure in test mode, but runtime routes must expose structure provenance through an explicit `structureSourceKind` field rather than pretending the fixture file is product truth.

## 3.2 Exact Record Opening

Every House Office citation, attention item, and assignment that claims to refer to a source record must open that exact record, not just the generic surface.

Normative rules:

1. House Office deep links must grow from:
   A. `kind`
   B. `surface`
   C. `label`

   to:
   A. `kind`
   B. `surface`
   C. `label`
   D. `selection`
2. `selection` must identify the exact record that should become active in the target panel.
3. The target surface must accept that selection in-shell and render the selected record as active.
4. Generic panel opening alone does not satisfy the citation requirement anymore.
5. Briefing citations, attention deep links, and assignment source references must carry the same normalized `selection` envelope for the cited record.

Stable selection shapes:

1. archive:
   A. `selection.kind = "trace"`
   B. `selection.traceId`
   C. optional `selection.runId`
2. trainer:
   A. `selection.kind = "trainer_result"` or `selection.kind = "trainer_job"`
   B. exact id field
3. workshop:
   A. `selection.kind = "config_version"` or `selection.kind = "team_binding"`
   B. exact id field
4. tracks:
   A. `selection.kind = "track_event"` or `selection.kind = "track"`
   B. exact id field
5. experiences:
   A. `selection.kind = "experience"` or `selection.kind = "run"`
   B. exact id field

## 3.3 Honest Readiness

House readiness must become a real route-level readiness report rather than a static operator checklist.

Normative rules:

1. `GET /api/platform/house-readiness` must probe the actual House Office route family for the current session and active team.
2. Each surface entry must expose measurable readiness evidence:
   A. `routeOk`
   B. `dataOk`
   C. `selectionOk`
   D. `browserValidationRequired`
   E. `blockedBy[]`
3. `status = ready_for_manual_validation` is allowed only when all required route probes are green.
4. A surface must stay `blocked` when:
   A. its route fails,
   B. required record data is absent,
   C. required exact-selection targets cannot be resolved.
5. The manual checklist remains useful, but it becomes follow-up guidance, not the basis for a green status.

## 3.4 Write-Time Privacy Barrier

Privacy must be enforced before persistence, not only after persistence.

Normative rules:

1. `POST /api/platform/house-office/assignments` must reject unsafe `focus` values with a stable error code:
   A. `SENSITIVE_CONTENT_BLOCKED`
2. Unsafe text includes:
   A. prompt-like secrets
   B. callback URLs
   C. access tokens
   D. credentials
   E. sealed payload fragments
3. Unsafe requests must not create or mutate assignment rows.
4. Projection-time redaction still remains for derived read paths, but it becomes a secondary defense.

## 3.5 Real Source Validation

Assignments must be bound to real House-owned or team-owned source records.

Normative rules:

1. Supported assignment source kinds:
   A. `trainer_job`
   B. `trainer_result`
   C. `team_config_binding`
   D. `config_version`
   E. `track_progress_event`
   F. `run`
   G. `experience`
2. Unsupported kinds must fail with `SOURCE_REF_KIND_UNSUPPORTED`.
3. Unknown ids must fail with `SOURCE_REF_NOT_FOUND`.
4. Records outside the current house or active team scope must fail with `SOURCE_REF_SCOPE_MISMATCH`.
5. Successful assignment writes must echo a normalized source reference with exact source identity and exact selection metadata.

## 3.6 Operational Breadth

House Office must reflect actual operational signals, not just archive, trainer, workshop, and tracks.

Normative rules:

1. Briefing families must include `experiences` and `poker_or_web` when eligible durable records exist.
2. Attention must consider:
   A. web experience runs with recent activity,
   B. poker season activity or operator-ingested competition runs,
   C. experience definitions or run-level alerts that require action.
3. Presence must remain coarse and safe, but the Operations side of the house must no longer be tracks-only.

## 3.7 Team Override Guard

Read-time `teamId` overrides must follow the same access discipline as the active-team write flow.

Normative rules:

1. `GET /api/platform/house-office`
2. `GET /api/platform/house-structure`
3. `GET /api/platform/house-readiness`

must reject unknown or unavailable `teamId` values with:

1. `TEAM_NOT_FOUND`

No read route in this phase may silently accept an unavailable team override.

# 4. Delivery Shape

Phase 31 is an additive hardening phase with one execution order:

1. make House Office structure canonical,
2. make every House Office link exact,
3. make readiness honest,
4. enforce write-time privacy and real source validation,
5. widen operational breadth,
6. tighten team guardrails,
7. prove everything in one integrated smoke.

Reserved Playwright block:

1. `205` through `213`

Reserved tests:

1. `e2e/205_house_office_structure_canonical_contract.spec.js`
2. `e2e/206_house_office_citation_selection_contract.spec.js`
3. `e2e/207_house_office_attention_assignment_selection.spec.js`
4. `e2e/208_house_office_readiness_truth_contract.spec.js`
5. `e2e/209_house_office_assignment_source_validation.spec.js`
6. `e2e/210_house_office_assignment_privacy_write_barrier.spec.js`
7. `e2e/211_house_office_ops_breadth_contract.spec.js`
8. `e2e/212_house_office_team_override_guard.spec.js`
9. `e2e/213_house_office_reality_hardening_smoke.spec.js`

# 5. Phase Acceptance

Phase 31 is complete only when:

1. tests `205` through `213` are green,
2. House Office no longer depends on split structure truth across `/api/platform/house-structure` and `/api/platform/house-office`,
3. citations, attention items, and assignments open exact target records in-shell,
4. readiness can no longer report green solely because a house and team exist,
5. unsafe assignment text is blocked before persistence,
6. assignment source references are real and scope-checked,
7. House Office reflects experience and poker or web activity where eligible,
8. team override reads reject unavailable team ids,
9. previously green House Office tests `195` through `204` remain green,
10. the full deterministic suite remains green.

# 6. Explicit Non-Goals

This phase does not add:

1. public shared-office pages,
2. desktop companion or desktop pet scope,
3. a second House shell,
4. game-loop or canvas UI requirements,
5. external identity providers,
6. non-deterministic live-only tests as the primary acceptance gate.
