# AgentTown Playable World Visual Gap Audit - 2026-05-31

## Scope

This is a report-only audit for the new playable-world direction in the dirty shared AgentTown worktree at `/Users/robin/Projects/Portal-atlas-editor`.

It answers Robin's core question: is the whole game now at the newest GPT Image 2 / AgentTown frontier-world-map level?

Short answer: **no**. The best pockets are genuinely strong, but the whole game still reads as a first-draft vertical slice with premium art islands. The next visual work should convert those islands into a coherent private frontier map, sector/fog language, and expedition/party UI.

No source, CSS, server, tests, or production assets were edited for this audit.

## Evidence Reviewed

Primary reports and proofs reviewed:

- `reports/agent-town-playable-world-visual-roadmap-2026-05-31.md`
- `reports/agent-town-hq11-user-ready-ux-polish-2026-05-31.md`
- `reports/agent-town-post-hq11-civic-operations-regression-qa-2026-05-31.md`
- `reports/agent-town-hq10-hq11-gpt-image-2-asset-pack-2026-05-31.md`
- `reports/agent-town-hq3-hq10-image-assets-integration-2026-05-31.md`
- `reports/agent-town-base-operators-readiness-wrap-2026-05-31.md`
- `reports/agent-town-base-operators-scene-wiring-slice-2026-05-31.md`
- `reports/agent-town-post-base-operator-scene-wiring-live-smoke-2026-05-31.md`
- `reports/agent-town-batch-c-civic-world-grid-inhabitants-sprite-integration-2026-05-31.md`
- `reports/agent-town-hq11-civic-actors-scene-wiring-2026-05-31.md`
- `reports/agent-town-progression-atlas-gpt-image-2-top-notch-ui-audit-2026-05-31.md`
- `reports/agent-town-gameplay-playtest-mobile-visual-2026-05-31.md`
- `reports/agent-town-asset-readiness-visual-smoke-2026-05-31.md`
- `reports/agent-town-post-hq11-expedition-fog-of-war-next-stage-plan-2026-05-31.md`

Current filesystem snapshot checks:

- `public/experiences/founders-plot/assets/characters/inhabitants`: 110 files, including 25 JSON sidecars and 65 PNGs.
- `public/experiences/founders-plot/assets/objects`: 40 files, including 16 WebPs and 3 JSON sidecars.
- `public/experiences/founders-plot/assets/buildings`: 18 files; newer HQ3-HQ10 buildings have source sidecars, older base buildings mostly do not.
- `public/assets/icons/agent-town`: 30 files, including the HQ3-HQ10 icon sheet manifest and 27 PNG icon assets.

## Verdict

AgentTown has enough art direction proof to move confidently toward the admired frontier/world-map style. It does not yet have full-game visual consistency at that level.

The strongest current work is concentrated in:

- HQ11 Civic Operations as a game-readable panel.
- GPT Image 2 object/card art for HQ3-HQ11 systems.
- Named operator sprites and newer civic/world-grid inhabitants.
- Base operator sprites now mapped into visual-only scene projection where real descriptors exist.
- Progression Atlas as a safer, clearer control surface.

The weakest current work is the missing playable-world surface itself:

- no HQ12 frontier map UI
- no fog-of-war tile language
- no sector card system
- no expedition mission-card flow beyond current Scout Report abstractions
- no named operator party strip
- no unified map/Atlas/World Grid visual hierarchy

The product should be described as **visually promising and increasingly asset-rich**, not as fully top-notch yet.

## Closest Current Surfaces To The Target

### Founders Plot HQ11 Civic Operations

Readiness: **near target for UI polish, not yet for playable-world fantasy**.

Why it is close:

- The HQ11 board now reads like a game panel rather than backend instrumentation.
- It has clearer next action, metrics, receipt copy, and mobile proof.
- Regression QA verified server-owned HQ10D/HQ11 state, no Atlas execution, and no fake actors.
- Civic actors can appear from real server state: Civic Routekeeper, Oracle Adjunct, and Outpost Keeper.

Where it still falls short:

- The screenshots are extremely tall, which proves coverage but also shows the surface is still dashboard-like.
- The board supports civic inspection/readiness, not playable world navigation.
- It needs to become one visible layer in a world interface rather than another long page section.

### GPT Image 2 Cards And Object Assets

Readiness: **closest to the admired visual level**.

Why it is close:

- HQ3-HQ10 assets cover Expedition Board, Scout Report, Site Plan, reviewed plan, Settler Convoy, claim, outpost, Research Lodge, and Work Order visuals.
- HQ10B/HQ10C now have dedicated Civic Proposal dossier and Generated Universe overlay-pack card art instead of only the shared World Grid beacon.
- The best object art has prompt/source/generated/runtime provenance and reads as a coherent warm frontier-tech visual language.

Where it still falls short:

- The art often appears as small card dressing instead of setting the visual hierarchy of the surface.
- Older base buildings and lots remain provenance-thin.
- Workshop, Market Stall, coin, XP, construct, produce, and collect still have registry specs but not image-backed asset paths in the icon registries.

### Base Operators

Readiness: **near target for named character direction**.

Why it is close:

- Mira Seedhand / `farmer`, Bram Stonecalm / `quarry_mason`, Jun Timberline / `lumber_worker`, and Vale-Desk 7 / `hq_civic_operator` are asset-ready with sidecars, proof, and row-strip evidence.
- Scene projection now maps real existing descriptors to those roles where appropriate:
  - Farm Plot production and ready output -> farmer
  - Quarry production and ready output -> quarry mason
  - Lumber Camp production and ready output -> lumber worker
  - HQ approval/reward notices -> HQ civic operator
- The mappings remain visual-only and preserve fallback behavior.

Where it still falls short:

- The base-operator proof is strong, but these characters do not yet participate in a party/expedition presentation.
- They improve the town layer, not the missing frontier map layer.

### Civic / World Grid Assets

Readiness: **strong identity pieces, partial system surface**.

Why it is close:

- World Grid Civic Beacon is a high-quality prop with runtime PNG/WebP and sidecar provenance.
- Civic Routekeeper and Oracle Adjunct are good examples of the desired human-plus-agent mix.
- HQ11 scene wiring now connects civic/world-grid/outpost actors to real state, not fabricated fixture actors.

Where it still falls short:

- World Grid is still read-model/status presentation, not a playable map.
- The visual identity exists, but the user cannot yet scan sectors, fog, route hints, or frontier status spatially.
- Generated Universe overlay packs remain presentation/local preview records, not real rendering or shared world geometry.

### Progression Atlas

Readiness: **good internal surface, not yet top-notch consumer fantasy**.

Why it is close:

- Atlas is much clearer about server-owned gates, authority boundaries, canonical nodes, HQ9 work orders, HQ10 World Grid, and HQ11 civic operations.
- The newer civic/object art now appears in Atlas nodes.
- Atlas remains non-executable and safer than earlier Strategy Editor framing.

Where it still falls short:

- It still reads like an operations dashboard.
- Mobile proofs show very long vertical surfaces.
- Many nodes still resolve to symbol chips or text-heavy fallback presentation.
- It needs lane filters, mobile sections, stronger visual hierarchy, and image-backed registry completion.

## First-Draft Or Visually Inconsistent Surfaces

### The Outside World

The largest gap is structural: the outside world is not yet a map. It exists as Scout Reports, Site Plans, Settler Convoy claims, founded outposts, World Grid summaries, and civic receipts.

That is good server design, but visually it is still a stack of records. The admired target is a frontier/world-map graphic. The game needs a private map surface before the whole experience can be judged against that style.

### Fog And Reveal

There is no visible fog-of-war language yet.

Missing:

- hidden-sector silhouettes
- scouted-sector reveal states
- planned / claim-ready / convoy-active / outpost state transitions
- reveal animation or receipt-backed state change
- distinction between known terrain shape and hidden resource/risk facts

### Sector Tiles And Cards

Current Scout Report and Site Plan cards are improved, but they are not sector cards.

Missing:

- terrain tile art
- risk/resource hint hierarchy
- sector coordinates/direction
- linked receipt trail
- current status badge that can be read at a glance
- map tile and card sharing a consistent visual grammar

### Expedition Mission Cards

Expedition Board gameplay exists, but the visual presentation is still early.

Missing:

- mission card art and state machine
- operator party strip
- destination sector preview
- cost/duration/risk packed as game UI instead of record text
- completed mission receipt with a satisfying revealed-sector result

### Named Operator Party UI

The roster direction is now strong, but there is no frontier party UI.

The game should surface Pathfinder Scout, Settler Convoy Crew, Outpost Keeper, Civic Routekeeper, Oracle Adjunct, and future operators as named faces attached to explicit missions and receipts. This should stay presentation/read-model oriented at first, with no levels, inventory, equipment, combat, or autonomous authority.

### Older Buildings And Lots

Older base building assets load correctly, but they are visually and provenance-wise behind the newer packs:

- `hq-lv1` through `hq-lv5`
- `lumber-camp`
- `farm-plot`
- `quarry`
- `workshop`
- `market-stall`
- `empty-lot`
- `locked-lot`

They have runtime WebPs, but not the same adjacent prompt/source/generated/json provenance as newer GPT Image 2 assets.

### Atlas / World Grid Visual Hierarchy

Atlas and World Grid now explain the system well, but they are not yet the admired fantasy surface.

Remaining issues:

- symbol-only registry entries for Workshop, Market Stall, coin, XP, construct, produce, and collect
- too much dense dashboard copy
- very long mobile pages
- generated art used too small too often
- Strategy Editor language can still sound executable even when gameplay authority is safe

## Recommended Visual Milestones

### 1. HQ12 Frontier Map

Goal: make the outside world visible as a private, server-owned strategic map.

Deliverables:

- 3x3 or 5x5 private frontier grid around home.
- Home plot, known outposts, and current claim/plan sectors placed spatially.
- Read-only first slice if the backend read model is not landed.
- Desktop and 390px mobile proofs.
- Art direction anchored in the admired frontier/world-map style.

Do not add public territory, route/trade economy, autonomous travel, combat, or Generated Universe rendering.

### 2. Sector Tiles And Cards

Goal: turn Scout Reports and Site Plans into map-native visual units.

Deliverables:

- `HIDDEN`, `SCOUTED`, `PLANNED`, `CLAIM_READY`, `CONVOY_ACTIVE`, and `OUTPOST` tile states.
- Terrain silhouettes for hidden sectors.
- Revealed cards with terrain, risk, resource hints, source receipt, and next safe action.
- Visual consistency between map tile, sector detail card, and receipt card.

### 3. Fog / Reveal States

Goal: make exploration feel playable without inventing hidden authority.

Deliverables:

- Soft hidden fog overlay for unrevealed sectors.
- Reveal state keyed only to server-owned sector status.
- Receipt-backed transition from hidden to scouted.
- No exact risk/resource facts in hidden sectors.
- Proof that reveal facts come from the read model or explicit mission route.

### 4. Expedition Mission Cards

Goal: make Expedition Board actions feel like bounded journeys.

Deliverables:

- Mission card variants for queued/running/completed/blocked states.
- Cost, duration, target direction/sector, and party display.
- Result receipt art that clearly reveals or updates one sector.
- No background expedition loop.

### 5. Named Operator Party Strips

Goal: attach character identity to missions while keeping authority bounded.

Deliverables:

- Small portrait/sprite strip for assigned operators.
- Name, role, and one-line flavor.
- Visual-only party facts stored on receipts/read models.
- Explicit no-leveling/no-equipment/no-autonomy boundary in report and UI copy.

### 6. Atlas / World Grid Polish

Goal: make Atlas and World Grid support the world fantasy without becoming executable.

Deliverables:

- Image-backed registry completion for Workshop, Market Stall, coin, XP, construct, produce, and collect.
- Larger visual anchors for civic/world-grid nodes.
- Mobile Atlas sections or tabs instead of one enormous scroll.
- A small read-only World Grid mini-map that points to the HQ12 frontier map, not a separate truth source.
- Copy pass to keep Strategy Editor and Atlas language clearly advisory/private.

## Ranked Gap List

### High

1. **No playable frontier map yet.** The target is a world-map feel, but the current outside-world layer is record/cards/read models.
2. **No fog/reveal visual system.** Exploration has receipts, not visible map discovery.
3. **No sector tile/card grammar.** Scout Report, Site Plan, claim, and outpost records need one shared spatial language.
4. **UI density still fights premium feel.** HQ11 and Atlas proofs are functional but long and dashboard-like.
5. **Full-game style cohesion is not locked.** New GPT Image 2 assets sit next to older/provenance-thin base assets.

### Medium

1. **Atlas still has symbol-only gaps.** Several core registry specs exist but lack image-backed asset paths.
2. **Mission presentation is underdeveloped.** Expedition Board needs mission cards and receipt result visuals.
3. **Operator identity is not yet a gameplay-facing strip.** Named sprites exist, but parties are not visible as a coherent mission unit.
4. **Older building art needs provenance recovery or regeneration.** Current runtime assets load, but they should not be described as GPT Image 2-derived until proven or replaced.
5. **Generated art hierarchy is uneven.** Some high-quality art appears only as small thumbnails or secondary dressing.
6. **Batch B and some civic roles remain asset-ready until anchors exist.** This is correct, but it leaves visual richness uneven across systems.

### Low

1. **Chroma/alpha cleanup artifacts need final art QA.** Most assets are usable, but some generated sheets came through opaque backgrounds and post-processing.
2. **Fallback labels can still sound machine-normalized.** Product copy should be tightened as icons are added.
3. **Some visual proofs use projection fixtures.** They are clearly labeled and useful, but final confidence should come from server-state proofs where possible.
4. **Contact/proof sprawl is growing.** Future reports should include a short evidence index so teammates can find the latest proof quickly.

## Guardrails

Keep these explicit for the next visual lanes:

- No public sharing.
- No real Generated Universe rendering.
- No Atlas execution.
- No autonomous operations.
- No scheduler/background expedition loops.
- No route/trade economy.
- No combat or random punitive travel simulation in the first map pass.
- No fabricated actors.
- No fake sector knowledge from art-only overlays.
- No Generated Universe overlay pack creating revealed sectors or world geometry.
- Scene actors and map markers must come from server/read-model anchors or be clearly labeled proof fixtures.

## Recommended Next Order

1. Land or verify HQ12A private frontier/fog read model if the backend lane completes.
2. Build HQ12B read-only frontier map UI from that model.
3. Add sector tile/card visual language and hidden/scouted/planned/outpost states.
4. Add `SCOUT_SECTOR` mission cards only after the read-only map proves readable.
5. Add operator party strips to expedition receipts/cards.
6. Run an Atlas/World Grid icon and mobile information architecture polish pass.
7. Regenerate or provenance-recover older base buildings once the map language is stable.

## Bottom Line

AgentTown now has enough high-quality art and character direction to justify the new playable-world push. It is not yet visually at the admired frontier/world-map level as a whole. The correct next move is not more isolated card art. It is a coherent HQ12 private frontier map with fog, sectors, mission cards, and named operator party presentation, all grounded in real server-owned state.
