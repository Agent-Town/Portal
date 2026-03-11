# Phase 29 Spec: House Office Extension (Option 2 -> Option 3, Contracts First, TDD)

Status: Draft
Version: 1.0
Audience: frontend engineers, backend engineers, product engineers, UX engineers, security engineers, QA automation engineers, and AI agent implementers
Depends on:
1. [specs/28_house_office_star_office_inspired_extension_spec.md](./28_house_office_star_office_inspired_extension_spec.md)
2. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
3. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
4. [specs/02_api_contract.md](./02_api_contract.md)
5. [AGENTS.md](../AGENTS.md)
Detailed execution runbook:
1. [specs/30_house_office_extension_agent_runbook.md](./30_house_office_extension_agent_runbook.md)

Goal: implement the House Office extension described in [specs/28_house_office_star_office_inspired_extension_spec.md](./28_house_office_star_office_inspired_extension_spec.md) as one deterministic path:

1. Option 2 first as a read-only House Office view,
2. Option 3 second as the native House Office district,
3. while preserving the current House, Registry, Web, Poker, trainer, and tracks platform behavior.

Implementation constraints:

1. Keep wallet-first and house-aware identity.
2. Keep `/app` modal or in-shell continuity.
3. Keep the current House shell in [public/views/house.html](../public/views/house.html) as the base surface.
4. Do not import Star Office architecture:
   A. no join-key identity,
   B. no JSON-file source of truth,
   C. no Flask sidecar patterns,
   D. no canvas, Phaser, Electron, or Tauri dependency in the main product.
5. Option 2 must add `0` new durable tables.
6. Option 3 may add at most `3` additive durable tables.
7. New APIs must live under `/api/platform/*`.
8. Default tests must remain deterministic and offline-safe.
9. A milestone is not complete until the named docs and tests are updated together.
10. No public shared-office or microsite read mode is in scope for this phase.
11. No desktop companion, desktop pet, or shell-wrapper work is in scope for this phase.

## 1. Executive Summary

This phase converts the House Office extension into an AI-executable TDD program with a single ordered path:

1. compose a reliable House Office overview,
2. add presence, briefing, and attention surfaces with citations and deep links,
3. evolve that overview into a native House Office district,
4. add minimal office or staff assignment scaffolding only where it materially improves the platform,
5. prove privacy, continuity, and coherence with a final integrated smoke.

Reserved Playwright block:

1. `195` to `202`

Reserved tests:

1. `e2e/195_house_office_overview_contract.spec.js`
2. `e2e/196_house_office_presence_board.spec.js`
3. `e2e/197_house_office_briefing_citations.spec.js`
4. `e2e/198_house_office_attention_deeplinks.spec.js`
5. `e2e/199_house_office_district_shell.spec.js`
6. `e2e/200_house_office_staff_assignment_contract.spec.js`
7. `e2e/201_house_office_presence_privacy.spec.js`
8. `e2e/202_house_office_unified_smoke.spec.js`

## 2. Global Measurable Metrics

### 2.1 Continuity metrics

Required for every House Office milestone:

1. `window.location.pathname` remains `/app` or the current House shell entry.
2. Worker session continuity is preserved where navigation opens House Office or linked House surfaces.
3. Team context remains stable across House Office navigation unless the user intentionally changes teams.
4. House Office deep links reopen the correct in-shell surface rather than causing full-page navigation.

### 2.2 Overview composition metrics

Required for Option 2:

1. `GET /api/platform/house-office` returns `200` for valid live sessions.
2. The payload exposes `houseId`, `teamId`, `activeTeamId`, `availableTeamIds`, `offices`, `staffAgents`, `presence`, `briefing`, `attention`, `deeplinks`, and `sourceManifest`.
3. `sourceManifest` lists the underlying platform read sources used to assemble the overview.
4. Option 2 adds no new durable tables.
5. The visible overview includes a lightweight Office Map or equivalent DOM spatial grouping.
6. The Office overview renders at `390px` width with `0` horizontal overflow findings.

### 2.3 Presence metrics

Required for presence milestones:

1. Presence values stay inside the allowed safe vocabulary:
   A. `idle`
   B. `building`
   C. `researching`
   D. `evaluating`
   E. `competing`
   F. `reviewing`
   G. `alert`
2. Presence is derived from durable state rather than manual push state.
3. Presence precedence is deterministic for the same seed:
   A. alert
   B. trainer
   C. workshop or config activity
   D. archive or experience activity
   E. poker or web activity
   F. idle
4. Every presence item has a stable `deepLink` and at least one `sourceRef`.

### 2.4 Briefing metrics

Required for briefing milestones:

1. `citationCoverage = 100%`
   Meaning: every briefing item has at least one citation.
2. Briefing items newer than `24h` are included; older seeded items are excluded.
3. Briefing items are grouped by source family:
   A. archive
   B. trainer
   C. workshop
   D. tracks
   E. experiences
   F. poker or web where applicable
4. Briefing ordering is deterministic:
   A. source family group order is stable,
   B. items inside a family are newest-first by event time,
   C. stable tie-break by source id.
5. Briefing items use neutral, factual copy and do not expose sealed or secret fields.

### 2.5 Attention metrics

Required for attention milestones:

1. Attention items expose stable `severity`, `label`, `sourceKind`, `sourceId`, and `deepLink`.
2. Ordering is deterministic:
   A. `critical`
   B. `warn`
   C. `info`
   D. stable tie-break by newest-first then source id
3. Clicking an attention item opens a real source view with the same team context.
4. Attention items do not create a second queue model; they are derived from trainer, workshop, tracks, archive, or related source records.

### 2.6 Office and staff metrics

Required for Option 3:

1. Office and staff objects remain compatible with current `houseId` and `teamId`.
2. Additive durable scaffolding, if used, stays within `3` tables:
   A. `house_offices`
   B. `house_staff_agents`
   C. `house_staff_assignments`
3. Assignment writes, if introduced, are idempotent.
4. Current House team-selection flows remain unchanged.

### 2.7 Privacy and safety metrics

Required for every milestone and explicitly tested in `201`:

1. `sealedLeakageFindings = 0`
2. `promptLeakageFindings = 0`
3. `credentialLeakageFindings = 0`
4. `callbackLeakageFindings = 0`
5. Presence and briefing payloads expose only coarse labels and safe summaries when sensitive source material exists.

## 3. Test Harness Rules

1. All House Office tests must run offline with seeded fixtures.
2. The existing test reset path remains authoritative.
3. `/__test__/unified-platform/stats` must expose deterministic `inspectors.houseOffice`, `inspectors.houseOfficePresence`, `inspectors.houseOfficeBriefing`, and `inspectors.houseOfficeAttention` before this phase is complete.
4. If Option 3 introduces assignments, test mode must expose deterministic assignment inspection without requiring live external state.
5. Continuity-sensitive tests should reuse the current worker-session inspection helpers rather than inventing a second continuity check.
6. House Office tests must verify both payload shape and visible in-shell rendering.
7. The final smoke must replay the same House Office journey twice and compare the ordered checkpoints exactly.

## 4. Delivery Roadmap

### 4.1 Stage A - Option 2 landing

Stage A is complete when:

1. `195` through `198` are green,
2. the House Office overview is useful without new durable tables,
3. citations and attention deep links are real,
4. continuity remains intact.

### 4.2 Stage B - Option 3 district expansion

Stage B is complete when:

1. `199` and `200` are green,
2. the native House Office district exists,
3. any office or staff scaffolding remains additive and minimal,
4. no duplicate state model has been introduced.

### 4.3 Stage C - Hardening and acceptance

Stage C is complete when:

1. `201` and `202` are green,
2. privacy and sealed-data safety are demonstrated,
3. the House Office district orchestrates existing House surfaces coherently,
4. the full suite remains green.

## 5. Required Fixture Families

1. `house_office_overview_seed`
2. `house_office_presence_seed`
3. `house_office_briefing_seed`
4. `house_office_attention_seed`
5. `house_office_assignments_seed`
6. `house_office_privacy_seed`
7. `house_office_smoke_seed`

## 6. Milestone Map

### M29.0 - House Office overview contract

Primary test:

1. `e2e/195_house_office_overview_contract.spec.js`

RED gate:

1. House Office has no dedicated read contract,
2. House Office has no entry point in the current House shell,
3. overview composition is not inspectable.

GREEN gate:

1. `GET /api/platform/house-office` returns a stable success payload,
2. the current House shell exposes one House Office entry point,
3. the Office panel renders deterministic empty and seeded states,
4. `sourceManifest` is present and non-empty,
5. the Office panel includes a lightweight Office Map or equivalent DOM spatial grouping,
6. the Office panel renders at `390px` width with no horizontal overflow,
7. Option 2 still adds `0` new durable tables.

Implementation notes:

1. Reuse existing `house-console-panel` conventions and test-id naming.
2. Recommended new UI ids:
   A. `house-open-office`
   B. `house-office-panel`
   C. `house-office-empty`
   D. `house-office-map`
   E. `house-office-map-office`
3. The initial route should compose existing platform reads rather than duplicating them.

### M29.1 - Presence board contract

Primary test:

1. `e2e/196_house_office_presence_board.spec.js`

RED gate:

1. House Office presence is manual, decorative, or disconnected from durable state,
2. presence ordering is unstable,
3. presence items do not link to real records.

GREEN gate:

1. presence items are derived from seeded durable state,
2. presence labels use only the allowed safe vocabulary,
3. presence precedence is deterministic for the same seed,
4. each presence item has `officeId`, `focus`, `status`, `lastActivityAt`, `deepLink`, and `sourceRefs`,
5. each `sourceRefs[]` entry exposes stable `sourceKind`, `sourceId`, and `entryPath`,
6. the visible Presence Board matches the same deterministic ordering as the read payload.

Implementation notes:

1. Presence should sort by office order first, then by last activity descending, then stable entity id.
2. Recommended UI ids:
   A. `house-office-presence`
   B. `house-office-presence-item`

### M29.2 - Briefing citations contract

Primary test:

1. `e2e/197_house_office_briefing_citations.spec.js`

RED gate:

1. briefing items are uncited summaries,
2. briefing leaks raw prompts or sealed details,
3. time-window filtering is fuzzy or unstable.

GREEN gate:

1. every briefing item has at least one citation,
2. briefing items older than the seeded `24h` window are excluded,
3. briefing items are grouped by source family with deterministic group ordering,
4. briefing ordering inside each group is newest-first and deterministic,
5. citations expose stable `sourceKind`, `sourceId`, and `entryPath`,
6. the visible briefing surface renders the same grouped items as the API payload.

Implementation notes:

1. Recommended UI ids:
   A. `house-office-briefing`
   B. `house-office-briefing-item`
   C. `house-office-briefing-citation`
   D. `house-office-briefing-group`
2. The `/api/platform/house-office` payload should expose `briefing[]` as grouped family envelopes with `items[]` and citation arrays.
3. A briefing item without citations must fail the milestone.

### M29.3 - Attention queue and deep-link continuity

Primary test:

1. `e2e/198_house_office_attention_deeplinks.spec.js`

RED gate:

1. attention items are not actionable,
2. deep links break shell continuity,
3. attention ordering or severity is unstable.

GREEN gate:

1. attention items expose stable severity and deep links,
2. severity ordering is deterministic,
3. clicking an attention item opens the corresponding real House source panel or linked modal surface,
4. worker session continuity is preserved across those deep links,
5. team context remains unchanged after opening and closing an attention target.

Implementation notes:

1. Recommended UI ids:
   A. `house-office-attention`
   B. `house-office-attention-item`
2. The `/api/platform/house-office` payload should expose `attention[]` with stable severity, source identity, and deep-link fields.
3. The test should verify the same worker session id before and after at least one attention deep-link action.

### M29.4 - Native House Office district shell

Primary test:

1. `e2e/199_house_office_district_shell.spec.js`

RED gate:

1. the House Office remains a loose card list rather than a structured district,
2. district sections require a second app shell,
3. team switching or House continuity regresses.

GREEN gate:

1. the Office surface evolves into a district shell with named sections:
   A. Front Desk
   B. Workshop Wing
   C. Analysis Wing
   D. Archive Wing
   E. Operations Wing
   F. Tracks Board
2. the district stays inside the current House shell,
3. team switching remains the same shared control,
4. district navigation preserves worker session continuity,
5. the district continues to render at `390px` width with no horizontal overflow,
6. no canvas or separate runtime dependency is introduced.

Implementation notes:

1. Recommended UI ids:
   A. `house-office-district-panel`
   B. `house-office-front-desk`
   C. `house-office-workshop-wing`
   D. `house-office-analysis-wing`
   E. `house-office-archive-wing`
   F. `house-office-operations-wing`
   G. `house-office-tracks-board`

### M29.5 - Staff assignment contract

Primary test:

1. `e2e/200_house_office_staff_assignment_contract.spec.js`

RED gate:

1. meaningful office or staff structure cannot be expressed without brittle fixture-only hacks,
2. assignment writes are non-deterministic,
3. current House team flows break after assignment support lands.

GREEN gate:

1. office, staff-agent, and assignment semantics are deterministic,
2. if `POST /api/platform/house-office/assignments` is introduced, it supports idempotent writes,
3. invalid writes fail with stable errors such as:
   A. `HOUSE_REQUIRED`
   B. `ACTIVE_TEAM_REQUIRED`
   C. `OFFICE_NOT_FOUND`
   D. `STAFF_AGENT_NOT_FOUND`
   E. `INVALID_ARGUMENT`
4. repeated identical assignment requests return the same assignment identity,
5. House team selection and current House routes remain intact.

Implementation notes:

1. This milestone may remain additive and minimal; it does not authorize a second personnel system.
2. The write contract, if used, should remain session-bound to the current live Portal session and active house or team context.

### M29.6 - Presence privacy and sealed-data safety

Primary test:

1. `e2e/201_house_office_presence_privacy.spec.js`

RED gate:

1. House Office leaks raw prompts, callback URLs, credentials, or sealed trace content,
2. privacy behavior is inconsistent across repeated reads.

GREEN gate:

1. House Office overview payloads expose only coarse safe summaries,
2. seeded private or sealed source data remains redacted or omitted deterministically,
3. the UI shows safe labels without leaking the underlying sensitive fields,
4. repeated seeded reads produce the same redacted payload shape,
5. privacy filtering does not remove the ability to deep-link into allowed source surfaces.

Implementation notes:

1. The privacy test must assert absence of specific forbidden fields rather than vague non-leakage.
2. Presence and briefing surfaces must avoid raw prompt, token, callback, secret, and sealed event payload fields.

### M29.7 - Unified House Office smoke

Primary test:

1. `e2e/202_house_office_unified_smoke.spec.js`

RED gate:

1. House Office still behaves like an isolated feature,
2. district navigation depends on hidden manual steps,
3. overview and district contracts drift apart.

GREEN gate:

1. one seeded user journey can move from House Office overview into district sections and real House source surfaces,
2. the journey preserves shell continuity and team context,
3. citations, attention items, and district sections all resolve to real platform records,
4. replaying the same seeded journey twice yields the same ordered checkpoint list,
5. the Phase 28 through Phase 30 doc set is internally consistent.

Implementation notes:

1. The smoke path must touch:
   A. overview,
   B. presence or briefing,
   C. attention,
   D. one district section,
   E. one linked source surface.
2. The smoke does not need live third-party systems.

## 7. Bundle Gate

This Phase 29 program is complete only when:

1. tests `195` through `202` are green,
2. Option 2 remains read-only and table-free,
3. Option 3 remains additive and minimal,
4. House Office improves comprehension without creating a second product model,
5. privacy and sealed-data handling remain safe,
6. the mobile `390px` shell remains usable with no horizontal overflow regressions,
7. public shared-office and desktop companion scope remain explicitly deferred,
8. the full Playwright suite remains green.
