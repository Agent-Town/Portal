# Poker Play Platform v1 Backlog

Status: Draft implementation backlog  
Date: 2026-03-11  
Depends on: [specs/22_poker_play_platform_v1_implementation_pack.md](./22_poker_play_platform_v1_implementation_pack.md)  
Companion TDD spec: [specs/24_poker_play_platform_v1_tdd_spec.md](./24_poker_play_platform_v1_tdd_spec.md)

This backlog converts the remaining poker gaps into a phased roadmap for agentic AI developers. It is intentionally explicit about order, doc-sync, and measurable outcomes so the work can be parallelized without breaking correctness.

## 1. Cross-cutting delivery rules

These rules apply to every ticket below.

1. No ticket is done until the API contract, affected specs, and deterministic tests are updated in the same change set.
2. No ticket may weaken the modal-first poker entry policy.
3. No ticket may move seat-agent reasoning into the backend as a permanent shortcut.
4. No ticket may introduce live-provider dependencies into the default `npm test` lane.
5. No accounting mutation is done until the corresponding audit and reconciliation surfaces are testable.
6. No tournament-director override is done unless it writes an explicit audit row with actor identity and reason.
7. No private seat-thread or hole-card data may leak into rail, exports intended for public use, or another seat's player view.

## 2. Mandatory doc-sync matrix

| Changed surface | Required docs and tests |
|---|---|
| Poker HTTP route or JSON envelope | `specs/02_api_contract.md` |
| Seat-agent worker tools or skill behavior | `public/skill.md`, `e2e/55_phase3_skill_contract_line.spec.js`, `docs/internal-skill-testline.md` |
| Poker modal/deep-link or rail UX | `specs/15_experience_os_intent_tools_tdd_spec.md`, this backlog, the companion TDD spec |
| Accounting or payout semantics | `specs/02_api_contract.md`, this backlog, the companion TDD spec |
| Admin or integrity workflow | `specs/02_api_contract.md`, this backlog, the companion TDD spec |
| New opt-in evaluation command | `README.md`, this backlog, the companion TDD spec |

## 3. Reserved deterministic test block

To avoid file-number collisions, this program reserves the following new Playwright files:

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

Supplemental non-Playwright verification lanes allowed in this phase:

1. `npm run verify:poker-play-engine`
2. `npm run eval:poker-seat-agent`
3. `npm run verify:poker-ledger`

## 4. Phase roadmap

### Phase A - Engine correctness and accounting

Goal:

1. make all-in, side-pot, split-pot, odd-chip, and showdown behavior exact,
2. add time-bank and stronger timeout policy,
3. make payouts and refunds reconcilable.

Bundle gate:

1. existing poker suite stays green,
2. new tests `216` to `221` pass,
3. ledger verification command passes on seeded hands.

### Phase B - Worker-backed seat agent

Goal:

1. replace backend heuristic suggestions with worker-backed seat-agent behavior,
2. expose the seat-agent tool surface in debug tabs,
3. add an explicit deterministic evaluation harness.

Bundle gate:

1. new tests `222` to `224` pass,
2. skill and worker docs are updated together,
3. agent eval command emits a machine-readable summary.

### Phase C - Cash-room lifecycle and lobby depth

Goal:

1. make cash tables feel like real tables,
2. add reload, sit-out, away/back, and waitlist behavior,
3. make full-table seat promotion deterministic.

Bundle gate:

1. new tests `225` to `228` pass,
2. no seat-private leaks appear in rail or opponent views,
3. accounting remains balanced after reload and cash-out flows.

### Phase D - Tournament-director depth

Goal:

1. add manual director controls,
2. add scheduled starts and configured re-entry,
3. make tournament flow operable even when the automatic policy needs override.

Bundle gate:

1. new tests `229` to `232` pass,
2. every override writes an audit row,
3. no director action creates an unbalanced series summary.

### Phase E - History, integrity, and player results

Goal:

1. ship player-facing hand history and series timeline,
2. ship integrity flags and review queue,
3. ship native live-play results and stats.

Bundle gate:

1. new tests `233` to `240` pass,
2. hand-history exports reconcile to table and series state,
3. integrity flags are durable, reviewable, and non-leaking.

### Phase F - Operator dashboard and reconciliation

Goal:

1. ship one operator poker dashboard,
2. expose live health and accounting anomalies,
3. lock a deterministic reconciliation contract over payouts, refunds, and balances.

Bundle gate:

1. new tests `241` to `243` pass,
2. dashboard counts match seeded rows exactly,
3. reconciliation reports exact mismatches, not generic failure.

## 5. Tickets

## PPK-201 - Exact all-in and side-pot engine

- Priority: P0
- Phase: A
- Depends on: none
- Goal: replace the single-pot simplification with exact main-pot and side-pot behavior.
- Deliverables:
- main-pot and side-pot state model
- eligible-winner mapping per pot slice
- durable hand-history rows for pot slices
- Acceptance criteria:
- one hand with three different stack depths settles deterministically
- ineligible short-stack winners cannot win chips from pots they never covered
- table payload and review payload expose the same payout truth
- Suggested tests:
- `e2e/217_poker_play_engine_sidepot_contract.spec.js`
- `e2e/218_poker_play_engine_sidepot_ui.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## PPK-202 - Odd-chip, split-pot, and showdown policy

- Priority: P0
- Phase: A
- Depends on: PPK-201
- Goal: lock exact split-pot, odd-chip, and reveal behavior.
- Deliverables:
- odd-chip assignment rule
- showdown reveal policy
- hand-history exposure policy
- Acceptance criteria:
- split pots divide exactly
- odd chips are assigned deterministically
- rail reveals only the allowed cards
- Suggested tests:
- `e2e/219_poker_play_engine_odd_chip_contract.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## PPK-203 - Time-bank and disconnect adjudication

- Priority: P0
- Phase: A
- Depends on: PPK-201
- Goal: move from one grace extension to a clearer action-clock and time-bank policy.
- Deliverables:
- configurable time-bank fields
- explicit use-time-bank action
- timeout audit rows
- Acceptance criteria:
- acting seat can consume time-bank exactly when allowed
- disconnected seat policy is deterministic
- timeout fallback is contract-visible
- Suggested tests:
- `e2e/220_poker_play_timebank_contract.spec.js`
- `e2e/221_poker_play_timebank_ui.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## PPK-204 - Worker-backed seat-agent contract

- Priority: P0
- Phase: B
- Depends on: PPK-201
- Goal: route seat-agent reasoning through the worker instead of backend heuristics.
- Deliverables:
- worker-visible poker tool surface
- durable proposal contract
- private seat-thread integration
- Acceptance criteria:
- seat agent only emits legal actions
- backend does not fabricate strategic lines when worker mode is enabled
- debug tabs expose the new tool surface and traffic
- Suggested tests:
- `e2e/222_poker_play_worker_agent_contract.spec.js`
- `e2e/223_poker_play_worker_agent_ui.spec.js`
- Required doc sync:
- `public/skill.md`
- `e2e/55_phase3_skill_contract_line.spec.js`
- `docs/internal-skill-testline.md`
- `specs/02_api_contract.md`

## PPK-205 - Seat-agent benchmark harness

- Priority: P0
- Phase: B
- Depends on: PPK-204
- Goal: give agentic developers an objective benchmark lane for poker-seat quality.
- Deliverables:
- deterministic benchmark corpus
- machine-readable score output
- explicit opt-in eval command
- Acceptance criteria:
- legal-action compliance is scored
- size legality is scored
- latency and schema validity are scored
- Suggested tests:
- `e2e/224_poker_play_worker_agent_eval_contract.spec.js`
- Required doc sync:
- `README.md`
- `specs/02_api_contract.md`

## PPK-206 - Cash lifecycle controls

- Priority: P1
- Phase: C
- Depends on: PPK-201
- Goal: add reload, sit-out, and away/back lifecycle behavior to cash tables.
- Deliverables:
- reload endpoint
- sit-out and return endpoints
- seat status rendering
- Acceptance criteria:
- reload never breaks OIL accounting
- sit-out skips the seat correctly
- away/back does not rotate seat ownership
- Suggested tests:
- `e2e/225_poker_play_cash_lifecycle_contract.spec.js`
- `e2e/226_poker_play_cash_lifecycle_ui.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## PPK-207 - Waitlist and seat-fill policy

- Priority: P1
- Phase: C
- Depends on: PPK-206
- Goal: support full-table waitlists with deterministic promotion.
- Deliverables:
- join waitlist endpoint
- leave waitlist endpoint
- promotion rules and audit rows
- Acceptance criteria:
- full tables reject direct seats and accept waitlist entries
- first eligible waitlist entry is promoted when a seat opens
- rail and lobby summaries stay consistent
- Suggested tests:
- `e2e/227_poker_play_waitlist_contract.spec.js`
- `e2e/228_poker_play_waitlist_ui.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## PPK-208 - Tournament-director manual controls

- Priority: P0
- Phase: D
- Depends on: PPK-201
- Goal: let operators correct tournament flow when automation is not enough.
- Deliverables:
- manual move-seat route
- manual rebalance route
- manual table-break route
- manual registration-close route
- Acceptance criteria:
- series summary remains balanced after overrides
- every override writes audit data with actor and reason
- moved seats do not lose stack, seat identity, or payout eligibility
- Suggested tests:
- `e2e/229_poker_play_tournament_director_contract.spec.js`
- `e2e/230_poker_play_tournament_director_ui.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## PPK-209 - Scheduled tournaments and re-entry

- Priority: P1
- Phase: D
- Depends on: PPK-208
- Goal: deepen tournament formats beyond ad hoc freezeouts.
- Deliverables:
- scheduled start window
- one or more configured re-entry policies
- optional ante schedule
- Acceptance criteria:
- series start time is durable and visible
- re-entry is accepted or rejected deterministically by policy
- tournament accounting remains balanced after re-entry
- Suggested tests:
- `e2e/231_poker_play_tournament_schedule_reentry_contract.spec.js`
- `e2e/232_poker_play_tournament_schedule_reentry_ui.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## PPK-210 - Hand history and personal results

- Priority: P1
- Phase: E
- Depends on: PPK-201
- Goal: ship player-facing history and results, not only admin exports.
- Deliverables:
- table hand-history route
- player results route
- UI surfaces for both
- Acceptance criteria:
- history is ordered and filterable
- one player cannot read another player's private hole cards
- results match the OIL ledger and tournament standings
- Suggested tests:
- `e2e/233_poker_play_hand_history_contract.spec.js`
- `e2e/234_poker_play_hand_history_ui.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## PPK-211 - Series timeline and replay

- Priority: P1
- Phase: E
- Depends on: PPK-208
- Goal: expose one ordered series timeline instead of only aggregated export JSON.
- Deliverables:
- series timeline route
- public and admin timeline renderers
- export parity with the same durable rows
- Acceptance criteria:
- timeline includes starts, breaks, moves, disputes, payouts, refunds, and closure
- ordering is deterministic across multiple tables
- replay and export agree on counts
- Suggested tests:
- `e2e/235_poker_play_series_timeline_contract.spec.js`
- `e2e/236_poker_play_series_timeline_ui.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## PPK-212 - Integrity flags and anti-collusion review

- Priority: P0
- Phase: E
- Depends on: PPK-201
- Goal: add first-pass automated suspicious-play detection and operator review.
- Deliverables:
- integrity flag generation
- integrity review queue
- operator resolution actions
- Acceptance criteria:
- seeded suspicious patterns create durable flags
- operators can resolve or dismiss flags with notes
- no private seat-thread data leaks into integrity summaries
- Suggested tests:
- `e2e/237_poker_play_integrity_flags_contract.spec.js`
- `e2e/238_poker_play_integrity_review_ui.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## PPK-213 - Player stats and profile summary

- Priority: P1
- Phase: E
- Depends on: PPK-210
- Goal: expose native live-play results and stats for the current wallet subject.
- Deliverables:
- stats aggregation rows
- player-facing results panel
- series placement history
- Acceptance criteria:
- lifetime totals are deterministic from seeded history
- current-wallet-only privacy is preserved
- standings, payouts, and player stats agree
- Suggested tests:
- `e2e/239_poker_play_player_stats_contract.spec.js`
- `e2e/240_poker_play_player_stats_ui.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## PPK-214 - Operator dashboard and reconciliation

- Priority: P0
- Phase: F
- Depends on: PPK-201, PPK-208, PPK-212
- Goal: give operators one live health and accounting view over the poker system.
- Deliverables:
- dashboard route and UI
- reconciliation route
- exact mismatch reporting
- Acceptance criteria:
- dashboard counts equal seeded rows exactly
- reconciliation identifies mismatches by wallet, table, series, and ledger entry
- no generic "failed" output is acceptable when a mismatch exists
- Suggested tests:
- `e2e/241_poker_play_ops_dashboard_contract.spec.js`
- `e2e/242_poker_play_ops_dashboard_ui.spec.js`
- `e2e/243_poker_play_ledger_reconciliation_contract.spec.js`
- Required doc sync:
- `specs/02_api_contract.md`

## 6. Follow-on backlog after Phase 22

These items are real but intentionally deferred until the Phase 22 core is green:

1. bounty and PKO tournament accounting,
2. sit-and-go fill policy variants,
3. private/invite-only table controls,
4. responsible-gaming and policy limits,
5. richer real-time transport beyond push-hint SSE,
6. onchain attestations or proof bridges for OIL and tournament settlement.
