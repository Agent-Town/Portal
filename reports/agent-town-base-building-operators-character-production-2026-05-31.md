# AgentTown Base Building Operators Character Production Packet

Date: 2026-05-31
Repo: `/Users/robin/Projects/Portal-atlas-editor`
Mode: bounded heartbeat lane / report-only completion packet, later updated with asset completion status
Production code/assets edited by original packet: no

## Verdict

The missing base-building operator lane should proceed as a named-character asset batch before any scene wiring.

`HQ`, `LUMBER_CAMP`, `FARM_PLOT`, and `QUARRY` already have truthful server and Three.js building anchors. The dedicated operator sprite sheets and role descriptors are now asset-ready through later bounded integrations. The next safe step is a separate readiness/wiring decision: wire only real server/read-model anchors in a later slice after proof review.

This packet preserves Robin's requested direction: inhabitants should be distinct named characters with backstory, not anonymous role sprites.

## Source Reports

- `reports/agent-town-base-building-operators-asset-prompt-spec-2026-05-31.md`
- `reports/agent-town-base-building-operators-scene-wiring-feasibility-2026-05-31.md`
- `reports/agent-town-inhabitant-character-bible-completeness-audit-2026-05-31.md`

## Character Roster

| Role id | Display name | Surface | Kind | Production status |
| --- | --- | --- | --- | --- |
| `farmer` | Mira Seedhand | `FARM_PLOT` | human civic operator | Asset-ready; see `reports/agent-town-base-operator-farmer-sprite-integration-2026-05-31.md` |
| `quarry_mason` | Bram Stonecalm | `QUARRY` | human civic operator | Asset-ready; see `reports/agent-town-base-operator-quarry-mason-sprite-integration-2026-05-31.md` |
| `lumber_worker` | Jun Timberline | `LUMBER_CAMP` | human civic operator | Asset-ready; see `reports/agent-town-base-operator-lumber-worker-sprite-integration-2026-05-31.md` |
| `hq_civic_operator` | Vale-Desk 7 | `HQ` | synthetic civic operator | Asset-ready; see `reports/agent-town-base-operator-hq-civic-operator-sprite-integration-2026-05-31.md` |

The four-role batch includes one visibly synthetic operator, satisfying the standing human-plus-agent roster rule for a 3+ character batch.

## Roster Diversity Addendum

Robin clarified after this packet that future AgentTown inhabitants should feel like a wild multicultural mix, with a stronger mix across human races/ethnicities/cultures, genders, and humans versus AI/agents.

Do not kick out or rewrite existing characters just to rebalance. Mira Seedhand, Bram Stonecalm, Jun Timberline, and Vale-Desk 7 can stay as the current base-operator packet. The correction is forward-looking: future prompts, metadata, and image lanes should deliberately vary skin tones, hair textures, facial features, body shapes, ages, gender presentation, names, clothing traditions, and cultural design references so the roster does not keep producing the same type of frontier-tech human.

During generation, Jun Timberline should avoid defaulting to another rugged male-coded worker; treat Jun as an androgynous/nonbinary-coded wood steward unless Robin chooses otherwise. Vale-Desk 7 should remain a warm bounded synthetic civic operator, preserving the human-plus-agent mix without becoming faceless automation.

Each future character-production report should include a short roster-balance note covering:

- human vs synthetic / agentic role mix
- gender presentation mix
- multicultural/racial/ethnic visual variety
- silhouette and clothing differentiation
- confirmation that existing characters were not removed solely to rebalance

## Mira Seedhand / `farmer`

Surface: `FARM_PLOT`

Backstory: Mira Seedhand grew up keeping tiny seed libraries in wagon drawers, labeling each packet by season, soil, and who first shared it. She came to Founders Plot because the early town was building faster than its food rhythms could keep up. Mira does not command the farm or improve yields by magic; she makes the existing food loop visible by tending rows, reading soil markers, and preparing receipt-bound baskets when server-owned production is ready.

Personality: practical, patient, dryly funny, protective of small things. She talks about crops like neighbors with schedules.

Visual silhouette: adult frontier grower with linen apron, seed satchel, rolled sleeves, small watering can, crop marker sticks, practical boots, straw/earth palette, and one tiny cyan soil-sensor bead. Cozy frontier-tech, not fantasy druid and not mascot.

Sprite rows:

- `idle`: checks seed tray or soil marker.
- `walk`: carries seed satchel or watering can.
- `tend`: waters/tends crop row with small sensor glow.
- `ready`: presents gathered food basket and sealed receipt pouch.

Suggested files:

- `public/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/farmer/farmer-mira-seedhand-v1.prompt.md`

Future trigger: active `PRODUCE` job on `FARM_PLOT` may project `farmer` / `tend`; ready farm output may project `farmer` / `ready` or keep `hauler` as final collection handoff.

## Bram Stonecalm / `quarry_mason`

Surface: `QUARRY`

Backstory: Bram Stonecalm was a marker before he was a mason: the person trusted to decide which stone was safe to cut and which should stay holding the hill together. In AgentTown, he gives the quarry a culture of measurement rather than extraction. He is a visual receipt of existing stone production, not a production bonus.

Personality: calm, exact, steady under noise. He speaks softly because rock already does enough shouting.

Visual silhouette: adult quarry mason with dust apron, soft cap, measuring cord, stone sample crate, safe hand chisel, marker tags with no readable text, slate/sandstone palette, and a small cyan fracture-scanner glow. No explosives, weapons, or grim mine mood.

Sprite rows:

- `idle`: inspects sample stone or measuring cord.
- `walk`: carries sample crate or marker bundle.
- `cut`: carefully marks/splits stone with scanner cue.
- `ready`: presents stacked stone sample and sealed receipt pouch.

Suggested files:

- `public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/quarry_mason/quarry-mason-bram-stonecalm-v1.prompt.md`

Future trigger: active `PRODUCE` job on `QUARRY` may project `quarry_mason` / `cut`; ready quarry output may project `quarry_mason` / `ready` or keep `hauler` as final collection handoff.

## Jun Timberline / `lumber_worker`

Surface: `LUMBER_CAMP`

Backstory: Jun Timberline learned woodwork from repair crews who could make one good plank serve three emergencies. Jun joined Founders Plot to keep the lumber camp from feeling like a faceless resource tap. The character reads as stewardship: sorting, measuring, bundling, and preparing wood that the server has already produced.

Personality: upbeat, methodical, quietly proud of clean stacks and straight cuts. Jun judges a town by how it treats spare boards.

Gender / presentation note: Jun should read as androgynous or nonbinary-coded rather than another default rugged male worker. Keep the portrayal grounded, warm, and practical.

Visual silhouette: adult lumber camp hand with work gloves, plank gauge, bundle straps, safe hand saw stored on belt, cedar/ochre palette, and a cyan grain-reader charm. Vary Jun's human design language from Mira and Bram through distinct hair, face, posture, and clothing details; avoid caricature or costume shorthand. No violent axe swing or deforestation framing.

Sprite rows:

- `idle`: checks stacked planks or camp marker.
- `walk`: carries tied board bundle or straps.
- `mill`: measures/sands/sorts planks with grain-reader cue.
- `ready`: presents bundled wood and sealed receipt pouch.

Suggested files:

- `public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/lumber_worker/lumber-worker-jun-timberline-v1.prompt.md`

Future trigger: active `PRODUCE` job on `LUMBER_CAMP` may project `lumber_worker` / `mill`; ready lumber output may project `lumber_worker` / `ready` or keep `hauler` as final collection handoff.

## Vale-Desk 7 / `hq_civic_operator`

Surface: `HQ`

Backstory: Vale-Desk 7 began as a receipt desk in a rescued plan wagon: a little brass-and-wood synthetic clerk that learned names by watching which notices people kept. Vale-Desk 7 belongs at HQ because it makes civic memory visible without becoming the town's authority. It sorts receipts, readiness notices, and upgrade paperwork that already exists in server-owned state.

Personality: warm, precise, gently bureaucratic in a useful way. It is proud when a queue gets shorter and embarrassed when a ribbon tangles.

Visual silhouette: visibly synthetic machine-person with warm wood/brass desk accents, expressive soft visor, ledger tray, notice ribbons, hand-crank receipt slot, and a cyan status bead. Friendly public-service clerk, not command AI, drone, combat robot, or surveillance device.

Sprite rows:

- `idle`: at compact civic desk with receipt tray.
- `walk`: carries notice ribbons or receipt bundle.
- `coordinate`: sorts receipts, stamps queue token, points to abstract HQ board with no readable text.
- `ready`: presents sealed upgrade/readiness notice packet.

Suggested files:

- `public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/hq_civic_operator/hq-civic-operator-vale-desk-7-v1.prompt.md`

Future trigger: HQ presence, HQ readiness, receipt readiness, or civic notice state may project `hq_civic_operator`, but only as visual context. It must not start upgrades, approve actions, schedule work, create resources, or execute Atlas proposals.

## Shared Metadata Contract

Each role should include JSON fields equivalent to:

```json
{
  "id": "role-character-v1",
  "role": "farmer",
  "displayName": "Mira Seedhand",
  "buildingSurface": "FARM_PLOT",
  "characterKind": "human_civic_operator",
  "backstory": "Short canonical character-bible paragraph.",
  "personality": "Short behavior/tone note.",
  "rowOrder": ["idle", "walk", "work", "ready"],
  "actionMapping": {
    "PRODUCE": "work",
    "OUTPUT_READY": "ready"
  },
  "authorityBoundary": "visual_only_projection_of_existing_server_state"
}
```

Use role-specific row names where useful:

- `farmer`: `idle`, `walk`, `tend`, `ready`
- `quarry_mason`: `idle`, `walk`, `cut`, `ready`
- `lumber_worker`: `idle`, `walk`, `mill`, `ready`
- `hq_civic_operator`: `idle`, `walk`, `coordinate`, `ready`

## Future Implementation Sequence

1. Generate or integrate the four 4x4 sprite sheets with `.generated.png`, `.source.png`, runtime `.png`, `.json`, and `.prompt.md`.
2. Produce checker previews, row strips, and a contact sheet under `reports/`.
3. Verify each runtime PNG is `2048x2048`, sRGBA, transparent-corner, 4 columns by 4 rows.
4. Run `jq empty` on each metadata file.
5. Only after parent visual acceptance, add `ACTOR_SPRITE_SHEETS` entries and action mappings in `scene_state.js`.
6. Add server or scene visual-role mapping only where current server state already proves the building:
   - active `FARM_PLOT` production -> `farmer`
   - active `QUARRY` production -> `quarry_mason`
   - active `LUMBER_CAMP` production -> `lumber_worker`
   - HQ readiness/receipt/civic notice -> `hq_civic_operator`
7. Add focused `fp-scene-state` tests and proof JSON.

## Non-Changes

No images were generated in this report-only completion packet.

No production assets, source files, generated bundles, server routes, tools, gameplay rules, resource math, scheduler behavior, Atlas execution behavior, public sharing, external effects, branch operations, or cleanup were changed.

## Verification

Report-only verification:

```sh
git diff --check -- reports/agent-town-base-building-operators-character-production-2026-05-31.md
```
