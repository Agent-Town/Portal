# AgentTown GPT Image 2.0 UI Asset Quality Audit

Date: 2026-05-31
Agent: Dijkstra
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch/context: dirty shared branch

## Verdict

PASS_WITH_SAFE_UI_FIXES_AND_BLOCKED_GENERATION.

The HQ10 civic / World Grid asset pack is real, repo-owned, and provenance-rich: prompt files, native generated files, normalized sources, runtime PNG/WebP files, JSON metadata, 2048x2048 character sprite contracts, 1024x1024 prop contract, and transparent-corner alpha checks are present. The assets plausibly came from the requested GPT Image 2.0 path because each metadata file records the built-in `image_gen` mode, native generated path, prompt, source copy, and ImageMagick post-processing.

The UI was not fully carrying that asset quality forward. HQ10 World Grid / Civic Proposal / Generated Universe summary cards were still mostly CSS-only parchment cards, while the existing beacon appeared only in the local overlay preview. I made one safe frontend-only wiring fix: the existing `world-grid-civic-beacon.webp` now appears on the HQ10 World Grid, Civic Proposal, and Overlay Pack status cards. No gameplay authority changed.

No external image generation was called in this session. Missing media is marked `BLOCKED_ON_GENERATION` below with exact target filenames and prompts.

## Safe Repo-Local Fixes

Files touched:

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `reports/agent-town-gpt-image-2-ui-asset-quality-contact-sheet-2026-05-31.png`
- `reports/agent-town-gpt-image-2-ui-asset-quality-hq10-card-art-proof-2026-05-31.png`
- `reports/agent-town-gpt-image-2-ui-asset-quality-proof-2026-05-31.json`
- this report

Frontend-only presentation changes:

- Added `CARD_ART.worldGridBeacon` to the World Grid status card at `founders-plot.js:632`.
- Added `CARD_ART.worldGridBeacon` to the Civic Proposal status card at `founders-plot.js:778`.
- Added `CARD_ART.worldGridBeacon` to the Generated Universe Overlay Pack status card at `founders-plot.js:1101`.
- Extended the existing `.fp-card-art` grid layout to HQ10 card classes at `founders-plot.css:465` and responsive rules at `founders-plot.css:1002` / `founders-plot.css:1060`.

Boundary: the fix only inserts image elements and responsive layout rules. It does not touch server/store/routes/tools/tests, route/trade behavior, scheduler behavior, public sharing, Generated Universe rendering, Atlas execution, stable gameplay hashes, costs, resources, timers, or authority.

## Proofs

- Contact sheet: `reports/agent-town-gpt-image-2-ui-asset-quality-contact-sheet-2026-05-31.png`
- New HQ10 card-art UI proof: `reports/agent-town-gpt-image-2-ui-asset-quality-hq10-card-art-proof-2026-05-31.png`
- Proof JSON: `reports/agent-town-gpt-image-2-ui-asset-quality-proof-2026-05-31.json`

Playwright proof facts from the new screenshot run:

```json
[
  {
    "testId": "fp-world-grid-status-art",
    "src": "/experiences/founders-plot/assets/objects/world-grid-civic-beacon.webp",
    "naturalWidth": 1024,
    "naturalHeight": 1024
  },
  {
    "testId": "fp-civic-proposals-status-art",
    "src": "/experiences/founders-plot/assets/objects/world-grid-civic-beacon.webp",
    "naturalWidth": 1024,
    "naturalHeight": 1024
  },
  {
    "testId": "fp-overlay-packs-status-art",
    "src": "/experiences/founders-plot/assets/objects/world-grid-civic-beacon.webp",
    "naturalWidth": 1024,
    "naturalHeight": 1024
  }
]
```

## HQ10/HQ10D Asset Inventory

| Asset | Prompt | Native generated | Source | Runtime | Manifest/provenance | Dimensions/channels | Alpha | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| World Grid Civic Beacon | yes | `.generated.png` | `.source.png` | `.png`, `.webp` | `.json` records generated path and chroma cleanup | generated 1254x1254 srgb; runtime 1024x1024 srgba | transparent corners | PASS |
| Civic Routekeeper / Tally-Route 14 | yes | `.generated.png` | `.source.png` | `.png` | `.json` records generated path, role facts, row contract | generated 1254x1254 srgb; runtime 2048x2048 srgba | transparent corners | PASS |
| Oracle Adjunct / Pella-Node | yes | `.generated.png` | `.source.png` | `.png` | `.json` records generated path, role facts, row contract | generated 1254x1254 srgb; runtime 2048x2048 srgba | transparent corners | PASS |
| Outpost Keeper / Noma Hearthpin | yes | `.generated.png` | `.source.png` | `.png` | `.json` records generated path, role facts, row contract | generated 1254x1254 srgb; runtime 2048x2048 srgba | transparent corners | PASS |
| HQ10 World Grid UI proof | n/a | n/a | n/a | screenshot | report/proof path only | 465x898 srgb | none needed | PASS proof, pre-fix CSS-heavy |
| HQ10B Civic Proposal UI proof | n/a | n/a | n/a | screenshot | report/proof path only | 527x1206 srgb; mobile 366x1301 srgb | none needed | PASS proof, pre-fix CSS-heavy |
| HQ10C Overlay Pack UI proof | n/a | n/a | n/a | screenshot | report/proof path only | 1280x5892 srgb; mobile 390x3873 srgb | none needed | PASS proof, uses beacon in overlay preview |
| New HQ10 card-art proof | n/a | n/a | n/a | screenshot | proof JSON records loaded image facts | 1280x5965 srgb | none needed | PASS |

## Existing Building/Object Asset Audit

The newer HQ3-HQ10 integrated building/object/card assets are GPT Image 2.0-derived through the recovered sheet manifest:

- Manifest: `public/assets/icons/agent-town/agent-town-hq3-hq10-icon-sheet-v1-opaque.manifest.json`
- Source sheet: `public/assets/icons/agent-town/agent-town-hq3-hq10-icon-sheet-v1-opaque.source.png`
- Raw generator recorded as `gpt-image-2`
- Runtime scene/card exports are 512x512 srgba PNG/WebP pairs where sidecars exist.

Sampled runtime scene/card assets:

```text
expedition-board.source.png|PNG|512x512|srgba 4.0
expedition-board.webp|WEBP|512x512|srgba 4.0
outpost-core-lv1.source.png|PNG|512x512|srgba 4.0
outpost-core-lv1.webp|WEBP|512x512|srgba 4.0
research-lodge.source.png|PNG|512x512|srgba 4.0
research-lodge.webp|WEBP|512x512|srgba 4.0
settlement-charter-board.source.png|PNG|512x512|srgba 4.0
settlement-charter-board.webp|WEBP|512x512|srgba 4.0
scout-report-dossier.source.png|PNG|512x512|srgba 4.0
scout-report-dossier.webp|WEBP|512x512|srgba 4.0
site-plan-dossier.source.png|PNG|512x512|srgba 4.0
site-plan-dossier.webp|WEBP|512x512|srgba 4.0
cohort-work-order-dossier.source.png|PNG|512x512|srgba 4.0
cohort-work-order-dossier.webp|WEBP|512x512|srgba 4.0
```

Older base scene assets are still provenance-thin:

- `hq-lv1.webp` through `hq-lv5.webp`
- `lumber-camp.webp`
- `farm-plot.webp`
- `quarry.webp`
- `workshop.webp`
- `market-stall.webp`
- `empty-lot.webp`
- `locked-lot.webp`

They are 512x512 srgba runtime assets, but I found no adjacent `.prompt.md`, `.generated.png`, `.source.png`, or `.json` provenance files for them under `public/experiences/founders-plot/assets/buildings` or `objects`. Do not claim these are GPT Image 2.0-derived until provenance is recovered or they are regenerated.

## UI Surfaces Still Needing Real Assets

Current state after the safe fix:

- World Grid status card: now uses `world-grid-civic-beacon.webp`.
- Civic Proposal status card: now uses `world-grid-civic-beacon.webp` as a temporary civic visual.
- Overlay Pack status card: now uses `world-grid-civic-beacon.webp` as a temporary Generated Universe/civic visual.
- Overlay application preview: already uses `world-grid-civic-beacon.webp`.

Remaining gaps:

- Dedicated Civic Proposal card art is missing. The beacon is acceptable as a safe stopgap, but a proposal dossier image would be stronger.
- Dedicated Generated Universe Overlay Pack card art is missing. The beacon is acceptable for World Grid/civic preview, but not enough for a top-notch Generated Universe surface.
- Progression Atlas HQ10 World Grid and Generated Universe nodes can still fall back to symbol-style icons when no generated asset is registered for the exact node/category.
- Icon registries still have no asset files for `building.workshop`, `building.market_stall`, `resource.coin`, `resource.xp`, `action.construct`, `action.produce`, and `action.collect`.
- Resource strip still contains emoji text fallbacks in HTML/JS. Wood/stone/food are visually overridden by generated CSS background images, but coin and scout_report still need generated image equivalents.

## BLOCKED_ON_GENERATION Specs

No new media was generated here. These are exact target specs for the next GPT Image 2.0 production pass.

### 1. Civic Proposal Dossier Card Art

Target files:

- `public/experiences/founders-plot/assets/objects/civic-proposal-dossier.generated.png`
- `public/experiences/founders-plot/assets/objects/civic-proposal-dossier.source.png`
- `public/experiences/founders-plot/assets/objects/civic-proposal-dossier.webp`
- `public/experiences/founders-plot/assets/objects/civic-proposal-dossier.prompt.md`
- `public/experiences/founders-plot/assets/objects/civic-proposal-dossier.json`
- `public/assets/icons/agent-town/civic-proposal-record-gpt-image-2-v1.png`

Prompt:

```text
Create a single production 2D game object for AgentTown Founders Plot: a cozy civic proposal dossier for HQ10 civic proposal records. Three-quarter isometric object, warm brass clip, folded parchment, teal civic wax seal, blank abstract marks only, small receipt ribbon, no readable text, no logos, no UI frame, no weapon/security/surveillance/trade-route implication. Centered object with generous padding on a perfectly flat solid #00ff00 chroma-key background. Do not use #00ff00 in the object. Style must match the World Grid Civic Beacon and HQ3-HQ10 object pack: frontier-tech, handcrafted, warm brass/wood/teal enamel, game-ready silhouette.
```

### 2. Generated Universe Overlay Pack Card Art

Target files:

- `public/experiences/founders-plot/assets/objects/generated-universe-overlay-pack.generated.png`
- `public/experiences/founders-plot/assets/objects/generated-universe-overlay-pack.source.png`
- `public/experiences/founders-plot/assets/objects/generated-universe-overlay-pack.webp`
- `public/experiences/founders-plot/assets/objects/generated-universe-overlay-pack.prompt.md`
- `public/experiences/founders-plot/assets/objects/generated-universe-overlay-pack.json`
- `public/assets/icons/agent-town/generated-universe-overlay-pack-gpt-image-2-v1.png`

Prompt:

```text
Create a single production 2D game object for AgentTown Founders Plot: a presentation-only Generated Universe overlay pack artifact. It should look like a small stack of translucent civic map overlays, teal glass plates, warm brass corner clamps, amber lantern glow, and blank abstract node chips. It represents local visual skin/proposal memory only, not an executable render, public share, route, scheduler, trade, or world mutation. Three-quarter isometric readability, centered with generous padding, no readable text, no logos, no UI panels, no surveillance screens. Perfectly flat solid #00ff00 chroma-key background outside the object. Do not use #00ff00 in the object.
```

### 3. World Grid / Atlas Node Icon

Target files:

- `public/assets/icons/agent-town/world-grid-read-model-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/civic-readiness-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/generated-universe-node-gpt-image-2-v1.png`

Prompt:

```text
Create a 3-icon production sheet for AgentTown Progression Atlas HQ10 nodes. Icon 1: read-only World Grid status beacon, Icon 2: civic readiness seal, Icon 3: Generated Universe overlay node. Cozy frontier-tech, warm brass, teal enamel, parchment/wood details, no readable text, no logos, no UI frame, no weapons, no surveillance or public-sharing implication. Each icon must be centered in a square cell with clean game-icon silhouette, flat #00ff00 chroma-key background, and no #00ff00 inside the objects.
```

### 4. Registry Fallback Icons

Target files:

- `public/assets/icons/agent-town/workshop-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/market-stall-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/coin-resource-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/xp-resource-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/construct-action-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/produce-action-gpt-image-2-v1.png`
- `public/assets/icons/agent-town/collect-action-gpt-image-2-v1.png`

Prompt:

```text
Create a 7-icon production sheet for AgentTown Founders Plot UI registry fallbacks. Icons: Workshop building chain, Market Stall coin chain, coin resource, Town XP, construct action, produce action, collect output action. Cozy frontier-tech/wild-west town style, warm brass/wood/parchment/teal accents, clear simple silhouettes, no readable text, no logos, no UI frames, no weapons. Each icon centered in a square cell with flat #00ff00 chroma-key background and no #00ff00 inside the icon.
```

### 5. Base Building Provenance Recovery Or Regeneration

Target files:

- Add prompt/source/generated/json sidecars for `hq-lv1` through `hq-lv5`, `lumber-camp`, `farm-plot`, `quarry`, `workshop`, `market-stall`, `empty-lot`, and `locked-lot`; or regenerate a complete base-building sheet with those sidecars.

Prompt:

```text
Create a production 2D game building/object sheet for AgentTown Founders Plot base scene assets: HQ levels 1-5, Lumber Camp, Farm Plot, Quarry, Workshop, Market Stall, Empty Lot, Locked Lot. Cozy frontier-tech settlement, warm brass/wood/parchment/teal accents, consistent isometric angle, clear readable game silhouettes, no readable text, no logos, no weapons, no surveillance/security framing. Each asset centered in its own square cell with generous padding and a perfectly flat #00ff00 chroma-key background outside the silhouette. Do not use #00ff00 inside the assets.
```

## ImageMagick Checks

Ran:

```bash
magick identify -format '%f|%m|%wx%h|%[channels]\n' \
  public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.generated.png \
  public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.source.png \
  public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.png \
  public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.generated.png \
  public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.source.png \
  public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.png \
  public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.generated.png \
  public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.source.png \
  public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.png \
  public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.generated.png \
  public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.source.png \
  public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.png \
  public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.webp
```

Key output:

```text
civic-routekeeper-v1.generated.png|PNG|1254x1254|srgb  3.0
civic-routekeeper-v1.source.png|PNG|2048x2048|srgb  3.0
civic-routekeeper-v1.png|PNG|2048x2048|srgba 4.0
oracle-adjunct-v1.generated.png|PNG|1254x1254|srgb  3.0
oracle-adjunct-v1.source.png|PNG|2048x2048|srgb  3.0
oracle-adjunct-v1.png|PNG|2048x2048|srgba 4.0
outpost-keeper-v1.generated.png|PNG|1254x1254|srgb  3.0
outpost-keeper-v1.source.png|PNG|2048x2048|srgb  3.0
outpost-keeper-v1.png|PNG|2048x2048|srgba 4.0
world-grid-civic-beacon.generated.png|PNG|1254x1254|srgb  3.0
world-grid-civic-beacon.source.png|PNG|1024x1024|srgb  3.0
world-grid-civic-beacon.png|PNG|1024x1024|srgba 4.0
world-grid-civic-beacon.webp|WEBP|1024x1024|srgba 4.0
```

Transparent-corner check:

```text
civic-routekeeper-v1.png|tl=srgba(0,0,0,0),tr=srgba(0,0,0,0),bl=srgba(0,0,0,0),br=srgba(0,0,0,0)
oracle-adjunct-v1.png|tl=srgba(0,0,0,0),tr=srgba(0,0,0,0),bl=srgba(0,0,0,0),br=srgba(0,0,0,0)
outpost-keeper-v1.png|tl=srgba(0,0,0,0),tr=srgba(0,0,0,0),bl=srgba(0,0,0,0),br=srgba(0,0,0,0)
world-grid-civic-beacon.png|tl=srgba(0,0,0,0),tr=srgba(0,0,0,0),bl=srgba(0,0,0,0),br=srgba(0,0,0,0)
world-grid-civic-beacon.webp|tl=srgba(0,0,0,0),tr=srgba(0,0,0,0),bl=srgba(0,0,0,0),br=srgba(0,0,0,0)
```

Proof image checks:

```text
agent-town-gpt-image-2-ui-asset-quality-contact-sheet-2026-05-31.png|PNG|1128x894|srgb  3.0
agent-town-gpt-image-2-ui-asset-quality-hq10-card-art-proof-2026-05-31.png|PNG|1280x5965|srgb  3.0
```

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- Playwright one-off proof script against `PORT=4219 NODE_ENV=test node server/index.js`; new HQ10 status art loaded at natural size 1024x1024 for all three target cards.
- ImageMagick contact sheet generation and identify checks above.
- `jq empty reports/agent-town-gpt-image-2-ui-asset-quality-proof-2026-05-31.json`
- `git diff --check`

Not run:

- Full Founders Plot e2e suite. This was a narrow frontend image-placement audit on a dirty shared worktree.

## Final Notes

The current HQ10 civic assets are good enough to wire into real UI presentation surfaces, and the World Grid beacon is the right temporary visual anchor. The next quality jump should be a small dedicated HQ10 UI object pack: proposal dossier, overlay pack plate, World Grid/Atlas node icons, and registry fallback icons. Do not fake provenance for older scene assets; either recover their generation records or regenerate them through the same prompt/source/generated/json workflow.
