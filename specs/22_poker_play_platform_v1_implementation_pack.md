# Poker Play Platform v1 Implementation Pack

Status: Draft planning pack  
Date: 2026-03-11  
Scope: productionize Agent Town Poker Play into a full human + AI 6-max cash and tournament platform with deterministic contracts, measurable evaluation, and operator-safe controls  
Depends on: [specs/02_api_contract.md](./02_api_contract.md), [specs/21_remaining_gap_closure_tdd_spec.md](./21_remaining_gap_closure_tdd_spec.md), [AGENTS.md](../AGENTS.md)  
Companion backlog: [specs/23_poker_play_platform_v1_backlog.md](./23_poker_play_platform_v1_backlog.md)  
Companion TDD spec: [specs/24_poker_play_platform_v1_tdd_spec.md](./24_poker_play_platform_v1_tdd_spec.md)

This document turns the current poker branch from a playable alpha into a production-grade implementation plan. It is intentionally narrower than "a full real-money poker room" and stricter than the current implementation. The goal is to close the remaining poker gaps without breaking the repo's worker-first, modal-first, wallet-first rules.

## 1. Executive summary

The current branch already has:

1. playable 6-max cash and tournament tables,
2. private seat threads,
3. live clocks and push hints,
4. multi-table tournament series,
5. public rail views,
6. offchain OIL buy-ins, payouts, refunds, and table closure controls.

It does not yet have:

1. exact side-pot and odd-chip correctness for all-in situations,
2. a real worker-backed seat agent,
3. complete cash-room seat lifecycle behavior,
4. tournament-director override tooling,
5. player-facing hand history and series timeline surfaces,
6. integrity and anti-collusion review tooling,
7. native live-play stats and operator dashboards,
8. hardened reconciliation and accounting visibility.

Phase 22 closes those gaps in a contracts-first order:

1. engine correctness and accounting,
2. worker-backed seat agent and evaluation harness,
3. seat lifecycle and lobby depth,
4. tournament-director depth and format expansion,
5. history, integrity, and player results,
6. operator control, reconciliation, and observability.

## 2. Normative product decisions

The following decisions are binding for this program.

1. Poker remains modal-first from the town hub. `/poker/play*` must remain usable inside the existing hub modal flow.
2. Wallet-first identity remains mandatory. A poker seat belongs to the bound wallet subject, not to a transient browser credential.
3. OIL remains offchain and database-authoritative in this phase.
4. Tournament settlement remains offchain and database-authoritative in this phase.
5. The server is authoritative for poker legality, table state, countdowns, accounting, payouts, disputes, and director actions.
6. The browser worker is authoritative for seat-agent reasoning, tool selection, and human + agent co-op assistance.
7. The server must not fabricate strategic advice that bypasses the worker for the long-term product path.
8. Private seat discussion remains seat-private. Rail and opponent views never receive another seat's private thread.
9. Default `npm test` must remain deterministic and offline-safe.
10. Real-model or live-provider evaluation lanes must be explicit opt-in commands.

## 3. Product surface to ship

Phase 22 targets one coherent poker product, not disconnected features.

### 3.1 Cash room

Required capabilities:

1. create or match into public 6-max cash tables,
2. waitlist full tables,
3. reload chips from OIL,
4. sit out next hand,
5. mark away and reconnect,
6. cash out between hands or queue a leave during a live hand,
7. view personal hand history and results.

### 3.2 Tournament room

Required capabilities:

1. create or register for 6-max tournaments,
2. run one or more linked tables in a series,
3. progress blind levels and antes deterministically,
4. support late registration and re-entry where configured,
5. converge to a final table,
6. expose final standings and payout ladders,
7. expose series-level replay, review, and audit state.

### 3.3 Human + agent centaur seat

Required capabilities:

1. each seat has one private human + agent thread,
2. the agent reads live seat state through worker tools,
3. the agent can propose legal actions and sizes,
4. the human remains the final actor unless automation is explicitly enabled by product policy,
5. the seat thread remains auditable without leaking private reasoning to opponents.

### 3.4 Public rail

Required capabilities:

1. anonymous live table rail,
2. anonymous series rail,
3. public action history and showdown visibility,
4. no private seat thread leakage,
5. no actionable controls in rail payloads.

### 3.5 Operator desk

Required capabilities:

1. pause and resume tables,
2. manually move seats or break tables in tournaments,
3. force late-registration close,
4. force-start or resume a stuck table when policy allows,
5. cancel and refund tables or whole series,
6. review disputes, integrity flags, and audit trails,
7. export table and series reviews,
8. view live health, disconnected seats, and accounting anomalies.

## 4. Authority matrix

| Concern | Authoritative layer | Notes |
|---|---|---|
| Seat ownership | Server | Bound to wallet subject and current house/session context |
| Table legality | Server | Fold/check/call/bet/raise/shove/time-bank legality is server-owned |
| Pot accounting | Server | Side pots, odd chips, payouts, refunds, and reconciliation are server-owned |
| Tournament director policy | Server | Balancing, break targets, re-entry, and close policy are server-owned |
| Human + agent reasoning | Browser worker | Use worker tools and skill contracts, not backend heuristics |
| Seat-private thread rendering | Shared | Server stores durable messages, browser renders and initiates worker actions |
| Public rail | Server | Sanitized view over table and series state |
| Review and audit export | Server | Exportable JSON must reflect durable state exactly |
| Strategy benchmarking | Shared | Server provides fixture corpus and score contract; worker or eval harness executes the agent |

## 5. Gameplay correctness requirements

Phase 22 must harden the current holdem engine to exact, testable behavior.

### 5.1 Required hand-state features

The engine must support:

1. fold,
2. check,
3. call,
4. bet,
5. raise,
6. shove,
7. timeout fallback,
8. optional time-bank use when configured,
9. side pots,
10. split pots,
11. odd-chip assignment,
12. showdown with only the required card exposure policy.

### 5.2 Pot and showdown rules

Rules:

1. Every all-in hand must compute one main pot and zero or more side pots.
2. A seat may win only the pots it is eligible for.
3. Split pots must divide chips deterministically.
4. Any odd chip must be assigned deterministically to the earliest winning seat clockwise from the button.
5. Showdown must reveal only the cards required by the result:
   - all live seats at showdown may be revealed in admin review,
   - public rail sees only showdown-revealed cards,
   - folded mucked hands stay hidden outside admin review.
6. Hand history must preserve every action, pot slice, board card, winner, and payout amount exactly.

### 5.3 Tournament blind and ante rules

Rules:

1. Tournament blind levels must remain deterministic and durable.
2. Antes are required for tournament support in this phase.
3. Straddles are explicitly out of scope for this phase.
4. Time-bank policy may differ between cash and tournament tables, but must be contract-visible.

## 6. Seat-agent architecture

The current server-generated heuristic suggestions are a temporary stopgap. Phase 22 replaces that path with a worker-backed seat agent contract.

### 6.1 Seat-agent rules

1. The seat agent runs through the in-browser worker/runtime.
2. `public/skill.md` remains the source of truth for the external playbook.
3. The server may persist agent messages and action proposals, but it must not invent them outside the worker path in the steady-state design.
4. The seat agent may propose:
   - one or more legal actions,
   - optional target amounts,
   - a confidence label,
   - a short explanation tied to live state.
5. The seat agent must never propose an illegal action.
6. The seat agent must never bypass the server legality gate.

### 6.2 Required worker tool surface

Phase 22 requires worker-visible poker tools at minimum:

1. `poker_state_get_table`
2. `poker_state_get_hand_history`
3. `poker_state_get_series_timeline`
4. `poker_state_get_my_results`
5. `poker_thread_post_note`
6. `poker_action_propose`
7. `poker_action_commit`

These tool names are normative placeholders until the final skill and tool dictionary lands. They must remain readable and testable from the worker debug tabs.

### 6.3 Seat-agent benchmark harness

The AI-evaluation lane must score the seat agent on a seeded fixture corpus.

Required benchmark dimensions:

1. legal-action compliance,
2. size legality,
3. timeout handling,
4. reasoning schema validity,
5. response latency,
6. agreement on expert-labeled easy spots,
7. non-blunder rate on medium spots.

Default repo behavior:

1. `npm test` uses deterministic fixture-backed tests and does not require a live model.
2. an explicit opt-in eval command runs the real seat-agent benchmark against the configured model/runtime.

## 7. Cash-room lifecycle requirements

Phase 22 must make the cash room feel like a real table, not only a join/leave demo.

Required behaviors:

1. reload chips between hands,
2. reject reloads that would violate table buy-in rules,
3. sit out next hand without leaving the table,
4. return from sit-out when eligible,
5. away/back presence state,
6. full-table waitlist and deterministic promotion when a seat opens,
7. clear public and private seat status rendering.

Out of scope for this phase:

1. table-change network,
2. dealer's choice variants,
3. rakeback or promotions.

## 8. Tournament-director requirements

The current automatic balancing logic is not enough for production tournament control.

Phase 22 must add operator-visible director actions:

1. manual seat move,
2. manual table break,
3. manual rebalance override,
4. force late-registration close,
5. force level advance only when policy allows,
6. force table start or table stop with audit note,
7. schedule future tournament starts,
8. support optional re-entry policy,
9. support optional ante schedules tied to tournament blind structures.

Tournament formats required in this phase:

1. freezeout,
2. freezeout with late registration,
3. freezeout with re-entry,
4. scheduled series with deterministic start times.

Deferred beyond this phase:

1. satellite qualification trees,
2. bounty or PKO accounting,
3. mixed games,
4. one-time rebuy or add-on formats,
5. multi-flight day 1 structures.

## 9. History, integrity, stats, and ops

### 9.1 Hand history and replay

Required surfaces:

1. player-facing hand history browser for a table,
2. player-facing personal results feed,
3. series-level ordered timeline across all tables,
4. admin replay and export tied to the same durable history rows.

### 9.2 Integrity and anti-collusion

Required first-pass integrity features:

1. suspicious wallet overlap flags,
2. suspicious house overlap flags,
3. repetitive transfer-pattern or chip-dump heuristics,
4. repeated soft-play heuristics,
5. integrity review queue in admin surfaces,
6. durable audit events for every integrity flag state change.

This phase does not attempt "perfect collusion detection." It must ship measurable first-pass heuristics and review tooling.

### 9.3 Player stats and results

Required stats:

1. cash results by session and lifetime,
2. tournament entries, cashes, wins, and ROI,
3. live seat summary for the current wallet subject,
4. deterministic player-result API contracts,
5. no cross-wallet data leakage.

### 9.4 Operator dashboard

Required operator metrics:

1. live tables,
2. live series,
3. disconnected seats,
4. paused tables,
5. open disputes,
6. open integrity flags,
7. recent refunds,
8. recent payout jobs,
9. reconciliation mismatches.

## 10. Data-model additions

Phase 22 requires the following durable object families beyond the current alpha:

1. `poker_play_hand_history_events`
2. `poker_play_pot_slices`
3. `poker_play_timebank_events`
4. `poker_play_waitlist_entries`
5. `poker_play_series_events`
6. `poker_play_integrity_flags`
7. `poker_play_integrity_reviews`
8. `poker_play_player_stats`
9. `poker_play_ledger_reconciliations`
10. `poker_play_agent_eval_runs`
11. `poker_play_agent_eval_results`

Minimum persistence rules:

1. every mutable action is idempotent where replay risk exists,
2. every admin override writes an audit row,
3. every payout or refund is reconcilable to hand, table, series, and wallet subject,
4. table-level and series-level exports are reproducible from durable rows.

## 11. API expansion summary

Exact request and response shapes belong in [specs/02_api_contract.md](./02_api_contract.md) when implementation starts. This pack freezes the route families that must exist.

### 11.1 Player routes

Required new player routes:

1. `POST /api/poker/play/tables/:tableId/reload`
2. `POST /api/poker/play/tables/:tableId/sit-out`
3. `POST /api/poker/play/tables/:tableId/return`
4. `POST /api/poker/play/tables/:tableId/waitlist`
5. `DELETE /api/poker/play/tables/:tableId/waitlist`
6. `GET /api/poker/play/tables/:tableId/history`
7. `GET /api/poker/play/series/:seriesId/timeline`
8. `GET /api/poker/play/results/me`

### 11.2 Director and admin routes

Required new admin routes:

1. `POST /api/poker/play/admin/tables/:tableId/move-seat`
2. `POST /api/poker/play/admin/series/:seriesId/rebalance`
3. `POST /api/poker/play/admin/series/:seriesId/break-table`
4. `POST /api/poker/play/admin/series/:seriesId/close-registration`
5. `POST /api/poker/play/admin/series/:seriesId/advance-level`
6. `GET /api/poker/play/admin/series/:seriesId/timeline`
7. `GET /api/poker/play/admin/integrity`
8. `POST /api/poker/play/admin/integrity/:flagId/review`
9. `GET /api/poker/play/admin/dashboard`
10. `GET /api/poker/play/admin/reconciliation`

### 11.3 Evaluation routes

Required explicit opt-in evaluation surface:

1. deterministic test fixtures for seat-agent benchmark cases,
2. one admin or test-mode route family to inspect benchmark results,
3. no requirement for a live model in default CI.

## 12. Non-goals for this phase

The following items are explicitly out of scope for Phase 22:

1. onchain OIL minting or transfer,
2. onchain tournament settlement,
3. real-money fiat or stablecoin custody,
4. advanced solver or GTO proof generation,
5. satellite networks or multi-flight festival scheduling,
6. mixed poker variants outside no-limit holdem,
7. native mobile applications.

## 13. Delivery order

The intended delivery order is:

1. exact engine and accounting correctness,
2. time-bank and reconnect hardening,
3. worker-backed seat agent plus benchmark harness,
4. cash-room lifecycle and waitlist,
5. tournament-director controls and schedule depth,
6. hand history, timeline, and results,
7. integrity flags and operator queue,
8. dashboard and reconciliation.

This order is mandatory because each later layer depends on the correctness and auditability of the earlier one.
