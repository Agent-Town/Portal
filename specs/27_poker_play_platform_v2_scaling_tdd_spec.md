# Phase 25 Spec: Poker Play Platform v2 Scaling and Format Depth (Contracts First, TDD)

Status: Draft  
Version: 1.0  
Audience: backend engineers, frontend engineers, infrastructure engineers, real-time systems engineers, poker-domain engineers, ML evaluation engineers, QA automation engineers, AI agent implementers  
Depends on: [specs/02_api_contract.md](./02_api_contract.md), [specs/25_poker_play_platform_v2_scaling_implementation_pack.md](./25_poker_play_platform_v2_scaling_implementation_pack.md), [specs/26_poker_play_platform_v2_scaling_backlog.md](./26_poker_play_platform_v2_scaling_backlog.md), [AGENTS.md](../AGENTS.md)  
Goal: make the next poker scale and format work implementable in deterministic, measurable, agent-friendly steps with explicit RED and GREEN gates.

Implementation constraints:

1. Keep poker modal-first and hub-compatible.
2. Keep worker-first architecture for strategy and auto-act reasoning.
3. Default `npm test` must remain deterministic and offline-safe.
4. Any production bus or websocket adapter must have a deterministic in-memory test adapter.
5. No private seat-thread, notebook, opponent-note, or automation payload may leak into rail or another seat view.
6. No economy mutation is done without treasury, player, and reconciliation visibility.
7. No tournament schedule mutation is done without durable audit and export parity.
8. Every new player-visible poker behavior needs both contract and UI coverage unless it is explicitly backend-only.

## 1. Executive Summary

This phase closes the next poker gaps through six workstreams:

1. production live transport,
2. multi-instance event distribution,
3. deeper table operations and blind policy,
4. study and automation depth,
5. economy and native rankings,
6. schedule and format expansion.

Reserved Playwright block:

1. `254` to `282`

Reserved Playwright files:

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

Supplemental verification lanes allowed in this phase:

1. `npm run verify:poker-transport`
2. `npm run verify:poker-pubsub`
3. `npm run verify:poker-economy`
4. `npm run eval:poker-auto-act`

## 2. Global Measurable Metrics

### 2.1 Transport Metrics

1. Table and series message versions increase monotonically with no gaps on clean delivery.
2. A reconnecting client can recover to the exact latest state using snapshot plus replay or reset.
3. Delta delivery reduces full-state rereads to `0` during the happy-path transport lane.
4. Transport fallback still converges to the correct final view after a forced disconnect.

### 2.2 Distribution Metrics

1. A mutation published on instance A becomes visible to a subscriber on instance B in deterministic test topology.
2. Out-of-order duplicate bus deliveries do not corrupt client-visible state.
3. Event fanout preserves per-channel order exactly.

### 2.3 Seat Operation Metrics

1. Seat change preserves wallet subject, stack, and open review state exactly.
2. Table transfer preserves stack and accounting with `0` drift.
3. Blind obligations and missed blind state transition exactly to the expected seeded values.
4. Tournament waitlist promotion order matches seeded queue order exactly.

### 2.4 Study Metrics

1. Notebook and opponent-note rows are private to the bound viewer.
2. Post-hand review event count matches the underlying hand-history rows exactly.
3. Export counts match hand-history counts exactly.

### 2.5 Automation Metrics

1. Auto-act never submits an action missing from `viewerAllowedActions`.
2. Auto-act never submits an amount outside server-legal bounds.
3. Revoking auto-act prevents any later automated action on the same seat.
4. Every automated action writes one audit row with policy metadata.

### 2.6 Economy Metrics

1. Player debits, winnings, rake, and treasury credits sum exactly to `0` net drift at the room level.
2. Seasonal ranking scores derive exactly from seeded live-play rows.
3. Treasury and player ledgers reconcile by wallet, table, and season.

### 2.7 Schedule and Format Metrics

1. Registration counts, prize pools, and advancement counts match seeded event structures exactly.
2. Break start and resume moments are deterministic.
3. Satellite awards map exactly to target-event registrations or ticket rows.
4. Rebuy and add-on windows accept or reject exactly by policy.
5. Multi-flight advancement counts and carried stacks match seeded expected values exactly.
6. Bounty payout splits match the configured model exactly.
7. Chop settlement totals equal the pre-chop payable pool exactly.

## 3. Test Harness Rules

1. All default-lane poker transport tests must use deterministic seeded channels and in-memory bus adapters.
2. No default-lane test may require a real websocket broker or external pub/sub provider.
3. Every transport test must assert version numbers or message counts, not only visual updates.
4. Automation tests must use deterministic worker proposals in the default lane.
5. Economy tests must assert exact ledger totals, not only non-empty rows.
6. Schedule and format tests must use seeded event templates and seeded timestamps.
7. Negative tests are mandatory for privacy leakage, stale versions, illegal auto-act, and invalid registration state.

## 4. Required Fixtures and Observability

Required fixture families:

1. `poker_transport_seed`
2. `poker_pubsub_seed`
3. `poker_cash_seat_ops_seed`
4. `poker_blind_obligation_seed`
5. `poker_tournament_waitlist_seed`
6. `poker_study_seed`
7. `poker_auto_act_seed`
8. `poker_treasury_seed`
9. `poker_native_season_seed`
10. `poker_schedule_calendar_seed`
11. `poker_break_structure_seed`
12. `poker_satellite_seed`
13. `poker_rebuy_addon_seed`
14. `poker_multiflight_seed`
15. `poker_bounty_models_seed`
16. `poker_chop_seed`

Required observability:

1. channel version and checkpoint state,
2. transport snapshot versus delta payloads,
3. blind obligation rows,
4. waitlist order and promotion decisions,
5. notebook and post-hand review counts,
6. auto-act audit rows,
7. treasury and seasonal ledger summaries,
8. event schedule and flight state.

## 5. Milestone Map

### M25.0 - Transport harness

Purpose:

1. seed deterministic live channels and version counters,
2. expose in-memory bus adapters,
3. prove replay and reset surfaces exist before behavior work starts.

Primary tests:

1. `e2e/254_poker_play_live_transport_contract.spec.js`

GREEN gate:

1. transport harness emits snapshot and delta envelopes,
2. version counters are visible in test mode,
3. reconnect replay or reset path exists.

### M25.1 - Websocket table and series transport

Primary tests:

1. `e2e/255_poker_play_live_transport_ui.spec.js`
2. `e2e/256_poker_play_live_transport_recovery_contract.spec.js`

Evaluation target:

1. prove that live table and series views update through websocket delta flow and recover deterministically after disconnect.

### M25.2 - Multi-instance pub/sub

Primary test:

1. `e2e/257_poker_play_multi_instance_pubsub_contract.spec.js`

Evaluation target:

1. prove that a mutation on one instance reaches subscribers on another instance through the shared bus without duplicate-state corruption.

### M25.3 - Cash seat movement

Primary tests:

1. `e2e/258_poker_play_cash_seat_change_contract.spec.js`
2. `e2e/259_poker_play_cash_seat_change_ui.spec.js`
3. `e2e/260_poker_play_cash_table_transfer_contract.spec.js`
4. `e2e/261_poker_play_cash_table_transfer_ui.spec.js`

Evaluation target:

1. prove that cash players can move seats and transfer tables between hands without stack drift or identity rotation.

### M25.4 - Blind obligations and tournament waitlists

Primary tests:

1. `e2e/262_poker_play_blind_obligation_contract.spec.js`
2. `e2e/263_poker_play_missed_blind_ui.spec.js`
3. `e2e/264_poker_play_tournament_waitlist_contract.spec.js`
4. `e2e/265_poker_play_tournament_waitlist_ui.spec.js`

Evaluation target:

1. prove that blind obligations and waitlist promotions are deterministic and audit-visible.

### M25.5 - Study and export depth

Primary tests:

1. `e2e/266_poker_play_study_notebook_contract.spec.js`
2. `e2e/267_poker_play_study_notebook_ui.spec.js`
3. `e2e/268_poker_play_opponent_notes_contract.spec.js`
4. `e2e/269_poker_play_post_hand_review_ui.spec.js`
5. `e2e/270_poker_play_hand_history_export_contract.spec.js`

Evaluation target:

1. prove that study artifacts are durable, private, and export-safe.

### M25.6 - Auto-act and shove UX

Primary tests:

1. `e2e/271_poker_play_auto_act_contract.spec.js`
2. `e2e/272_poker_play_auto_act_ui.spec.js`
3. `e2e/273_poker_play_shove_action_ui.spec.js`

Evaluation target:

1. prove that opt-in automation can act legally and visibly, and that shove is a first-class action surface.

### M25.7 - Rake, treasury, and native seasons

Primary tests:

1. `e2e/274_poker_play_treasury_rake_contract.spec.js`
2. `e2e/275_poker_play_season_rankings_contract.spec.js`

Evaluation target:

1. prove exact treasury reconciliation and deterministic seasonal ranking derivation.

### M25.8 - Schedule calendar and scheduled breaks

Primary tests:

1. `e2e/276_poker_play_schedule_calendar_ui.spec.js`
2. `e2e/277_poker_play_scheduled_breaks_contract.spec.js`

Evaluation target:

1. prove that events, registration, and breaks are durable, deterministic, and operator-safe.

### M25.9 - Format expansion

Primary tests:

1. `e2e/278_poker_play_satellite_contract.spec.js`
2. `e2e/279_poker_play_rebuy_addon_contract.spec.js`
3. `e2e/280_poker_play_multiflight_contract.spec.js`
4. `e2e/281_poker_play_bounty_models_contract.spec.js`
5. `e2e/282_poker_play_chop_deal_contract.spec.js`

Evaluation target:

1. prove that expanded formats settle exactly and preserve deterministic registration and payout semantics.

## 6. RED and GREEN Criteria by Theme

### Transport

RED:

1. only SSE hinting exists,
2. clients need full rereads for every state change,
3. no version replay contract exists.

GREEN:

1. websocket snapshot plus delta exists,
2. replay or reset is deterministic,
3. pub/sub fanout works across instances.

### Cash Operations

RED:

1. seat movement is not supported,
2. missed blinds are implicit or missing,
3. tournament waitlists do not exist.

GREEN:

1. seat movement and transfer are exact,
2. blind obligations are contract-visible,
3. waitlist order is durable.

### Study

RED:

1. no persistent notebook exists,
2. no opponent notes exist,
3. export is admin-only or non-player-friendly.

GREEN:

1. study notes are durable and private,
2. post-hand review is structured,
3. export reconciles to durable history.

### Automation

RED:

1. automation policy is absent,
2. human must always click final action,
3. shove is only an implicit amount choice.

GREEN:

1. auto-act modes are explicit,
2. every automated action is audit-visible,
3. shove is first-class in UI and contract.

### Economy

RED:

1. no rake or treasury rows exist,
2. native ranking is absent,
3. economy rules are implicit.

GREEN:

1. rake and treasury are exact,
2. native seasons are visible,
3. reconciliation remains exact.

### Schedule and Formats

RED:

1. scheduledStartAt is the only scheduling concept,
2. no real calendar or break model exists,
3. no satellite, rebuy, multi-flight, or chop support exists.

GREEN:

1. event calendar and recurring templates exist,
2. breaks are durable and visible,
3. expanded formats settle exactly.

## 7. Required Doc Sync

Every milestone must update:

1. `specs/02_api_contract.md`
2. the affected implementation pack section
3. the affected backlog ticket section
4. this TDD spec when test IDs or metrics change

Any automation or seat-agent surface change must also update:

1. `public/skill.md`
2. `docs/internal-skill-testline.md`
3. `e2e/55_phase3_skill_contract_line.spec.js`

## 8. Completion Bar

Phase 25 is complete only when:

1. the reserved `254` to `282` block is implemented or intentionally replaced with stronger deterministic coverage,
2. transport and pub/sub are production-shape while still local-test-safe,
3. cash operations, study, automation, economy, and schedule surfaces are all contract-visible,
4. full-suite poker and repo verification remain green.
