# AgentTown Batch A Functional Inhabitants Sprite Integration

Date: 2026-05-31
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`

## Summary

Batch A functional-building inhabitants are now repo-owned and wired into Founders Plot as visual-only projections:

- Workshop Specialist for `WORKSHOP` production / buff-ready states.
- Market Trader for `MARKET_STALL` selling / coin-ready states.
- Settler Convoy Crew for `SETTLER_CONVOY` / settlement-ready claim states.

This closes the immediate "functional buildings need visible people" gap without adding gameplay authority. The server still owns gameplay truth; the sprites only make existing state legible in the scene.

## Characters

### Bria Coppernotch - Workshop Specialist

Bria Coppernotch learned to read a town by the tiny gaps in its doors, jigs, and roof beams. In AgentTown she keeps the Workshop honest: every improvement token is measured, sealed, and checked before anyone builds with it.

Runtime role: `workshop_specialist`

Mapped actions:

- `PRODUCE` / `WORKSHOP_TUNE` -> `tune`
- `BUFF_READY` / `OUTPUT_READY` -> `ready`

### Maro Tallyseed - Market Trader

Maro Tallyseed keeps the Market Stall from feeling like a ledger and turns it back into a neighborly exchange. They know which crates should become supper, which surplus can become coin, and which deal should wait for a better day.

Runtime role: `trader`

Alias accepted from engine state: `market_trader`

Mapped actions:

- `SELL` -> `sell`
- `COIN_READY` / `OUTPUT_READY` -> `ready`

### Tava Ridgekit - Settler Convoy Crew

Tava Ridgekit is a practical convoy crew lead who makes settlement claim preparation and arrival legible without adding any expansion authority. Tava carries route markers, survey tools, and founding receipts so expansion reads as careful preparation rather than invisible automation.

Runtime role: `settler`

Mapped actions:

- `SETTLER_CONVOY` / `CONVOY_PREPARING` -> `prepare`
- `SETTLEMENT_READY` / `CONVOY_ARRIVED` / `FOUNDED` -> `ready`

## Generated Sources

Mode: OpenClaw image generation with `openai/gpt-image-2`, opaque chroma-key sources, local alpha cleanup.

Generated source files:

- `/Users/robin/.openclaw/media/tool-image-generation/agent-town-workshop-specialist-sprite-sheet-v1-opaque---03f7387d-dbb0-4c2e-863e-2885927c27d6.png`
- `/Users/robin/.openclaw/media/tool-image-generation/agent-town-market-trader-sprite-sheet-v1-opaque---2e57d26d-e68b-4b57-ac17-3f1e0a403e8e.png`
- `/Users/robin/.openclaw/media/tool-image-generation/agent-town-settler-convoy-crew-sprite-sheet-v1-opaque---1c7c71c8-a00f-40aa-a434-336aeea35ff4.png`

Post-processing:

- Copied each GPT Image 2.0 source into the repo.
- Converted chroma mint plus near-white background pixels to alpha with ImageMagick.
- Preserved the 2048x2048 / 4x4 / 512px-cell sprite contract.
- Stored prompt and metadata next to each runtime sprite.

## Repo Assets

Workshop Specialist:

- `public/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/workshop_specialist/workshop-specialist-v1.prompt.md`

Market Trader:

- `public/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/trader/market-trader-v1.prompt.md`

Compatibility alias copy:

- `public/experiences/founders-plot/assets/characters/inhabitants/market_trader/market-trader-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/market_trader/market-trader-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/market_trader/market-trader-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/market_trader/market-trader-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/market_trader/market-trader-v1.prompt.md`

Settler Convoy Crew:

- `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.generated.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/settler/settler-convoy-crew-v1.prompt.md`

## Runtime Wiring

Changed:

- `server/founders_plot/engine.js`
- `public/experiences/founders-plot/scene_state.js`
- `tests-founders-plot/fp-scene-state.test.js`

Server visual projections now emit building-specific operator roles:

- `WORKSHOP` `PRODUCE` jobs -> `workshop_specialist`
- `WORKSHOP` output-ready buff -> `workshop_specialist` / `BUFF_READY`
- `MARKET_STALL` `SELL` jobs -> `market_trader`
- `MARKET_STALL` coin-ready output -> `market_trader` / `COIN_READY`

Scene-state mapping keeps all of this visual-only:

- `market_trader` engine role maps to the scene role `trader`.
- Workshop and trader actors get role-specific route modes, cues, and sprite action rows.
- Settler claim actors now resolve to `settler-convoy-crew-v1` instead of an invisible/generic projection.

## Proofs

Generated proof assets:

- `reports/agent-town-batch-a-functional-inhabitants-contact-sheet-2026-05-31.png`
- `reports/agent-town-batch-a-functional-inhabitants-row-strip-2026-05-31.png`
- `reports/agent-town-workshop-specialist-v1-checker-preview-2026-05-31.png`
- `reports/agent-town-market-trader-v1-checker-preview-2026-05-31.png`
- `reports/agent-town-settler-convoy-crew-v1-checker-preview-2026-05-31.png`
- `reports/agent-town-batch-a-functional-inhabitants-scene-state-proof-2026-05-31.json`
- `reports/agent-town-batch-a-settler-convoy-scene-state-proof-2026-05-31.json`

Alpha/dimension checks passed for all three runtime sprites:

- `2048x2048`
- `srgba`
- transparent corners
- transparent center grid crossing

## Validation

Passed:

- `jq empty` for Batch A metadata JSON.
- `node --check server/founders_plot/engine.js`
- `node --check public/experiences/founders-plot/scene_state.js`
- `node --check tests-founders-plot/fp-scene-state.test.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-scene-state.test.js` (7/7)
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-scene-state.test.js` (67/67)
- `PW_PORT=4186 npx playwright test e2e/214_founders_plot_threejs_playable_slice.spec.js e2e/200_founders_plot.spec.js --project=chromium` (13/13)
- `git diff --check`

## Boundary

This slice adds character art and visual-only scene projections. It does not add resource rules, production output changes, autonomous actions, settlement authority, work-order authority, routing authority, policy changes, or Atlas executable actions.
