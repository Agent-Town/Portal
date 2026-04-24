# Agent Town: Founders Plot V1.4.4 — TDD Acceptance Matrix

**Spec:** `39_founders_plot_v1_4_4_play_first_onboarding.md`  
**Purpose:** make the play-first onboarding refactor test-driven, measurable, and unambiguous for agentic AI developers.

---

## 0. Testing principles

1. **Test the actual player route, not only internal state.** If `/app?district=founders-plot` is the target path, assert behavior there.
2. **Separate manual play from real Foreman.** Tests must prove Founders Plot is playable without Brain while also proving Real Clover cannot mutate without Brain.
3. **Do not rely on live Privy in CI.** Use existing test-auth/session helpers to simulate authenticated state. Add one manual Privy smoke checklist if needed.
4. **No fake AI.** A deterministic guide can suggest. It cannot create `actor: AGENT` events or LLM receipts.
5. **Measure friction.** Tests should encode time-to-game and first-action visibility, not only DOM presence.

---

## 1. Required Node / unit tests

| ID | Test file | Goal | Setup | Assertions | Metrics |
|---|---|---|---|---|---|
| N1 | `tests/v1_4_4_access_state.test.js` | Access state decouples Founders Plot playability from full onboarding. | Construct state fixtures: no Brain, no Town Hall, no Sigil, no Ceremony. | `foundersPlot.playable === true`; `brain.requiredForRealForeman === true`; `townHall.complete === false`; no blocked reason. | `AccessStateCompleteness = 100%` |
| N2 | `tests/v1_4_4_district_gate_rules.test.js` | District gate permits Founders Plot after auth. | Authenticated fixture with onboarding incomplete. | `canOpenDistrict('founders-plot') === true`; `canRunRealForeman === false`; `canOpenTownHall === true`. | `FullOnboardingBlocksFoundersPlotRate = 0` |
| N3 | `tests/v1_4_4_foreman_brain_requirement.test.js` | Real Foreman mutation cannot happen without Brain. | Plot with ready output; Brain unconfigured. | Foreman action returns `BRAIN_REQUIRED` / user-friendly copy; no `actor: AGENT` event; inventory unchanged. | `RealForemanMutationWithoutBrainRate = 0` |
| N4 | `tests/v1_4_4_manual_mode_event_attribution.test.js` | Manual actions remain human-attributed. | Human manually collects output in Manual Founder Mode. | Event actor is `HUMAN`; no model invocation id; no worker command id. | `ManualActionMisattributionRate = 0` |
| N5 | `tests/v1_4_4_townhall_recommendation_state.test.js` | Town Hall is recommended after progression, not blocking. | HQ2 or first contract fixture. | `townHall.recommended === true`; `foundersPlot.playable === true`. | `TownHallBlocksAfterRecommendation = 0` |

---

## 2. Required Playwright / E2E tests

### E1 — Play-first entry after auth

**File:** `e2e/201_founders_plot_play_first_entry.spec.js`

**Goal:** authenticated/test-authenticated user lands in Founders Plot without completing Brain/Town Hall/Sigil/Ceremony.

**Steps:**

1. Reset test state.
2. Create authenticated test session / simulate Privy-success path.
3. Visit `/app?district=founders-plot&entry=play-first` or use Start Gate CTA path if test helper supports it.
4. Wait for Founders Plot frame/surface.

**Assertions:**

- Founders Plot surface visible.
- First objective visible within 5 seconds.
- Manual action CTA visible.
- No forced Town Hall modal.
- No Brain setup modal appears before first game action.
- No onboarding stepper blocks gameplay.

**Metrics:**

- `TimeToFoundersPlotAfterAuthP95 <= 6000ms`
- `FirstActionVisibleWithinP95 <= 5000ms`

---

### E2 — Manual first loop without Brain

**File:** `e2e/202_founders_plot_manual_mode_first_loop.spec.js`

**Goal:** player can complete the first meaningful Founders Plot loop without Brain.

**Steps:**

1. Enter Founders Plot with no Brain config.
2. Confirm Manual Founder Mode.
3. Perform first building/action sequence using existing first-loop mechanics.
4. Collect first resource or complete the first available starter task.

**Assertions:**

- Inventory/progress changes.
- Event log attributes actions to human.
- Brain remains unconfigured.
- Real Foreman controls are disabled/hidden.
- No AGENT mutation event appears.

**Metrics:**

- `ManualModeFirstLoopCompletion = pass`
- `AGENTEventsWithoutBrain = 0`

---

### E3 — Real Clover controls require Brain

**File:** `e2e/203_founders_plot_real_clover_requires_brain.spec.js`

**Goal:** Real Clover actions are blocked without Brain, but manual play continues.

**Steps:**

1. Enter Founders Plot with output-ready state and no Brain.
2. Open Clover / Foreman drawer.
3. Attempt Run Now / scheduler if controls are visible.
4. Perform same action manually.

**Assertions:**

- Foreman attempt shows friendly `Connect a Brain` copy.
- No raw `LLM not configured` or `runtime missing` in normal gameplay.
- No world mutation attributed to Clover.
- Manual action succeeds.

**Metrics:**

- `RealForemanMutationWithoutBrainRate = 0`
- `RawDebugJargonVisibleInNormalGameRate = 0`

---

### E4 — Brain Quick Connect unlocks Real Clover

**File:** `e2e/204_founders_plot_brain_quick_connect_unlocks_real_clover.spec.js`

**Goal:** after the player connects a Brain through the quick sheet, Real Clover mode becomes available.

**Steps:**

1. Enter Manual Founder Mode.
2. Trigger Brain CTA by clicking Clover or reaching the configured first-use trigger.
3. Open Brain Quick Connect sheet.
4. Use deterministic/local test Brain or mocked provider config.
5. Save config.

**Assertions:**

- Quick Connect sheet uses short player-facing copy.
- Brain config saved.
- Clover mode changes to Real Clover.
- Run Now / scheduler availability matches existing runtime rules.
- No full Brain debug panel opens unless explicitly requested.

**Metrics:**

- `BrainQuickConnectCompletion = pass`
- `QuickConnectDebugLeakRate = 0`

---

### E5 — Brain CTA does not appear too early

**File:** `e2e/205_founders_plot_brain_cta_timing.spec.js`

**Goal:** Brain setup is not asked before the player has interacted with the game.

**Steps:**

1. Enter Founders Plot first time with no Brain.
2. Capture default view before first action.
3. Perform first action.
4. Trigger relevant state where Clover can help.

**Assertions:**

- Before first action: no blocking Brain modal.
- After relevant trigger: non-blocking Brain CTA may appear.
- CTA can be dismissed.
- Dismissing CTA does not block manual play.

**Metrics:**

- `BrainCTAAppearsBeforeFirstActionRate = 0`
- `BrainCTADismissBlocksManualPlay = 0`

---

### E6 — Town Hall deferred and non-blocking

**File:** `e2e/206_founders_plot_townhall_deferred_nonblocking.spec.js`

**Goal:** Town Hall invitation appears after progression but does not block play.

**Steps:**

1. Enter Founders Plot with Town Hall incomplete.
2. Reach HQ2 or complete first starter contract via fixture or accelerated path.
3. Observe Town Hall invite.
4. Continue manual gameplay without visiting Town Hall.
5. Open Town Hall manually.

**Assertions:**

- Founders Plot remains playable.
- Town Hall invite is non-blocking.
- Opening Town Hall shows full onboarding/official setup.
- Returning to Founders Plot preserves state.

**Metrics:**

- `TownHallBlockingFirstLoopRate = 0`
- `TownHallOptionalFlowReachable = pass`

---

### E7 — Existing full onboarding still works

**File:** `e2e/207_townhall_full_onboarding_still_available.spec.js`

**Goal:** play-first path does not remove or break Town Hall onboarding.

**Steps:**

1. Open Town Hall directly from town hub.
2. Verify profile/registration/Brain/Sigil/Ceremony steps are reachable according to existing state.
3. Use existing happy-path or smoke-only assertions.

**Assertions:**

- Town Hall route opens.
- Stepper is present inside Town Hall if full onboarding is required.
- Existing controls are not removed.
- No Founders Plot forced redirect while in Town Hall.

**Metrics:**

- `TownHallRegression = 0`

---

### E8 — No normal-gameplay jargon

**File:** `e2e/208_play_first_no_jargon.spec.js`

**Goal:** normal gameplay copy is player-facing and not debug/provider-heavy.

**Forbidden visible strings in normal Founders Plot route:**

```text
LLM not configured
runtime missing
provider error
NO_SOLANA_WALLET
agent.panel.title
agent.panel.status.idle
onboarding.required
ERC-8004 required
```

**Assertions:**

- None of the above strings appear in normal gameplay.
- They may appear only in explicit debug route or Town Hall identity settings where relevant.

**Metrics:**

- `RawDebugJargonVisibleInNormalGameRate = 0`

---

## 3. Optional but recommended release-candidate tests

| ID | Test | Purpose |
|---|---|---|
| R1 | `e2e/209_start_gate_privy_redirect_target.spec.js` | Confirms Start Gate target is Founders Plot after test-mode Privy success. |
| R2 | `e2e/210_play_first_visual_non_regression.spec.js` | Captures desktop and mobile screenshots after onboarding refactor. |
| R3 | `tests/v1_4_4_access_state_schema.test.js` | Validates access object fields and enum values. |
| R4 | `e2e/211_brain_quick_connect_full_settings_link.spec.js` | Ensures quick sheet links to full Brain settings without opening debug by default. |

---

## 4. Screenshot requirements

Capture and commit screenshots if route/layout changes affect baselines:

```text
e2e/201...-snapshots/play-first-founders-plot-desktop-1280.png
e2e/201...-snapshots/play-first-founders-plot-mobile-390.png
e2e/204...-snapshots/brain-quick-connect-sheet-390.png
e2e/206...-snapshots/townhall-invite-after-hq2-1280.png
```

Screenshots must prove:

- Founders Plot opens quickly;
- Manual Founder Mode is visually calm;
- Brain Quick Connect is compact;
- Town Hall invite is non-blocking;
- no debug panels leak into normal gameplay.

---

## 5. Manual QA checklist

Manual QA should verify:

1. Start page still feels good after CTA copy changes.
2. Privy login still works in production/staging.
3. The user is not forced into full onboarding before playing.
4. Manual play feels honest, not like fake AI.
5. Brain connection copy makes value clear.
6. Town Hall feels aspirational rather than required paperwork.
7. Existing full onboarding remains reachable.
8. Public preview release copy matches the actual product.

---

## 6. Definition of test-complete

The branch is test-complete when:

- all required Node/unit tests pass;
- all required Playwright tests pass;
- existing V1.4.x Founders Plot smoke/visual tests remain green;
- no manual-mode AGENT mutation is possible;
- QA can enter Founders Plot without Brain/Town Hall and complete the first loop;
- QA can connect Brain and unlock Real Clover mode;
- QA can open Town Hall later and complete/inspect full onboarding.
