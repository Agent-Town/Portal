# Poker Play Platform v2 Scaling and Format Depth Backlog

Status: Draft implementation backlog  
Date: 2026-03-12  
Depends on: [specs/25_poker_play_platform_v2_scaling_implementation_pack.md](./25_poker_play_platform_v2_scaling_implementation_pack.md)  
Companion TDD spec: [specs/27_poker_play_platform_v2_scaling_tdd_spec.md](./27_poker_play_platform_v2_scaling_tdd_spec.md)

This backlog converts the next poker-scale gaps into a phased roadmap for agentic AI developers. It assumes the current Phase 22 work is already green and treats the room as a real product surface, not only a rules engine.

## 1. Cross-Cutting Delivery Rules

1. No ticket is done until `specs/02_api_contract.md`, affected specs, and deterministic tests are updated together.
2. No ticket may weaken modal-first poker entry.
3. No ticket may reintroduce backend-only strategic shortcuts for the seat agent.
4. No ticket may remove or weaken privacy boundaries around seat-private notes, notebooks, or auto-act state.
5. No transport ticket is done unless a deterministic in-memory adapter remains available for local tests.
6. No economy mutation is done unless treasury, player, and reconciliation surfaces remain exact.
7. No schedule or format ticket may create ambiguous payout or registration state.

## 2. Mandatory Doc-Sync Matrix

| Changed surface | Required docs and tests |
|---|---|
| Live transport or websocket envelope | `specs/02_api_contract.md`, this backlog, the companion TDD spec |
| Seat movement, blind policy, or tournament waitlist | `specs/02_api_contract.md`, this backlog, the companion TDD spec |
| Player note, review, or export behavior | `specs/02_api_contract.md`, this backlog, the companion TDD spec |
| Seat-agent automation or shove UX | `public/skill.md`, `docs/internal-skill-testline.md`, `e2e/55_phase3_skill_contract_line.spec.js`, `specs/02_api_contract.md` |
| Economy or treasury semantics | `specs/02_api_contract.md`, this backlog, the companion TDD spec |
| Event schedule or tournament format behavior | `specs/02_api_contract.md`, this backlog, the companion TDD spec |

## 3. Reserved Deterministic Test Block

To avoid file-number collisions, this phase reserves:

1. `e2e/254_poker_play_live_transport_contract.spec.js`
2. `e2e/255_poker_play_live_transport_ui.spec.js`
3. `e2e/256_poker_play_live_transport_recovery_contract.spec.js`
4. `e2e/257_poker_play_multi_instance_pubsub_contract.spec.js`
5. `e2e/258_poker_play_cash_seat_change_contract.spec.js`
6. `e2e/259_poker_play_cash_seat_change_ui.spec.js`
7. `e2e/260_poker_play_cash_table_transfer_contract.spec.js`
8. `e2e/261_poker_play_cash_table_transfer_ui.spec.js`
9. `e2e/262_poker_play_blind_obligation_contract.spec.js`
10. `e2e/263_poker_play_missed_blind_ui.spec.js`
11. `e2e/264_poker_play_tournament_waitlist_contract.spec.js`
12. `e2e/265_poker_play_tournament_waitlist_ui.spec.js`
13. `e2e/266_poker_play_study_notebook_contract.spec.js`
14. `e2e/267_poker_play_study_notebook_ui.spec.js`
15. `e2e/268_poker_play_opponent_notes_contract.spec.js`
16. `e2e/269_poker_play_post_hand_review_ui.spec.js`
17. `e2e/270_poker_play_hand_history_export_contract.spec.js`
18. `e2e/271_poker_play_auto_act_contract.spec.js`
19. `e2e/272_poker_play_auto_act_ui.spec.js`
20. `e2e/273_poker_play_shove_action_ui.spec.js`
21. `e2e/274_poker_play_treasury_rake_contract.spec.js`
22. `e2e/275_poker_play_season_rankings_contract.spec.js`
23. `e2e/276_poker_play_schedule_calendar_ui.spec.js`
24. `e2e/277_poker_play_scheduled_breaks_contract.spec.js`
25. `e2e/278_poker_play_satellite_contract.spec.js`
26. `e2e/279_poker_play_rebuy_addon_contract.spec.js`
27. `e2e/280_poker_play_multiflight_contract.spec.js`
28. `e2e/281_poker_play_bounty_models_contract.spec.js`
29. `e2e/282_poker_play_chop_deal_contract.spec.js`

Supplemental non-Playwright verification lanes allowed in this phase:

1. `npm run verify:poker-transport`
2. `npm run verify:poker-pubsub`
3. `npm run verify:poker-economy`
4. `npm run eval:poker-auto-act`

## 4. Phase Roadmap

### Phase G - Live Transport and Multi-Instance Scale

Goal:

1. replace SSE hinting with websocket plus delta transport,
2. add multi-instance fanout,
3. preserve deterministic resync and fallback behavior.

Bundle gate:

1. new tests `254` to `257` pass,
2. reconnect and replay are deterministic,
3. transport failure does not corrupt view state.

### Phase H - Cash Operations and Blind Policy

Goal:

1. deepen cash-table seat movement,
2. add table transfer,
3. add stronger blind-posting and missed-blind rules,
4. add tournament waitlists.

Bundle gate:

1. new tests `258` to `265` pass,
2. no stack or blind drift appears after seat operations,
3. audit and results surfaces stay exact.

### Phase I - Study and Player Workflow

Goal:

1. add notebook and opponent notes,
2. add structured post-hand review,
3. add player-friendly export.

Bundle gate:

1. new tests `266` to `270` pass,
2. note privacy remains intact,
3. exports reconcile to durable history.

### Phase J - Centaur Automation and Action UX

Goal:

1. add opt-in auto-act,
2. add explicit shove UX,
3. keep worker-first decision flow intact.

Bundle gate:

1. new tests `271` to `273` pass,
2. auto-act remains revocable and audit-visible,
3. shove actions stay legal and explicit.

### Phase K - Economy and Native Seasons

Goal:

1. add rake and treasury logic,
2. add native live-play seasonal rankings,
3. harden economy policy.

Bundle gate:

1. new tests `274` to `275` pass,
2. treasury rows reconcile exactly,
3. seasonal rankings derive only from durable live-play rows.

### Phase L - Schedule Product and Format Depth

Goal:

1. add event calendar and recurring schedule,
2. add scheduled breaks,
3. expand tournament formats.

Bundle gate:

1. new tests `276` to `282` pass,
2. registrations, payouts, and progression remain deterministic,
3. event and format state are audit-visible and export-safe.

## 5. Tickets

## PPK-301 - Websocket table transport

- Priority: P0
- Phase: G
- Goal: replace table SSE push hints with websocket snapshots and deltas.
- Deliverables:
- websocket subscribe flow
- snapshot plus delta envelopes
- versioned replay or reset handling
- Acceptance criteria:
- one table can stream updates without full rereads on every action
- stale version clients are told to resync deterministically
- player and rail channels stay privacy-safe
- Suggested tests:
- `e2e/254_poker_play_live_transport_contract.spec.js`
- `e2e/255_poker_play_live_transport_ui.spec.js`

## PPK-302 - Transport recovery and version replay

- Priority: P0
- Phase: G
- Depends on: PPK-301
- Goal: make reconnect and missed-delta handling deterministic.
- Deliverables:
- last-seen version checkpointing
- replay or reset path
- fallback-to-snapshot path
- Suggested tests:
- `e2e/256_poker_play_live_transport_recovery_contract.spec.js`

## PPK-303 - Multi-instance pub/sub bus

- Priority: P0
- Phase: G
- Depends on: PPK-301
- Goal: introduce a repo-owned bus abstraction with deterministic local and scalable production adapters.
- Deliverables:
- in-memory adapter
- production adapter contract
- publish after durable mutation policy
- Suggested tests:
- `e2e/257_poker_play_multi_instance_pubsub_contract.spec.js`

## PPK-304 - Cash seat change

- Priority: P0
- Phase: H
- Goal: let cash players move seats between hands without stack or identity corruption.
- Deliverables:
- seat change route
- audit rows
- updated table and result surfaces
- Suggested tests:
- `e2e/258_poker_play_cash_seat_change_contract.spec.js`
- `e2e/259_poker_play_cash_seat_change_ui.spec.js`

## PPK-305 - Cash table transfer

- Priority: P0
- Phase: H
- Depends on: PPK-304
- Goal: let cash players transfer to a compatible table between hands.
- Deliverables:
- compatible-table resolver
- transfer ledger path
- audit-visible move chain
- Suggested tests:
- `e2e/260_poker_play_cash_table_transfer_contract.spec.js`
- `e2e/261_poker_play_cash_table_transfer_ui.spec.js`

## PPK-306 - Blind obligations and missed blinds

- Priority: P0
- Phase: H
- Goal: deepen cash blind policy.
- Deliverables:
- blind obligation store
- missed blind state machine
- return-to-action policy
- Suggested tests:
- `e2e/262_poker_play_blind_obligation_contract.spec.js`
- `e2e/263_poker_play_missed_blind_ui.spec.js`

## PPK-307 - Tournament waitlists

- Priority: P1
- Phase: H
- Goal: support scheduled-event and full-event waitlists.
- Deliverables:
- tournament waitlist routes
- promotion policy
- registration state updates
- Suggested tests:
- `e2e/264_poker_play_tournament_waitlist_contract.spec.js`
- `e2e/265_poker_play_tournament_waitlist_ui.spec.js`

## PPK-308 - Coach notebook

- Priority: P1
- Phase: I
- Goal: add a persistent private study notebook.
- Deliverables:
- notebook CRUD
- bindings to hand, table, series, and opponent
- worker-authorable entries
- Suggested tests:
- `e2e/266_poker_play_study_notebook_contract.spec.js`
- `e2e/267_poker_play_study_notebook_ui.spec.js`

## PPK-309 - Opponent notes

- Priority: P1
- Phase: I
- Goal: let players keep durable notes on opponents.
- Deliverables:
- opponent note store
- live-table note surface
- privacy guardrails
- Suggested tests:
- `e2e/268_poker_play_opponent_notes_contract.spec.js`

## PPK-310 - Structured post-hand review

- Priority: P1
- Phase: I
- Goal: turn history into a real study workflow.
- Deliverables:
- post-hand review view model
- lesson tagging
- notebook save actions
- Suggested tests:
- `e2e/269_poker_play_post_hand_review_ui.spec.js`

## PPK-311 - Player hand-history export

- Priority: P1
- Phase: I
- Goal: add player-friendly export without leaking hidden info.
- Deliverables:
- JSON export
- NDJSON export
- compact text export
- Suggested tests:
- `e2e/270_poker_play_hand_history_export_contract.spec.js`

## PPK-312 - Seat auto-act policy

- Priority: P0
- Phase: J
- Goal: ship true opt-in human + agent automation.
- Deliverables:
- automation policy routes
- worker proposal execution path
- revoke and override controls
- Suggested tests:
- `e2e/271_poker_play_auto_act_contract.spec.js`
- `e2e/272_poker_play_auto_act_ui.spec.js`

## PPK-313 - Explicit shove action UX

- Priority: P1
- Phase: J
- Goal: expose shove as a first-class action.
- Deliverables:
- shove control
- worker proposal support
- server normalization contract
- Suggested tests:
- `e2e/273_poker_play_shove_action_ui.spec.js`

## PPK-314 - Rake and treasury ledger

- Priority: P0
- Phase: K
- Goal: add room-level economy accounting.
- Deliverables:
- rake policy
- treasury ledger
- reconciliation visibility
- Suggested tests:
- `e2e/274_poker_play_treasury_rake_contract.spec.js`

## PPK-315 - Native live-play seasonal rankings

- Priority: P1
- Phase: K
- Goal: build a native seasonal product over live-play rows.
- Deliverables:
- season models
- ranking derivation
- leaderboard read routes
- Suggested tests:
- `e2e/275_poker_play_season_rankings_contract.spec.js`

## PPK-316 - Event calendar and recurring schedule

- Priority: P0
- Phase: L
- Goal: turn scheduled events into a real product surface.
- Deliverables:
- event calendar
- registration lobby
- recurring event templates
- Suggested tests:
- `e2e/276_poker_play_schedule_calendar_ui.spec.js`

## PPK-317 - Scheduled break structure

- Priority: P1
- Phase: L
- Goal: add durable break cadence to tournaments.
- Deliverables:
- break templates
- break state transitions
- break visibility in table and series summaries
- Suggested tests:
- `e2e/277_poker_play_scheduled_breaks_contract.spec.js`

## PPK-318 - Satellites

- Priority: P1
- Phase: L
- Goal: support qualifier events that feed downstream tournaments.
- Deliverables:
- ticket or seat award contract
- registration linkage
- payout override semantics
- Suggested tests:
- `e2e/278_poker_play_satellite_contract.spec.js`

## PPK-319 - Rebuy and add-on formats

- Priority: P1
- Phase: L
- Goal: expand tournament economy formats.
- Deliverables:
- rebuy windows
- add-on windows
- accounting and prize-pool updates
- Suggested tests:
- `e2e/279_poker_play_rebuy_addon_contract.spec.js`

## PPK-320 - Multi-flight festivals

- Priority: P2
- Phase: L
- Goal: support Day 1 flight groupings and later merge stages.
- Deliverables:
- festival parent model
- flight registration and advancement
- day-merge reconciliation
- Suggested tests:
- `e2e/280_poker_play_multiflight_contract.spec.js`

## PPK-321 - Expanded bounty models

- Priority: P1
- Phase: L
- Goal: move beyond `pko_50`.
- Deliverables:
- `pko_75`
- `full_bounty`
- exact carry and payout formulas
- Suggested tests:
- `e2e/281_poker_play_bounty_models_contract.spec.js`

## PPK-322 - Chop and deal flow

- Priority: P2
- Phase: L
- Goal: support agreed alternate settlement in late tournament stages.
- Deliverables:
- proposal route
- agreement collection
- operator approval
- settlement audit
- Suggested tests:
- `e2e/282_poker_play_chop_deal_contract.spec.js`

## 6. Explicit Deferrals After Phase 25

These are real but intentionally deferred again:

1. real-money cashier flows,
2. onchain settlement or attestation,
3. native mobile dedicated client apps,
4. solver-grade review tools,
5. perfect collusion detection.
