# AgentTown HQ Building Prerequisite Gates - 2026-05-31

## Scope

Implemented the narrow current-game HQ1-HQ6 slice for StarCraft-style HQ progression gates. The engine remains the source of truth; Progression Atlas only reads and displays the rule metadata.

## Exact Gates

- HQ1 -> HQ2: `LUMBER_CAMP` READY and `FARM_PLOT` READY, plus existing wood/food/XP.
- HQ2 -> HQ3: `QUARRY` READY, plus existing wood/stone/XP.
- HQ3 -> HQ4: `EXPEDITION_BOARD` READY, plus existing wood/stone/food/XP.
- HQ4 -> HQ5: `WORKSHOP` READY, plus existing wood/stone/food/XP.
- HQ5 -> HQ6: `MARKET_STALL` READY, plus existing wood/stone/food/XP.

No HQ7-HQ10 upgrade rules were added.

## Changed Files

- `server/founders_plot/engine.js`
  - Added `buildingPrerequisites` metadata to `HQ_UPGRADE_RULES`.
  - Added HQ prerequisite status/read-model helpers.
  - Enforced missing building prerequisites in `upgradeBuilding` with non-retryable `MISSING_HQ_BUILDING_PREREQUISITES`.
  - Exposed prerequisite status through `state.hqUpgrade`.
- `server/founders_plot/progression_atlas.js`
  - Added building prerequisite requirement items to HQ upgrade requirements.
  - Included prerequisite metadata and missing refs on canonical `hq.upgrade.*` nodes.
  - Added canonical `requires_building_prerequisite` edges from building placement nodes to HQ upgrade nodes.
- `public/experiences/founders-plot/founders-plot.js`
  - Rendered HQ building prerequisites in the selected HQ upgrade requirement list.
  - Disabled HQ upgrade button when resources/XP are present but prerequisite buildings are missing/not READY.
- `tests-founders-plot/fp-unit.test.js`
  - Added engine enforcement coverage for blocked vs satisfied HQ4 building prerequisite state.
  - Asserted exact HQ1-HQ6 prerequisite rule metadata.
- `tests-founders-plot/fp-http.test.js`
  - Updated progression helper to build `EXPEDITION_BOARD` before HQ4 and `MARKET_STALL` before HQ6.
  - Added HTTP blocked-gate coverage.
  - Asserted Atlas strategy and canonical node prerequisite metadata.
- `reports/agent-town-hq-building-prerequisite-gates-proof-2026-05-31.txt`
  - Text proof showing blocked HQ4 upgrade with sufficient resources/XP, and satisfied state after adding READY Expedition Board.

## Validation

Passed:

- `node --check server/founders_plot/engine.js`
- `node --check server/founders_plot/progression_atlas.js`
- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check tests-founders-plot/fp-unit.test.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-contract.test.js` - 60/60
- `PW_PORT=4186 npx playwright test e2e/114_progression_atlas_openclaw_lite.spec.js e2e/200_founders_plot.spec.js --project=chromium` - 14/14
- `git diff --check`

## Residual Risks

- The prerequisite check currently requires exact `state === "READY"`. A completed building that is actively producing or has output waiting (`PRODUCING` or `OUTPUT_READY`) does not satisfy the gate. That matches the requested READY wording, but it is stricter than many RTS prerequisite models.
- Existing worktree has many unrelated dirty files and untracked assets/reports. This slice did not clean, revert, push, merge, or deploy.
- Atlas still cannot execute these actions; action refs remain advisory/non-executable from Atlas.
