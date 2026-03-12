# Phase 40 - House Library Trust-Aware Discovery TDD Spec

Status: Draft for implementation

Owner intent: make Public Stacks easier to browse by trust posture instead of forcing the user to read long preview text before deciding what to open.

## 1. Goal

Phase 40 adds computed discovery lanes to the existing House Library Public Stacks shell.

The user should be able to answer four fast questions with one tap:

1. What is already usable here?
2. What still needs a check here?
3. What did other Houses already attest?
4. What is already in my Library?

The feature must stay same-shell, icon-first, and deterministic. It must not add a new durable ledger.

## 2. Product rules

### 2.1 Discovery lanes

Every published Public Stack visible to the current House must project exactly one computed discovery lane:

- `ready_here`
- `check_here`
- `attested_elsewhere`
- `imported_here`

Lane priority:

1. `imported_here`
2. `ready_here`
3. `attested_elsewhere`
4. `check_here`

### 2.2 Lane meaning

- `imported_here`: the full stack is already present in the current House as a local Satchel import.
- `ready_here`: the current House has already verified the stack or explicitly trusted it here.
- `attested_elsewhere`: another House published at least one attestation for the stack, but the current House has not yet imported it or marked it ready here.
- `check_here`: the stack is still unverified for this House and has no stronger local posture yet.

### 2.3 Discovery reason

Search cards and preview must expose one short discovery reason in plain language, for example:

- `Already in your Library.`
- `Verified here in this House.`
- `Trusted here in this House.`
- `Attested by other Houses.`
- `Needs a local check in this House.`

### 2.4 Filter behavior

Public Stack search must support a deterministic `discovery` filter in addition to the current query, family, trust, seal, and safety filters.

The response must also expose lane counts for the current query scope so the UI can show how many results sit in each lane before the user opens one.

### 2.5 UI behavior

The House Library shell must add discovery chips for:

- `ready_here`
- `check_here`
- `attested_elsewhere`
- `imported_here`

The existing same-shell flow must remain unchanged:

1. search
2. preview
3. verify / trust / import

Only the discovery surface changes.

## 3. Test block

Reserved Playwright files:

- `e2e/396_house_library_trust_discovery_harness.spec.js`
- `e2e/397_house_library_trust_discovery_route.spec.js`
- `e2e/398_house_library_trust_discovery_ui.spec.js`
- `e2e/399_house_library_trust_discovery_preview.spec.js`
- `e2e/400_house_library_trust_discovery_lane_updates.spec.js`
- `e2e/401_house_library_trust_discovery_full_smoke.spec.js`

## 4. Milestones

### M40.0 Harness

Add one deterministic fixture family for trust-aware discovery.

Success criteria:

1. Fixture family `library_public_stack_discovery_seed` is listed by the unified-platform harness.
2. The fixture declares the four supported discovery lanes.
3. No new persistent table is required for this phase.

### M40.1 Route contract

Public Stack search returns discovery lane, discovery reason, selected discovery filter, and lane counts.

Success criteria:

1. Each search member returns exactly one supported discovery lane.
2. Each search member returns one non-empty discovery reason.
3. Search response includes lane counts for `ready_here`, `check_here`, `attested_elsewhere`, and `imported_here`.
4. Applying `discovery=<lane>` returns only members from that lane.

### M40.2 Same-shell discovery UI

Add discovery chips and filter controls to the current House Library shell.

Success criteria:

1. One tap on a discovery chip updates the current search inside `/app`.
2. Result cards show the projected discovery reason.
3. The worker session remains stable while switching lanes.

### M40.3 Preview discovery copy

Preview projects the same discovery lane and reason used by the search result card.

Success criteria:

1. Preview shows a short discovery reason.
2. Preview lane changes after local verify, review, or import actions.
3. No route transition occurs.

### M40.4 Lane updates

Local actions must move a Public Stack between lanes deterministically.

Success criteria:

1. A stack can move from `check_here` to `ready_here` after local verify or trust.
2. A stack can move from `attested_elsewhere` to `ready_here` after local verify or trust.
3. A stack can move from `ready_here` to `imported_here` after import.

### M40.5 Full smoke

One joined smoke proves the trust-aware discovery path end to end.

Success criteria:

1. Source House publishes and attests a Public Stack.
2. Target House finds it through the `attested_elsewhere` lane.
3. Target House verifies or trusts it and the lane updates to `ready_here`.
4. Target House imports it and the lane updates to `imported_here`.
5. The worker session id is unchanged through the entire flow.

## 5. Exit criteria

Phase 40 is complete when:

1. `e2e/396` through `e2e/401` pass.
2. Full `npm test` passes.
3. Public Stack discovery is faster to scan without adding a new persistence surface.
