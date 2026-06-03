# AgentTown HQ17B Option 1 HUD Information Map

Date: 2026-06-03
Scope: parent implementation review checklist for turning HQ17A option 1 into a real runtime HUD.
Verdict: `READY_FOR_PARENT_IMPLEMENTATION_REVIEW`

## Inputs Read

- `reports/agent-town-hq17a-gpt-image-2-fullscreen-hud-redesign-review-2026-06-03.md`
- `reports/agent-town-hq16y-continuous-expedition-loop-replay-2026-06-03.md`
- `reports/agent-town-hq16z-map-native-packet-plan-review-outpost-scout-verbs-2026-06-03.md`
- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `public/experiences/founders-plot/three_scene_entry.js`
- `e2e/207_founders_plot_hq16y_continuous_expedition_loop.spec.js`
- `e2e/208_founders_plot_hq16z_map_native_packet_plan_review_outpost_scout_verbs.spec.js`

No app/source/e2e/server files were edited for HQ17B. This is analysis/report only.

## Option 1 Read

HQ17A concept 01 is the correct runtime target because it makes the map the game surface instead of another panel. The implementation should not copy the image as decoration. It should bind current server-owned Expedition Map state into option 1's layout:

- map fills the first viewport;
- playable state is spatial, close to units, targets, routes, markers, and outcomes;
- long proof, endpoint, boundary, and ledger copy is hidden by default;
- commands remain existing guarded endpoints or existing map-preview confirmations;
- renderer marks remain visual/read-only unless the existing frontend command handler confirms an existing guarded endpoint.

## HUD-Visible Gameplay Information For HQ16Y/Z

The full HQ16Y/Z loop must be playable from visible HUD information without reading a dashboard.

Visible primary information:

- Map status: this is the private Expedition Map, with compact revealed/hidden/fog counts and a selected-cell status cue.
- Current loop phase: objective, command, resolve, receipt, and next step from the guided loop model.
- Selected cell: compact cell kind, fog state, Scout eligibility, receipt count, and party/unit presence.
- Unit roster: Scout, Surveyor, Settler Convoy, Outpost Crew, and any supporting units as selectable tokens with selected state, location/fog cue, and ready-command count.
- Command readiness: Scout, Move when available, Plan, Review, Convoy, Found, and Next Scout as short verbs/icons, never endpoint names.
- Spatial targets: selected unit command rings, target rings, selected-cell outline, Scout target, packet target, convoy/founding target, outpost next-frontier target, and any path/route hint needed to understand the loop.
- Event packet: a visible map marker after Scout Sector, tied to the revealed/known cell.
- Packet Plan/Review bridge: `Plan` and `Review` visible as map-native verbs, preserving current `data-map-native-verb` and existing guarded action names in data attributes.
- Convoy state: Settler Convoy token/dock entry, "rolling/preparing" outcome cue, and Found absent until arrival.
- Found Outpost result: owned outpost marker, Outpost Crew token, server-owned command outcome, and `Next Scout` cue.
- Outcome feedback: a compact server-owned result chip/pulse after Scout, Plan, Review, Convoy, Found, and next Scout.
- Mobile fit state: same information is available at 390px without horizontal overflow or scrolling past prose before seeing the map.

Visible secondary information:

- Short selected-context facts for discovered/known cells only, if already server-exposed.
- Terrain or risk should be shown spatially through map visuals first. Numerical resource hints should remain off-primary unless resource gameplay becomes part of an explicit later slice.
- Receipt/provenance count may be visible as a badge; receipt content stays in Ledger.

## Slot Mapping

| Option 1 slot | Runtime information to map there | Current hooks/evidence to preserve |
| --- | --- | --- |
| Top-left crest/status | Replace the current title pill/dashboard feel with a crest-like map status: private map identity, compact revealed/hidden counts, current focus glyph, selected fog code, and maybe one small objective progress pip row. No paragraphs. | Current `fp-expedition-map-panel` title, `fp-expedition-map-status`, `fp-expedition-map-status-symbols`, `fp-expedition-objective-strip`, `fp-expedition-guided-loop`. |
| Map spatial markers/rings/routes | Main play truth: terrain/fog, selected outline, unit sprites, event packet marker, objective marker, command target rings, command outcome pulse, outpost next-frontier beacon, and a visual-only dotted route/path hint between selected unit/outpost and target. | Three.js proof fields: `units`, `eventMarkers`, `objectiveMarkers`, `commandTargets`, `commandOutcomeFeedback`, `outpostNextFrontierBeacons`, plus `visualLayers.clientAuthority === false`. |
| Bottom unit dock | Move the current unit roster into the option-1 bottom dock. Show selectable unit portraits/sprites, role color, selected ring, cell/fog badge, ready-command count, and convoy/outpost state. | `fp-expedition-unit-roster`, `fp-expedition-unit-token-*`, `data-unit-id`, `data-unit-type`, `data-cell-id`, `aria-pressed`, `data-actions`. |
| Selected-unit command puck/radial | Commands should live near the selected map unit/target, not as a dashboard row. Show icon pucks for Scout, Move, Plan, Review, Convoy, Found, Confirm, Cancel. Target metadata stays in data/aria/title. | `fp-expedition-command-preview`, `fp-btn-expedition-command-preview-confirm`, `fp-expedition-unit-command-bar`, `fp-btn-scout-sector-unit-command-*`, `fp-btn-prepare-settler-convoy-unit-command-*`, `fp-btn-found-settlement-unit-command-*`, and renderer `commandTargets`. |
| Right ledger tab | A collapsed vertical ledger tab only. It should open receipts, fog ledger, selected-sector proof, event/marker details, sector aliases, and revealed-sector ledger. Closed state should be tiny and non-dominant. | Current collapsed details: `fp-expedition-map-authority-details`, `fp-expedition-objective-ledger-details`, `fp-expedition-inspector-selected-details`, `fp-expedition-inspector-evidence`, `fp-expedition-inspector-fog-ledger`, `fp-expedition-inspector-scout-aliases`, `fp-expedition-inspector-ledger`. |
| Lower/right selected-context instrument | Compact instrument for the selected cell/unit/outpost: selected glyph/fog, receipt count, party count, outpost state, `Next Scout`, and latest outcome. It should feel like a dial/instrument, not a card stack. | `fp-expedition-map-selected-summary`, `fp-expedition-outpost-status`, `fp-expedition-outpost-next-scout-cue`, `fp-expedition-command-outcome-chip`, `fp-scout-sector-result`. |
| Hidden title/aria/data/proof | Full names, raw ids, endpoint/action names, guardrails, source ids, packet/plan/claim ids, provenance, proof text, and test assertions belong here. | Existing `title`, `aria-label`, `data-*`, proof JSON, and `window.__foundersPlotTest.getExpeditionMapInfo()`. |

## Loop State Mapping

| HQ16Y/Z loop step | Primary visible HUD state | Slot |
| --- | --- | --- |
| Scout/objective ready | Scout unit selected or selectable, Scout target ring on hinted frontier cell, objective/guided-loop command says Scout. | Map rings, bottom dock, command puck, top-left crest/status. |
| Scout Sector result | New known/discovered cell, event packet marker, server-owned outcome pulse, receipt badge count increments. | Map marker, map outcome pulse, lower/right instrument. |
| Event Packet to packet-derived Site Plan | Packet marker/selected context exposes `Plan` as a short map verb. | Selected-context instrument or puck next to marker. |
| Packet Site Plan to Review | The same bridge shows `Review`, not paperwork-heavy Site Plan prose. | Selected-context instrument or command puck. |
| Review to Surveyor Prepare Convoy | Surveyor appears in unit dock; Convoy command/ring appears for the reviewed plan target. | Bottom dock, map command ring, command puck. |
| Prepare Convoy to Settler Convoy | Settler Convoy appears in dock/on map; outcome says rolling/preparing; Found remains unavailable. | Bottom dock, map token, outcome pulse. |
| Arrival-gated Found Outpost | After arrival, Found command/ring appears; before arrival, no Found button or Found ring. | Map command ring, command puck. |
| Found Outpost to Outpost Crew | Outpost marker and Outpost Crew token appear; outpost selected context says `Next Scout`. | Map marker/beacon, bottom dock, lower/right instrument. |
| Outpost Crew to next Scout bridge | Next Scout beacon/ring points to the server-exposed hinted target; clicking/confirming still uses existing Scout Sector path. | Map beacon/ring, command puck, hidden action metadata. |

## Keep Ledger/Audit-Only

These should not be primary visible HUD text in option 1:

- Raw ids: `cell_*`, packet ids, site plan ids, claim ids, founded plot ids, plot ids, idempotency keys.
- Endpoint/action strings: `/api/...`, `et.plot.*`, server route names, test route names.
- Proof and authority prose: "server-owned", "read-only projection", "boundary flags", "no Atlas execution", route/resource/reward/combat/scheduler disclaimers.
- Full receipt/provenance content, source ids, scout ids, plan ids, claim ids, and audit trails.
- Event packet internals beyond a marker, short packet/receipt badge, and next command verb.
- Hidden/hinted/locked sector details: resources, routes, terrain specifics, risk, rewards, actions, or any hidden truth.
- Sector action aliases. They can stay in a collapsed ledger for regression compatibility, but the primary play path should be unit/ring/puck driven.
- Revealed-sector ledger cards and selected-sector proof cards. They are audit drawers, not the HUD.
- Test-only convoy time advance. It must never be visible or implied as gameplay.
- Conventional dashboard tables, large metric rows, repeated fog legends, raw cell lists, and multi-card status summaries.

## Parent Acceptance Checks

The parent should run the existing focused proof first:

- `node --check e2e/207_founders_plot_hq16y_continuous_expedition_loop.spec.js`
- `node --check e2e/208_founders_plot_hq16z_map_native_packet_plan_review_outpost_scout_verbs.spec.js`
- focused Playwright for `FP-E2E-022Y`
- focused Playwright for `FP-E2E-022Z`
- `jq empty` on the HQ16Y/HQ16Z proof JSON outputs
- `git diff --check`

Checks to add or extend for HQ17B implementation:

1. Map-first layout proof:
   - At `1280x900`, `fp-expedition-three-host` or the real map host occupies most of the first viewport.
   - Top-left status, bottom dock, right ledger tab, selected-context instrument, and command puck are overlays, not block layout that pushes the map down.
   - No primary HUD overlay has a large blank card footprint.

2. Option-1 slot presence:
   - Assert top-left crest/status exists and contains compact status only.
   - Assert bottom unit dock exists and contains the same selected unit roster semantics as `fp-expedition-unit-token-*`.
   - Assert selected-unit command puck/radial appears when a command target ring is selected.
   - Assert right ledger is collapsed by default and has `data-actions="0"`.
   - Assert lower/right selected-context instrument reflects selected cell/outpost state.

3. Full loop visible-state assertions:
   - Scout ready: Scout token selected/available, Scout command ring present, command target is `previewOnly/readOnly/visualOnly`, and guided loop primary command is Scout.
   - After Scout: event marker count is at least 1, outcome feedback is server-owned, and Plan is visible near marker/selected context.
   - Plan step: visible button/verb is exactly `Plan`; visible primary text does not include `Survey`; action metadata remains `et.plot.draft_site_plan_from_packet`.
   - Review step: visible button/verb is exactly `Review`; primary text does not show paperwork-heavy "Draft Site Plan", "Review Site Plan", or "Settlement Charter review available"; action metadata remains `et.plot.review_site_plan`.
   - Convoy step: Surveyor token is available, Convoy command is present, and Prepare Convoy uses the existing guarded endpoint.
   - Arrival gate: Found command is absent before arrival and present only after the existing e2e time advance/reload.
   - Outpost step: Outpost Crew token is available, outpost marker/beacon exists, `Next Scout` cue exists, and cue/beacon have zero executable actions.

4. Renderer authority checks:
   - From `window.__foundersPlotTest.getExpeditionMapInfo()`, assert:
     - `visualLayers.clientAuthority === false`
     - `eventObjectiveMarkersVisualOnly === true`
     - `eventObjectiveMarkersReadOnly === true`
     - `eventObjectiveMarkerAuthority === false`
     - `commandTargetRingsVisualOnly === true`
     - `commandTargetRingsReadOnly === true`
     - `commandTargetRingsPreviewOnly === true`
     - `commandTargetRingAuthority === false`
     - `outpostNextFrontierBeaconVisualOnly === true`
     - `outpostNextFrontierBeaconReadOnly === true`
     - `outpostNextFrontierBeaconAuthority === false`
     - `outpostNextFrontierBeaconHiddenTruthLeakage === false`
     - `commandOutcomeFeedbackServerOwned === true` when an outcome is active

5. Primary text budget:
   - Gather visible text from primary HUD slots only, excluding closed/open ledger bodies.
   - Fail if it contains raw ids matching `cell_`, `packet_`, `site_plan_`, `claim_`, `plot_`, endpoint paths, or `et.plot.*`.
   - Fail if it contains proof/dashboard phrases such as `server-owned`, `read-only projection`, `boundary flags`, `Atlas execution`, `resource gathering`, `routes`, `trades`, `scheduler`, or `external effects`.
   - Allow those strings in `title`, `aria-label`, `data-*`, closed details, and proof JSON.

6. Ledger behavior:
   - Ledger tab is closed by default.
   - Opening it reveals receipt/proof/detail text without adding executable actions.
   - Every ledger/detail surface still has `data-actions="0"` or equivalent proof.
   - Sector aliases stay secondary and are not the first visible action path.

7. Mobile proof:
   - At `390x844` and preferably `366x757`, map remains visible in the first viewport.
   - `document.documentElement.scrollWidth === window.innerWidth`.
   - No clipped primary HUD nodes: map panel, crest/status, unit dock, command puck, selected instrument, ledger tab.
   - Unit dock scrolls horizontally if needed, but command icons and selected unit state are not clipped.

8. Real-runtime proof, not mockup proof:
   - The screenshot/contact sheet should come from the live Founders Plot route, not the HQ17A image file.
   - Data must be driven by current Expedition Map read model and existing guarded handlers.
   - The test should click a real command target ring, show the command preview, confirm it, observe the network request to the existing endpoint, and then observe the resulting map/HUD update.

## Dashboard Regression Risks

- Keeping the current right inspector as an always-open column would make option 1 a dashboard again. It must collapse into a ledger tab by default.
- Leaving the unit roster at top-left as a boxed text rail competes with the crest/status slot. The unit rail belongs in the bottom dock.
- Duplicating the same state across crest, objective strip, selected summary, inspector, and ledger will re-create the text-heavy UI. Pick one visible owner per fact.
- Letting `Plan` and `Review` sit in a bridge card with repeated step labels can still feel like paperwork. They should look like map verbs attached to a marker/selected context.
- A dotted path or route line can imply route/trade authority. It needs proof metadata and visual styling that marks it as a preview/next-step hint, not a route system.
- Command pucks can accidentally become client authority if they execute directly from the renderer. The ring should open preview; Confirm should call the existing guarded frontend handler.
- Using the HQ17A image as a background would fake progress. Parent proof must be DOM/canvas/runtime-driven.
- Overusing counts and pips can turn the crest/status into a metrics dashboard. Show only what a player needs to choose the next action.
- Mobile can regress into a vertical stack of instruments above the map. First viewport must still read as a playable map.
- Ledger detail opened by default, or huge blank tab/panel chrome, will undo the option-1 direction.

## Recommended Parent Verdict Criteria

Mark the option-1 runtime HUD implementation accepted only if:

- A player can complete the HQ16Y/Z loop from map, dock, pucks, rings, and compact instruments without reading audit copy.
- The existing guarded endpoint and renderer-authority checks still pass.
- Raw ids, endpoint strings, proof text, and hidden-truth details are absent from primary visible HUD text.
- Desktop and mobile screenshots clearly read as option 1: full-screen map, compact edge instruments, bottom unit dock, selected-unit command pucks, right ledger tab, and spatial next-step cues.
- The new proof is live-runtime evidence, not review-media evidence.
