# AgentTown Mobile Expedition Map Q&A Replay

Date: 2026-06-01
Mode: mobile player-interviewer, Expedition Map focused
Viewport: iPhone-style 390 x 844 CSS px, device scale 2
Verdict: `PASS_WITH_NOTES_READY_FOR_ROBIN_QA`

## Setup

I reused the local server already answering on `http://[::1]:4174` and loaded the real `/founders-plot` page. The replay used deterministic Playwright route fixtures for the Founders Plot state and Scout Sector response so the screenshots show the current production UI/CSS/Three.js runtime with a stable server-shaped Expedition Map model.

No production source files were edited. The only new files are report/proof/screenshot artifacts under `reports/`.

Contact sheet:

- `reports/agent-town-qa-replay-mobile-expedition-map-contact-sheet-2026-06-01.png`

Proof JSON:

- `reports/agent-town-qa-replay-mobile-expedition-map-proof-2026-06-01.json`

## Q&A Replay

### Q1. Does the mobile player immediately understand this is the current Expedition Map surface?

Observed answer: yes. The page opens into a tall mobile Founders Plot surface with the Expedition Map panel clearly present, followed by a focused panel screenshot. The map reads as a scout-board/ledger surface rather than a generic data table.

Evidence:

- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-01-initial-full-mobile-page.png`
- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-02-expedition-map-panel-initial.png`

### Q2. Can a mobile player understand fog states?

Observed answer: mostly yes. The four states are visible through the legend and map/card language: discovered, known, hinted, and locked unknown. The selected hinted cell is called out as hidden, with no resources, routes, or actions exposed. The locked unknown state also explains that no Expedition Map action is available.

Evidence:

- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-03-fog-legend-current-focus-boundary.png`
- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-04-selected-hinted-sector-rules.png`
- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-07-selected-locked-sector-sealed.png`

### Q3. Can the player select sectors and see the selected-sector meaning change?

Observed answer: yes. Tapping/clicking the Three.js map changes the selected card. Known cells reveal reviewed planning truth, resource hints, and receipt links. Locked unknown cells stay sealed and suppress resources and receipt links. This is the most important comprehension win in the current build.

Evidence:

- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-06-selected-known-sector-resource-receipts.png`
- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-07-selected-locked-sector-sealed.png`

### Q4. Does mobile zoom/pan work and does semantic zoom explain itself?

Observed answer: yes, with a note. Wheel/touch simulation moved the runtime from survey zoom to detail zoom, and touch-drag panned the map camera. Proof records camera zoom increasing from `1` to `2.353` and pan moving camera x/y to `1.095 / 0.493`. The detail view text explains the selected locked sector stays sealed. After Scout Sector rerender, the semantic tier returns to Survey view, which is acceptable but worth Robin noticing live.

Evidence:

- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-08-semantic-zoom-detail-view.png`
- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-09-touch-panned-map-surface.png`
- `reports/agent-town-qa-replay-mobile-expedition-map-proof-2026-06-01.json`

### Q5. Does the player understand what Scout Sector does?

Observed answer: yes. Before clicking, the Scout Sector card is the only obvious Expedition Map action and it targets the hinted edge. After clicking, the map rerenders with the hinted sector changed to known, the Scout button disappears, and the Event Packet appears as read-only result flavor. This matches the current boundary: Scout Sector reveals one eligible sector; it does not move a party, harvest resources, create routes, trade, execute Atlas, or schedule anything.

Evidence:

- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-05-scout-sector-before-click.png`
- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-10-after-scout-sector-map-panel.png`
- `reports/agent-town-qa-replay-mobile-expedition-map-proof-2026-06-01.json`

### Q6. Are Event Packet and Expedition Party clearly read-only/buttonless?

Observed answer: yes. The Event Packet screenshot has receipt-bound narrative and facts but no buttons. The party roster is flavor/manifest only. Proof records `eventPacketButtons: 0` and `partyButtons: 0`.

Evidence:

- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-11-event-packet-read-only-card.png`
- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-12-expedition-party-read-only-roster.png`
- `reports/agent-town-qa-replay-mobile-expedition-map-proof-2026-06-01.json`

### Q7. Is the current-focus / authority boundary understandable?

Observed answer: yes, but it is dense. The boundary says the projection is server-owned and excludes autonomous movement, resource gathering, routes, trades, combat, public sharing, Atlas execution, and external effects. This is clear for a proof/interviewer flow, but Robin may want to read it aloud once during the live playthrough because it is a lot of policy text on mobile.

Evidence:

- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-13-future-horizon-boundary-note.png`
- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-03-fog-legend-current-focus-boundary.png`

### Q8. Does the live map feel aligned with the HQ13W/HQ13X identity gate?

Observed answer: pass with notes. The runtime proof records `visualShell: hq13y_agenttown_runtime_composition_prototype_v1` with `agentTownIdentityCues`, `scoutLedgerHud`, `beaconPlanWagonCues`, `frontierBoundaryVisualOnly`, and `receiptTraceVisualOnly`. The live map now carries the HQ13W/HQ13X direction: parchment/ledger, beacons, plan-wagon cues, scout-board language, and civic receipt boundaries. It is still a procedural runtime prototype, not a premium full-bleed generated world map or promoted visual pack.

Evidence:

- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-02-expedition-map-panel-initial.png`
- `reports/agent-town-hq13w-style-corrected-map-view-2026-06-01.png`
- `reports/agent-town-post-hq13y-runtime-visual-qa-contact-sheet-2026-06-01.png`
- `reports/agent-town-qa-replay-mobile-expedition-map-proof-2026-06-01.json`

### Q9. Does mobile layout hold up?

Observed answer: pass. Proof records `width: 390`, `scrollWidth: 390`, and `bodyScrollWidth: 390` after the Scout Sector replay. Focused screenshots do not show obvious horizontal overflow. Some individual cards are very tall, especially Event Packet and known-sector details, but readable.

Evidence:

- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-10-after-scout-sector-map-panel.png`
- `reports/agent-town-qa-replay-mobile-expedition-map-2026-06-01-11-event-packet-read-only-card.png`
- `reports/agent-town-qa-replay-mobile-expedition-map-proof-2026-06-01.json`

## Verdict

The map is ready for Robin's live playthrough Q&A as a proof of the new map/world direction. It now demonstrates a real mobile Expedition Map loop: fog comprehension, sector selection, mobile zoom/pan, Scout Sector reveal, read-only Event Packet, read-only Expedition Party, and explicit authority boundaries.

It should be framed as current playable prototype quality, not final world-map quality. The strongest live message is: AgentTown is moving toward a private Civilization-style unknown-world map, but today the only mutation path is Scout Sector revealing one sector at a time.

## Questions Robin Should Answer Live

1. On first glance, do you know what the four fog states mean?
2. Does the scout-board / parchment / beacon / receipt style feel like AgentTown, or still too generic?
3. When you tap known vs locked vs hinted sectors, does the selected-sector card make the state difference obvious?
4. Is Scout Sector's promise clear: one bounded reveal, no movement, no routes, no harvesting?
5. Does the Event Packet feel like useful world flavor, or too much text for mobile?
6. Does the Expedition Party roster make the world feel inhabited while staying buttonless/read-only?
7. Is the authority boundary too dense, or acceptable as proof text for now?
8. What part should become more visual next: fog edges, map terrain, party/event cards, or the current-focus strip?

## Housekeeping

- Screenshot generation succeeded after one selector correction; the failed first pass left no production edits.
- Contact sheet generation needed a no-font ImageMagick fallback because `montage -title` failed on the local font config.
- The proof uses route fixtures against the real `/founders-plot` page, so it proves current runtime rendering and interaction behavior, not a real persisted server-state mutation.
- No broken screenshot files were found by `file`.
- No production source files were changed.
