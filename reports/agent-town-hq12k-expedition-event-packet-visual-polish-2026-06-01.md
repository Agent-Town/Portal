# AgentTown HQ12K Expedition Event Packet Visual Polish

Date: 2026-06-01

## Status

Complete. This is a bounded frontend-only Founders Plot presentation polish for the selected-sector Expedition Event Packet.

## What Changed

- Updated the Event Packet card to read as map evidence instead of a dashboard block:
  - "Map evidence packet" eyebrow.
  - Compact "Read-only" seal.
  - Stronger selected-sector evidence lede.
  - Packet type/source/receipt/cell/read-model/action chips.
  - Slightly more distinct packet-card paper/receipt styling.
- Kept the existing Expedition Party block and packet facts read-only and buttonless.
- Extended `FP-E2E-022` with the smallest focused assertions for the new packet hierarchy and guardrails.

## Files Touched

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/200_founders_plot.spec.js`
- `reports/agent-town-hq12k-expedition-event-packet-visual-polish-proof-2026-06-01.json`
- `reports/agent-town-hq12k-expedition-event-packet-visual-polish-desktop-2026-06-01.png`
- `reports/agent-town-hq12k-expedition-event-packet-visual-polish-mobile-2026-06-01.png`
- `reports/agent-town-hq12k-expedition-event-packet-visual-polish-2026-06-01.md`

## Proof

- Proof JSON: `reports/agent-town-hq12k-expedition-event-packet-visual-polish-proof-2026-06-01.json`
- Desktop screenshot: `reports/agent-town-hq12k-expedition-event-packet-visual-polish-desktop-2026-06-01.png`
- Mobile screenshot: `reports/agent-town-hq12k-expedition-event-packet-visual-polish-mobile-2026-06-01.png`

Proof confirms:

- Event Packet id: `expedition_event_packet_hq12f_cell_q0_r1`.
- Header includes `Map evidence packet` and `Read-only`.
- Chips include packet type, source, receipt, cell, read-model/receipt metadata, and `zero executable actions`.
- Lede says this is selected-sector map evidence only.
- Packet buttons: `0`.
- Party actions: `0`.
- Event packet `readOnly: true`.
- Event packet `executableActions: []`.
- Mobile layout has no horizontal clipping.

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `PW_PORT=4931 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022"`
- `jq empty reports/agent-town-hq12k-expedition-event-packet-visual-polish-proof-2026-06-01.json`
- `jq -e` guardrail assertions for packet buttons, party actions, read-only state, empty executable actions, forbidden hooks, and visual-polish text.
- `identify reports/agent-town-hq12k-expedition-event-packet-visual-polish-desktop-2026-06-01.png reports/agent-town-hq12k-expedition-event-packet-visual-polish-mobile-2026-06-01.png`
- `git diff --check`

Screenshot dimensions:

- Desktop: `465x5034`, PNG, 8-bit sRGB.
- Mobile: `366x3589`, PNG, 8-bit sRGB.

## Boundary Confirmation

No server, store, engine, route, tool, spec, scheduler, sharing, Atlas execution, Generated Universe rendering, cross-plot mutation, route/trade economy, resource payout/loss, combat, autonomous movement, packet action, or party-management behavior was added.

Scout Sector remains the only Expedition Map UI mutation path. Event Packet and Expedition Party surfaces remain read-only/buttonless with empty executable actions.
