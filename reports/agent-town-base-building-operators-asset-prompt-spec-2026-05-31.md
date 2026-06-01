# AgentTown Base Building Operators Asset Prompt Spec

Date: 2026-05-31
Repo: `/Users/robin/Projects/Portal-atlas-editor`
Branch observed: `neo/progression-atlas-editor-next-2026-05-29`
Mode: report-only asset and wiring spec
Production code/assets edited: no

## Objective

Huygens' coverage audit found that `HQ`, `LUMBER_CAMP`, `FARM_PLOT`, and `QUARRY` still rely on generic builder/worker/hauler coverage. This spec defines the next operator batch so the earliest base buildings feel inhabited without adding hidden mechanics.

This is an implementation-ready prompt and wiring plan only. It does not create assets, alter scene state, change gameplay, call image generation, or wire new runtime roles.

## Authority Boundary

These operators are visual-only projections of existing server-owned state. They must make current building state legible and neighborly, not become gameplay authority.

Preserve these boundaries:

- No hidden resource math, buffs, production bonuses, scheduler behavior, route/trade behavior, Atlas execution, autonomous work, or public effects.
- No editor-authored Atlas node may invent one of these operators as mechanics.
- Server/read-model state remains authoritative; assets and actors only reflect state already emitted by `server/founders_plot/*` and projected by `scene_state.js`.
- Synthetic characters must read as bounded civic operators, not surveillance devices, drones, combat units, or faceless automation.

## Batch Roster

| Priority | Role id | Display name | Surface | Character type | Purpose |
| ---: | --- | --- | --- | --- | --- |
| 1 | `farmer` | Mira Seedhand | `FARM_PLOT` | human-coded | Gives the food loop a dedicated grower/tender. |
| 2 | `quarry_mason` | Bram Stonecalm | `QUARRY` | human-coded | Gives stone production a careful mason/marker. |
| 3 | `lumber_worker` | Jun Timberline | `LUMBER_CAMP` | human-coded | Gives wood production a dedicated camp hand. |
| 4 | `hq_civic_operator` | Vale-Desk 7 | `HQ` | visibly synthetic | Gives HQ a bounded civic desk operator and raises the human-plus-agent mix. |

Recommended first implementation target: the three production surfaces (`farmer`, `quarry_mason`, `lumber_worker`). Add `hq_civic_operator` in the same asset batch if production capacity allows; otherwise keep it as the immediate follow-up so the 3+ character batch still lands with at least one visibly agentic character.

## Roster Diversity Addendum

Robin clarified that future AgentTown characters should feel like a wild multicultural mix, varied across human races/ethnicities/cultures, genders, and humans versus AI/agents. Do not remove existing characters just to rebalance. Instead, use future prompts and metadata to broaden the cast.

For future asset prompts:

- Vary human skin tones, hair textures, facial features, body shapes, ages, names, clothing traditions, and cultural influences.
- Avoid making every human operator the same frontier-tech type.
- Avoid stereotypes, caricatures, national-costume shorthand, and tokenism.
- Preserve the human-plus-agent mix: for 3+ character batches include at least one warm bounded synthetic/agentic civic role.
- Add a brief roster-balance note to each generation/integration report.

For this base-operator batch, keep Mira Seedhand and Bram Stonecalm as already planned/generated. Treat Jun Timberline as an androgynous/nonbinary-coded human wood steward unless Robin changes the direction. Keep Vale-Desk 7 visibly synthetic, warm, and bounded rather than faceless automation.

## Shared Sprite Contract

All four character roles should follow the current inhabitant sheet contract:

```json
{
  "texture": {
    "format": "png",
    "colorSpace": "sRGB",
    "channels": "sRGBA",
    "width": 2048,
    "height": 2048,
    "alpha": true,
    "transparentCorners": true
  },
  "sheet": {
    "columns": 4,
    "rows": 4,
    "frameWidth": 512,
    "frameHeight": 512,
    "frameCount": 16
  },
  "actions": {
    "idle": { "row": 0, "frames": [0, 1, 2, 3], "fps": 3 },
    "walk": { "row": 1, "frames": [0, 1, 2, 3], "fps": 6 },
    "work": { "row": 2, "frames": [0, 1, 2, 3], "fps": 6 },
    "ready": { "row": 3, "frames": [0, 1, 2, 3], "fps": 4 }
  }
}
```

Generator output should preserve `.generated.png`, normalized `.source.png`, alpha-cleaned runtime `.png`, metadata `.json`, and `.prompt.md` provenance beside the runtime sheet.

## Role Specs

### `farmer` - Mira Seedhand

Building/surface: `FARM_PLOT`

Story function: Mira makes early food production feel tended, local, and recurring. She is not a yield buff; she is the neighbor who reads soil, checks seedlings, and shows when the existing farm loop is active or ready.

Visual direction: adult-coded frontier-tech grower with seed satchel, rolled sleeves, small watering can, crop marker sticks, linen apron, warm earth greens and straw yellows, tiny cyan soil-sensor bead. Cozy and practical, not pastoral fantasy.

4x4 rows/actions:

- Row 0 `idle`: kneels or stands by seed tray, checking soil.
- Row 1 `walk`: carries seed satchel or water can.
- Row 2 `tend`: waters/tends crop row with small soil sensor glow.
- Row 3 `ready`: presents a gathered food basket plus sealed receipt pouch.

Prompt text:

```text
4x4 transparent PNG sprite sheet, 2048x2048, each frame 512x512. Adult-coded AgentTown farm plot operator named Mira Seedhand, cozy frontier-tech grower, warm natural palette with tiny cyan soil-sensor bead. Seed satchel, small watering can, crop marker sticks, linen apron, practical boots, friendly focused posture. Rows: row 1 idle checking seed tray or soil, row 2 walking with seed satchel or water can, row 3 tending crop row with gentle sensor glow, row 4 food-ready pose with gathered basket and sealed receipt pouch. Same scale and storybook game style as existing AgentTown inhabitants. No readable text, no logos, no fantasy magic, no combat, no cyberpunk, no child mascot.
```

Suggested filenames:

- `public/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.prompt.md`

Metadata shape:

```json
{
  "id": "farmer-mira-seedhand-v1",
  "role": "farmer",
  "displayName": "Mira Seedhand",
  "buildingSurface": "FARM_PLOT",
  "characterKind": "human_civic_operator",
  "rowOrder": ["idle", "walk", "tend", "ready"],
  "actionMapping": {
    "PRODUCE": "tend",
    "FARM_TEND": "tend",
    "OUTPUT_READY": "ready",
    "COLLECT_READY": "ready"
  },
  "authorityBoundary": "visual_only_projection_of_existing_farm_plot_state"
}
```

Candidate future wiring trigger: when a `FARM_PLOT` building has an active `PRODUCE` job, scene projection can prefer `canonicalRoleId: "farmer"` and action `tend`; when that building has existing ready output, prefer `ready`. Keep `builder` for construction/upgrade and either keep `hauler` for collection handoff or let `farmer.ready` be the surface-specific ready pose.

### `quarry_mason` - Bram Stonecalm

Building/surface: `QUARRY`

Story function: Bram makes stone production feel deliberate and safe: measuring, marking, and sorting stone rather than smashing rocks. He communicates care, not extraction frenzy.

Visual direction: adult-coded quarry mason with dust apron, soft cap, measuring cord, sample chisel, stone marker tags with no readable text, small cyan fracture scanner. Safe hand tools only; no weapons, explosives, or heavy industrial danger.

4x4 rows/actions:

- Row 0 `idle`: inspects a small stone sample or measuring cord.
- Row 1 `walk`: carries sample crate or marker bundle.
- Row 2 `cut`: marks/splits stone with careful chisel and scanner cue.
- Row 3 `ready`: presents stacked stone sample and receipt pouch.

Prompt text:

```text
4x4 transparent PNG sprite sheet, 2048x2048, each frame 512x512. Adult-coded AgentTown quarry mason named Bram Stonecalm, cozy frontier-tech stone worker, warm slate and sandstone palette with tiny cyan fracture-scanner glow. Dust apron, soft cap, measuring cord, sample chisel, small stone crate, careful calm posture. Rows: row 1 idle inspecting a stone sample, row 2 walking with sample crate or marker bundle, row 3 carefully marking and cutting stone with safe hand tools and scanner cue, row 4 stone-ready pose with stacked sample and sealed receipt pouch. Same scale and storybook game style as existing AgentTown inhabitants. No readable text, no logos, no explosives, no weapons, no combat, no cyberpunk, no mining disaster mood.
```

Suggested filenames:

- `public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.prompt.md`

Metadata shape:

```json
{
  "id": "quarry-mason-bram-stonecalm-v1",
  "role": "quarry_mason",
  "displayName": "Bram Stonecalm",
  "buildingSurface": "QUARRY",
  "characterKind": "human_civic_operator",
  "rowOrder": ["idle", "walk", "cut", "ready"],
  "actionMapping": {
    "PRODUCE": "cut",
    "QUARRY_CUT": "cut",
    "OUTPUT_READY": "ready",
    "COLLECT_READY": "ready"
  },
  "authorityBoundary": "visual_only_projection_of_existing_quarry_state"
}
```

Candidate future wiring trigger: when a `QUARRY` building has an active `PRODUCE` job, scene projection can prefer `canonicalRoleId: "quarry_mason"` and action `cut`; when stone output is ready, prefer `ready`. Keep all actual stone production quantities in engine-owned job definitions.

### `lumber_worker` - Jun Timberline

Building/surface: `LUMBER_CAMP`

Story function: Jun makes the wood loop feel maintained: sorting boards, measuring planks, and tending a safe camp. The role should avoid "logger as destroyer" framing; it is stewardship and careful material prep.

Visual direction: adult-coded androgynous/nonbinary-coded lumber camp hand with work gloves, plank gauge, bundle straps, hand saw on belt, cedar/ochre palette, tiny cyan grain-reader charm. Make Jun visually distinct from Mira and Bram through a different face, hair, posture, and clothing language without using stereotype or costume shorthand. Safe tools, no axe-swing combat silhouette.

4x4 rows/actions:

- Row 0 `idle`: checks stacked planks or camp ledger tag.
- Row 1 `walk`: carries tied board bundle or strap.
- Row 2 `mill`: measures/sands/sorts planks with grain-reader cue.
- Row 3 `ready`: presents bundled wood and receipt pouch.

Prompt text:

```text
4x4 transparent PNG sprite sheet, 2048x2048, each frame 512x512. Adult-coded AgentTown lumber camp operator named Jun Timberline, androgynous/nonbinary-coded cozy frontier-tech wood steward, warm cedar and ochre palette with tiny cyan grain-reader charm. Distinct face, hair, posture, and practical camp clothing so Jun does not look like the same human operator type as Mira or Bram. Work gloves, plank gauge, bundle straps, hand saw stored safely on belt, friendly focused posture. Rows: row 1 idle checking stacked planks, row 2 walking with tied board bundle or straps, row 3 measuring and sorting planks with small grain-reader glow, row 4 wood-ready pose with bundled lumber and sealed receipt pouch. Same scale and storybook game style as existing AgentTown inhabitants. No readable text, no logos, no violent axe swing, no deforestation mood, no combat, no cyberpunk, no industrial factory, no stereotype or costume shorthand.
```

Suggested filenames:

- `public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.prompt.md`

Metadata shape:

```json
{
  "id": "lumber-worker-jun-timberline-v1",
  "role": "lumber_worker",
  "displayName": "Jun Timberline",
  "buildingSurface": "LUMBER_CAMP",
  "characterKind": "human_civic_operator",
  "rowOrder": ["idle", "walk", "mill", "ready"],
  "actionMapping": {
    "PRODUCE": "mill",
    "LUMBER_MILL": "mill",
    "OUTPUT_READY": "ready",
    "COLLECT_READY": "ready"
  },
  "authorityBoundary": "visual_only_projection_of_existing_lumber_camp_state"
}
```

Candidate future wiring trigger: when a `LUMBER_CAMP` building has an active `PRODUCE` job, scene projection can prefer `canonicalRoleId: "lumber_worker"` and action `mill`; when wood output is ready, prefer `ready`. Keep generic `builder` for construction/upgrade until a separate construction crew pass replaces it.

### `hq_civic_operator` - Vale-Desk 7

Building/surface: `HQ`

Story function: Vale-Desk 7 makes HQ feel staffed and civic without pretending the HQ automates the town. It is a bounded synthetic receptionist/operator that organizes receipts, upgrade readiness, notices, and civic memory around existing HQ state.

Visual direction: clearly synthetic machine-person with warm wood/brass desk elements, expressive visor, small ledger tray, notice ribbons, hand-crank receipt slot, cyan status bead. Friendly public-service clerk, not a command AI, surveillance camera, or military robot.

4x4 rows/actions:

- Row 0 `idle`: seated/standing at small civic desk with ledger tray.
- Row 1 `walk`: carries receipt tray or notice ribbon bundle.
- Row 2 `coordinate`: sorts receipts, stamps queue token, points to HQ board.
- Row 3 `ready`: presents upgrade/readiness receipt or civic notice packet.

Prompt text:

```text
4x4 transparent PNG sprite sheet, 2048x2048, each frame 512x512. AgentTown HQ civic operator named Vale-Desk 7, visibly synthetic friendly machine-person, cozy frontier-tech public-service clerk. Warm wood and brass desk accents, expressive soft visor, small ledger tray, notice ribbons, hand-crank receipt slot, tiny cyan status bead. Rows: row 1 idle at compact civic desk with receipt tray, row 2 walking with notice ribbon bundle, row 3 coordinating receipts and pointing to an abstract HQ board with no readable text, row 4 ready pose presenting sealed upgrade or civic notice packet. Neighborly bounded agent, helpful but not in charge. Same scale and storybook game style as existing AgentTown inhabitants. No readable text, no logos, no surveillance camera, no drone, no command center, no weapons, no combat, no chrome cyberpunk.
```

Suggested filenames:

- `public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.prompt.md`

Metadata shape:

```json
{
  "id": "hq-civic-operator-vale-desk-7-v1",
  "role": "hq_civic_operator",
  "displayName": "Vale-Desk 7",
  "buildingSurface": "HQ",
  "characterKind": "synthetic_civic_operator",
  "rowOrder": ["idle", "walk", "coordinate", "ready"],
  "actionMapping": {
    "HQ_UPGRADE": "coordinate",
    "HQ_READY": "ready",
    "RECEIPT_READY": "ready",
    "CIVIC_NOTICE": "coordinate"
  },
  "authorityBoundary": "visual_only_projection_of_existing_hq_and_receipt_state"
}
```

Candidate future wiring trigger: add only when the scene/read model already has HQ presence or upgrade/readiness state to project. Use `hq_civic_operator` for HQ level/readiness/civic receipt visuals, not for starting upgrades, creating resources, approving Atlas actions, or scheduling work.

## Future Wiring Plan

The future implementation lane should be split into asset generation/normalization and code wiring. This report only defines the contract.

Recommended code touch points for a later implementation:

- `public/experiences/founders-plot/scene_state.js`: add `ACTOR_SPRITE_SHEETS` entries for the new role ids, default actions, offsets, and role normalization.
- `server/founders_plot/engine.js` or current visual actor projection source: when emitting visual actors for active building jobs, choose role by `buildingType` for existing `PRODUCE` and ready-output states.
- `tests-founders-plot/fp-scene-state.test.js`: assert each building type resolves to the intended `canonicalRoleId`, sprite sheet URL, and row action.

Candidate mapping:

```js
const BASE_BUILDING_OPERATOR_ROLES = {
  FARM_PLOT: {
    activeRole: 'farmer',
    activeAction: 'tend',
    readyRole: 'farmer',
    readyAction: 'ready'
  },
  QUARRY: {
    activeRole: 'quarry_mason',
    activeAction: 'cut',
    readyRole: 'quarry_mason',
    readyAction: 'ready'
  },
  LUMBER_CAMP: {
    activeRole: 'lumber_worker',
    activeAction: 'mill',
    readyRole: 'lumber_worker',
    readyAction: 'ready'
  },
  HQ: {
    surfaceRole: 'hq_civic_operator',
    idleAction: 'idle',
    readyAction: 'ready'
  }
};
```

This mapping belongs near scene projection or a visual-role resolver, not in resource math. If the current engine emits generic `worker`/`hauler` actors only, the later lane can either:

1. Map generic actors to role-specific visual sheets in `scene_state.js` based on `buildingType`, or
2. Have server visual actor projection emit `canonicalRoleId` directly from building type.

Prefer option 2 if visual actor records already carry building context cleanly; prefer option 1 if it avoids touching server authority during asset integration.

## Prioritized Implementation Order

1. Generate and normalize `farmer`, `quarry_mason`, and `lumber_worker` sheets in one batch, with checker previews and row strips under `reports/`.
2. Generate `hq_civic_operator` in the same visual style to preserve the human-plus-agent mix and make HQ inhabited.
3. Add metadata JSON and prompt provenance beside each runtime sheet.
4. Wire role sheet constants and action rows in `scene_state.js`.
5. Add server/scene projection mapping for existing `PRODUCE` and `OUTPUT_READY` states only.
6. Add focused `fp-scene-state` tests for `FARM_PLOT`, `QUARRY`, `LUMBER_CAMP`, and optionally `HQ`.
7. Capture browser proof screenshots or contact sheets showing all four operators without claiming new gameplay.

## Verification Checklist

Asset checks:

- Each runtime PNG is `2048x2048`, sRGBA, 4x4, 512px cells.
- All four corners are transparent after alpha cleanup.
- Each role has `.generated.png`, `.source.png`, `.png`, `.json`, and `.prompt.md`.
- Checker previews and row strips show clear silhouettes and no cutout border artifacts.
- No baked readable text, logos, weapons, combat framing, surveillance framing, or faceless drone imagery.

Metadata checks:

- `jq empty` passes for each role metadata file.
- `role`, `displayName`, `buildingSurface`, `rowOrder`, `actions`, `actionMapping`, and `authorityBoundary` are present.
- The synthetic HQ role has `characterKind: "synthetic_civic_operator"`.

Wiring checks for a later implementation:

- `node --check public/experiences/founders-plot/scene_state.js`.
- Focused `NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js`.
- Scene proof confirms active `FARM_PLOT`, `QUARRY`, and `LUMBER_CAMP` actors resolve to their dedicated role sheets.
- HQ proof, if included, shows `hq_civic_operator` only as a visual HQ/readiness/civic receipt presence.
- `git diff --check` over every touched production and report file.

Boundary checks:

- No new tools, routes, scheduler behavior, Atlas executable action refs, resource costs, yields, buffs, route/trade logic, public effects, or autonomous work-order behavior.
- No changes imply operators perform Atlas execution or make approvals.
- Existing generic builder/worker/hauler roles remain available as fallback while dedicated operators are visual upgrades.

## Current Report Validation

Required validation command for this report-only lane:

```sh
git diff --check -- reports/agent-town-base-building-operators-asset-prompt-spec-2026-05-31.md
```
