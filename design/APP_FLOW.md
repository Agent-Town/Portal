# APP_FLOW

Status: Canonical poker route and journey map for design work  
Date: 2026-03-16

This file describes how users move through the poker product today and what each screen must prioritize visually.

## 1. Cross-Cutting Flow Rules

1. Poker stays modal-first and embed-compatible.
2. Wallet identity and house context remain visible but secondary.
3. Every route must declare one primary action.
4. Every route must remain understandable on mobile first.

## 2. Core Routes

## 2.1 Live Lobby

- Route: `/poker/play`
- Audience: player
- Goal: join or create a live table, inspect available tables, reach results or schedule
- Primary action: quick seat
- Secondary actions:
  - open an existing table
  - open schedule
  - open native season
  - open public rail
- Critical information:
  - OIL balance
  - available live tables
  - tournament series availability
  - self-exclusion / spend policy
- Current design risk: policy and identity compete with the main join flow

## 2.2 Live Cash / Tournament Table

- Route: `/poker/play/tables/:tableId`
- Audience: seated player or admin
- Goal: act in the current hand or manage the current seat
- Primary action:
  - player: submit legal action
  - admin: manage the table safely
- Secondary actions:
  - seat thread
  - auto-act
  - seat movement
  - study preview
  - review / disputes
- Critical information:
  - acting seat
  - decision clock
  - legal actions
  - stack
  - pot
  - current street
- Current design risk: the action form is too low in the page and visually equal to secondary tools

## 2.3 Tournament Schedule

- Route: `/poker/play/schedule`
- Audience: player and admin
- Goal:
  - player: register or waitlist
  - admin: manage recurring schedule templates
- Primary action:
  - player: register for an event
  - admin: create or manage a recurring template
- Critical information:
  - next scheduled events
  - registration state
  - waitlist state
  - break schedule
- Current design risk: admin controls appear too early for normal players

## 2.4 Hand Review

- Route: `/poker/play/hands/:handId/review`
- Audience: seated player
- Goal: understand the result, replay the hand, save notes
- Primary action: save meaningful study notes
- Secondary actions:
  - export history
  - inspect action line
  - inspect opponent notes
- Critical information:
  - result summary
  - action line
  - board and pot
  - human note
  - agent note
  - opponent notes
- Current design risk: everything reads as one long identical stack rather than a study workflow

## 2.5 Series Timeline

- Route: `/poker/play/series/:seriesId/timeline`
- Audience: player or admin
- Goal: understand tournament progression
- Primary action: read the ordered story of the series
- Secondary actions:
  - open table
  - open public timeline
- Critical information:
  - stage
  - event count
  - entrants
  - prize pool
- Design note: this should feel archival and structured, not like a control screen

## 2.6 Public Rail

- Routes:
  - `/poker/play/rail`
  - `/poker/play/rail/tables/:tableId`
  - `/poker/play/rail/series/:seriesId`
- Audience: spectator
- Goal: watch without private leakage
- Primary action: open a table or series to observe
- Critical information:
  - visible table state
  - public action history
  - series field overview
- Design note: rail must feel lighter than the player table

## 2.7 Native Season

- Routes:
  - `/poker/play/seasons/native`
  - `/poker/play/seasons/native/:seasonId`
- Audience: player
- Goal: understand live-play season standings
- Primary action: inspect ranking context
- Critical information:
  - season summary
  - ranking rows
  - OIL deltas
- Design note: this should read as a clean leaderboard, not as another generic card stack

## 2.8 Operator Review

- Route: same live table route with admin token present
- Audience: operator
- Goal: safely pause, resume, rebalance, refund, export, and resolve disputes
- Primary action: the next safe operator action
- Secondary actions:
  - export
  - close
  - pause / resume
  - dispute resolution
- Critical information:
  - review hand
  - open disputes
  - integrity flags
  - current series state
- Current design risk: destructive and neutral controls look interchangeable

## 2.9 Centaur Table

- Route: `/poker/centaur/tournaments/:tournamentId`
- Audience: human + AI team
- Goal: verify the lock, join, discuss a line, and lock a shared action
- Primary action:
  - before join: verify / join
  - after join: lock shared action
- Critical information:
  - countdown
  - shared hand state
  - agent recommendation
  - discussion thread
- Design note: this is a ritual screen and should feel distinct from standard multiplayer poker

## 3. Primary Journeys

## 3.1 Cash Player Journey

1. Open lobby
2. Join or create cash table
3. Land on live table
4. Read decision state
5. Act
6. Review result or hand history later

## 3.2 Tournament Player Journey

1. Open schedule or lobby
2. Register or quick-seat
3. Return to table as the event starts
4. Handle breaks, re-entry, or waitlist movement
5. Review timeline and results

## 3.3 Study Journey

1. Open history
2. Open one hand review
3. Understand result
4. Save notebook note
5. Save opponent note if needed

## 3.4 Operator Journey

1. Open live table
2. Inspect series state and review state
3. Take one high-confidence action
4. Export or close only when necessary

## 3.5 Centaur Journey

1. Verify Streamflow lock
2. Accrue or confirm OIL
3. Join table
4. Discuss with agent
5. Lock shared action before timer expires

## 4. Empty, Loading, and Error Expectations

Every route must define:

1. loading state,
2. empty state,
3. blocked state,
4. error state.

No route should render a blank long page with only status text.
