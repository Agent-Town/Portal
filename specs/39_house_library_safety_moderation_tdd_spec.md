# Phase 39 Spec: House Library Safety And Moderation (TDD)

Status: Draft
Version: 1.0
Audience: frontend engineers, backend engineers, runtime engineers, trust and safety engineers, QA automation engineers, and AI agent implementers
Depends on:
1. [specs/35_house_library_public_stack_review_tiers_tdd_spec.md](./35_house_library_public_stack_review_tiers_tdd_spec.md)
2. [specs/36_house_library_public_stack_review_attestations_tdd_spec.md](./36_house_library_public_stack_review_attestations_tdd_spec.md)
3. [specs/37_house_library_public_stack_attestation_provenance_tdd_spec.md](./37_house_library_public_stack_attestation_provenance_tdd_spec.md)
4. [specs/38_house_library_icon_first_ui_tdd_spec.md](./38_house_library_icon_first_ui_tdd_spec.md)
5. [specs/02_api_contract.md](./02_api_contract.md)
6. [AGENTS.md](../AGENTS.md)

Goal: add a narrow same-shell safety layer to House Library so each House can hide or report a Public Stack locally, keep unsafe imports blocked, and review those decisions from a Safety Desk without changing the existing trust, attestation, provenance, or import data model.

Implementation constraints:

1. Reuse the current `Public Stacks`, `Exchange Counter`, and same-shell House Library surfaces inside `/app`.
2. Preserve the existing review, attestation, seal, verification, and import flows from Phases 35 to 38.
3. Keep moderation local-first. This phase is about one House deciding what to surface for itself, not about global bans.
4. Keep the default storefront deterministic and Playwright-testable.
5. Preserve the icon-first direction. Safety posture should be visible as compact tokens, not long warning paragraphs.
6. Do not add global admin panels, social flags, or remote appeals in this phase.

## 1. Executive Summary

Phase 38 made the Library easier to use, but it still assumes every Public Stack should remain equally visible once found.

That is not enough for a real user-facing Library.

A House needs lightweight local safety controls:

1. hide this here,
2. report this for later review,
3. keep it out of normal discovery until restored,
4. keep import blocked while it is hidden or reported,
5. review those decisions in one deterministic place.

Phase 39 adds exactly that and nothing more.

## 2. Product Language Contract

Main-shell copy should stay plain:

1. `Hide here` means remove this Public Stack from normal discovery in this House.
2. `Report here` means keep it in the local Safety Desk and block import until reviewed.
3. `Restore here` means return it to normal Library discovery for this House.
4. `Safety Desk` means the local queue of hidden or reported Public Stacks for this House.

Do not use first-line copy like `moderation action record`, `sanction`, or `policy event`.

## 3. Safety Model

### 3.1 New durable record family

Phase 39 introduces `library_public_stack_safety_records`.

One row represents one House-local safety decision for one Public Stack.

### 3.2 Allowed safety states

Allowed `safetyState` values for this phase:

1. `visible_here`
2. `hidden_here`
3. `reported_here`

`visible_here` is allowed so the House can restore explicitly and keep one durable local record.

### 3.3 Safety semantics

1. `hidden_here` removes the Public Stack from default storefront discovery for this House.
2. `reported_here` also removes the Public Stack from default storefront discovery for this House.
3. `hidden_here` blocks import for this House.
4. `reported_here` blocks import for this House.
5. `visible_here` restores normal discovery and import behavior.
6. Local safety state is stronger than foreign attestations and foreign seals.

## 4. UX Contract

### 4.1 Storefront

The default Public Stacks storefront must exclude `hidden_here` and `reported_here` items.

It must also support deterministic safety filtering so the user can intentionally surface:

1. hidden items,
2. reported items,
3. all items regardless of safety,
4. the default visible set.

### 4.2 Preview

Public Stack preview must project safety posture without replacing trust posture.

Preview should show:

1. a safety token in the hero cluster,
2. one short safety summary,
3. hidden or reported import blocking,
4. restore availability for hidden or reported items.

### 4.3 Safety Desk

The House Library shell must expose a local Safety Desk that lists hidden and reported Public Stacks for this House.

The Safety Desk must:

1. stay inside `/app`,
2. open stack preview without navigation,
3. allow restore,
4. keep deterministic ordering.

## 5. Roadmap Waves

### Wave A - Safety harness

1. `M39.0` add deterministic safety fixtures, inspectors, and empty ledger rows

### Wave B - Safety save contract

1. `M39.1` let a House save one local safety state for one Public Stack with idempotent replay

### Wave C - Storefront safety filters

1. `M39.2` exclude hidden and reported items from default discovery and expose deterministic safety filters

### Wave D - Preview import policy

1. `M39.3` surface safety posture in preview and block import while a stack is hidden or reported

### Wave E - Safety Desk

1. `M39.4` expose a same-shell Safety Desk with restore flow and stable worker continuity

### Wave F - Joined same-shell proof

1. `M39.5` prove search -> safety action -> desk -> restore -> import in one same-shell flow

## 6. Reserved Playwright Block

1. `266` to `271`

Reserved tests:

1. `e2e/266_house_library_safety_harness.spec.js`
2. `e2e/267_house_library_safety_save.spec.js`
3. `e2e/268_house_library_safety_storefront_filters.spec.js`
4. `e2e/269_house_library_safety_preview_policy.spec.js`
5. `e2e/270_house_library_safety_desk.spec.js`
6. `e2e/271_house_library_safety_full_smoke.spec.js`

## 7. Global Measurable Metrics

### 7.1 Harness metrics

1. After reset, stats counts include `library_public_stack_safety_records: 0`.
2. Export and import roundtrip preserve `library_public_stack_safety_records` exactly.
3. Test inspectors expose `publicStackSafetyRecords === true`.

### 7.2 Save metrics

1. First successful safety save increments `library_public_stack_safety_records` by exactly `1`.
2. Replaying the same idempotency key does not create a second row.
3. Saving a new safety state for the same House and Public Stack updates the existing row instead of creating a duplicate.

### 7.3 Storefront metrics

1. Default search omits `hidden_here` and `reported_here` rows for the active House.
2. A safety filter can intentionally surface hidden rows.
3. A safety filter can intentionally surface reported rows.
4. Result ordering remains deterministic and lexical inside each filtered set.

### 7.4 Preview metrics

1. Hidden or reported preview shows one deterministic safety summary.
2. Hidden or reported preview disables guided import.
3. Restored preview reenables guided import without losing local review or seal posture.

### 7.5 Safety Desk metrics

1. Safety Desk lists hidden and reported Public Stacks for the active House.
2. Opening a Safety Desk row stays inside `/app`.
3. Restoring from Safety Desk moves the stack back into default storefront discovery.

### 7.6 Continuity metrics

1. Worker session id stays stable through the full same-shell flow.
2. No full-page navigation is introduced.
3. Existing review, attestation, and seal behavior remains intact when no safety state is set.

## 8. Phase Exit Criteria

Phase 39 is complete when:

1. the reserved `266` to `271` block is green,
2. safety rows are durable and exportable,
3. default storefront hides unsafe items locally,
4. preview blocks unsafe import locally,
5. Safety Desk restore works in-shell.

## 9. Post-Phase Follow-ups

These are explicitly out of scope for Phase 39:

1. global moderation across all Houses,
2. appeal workflows,
3. abuse classifier automation,
4. remote takedown requests,
5. public moderation history visible to other Houses.
