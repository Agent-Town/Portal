# Agent Town: Founders Plot V1.1 TDD Acceptance Matrix

**Date:** 2026-04-19  
**Applies to:** `agent-town-founders-plot-v1.1-refined-spec.md`  
**Purpose:** machine-readable implementation guidance for agentic AI developers  
**Rule:** if a feature has no test in this matrix or an approved equivalent, it is not complete.

---

## 0. Test philosophy

V1.1 is not complete because code exists. It is complete when tests prove the player-facing promise:

> A fresh player can build the first plot loop, choose a living contract, set one Foreman standing order, enable one safe scheduler preset, and see the real OpenClaw Lite Foreman perform one useful action through server-authoritative tools with a receipt and recap.

All tests must be deterministic. Live LLM calls are forbidden in CI.

Use a deterministic **Test Brain** adapter for OpenClaw Lite Foreman tests.

---

## 1. Test priority levels

| Priority | Meaning | Merge rule |
|---|---|---|
| P0 | Required for V1.1 release | Must pass before release branch can merge. |
| P1 | Allowed only after P0 is green | May ship in same branch if stable. |
| P2 | Deferred | Must not block V1.1 and should not be implemented unless respecified. |

---

## 2. P0 test list

### 2.1 Launch Gate UX

| Test ID | Test name | Type | Goal | Assertions | Metric |
|---|---|---|---|---|---|
| FPV11-P0-UX-001 | first CTA visible | Playwright | Fresh user sees one obvious action. | One primary CTA exists; text includes Lumber Camp/place/build; visible <= 5s. | `FirstActionableCtaVisibleMs <= 5000` |
| FPV11-P0-UX-002 | no forbidden game-loop jargon | Playwright/static | Main loop hides provider/debug/blockchain/runtime internals. | Main game DOM excludes forbidden terms. | `ForbiddenGameLoopJargonCount = 0` |
| FPV11-P0-UX-003 | responsive baselines | Playwright screenshot | 390/768/1280 layouts do not collapse. | Screenshots match approved baselines; no overlay collisions. | `ScreenshotDiff <= threshold` |
| FPV11-P0-UX-004 | one primary CTA arbitration | Integration/UI | Goal hierarchy selects one owner. | Conflict fixture shows only highest-priority primary CTA. | `PrimaryCtaConflictFailures = 0` |
| FPV11-P0-UX-005 | Foreman failure copy | Playwright | Worker failure is honest and playable. | Runtime failure shows “could not start” style copy; manual play remains possible. | `ManualFallbackAvailable = true` |

---

### 2.2 First-hour progression

| Test ID | Test name | Type | Goal | Assertions | Metric |
|---|---|---|---|---|---|
| FPV11-P0-PROG-001 | fresh plot initial state | Unit/integration | Baseline resources and HQ are correct. | HQ1, coin 20, resources 0, one construction slot. | exact match |
| FPV11-P0-PROG-002 | first Lumber Camp is free | Integration | Player can start without deadlock. | Place Lumber Camp succeeds with 0 wood/coin. | `ok = true` |
| FPV11-P0-PROG-003 | First Timber reward once | Integration | HQ2 food/XP contradiction is fixed. | First Lumber output grants +10 food +10 XP once only. | `DuplicateRewardRate = 0` |
| FPV11-P0-PROG-004 | HQ2 reachable | E2E accelerated | Player can reach HQ2 from fresh plot. | Collect enough wood, reward food/XP, upgrade HQ2. | `FirstHourGoldenPathPassRate = 100%` |
| FPV11-P0-PROG-005 | Farm Plot unlocks at HQ2 | Integration/E2E | Next verb appears. | Build menu includes Farm Plot after HQ2 only. | exact unlock |
| FPV11-P0-PROG-006 | reward and spend ledger correct | Unit | Resources conserve through first hour. | start + produced + rewards - consumed - end = 0. | `ResourceConservationError = 0` |

---

### 2.3 Contract Board P0

| Test ID | Test name | Type | Goal | Assertions | Metric |
|---|---|---|---|---|---|
| FPV11-P0-CON-001 | board locked before HQ2 | Integration | Avoid early overload. | Contract board unavailable before HQ2 except optional tutorial copy. | exact state |
| FPV11-P0-CON-002 | two valid offers at HQ2 | Integration | Player gets meaningful choice. | Exactly one SUPPLY and one BUILD offer. | `OfferCount = 2` |
| FPV11-P0-CON-003 | contracts include stakeholder context | Unit/schema | Contracts feel like town requests. | requester, institution, whyNow, townSignal, philosophyHint present. | `StakeholderContextCoverage = 100%` |
| FPV11-P0-CON-004 | one active contract | Integration | Clarity preserved. | Accept first contract; second accept blocked. | `ActiveContractCount <= 1` |
| FPV11-P0-CON-005 | supply turn-in consumes once | Integration | Economy correctness. | Requirements consumed once; rewards granted once; idempotency returns same result. | `DuplicateTurnInRewardRate = 0` |
| FPV11-P0-CON-006 | build contract detects building | Integration | Build requirements work. | Place Farm Plot; BUILD contract becomes READY_TO_TURN_IN. | exact state |
| FPV11-P0-CON-007 | contract appears in recap | Integration | Goals become memory. | Recap contains completed contract with requester and result. | `ContractRecapCoverage = 100%` |

---

### 2.4 Foreman Standing Order v0

| Test ID | Test name | Type | Goal | Assertions | Metric |
|---|---|---|---|---|---|
| FPV11-P0-DOCTRINE-001 | default is Careful Steward | Unit/integration | Safe default. | Fresh plot policy preset = CAREFUL_STEWARD. | exact match |
| FPV11-P0-DOCTRINE-002 | player can set Bold Founder | Integration | Teaching input persists. | Set preset; reload; preset remains. | `StandingOrderPersistence = 100%` |
| FPV11-P0-DOCTRINE-003 | policy change emits event | Unit/integration | Auditability. | `FOREMAN_STANDING_ORDER_CHANGED` event written. | event exists |
| FPV11-P0-DOCTRINE-004 | Standing Order influences Plan Card | Deterministic brain | Teaching has visible effect. | Same state yields different reason text for Careful vs Bold. | `StandingOrderInfluenceCoverage = 100%` |
| FPV11-P0-DOCTRINE-005 | Standing Order in recap | Integration | Teaching is remembered. | Foreman action recap mentions active preset when relevant. | `StandingOrderRecapCoverage = 100%` |

---

### 2.5 Goal arbitration

| Test ID | Test name | Type | Goal | Assertions | Metric |
|---|---|---|---|---|---|
| FPV11-P0-GOAL-001 | blocking approval wins | Unit/UI | Highest priority owns CTA. | Approval fixture shows approval CTA, not contract/Foreman CTA. | exact priority |
| FPV11-P0-GOAL-002 | tutorial beats contract progress | Unit/UI | Onboarding remains coherent. | During required tutorial, contract CTA suppressed. | exact priority |
| FPV11-P0-GOAL-003 | ready contract beats optimization | Unit/UI | Goal clarity. | READY_TO_TURN_IN contract CTA beats Foreman suggestion. | exact priority |
| FPV11-P0-GOAL-004 | Foreman silence rule | Unit/runtime | Foreman does not nag. | No Plan Card shown when no safe action inside policy. | `InvalidSuggestionCount = 0` |

---

### 2.6 OpenClaw Lite Foreman runtime

| Test ID | Test name | Type | Goal | Assertions | Metric |
|---|---|---|---|---|---|
| FPV11-P0-RT-001 | worker boots in Founders Plot | Integration/Playwright | Runtime is actually attached. | Runtime state reaches OBSERVING with runtimeId. | `RuntimeBootSuccess = true` |
| FPV11-P0-RT-002 | worker receives observation packet | Integration | No DOM scraping. | Test brain receives `founders-plot.obs.v1.1`. | schema valid |
| FPV11-P0-RT-003 | worker reads pack files | Integration | Experience pack is used. | skill/tools/heartbeat/goals loaded or cached. | `PackLoadCoverage = 100%` |
| FPV11-P0-RT-004 | Foreman route requires runtime auth | Security/integration | Prevent spoofing. | No token -> 403 `FOREMAN_RUNTIME_REQUIRED`. | exact error |
| FPV11-P0-RT-005 | actor spoof rejected on human route | Security/integration | Prevent fake agent action. | `{actor:"AGENT"}` on normal route returns `ACTOR_SPOOF_REJECTED`. | `ActorSpoofRejectionRate = 100%` |
| FPV11-P0-RT-006 | agent-origin proof | E2E | First Foreman mutation comes from runtime path. | Event has runtimeId, foremanSessionId, token scope, not request body actor. | `AgentOriginatedActionCoverage = 100%` |
| FPV11-P0-RT-007 | stale runtime fails closed | Integration | Safety. | STALE runtime cannot execute tool. | `StaleRuntimeShownAsHealthy = 0` |
| FPV11-P0-RT-008 | model timeout no-ops | Runtime test | Avoid bad fallback. | Timeout produces no mutation and user-readable status. | `InvalidMutationOnTimeout = 0` |

---

### 2.7 Scheduler P0: Collect ready outputs

| Test ID | Test name | Type | Goal | Assertions | Metric |
|---|---|---|---|---|---|
| FPV11-P0-SCH-001 | enable collect preset | Integration | Player can delegate one task. | Task row exists with preset COLLECT_READY_OUTPUTS. | exact row |
| FPV11-P0-SCH-002 | due task claimed by runtime | Integration | Lease model works. | Active runtime claims due task; lease recorded. | `DueTaskClaimSuccess = true` |
| FPV11-P0-SCH-003 | auto-collect succeeds | E2E accelerated | Hero moment. | Output ready -> tick -> Foreman collects -> inventory increases. | `AutoCollectHeroMomentPass = true` |
| FPV11-P0-SCH-004 | no duplicate collection | Integration/concurrency | Prevent exploit. | Two ticks/claims collect one batch once. | `DuplicateTaskExecutionRate = 0` |
| FPV11-P0-SCH-005 | permission denial blocks action | Integration | Authority respected. | collect permission disabled -> no collection; explanation/approval shown. | `PolicyViolationRate = 0` |
| FPV11-P0-SCH-006 | pause prevents execution | Integration | Kill switch works. | Pause Foreman; due task no-ops. | `PausedMutationCount = 0` |
| FPV11-P0-SCH-007 | storage cap is explicit | Unit/integration | Economy honest. | Capped collection emits cappedLost. | `CappedLostLogged = true` |

---

### 2.8 Receipt, recap, and audit

| Test ID | Test name | Type | Goal | Assertions | Metric |
|---|---|---|---|---|---|
| FPV11-P0-AUD-001 | receipt after Foreman action | E2E | Player understands action. | Receipt includes action, result, reason, authority, correction controls. | `ForemanReceiptCoverage = 100%` |
| FPV11-P0-AUD-002 | recap separates passive from agent | Integration | Avoid fake agency. | Production event and Foreman collect event are distinct. | exact sections |
| FPV11-P0-AUD-003 | recap action has event link | Integration | Auditability. | Foreman recap line references eventId. | `RecapEventLinkCoverage = 100%` |
| FPV11-P0-AUD-004 | Ask me next time disables preset | Integration/UI | Correction works. | Click correction; preset paused/disabled; next tick no mutation. | exact behavior |
| FPV11-P0-AUD-005 | Pause Foreman immediate | Integration/UI | Kill switch. | Pause updates runtime/task state; no later Foreman action. | `PauseLatencyMs <= 1000` |

---

### 2.9 Replay and resource ledger

| Test ID | Test name | Type | Goal | Assertions | Metric |
|---|---|---|---|---|---|
| FPV11-P0-LEDGER-001 | every economy event has delta | Unit/schema | Balance visibility. | ResourceDelta present for production, collect, reward, spend, turn-in. | `ResourceDeltaCoverage = 100%` |
| FPV11-P0-LEDGER-002 | conservation first hour | Unit/replay | No hidden resource creation. | Formula balances for golden path. | `ResourceConservationError = 0` |
| FPV11-P0-REPLAY-001 | action-log replay fixture | Unit/integration | Stronger determinism. | Initial state + actions + time advances -> expected hash. | `StateHashDeterminism = 100%` |
| FPV11-P0-REPLAY-002 | idempotency replay stable | Integration | Safe retries. | Same idempotency key returns same result. | `IdempotencyConflictErrorRate = 0` |

---

## 3. P1 tests

P1 tests are only relevant if P1 is approved after P0 completion.

### 3.1 Keep one building running

| Test ID | Test name | Type | Goal | Assertions | Metric |
|---|---|---|---|---|---|
| FPV11-P1-SCH-001 | enable keep running preset | Integration | Second trusted preset. | Task exists with KEEP_ONE_BUILDING_RUNNING. | exact row |
| FPV11-P1-SCH-002 | queues one job only | Integration | Prevent spam. | Ready building gets one job; no duplicate jobs. | `DuplicateQueueRate = 0` |
| FPV11-P1-SCH-003 | Standing Order selects building | Deterministic brain | Policy affects behavior. | Careful chooses reserve-supporting building; Bold chooses contract/growth when safe. | expected candidate |
| FPV11-P1-SCH-004 | permission denial blocks queueing | Integration | Authority respected. | queue permission false -> no job; explanation visible. | `PolicyViolationRate = 0` |

### 3.2 Contract deck expansion

| Test ID | Test name | Type | Goal | Assertions | Metric |
|---|---|---|---|---|---|
| FPV11-P1-CON-001 | deck avoids immediate duplicates | Unit | Reduce repetition. | Same requester/title not repeated within configured window. | `DuplicateOfferRate <= 5%` |
| FPV11-P1-CON-002 | deck remains satisfiable | Unit/property | No impossible goals. | Generated requirements match unlocks/current resources. | `ContractRequirementValidityRate = 100%` |
| FPV11-P1-CON-003 | philosophy hints vary | Unit | Contract choice feels meaningful. | Offers expose distinct hints when possible. | `DistinctHintCoverage >= 80%` |

---

## 4. P2 deferred tests

Do not implement these tests in V1.1 unless a new spec promotes them.

| Deferred area | Future test theme |
|---|---|
| Maintain reserve | Foreman preserves reserves across contract pressure. |
| Check bottleneck | Foreman diagnoses non-obvious production bottleneck. |
| Assist active contract | Foreman chooses among multiple contract-supporting actions under doctrine. |
| Recovery contracts | Civic incident creates recoverable pressure. |
| Preparation contracts | Timed event prep creates scenario tension. |
| Full doctrine board | Multiple policies compose without contradiction. |
| Backend persistent Foreman | Foreman works after browser closes through backend-pool runtime. |
| Charters/run identity | Starting identity changes contract decks and decisions. |

---

## 5. Required deterministic fixtures

### 5.1 Fresh plot fixture

```json
{
  "fixtureId": "fresh_hq1_plot_v11",
  "hqLevel": 1,
  "inventory": { "wood": 0, "stone": 0, "food": 0, "coin": 20 },
  "townXp": 0,
  "constructionSlots": 1,
  "buildings": [{ "type": "HQ", "state": "IDLE" }],
  "standingOrder": "CAREFUL_STEWARD"
}
```

### 5.2 Ready output fixture

```json
{
  "fixtureId": "farm_output_ready_v11",
  "hqLevel": 2,
  "inventory": { "wood": 10, "stone": 0, "food": 0, "coin": 15 },
  "buildings": [
    { "buildingId": "bld_farm_1", "type": "FARM_PLOT", "state": "OUTPUT_READY", "outputReady": { "resource": "food", "qty": 6 } }
  ],
  "permissions": { "collectOutputs": true, "queueProduction": false },
  "scheduler": { "activePresets": ["COLLECT_READY_OUTPUTS"] },
  "standingOrder": "CAREFUL_STEWARD"
}
```

### 5.3 Goal conflict fixture

```json
{
  "fixtureId": "approval_vs_contract_vs_foreman_v11",
  "pendingApproval": { "kind": "SPEND_COIN", "amount": 6 },
  "activeContract": { "status": "READY_TO_TURN_IN" },
  "foremanSuggestion": { "kind": "COLLECT_READY_OUTPUTS" },
  "expectedPrimaryOwner": "approval"
}
```

---

## 6. Test Brain contract

The deterministic Test Brain must implement this interface or an equivalent adapter.

```ts
type TestBrainInput = {
  observation: FoundersPlotObservationV11;
  safeCandidates: Array<{
    candidateId: string;
    toolName: string;
    args: object;
    reason: string;
    score: number;
  }>;
};

type TestBrainOutput = {
  chosenCandidateId: string | null;
  planCard: ForemanPlanCardV11;
};
```

Rules:

- If `safeCandidates` is empty, return `chosenCandidateId: null`.
- If a candidate directly satisfies active contract, choose it unless Standing Order blocks it.
- If no contract candidate exists, choose reserve-supporting candidate under `CAREFUL_STEWARD`.
- If no reserve candidate exists, choose highest score.
- Never output a tool not listed in `safeCandidates`.

---

## 7. Global release gates

V1.1 P0 cannot release unless all are true:

```yaml
release_gates:
  p0_tests_pass: true
  first_hour_golden_path_pass_rate: 1.0
  actor_spoof_rejection_rate: 1.0
  agent_originated_action_coverage: 1.0
  policy_violation_rate: 0
  duplicate_task_execution_rate: 0
  resource_conservation_error: 0
  foreman_receipt_coverage: 1.0
  recap_attribution_coverage: 1.0
  forbidden_game_loop_jargon_count: 0
  console_error_count_golden_path: 0
  screenshot_baselines_approved: true
```

---

## 8. Notes for agentic AI developers

- Start by writing failing tests from this matrix.
- Prefer unit/integration tests for engine, ledger, contract, and scheduler correctness.
- Use Playwright only for player-facing golden paths and screenshot baselines.
- Never use a live LLM in CI.
- Never let the client declare itself as the Foreman.
- Never mark a test passed by asserting text only if state/event truth can also be checked.
- Preserve save compatibility and add migrations with tests.

---

## 9. Minimal implementation order

1. First-hour fixtures and starter reward tests.
2. Launch Gate UI tests.
3. Contract Board schema/tests.
4. Standing Order schema/tests.
5. Goal arbitration tests.
6. Foreman runtime route/security tests.
7. OpenClaw Lite Test Brain integration tests.
8. Scheduler auto-collect tests.
9. Receipt/recap tests.
10. Replay/ledger tests.
11. End-to-end golden path.

This order prevents the team from building runtime infrastructure before the game loop and product proof are testable.
