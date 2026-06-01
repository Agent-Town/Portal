# AgentTown Progression Atlas GPT Image 2 Top-Notch UI Audit

Date: 2026-05-31
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch/context: dirty shared AgentTown worktree

## Verdict

Progression Atlas is materially polished and now carries the recent GPT Image 2 work into the HQ10/HQ11 civic path, but I would not call the whole surface "top notch" yet.

It is strong as an internal strategy/control surface: authority boundaries, resource gates, canonical graph coverage, HQ9 work-order framing, HQ10 World Grid framing, and HQ11 civic operations copy are clear and server-safe. It still feels utilitarian in several places because generated art is mostly used as small icons, some canonical nodes still fall back to symbol chips, and mobile produces a very long dense scroll.

## Tiny Safe Polish Made

I made a small frontend/icon hookup because the mismatch was obvious and low risk:

- `public/agent-town-icons.js`
  - Added exact registry entries for `world_grid.read_model`, `world_grid.civic_readiness`, `civic.proposal_records`, `civic.proposal`, `generated_universe.overlay_pack_records`, `generated_universe.overlay_pack`, `civic.project_activation`, and `civic.project`.
  - These now point at the existing repo-owned GPT Image 2 object art.
- `server/agent_town_icons.js`
  - Mirrored the same icon IDs so server-emitted canonical Atlas nodes carry real asset paths.
- `public/progression-atlas.js`
  - Narrowly expanded Atlas image-path sanitation to also allow `/experiences/founders-plot/assets/objects/`, not only `/assets/icons/agent-town/`.
- `e2e/114_progression_atlas_openclaw_lite.spec.js`
  - Added focused assertions that the embedded Atlas renders the World Grid beacon, Civic Proposal dossier, and Generated Universe overlay pack art paths.

No gameplay, routes, Founders Plot mutations, Atlas execution, Generated Universe rendering, scheduler behavior, public sharing, resources, or server authority changed.

## GPT Image 2 Art Now Integrated In Atlas

The embedded Progression Atlas now resolves and renders these GPT Image 2 assets:

- `world_grid.read_model` and `world_grid.civic_readiness`
  - `/experiences/founders-plot/assets/objects/world-grid-civic-beacon.webp`
  - `1024x1024`
- `civic.proposal_records` and `civic.proposal`
  - `/experiences/founders-plot/assets/objects/civic-proposal-dossier-card-art.webp`
  - `1536x1024`
- `generated_universe.overlay_pack_records` and `generated_universe.overlay_pack`
  - `/experiences/founders-plot/assets/objects/generated-universe-overlay-pack-card-art.webp`
  - `1536x1024`
- `civic.project_activation` and `civic.project`
  - `/experiences/founders-plot/assets/objects/world-grid-civic-beacon.webp`
  - `1024x1024`

The broader HQ3-HQ10 icon sheet is already connected for major game-facing nodes such as Expedition Board, scout action/report, Site Plan, Claim-ready Plan, Settler Convoy, Outpost Plot, Research Lodge, Survey Discipline, and Collect Ready Outputs Once.

## Already Polished

- Atlas opens through the Founders Plot embedded modal flow, preserving the current product framing.
- Authority boundaries are visible and repeated in the right places: Atlas action refs remain metadata-only and executable actions stay at zero.
- Resource gates and canonical graph nodes are much clearer than the older strategy-only Atlas.
- HQ9/HQ10/HQ11 panels explain current systems without claiming nonexistent execution authority.
- The new GPT Image 2 civic/object art now appears in the canonical map/engine graph path instead of being stranded in Founders Plot cards only.
- Desktop and mobile screenshots confirm the generated civic assets load in the embedded Atlas frame.

## Still Fallback Or Utilitarian

The global registry still has no asset for these exact IDs:

- `action.collect`
- `action.construct`
- `action.produce`
- `building.market_stall`
- `building.workshop`
- `resource.coin`
- `resource.xp`

The live canonical graph currently has 28 canonical nodes without image-backed icons. The most visible groups are:

- Workshop nodes: unlock, build, upgrade, run, next-build buff.
- Market Stall and coin nodes: unlock, build, upgrade, sell, collect, reward coin rows.
- Permission/policy nodes: observe/suggest, collect outputs, set priority, sell surplus food, emergency pause, hourly cap, construction slots.
- XP/reward nodes: founder stipend and similar reward rows.

Several fallback labels are also machine-like when no registry spec exists, for example `Observeandsuggest`, `Setpriority`, and `Sellsurplusfood`.

The Strategy Editor's "Generate Icon Draft" path still produces a metadata icon draft, not a real image asset thumbnail. That is appropriate for the current no-gameplay-mutation boundary, but it is not visually top-notch.

The layout is comprehensive but dense. It reads like an operations dashboard, not yet like a premium product surface. Mobile proof is especially long: the Atlas body measured `19748px` tall in the embedded mobile frame.

## Proofs

- Full desktop embedded Atlas proof: `reports/agent-town-progression-atlas-gpt-image-2-top-notch-ui-audit-desktop-2026-05-31.png`
  - `1276x8022`
- Full mobile embedded Atlas proof: `reports/agent-town-progression-atlas-gpt-image-2-top-notch-ui-audit-mobile-2026-05-31.png`
  - `370x19748`
- Supplemental desktop civic-ops crop: `reports/agent-town-progression-atlas-gpt-image-2-top-notch-ui-audit-desktop-civic-ops-2026-05-31.png`
  - `1214x520`
- Supplemental mobile civic-ops crop: `reports/agent-town-progression-atlas-gpt-image-2-top-notch-ui-audit-mobile-civic-ops-2026-05-31.png`
  - `324x1347`

Proof script facts after forcing lazy-loaded assets into view:

```json
{
  "requiredAssetsLoaded": [
    {
      "src": "/experiences/founders-plot/assets/objects/world-grid-civic-beacon.webp",
      "naturalWidth": 1024,
      "naturalHeight": 1024
    },
    {
      "src": "/experiences/founders-plot/assets/objects/civic-proposal-dossier-card-art.webp",
      "naturalWidth": 1536,
      "naturalHeight": 1024
    },
    {
      "src": "/experiences/founders-plot/assets/objects/generated-universe-overlay-pack-card-art.webp",
      "naturalWidth": 1536,
      "naturalHeight": 1024
    }
  ],
  "atlasImageIconCount": 104,
  "atlasLoadedImageIconCount": 104,
  "atlasFallbackIconCount": 42
}
```

## Next Polish Lanes

1. Complete the missing icon registry pack.
   - Generate or crop image-backed icons for Workshop, Market Stall, coin, XP, construct, produce, collect, and the main policy/permission states.
   - Wire both browser and server registries at the same time.

2. Turn HQ10/HQ11 art from small icon dressing into larger visual hierarchy.
   - Use the civic proposal dossier and overlay pack art as larger card/section anchors in Atlas, not only 34-52px icons.
   - Keep Atlas non-executable, but make the civic lane feel like a real product surface.

3. Give mobile a dedicated information architecture pass.
   - Break the long one-column scroll into tabs/segments or collapsible lanes.
   - Prioritize Plot Snapshot, Resource Gates, Authority, Canonical Map, and Civic Ops as separate mobile sections.

4. Improve fallback label quality.
   - Add registry specs for missing permission/policy IDs so labels read like product copy instead of normalized identifiers.

5. Decide whether Strategy Editor image drafts should become real image previews.
   - If yes, keep them advisory and private, but render actual thumbnails once generated.
   - If no, rename the affordance so it is clear it attaches a prompt/metadata draft, not production art.

6. Recover or regenerate provenance for older base building scene assets.
   - `hq-lv1` through `hq-lv5`, `workshop`, `market-stall`, `empty-lot`, and `locked-lot` still lack adjacent prompt/source/generated/json sidecars in the same way the newer GPT Image 2 assets have them.

## Checks

Passed:

```text
node --check public/progression-atlas.js
node --check public/agent-town-icons.js
node --check server/agent_town_icons.js
node --check e2e/114_progression_atlas_openclaw_lite.spec.js
npx playwright test e2e/114_progression_atlas_openclaw_lite.spec.js --project=chromium
identify reports/agent-town-progression-atlas-gpt-image-2-top-notch-ui-audit-desktop-2026-05-31.png reports/agent-town-progression-atlas-gpt-image-2-top-notch-ui-audit-mobile-2026-05-31.png
identify reports/agent-town-progression-atlas-gpt-image-2-top-notch-ui-audit-desktop-civic-ops-2026-05-31.png reports/agent-town-progression-atlas-gpt-image-2-top-notch-ui-audit-mobile-civic-ops-2026-05-31.png
```

`git diff --check` should be run after this report is written as the final whitespace check.
