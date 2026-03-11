# Phase 30 Spec: Detailed AI-Agent Runbook for House Office Extension

Status: Implemented
Version: 1.1
Depends on:
1. [specs/28_house_office_star_office_inspired_extension_spec.md](./28_house_office_star_office_inspired_extension_spec.md)
2. [specs/29_house_office_extension_tdd_spec.md](./29_house_office_extension_tdd_spec.md)
3. [specs/02_api_contract.md](./02_api_contract.md)
4. [AGENTS.md](../AGENTS.md)

Purpose: convert the Phase 29 milestones into AI-agent-sized TDD work packets with explicit measurable verification.

This is not a competing plan.
It is the detailed execution layer for [specs/29_house_office_extension_tdd_spec.md](./29_house_office_extension_tdd_spec.md).

Execution status on `codex/house-office-options-v0-1` at `5244403`:

1. `T29.0` through `T29.7` are implemented,
2. all reserved House Office tests `195` through `202` are green,
3. the runbook is now historical execution guidance plus maintenance reference for future changes to the House Office surface.

## 1. How AI Agents Must Use This Runbook

1. Do not start this phase until the current House, tracks, and House-structure baseline is green.
2. Only take the next unlocked test in sequence.
3. Keep each implementation pass small:
   - at most one composed platform read,
   - at most one House UI surface,
   - at most one privacy or continuity concern,
   - plus the required docs and tests.
4. If a step would touch more than `7` production files or more than `3` durable domains, split the work before coding.
5. A step is only complete when:
   - the named Playwright test is green,
   - the measurable metrics below are visible,
   - required docs are updated in the same change,
   - previously green reserved tests remain green.
6. Do not widen scope into public shared-office or microsite pages, desktop-companion work, or desktop-pet work during this phase.

## 2. Global Verification Rules

### 2.1 Shell continuity

For this phase, `shell continuity` is complete only when:

1. the root page remains the hub shell,
2. House Office navigation does not force full-page navigation,
3. worker session identity remains stable across Office deep links where the journey stays inside the shell.

### 2.2 Citation discipline

For this phase, `citation-backed` means:

1. every briefing item has at least one citation,
2. each citation exposes stable `sourceKind`, `sourceId`, and `entryPath`,
3. the visible briefing item can be traced back to a real seeded source.

### 2.3 Mobile discipline

For this phase, `mobile-safe` means:

1. the Office overview renders at `390px` width without horizontal overflow,
2. the district shell renders at `390px` width without horizontal overflow,
3. Office map or district grouping remains readable at mobile width.

### 2.4 Derived-state discipline

For this phase, `derived` means:

1. Option 2 presence, briefing, and attention are composed from existing platform reads and durable source records,
2. there is no second cache of archive, trainer, or track truth,
3. Option 3 adds explicit office or staff scaffolding only where the Phase 29 spec allows it.

### 2.5 Privacy discipline

For this phase, `safe` means:

1. no raw prompts,
2. no callback URLs,
3. no credentials or tokens,
4. no sealed trace payload details,
5. coarse summaries remain deterministic and usable.

## 3. Test Sequence

### T29.0 - `e2e/195_house_office_overview_contract.spec.js`

- Goal: add the first real House Office surface and its composed read contract.
- Scope cap: one composed platform read plus one House Office panel.
- Dependencies: current House Console and `GET /api/platform/house-structure` are already green.
- Small-step order:
  1. add `GET /api/platform/house-office`,
  2. compose the overview from current platform read routes,
  3. add one House Office entry point in the House shell,
  4. render deterministic empty and seeded states,
  5. add a lightweight Office Map or equivalent DOM spatial grouping,
  6. expose `sourceManifest`.
- Measurable metrics:
  1. `GET /api/platform/house-office` returns `200`,
  2. payload contains all required top-level keys from Phase 29,
  3. `sourceManifest` is non-empty and lists at least `house-structure`, `trainer`, `tracks`, and one other read source when seeded,
  4. no new durable tables are introduced,
  5. `house-open-office`, `house-office-panel`, and `house-office-map` render in the House shell,
  6. the Office overview renders at `390px` width with no horizontal overflow.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/29_house_office_extension_tdd_spec.md](./29_house_office_extension_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/195_house_office_overview_contract.spec.js`

### T29.1 - `e2e/196_house_office_presence_board.spec.js`

- Goal: make House Office presence derived, ordered, and actionable.
- Scope cap: presence composition plus Presence Board rendering only.
- Dependencies: `T29.0`
- Small-step order:
  1. define the allowed presence vocabulary,
  2. derive presence from seeded platform activity using the Phase 29 precedence order,
  3. expose `deepLink` and `sourceRefs`,
  4. render the Presence Board in deterministic order.
- Measurable metrics:
  1. every presence item uses an allowed safe status,
  2. presence precedence is deterministic for the same fixture seed,
  3. every presence item has `deepLink` and at least one `sourceRef`,
  4. ordering is stable across repeated resets,
  5. UI renders the same item count and order as the API payload.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/29_house_office_extension_tdd_spec.md](./29_house_office_extension_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/196_house_office_presence_board.spec.js`

### T29.2 - `e2e/197_house_office_briefing_citations.spec.js`

- Goal: make the borrowed "yesterday memo" idea into a House Briefing with citations.
- Scope cap: briefing composition and briefing rendering only.
- Dependencies: `T29.0`
- Small-step order:
  1. define the briefing window and ordering rules,
  2. compose briefing items from seeded durable records,
  3. group briefing items by source family,
  4. attach citation arrays to every briefing item,
  5. render briefing items and citation links.
- Measurable metrics:
  1. `citationCoverage = 100%`,
  2. items older than the seeded `24h` window are excluded,
  3. briefing items are grouped by stable source family order,
  4. ordering inside each group is newest-first and deterministic,
  5. citations expose stable `sourceKind`, `sourceId`, and `entryPath`,
  6. briefing items do not expose raw prompt, callback, token, or sealed fields.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/29_house_office_extension_tdd_spec.md](./29_house_office_extension_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/197_house_office_briefing_citations.spec.js`

### T29.3 - `e2e/198_house_office_attention_deeplinks.spec.js`

- Goal: make House Office attention items open the real source surfaces without breaking continuity.
- Scope cap: attention derivation plus one deep-link behavior path.
- Dependencies: `T29.0`, `T29.1`
- Small-step order:
  1. derive attention items from seeded trainer, workshop, track, or related records,
  2. attach stable severity and deep links,
  3. render the Attention Queue,
  4. verify opening at least one attention target preserves shell continuity and team context.
- Measurable metrics:
  1. severity ordering is `critical`, then `warn`, then `info`,
  2. every attention item exposes `sourceKind`, `sourceId`, and `deepLink`,
  3. clicking an item opens a real source surface in the shell,
  4. worker session identity remains unchanged before and after at least one attention deep link,
  5. active team context remains unchanged.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/29_house_office_extension_tdd_spec.md](./29_house_office_extension_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/198_house_office_attention_deeplinks.spec.js`

### T29.4 - `e2e/199_house_office_district_shell.spec.js`

- Goal: evolve the overview into the native House Office district without leaving the current shell.
- Scope cap: district layout and district section routing only.
- Dependencies: `T29.3`
- Small-step order:
  1. add district shell structure,
  2. map the district sections to existing House surfaces,
  3. keep the shared team selector behavior intact,
  4. preserve the spatial district grouping at desktop and mobile widths,
  5. prove continuity across district section changes.
- Measurable metrics:
  1. all required district sections render:
     - `Front Desk`
     - `Workshop Wing`
     - `Analysis Wing`
     - `Archive Wing`
     - `Operations Wing`
     - `Tracks Board`
  2. the root page remains the House shell,
  3. team switching behavior matches the pre-existing House behavior,
  4. worker session identity remains stable across district section navigation,
  5. the district renders at `390px` width with no horizontal overflow,
  6. no canvas or game-loop dependency is introduced for the House Office district.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/29_house_office_extension_tdd_spec.md](./29_house_office_extension_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/199_house_office_district_shell.spec.js`

### T29.5 - `e2e/200_house_office_staff_assignment_contract.spec.js`

- Goal: add only the minimum office or staff assignment contract needed for the district to stay meaningful.
- Scope cap: office or staff scaffolding plus assignment contract only.
- Dependencies: `T29.4`
- Small-step order:
  1. define office and staff semantics beyond fixture-only stubs,
  2. add minimal assignment serialization,
  3. add an idempotent assignment write only if the district needs it,
  4. preserve existing House team flows.
- Measurable metrics:
  1. office, staff, and assignment objects serialize deterministically,
  2. if assignment writes exist, repeated identical requests return the same assignment identity,
  3. invalid requests fail with stable error codes,
  4. no more than `3` additive durable tables are introduced,
  5. current House team selection and existing House routes remain green.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/29_house_office_extension_tdd_spec.md](./29_house_office_extension_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/200_house_office_staff_assignment_contract.spec.js`

### T29.6 - `e2e/201_house_office_presence_privacy.spec.js`

- Goal: prove House Office remains safe when sensitive or sealed source data exists.
- Scope cap: privacy filtering and UI redaction only.
- Dependencies: `T29.2`, `T29.3`, `T29.5`
- Small-step order:
  1. seed private or sealed source material,
  2. filter or redact House Office presence, briefing, and attention projections,
  3. render safe summaries,
  4. verify deterministic redaction on repeated runs.
- Measurable metrics:
  1. forbidden fields are absent from API payloads and UI text,
  2. presence and briefing still render useful coarse summaries,
  3. repeated identical reads produce the same redacted payload shape,
  4. privacy filtering does not break allowed deep links,
  5. no sealed trace payload details appear in House Office.
- Required doc sync:
  1. [specs/02_api_contract.md](./02_api_contract.md)
  2. [specs/29_house_office_extension_tdd_spec.md](./29_house_office_extension_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/201_house_office_presence_privacy.spec.js`

### T29.7 - `e2e/202_house_office_unified_smoke.spec.js`

- Goal: prove the House Office extension is one coherent addition to the current platform rather than a side feature.
- Scope cap: smoke orchestration only.
- Dependencies: `T29.6`
- Small-step order:
  1. define one seeded House Office journey,
  2. traverse overview, briefing or presence, attention, one district section, and one linked source surface,
  3. record the checkpoint list,
  4. replay the same journey and compare checkpoints exactly.
- Measurable metrics:
  1. the journey remains inside the shell,
  2. team context stays stable throughout the journey,
  3. citations and deep links resolve to real source surfaces,
  4. the ordered checkpoint list matches exactly across two seeded replays,
  5. the House Office extension does not regress previously green House, trainer, archive, workshop, or tracks tests.
- Required doc sync:
  1. [specs/28_house_office_star_office_inspired_extension_spec.md](./28_house_office_star_office_inspired_extension_spec.md)
  2. [specs/29_house_office_extension_tdd_spec.md](./29_house_office_extension_tdd_spec.md)
- Verification:
  1. `npx playwright test e2e/202_house_office_unified_smoke.spec.js`

## 4. Recommended Verification Ladder

After each milestone:

1. run the named Playwright file,
2. run the immediately adjacent earlier House tests that could regress,
3. run `npm test` before merging a milestone that changes routing, privacy, or continuity behavior.

Minimum adjacent regression slices:

1. existing House shell tests around `188`, `189`, and `190`,
2. current House or team continuity tests,
3. current skill and worker continuity tests if any House navigation behavior changed.

## 5. Completion Rule

This runbook is complete only when:

1. tests `195` through `202` are green,
2. Phase 29 metrics are observable,
3. docs and API contract are updated in lockstep,
4. the House Office extension remains faithful to the platform and does not import Star Office architecture by accident,
5. mobile `390px` rendering, office-map presence, and grouped briefing citations are all explicitly verified,
6. public shared-office or microsite scope and desktop-companion or desktop-pet scope stay deferred.
