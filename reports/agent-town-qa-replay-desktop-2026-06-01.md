# AgentTown Q&A Replay Desktop

Date: 2026-06-01
Viewport: desktop, 1440x1000
Mode: bounded playtest/report only. No production source edits, commits, pushes, deploys, cleanup, or external messages.

## Verdict

Yes, it is time for Robin to do a live playthrough Q&A, with one caveat: the live run should focus on how the first 5 minutes explain the town loop, then jump deliberately to the Expedition Map / Scout Sector / Event Packet surfaces. The current build has a surprisingly complete civic frontier-tech shape: real HQ/resource progression, visible town assets and inhabitants, a dense Progression Atlas, a server-bound Expedition Map read model, Scout Sector as the only current map mutation, receipt-backed event packets, read-only expedition party flavor, and World Grid / Civic Operations boards.

Robin should focus feedback on clarity rather than scope: whether the first-time player understands what to click, whether the Atlas is useful or overwhelming, whether Scout Sector feels like a satisfying action despite being intentionally bounded, and whether the advanced boards read as playable civic systems instead of proof panels.

Contact sheet: `reports/agent-town-qa-replay-desktop-contact-sheet-2026-06-01.png`
Proof JSON: `reports/agent-town-qa-replay-desktop-proof-2026-06-01.json`

## Replay Notes

The first screenshots use a real local test-mode server session on `/founders-plot`. The later HQ11/HQ12 screenshots use an e2e-style advanced replay fixture routed through the current Founders Plot UI renderer, because those surfaces are not practical to reach from a fresh plot in one bounded desktop playtest.

## Q&A Replay

**Q: What is the first impression?**
**A:** Founders Plot now opens as a coherent frontier-tech town scene: warm terrain art, labeled buildings, resource chips, HQ level, scout/report/plan counters, and a visible Atlas entry. The game immediately looks like a playable town builder rather than a raw debug page.
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-01-first-impression-real-fresh-page.png`

**Q: What can the player do immediately?**
**A:** Clicking an empty plot opens a build menu with costs and lock states. Lumber Camp is immediately available; Farm Plot shows resource requirements; Quarry and later structures communicate HQ locks.
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-02-immediate-actions-build-menu.png`

**Q: Does the first production loop work?**
**A:** Yes. The player can place a Lumber Camp, see it building, advance into an idle/ready state, queue production, and collect outputs. The loop is legible: selected building panel, action queue, requirements, Foreman panel, rewards, owned plots.
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-03-production-loop-building-started.png`
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-04-hq-progression-loop-ready-to-produce.png`
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-05-hq-progression-loop-ready-to-collect.png`

**Q: Is the HQ/progression gate understandable after collection?**
**A:** Mostly. After the first collect, the HQ panel shows upgrade requirements and deficits clearly. It communicates “keep producing” well, but the screen is dense, so a live player may still need to be asked what they think the next best action is.
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-06-hq-upgrade-gate-after-first-collect.png`

**Q: Are visible inhabitants/assets present?**
**A:** Yes. The stage shows an illustrated town scene with placed building labels and small inhabited/asset hooks. It feels more like a living settlement than earlier grid-only proofs, though the inhabitants are still mostly visual flavor at this zoom.
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-07-visible-inhabitants-assets-stage.png`

**Q: Is the Progression Atlas clear?**
**A:** It is powerful and present, but dense. The modal opens cleanly and shows resource gates, main path, strategy buttons, and horizon content. For Robin’s live Q&A, this is a good place to ask whether the Atlas feels like guidance, a ledger, or too much all at once.
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-08-progression-atlas-modal-real.png`

**Q: What does the advanced HQ / Expedition Board state show?**
**A:** In the advanced replay, the settlement has HQ11-level context, an Expedition Board, Workshop, scout reports, site plans, owned home/outpost records, and the same visual town shell. This proves the UI can hold later civic/expedition systems without abandoning the core town-builder frame.
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-09-advanced-hq-expedition-board-scouthub.png`

**Q: Are Scout Reports and Site Plans visible as planning ledgers?**
**A:** Yes. The Scout Report and Site Plan panels read as bounded planning artifacts, with reviewed/claim-ready language rather than open-ended territory expansion. This matches the current Founders Plot boundary.
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-10-scout-reports-site-plans-ledgers.png`

**Q: Is the Expedition Map / Scout Sector surface understandable before scouting?**
**A:** Yes. The map panel shows fog counts, discovered/known/hinted/hidden sector categories, the server-owned read-only boundary, a selected sector, and exactly one eligible Scout Sector button on the hinted edge. Known and locked sectors do not expose mutation buttons.
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-11-expedition-map-before-scout-sector.png`

**Q: What happens when Scout Sector is used?**
**A:** The hinted sector becomes known, fog counts update, and the UI shows a Scout Sector receipt plus an Event Packet and party flavor. The important boundary is visible: this reveals one sector as map truth, but does not create routes, harvesting, combat, public sharing, Atlas execution, or hidden autonomy.
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-12-scout-sector-event-packet-party.png`

**Q: Does the Event Packet feel like useful evidence?**
**A:** Yes. The packet has a title, receipt link, type/source chips, field-note copy, read-only facts, zero executable actions, and boundary text. It feels like a scout report artifact rather than a hidden action launcher.
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-13-event-packet-detail.png`

**Q: Does the Expedition Party add flavor without implying autonomy?**
**A:** Yes. Mira Trailmark, Rook Signalpost, and Vale-Desk 7 appear as a named read-only party/manifest. The panel gives identity and civic texture, but no assignments, routes, harvesting, or actions.
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-14-expedition-party-detail.png`

**Q: Is the current focus visible?**
**A:** Yes, especially in the Expedition Map objective strip after scouting. It points the player toward reviewing the latest packet and explicitly says the packet has zero executable actions and no new server objectives.
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-12-scout-sector-event-packet-party.png`

**Q: Are World Grid and Civic Operations reachable?**
**A:** Yes in the advanced replay. World Grid presents requirements, known scope, civic readiness, and prohibited capabilities as a read-only advisory projection. Civic Operations shows a local-care ledger, active public work count, care score, and human inspection receipt framing.
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-15-world-grid-civic-operations-reachable.png`
Evidence: `reports/agent-town-qa-replay-desktop-2026-06-01-16-civic-operations-local-care-ledger.png`

## What Still Feels Missing Or Confusing

- The fresh first-run path is playable, but the page is information-dense before the player has earned most of that context.
- The Progression Atlas is impressive but likely needs live user feedback on whether it guides or overwhelms.
- The Expedition Map and packets are clear in advanced replay, but a live player may not intuit how long it takes to reach those systems from HQ1.
- Some screenshots are very tall full-page captures. They are useful as proof, but the cropped element screenshots are easier to inspect.
- The advanced replay is UI-renderer proof, not a literal fresh-save progression from HQ1 to HQ12 in this pass.

## Housekeeping

- Created 16 desktop screenshots plus one contact sheet and proof JSON under `reports/`.
- No production source files were changed.
- The first screenshot script completed the PNG captures but failed at proof JSON creation due to a local variable referenced inside `page.evaluate`; proof JSON was backfilled from generated artifact metadata.
- ImageMagick `montage` failed on this machine because no default font was configured, so the contact sheet was assembled manually from thumbnail rows without labels.
- No tests were run beyond the live browser interactions and artifact verification for this report.
