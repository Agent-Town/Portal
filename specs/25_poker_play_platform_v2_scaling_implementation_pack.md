# Poker Play Platform v2 Scaling and Format Depth Implementation Pack

Status: Draft planning pack  
Date: 2026-03-12  
Scope: scale Agent Town Poker Play from an offchain alpha into a transport-hardened, multi-instance, schedule-driven poker platform with richer table operations, study surfaces, automation controls, economy rules, and tournament formats  
Depends on: [specs/02_api_contract.md](./02_api_contract.md), [specs/22_poker_play_platform_v1_implementation_pack.md](./22_poker_play_platform_v1_implementation_pack.md), [specs/23_poker_play_platform_v1_backlog.md](./23_poker_play_platform_v1_backlog.md), [specs/24_poker_play_platform_v1_tdd_spec.md](./24_poker_play_platform_v1_tdd_spec.md), [AGENTS.md](../AGENTS.md)  
Companion backlog: [specs/26_poker_play_platform_v2_scaling_backlog.md](./26_poker_play_platform_v2_scaling_backlog.md)  
Companion TDD spec: [specs/27_poker_play_platform_v2_scaling_tdd_spec.md](./27_poker_play_platform_v2_scaling_tdd_spec.md)

This document defines the next poker program after the current live-play alpha. Phase 25 is not a rewrite. It hardens the existing room around the concrete missing surfaces that still block scale, richer tournament product depth, and deeper human + agent play.

## 1. Executive Summary

The current branch already has:

1. playable 6-max cash and tournament tables,
2. worker-backed seat-agent proposals,
3. private seat threads,
4. tournament director controls,
5. rail, timeline, integrity, ops, and reconciliation surfaces,
6. invite-only tables, policy limits, PKO 50/50, and sit-and-go variants,
7. offchain OIL buy-ins, payouts, refunds, and seasonal mirror surfaces.

It still does not have:

1. production-grade live transport,
2. multi-instance pub/sub distribution,
3. deeper cash-room operations,
4. player study tooling,
5. opt-in agent auto-act,
6. explicit shove UX,
7. native live-play economy rules,
8. real tournament schedule product depth,
9. broader tournament format coverage.

Phase 25 closes those gaps in one coordinated program:

1. live transport and scaling architecture,
2. seat mobility, blind policy, and tournament waitlists,
3. player study and export depth,
4. centaur automation controls,
5. economy and seasonal room product,
6. schedule and format expansion.

## 2. Normative Product Decisions

The following decisions are binding for this phase.

1. Poker remains modal-first from the town hub. No new poker surface may require full-page navigation when a modal/frame path is possible.
2. Wallet-first identity remains mandatory. Seats, notes, study data, automation permissions, registration, and ranking all bind to wallet subject plus house context.
3. OIL remains offchain and database-authoritative in this phase.
4. Tournament settlement remains offchain and database-authoritative in this phase.
5. The server remains authoritative for legality, countdowns, accounting, blind obligations, schedule state, and automation policy enforcement.
6. The worker remains authoritative for seat-agent reasoning, note drafting, and optional auto-act policy execution intent.
7. Auto-act is strictly opt-in, bounded, revocable, and audit-visible. It must not silently turn on for any seat.
8. Private seat threads, coach notebooks, and opponent notes remain private to the bound viewer unless a separate share/export contract explicitly allows otherwise.
9. Production transport must support multi-instance fanout, but default `npm test` must remain offline-safe and single-process-capable.
10. Phase 25 may add Redis-like or bus-like adapters behind a repository-owned interface, but must preserve an in-memory deterministic adapter for local tests.

## 3. Program Scope

Phase 25 covers these product gaps.

### 3.1 Live Transport and Distribution

Required outcomes:

1. websocket transport for player and rail views,
2. delta-state sync instead of full reread on every update,
3. monotonic per-table and per-series sequence numbers,
4. server-side snapshot plus patch recovery when a client misses deltas,
5. multi-instance publish/subscribe fanout,
6. deterministic fallback to polling or explicit resync when transport breaks.

### 3.2 Cash-Room Depth

Required outcomes:

1. seat change between hands,
2. table transfer between compatible cash tables,
3. stronger blind-posting policy,
4. missed-blind handling and re-entry to action,
5. tournament waitlists for scheduled or full events.

### 3.3 Study and Review Surfaces

Required outcomes:

1. persistent coach notebook per wallet,
2. opponent notes per opponent wallet or seat identity,
3. structured post-hand review workflow,
4. player-friendly hand-history export.

### 3.4 Centaur Automation

Required outcomes:

1. explicit per-seat auto-act policy,
2. server-enforced automation guardrails,
3. audit-visible human override and revoke paths,
4. agent-executed actions when policy allows.

### 3.5 Live Economy

Required outcomes:

1. rake model and rake ledger,
2. room treasury logic,
3. native live-play seasonal ranking product,
4. explicit economy policy controls beyond generic OIL balance mutation.

### 3.6 Schedule and Format Depth

Required outcomes:

1. event calendar and registration lobby,
2. recurring schedule templates,
3. scheduled break structure,
4. satellites,
5. rebuys and add-ons,
6. multi-flight festivals,
7. bounty models beyond `pko_50`,
8. chop and deal flows.

## 4. Architecture Decisions

### 4.1 Live Transport Contract

Phase 25 replaces SSE push hints with a websocket-first transport.

Normative rules:

1. Every live table has a durable `stateVersion`.
2. Every live tournament series has a durable `seriesVersion`.
3. The server emits:
   - snapshot messages for initial subscribe or forced resync,
   - delta messages for incremental updates,
   - explicit gap/replay-needed signals when a client misses one or more versions.
4. Delta messages must be idempotent and sequence-addressable.
5. Clients must be able to resume from last-seen version.
6. Transport failures must not corrupt table state. They may only delay visibility until resync.

Recommended envelope:

1. `transportVersion`
2. `channelKind`
3. `channelId`
4. `messageKind = snapshot | delta | reset | heartbeat`
5. `version`
6. `prevVersion`
7. `patch`
8. `snapshot`
9. `reason`
10. `at`

### 4.2 Multi-Instance Pub/Sub

Phase 25 introduces a repository-owned live-event bus abstraction.

Required adapters:

1. in-memory adapter for tests and local single-process development,
2. production bus adapter for multi-instance fanout.

Normative rules:

1. Gameplay state remains in the authoritative database or authoritative server mutation path, not in the transport layer.
2. Publish happens after authoritative mutation is durably accepted.
3. Consumers may rebuild snapshot state from durable rows if a bus message is dropped.
4. Fanout ordering must be monotonic per channel, not necessarily globally total.
5. Table and series subscribers must never receive another seat's private payload.

### 4.3 Delta Computation Strategy

Phase 25 uses contract-visible view models, not arbitrary DOM deltas.

Recommended delta families:

1. `table.summary.updated`
2. `hand.action.appended`
3. `hand.state.updated`
4. `seat.updated`
5. `message.appended`
6. `review.updated`
7. `series.summary.updated`
8. `series.table_membership.updated`

Delta rules:

1. A client that misses one delta may request a compressed snapshot.
2. Deltas must be derived from stable server view models.
3. Deltas must not depend on client-local inference to preserve correctness.

## 5. Cash-Room and Blind Policy Decisions

### 5.1 Seat Change

Rules:

1. Seat changes are cash-only in this phase.
2. Seat changes are only allowed between hands.
3. Seat stack, wallet binding, study data, and automation state follow the seat owner.
4. A seat change writes one audit row with old seat and new seat numbers.

### 5.2 Table Transfer

Rules:

1. Cash-table transfer is allowed only between compatible tables:
   - same blind structure,
   - same currency,
   - same access policy class,
   - same buy-in policy family.
2. Transfer is only allowed between hands.
3. Remaining stack transfers as stack, not as a leave-plus-rebuy fiction.
4. Transfer writes one leave/move/join audit chain that reconciles exactly.

### 5.3 Blind Posting and Missed Blinds

Rules:

1. Cash tables must track small blind, big blind, and missed blind obligations.
2. A seat that returns after missing blinds must either:
   - post the required blind state before receiving a normal button path,
   - or wait for the big blind depending on configured policy.
3. Blind-posting policy must be contract-visible.
4. Missed blind recovery must be deterministic and audit-visible.

### 5.4 Tournament Waitlists

Rules:

1. Scheduled tournaments may accept waitlist registrations before start.
2. Full tournaments may accept late-registration waitlist entries when policy allows.
3. Waitlist promotion order is deterministic by durable queue order.
4. Tournament waitlist promotion must preserve event, flight, and buy-in policy.

## 6. Study and Review Decisions

### 6.1 Coach Notebook

Rules:

1. Each wallet has a persistent poker notebook.
2. Notebook entries may bind to:
   - table,
   - series,
   - hand,
   - opponent wallet,
   - freeform study topic.
3. Notebook entries are private by default.
4. Notebook entries may be authored by human or worker, but all entries must carry author role and timestamps.

### 6.2 Opponent Notes

Rules:

1. Opponent notes bind to wallet subject when known.
2. Opponent notes may also bind to pseudonymous seat identity for public or partial contexts.
3. Notes must remain private to the viewer.
4. Notes must be reachable from live table, history, and post-hand review surfaces.

### 6.3 Structured Post-Hand Review

Required review sections:

1. result summary,
2. action-by-action line,
3. board and pot slices,
4. human note,
5. agent note,
6. lesson tags,
7. notebook save actions.

### 6.4 Player-Friendly Export

Required export formats:

1. JSON,
2. NDJSON,
3. compact text export.

Rules:

1. Own-seat exports may include own private agent proposals and notebook links.
2. Opponent private hole cards remain hidden except where showdown policy permits exposure.
3. Exports must be reproducible from durable history rows.

## 7. Centaur Auto-Act Decisions

Phase 25 introduces explicit automation policy.

### 7.1 Automation Modes

Required baseline modes:

1. `off`
2. `propose_only`
3. `check_fold`
4. `seat_agent_auto`

Rules:

1. `off` preserves the current human-final-actor flow.
2. `propose_only` preserves current behavior.
3. `check_fold` allows only server-legal `check` or `fold`.
4. `seat_agent_auto` allows the seat agent to submit legal actions according to configured risk policy.
5. Automation mode is set per seat and may be further scoped per table or per hand.
6. A human may revoke automation instantly.
7. Every automated action writes:
   - actor role,
   - automation mode,
   - originating proposal id,
   - reason or policy path.

### 7.2 Safety Rules

1. Auto-act may not execute if the worker proposal is stale against the current hand version.
2. Auto-act may not execute if the proposal violates current legal bounds.
3. Auto-act may not survive wallet disconnect unless explicitly allowed by policy.
4. Auto-act must surface visible state in the table UI.

## 8. Action UX Decisions

Phase 25 introduces explicit shove UX.

Rules:

1. The UI must expose a dedicated `Shove` control when legal.
2. `Shove` is not only a large `raise` amount. It is a first-class action surface.
3. The contract may represent shove as a canonical action or as a server-normalized alias, but the user-facing UX must say `Shove`.
4. The seat-agent proposal contract must also be able to propose `shove` explicitly.

## 9. Economy Decisions

### 9.1 Rake and Treasury

Rules:

1. Rake is offchain and ledger-authoritative in this phase.
2. Rake policy must be table-type aware:
   - cash rake policy,
   - tournament fee policy.
3. Treasury rows must be distinguishable from player winnings and refunds.
4. Rake and fee rows must reconcile exactly.

### 9.2 Seasonal Native Rankings

Rules:

1. Native live-play seasonal rankings are separate from the mirrored poker operator leaderboards.
2. Seasonal ranking must support:
   - cash performance summary,
   - tournament finish summary,
   - optional economy-weighted metrics.
3. Rankings must be derived from live-play durable rows, not manual operator annotations.

### 9.3 Economy Policy

Required policy families:

1. rake percentages and caps,
2. tournament fee splits,
3. treasury destination policy,
4. seasonal metric formulas,
5. promotion or bonus policy if later enabled.

This phase does not include:

1. onchain rake distribution,
2. withdraw flows,
3. token bridge execution.

## 10. Tournament Schedule and Format Decisions

### 10.1 Event Calendar

Required outcomes:

1. one public schedule surface,
2. one authenticated registration surface,
3. event templates,
4. recurring schedule support,
5. event status progression:
   - scheduled,
   - registering,
   - late registration,
   - on break,
   - running,
   - completed,
   - cancelled.

### 10.2 Scheduled Breaks

Rules:

1. Tournament structures may define break cadence by level or elapsed time.
2. Break start and resume are durable and visible in table and series summaries.
3. Break handling must interact cleanly with late registration and re-entry policy.

### 10.3 Satellites

Rules:

1. Satellite payouts award:
   - target-event ticket,
   - target-event credit,
   - or explicit qualifier seat.
2. Satellite winners must reconcile into downstream event registration state.

### 10.4 Rebuys and Add-Ons

Rules:

1. Rebuy and add-on windows are policy-driven and contract-visible.
2. Rebuy and add-on accounting must remain separately auditable from original buy-ins.
3. Rebuy and add-on usage must update prize pool and, where relevant, bounty state deterministically.

### 10.5 Multi-Flight Festivals

Rules:

1. Flights are separate table groups under one parent festival event.
2. Advancing stacks carry into Day 2 or later parent stages.
3. Registration, advancement, and merge rules must be durable and replayable.

### 10.6 Bounty Models Beyond PKO 50/50

Required first expansion models:

1. `pko_50`
2. `pko_75`
3. `full_bounty`

Rules:

1. Each bounty model defines exact split between immediate payout and carried bounty.
2. The model must be contract-visible in table and series summaries.

### 10.7 Chop and Deal Flows

Rules:

1. Chop or deal proposals are tournament-only in this phase.
2. They require explicit agreement tracking across remaining seats.
3. They require operator approval before final settlement.
4. They must produce one durable settlement record with before and after payout plan.

## 11. Required API Surface Additions

Normative new API families for this phase:

1. websocket handshake and resync endpoints,
2. seat change and table transfer routes,
3. blind obligation and missed-blind state routes,
4. tournament waitlist and registration routes,
5. notebook and opponent-note routes,
6. post-hand review routes,
7. hand-history export routes,
8. seat automation policy routes,
9. native season and treasury routes,
10. event calendar, registration, and break routes,
11. satellite, rebuy, add-on, and flight routes,
12. chop proposal and approval routes.

Final endpoint names are defined in the companion backlog and TDD spec.

## 12. Data Model Expansion

Expected durable tables or equivalent stores:

1. `poker_live_channels`
2. `poker_live_events`
3. `poker_transport_checkpoints`
4. `poker_blind_obligations`
5. `poker_tournament_waitlist_entries`
6. `poker_player_notebook_entries`
7. `poker_opponent_notes`
8. `poker_post_hand_reviews`
9. `poker_hand_history_exports`
10. `poker_auto_act_policies`
11. `poker_room_treasury_ledger`
12. `poker_room_seasons`
13. `poker_room_season_entries`
14. `poker_scheduled_events`
15. `poker_event_registrations`
16. `poker_event_templates`
17. `poker_event_breaks`
18. `poker_festival_flights`
19. `poker_satellite_awards`
20. `poker_rebuy_events`
21. `poker_chop_proposals`

Equivalent durable representations are allowed if contract behavior remains identical.

## 13. Explicit Out of Scope

The following are still out of scope for Phase 25:

1. real-money fiat cashier flows,
2. onchain OIL minting or transfer,
3. onchain tournament settlement,
4. jurisdictional compliance rollout,
5. mobile-native dedicated poker clients,
6. solver-grade study tools,
7. perfect collusion detection.

## 14. Acceptance Bar

Phase 25 is done only when:

1. websocket and multi-instance transport are contract-tested with deterministic fallback,
2. cash-room seat mobility and blind policy are exact and auditable,
3. study surfaces are private, durable, and exportable,
4. auto-act is opt-in, bounded, and audit-visible,
5. economy and seasonal ledgers reconcile exactly,
6. schedule and format depth are operator-safe and deterministic,
7. the full poker suite and repo suite remain green.
