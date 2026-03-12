# Phase 38 Spec: House Library Icon-First Universal UX (TDD)

Status: Draft
Version: 1.0
Audience: frontend engineers, UX designers, accessibility engineers, backend engineers, runtime engineers, QA automation engineers, AI agent implementers, AI coding agents, and product designers
Depends on:
1. [specs/30_house_library_authoring_exchange_tdd_spec.md](./30_house_library_authoring_exchange_tdd_spec.md)
2. [specs/33_house_library_public_stack_tdd_spec.md](./33_house_library_public_stack_tdd_spec.md)
3. [specs/34_house_library_public_stack_trust_tdd_spec.md](./34_house_library_public_stack_trust_tdd_spec.md)
4. [specs/35_house_library_public_stack_review_tiers_tdd_spec.md](./35_house_library_public_stack_review_tiers_tdd_spec.md)
5. [specs/36_house_library_public_stack_review_attestations_tdd_spec.md](./36_house_library_public_stack_review_attestations_tdd_spec.md)
6. [specs/37_house_library_public_stack_attestation_provenance_tdd_spec.md](./37_house_library_public_stack_attestation_provenance_tdd_spec.md)
7. [specs/02_api_contract.md](./02_api_contract.md)
8. [AGENTS.md](../AGENTS.md)

Goal: simplify House Library into an icon-first, low-text, same-shell experience so users can discover, trust, and import knowledge with almost no reading, while preserving the current Public Stack, review, attestation, provenance, and import semantics.

Implementation constraints:

1. Reuse the existing `Public Stacks`, `Exchange Counter`, and preview surfaces inside `/app`.
2. Preserve the current data model and trust model from Phases 33 to 37. This phase is primarily a UI contract and view-model simplification layer.
3. Keep the default path deterministic and Playwright-testable.
4. Prefer visual state, icon clusters, and direct action buttons over forms, selects, and long explanatory text.
5. Keep all technical detail available through progressive disclosure, not as default chrome.
6. Preserve accessibility. Icon-first does not mean inaccessible. Every icon-only control still requires a stable accessible name.
7. Preserve the worker-first and modal-first guardrails in `AGENTS.md`.

## 1. Executive Summary

The current House Library works, but it still asks the user to read too much:

1. labeled inputs,
2. select menus,
3. explicit review forms,
4. approval and relay fields shown too early,
5. preview copy that explains more than it guides.

That creates unnecessary friction for new users, multilingual users, mobile users, and users who simply want to act instead of study the interface.

Phase 38 changes the default interaction model:

1. discovery becomes a visual storefront,
2. trust becomes a small fixed icon language,
3. the preview becomes a short action dock,
4. advanced fields move behind drawers,
5. all users everywhere see the same basic sequence:
   look -> check -> trust -> import

The core simplification promise is:

1. fewer words,
2. fewer simultaneous choices,
3. fewer visible forms,
4. more direct action,
5. no surprise navigation.

## 2. User Simplifications

This phase is successful only if the product becomes easier in user terms, not just visually cleaner.

The intended simplifications are:

1. A user no longer needs to understand `registry`, `attestation`, `verification`, or `signature` to take the safe next step.
2. A user can identify trust posture from an icon cluster before reading any supporting text.
3. A user can save a local trust choice in one tap instead of filling a review form.
4. A user sees one primary next action in preview instead of many equal-weight buttons.
5. A user only sees technical fields such as approval ids, relay targets, and raw identifiers when the chosen action actually needs them.
6. A mobile user gets the same flow as a desktop user with the same meaning and order.

## 3. Universal UI Language

### 3.1 Fixed trust icon system

The House Library must use one stable trust icon system everywhere:

1. `trusted here` -> shield icon
2. `review later` -> hourglass icon
3. `blocked here` -> barred lock icon
4. `verified seal` -> stamped shield icon
5. `unchecked seal` -> plain seal icon
6. `seal mismatch` -> cracked seal icon

The icon system must be:

1. visible in search results,
2. visible in preview,
3. visible in imported-item provenance summaries,
4. paired with accessible labels,
5. stable across desktop and mobile.

### 3.2 Fixed content family icons

The House Library must also use one stable content icon system:

1. Satchel -> bag icon
2. Skill -> star or spark icon
3. Developer workflow -> gear or tool icon
4. Registry artifact -> scroll icon
5. Public Stack bundle -> stack or crate icon

### 3.3 Action icon grammar

The main user actions should map to a small repeated set:

1. Preview -> eye icon
2. Trust locally -> shield, hourglass, or barred lock buttons
3. Publish attestation -> stamp icon
4. Seal attestation -> seal icon
5. Check seal -> magnifier or check-seal icon
6. Import -> chest or arrow-in icon
7. More details -> drawer or chevron icon

## 4. Design Principles

### 4.1 Collapsed by default

All complex controls must start collapsed.

The default Library shell should not immediately expose:

1. approval id inputs,
2. relay target inputs,
3. note fields,
4. raw ids,
5. advanced provenance text.

### 4.2 One obvious next step

Each selected Public Stack preview should expose one clear primary next step based on state:

1. if unreviewed -> choose local trust,
2. if reviewed but unverified -> check seal or verify,
3. if verified and allowed -> import,
4. if source-owned and review exists -> publish attestation,
5. if attested but unsealed -> seal attestation.

### 4.3 Progressive disclosure

Everything technical must still exist, but behind secondary drawers:

1. proof details,
2. approval inputs,
3. review notes,
4. relay controls,
5. raw ids and timestamps.

### 4.4 Language-light, not context-free

The UI should use very short labels, but not become cryptic.
Every icon needs:

1. an accessible name,
2. a tooltip or hover label,
3. a stable short fallback label where needed.

## 5. Roadmap Waves

### Wave A - Icon-first harness

1. `M38.0` reserve the deterministic DOM contract for icon-first House Library flows

### Wave B - Storefront simplification

1. `M38.1` replace text-heavy Public Stacks controls with a compact search bar and icon-chip filters

### Wave C - Card and preview simplification

1. `M38.2` convert Public Stack rows and preview into card-first visual summaries with a short action dock

### Wave D - One-tap trust and action flow

1. `M38.3` convert local review, attestation, seal, check, and import into state-aware visual actions with hidden advanced fields

### Wave E - Progressive disclosure and mobile

1. `M38.4` move technical fields and advanced metadata into drawers and preserve the same flow on narrow screens

### Wave F - Joined universal-flow proof

1. `M38.5` prove the full icon-first discovery to trust to import loop in the same shell

## 6. Reserved Playwright Block

1. `260` to `265`

Reserved tests:

1. `e2e/260_house_library_icon_first_harness.spec.js`
2. `e2e/261_house_library_icon_first_storefront.spec.js`
3. `e2e/262_house_library_icon_first_preview.spec.js`
4. `e2e/263_house_library_icon_first_action_flow.spec.js`
5. `e2e/264_house_library_icon_first_mobile_drawers.spec.js`
6. `e2e/265_house_library_icon_first_full_smoke.spec.js`

## 7. Current Verified Baseline

Phase 38 starts from the current House Library shell already present in this repo:

1. Public Stacks search exists,
2. preview exists,
3. local review exists,
4. attestation exists,
5. verification exists,
6. import exists,
7. same-shell continuity exists.

The gap is presentation and interaction density, not missing core capability.

This phase therefore must:

1. preserve existing routes and state transitions where practical,
2. simplify the default DOM shape and interaction order,
3. keep deterministic acceptance coverage focused on behavior, not incidental layout trivia.

## 8. Global Measurable Metrics

### 8.1 Default-shell reduction metrics

1. The default `Public Stacks` control strip exposes at most:
   one search field, one chip rail, and one search button.
2. Family and trust filtering are no longer presented as default select menus.
3. Approval, relay, and note inputs are hidden by default.
4. The selected preview default state exposes at most:
   one title area, one icon cluster, up to three primary actions, and one details toggle.

### 8.2 Card simplification metrics

1. Each collapsed search result card exposes:
   one content icon, one trust/seal icon cluster, one title, and one primary preview action.
2. The seeded result count remains unchanged after the UI simplification.
3. Search results remain deterministic and selectable through stable test ids.

### 8.3 Action simplification metrics

1. Local review is selectable with three direct buttons instead of a dropdown.
2. Saving the local review does not require a visible note field by default.
3. The primary action dock shows the next recommended action based on current state.
4. Import remains blocked when local review is `blocked_here`, even in the simplified UI.

### 8.4 Progressive disclosure metrics

1. Technical fields appear only after opening one explicit details drawer or action drawer.
2. Raw ids and approval fields are absent from the default preview state.
3. Provenance detail stays available without taking the user to another page.

### 8.5 Accessibility and universality metrics

1. Every icon-only control exposes an accessible name.
2. All primary actions remain keyboard reachable.
3. Narrow-screen layout at `390px` width keeps the primary action dock visible without horizontal scrolling.
4. Trust and seal states remain understandable through icon plus short label, not color alone.

## 9. Milestones

### M38.0 Harness

Outcome:

1. stable icon-first DOM anchors exist for search chips, result cards, preview action dock, and details drawers,
2. the House Library shell exposes deterministic test ids for the simplified flow,
3. no new backend tables are required for this phase.

Primary test:

1. `e2e/260_house_library_icon_first_harness.spec.js`

Measurable success criteria:

1. icon-first shell exposes stable test ids for chip rail, result cards, preview hero, action dock, and details drawer,
2. legacy functionality remains reachable through the new shell,
3. route path remains `/app`,
4. worker session continuity is unchanged.

### M38.1 Storefront simplification

Outcome:

1. `Public Stacks` becomes a compact storefront,
2. family and trust state are represented through icon chips,
3. result cards become visually scannable before reading.

Primary test:

1. `e2e/261_house_library_icon_first_storefront.spec.js`

Measurable success criteria:

1. default search controls no longer render family and trust `select` controls in the visible storefront,
2. chip rail exposes deterministic chip states for:
   all, trusted, later, blocked, sealed,
3. each seeded result card exposes one family icon and one trust/seal icon cluster,
4. seeded search result count remains unchanged,
5. selecting a chip updates visible results or visual filter state deterministically.

### M38.2 Preview simplification

Outcome:

1. preview becomes a short visual summary,
2. existing trust, attestation, and provenance data remain visible through icons and short labels,
3. primary actions are concentrated into one dock.

Primary test:

1. `e2e/262_house_library_icon_first_preview.spec.js`

Measurable success criteria:

1. selected preview shows one title, one family icon, one trust/seal icon cluster, and one short status line,
2. preview action dock exposes no more than three primary action buttons at one time,
3. attestation and provenance state remain visible without opening technical details,
4. raw ids and approval inputs are not visible in the default preview state.

### M38.3 One-tap action flow

Outcome:

1. local review becomes a three-button action strip,
2. attestation, seal, check, and import become state-aware actions,
3. advanced inputs open only when required.

Primary test:

1. `e2e/263_house_library_icon_first_action_flow.spec.js`

Measurable success criteria:

1. review strip exposes direct `trusted here`, `review later`, and `blocked here` buttons,
2. choosing a review tier can persist the tier without first opening a note field,
3. the preview shows the next recommended action based on seeded state,
4. opening an approval-required action reveals the approval input only then,
5. blocked-here state still prevents import.

### M38.4 Drawers and mobile

Outcome:

1. advanced data moves into drawers,
2. narrow-screen layout preserves the same action order,
3. icon-first semantics survive on mobile.

Primary test:

1. `e2e/264_house_library_icon_first_mobile_drawers.spec.js`

Measurable success criteria:

1. at `390px` viewport width, the storefront and preview stack vertically with no horizontal scroll,
2. primary action dock remains visible in the viewport,
3. details drawer reveals approval ids, notes, provenance detail, or relay controls only after explicit open,
4. closing the drawer returns to the minimal preview state.

### M38.5 Full smoke

Outcome:

1. a user searches visually,
2. previews one Public Stack,
3. makes a one-tap trust choice,
4. checks or verifies the item when needed,
5. imports it from the same shell,
6. never needs to parse technical provenance jargon in the default path.

Primary test:

1. `e2e/265_house_library_icon_first_full_smoke.spec.js`

Measurable success criteria:

1. page path stays `/app`,
2. worker session id stays stable within the page session,
3. the full flow completes using the icon-first controls rather than legacy form-first controls,
4. no hidden policy regression allows blocked import,
5. final imported state matches the existing platform semantics.

## 10. UI Contract for AI Agentic Developers

AI agentic developers should treat this phase as a view-contract phase, not an excuse to rewrite product semantics.

Required implementation approach:

1. reuse current APIs and preview payloads first,
2. add derived view-model helpers for icon state and next-action state,
3. hide complexity through disclosure instead of deleting capability,
4. preserve or improve existing testability with stable test ids.

Recommended component slices:

1. chip rail for storefront filters,
2. result card component,
3. preview hero component,
4. action dock component,
5. details drawer component.

## 11. Evaluation Notes

This phase is successful only if simplicity is measurable.

Recommended evaluation questions:

1. Can a first-time user complete search to trust to import without understanding the words `attestation` or `verification`?
2. Can a mobile user perform the same flow without opening a second page?
3. Are technical inputs hidden until needed?
4. Is every trust state visually distinct and screen-reader accessible?
5. Did the simplification preserve existing trust and import safeguards?

## 12. Phase Exit Criteria

Phase 38 is complete only when all of the following are true:

1. `e2e/260` through `e2e/265` are green,
2. existing Public Stack, trust, attestation, provenance, and import coverage still passes,
3. full repo `npm test` passes,
4. House Library remains same-shell and modal-safe,
5. the default UI is visibly less text-heavy and less form-heavy than the current baseline,
6. accessibility coverage for icon-only controls is present in the new tests.

## 13. Guardrails for AI Agentic Developers

1. Do not remove critical trust information just to reduce visible text.
2. Do not hide destructive or policy-significant actions behind ambiguous icons.
3. Do not break keyboard accessibility.
4. Do not add a second full-page Public Stacks experience.
5. Do not regress existing trust and import semantics in order to simplify the layout.
6. Do not turn icon-first into color-only state encoding.

## 14. Post-Phase Follow-ups

These are explicitly out of scope for Phase 38:

1. visual redesign of the entire town shell outside House Library,
2. avatar or character animation changes,
3. multilingual content translation of imported artifacts,
4. replacing the debug tabs with icon-first UI,
5. changing the underlying Public Stack trust data model.
