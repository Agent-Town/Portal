---
spec_id: founders_plot_v1_4_4_play_first_onboarding_cleanup_tdd_matrix
version: 1.0.0
status: ready_for_implementation
created_at: 2026-04-24
---

# V1.4.4 Cleanup Patch — TDD Acceptance Matrix

## 1. Test inventory

| ID | Test file | Type | Purpose | Required result |
|---|---|---|---|---|
| T1 | `e2e/208_founders_plot_start_gate_privy_play_first_redirect.spec.js` | Playwright | Proves Start Gate → auth/Privy mock → Founders Plot play-first redirect. | Founders Plot manual mode opens; Town Hall/Brain/Sigil/Ceremony do not block. |
| T2 | `tests/v1_4_4_access_fail_closed.test.js` | Node/TAP | Proves access helper defaults unknown auth to unauthenticated. | Unknown auth never grants access. |
| T3 | `e2e/209_founders_plot_access_fail_closed.spec.js` | Playwright | Proves route behavior matches helper policy. | Unauth unknown route does not accidentally enter play mode; authenticated route does. |
| T4 | `e2e/210_founders_plot_brain_modes_and_real_clover_gate.spec.js` | Playwright | Proves No Brain, Demo/Test Brain, and Production Brain have distinct UI states. | Real Clover only unlocks for production Brain or explicit CI test harness. |
| T5 | `tests/v1_4_4_foreman_brain_guard_behavior.test.js` | Node/integration | Proves protected Foreman mutation without Brain fails behaviorally. | No inventory mutation and no AGENT event. |
| T6 | `tests/v1_4_4_markdown_readability.test.js` | Node/TAP | Proves new docs are LLM-readable markdown. | No one-line specs; no giant prose lines; required headings present. |
| T7 | Existing V1.4.4 tests | Regression | Preserve Play-First behavior. | All still pass. |
| T8 | Existing visual/player-surface tests | Regression | Preserve V1.4.3/V1.4.2 UI wins. | All still pass or baselines intentionally updated. |
| T9 | `e2e/120_onboarding_privy_required.spec.js` | Playwright | Proves direct `/app?district=house` honors existing `houseId` even when stale onboarding state says `ceremony`. | Plan Wagons remains open; Town Hall and ceremony iframe do not reappear. |
| T10 | `e2e/38_phase1_create_ceremony_regression.spec.js` | Playwright | Proves ceremony house init sends the wallet key-wrap signature expected by production server verification. | `/api/house/init` receives `keyWrapSig`; key-wrap message contains `houseId` and no `origin:` line. |

## 2. Detailed test requirements

### T1 — Start Gate redirect

Test steps:

1. Open Start Gate route.
2. Trigger the normal play-first login/entry action.
3. Use deterministic auth/Privy mock or test harness.
4. Assert final URL includes:

```text
/app?district=founders-plot&entry=play-first
```

5. Assert Founders Plot stage is visible.
6. Assert Manual Founder Mode copy is visible.
7. Assert no blocking Town Hall registration panel is visible.
8. Assert no Brain Quick Connect sheet is open before the first play action.

Metrics:

```text
StartGateToFoundersPlotRedirect = 1
BlockingOnboardingSurfacesVisible = 0
```

### T2 — Access helper fail-closed

Test cases:

```js
assert.equal(evaluateAccess({}).authenticated, false);
assert.equal(evaluateAccess({ authenticated: true }).authenticated, true);
assert.equal(evaluateAccess({ state: { authenticated: true }}).authenticated, true);
assert.equal(evaluateAccess({ state: { authenticated: false }}).authenticated, false);
```

The exact function/API names may differ. The behavior must not.

### T3 — Route fail-closed behavior

Test steps:

1. Clear auth/session state.
2. Open the Founders Plot play-first route.
3. Assert either auth prompt or safe unauthenticated fallback appears.
4. Assert the route does not grant authenticated game mutations without auth.
5. Set test auth state explicitly.
6. Reopen route and assert manual play is enabled.

### T4 — Brain modes and Real Clover gate

Test cases:

| Scenario | Expected |
|---|---|
| No Brain | Manual actions enabled; Real Clover controls disabled. |
| Free/OpenRouter `:free` model in production mode | Display preview/test copy; Real Clover controls disabled. |
| Test Brain with explicit CI harness | Real Clover test controls may unlock only under test flag. |
| Production Brain | Real Clover controls enabled after runtime ready. |

The test must assert copy, not only button state.

### T5 — Protected Foreman mutation guard

Required assertions:

```text
response.ok == false
response.error.code in [BRAIN_REQUIRED, REAL_CLOVER_BRAIN_REQUIRED, FOREMAN_BRAIN_REQUIRED]
inventoryBefore == inventoryAfter
agentEventsAfter - agentEventsBefore == 0
humanEquivalentActionStillWorks == true
```

This test must not be implemented as source-code string scanning.

### T6 — Markdown readability

Suggested target files:

```text
specs/39_founders_plot_v1_4_4_play_first_onboarding.md
specs/40_founders_plot_v1_4_4_play_first_onboarding_tdd_matrix.md
docs/product/PLAY_FIRST_ONBOARDING_LADDER_V1_4_4.md
```

Suggested rules:

- at least 20 non-empty lines per spec/product doc;
- no non-code line longer than 240 characters;
- required headings present;
- front matter parseable if present.

### T9 — Direct house route after ceremony

Test steps:

1. Open `/app?district=house`.
2. Mock a real app-state shape with:

```text
onboarding.required = true
onboarding.registrationComplete = true
onboarding.step = ceremony
signup.complete = true
houseId = <existing house id>
```

3. Assert the modal remains on `Plan Wagons`.
4. Assert the Town Hall registration panel is absent.
5. Assert the ceremony iframe is absent.
6. Wait through a poll interval and assert the route does not downgrade.

Metric:

```text
StaleCeremonyHouseRouteDowngrade = 0
```

### T10 — Ceremony key-wrap signature

Test steps:

1. Run the real create-page co-op ceremony regression path.
2. Capture the `/api/house/init` payload.
3. Assert `keyWrapSig` is present and decodes to a 64-byte Solana signature.
4. Assert the signed key-wrap message is:

```text
ElizaTown House Key Wrap
houseId: <houseId>
```

5. Assert the signed key-wrap message does not include `origin:`.

Metric:

```text
ProductionHouseInitMissingUnlockSignature = 0
```

## 3. Metrics

| Metric | Measurement | Pass threshold |
|---|---|---:|
| `StartGateRedirectPassRate` | E2E Start Gate redirect result | 100% |
| `UnknownAuthGrantsAccess` | access helper + route behavior | 0 |
| `ManualPlayNoBrainPassRate` | existing/manual mode E2E | 100% |
| `RealCloverRequiresProductionBrain` | Brain-mode E2E + route tests | 100% |
| `NoBrainForemanMutationRate` | API behavior test | 0 |
| `NoBrainAgentEventRate` | replay/event check | 0 |
| `MarkdownReadabilityPassRate` | Node/TAP readability test | 100% |
| `OutOfScopeGameplayChanges` | scope guard / reviewer check | 0 |
| `StaleCeremonyHouseRouteDowngrade` | direct house route regression test | 0 |
| `ProductionHouseInitMissingUnlockSignature` | create ceremony regression test | 0 |

## 4. Release gate

The patch is release-candidate ready only when:

```text
T1 through T10 pass
AND no gameplay/system scope was added
AND implementation report is complete
```
