# AgentTown Inhabitant Character Bible Completeness Audit

Date: 2026-05-31
Workspace: `/Users/robin/Projects/Portal-atlas-editor`
Mode: report-first audit only
Source edits: none

## Product Requirement

Robin prefers Founders Plot inhabitants/operators to be their own named characters with backstory, not just generic role sprites. Treat that as a product requirement for this lane.

Audit target: `public/experiences/founders-plot/assets/characters/inhabitants/**` JSON metadata, prompt sidecars, and relevant wiring reports. Runtime status is based on the currently dirty shared branch; no unrelated changes were reverted or cleaned.

## Verdict

The newer HQ3-HQ11 inhabitant lane mostly satisfies the named-character/backstory requirement, but the older base-building actor sheets still do not.

The strongest character-ready set is:

- `settler`: Luma Reedbarrel metadata, Tava Ridgekit prompt sidecar, sprite sheet, runtime scene wiring.
- `trader`: Maro Tallyseed metadata and prompt sidecar, sprite sheet, runtime scene wiring.
- `workshop_specialist`: Bria Coppernotch metadata and prompt sidecar, sprite sheet, runtime scene wiring.
- `civic_routekeeper`: Tally-Route 14 metadata and prompt sidecar, sprite sheet, runtime scene wiring.
- `oracle_adjunct`: Pella-Node metadata and prompt sidecar, sprite sheet, runtime scene wiring.
- `outpost_keeper`: Noma Hearthpin metadata and prompt sidecar, sprite sheet, runtime scene wiring.
- `research_doctrine_keeper`, `charter_clerk`, `cohort_hall_coordinator`: named and asset-ready, but not runtime scene-wired because their surfaces lack a physical scene anchor.

The main gaps are:

- Base building production still leans on generic roles for `LUMBER_CAMP`, `FARM_PLOT`, and `QUARRY`.
- Older generic actor sheets remain in the tree: `builder-agentfolk-v2`, `builder-sprite-sheet-gpt2-v1`, `worker-agentfolk-v1`, `hauler-agentfolk-v1`, and `messenger-agentfolk-v1`.
- Several runtime-wired older replacements have strong prompt backstory but sparse JSON metadata: Rigger Slate, Kettle-37, Oona Tallpack, Rook Signalpost, and Pathfinder Scout. They are character-ready by prompt/spec, but the canonical metadata sidecar does not yet carry their full character bible.

## Character Readiness Matrix

| Role / asset | Named character treatment | Backstory source | Asset status | Runtime status | Classification | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `builder` / `rigger-slate-builder-v2` | Named: Rigger Slate | Prompt has character identity; JSON has display name and description only | Sprite + JSON + prompt | Runtime scene-wired through `ACTOR_SPRITE_SHEETS.builder` | Prompt/spec ready, runtime-wired | JSON lacks a fuller backstory field. Good robot/agentfolk fit, but metadata should absorb the prompt bible. |
| `builder` / `rigger-slate-builder-v1` | Named: Rigger Slate | Prompt has role concept; JSON has display name and description only | Asset-ready older candidate | Not current runtime mapping | Prompt/spec ready, asset-ready only | Superseded by v2. Keep only as archive/reference unless explicitly needed. |
| `builder` / `builder-agentfolk-v2` | Anonymous/generic | None found | Sprite + JSON | Not current runtime mapping | Anonymous/generic, asset-ready only | Older generic actor sheet; should not be considered character-bible complete. |
| `builder` / `builder-sprite-sheet-gpt2-v1` | Anonymous/generic | None found | Sprite + JSON | Not current runtime mapping | Anonymous/generic, asset-ready only | Older generic actor sheet. |
| `worker` / `kettle-37-worker-v1` | Named: Kettle-37 | Prompt contains full origin story; JSON has no display/backstory | Sprite + JSON + prompt | Runtime scene-wired through `ACTOR_SPRITE_SHEETS.worker` | Prompt/spec ready, runtime-wired | Needs JSON-sidecar character bible promotion. Covers production generically for base buildings, not a farm/quarry-specific character. |
| `worker` / `worker-agentfolk-v1` | Anonymous/generic | None found | Sprite + JSON | Not current runtime mapping | Anonymous/generic, asset-ready only | Older generic sheet. |
| `hauler` / `oona-tallpack-hauler-v1` | Named: Oona Tallpack | Prompt contains full origin story; JSON has no display/backstory | Sprite + JSON + prompt | Runtime scene-wired through `ACTOR_SPRITE_SHEETS.hauler` | Prompt/spec ready, runtime-wired | Needs JSON-sidecar character bible promotion. |
| `hauler` / `hauler-agentfolk-v1` | Anonymous/generic | None found | Sprite + JSON | Not current runtime mapping | Anonymous/generic, asset-ready only | Older generic sheet. |
| `messenger` / `rook-signalpost-messenger-v1` | Named: Rook Signalpost | Prompt has named messenger concept; JSON has no display/backstory | Sprite + JSON + prompt | Runtime scene-wired through `ACTOR_SPRITE_SHEETS.messenger` | Prompt/spec ready, runtime-wired | Needs JSON-sidecar character bible promotion. |
| `messenger` / `messenger-agentfolk-v1` | Anonymous/generic | None found | Sprite + JSON | Not current runtime mapping | Anonymous/generic, asset-ready only | Older generic sheet. |
| `scout` / `pathfinder-scout-v1` | Named in prompt: Mira Trailmark | Prompt has character identity; JSON has no display/backstory | Sprite + JSON + prompt | Runtime scene-wired through `ACTOR_SPRITE_SHEETS.scout` | Prompt/spec ready, runtime-wired | Runtime-ready, but JSON-sidecar character bible is missing. |
| `settler` / `settler-convoy-crew-v1` | Named in JSON: Luma Reedbarrel; prompt says Tava Ridgekit | JSON backstory present; prompt sidecar also has a named character but name conflicts | Sprite + JSON + prompt | Runtime scene-wired through `ACTOR_SPRITE_SHEETS.settler` | Fully character-ready with name-conflict cleanup needed | Tiny safe follow-up: reconcile Luma vs Tava across JSON/prompt/report references. |
| `trader` / `market-trader-v1` | Named: Maro Tallyseed | JSON backstory present; prompt sidecar present | Sprite + JSON + prompt | Runtime scene-wired through `ACTOR_SPRITE_SHEETS.trader` | Fully character-ready | Preferred runtime market role. |
| `market_trader` / `market-trader-v1` | Prompt names Pip Vale; JSON backstory mentions Pip, no display name | JSON/prompt backstory present | Sprite + JSON + prompt | Not current runtime mapping; scene normalizes `market_trader` role to `trader` | Asset-ready duplicate / prompt-ready | Duplicate namespace conflicts with runtime `trader` Maro. Decide whether Pip is archive, variant, or rename. |
| `workshop_specialist` / `workshop-specialist-v1` | Named: Bria Coppernotch | JSON backstory present; prompt sidecar present | Sprite + JSON + prompt | Runtime scene-wired through `ACTOR_SPRITE_SHEETS.workshop_specialist` | Fully character-ready | Good model for named operator metadata. |
| `charter_clerk` / `charter-clerk-v1` | Named: Miri Ledgerwale | JSON backstory present; prompt sidecar present | Sprite + JSON + prompt | Asset-ready only; prior scene-wiring report skipped because no physical Settlement Charter building anchor | Fully character-ready, asset-ready only | Good character bible, blocked by runtime anchor. |
| `research_doctrine_keeper` / `research-doctrine-keeper-v1` | Named: Sera Vellumroot | JSON backstory present; prompt sidecar present | Sprite + JSON + prompt | Asset-ready only; prior scene-wiring report skipped because no physical Research Lodge building anchor | Fully character-ready, asset-ready only | Good character bible, blocked by runtime anchor. |
| `cohort_hall_coordinator` / `cohort-hall-coordinator-v1` | Named: Oriel-9 | JSON backstory present; prompt sidecar present | Sprite + JSON + prompt | Asset-ready only; prior scene-wiring report skipped because no physical Cohort Hall building anchor | Fully character-ready, asset-ready only | Good robot/agent character, blocked by runtime anchor. |
| `civic_routekeeper` / `civic-routekeeper-v1` | Named: Tally-Route 14 | JSON backstory present; prompt sidecar present | Sprite + JSON + prompt | Runtime scene-wired from active `civic_beacon` state | Fully character-ready, runtime-wired | Strong compliance with robot/agent mix and visual-only boundary. |
| `oracle_adjunct` / `oracle-adjunct-v1` | Named: Pella-Node | JSON backstory present; prompt sidecar present | Sprite + JSON + prompt | Runtime scene-wired from World Grid read model after civic beacon | Fully character-ready, runtime-wired | Strong compliance with bounded assistant framing. |
| `outpost_keeper` / `outpost-keeper-v1` | Named: Noma Hearthpin | JSON backstory present; prompt sidecar present | Sprite + JSON + prompt | Runtime scene-wired from founded settlement claim / owned outpost | Fully character-ready, runtime-wired | Strong compliance with visual-only outpost care role. |

## Runtime Scene-Wiring Summary

Current `scene_state.js` maps these roles to sprite sheets:

- Runtime-wired: `builder`, `worker`, `hauler`, `messenger`, `scout`, `workshop_specialist`, `trader`, `settler`, `civic_routekeeper`, `oracle_adjunct`, `outpost_keeper`.
- Asset-ready only: `charter_clerk`, `research_doctrine_keeper`, `cohort_hall_coordinator`.
- Anonymous/generic older sheets: `builder-agentfolk-v2`, `builder-sprite-sheet-gpt2-v1`, `worker-agentfolk-v1`, `hauler-agentfolk-v1`, `messenger-agentfolk-v1`.

Relevant prior report facts:

- `reports/agent-town-asset-ready-operators-scene-wiring-2026-05-31.md` says `charter_clerk`, `research_doctrine_keeper`, and `cohort_hall_coordinator` were intentionally not wired because the current scene lacks truthful physical anchors for Settlement Charter, Research Lodge, and Cohort Hall.
- `reports/agent-town-hq11-civic-actors-scene-wiring-2026-05-31.md` says `civic_routekeeper`, `oracle_adjunct`, and `outpost_keeper` are now wired as visual-only actors from real server-owned state.
- `reports/agent-town-functional-building-inhabitants-production-matrix-2026-05-31.md` establishes that every functional building/surface should have an associated inhabitant, crew, or operator layered over server-owned truth.

## Base-Building Gaps

Priority gaps for base buildings:

1. `FARM_PLOT`: still no dedicated named farmer/grower. Runtime production can use generic `worker` / Kettle-37 and output-ready `hauler` / Oona, but Robin's named-character requirement suggests creating a dedicated farm operator if the farm is a recurring scene surface.
2. `QUARRY`: still no dedicated named quarry mason/stonecutter. Kettle-37 is charming, but not quarry-specific.
3. `LUMBER_CAMP`: Rigger/Kettle/Oona cover construction/production/hauling, but there is no named lumber-camp-specific worker. This is lower priority than Farm/Quarry because Rigger and Kettle visually fit early workshop/lumber work better.
4. `HQ`: no dedicated named HQ housekeeper/operator besides Clover/foreman context outside this inhabitants folder. If the inhabitant/operator cast is meant to include HQ itself, it needs a defined named surface owner.

Already improved base/current functional surfaces:

- `EXPEDITION_BOARD`: `scout` / Pathfinder Scout is runtime-wired, but JSON metadata needs the character bible.
- `WORKSHOP`: `workshop_specialist` / Bria Coppernotch is runtime-wired and character-ready.
- `MARKET_STALL`: `trader` / Maro Tallyseed is runtime-wired and character-ready.

## Metadata Quality Gaps

The canonical JSON sidecars are uneven. For robust character-bible treatment, the runtime-facing JSON should not rely on prompt sidecars for core identity.

Recommended minimal metadata fields for all inhabitant JSON:

- `displayName`
- `role`
- `backstory` or `characterBible.backstory`
- `personality`
- `visualRoleBoundary` or equivalent visual-only authority note
- `relationships` or `relationshipToCast` where useful
- `spriteSheet` and action/animation rows

High-priority JSON promotions:

1. `kettle-37-worker-v1.json`: add Kettle-37 display name and origin/story summary from prompt.
2. `oona-tallpack-hauler-v1.json`: add Oona Tallpack display name and origin/story summary from prompt.
3. `rook-signalpost-messenger-v1.json`: add Rook Signalpost display name and backstory.
4. `pathfinder-scout-v1.json`: add Mira Trailmark display name and backstory.
5. `rigger-slate-builder-v2.json`: expand Rigger Slate beyond description into character-bible fields.
6. `settler-convoy-crew-v1`: reconcile `Luma Reedbarrel` in JSON vs `Tava Ridgekit` in prompt.
7. `market_trader/market-trader-v1` vs `trader/market-trader-v1`: resolve Pip Vale vs Maro Tallyseed duplicate role/name namespace.

## Priority Handoff

1. Promote prompt-only character bibles into JSON for the five runtime-wired older replacements: Rigger, Kettle, Oona, Rook, and Mira.
2. Resolve duplicate/conflicting named characters: `settler` Luma/Tava and `trader` Maro/Pip.
3. Define dedicated named operators for `FARM_PLOT` and `QUARRY` before adding more high-HQ roles.
4. Leave `charter_clerk`, `research_doctrine_keeper`, and `cohort_hall_coordinator` asset-ready until real scene anchors exist.
5. Mark or archive older anonymous `agentfolk`/GPT2 sheets so future audits do not mistake them for character-ready assets.

## Verification Commands Run

```sh
pwd && rg --files public/experiences/founders-plot/assets/characters/inhabitants reports | sed -n '1,240p'
find public/experiences/founders-plot/assets/characters/inhabitants -maxdepth 4 -type f | sort | sed -n '1,240p'
rg -n "inhabitant|character bible|Founders Plot|founders-plot|operator|cast|generic|backstory|Robin" reports public/experiences/founders-plot -g '!**/*.png' -g '!**/*.jpg' -g '!**/*.webp'
jq -r '"FILE\tID\tNAME\tROLE\tDISPLAY\tBIO\tBACKSTORY\tSPRITE\tACTIONS", input_filename as $f | [$f, (.id//""), (.name//""), (.role//""), (.displayName//""), (.bio//.description//""), (.backstory//.lore//""), (.spriteSheet//.sprite//.image//.src//""), ((.actions//.animations//.rows//[])|tostring)] | @tsv' public/experiences/founders-plot/assets/characters/inhabitants/**/*.json
rg -n "inhabitants/|generatedOverlayRoleId|sprite|operator|actor|inhabitant\.|builder|worker|hauler|messenger|trader|scout|settler|charter|research|cohort|civic_routekeeper|oracle|outpost|workshop" public/experiences/founders-plot/scene_state.js public/experiences/founders-plot/three_scene_entry.js public/experiences/founders-plot/founders-plot.js tests-founders-plot -g '!**/three_scene_bundle.js'
sed -n '1,220p' reports/agent-town-asset-ready-operators-scene-wiring-2026-05-31.md
sed -n '1,140p' reports/agent-town-functional-building-inhabitants-production-matrix-2026-05-31.md
sed -n '1,100p' reports/agent-town-hq11-civic-actors-scene-wiring-2026-05-31.md
sed -n '1,220p' public/experiences/founders-plot/scene_state.js
sed -n '220,520p' public/experiences/founders-plot/scene_state.js
for f in public/experiences/founders-plot/assets/characters/inhabitants/**/*.prompt.md; do printf '\n--- %s ---\n' "$f"; sed -n '1,60p' "$f"; done
date '+%Y-%m-%d %H:%M:%S %Z' && git status --short
```

## Notes

- No push, merge, deploy, external/public message, destructive cleanup, production asset overwrite, gameplay/server authority change, Atlas execution change, generated bundle change, or broad refactor was performed.
- No proof JSON was necessary; this report is the bounded handoff artifact.
