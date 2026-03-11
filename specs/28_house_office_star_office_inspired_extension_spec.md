# Phase 28 Spec: House Office Extension Inspired by Star Office

Status: Implemented
Version: 1.1
Audience: product, frontend, backend, runtime, AI-agent, benchmarking, security, UX, office-planning, QA, and AI coding agents
Implementation baseline: `codex/house-office-options-v0-1` at commit `5244403`
Primary external inspiration:
1. `https://github.com/ringhyacinth/Star-Office-UI`
2. `https://github.com/ringhyacinth/Star-Office-UI/blob/master/README.en.md`
3. `https://github.com/ringhyacinth/Star-Office-UI/blob/master/docs/STAR_OFFICE_UI_OVERVIEW.md`
4. `https://github.com/ringhyacinth/Star-Office-UI/blob/master/backend/app.py`
Grounding docs:
1. [specs/22_option5_integration_unified_completion_spec.md](./22_option5_integration_unified_completion_spec.md)
2. [specs/25_option5_integration_platform_house_tracks_tdd_spec.md](./25_option5_integration_platform_house_tracks_tdd_spec.md)
3. [specs/02_api_contract.md](./02_api_contract.md)
4. [public/views/house.html](../public/views/house.html)
5. [public/app.js](../public/app.js)
6. [server/platform_read_routes.js](../server/platform_read_routes.js)
7. [server/unified_platform_store.js](../server/unified_platform_store.js)
8. [server/fixtures/unified-platform/house_office_staff_seed.json](../server/fixtures/unified-platform/house_office_staff_seed.json)
9. [AGENTS.md](../AGENTS.md)

# 1. Purpose

This document defines how Agent Town should borrow the best ideas from `Star-Office-UI` without importing its mismatched architecture.

It does five things:

1. identifies the parts of Star Office that are genuinely useful for Agent Town,
2. rejects the parts that would conflict with the current platform,
3. defines Option 2 as the incremental House Office landing on top of the current House Console,
4. defines Option 3 as the native long-term House Office district that remains wallet-first, modal-first, and platform-native,
5. gives measurable product and engineering gates so AI coding agents can implement this work without inventing a second path.

This is an extension spec, not a replacement for Phase 22 through Phase 25.
Option 2 and Option 3 must preserve the current House, Registry, Web, Poker, trainer, and tracks behavior already delivered in the branch baseline.

The executable companion docs for this extension are:

1. [specs/29_house_office_extension_tdd_spec.md](./29_house_office_extension_tdd_spec.md)
2. [specs/30_house_office_extension_agent_runbook.md](./30_house_office_extension_agent_runbook.md)

# 1.1 Completion Status

This extension is implemented on `codex/house-office-options-v0-1`.

Acceptance evidence:

1. Option 2 and Option 3 milestone tests `e2e/195` through `e2e/202` are implemented and green.
2. The late continuity-sensitive regression block covering `e2e/57`, `e2e/58`, `e2e/60`, and `e2e/72` is green on the same branch.
3. Full deterministic suite result on the implementation baseline is `320 passed, 4 skipped`.
4. The implementation remains inside the existing House shell and current `/api/platform/*` route family.

# 2. Product Thesis

The useful idea in Star Office is not "a gameified office."
The useful idea is a legible, glanceable, spatially organized way to understand what the house is doing now, what changed recently, and where to go next.

For Agent Town, that translates into:

1. a House Office surface that makes House activity easier to understand,
2. a librarian-quality briefing that summarizes recent work with citations,
3. a clearer mapping between offices, staff roles, current focus, and durable outputs,
4. direct deep links into the existing House surfaces rather than a second standalone app.

The House Office must improve clarity and coordination.
It must not become a toy dashboard, a second identity model, or a second backend.

# 3. Borrow / Reject Matrix

## 3.1 Borrow directly

The following ideas are explicitly good and should be adapted:

1. spatial office metaphor for status and role clarity,
2. glanceable presence board,
3. "yesterday memo" style briefing surface,
4. multi-agent/staff visibility,
5. office zones that map to real work types,
6. low-friction deep links from overview to detailed work surfaces,
7. optional later desktop companion idea as a wrapper around the main product, not a replacement for it.

## 3.2 Adapt, do not copy

The following ideas are useful only after being translated into Agent Town semantics:

1. Star Office "agents" become House staff agents, team members, and durable activity sources.
2. Star Office room zones become House offices and work areas backed by current platform surfaces.
3. Star Office memo becomes a House Briefing built from archive, trainer, tracks, workshop, and poker or web evidence.
4. Star Office current-state bubbles become neutral House focus labels and last-activity summaries.

## 3.3 Reject outright

The following Star Office patterns must not be adopted:

1. join-key identity,
2. standalone Flask or sidecar backend,
3. JSON file runtime state as the main persistence model,
4. manual push as the core truth model for activity,
5. pixel-art or game-loop dependency as a product requirement,
6. asset drawers, AI room decoration, or Gemini image-generation scope,
7. public-by-default exposure of sensitive staff or house data,
8. smoke-test-only verification.

# 4. Current Branch Constraints

Any House Office work must respect the current platform shape:

1. Wallet-first and house-auth-first identity remain mandatory.
2. `/app` modal continuity remains mandatory.
3. The House Console in [public/views/house.html](../public/views/house.html) remains the base shell.
4. Existing read routes in [server/platform_read_routes.js](../server/platform_read_routes.js) remain the base data spine:
   A. `GET /api/platform/archive`
   B. `GET /api/platform/experiences`
   C. `GET /api/platform/workshop`
   D. `GET /api/platform/house-structure`
   E. `GET /api/platform/tracks`
   F. `GET /api/platform/trainer`
5. Existing durable state in [server/unified_platform_store.js](../server/unified_platform_store.js) remains authoritative.
6. Existing House team selection and active-team context must remain unchanged.
7. New work must be deterministic and Playwright-verifiable.
8. New work must stay visually consistent with the current platform rather than importing Star Office art direction.

# 5. Shared Design Rules for Both Options

These rules apply to both Option 2 and Option 3.

## 5.1 UX rules

1. The House Office must remain minimal and legible.
2. It must use the current platform shell, controls, and typography direction.
3. It must work on desktop and mobile widths without horizontal overflow.
4. It must not add decorative clutter, idle animation requirements, or novelty-first interactions.
5. Every visible card, badge, or status must answer a concrete user question.

## 5.2 Data rules

1. Briefing items must be citation-backed.
2. Presence must be derived from current durable state and current shell context whenever possible.
3. Sensitive sealed information must never leak into the overview layer.
4. No duplicate archive, trainer, or track cache may be introduced for convenience.
5. Presence labels must be coarse and safe:
   A. `idle`
   B. `building`
   C. `researching`
   D. `evaluating`
   E. `competing`
   F. `reviewing`
   G. `alert`

## 5.3 Platform rules

1. Option 2 adds no new auth token or identity primitive.
2. Option 3 adds no new auth token or identity primitive.
3. New APIs belong under `/api/platform/*`.
4. No new route family may be introduced for House Office.
5. Worker-facing tools must not be added unless a concrete agent behavior requires them.

## 5.4 Security rules

1. House Office routes remain session-bound and house-aware.
2. Public shared-office pages are out of scope.
3. Briefing and presence fields must redact secrets, prompts, callback URLs, credentials, and sealed trace content.
4. Poker-sensitive data must respect the same seal and fairness policies as the rest of the platform.

# 6. Option 2 - House Office View

## 6.1 Summary

Option 2 is the incremental landing.
It adds a read-only House Office view inside the current House shell by composing existing platform reads into one clearer surface.

It is intended to deliver the biggest user-value gain with the lowest architectural risk.

## 6.2 User value

Option 2 should let a user answer these questions quickly:

1. What is this house or team focused on right now?
2. Which office or role is active?
3. What changed in the last day?
4. Are there trainer, archive, workshop, poker, or track items that need attention?
5. Where do I click next to inspect the real record?

## 6.3 Product shape

Option 2 adds one new House surface:

1. `House Office`

It lives alongside:

1. Experiences
2. Workshop
3. Tracks
4. Archive
5. Trainer

The Office surface contains:

1. `House Briefing`
   A. last 24-hour summary
   B. each bullet exposes one or more clickable citations that reopen a real House source surface
   C. no freeform LLM-only summary without citations
2. `Presence Board`
   A. staff or office tiles
   B. current focus label
   C. recent activity timestamp
   D. deep link target
3. `Attention Queue`
   A. failed trainer jobs
   B. pending approvals
   C. track-related alerts
   D. stale workshop bindings
4. `Office Map`
   A. a lightweight, non-game, CSS or DOM spatial grouping
   B. offices such as Workshop, Analysis, Archive, Operations
   C. no canvas or Phaser dependency

## 6.4 Data model

Option 2 must be read-only and mostly computed.

It may add:

1. one composed read route,
2. one deterministic fixture seed if needed for empty-state scaffolding.

It must not add new durable tables.

The view is composed from:

1. `GET /api/platform/house-structure`
2. `GET /api/platform/archive`
3. `GET /api/platform/workshop`
4. `GET /api/platform/trainer`
5. `GET /api/platform/tracks`
6. `GET /api/platform/experiences`
7. current active team context from `GET /api/platform/context`

## 6.5 API contract

Option 2 adds:

1. `GET /api/platform/house-office`

The payload must include:

1. `houseId`
2. `teamId`
3. `activeTeamId`
4. `availableTeamIds`
5. `offices`
6. `staffAgents`
7. `presence`
8. `briefing`
9. `attention`
10. `deeplinks`
11. `sourceManifest`

The `sourceManifest` is required.
It lists which existing platform routes and durable records were used to assemble the view so the composition remains inspectable and deterministic.

## 6.6 Briefing rules

The `House Briefing` is the main librarian-inspired borrowed feature.

It must:

1. summarize only the last 24 hours by default,
2. group items by source family:
   A. archive
   B. trainer
   C. workshop
   D. tracks
   E. experiences
   F. poker or web where applicable
3. attach one or more source citations per item,
4. use neutral, factual copy,
5. avoid raw sealed details and raw prompt text,
6. be deterministic from seeded fixtures in tests.

## 6.7 Presence rules

Presence is not manual push state.
Presence is a derived operational label from current platform truth.

Precedence order:

1. active or recent alert state,
2. active trainer activity,
3. active workshop or config activity,
4. recent archive or experience activity,
5. recent poker or web activity,
6. otherwise idle.

Each presence item must include:

1. `entityId`
2. `entityKind`
3. `officeId`
4. `focus`
5. `status`
6. `lastActivityAt`
7. `deepLink`
8. `sourceRefs`

## 6.8 Metrics and gates

Option 2 is complete only when:

1. `shellContinuityRate = 100%`
   Meaning: every Office action stays within `/app` or the House shell.
2. `newIdentityPrimitives = 0`
3. `newDurableTables = 0`
4. `citationCoverage = 100%`
   Meaning: every briefing item has at least one durable source ref.
5. `sealedLeakageFindings = 0`
   Meaning: no Playwright or contract test can read sealed details from the overview.
6. `mobileOverflowFindings = 0`
   Meaning: the Office surface renders at `390px` width with no horizontal scroll.
7. `fullSuiteGreen = true`

## 6.9 Recommended TDD block

Reserve:

1. `e2e/195_house_office_overview_contract.spec.js`
2. `e2e/196_house_office_presence_board.spec.js`
3. `e2e/197_house_office_briefing_citations.spec.js`
4. `e2e/198_house_office_attention_deeplinks.spec.js`

# 7. Option 3 - Native House Office District

## 7.1 Summary

Option 3 is the native target.
It turns the current House Office view into a first-class House district that still runs inside the current platform shell and durable platform model.

Option 3 is not a separate app.
It is a stronger House surface on top of the existing House, trainer, tracks, workshop, archive, Registry, Web, and Poker substrate.

## 7.2 User value

Option 3 should make the House feel like an actual operational headquarters rather than a list of adjacent panels.

It should let a user:

1. understand office structure and staff assignments,
2. see which staff or office is driving which durable outputs,
3. move from overview to source records without losing continuity,
4. manage team-level focus while staying inside the same shell.

## 7.3 Product shape

Option 3 evolves the Office surface into a first-class House district made of:

1. `Front Desk`
   A. house summary
   B. current team and office status
   C. attention queue
2. `Workshop Wing`
   A. active config lineage
   B. current build or web integration activity
3. `Analysis Wing`
   A. trainer jobs
   B. trainer results
   C. replay or compare outputs
4. `Archive Wing`
   A. trace, artifact, and proof visibility
   B. briefing source inspection
5. `Operations Wing`
   A. poker, approvals, and release readiness where relevant
6. `Tracks Board`
   A. progression and current house momentum

This district may use a stronger spatial layout than Option 2, but it still must use standard platform HTML, CSS, and JS.
No canvas engine is required or preferred.

## 7.4 Durable model

Option 3 may add additive durable scaffolding where Option 2 does not.

Allowed additions:

1. `house_offices`
2. `house_staff_agents`
3. `house_staff_assignments`

Allowed derived reads:

1. `house office presence`
2. `house briefing`
3. `house attention`

Disallowed:

1. duplicate `archive` tables,
2. duplicate `trainer` tables,
3. duplicate `tracks` tables,
4. freeform office status cache that can diverge from the source records.

## 7.5 API contract

Option 3 may extend Option 2 with:

1. `GET /api/platform/house-office`
   A. richer detail view
   B. office and staff assignment metadata
2. `POST /api/platform/house-office/assignments`
   A. optional, if a minimal assignment workflow is needed
   B. must remain house-auth and team-aware
3. `GET /api/platform/house-office/briefing`
   A. only if read-size or composition complexity demands separation

Default preference:

1. keep one main read route,
2. add write routes only when a deterministic assignment workflow is genuinely required,
3. never add write routes for cosmetic layout editing in the first implementation.

## 7.6 Office and staff semantics

Option 3 turns current office scaffolding into meaningful but still minimal objects.

Required fields:

1. office:
   A. `officeId`
   B. `slug`
   C. `displayName`
   D. `purpose`
   E. `order`
2. staff agent:
   A. `staffAgentId`
   B. `displayName`
   C. `role`
   D. `teamId`
   E. `officeId`
3. assignment:
   A. `assignmentId`
   B. `staffAgentId`
   C. `officeId`
   D. `focus`
   E. `sourceKind`
   F. `sourceId`
   G. `startedAt`

These objects must remain compatible with current `teamId` and `houseId` semantics.

## 7.7 Interaction rules

1. Clicking an office opens the relevant existing House surface or modal content.
2. Clicking a staff agent opens the relevant deep-linked durable record list.
3. The Office district does not replace Archive, Trainer, Workshop, Tracks, Experiences, Registry, Web, or Poker surfaces.
4. The Office district is the orchestration layer over those surfaces.
5. Team switching remains the same shared control as the current House Console.

## 7.8 Metrics and gates

Option 3 is complete only when:

1. `shellContinuityRate = 100%`
2. `newIdentityPrimitives = 0`
3. `newRouteFamilies = 0`
4. `newDurableTables <= 3`
5. `derivedStateDuplication = 0`
   Meaning: Office truth is derived from existing records except the explicit additive office or staff assignment scaffolding.
6. `briefingCitationCoverage = 100%`
7. `deepLinkSuccessRate = 100%`
   Meaning: every office, staff, and attention item opens a real source view in deterministic tests.
8. `privacyRegressionFindings = 0`
9. `fullSuiteGreen = true`

## 7.9 Recommended TDD block

Reserve:

1. `e2e/199_house_office_district_shell.spec.js`
2. `e2e/200_house_office_staff_assignment_contract.spec.js`
3. `e2e/201_house_office_presence_privacy.spec.js`
4. `e2e/202_house_office_unified_smoke.spec.js`

# 8. Recommendation

Option 2 and Option 3 must not be treated as competing forks.

The correct plan is:

1. implement Option 2 first,
2. validate it with deterministic tests and real usage,
3. then grow it into Option 3 by adding only the minimal durable office and staff scaffolding that Option 2 cannot express cleanly.

This gives Agent Town the useful parts of Star Office without importing its identity model, persistence model, or product sprawl.

# 9. Execution Order

## 9.1 Slice A - Option 2

Required work:

1. add House Office entry point in the current House shell,
2. add `GET /api/platform/house-office`,
3. implement composed House Briefing,
4. implement Presence Board,
5. implement Attention Queue and deep links,
6. add tests `195` through `198`,
7. update [specs/02_api_contract.md](./02_api_contract.md).

## 9.2 Slice B - Option 3

Required work:

1. extend office and staff semantics beyond fixture-only scaffolding,
2. add native House Office district layout on top of the same House shell,
3. add minimal assignment contract only if still needed after Option 2,
4. add tests `199` through `202`,
5. update [specs/02_api_contract.md](./02_api_contract.md),
6. keep the Option 2 overview contract green.

# 10. Immediate Non-Goals

The following are explicitly out of scope for this program:

1. copying Star Office visuals or pixel art,
2. importing Phaser, Electron, or Tauri into the main web product,
3. join keys, guest approval flows, or one-time office invites,
4. public office microsites,
5. AI room decoration,
6. desktop pet support,
7. replacing current House surfaces with a single monolithic office page,
8. new external identity or wallet providers,
9. manual push state as the source of truth.

# 11. Definition of Done

This extension is complete only when:

1. Option 2 is real, useful, and green,
2. Option 3 grows from Option 2 without architectural drift,
3. the Office surface clearly improves House comprehension,
4. House, trainer, archive, workshop, tracks, Registry, Web, and Poker remain one coherent platform,
5. no borrowed Star Office idea survives unless it demonstrably fits Agent Town better after translation into current platform semantics.
