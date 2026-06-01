# AgentTown Batch B Functional Inhabitants Sprite Integration

Date: 2026-05-31
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Summary

Batch B adds three repo-owned, asset-ready functional inhabitants for post-Batch-A surfaces:

- Charter Clerk for Settlement Charter / reviewed Site Plan civic records.
- Research Lodge Doctrine Keeper for Research Lodge doctrine selection/read-model UI.
- Cohort Hall Coordinator for bounded cohort work-order drafts and receipts.

The batch includes one clearly robotic/agentic character: Oriel-9, the Cohort Hall Coordinator. These are cozy civic operators only. They do not add gameplay mechanics, autonomy, mutation authority, scheduler behavior, Atlas execution, work-order execution authority, or hidden server behavior.

## Character Roster

### Miri Ledgerwale - Charter Clerk

Miri Ledgerwale keeps civic promises from becoming vague town lore. She folds every reviewed site plan, consent mark, and charter receipt into a record that future settlers can actually understand.

Runtime candidate role: `charter_clerk`

Rows: `idle`, `walk`, `review`, `ready`

Candidate mappings for future visual actor wiring:

- `SITE_PLAN_REVIEW` / `REVIEW_SITE_PLAN` / `CHARTER_REVIEW` -> `review`
- `SETTLEMENT_CHARTER` / `CHARTER_READY` / `OUTPUT_READY` -> `ready`

### Sera Vellumroot - Research Lodge Doctrine Keeper

Sera Vellumroot tends the Research Lodge like a shared library for hard choices. She compares doctrine tiles, explains the narrow server-owned effect, and makes sure civic knowledge stays bounded instead of mystical.

Runtime candidate role: `research_doctrine_keeper`

Rows: `idle`, `walk`, `research`, `ready`

Candidate mappings for future visual actor wiring:

- `DOCTRINE_RESEARCH` / `SELECT_DOCTRINE` -> `research`
- `DOCTRINE_SELECTED` / `RESEARCH_READY` / `OUTPUT_READY` -> `ready`

### Oriel-9 - Cohort Hall Coordinator

Oriel-9 was built to be helpful in public, boring in authority, and excellent at boundaries. It arranges work-order drafts into tidy receipt bundles, then waits for explicit human action before anything runs.

Runtime candidate role: `cohort_hall_coordinator`

Robotic/agentic status: clearly synthetic civic coordinator, not a drone/combat/surveillance unit.

Rows: `idle`, `walk`, `coordinate`, `ready`

Candidate mappings for future visual actor wiring:

- `CREATE_WORK_ORDER_DRAFT` / `WORK_ORDER_DRAFT` -> `coordinate`
- `WORK_ORDER_DRAFTED` / `WORK_ORDER_EXECUTED` / `OUTPUT_READY` -> `ready`

## Asset Paths

Charter Clerk:

- `public/experiences/founders-plot/assets/characters/inhabitants/charter_clerk/charter-clerk-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/charter_clerk/charter-clerk-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/charter_clerk/charter-clerk-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/charter_clerk/charter-clerk-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/charter_clerk/charter-clerk-v1.prompt.md`

Research Doctrine Keeper:

- `public/experiences/founders-plot/assets/characters/inhabitants/research_doctrine_keeper/research-doctrine-keeper-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/research_doctrine_keeper/research-doctrine-keeper-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/research_doctrine_keeper/research-doctrine-keeper-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/research_doctrine_keeper/research-doctrine-keeper-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/research_doctrine_keeper/research-doctrine-keeper-v1.prompt.md`

Cohort Hall Coordinator:

- `public/experiences/founders-plot/assets/characters/inhabitants/cohort_hall_coordinator/cohort-hall-coordinator-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/cohort_hall_coordinator/cohort-hall-coordinator-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/cohort_hall_coordinator/cohort-hall-coordinator-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/cohort_hall_coordinator/cohort-hall-coordinator-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/cohort_hall_coordinator/cohort-hall-coordinator-v1.prompt.md`

## Prompt And Mode

Mode: built-in `image_gen` with requested GPT Image 2.0 path, opaque green chroma-key sources, local alpha cleanup.

Native generated outputs:

- Miri: `/Users/robin/.openclaw/agents/main/agent/codex-home/generated_images/019e7c45-8e1f-7fa3-a67c-4ccf4bf0859b/ig_0ab5d2a9f79f2c3f016a1bb820f1bc8191bcb1e2d3733ae8cf.png`
- Sera: `/Users/robin/.openclaw/agents/main/agent/codex-home/generated_images/019e7c45-8e1f-7fa3-a67c-4ccf4bf0859b/ig_0ab5d2a9f79f2c3f016a1bb8e387848191b63107b40abd684e.png`
- Oriel-9: `/Users/robin/.openclaw/agents/main/agent/codex-home/generated_images/019e7c45-8e1f-7fa3-a67c-4ccf4bf0859b/ig_0ab5d2a9f79f2c3f016a1bb9ab4b9081918b509f919431a687.png`

Post-processing:

- Preserved native outputs as `.generated.png`.
- Resized opaque sources to the 2048x2048 / 4x4 / 512px-cell runtime contract as `.source.png`.
- Converted chroma green to alpha with ImageMagick and preserved final runtime sheets as sRGBA `.png`.

## Wiring Status

No `scene_state.js` or scene-state test changes were made.

Reason: the current engine/read model does not emit server visual actors for `charter_clerk`, `research_doctrine_keeper`, or `cohort_hall_coordinator`. The roles map to real UI/read-model surfaces, but there is not yet a server-owned scene actor to project. This batch is therefore asset-ready only, with contact/checker proof instead of fabricated engine behavior.

## Proof Paths

- `reports/agent-town-batch-b-functional-inhabitants-contact-sheet-2026-05-31.png`
- `reports/agent-town-batch-b-functional-inhabitants-row-strip-2026-05-31.png`
- `reports/agent-town-batch-b-charter-clerk-checker-preview-2026-05-31.png`
- `reports/agent-town-batch-b-research-doctrine-keeper-checker-preview-2026-05-31.png`
- `reports/agent-town-batch-b-cohort-hall-coordinator-checker-preview-2026-05-31.png`
- `reports/agent-town-batch-b-charter-clerk-row-review-2026-05-31.png`
- `reports/agent-town-batch-b-research-doctrine-keeper-row-research-2026-05-31.png`
- `reports/agent-town-batch-b-cohort-hall-coordinator-row-coordinate-2026-05-31.png`
- `reports/agent-town-batch-b-functional-inhabitants-proof-2026-05-31.json`

## Validation

Passed:

- `jq empty public/experiences/founders-plot/assets/characters/inhabitants/charter_clerk/charter-clerk-v1.json public/experiences/founders-plot/assets/characters/inhabitants/research_doctrine_keeper/research-doctrine-keeper-v1.json public/experiences/founders-plot/assets/characters/inhabitants/cohort_hall_coordinator/cohort-hall-coordinator-v1.json reports/agent-town-batch-b-functional-inhabitants-proof-2026-05-31.json`
- ImageMagick identify/pixel checks for all final runtime sprites:
  - `2048x2048`
  - `srgba`
  - all four corners transparent
- `git diff --check`

Not run:

- `node --check public/experiences/founders-plot/scene_state.js` because this lane did not touch `scene_state.js`.
- `NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js` because this lane did not touch `scene_state.js` or the scene-state test file.

## Residual Risks

- The built-in image generation path returned 1254x1254 native images despite the 2048 prompt, so the repo `.source.png` and final `.png` sheets are normalized/upscaled to 2048x2048 for the existing sprite contract.
- The bundled chroma-key helper could not run because Pillow is unavailable in this environment; ImageMagick was used for local alpha cleanup instead.
- These characters are not scene-wired yet. Future wiring should wait until the server emits real visual actors or a deliberate UI-to-scene projection contract exists for charter, doctrine, or cohort surfaces.
