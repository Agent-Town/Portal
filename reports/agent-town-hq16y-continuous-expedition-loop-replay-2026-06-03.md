# AgentTown HQ16Y Continuous Expedition Loop Replay

Date: 2026-06-03
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Checkpoint: `9c2008f Add AgentTown end-to-end loop replay` local-only, ahead of origin by 15
Verdict: `PASS`

## Summary

HQ16Y replaces the stale worker lane with one continuous focused browser replay for the existing Expedition Map gameplay loop:

`Scout/objective -> Scout Sector -> Event Packet -> packet-derived Site Plan -> Review -> Prepare Convoy -> Settler Convoy -> Found Outpost -> Outpost Crew -> next outpost-to-Scout bridge`

The replay uses the current browser UI and current guarded endpoints for the gameplay actions. The only time control is the existing test-only Founders Plot advance route after Prepare Convoy, so the harness can deterministically prove the arrival-gated Found Outpost step without adding scheduler/economy/runtime authority.

## Evidence

Primary harness:

- `e2e/207_founders_plot_hq16y_continuous_expedition_loop.spec.js`
- Test id: `FP-E2E-022Y continuous Expedition Map loop replay reaches the next Scout bridge`

Artifacts:

- `reports/agent-town-hq16y-continuous-expedition-loop-replay-proof-2026-06-03.json`
- `reports/agent-town-hq16y-continuous-expedition-loop-replay-2026-06-03-01-scout-ready.png`
- `reports/agent-town-hq16y-continuous-expedition-loop-replay-2026-06-03-02-convoy-rolling.png`
- `reports/agent-town-hq16y-continuous-expedition-loop-replay-2026-06-03-03-outpost-bridge.png`
- `reports/agent-town-hq16y-continuous-expedition-loop-replay-contact-sheet-2026-06-03.png`

## Replay Coverage

- Scout/objective -> Scout Sector: PASS. The Scout command reveals exactly one hinted sector and writes a server-owned Event Packet.
- Event Packet -> packet-derived Site Plan: PASS. The browser uses the existing `draft_site_plan_from_packet` endpoint and records a planning-only Site Plan.
- Site Plan -> Review -> Prepare Convoy: PASS. Review promotes the packet Site Plan to the existing Surveyor `prepare_settler_convoy` command path.
- Prepare Convoy -> Settler Convoy: PASS. The guarded Prepare Convoy endpoint creates the server-owned Settler Convoy claim/unit.
- Arrival-gated Found Outpost: PASS. Found Outpost is absent before arrival; after the existing test advance marks the convoy arrived, the guarded Found endpoint creates the outpost.
- Outpost Crew -> next Scout bridge: PASS. Selecting the server-owned Outpost Crew exposes a read-only visual frontier beacon, then the existing Scout Sector route reveals the next sector.

## Harness Notes

The harness seeds only the minimum HQ/Expedition Board readiness needed to start the current loop from a fresh e2e plot. It does not add runtime gameplay authority.

Tiny harness/readability fixes made while replacing the stale HQ16Y worker residue:

- Replaced direct convoy claim rewriting with same-page `fetch('/__test__/founders-plot/advance')`, the existing test-only time advance route.
- Removed a stale mid-loop re-seed/reload that could reset the browser back to a fresh HQ1 plot.
- Added diagnostic assertion messages for guarded endpoint responses.
- Preserved the pre-reveal outpost beacon snapshot in proof JSON so `outpostBridgeVisualOnly` is non-vacuous.

## Guardrails

Held:

- No new gameplay authority, server mutation semantics, endpoints, tools, schema, Atlas execution, or Generated Universe runtime expansion.
- No hidden autonomy or hidden-truth leakage.
- No route/trade/economy/resource/reward/combat/scheduler expansion.
- No image generation or HQ16W runtime promotion.
- No push, merge, deploy, public share, or external message.

## Verification

- `node --check e2e/207_founders_plot_hq16y_continuous_expedition_loop.spec.js` - PASS
- `PW_PORT=4988 npx playwright test e2e/207_founders_plot_hq16y_continuous_expedition_loop.spec.js --project=chromium --reporter=line` - PASS, 1/1
- `jq` proof guardrail check - PASS
- screenshot/contact-sheet `file` checks - PASS
- `git diff --check` - PASS

## Follow-Up

The current loop is now covered as a single regression harness. The next product lane should move packet Plan/Review and outpost Scout continuation toward more direct map-native verbs, while preserving the same guarded endpoint authority.
