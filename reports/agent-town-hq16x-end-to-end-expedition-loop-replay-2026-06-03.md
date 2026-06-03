# AgentTown HQ16X End-to-End Expedition Loop Replay

Date: 2026-06-03
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Checkpoint: `0bde991` local branch, ahead of origin by 14
Verdict: `PASS_WITH_NOTES`

## Summary

The current Expedition Map loop does play end-to-end across the implemented HQ16 bridge states:

`map objective / command -> Scout Sector -> Event Packet -> packet-derived Site Plan -> Review -> Surveyor Prepare Convoy -> Settler Convoy -> Found Outpost -> Outpost Crew -> next outpost Scout bridge`

This is a real bounded loop, not just a report claim. The replay passed focused browser and server checks, and the current guardrails held. The main gap is feel: the loop still reads as a sequence of bridged proof slices in places, especially packet Plan/Review and convoy arrival, rather than one uninterrupted map-native game run.

## Evidence

Browser replay:

- `PW_PORT=4974 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022" --reporter=line`
  Result: `1 passed`
- `PW_PORT=4976 npx playwright test e2e/203_founders_plot_hq16l_review_to_convoy_map_bridge.spec.js e2e/204_founders_plot_hq16m_prepare_convoy_to_settler_map_bridge.spec.js e2e/206_founders_plot_hq16u_outpost_scout_bridge_live_qa.spec.js --project=chromium --reporter=line`
  Result: `3 passed`

Server/contract replay:

- `NODE_ENV=test node --test --test-name-pattern="FP-UT-028|FP-UT-028b|FP-HT-011d3|FP-HT-011d3b|FP-CT-101b3|FP-CT-101b3i" tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-contract.test.js`
  Result: `6 passed`

Proof artifacts:

- `reports/agent-town-hq16x-end-to-end-expedition-loop-replay-proof-2026-06-03.json`
- `reports/agent-town-hq16x-end-to-end-expedition-loop-replay-contact-sheet-2026-06-03.png`

## Loop Coverage

- Map objective / command: PASS. `FP-E2E-022` proves selected units, command bars, direct map target rings, preview confirmation, and guarded handlers.
- Scout Sector -> Event Packet: PASS. Scout Sector reveals one hinted sector and creates a receipt-linked Event Packet.
- Event Packet -> packet-derived Site Plan: PASS. HQ16I server/HTTP/contract checks prove the guarded packet Site Plan endpoint.
- Site Plan Review -> Surveyor Prepare Convoy: PASS. HQ16K/HQ16L prove the reviewed plan bridge and existing `prepare_settler_convoy` command.
- Prepare Convoy -> Settler Convoy: PASS. HQ16M proves the selected Settler Convoy appears as the server-owned result.
- Arrival-gated Found Outpost: PASS. HQ16M proves Found is absent before arrival and available after arrival.
- Found Outpost -> next outpost Scout bridge: PASS. HQ16U proves an outpost beacon points to the next hinted frontier and Scout Sector uses the live route.

## Minimal Fix

I made one proof-harness-only edit:

- `e2e/203_founders_plot_hq16l_review_to_convoy_map_bridge.spec.js`

The focused HQ16L replay was blocked by a stale visible-text assertion expecting literal `CNV`. The current UI is symbol-first and still exposes stable `data-mode="convoy"`, target-cell, `Convoy`, bridge, endpoint, and preview-only renderer checks. I removed only that obsolete text assertion. No gameplay authority changed.

## Gameplay Gaps

The loop works, but it does not fully feel like a game yet.

1. The middle still feels bridged rather than continuous. Packet Plan and Review are real guarded actions, but the player can still perceive them as paperwork unless the map-native command path is emphasized.
2. Convoy arrival is proven through deterministic fixture state, not a satisfying player-visible progress/arrival moment.
3. Outpost -> next Scout is live-route proven, but HQ16U still executes via the collapsed Scout alias after selecting the beacon. The next Scout continuation should become a direct outpost/map command-ring path.
4. The current proof suite is stitched from focused bridge specs. That is good enough for HQ16X proof, but the next lane should create one continuous replay harness so regressions are caught as a single gameplay loop.

## Next Lanes

- `HQ16Y`: one continuous browser replay harness for Scout -> Plan -> Review -> Convoy -> Found -> Next Scout, using current guarded endpoints where possible and fixture time control only for convoy arrival.
- `HQ16Z`: promote packet Plan/Review and outpost Scout continuation into direct map-native command-ring verbs while keeping Ledger/Receipts optional.
- `HQ17A`: add convoy progress/arrival feedback that feels like play, without adding scheduler, route, economy, reward, combat, or hidden autonomy behavior.

## Guardrails

Held. No image generation, runtime asset promotion, push, merge, deploy, public share, external message, Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, new route/trade/economy/resource/reward/combat/scheduler behavior, or new gameplay authority was added.
