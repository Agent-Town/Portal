# AgentTown Batch C Civic / World Grid Inhabitants Sprite Integration

Date: 2026-05-31
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch/context: dirty shared branch `neo/progression-atlas-editor-next-2026-05-29`

## Summary

Batch C adds three repo-owned, asset-ready civic / World Grid inhabitants plus one proof-only World Grid prop:

- Civic Routekeeper for read-only civic path/readiness surfaces.
- Oracle Adjunct for bounded World Grid signal interpretation.
- Outpost Keeper for settlement welcome/outpost caretaker visuals.
- World Grid Civic Beacon proof prop for future read-model/civic UI or scene surfaces.

Two of the three characters are clearly robotic/agentic/synthetic: Tally-Route 14 and Pella-Node. All assets are cozy civic neighbors only. This lane adds no gameplay mechanics, hidden authority, scheduler behavior, route/trade behavior, public effects, Atlas execution, or server mutations.

## Character Roster

### Tally-Route 14 - Civic Routekeeper

Tally-Route 14 keeps civic paths legible without pretending to control them. It walks the edge of new settlements, placing friendly marker ribbons and explaining which World Grid signals are read-only readiness hints.

Runtime candidate role: `civic_routekeeper`

Robotic/agentic status: clearly synthetic civic routekeeper, not a drone/combat/surveillance unit.

Rows: `idle`, `walk`, `mark`, `ready`

Candidate mappings for future visual actor wiring:

- `WORLD_GRID_READ_MODEL` / `CIVIC_READINESS` -> `ready`
- `OUTPOST_FOUNDED` -> `mark`
- `OUTPUT_READY` -> `ready`

### Pella-Node - Oracle Adjunct

Pella-Node translates civic signals into neighbor-sized receipts. It is intentionally partial: helpful for reading the World Grid horizon, unable to see everything, and happier when a human keeps the final say.

Runtime candidate role: `oracle_adjunct`

Robotic/agentic status: visibly synthetic oracle adjunct, not surveillance or an all-seeing authority.

Rows: `idle`, `walk`, `consult`, `ready`

Candidate mappings for future visual actor wiring:

- `WORLD_GRID_READ_MODEL` -> `consult`
- `CIVIC_READINESS` / `OUTPUT_READY` -> `ready`
- `DOCTRINE_SELECTED` -> `consult`

### Noma Hearthpin - Outpost Keeper

Noma Hearthpin makes a new outpost feel less like a claim and more like a place to be welcomed. She tends lanterns, blank guest logs, and civic notice ribbons while leaving every real decision to the settlement systems.

Runtime candidate role: `outpost_keeper`

Rows: `idle`, `walk`, `tend`, `ready`

Candidate mappings for future visual actor wiring:

- `OUTPOST_FOUNDED` / `SETTLEMENT_CLAIM` -> `tend`
- `CIVIC_READINESS` / `OUTPUT_READY` -> `ready`

## Prop

World Grid Civic Beacon is a visual-only read-model proof prop. It is a harmless civic readiness marker with no route, trade, scheduler, security, surveillance, public-effect, or gameplay authority.

## Asset Paths

Civic Routekeeper:

- `public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.prompt.md`

Oracle Adjunct:

- `public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.prompt.md`

Outpost Keeper:

- `public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.prompt.md`

World Grid Civic Beacon:

- `public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.generated.png`
- `public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.source.png`
- `public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.png`
- `public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.webp`
- `public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.json`
- `public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.prompt.md`

## Prompt And Mode

Mode: built-in `image_gen` with requested GPT Image 2.0 path, opaque green chroma-key sources, local alpha cleanup.

Native generated outputs:

- Tally-Route 14: `/Users/robin/.openclaw/agents/main/agent/codex-home/generated_images/019e7c63-12e6-76d1-85d0-cd38068fd851/ig_03427427825ed960016a1bc1f35efc8191a61250633a33c260.png`
- Pella-Node: `/Users/robin/.openclaw/agents/main/agent/codex-home/generated_images/019e7c63-12e6-76d1-85d0-cd38068fd851/ig_03427427825ed960016a1bc2438e34819192b8ef5ee67de852.png`
- Noma Hearthpin: `/Users/robin/.openclaw/agents/main/agent/codex-home/generated_images/019e7c63-12e6-76d1-85d0-cd38068fd851/ig_03427427825ed960016a1bc2fb27248191a2a4a942470bb0c9.png`
- World Grid Civic Beacon: `/Users/robin/.openclaw/agents/main/agent/codex-home/generated_images/019e7c63-12e6-76d1-85d0-cd38068fd851/ig_03427427825ed960016a1bc3ff7c1c8191b28c62eb8b78c415.png`

Post-processing:

- Preserved native outputs as `.generated.png`.
- Resized opaque character sources to the 2048x2048 / 4x4 / 512px-cell runtime contract as `.source.png`.
- Resized opaque prop source to a 1024x1024 runtime candidate.
- Converted chroma green to alpha with ImageMagick and preserved final runtime PNGs as sRGBA.
- Wrote a WebP runtime candidate for the proof prop only.

## Wiring Status

No `scene_state.js`, server, route, tool, store, Progression Atlas, or test changes were made.

Reason: the current engine/read model does not emit server visual actors for `civic_routekeeper`, `oracle_adjunct`, or `outpost_keeper`. The roles map to real civic / World Grid surfaces, but there is not yet a server-owned scene actor to project. This batch is therefore asset-ready only, with contact/checker proof instead of fabricated engine behavior.

## Proof Paths

- `reports/agent-town-batch-c-civic-world-grid-inhabitants-contact-sheet-2026-05-31.png`
- `reports/agent-town-batch-c-civic-world-grid-inhabitants-row-strip-2026-05-31.png`
- `reports/agent-town-batch-c-civic-routekeeper-checker-preview-2026-05-31.png`
- `reports/agent-town-batch-c-oracle-adjunct-checker-preview-2026-05-31.png`
- `reports/agent-town-batch-c-outpost-keeper-checker-preview-2026-05-31.png`
- `reports/agent-town-batch-c-world-grid-civic-beacon-checker-preview-2026-05-31.png`
- `reports/agent-town-batch-c-civic-routekeeper-row-mark-2026-05-31.png`
- `reports/agent-town-batch-c-oracle-adjunct-row-consult-2026-05-31.png`
- `reports/agent-town-batch-c-outpost-keeper-row-tend-2026-05-31.png`
- `reports/agent-town-batch-c-civic-world-grid-inhabitants-proof-2026-05-31.json`

## Validation

Passed:

- `jq empty public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.json public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.json public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.json public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.json reports/agent-town-batch-c-civic-world-grid-inhabitants-proof-2026-05-31.json`
- ImageMagick identify/pixel checks for final runtime character sprites:
  - `2048x2048`
  - `srgba`
  - all four corners transparent
- ImageMagick identify/pixel checks for World Grid Civic Beacon PNG/WebP:
  - `1024x1024`
  - `srgba`
  - sampled corners transparent
- `git diff --check`

Not run:

- `node --check public/experiences/founders-plot/scene_state.js` because this lane did not touch `scene_state.js`.
- `NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js` because this lane did not touch `scene_state.js` or the scene-state test file.

## Residual Risks

- The built-in image generation path returned 1254x1254 native images despite the 2048 prompt, so the repo `.source.png` and final `.png` sheets are normalized/upscaled to the existing sprite contract.
- Chroma-key cleanup was done with ImageMagick, not native model transparency. Corners validate transparent, but final art should still get a human visual pass before scene wiring.
- These characters are not scene-wired yet. Future wiring should wait until the server emits real visual actors or a deliberate UI-to-scene projection contract exists for civic / World Grid inhabitants.
