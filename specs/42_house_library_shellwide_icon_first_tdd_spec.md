# Phase 42 Spec: House Library Shell-Wide Icon-First Simplification (TDD)

Status: Draft
Version: 1.0
Audience: frontend engineers, UX designers, accessibility engineers, backend engineers, QA automation engineers, AI coding agents, and product designers
Depends on:
1. [specs/38_house_library_icon_first_ui_tdd_spec.md](./38_house_library_icon_first_ui_tdd_spec.md)
2. [specs/39_house_library_safety_moderation_tdd_spec.md](./39_house_library_safety_moderation_tdd_spec.md)
3. [specs/40_house_library_trust_aware_discovery_tdd_spec.md](./40_house_library_trust_aware_discovery_tdd_spec.md)
4. [specs/41_house_library_route_sync_tdd_spec.md](./41_house_library_route_sync_tdd_spec.md)
5. [specs/02_api_contract.md](./02_api_contract.md)
6. [AGENTS.md](../AGENTS.md)

Goal: extend the icon-first, low-text House Library language from `Public Stacks` to the rest of the Library shell so users can follow routes, inspect safety queues, receive relays, manage Satchels, and browse their own Library with the same visual grammar and without facing text-heavy forms by default.

Implementation constraints:

1. Preserve existing data models, routes, and state transitions from Phases 39 to 41.
2. Reuse the current House shell inside `/app`; no full-page navigation and no second Library experience.
3. Keep manual workflows available through progressive disclosure rather than removing them.
4. Preserve deterministic Playwright coverage and stable test ids.
5. Keep accessibility intact: icon-first controls still need stable accessible names.
6. Do not move agent decision logic to the backend.

## 1. Executive Summary

Phase 38 simplified the `Public Stacks` storefront and preview, but the overall Library shell still exposes too much default text and too many simultaneous controls:

1. `Route Desk` still starts with a visible follow form.
2. `Safety Desk`, `Relay Desk`, and `Satchel Desk` still render as long text rows.
3. `Direct Registry ID` and `Direct Publish` remain permanently visible even though they are advanced/manual paths.
4. The local Library list and detail views still read like administrative text instead of visual cards.
5. Revision history and detail metadata are always presented as text blocks instead of opt-in drawers.

Phase 42 finishes the simplification pass.

The new default shell should feel like one consistent pixel-RPG workstation:

1. each desk renders as compact visual cards,
2. each manual form starts collapsed,
3. each detail surface uses drawers instead of long always-open text,
4. each desk uses the same token and status language,
5. the user can act without learning backend terms.

## 2. User Simplifications

This phase is successful only if the user experience becomes simpler in concrete terms:

1. A user can tell whether something is a route, relay, Satchel, safety item, or local note from one icon cluster.
2. A user does not see raw ids and approval fields until choosing a manual action.
3. A user can browse received or saved artifacts as cards instead of reading sentence-long rows.
4. A user can inspect Library detail and revisions only when needed, not by default.
5. A user experiences the same interaction pattern across all desks:
   pick card -> preview/open -> use one primary action -> expand details only if needed.

## 3. Shell-Wide Design Contract

### 3.1 Shared desk card grammar

Every non-storefront desk should use the same compact card structure:

1. one family icon,
2. one short title,
3. one small status cluster,
4. one short meta line,
5. one clear open or import action.

This applies to:

1. Route subscriptions,
2. Route feed entries,
3. Safety Desk entries,
4. incoming relay entries,
5. incoming Satchel entries,
6. local Library items,
7. saved Reading Tables and Satchels where practical.

### 3.2 Shared manual drawer rule

Inputs for advanced/manual actions must be hidden by default inside drawers:

1. Route follow source input,
2. Route sync helper copy if needed,
3. manual Registry import,
4. manual direct publish,
5. publish Satchel approval,
6. relay target and relay approval.

### 3.3 Shared detail drawer rule

Text-heavy detail areas must become opt-in drawers:

1. local Library detail,
2. revision history,
3. incoming relay provenance preview,
4. incoming Satchel provenance preview,
5. route feed or safety-item expanded summaries where needed.

## 4. Phase 42 Roadmap

### Wave A - Harness

1. `M42.0` reserve shell-wide icon-first DOM anchors for drawers, desk cards, and local Library detail cards

### Wave B - Manual drawer collapse

1. `M42.1` collapse Route follow, Satchel publish, manual Registry import, and direct publish into drawers

### Wave C - Desk card conversion

1. `M42.2` convert Route Desk, Safety Desk, Relay Desk, and Satchel Desk rows into visual cards with stable icon/status tokens

### Wave D - Local Library card conversion

1. `M42.3` convert the local Library list into cards and shrink always-visible detail text into a compact summary

### Wave E - Detail and revision drawers

1. `M42.4` move Library detail, revision history, and received-artifact provenance text into drawers while keeping primary actions visible

### Wave F - Joined shell-wide proof

1. `M42.5` prove the same-shell flow across route sync, received artifacts, safety queue, and local Library detail without exposing advanced forms by default

## 5. Reserved Playwright Block

1. `408` to `413`

Reserved tests:

1. `e2e/408_house_library_shellwide_icon_harness.spec.js`
2. `e2e/409_house_library_shellwide_manual_drawers.spec.js`
3. `e2e/410_house_library_shellwide_desk_cards.spec.js`
4. `e2e/411_house_library_shellwide_local_cards.spec.js`
5. `e2e/412_house_library_shellwide_detail_drawers.spec.js`
6. `e2e/413_house_library_shellwide_full_smoke.spec.js`

## 6. Current Verified Baseline

The current repo already ships:

1. icon-first `Public Stacks`,
2. deterministic trust and safety states,
3. `Route Desk` with route follow and sync,
4. `Relay Desk` and `Satchel Desk` imports,
5. local Library authoring and revision history,
6. same-shell continuity through all House Library surfaces.

The remaining gap is presentation density and visual consistency, not missing capability.

## 7. Global Measurable Metrics

### 7.1 Default-shell reduction metrics

1. Route follow controls are not visible until a dedicated drawer is opened.
2. Manual Registry import and direct publish controls are not visible until a dedicated drawer is opened.
3. The default shell does not show raw approval inputs for Satchel publish or relay send.
4. Revision history is hidden by default.
5. Local Library detail metadata is hidden by default.

### 7.2 Desk-card metrics

1. Each Route Desk, Safety Desk, Relay Desk, and Satchel Desk entry renders as a card or card-like article, not a long sentence button.
2. Each desk card exposes a stable test id and an accessible name.
3. Existing result counts remain unchanged after the visual conversion.
4. Same-shell actions still work from the converted cards.

### 7.3 Local Library metrics

1. Each local Library item renders as a card with a family icon or status token cluster.
2. The local Library card exposes one clear open/select action.
3. Import state and read-only state remain visible without opening the detail drawer.
4. Existing item selection, shelf placement, and Reading Table actions remain deterministic.

### 7.4 Progressive disclosure metrics

1. Revision hashes are absent from the default Library view.
2. Incoming relay and incoming Satchel provenance summaries are absent from the default list view.
3. Direct publish approval ids are absent from the default list/detail view.
4. Drawer expansion does not navigate away from `/app`.

## 8. Milestones

### M42.0 Harness

Outcome:

1. stable shell-wide icon-first anchors exist for manual drawers, desk cards, local Library cards, and detail drawers,
2. seeded Library fixtures continue to render,
3. no legacy API contract changes are required.

Primary test:

1. `e2e/408_house_library_shellwide_icon_harness.spec.js`

Success criteria:

1. the House Library shell exposes deterministic test ids for shell-wide icon-first anchors,
2. the unified Library fixture family still loads inside `/app`,
3. no new backend table is introduced for a presentation-only phase.

### M42.1 Manual drawers

Outcome:

1. manual controls collapse behind drawers by default.

Primary test:

1. `e2e/409_house_library_shellwide_manual_drawers.spec.js`

Success criteria:

1. the default House Library view hides Route follow inputs,
2. the default House Library view hides manual Registry import and direct publish inputs,
3. opening a drawer reveals the same existing controls and actions,
4. existing actions still invoke the same routes.

### M42.2 Desk cards

Outcome:

1. Route Desk, Safety Desk, Relay Desk, and Satchel Desk render as visual cards.

Primary test:

1. `e2e/410_house_library_shellwide_desk_cards.spec.js`

Success criteria:

1. route subscription cards render with stable card ids,
2. route feed cards render with stable card ids,
3. safety, relay, and Satchel entries render with stable card ids,
4. selecting a desk card still drives the existing preview/import flow.

### M42.3 Local Library cards

Outcome:

1. the local Library list converts from plain button rows to cards.

Primary test:

1. `e2e/411_house_library_shellwide_local_cards.spec.js`

Success criteria:

1. local Library items render with stable card ids,
2. imported and read-only posture remains visible on collapsed cards,
3. selecting a Library card still updates the active item deterministically,
4. existing list filtering and shelf filtering still work.

### M42.4 Detail drawers

Outcome:

1. local detail, revisions, and received previews move behind drawers while primary actions stay visible.

Primary test:

1. `e2e/412_house_library_shellwide_detail_drawers.spec.js`

Success criteria:

1. Library detail is collapsed by default,
2. revision history is collapsed by default,
3. incoming relay preview details are collapsed by default,
4. incoming Satchel preview details are collapsed by default,
5. opening each drawer reveals the same deterministic content as before.

### M42.5 Full same-shell proof

Outcome:

1. the shell-wide simplified flow is proven end to end.

Primary test:

1. `e2e/413_house_library_shellwide_full_smoke.spec.js`

Success criteria:

1. a user follows and syncs a route,
2. previews a synced Public Stack,
3. can still inspect a safety item,
4. can inspect a received relay or Satchel,
5. can select a local Library item,
6. can open drawers only when needed,
7. remains inside `/app` with worker continuity intact.

## 9. Phase Exit Criteria

Phase 42 is complete only when:

1. `e2e/408` through `e2e/413` pass,
2. existing Phases 38 through 41 regressions still pass,
3. the full Playwright suite passes,
4. the House Library shell visibly reduces default text and exposed manual fields without removing core capability.

## 10. Out of Scope

This phase does not include:

1. new backend persistence,
2. new trust semantics,
3. new route-sync semantics,
4. background route polling,
5. redesigning Workshop, Archive, or Trainer,
6. replacing the current Public Stack preview contract.
