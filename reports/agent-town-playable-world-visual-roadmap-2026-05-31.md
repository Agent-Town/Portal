# Agent Town Playable World Visual Roadmap - 2026-05-31

## Summary

Robin's visual target is right: the latest GPT Image 2 / AgentTown world-map look is the direction the game should grow into.

The whole game is not yet consistently at that level. Current Founders Plot has strong pockets: HQ3-HQ11 card art, major building props, named inhabitant sprites, base-operator sprites, civic actors, World Grid props, and newer polished panels. It is still a first-draft vertical-slice level for the full game, not the final art baseline everywhere.

The next phase is to make that visual target playable instead of decorative.

This is not a Wild West universe. The reference image is useful for its readable fog-of-war, zoomable world-map composition, cozy settlement detail, UI layering, and playable travel route language. It should not pull AgentTown toward cowboy, saloon, gold-rush, dusty frontier-town, or American western genre cues.

The target is:

- private Civilization-style frontier map
- server-owned fog-of-war
- bounded expedition missions that reveal one sector at a time
- named operator party flavor
- receipts and approvals for every mutation
- Progression Atlas stays advisory unless a future bounded slice promotes a server action

## Current Visual Readiness

### Already Near The Target

- GPT Image 2 card art for Expedition Board, Scout Reports, Site Plans, Convoys, Settlement Claims, Research Lodge, Work Orders, Civic Proposal records, Generated Universe overlay records, and World Grid Civic Beacon.
- Named inhabitant/operator sprites with backstory and alpha-cleaned runtime sheets.
- Base building operators for Farm Plot, Quarry, Lumber Camp, and HQ civic notices.
- Visual-only scene projection for real server/read-model anchors.
- HQ11 Civic Operations user-ready polish with desktop/mobile proof.

### Still First Draft

- The whole game is not yet one unified premium visual style.
- Progression Atlas still needs a top-notch art/UI audit against the newest GPT Image 2 standard.
- The outside world is still represented by Scout Reports, Site Plans, Settler Convoys, outposts, and World Grid summaries, not a playable frontier map.
- Fog-of-war is not yet visible or interactive.
- Generated Universe is still presentation/local preview only; it is not real shared rendering.

## Roadmap

### Milestone 0 - Lock The Visual Target

Goal: Turn the admired image/style into an explicit product target.

Deliverables:

- Visual target report with references to the current best GPT Image 2 assets.
- UI/art gap matrix: Founders Plot, Progression Atlas, World Grid, Expedition Map, cards, inhabitants, and mobile.
- Screenshot contact sheet showing current best state and mismatched areas.

Definition of done:

- Report under `reports/`.
- Desktop and mobile proof images.
- No gameplay changes.

Active lane:

- Linnaeus: Progression Atlas GPT Image 2 top-notch UI/art audit.

### Milestone 1 - Make HQ11 Feel User-Ready

Goal: Finish the current city-builder core so it feels like a game panel, not backend instrumentation.

Deliverables:

- Polished HQ11 Civic Operations UI.
- Clear next action and receipt copy.
- Mobile-readable board.
- Focused e2e coverage.

Definition of done:

- Report and proof screenshots.
- Focused Playwright passes.
- No new authority.

Status:

- Gibbs complete and parent-verified.

### Milestone 2 - HQ12A Frontier Map Read Model

Goal: Add server-owned map/fog metadata derived only from existing gameplay truth.

Deliverables:

- Private owner-scoped expedition/frontier read model.
- Sectors derived from Scout Reports, Site Plans, Settlement Claims, outposts, and World Grid/civic state.
- Hidden/scouted/planned/claim-ready/convoy/outpost statuses.
- Proof JSON.

Definition of done:

- Server tests for the read model.
- Stable proof JSON.
- No frontend collision with HQ11/Atlas polish.
- No autonomous movement, harvesting, route/trade economy, combat, public sharing, Generated Universe rendering, or Atlas execution.

Active lane:

- Carver: HQ12A Expedition Map / Fog-of-War backend read-model first slice.

### Milestone 3 - HQ12B First Playable Frontier Map UI

Goal: Show the player a beautiful, readable private unknown-world map.

Deliverables:

- Founders Plot Expedition Map panel over the server read model.
- Hidden sector silhouettes.
- Revealed sector cards with terrain, risk, resource hints, status, and linked receipts.
- Outpost markers tied to real owned plots.
- Desktop and mobile proofs.

Definition of done:

- UI reads server model only.
- No new mutation buttons yet except links to existing safe actions.
- Focused Playwright coverage.
- Screenshot contact sheet.

Next lane:

- Spawn after Carver lands.

### Milestone 3B - Three.js Zoomable Frontier Renderer

Goal: Turn the validated Expedition Map panel into the visual target: a zoomable, pannable Three.js frontier map that feels like a real world rather than a static dashboard.

Deliverables:

- Three.js Expedition Map renderer using the same server-owned HQ12A/HQ12B read model.
- Mouse wheel / trackpad pinch zoom on desktop.
- Touch pinch zoom and drag pan on mobile/tablet.
- Camera bounds so the user cannot lose the map.
- Semantic zoom levels: distant terrain/fog view, mid-range sector labels, close-range receipts/resources/operators.
- Selectable sectors that open the existing read-only sector detail/cards.
- Visual proof that hidden sectors do not leak resource/risk facts.

Definition of done:

- Renderer consumes server map cells only; no client-fabricated sectors.
- Zoom/pan/select covered by Playwright or a focused browser proof.
- Canvas pixel proof shows nonblank terrain/fog/sectors at desktop and mobile viewports.
- No new server mutation, Atlas execution, Generated Universe public rendering, route/trade economy, combat, or background expeditions.

### Milestone 4 - HQ12C Scout Sector Mission

Goal: Make fog-of-war playable.

Deliverables:

- One bounded server action, likely `et.plot.scout_sector`.
- One adjacent hidden sector can be revealed per explicit mission.
- Cost, duration, idempotency, receipt, and audit event.
- Agent callers require matching approval.
- Atlas action ref metadata, non-executable.

Definition of done:

- Unit/contract/HTTP tests.
- UI button over explicit route.
- One desktop/mobile proof of hidden -> scouted.
- No free roaming or background expedition loop.

### Milestone 5 - Expedition Event Packet

Goal: Add the first Oregon/Origin-Trail style moment without turning it into a full travel simulator.

Deliverables:

- Mission result receipt can include a bounded event: weather, trail marker, hazard hint, operator observation, confidence change.
- Named operator party flavor in the receipt.
- No damage, death, random resource loss, or hidden autonomy in first pass.

Definition of done:

- Receipts are deterministic/testable enough for QA.
- Events are readable and fun.
- Server remains source of truth.

### Milestone 6 - Outpost Map Loop

Goal: Make leaving base matter.

Deliverables:

- Founded outposts appear on the frontier map.
- Outpost keeper projection remains visual-only and tied to real outpost state.
- Read-only outpost summary links back to owned plot data.
- Later plot switching remains separate.

Definition of done:

- Existing outpost creation updates the map.
- No route/trade economy yet.
- Proof that map changes come from real founded state.

### Milestone 7 - Visual Cohesion Pass

Goal: Bring the whole playable loop closer to the admired graphic level.

Deliverables:

- Sector terrain tiles/card art.
- Fog/reveal visual language.
- Expedition mission card art.
- Operator party portraits/sprites where missing.
- Atlas/World Grid icon polish.

Definition of done:

- Contact sheets and UI screenshots.
- Asset provenance and prompt sidecars.
- Chroma/alpha artifact validation where sprites are involved.

### Milestone 8 - Playtest And Cut

Goal: Decide whether this is fun, not just impressive.

Deliverables:

- Fresh-player playtest from HQ1 to first revealed sector.
- Late-game playtest from HQ11 to first outpost sector map.
- Mobile 390px proof.
- Boundary/adversarial test pass.
- Findings ranked by severity.

Definition of done:

- Markdown QA report.
- Proof JSON and screenshots.
- Clear go/no-go for the next expansion slice.

## Subagent Conveyor

Current lanes:

- Gibbs: HQ11 user-ready UX polish - complete and parent-verified.
- Einstein: post-HQ11 expedition/fog-of-war plan - complete and parent-verified.
- Linnaeus: Progression Atlas GPT Image 2 top-notch UI/art audit - active or pending handoff.
- Carver: HQ12A Expedition Map / Fog-of-War backend read model - active or pending handoff.

Next recommended lanes:

1. HQ12B Expedition Map UI after Carver lands.
2. HQ12C Scout Sector server action after the read model and UI are stable.
3. Frontier visual cohesion pass after the first playable map exists.
4. Fresh-player and late-game playtest after HQ12C.

## Non-Negotiable Boundaries

- Do not make Progression Atlas executable.
- Do not make Generated Universe public/shared/real-rendering without a separate explicit slice.
- Do not add autonomous operations, scheduler behavior, route/trade economy, combat, or background expedition loops in this roadmap's first playable pass.
- Do not fabricate visual actors without server/read-model anchors.
- Do not drift into a Wild West setting. Expedition/frontier language means unrevealed map edge only, not cowboy or saloon genre aesthetics.
- Every milestone needs a report, proof artifact, and focused verification.
