# Phase 22 Spec: Poker Play Platform v1 (Contracts First, TDD)

Status: Draft  
Version: 1.0  
Audience: runtime engineers, backend engineers, frontend engineers, security engineers, QA automation engineers, ML evaluation engineers, poker-domain engineers, AI agent implementers  
Depends on: [specs/02_api_contract.md](./02_api_contract.md), [specs/22_poker_play_platform_v1_implementation_pack.md](./22_poker_play_platform_v1_implementation_pack.md), [specs/23_poker_play_platform_v1_backlog.md](./23_poker_play_platform_v1_backlog.md), [AGENTS.md](../AGENTS.md)  
Goal: make the remaining poker-platform work implementable in small, deterministic, agent-friendly steps where every milestone has explicit RED and GREEN gates plus measurable success metrics.

Implementation constraints:

1. Keep the poker top-level UX modal-first and hub-compatible.
2. Keep worker-first architecture for seat-agent reasoning. The server may validate and persist, but not become the long-term strategic brain.
3. Default `npm test` must remain deterministic and offline-safe.
4. Every new player-visible poker behavior must have both contract coverage and UI coverage unless the milestone is explicitly backend-only.
5. Strategy quality in the default suite must be measured only through objective criteria such as legality, schema validity, and seeded fixture agreement. Subjective poker taste is not a merge gate.
6. Real-model evaluation lanes must be explicit opt-in and machine-readable.
7. No accounting mutation is allowed without auditability and reconciliation visibility.
8. No new admin power may exist without an explicit audit event carrying actor identity and reason.
9. Every new history or export surface must derive from the same durable rows used by gameplay and review.
10. Do not regress the currently green poker play, rail, dispute, payout, refund, and series tests.

## 1. Executive summary

This phase closes the remaining poker gaps through seven tightly scoped workstreams:

1. engine correctness and accounting,
2. time-bank and reconnect adjudication,
3. worker-backed seat agent,
4. cash-room lifecycle and waitlist,
5. tournament-director depth,
6. history, integrity, and player stats,
7. dashboard and reconciliation.

Reserved Playwright block for this phase:

1. `216` to `243`

Reserved Playwright files:

1. `e2e/216_poker_play_phase22_harness.spec.js`
2. `e2e/217_poker_play_engine_sidepot_contract.spec.js`
3. `e2e/218_poker_play_engine_sidepot_ui.spec.js`
4. `e2e/219_poker_play_engine_odd_chip_contract.spec.js`
5. `e2e/220_poker_play_timebank_contract.spec.js`
6. `e2e/221_poker_play_timebank_ui.spec.js`
7. `e2e/222_poker_play_worker_agent_contract.spec.js`
8. `e2e/223_poker_play_worker_agent_ui.spec.js`
9. `e2e/224_poker_play_worker_agent_eval_contract.spec.js`
10. `e2e/225_poker_play_cash_lifecycle_contract.spec.js`
11. `e2e/226_poker_play_cash_lifecycle_ui.spec.js`
12. `e2e/227_poker_play_waitlist_contract.spec.js`
13. `e2e/228_poker_play_waitlist_ui.spec.js`
14. `e2e/229_poker_play_tournament_director_contract.spec.js`
15. `e2e/230_poker_play_tournament_director_ui.spec.js`
16. `e2e/231_poker_play_tournament_schedule_reentry_contract.spec.js`
17. `e2e/232_poker_play_tournament_schedule_reentry_ui.spec.js`
18. `e2e/233_poker_play_hand_history_contract.spec.js`
19. `e2e/234_poker_play_hand_history_ui.spec.js`
20. `e2e/235_poker_play_series_timeline_contract.spec.js`
21. `e2e/236_poker_play_series_timeline_ui.spec.js`
22. `e2e/237_poker_play_integrity_flags_contract.spec.js`
23. `e2e/238_poker_play_integrity_review_ui.spec.js`
24. `e2e/239_poker_play_player_stats_contract.spec.js`
25. `e2e/240_poker_play_player_stats_ui.spec.js`
26. `e2e/241_poker_play_ops_dashboard_contract.spec.js`
27. `e2e/242_poker_play_ops_dashboard_ui.spec.js`
28. `e2e/243_poker_play_ledger_reconciliation_contract.spec.js`

Supplemental verification lanes allowed in this phase:

1. `npm run verify:poker-play-engine`
2. `npm run eval:poker-seat-agent`
3. `npm run verify:poker-ledger`

## 2. Global measurable metrics

Every milestone must publish measurable proof using the metric classes below.

### 2.1 Engine correctness metrics

Required for hand-state and pot-state work:

1. Side-pot count matches the seeded fixture exactly.
2. Every winner receives only the pots they are eligible to win.
3. Total chips after settlement equal total chips before settlement plus zero net drift.
4. Split-pot and odd-chip outcomes match the seeded expected seat numbers and amounts exactly.
5. Public and admin views agree on pot totals, winners, and payouts.

### 2.2 Accounting metrics

Required for reload, payout, refund, and reconciliation work:

1. Wallet OIL debits and credits sum exactly to table and series outcomes.
2. A replayed idempotent mutation does not create duplicate ledger entries.
3. Refund totals equal the sum of the refunded seat amounts exactly.
4. Reconciliation reports zero mismatches on a clean seeded store.
5. Reconciliation reports exact mismatches by row identity when the store is intentionally corrupted in test mode.

### 2.3 Seat-agent legality metrics

Required for worker-backed seat-agent work:

1. Seat agent emits only actions present in `viewerAllowedActions`.
2. Proposed amounts are always within server-legal bounds.
3. Seat-agent output schema validates exactly.
4. Worker debug surfaces expose the tool call and response for each seat-agent step.
5. Server rejects any stale or illegal proposal even if the worker emitted it.

### 2.4 Seat-agent evaluation metrics

Required for the opt-in benchmark lane:

1. Legal-action compliance is `100%` on the benchmark corpus.
2. Amount-legality compliance is `100%` on the benchmark corpus.
3. Structured output validity is `100%` on the benchmark corpus.
4. Easy-spot agreement against expert labels is at least `80%`.
5. Medium-spot non-blunder rate is at least `90%`.
6. Median seeded-eval latency is reported in machine-readable output.

### 2.5 Player lifecycle metrics

Required for cash lifecycle and waitlist work:

1. Reload changes stack and wallet OIL by the expected exact amount.
2. Sit-out skips the seat for the next hand without rotating ownership or hole-card privacy.
3. Waitlist promotion order matches the seeded queue order exactly.
4. Away/back or reconnect does not rotate wallet subject, house id, or seat number.

### 2.6 Tournament-director metrics

Required for manual director controls:

1. Manual seat moves preserve stack, buy-in, payout eligibility, and current series identity.
2. Closing registration flips the same contract-visible flag on table and series summaries.
3. Manual break or rebalance updates target table count and pending-break state deterministically.
4. Every override produces one audit event with actor, reason, and before/after identifiers.

### 2.7 History metrics

Required for hand history and timeline work:

1. Hand history event count matches the action, board, and settlement rows exactly.
2. Series timeline ordering is stable across repeated reads.
3. Public timelines exclude private seat-thread content.
4. Player history excludes opponent private hole cards except where showdown policy allows exposure.

### 2.8 Integrity metrics

Required for suspicious-play work:

1. Seeded suspicious patterns create the expected flag count exactly.
2. Flag status transitions are durable and auditable.
3. Integrity review summaries never leak another seat's private thread text.
4. Dashboard counts match underlying open-flag rows exactly.

### 2.9 UI continuity metrics

Required for all poker page work:

1. The top-level hub page remains stable during modal poker use.
2. Live push or refresh does not eject the user to a full standalone page.
3. Rail, player, and admin states render distinct controls correctly.
4. Countdown and status rendering remain stable under refresh and reconnect.

## 3. Test harness rules

1. All default-lane poker tests must use seeded tables, seeded hands, and seeded OIL balances.
2. No default-lane poker test may require a live model, live wallet, or live Streamflow dependency.
3. Worker-agent contract tests may use a deterministic fixture brain or worker stub in the default lane.
4. Real-model evaluation must be an explicit opt-in lane with machine-readable output.
5. Admin tests must authenticate through the same admin-token path used by the product.
6. History and export tests must assert exact counts, not only "non-empty."
7. Negative tests are mandatory for illegal actions, stale proposals, unauthorized admin mutations, and privacy leakage.
8. Every milestone must preserve all earlier poker tests unless the test file is intentionally replaced by a stronger contract.

## 4. Required fixtures and observability

### 4.1 Fixture families

This phase requires at least the following seeded fixture families:

1. `poker_phase22_harness_seed`
2. `poker_sidepot_seed`
3. `poker_odd_chip_seed`
4. `poker_timebank_seed`
5. `poker_worker_agent_eval_seed`
6. `poker_cash_lifecycle_seed`
7. `poker_waitlist_seed`
8. `poker_tournament_director_seed`
9. `poker_reentry_schedule_seed`
10. `poker_hand_history_seed`
11. `poker_series_timeline_seed`
12. `poker_integrity_seed`
13. `poker_player_stats_seed`
14. `poker_reconciliation_seed`

### 4.2 Test-mode observability

At least one deterministic mechanism must exist to inspect:

1. pot slices by hand,
2. time-bank state by acting seat,
3. worker seat-agent proposal payloads,
4. waitlist order,
5. series event history,
6. integrity flags and statuses,
7. player stats rollups,
8. reconciliation mismatches.

Equivalent test-only admin helpers are allowed.

## 5. Milestone map

Milestones must be implemented in order. Do not start tournament-director depth before engine correctness is green.

### M22.0 - Harness and fixture alignment

Purpose:

1. reserve the Phase 22 block,
2. add seeded fixture families,
3. add the observability required by later metrics.

Primary test:

1. `e2e/216_poker_play_phase22_harness.spec.js`

Evaluation target:

1. prove the repo can inspect side pots, series events, integrity flags, stats, and reconciliation state deterministically before the behavioral work starts.

RED gate:

1. no pot-slice observability exists,
2. no series-timeline source of truth exists,
3. no benchmark corpus exists for the seat agent.

GREEN gate:

1. all required fixture families load,
2. all required observability surfaces exist in test mode,
3. the reserved Phase 22 block is documented exactly once.

Measurable metrics:

1. fixture loader returns non-empty data for all fourteen required families,
2. clean reset shows zero open integrity flags, zero reconciliation mismatches, and zero active time-bank entries,
3. harness output exposes at least one seeded side-pot hand and one seeded series timeline row.

Required doc sync:

1. `specs/24_poker_play_platform_v1_tdd_spec.md`

### M22.1 - Side-pot contract

Purpose:

1. make all-in and side-pot settlement exact and durable.

Primary tests:

1. `e2e/217_poker_play_engine_sidepot_contract.spec.js`
2. `e2e/218_poker_play_engine_sidepot_ui.spec.js`

Evaluation target:

1. prove that seeded three-stack and four-stack all-in hands settle exactly and render the same payouts in player, rail, and admin views.

RED gate:

1. engine still uses one global pot,
2. short stacks can incorrectly win uncovered chips,
3. UI cannot explain multi-pot outcomes.

GREEN gate:

1. hand payload exposes pot slices or equivalent exact payout detail,
2. payout rows match seeded expected winners and amounts,
3. history and admin review reflect the same outcome.

Measurable metrics:

1. side-pot count equals expected seeded value exactly,
2. winner seat numbers per pot equal the expected seeded set exactly,
3. total chips before and after the hand differ by `0`,
4. player and admin payout totals match exactly.

Required doc sync:

1. `specs/02_api_contract.md`

### M22.2 - Odd-chip and showdown policy

Purpose:

1. lock exact split-pot and reveal semantics.

Primary test:

1. `e2e/219_poker_play_engine_odd_chip_contract.spec.js`

Evaluation target:

1. prove that seeded split pots and showdown exposures follow one deterministic rule set.

RED gate:

1. split pots drift by one chip,
2. odd-chip assignment is unstable,
3. rail or player views expose cards they should not.

GREEN gate:

1. odd chip is assigned to the correct seat,
2. showdown-reveal policy is stable,
3. admin review still sees full necessary inspection state.

Measurable metrics:

1. payout amounts equal expected seeded amounts exactly,
2. odd-chip recipient seat number equals the expected seeded seat number exactly,
3. public and admin card-exposure counts match the expected policy exactly.

Required doc sync:

1. `specs/02_api_contract.md`

### M22.3 - Time-bank and disconnect adjudication

Purpose:

1. deepen countdown policy beyond a single reconnect extension.

Primary tests:

1. `e2e/220_poker_play_timebank_contract.spec.js`
2. `e2e/221_poker_play_timebank_ui.spec.js`

Evaluation target:

1. prove that seeded acting seats can use time-bank legally and that timeout resolution stays deterministic after disconnects.

RED gate:

1. no explicit time-bank state exists,
2. timeout policy remains implicit,
3. disconnect and timeout paths are not auditable.

GREEN gate:

1. time-bank state is contract-visible,
2. players can consume time-bank only when policy allows,
3. timeout fallbacks remain deterministic and auditable.

Measurable metrics:

1. time-bank seconds consumed equal the expected seeded amount exactly,
2. action clock extension count equals the expected seeded count exactly,
3. timeout fallback action kind equals the expected seeded action exactly,
4. one audit row exists for each time-bank or timeout event.

Required doc sync:

1. `specs/02_api_contract.md`

### M22.4 - Worker seat-agent contract

Purpose:

1. move seat-agent reasoning onto the worker path.

Primary tests:

1. `e2e/222_poker_play_worker_agent_contract.spec.js`
2. `e2e/223_poker_play_worker_agent_ui.spec.js`

Evaluation target:

1. prove that one seat-agent turn uses the worker-visible tool surface, emits a legal proposal, and shows the same trace in the debug UI.

RED gate:

1. backend still fabricates strategy text directly,
2. worker tool surface is missing,
3. debug tabs do not show the poker seat-agent activity.

GREEN gate:

1. seat-agent proposals originate from the worker flow,
2. proposals are legal and schema-valid,
3. UI renders the proposal without leaking to other seats or rail.

Measurable metrics:

1. legal-action compliance is `100%` across the default seeded corpus,
2. proposal schema validity is `100%`,
3. worker debug trace count is greater than `0` for the seat-agent step,
4. opponent and rail views receive `0` private seat-agent messages.

Required doc sync:

1. `public/skill.md`
2. `e2e/55_phase3_skill_contract_line.spec.js`
3. `docs/internal-skill-testline.md`
4. `specs/02_api_contract.md`

### M22.5 - Seat-agent evaluation harness

Purpose:

1. make real-model quality measurable without polluting the default test lane.

Primary test:

1. `e2e/224_poker_play_worker_agent_eval_contract.spec.js`

Evaluation target:

1. prove that the benchmark lane emits a machine-readable score summary against the seeded poker corpus.

RED gate:

1. no benchmark corpus exists,
2. no machine-readable score output exists,
3. live model evaluation would be required in default CI.

GREEN gate:

1. benchmark fixtures are stable,
2. score output is deterministic in structure,
3. the opt-in command can report objective metrics.

Measurable metrics:

1. result output includes legal-action compliance, amount-legality compliance, schema validity, easy-spot agreement, medium-spot non-blunder rate, and median latency,
2. legal-action compliance and amount-legality compliance both report `100%` on the seeded stub lane,
3. the score summary is machine-readable JSON.

Required doc sync:

1. `README.md`
2. `specs/02_api_contract.md`

### M22.6 - Cash lifecycle controls

Purpose:

1. add reload, sit-out, return, and away/back behavior for cash tables.

Primary tests:

1. `e2e/225_poker_play_cash_lifecycle_contract.spec.js`
2. `e2e/226_poker_play_cash_lifecycle_ui.spec.js`

Evaluation target:

1. prove that a seated player can reload, sit out, return, and preserve exact accounting and seat ownership.

RED gate:

1. reload does not exist,
2. sit-out cannot be represented cleanly,
3. seat status and table summary drift apart.

GREEN gate:

1. reload is exact and auditable,
2. sit-out and return are contract-visible,
3. away/back state does not rotate seat identity.

Measurable metrics:

1. reload changes stack and wallet OIL by the exact same seeded amount,
2. sit-out status is visible on the correct seat only,
3. sit-out seat is excluded from the next-hand acting order exactly once,
4. return reactivates the same seat number and wallet subject.

Required doc sync:

1. `specs/02_api_contract.md`

### M22.7 - Waitlist and seat promotion

Purpose:

1. support deterministic full-table waitlists and promotions.

Primary tests:

1. `e2e/227_poker_play_waitlist_contract.spec.js`
2. `e2e/228_poker_play_waitlist_ui.spec.js`

Evaluation target:

1. prove that full tables accept waitlist entries and promote the correct queued player when a seat opens.

RED gate:

1. full tables have no queue,
2. seat promotion order is ambiguous,
3. table summaries ignore queued demand.

GREEN gate:

1. waitlist order is durable,
2. promotion is deterministic,
3. lobby and table summaries remain consistent.

Measurable metrics:

1. waitlist position equals the seeded queue order exactly,
2. first eligible promoted wallet subject equals the expected seeded wallet subject exactly,
3. promoted seat number equals the expected seeded seat number exactly.

Required doc sync:

1. `specs/02_api_contract.md`

### M22.8 - Tournament-director manual controls

Purpose:

1. let operators override tournament flow safely.

Primary tests:

1. `e2e/229_poker_play_tournament_director_contract.spec.js`
2. `e2e/230_poker_play_tournament_director_ui.spec.js`

Evaluation target:

1. prove that operators can move seats, rebalance, break tables, and close registration without corrupting series state.

RED gate:

1. manual overrides do not exist,
2. overrides are unaudited,
3. seat moves can lose stack or series identity.

GREEN gate:

1. overrides are contract-visible and audited,
2. seat state survives moves intact,
3. series summary updates exactly once per override.

Measurable metrics:

1. moved seat stack, buy-in, and wallet subject equal the seeded before-state exactly,
2. series `tableCount`, `targetTableCount`, and `pendingBreak*` values equal expected seeded values exactly,
3. one audit row exists per override with actor and reason.

Required doc sync:

1. `specs/02_api_contract.md`

### M22.9 - Scheduled starts and re-entry

Purpose:

1. deepen tournament format support beyond ad hoc freezeouts.

Primary tests:

1. `e2e/231_poker_play_tournament_schedule_reentry_contract.spec.js`
2. `e2e/232_poker_play_tournament_schedule_reentry_ui.spec.js`

Evaluation target:

1. prove that scheduled start times and configured re-entry policy behave deterministically.

RED gate:

1. start times are not durable,
2. re-entry policy is absent or ambiguous,
3. re-entry can duplicate or corrupt entrant accounting.

GREEN gate:

1. schedule state is visible and durable,
2. re-entry is accepted or rejected exactly by policy,
3. accounting remains balanced after re-entry.

Measurable metrics:

1. series start time equals the expected seeded timestamp exactly,
2. accepted re-entry count equals the expected seeded count exactly,
3. prize pool and entry count equal the expected seeded totals exactly.

Required doc sync:

1. `specs/02_api_contract.md`

### M22.10 - Player hand history

Purpose:

1. give players one durable, privacy-safe hand-history surface.

Primary tests:

1. `e2e/233_poker_play_hand_history_contract.spec.js`
2. `e2e/234_poker_play_hand_history_ui.spec.js`

Evaluation target:

1. prove that players can browse their table history and only see the card exposure the policy allows.

RED gate:

1. no player-facing history exists,
2. history rows leak opponent private information,
3. ordering is unstable.

GREEN gate:

1. history is ordered and filterable,
2. privacy is preserved,
3. history reconciles to hand and payout rows.

Measurable metrics:

1. history event count equals the expected seeded count exactly,
2. event ordering is stable across repeated reads,
3. opponent private hole-card exposure count equals `0` outside allowed showdown cases.

Required doc sync:

1. `specs/02_api_contract.md`

### M22.11 - Series timeline

Purpose:

1. replace static aggregated export as the only series-wide narrative surface.

Primary tests:

1. `e2e/235_poker_play_series_timeline_contract.spec.js`
2. `e2e/236_poker_play_series_timeline_ui.spec.js`

Evaluation target:

1. prove that the full tournament can be read as one ordered timeline across tables.

RED gate:

1. series review exists only as aggregated export,
2. table-break or move events are not visible in one ordered stream,
3. ordering is unstable across multiple tables.

GREEN gate:

1. timeline exists for admin and public-safe surfaces,
2. table-break, move, payout, dispute, and close events are all represented,
3. ordering is stable and reproducible.

Measurable metrics:

1. timeline event count equals the expected seeded count exactly,
2. event ordering is identical across two repeated reads,
3. public timeline includes `0` private seat-thread bodies.

Required doc sync:

1. `specs/02_api_contract.md`

### M22.12 - Integrity flags and review queue

Purpose:

1. add first-pass suspicious-play detection and operator review.

Primary tests:

1. `e2e/237_poker_play_integrity_flags_contract.spec.js`
2. `e2e/238_poker_play_integrity_review_ui.spec.js`

Evaluation target:

1. prove that seeded suspicious patterns create reviewable flags and that operators can resolve them cleanly.

RED gate:

1. no automated flags exist,
2. no integrity review queue exists,
3. integrity summaries leak private seat content.

GREEN gate:

1. flags are durable and auditable,
2. operator resolution is durable and reasoned,
3. privacy rules still hold.

Measurable metrics:

1. open-flag count equals the seeded expected value exactly,
2. resolved-flag count equals the seeded expected value exactly after review,
3. integrity summary contains `0` private seat-thread bodies,
4. dashboard open-flag count matches the underlying rows exactly.

Required doc sync:

1. `specs/02_api_contract.md`

### M22.13 - Player stats and results

Purpose:

1. expose native live-play results for the current wallet subject.

Primary tests:

1. `e2e/239_poker_play_player_stats_contract.spec.js`
2. `e2e/240_poker_play_player_stats_ui.spec.js`

Evaluation target:

1. prove that one wallet can read its own poker results and that the rollups agree with ledger and standings data.

RED gate:

1. only mirrored operator leaderboards exist,
2. native live-play results are absent,
3. stats can drift from payouts or entries.

GREEN gate:

1. player results route exists,
2. UI renders the current wallet's stats only,
3. stats reconcile to ledger and standings.

Measurable metrics:

1. tournament entries, cashes, wins, and ROI equal expected seeded values exactly,
2. cash-table net OIL equals the seeded ledger-derived amount exactly,
3. reading another wallet subject's private stats is forbidden.

Required doc sync:

1. `specs/02_api_contract.md`

### M22.14 - Ops dashboard

Purpose:

1. give operators one live poker health surface.

Primary tests:

1. `e2e/241_poker_play_ops_dashboard_contract.spec.js`
2. `e2e/242_poker_play_ops_dashboard_ui.spec.js`

Evaluation target:

1. prove that the operator dashboard reports live tables, series, disputes, flags, disconnects, and refunds exactly.

RED gate:

1. no aggregate operator poker surface exists,
2. operators must read multiple routes manually,
3. counts drift from underlying rows.

GREEN gate:

1. dashboard route and UI exist,
2. counts are exact,
3. drill-down links reach the correct operator surfaces.

Measurable metrics:

1. dashboard counts match seeded row counts exactly for live tables, live series, paused tables, disconnected seats, open disputes, open integrity flags, and recent refunds,
2. every dashboard card links to a valid route with non-empty payload.

Required doc sync:

1. `specs/02_api_contract.md`

### M22.15 - Ledger reconciliation

Purpose:

1. close the accounting-hardening gap.

Primary test:

1. `e2e/243_poker_play_ledger_reconciliation_contract.spec.js`

Evaluation target:

1. prove that payouts, refunds, reloads, and balances can be reconciled exactly and that mismatches are reported precisely.

RED gate:

1. no reconciliation contract exists,
2. accounting mismatches are silent or generic,
3. replayed mutations can create ambiguous ledger state.

GREEN gate:

1. reconciliation route exists,
2. clean stores report zero mismatches,
3. corrupted seeded stores report exact mismatches by row identity and category.

Measurable metrics:

1. clean seeded store mismatch count equals `0`,
2. corrupted seeded store mismatch count equals the expected seeded count exactly,
3. mismatch rows include wallet subject, table or series id, ledger entry id, and mismatch category.

Required doc sync:

1. `specs/02_api_contract.md`
