# AgentTown Post-HQ12F Expedition Event Packets Regression QA

Date: 2026-05-31

## Verdict

Pass. HQ12F remains a bounded read-only Founders Plot UI/read-model slice, and the focused checks did not show regressions in the adjacent HQ12B/C/D Expedition Map surfaces.

No source files were edited for this QA lane.

## Scope Audited

- Read `reports/agent-town-hq12f-expedition-event-packets-ui-slice-2026-05-31.md`.
- Read and queried `reports/agent-town-hq12f-expedition-event-packets-ui-proof-2026-05-31.json`.
- Verified HQ12F packet guardrails from proof JSON and DOM proof fields.
- Verified the existing HQ12F proof screenshots are valid PNG assets.
- Ran focused syntax, diff whitespace, and Playwright checks.

## HQ12F Guardrail Findings

- Packet card visible: yes.
- Packet id visible: `expedition_event_packet_hq12f_cell_q0_r1`.
- `readOnly`: `true`.
- `executableActions`: `[]`.
- Packet mutation buttons: `0`.
- Scout Sector remains the only mutation path: yes.
- Boundary copy explicitly says there are no packet actions, route/trade creation, resource changes, combat, scheduler work, public sharing, Generated Universe rendering, Atlas execution, cross-plot mutation, or external effects.
- Forbidden hooks remain false in proof JSON: route creation, trade route creation, resource harvesting, combat, Atlas execution, public sharing, Generated Universe rendering, cross-plot mutation, and external effects.

## Regression Coverage

- HQ12B/C read-model map surface: covered by `FP-E2E-022 UI shows HQ12B Expedition Map from the server read model only`.
- HQ12D renderer surface: covered by `FP-E2E-023 HQ12D Expedition Map has bounded Three.js zoom/pan and selectable sectors`.
- HQ12F event packet UI proof path: covered by the same focused `FP-E2E-022` run, which regenerates the HQ12F proof JSON and screenshots.

## Commands

Passed:

- `jq '.' reports/agent-town-hq12f-expedition-event-packets-ui-proof-2026-05-31.json`
- `jq '{ok, packetId: .eventPacket.packetId, readOnly: .eventPacket.readOnly, executableActions: .eventPacket.executableActions, packetButtons: .guardrails.packetButtons, cardVisible: .domProof.eventPacketCardVisible, boundaryText: .domProof.eventPacketBoundaryText, scoutSectorOnlyMutationPath: .guardrails.scoutSectorOnlyMutationPath, forbidden: {routeCreation: .guardrails.routeCreation, tradeRouteCreation: .guardrails.tradeRouteCreation, resourceHarvesting: .guardrails.resourceHarvesting, combat: .guardrails.combat, atlasExecution: .guardrails.atlasExecution, publicSharing: .guardrails.publicSharing, generatedUniverseRendering: .guardrails.generatedUniverseRendering, crossPlotMutation: .guardrails.crossPlotMutation, externalEffects: .guardrails.externalEffects}}' reports/agent-town-hq12f-expedition-event-packets-ui-proof-2026-05-31.json`
- `identify reports/agent-town-hq12f-expedition-event-packets-ui-desktop-2026-05-31.png reports/agent-town-hq12f-expedition-event-packets-ui-mobile-2026-05-31.png`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `git diff --check`
- `PW_PORT=4297 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022"`
- `PW_PORT=4298 npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium`

## Screenshot Proofs

Existing HQ12F proof screenshots verified with ImageMagick:

- `reports/agent-town-hq12f-expedition-event-packets-ui-desktop-2026-05-31.png` - PNG, `465x3679`, 8-bit sRGB.
- `reports/agent-town-hq12f-expedition-event-packets-ui-mobile-2026-05-31.png` - PNG, `366x3828`, 8-bit sRGB.

No additional screenshots were produced by this QA lane.

## Notes

- Playwright web server emitted existing Node/NO_COLOR warnings only; tests passed.
- The worktree was already dirty before this QA lane. This pass only adds this QA report and its proof JSON.
