# Agent Town Progression Atlas Full Current-Game Coverage Implementation

Date: 2026-05-29
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Base observed: `6d45775 Harden Progression Atlas strategy step contract`

## Summary

Implemented P1 additive canonical Progression Atlas coverage for current Founders Plot gameplay through HQ5.

The existing `atlas.nodes` / `atlas.edges` remain the advisory recommended strategy graph for backward compatibility. New consumers should use the additive canonical fields:

- `atlas.canonicalNodes`
- `atlas.canonicalEdges`
- `atlas.availabilityByNode`
- `atlas.actionRefsByNode`
- `atlas.receiptRefs`

Gameplay mutation remains outside the Atlas. Canonical action refs are metadata only and carry `executable: false` plus `executableByAtlas: false`; real gameplay still belongs to `et.plot.*` routes/tools.

## Changed Files

- `server/founders_plot/progression_atlas.js`
  - Added a canonical graph compiler over HQ rules, HQ upgrade rules, building defs, current state buildings/jobs/permissions/rewards/approvals/pads/storage, and Founders Plot tool specs.
  - Added additive canonical fields to the Atlas envelope.
  - Kept strategy templates/editor normalization compatible and advisory-only.
  - Extended explain to support canonical nodes as well as legacy strategy nodes.

- `tests-founders-plot/fp-http.test.js`
  - Added fresh-state canonical coverage assertions.
  - Added a real HTTP gameplay fixture that reaches HQ4/HQ5, places Workshop and Market Stall, and verifies canonical status transitions.
  - Added checks for Workshop buff metadata, Market `SELL` metadata, rewards/caps/slots, action refs, and read non-mutation.

- `public/progression-atlas.html`
- `public/progression-atlas.js`
- `public/progression-atlas.css`
  - Added a compact canonical coverage panel showing HQ spine, current buildings, loops/effects, permissions, rewards, and constraints.
  - Existing strategy compare, research map, editor, and saved private strategy flows remain unchanged.

- `e2e/114_progression_atlas_openclaw_lite.spec.js`
  - Added visible UI assertions for Workshop, Market Stall, sellSurplusFood, and HQ5 reward canonical coverage.

## Gameplay Coverage Now Represented

Canonical nodes now cover:

- HQ1-HQ5 level nodes and HQ2-HQ5 upgrade nodes.
- Building unlock/place/upgrade nodes for Lumber Camp, Farm Plot, Quarry, Workshop, and Market Stall.
- Repeatable production/collect loops for resource buildings.
- Workshop production as an effect/buff, not normal resource output.
- Market Stall `SELL` as food input and coin output.
- Permission unlocks for `observeAndSuggest`, `collectOutputs`, `queueProduction`, `setPriority`, and `sellSurplusFood`.
- Policy enable nodes plus `sellDailyCoinCap`, `maxAutonomousActionsPerHour`, and `emergencyPause` cap/state nodes.
- Reward claim nodes for first lumber and HQ2-HQ5 rewards.
- Storage cap nodes and construction slot contention.
- Workshop `nextBuildBuffPct`.
- Current approval records from state.
- Empty `receiptRefs` arrays for all canonical nodes as the P1 safe placeholder.

## Deferred

- Receipt refs remain empty arrays. Exposing event rows safely should be a narrow P1.1 read path from the event log.
- Canonical graph does not execute gameplay, choose build pads, auto-enable policies, or mutate strategy records by itself.
- Strategy generation still uses the existing curated HQ1-HQ3 templates. The new canonical graph is available for future richer strategy composition.
- Future systems such as Expedition Board, units, research, territories, sharing/forking, and generated universe overlays remain non-canonical until gameplay authority exists.

## Advisory Boundary

The Atlas is read-only for gameplay. It explains canonical state, exposes non-executable references to `et.plot.*` tools, and stores private advisory strategy JSON. Actual placement, queueing, collecting, upgrades, priority changes, reward claims, approvals, and policy changes still require the existing Founders Plot gameplay routes/tools and their idempotency/approval/policy checks.

## Subagents

Two requested Codex CLI subagent passes were attempted for read-only implementation/test guidance, but both failed before analysis with OpenAI API `401 Unauthorized`. No subagent files were created. The implementation proceeded in the main session, and this report records the handoff details.

## Validation

Passed:

- `node --check server/founders_plot/progression_atlas.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `node --check public/progression-atlas.js`
- `node --check e2e/114_progression_atlas_openclaw_lite.spec.js`
- `NODE_PATH=/Users/robin/Projects/Portal/node_modules node --test tests-founders-plot/fp-http.test.js` — 12/12
- `NODE_PATH=/Users/robin/Projects/Portal/node_modules npm run test:founders-plot` — 43/43
- `NODE_PATH=/Users/robin/Projects/Portal/node_modules PW_PORT=4361 /Users/robin/Projects/Portal/node_modules/.bin/playwright test e2e/114_progression_atlas_openclaw_lite.spec.js` — 2/2

Pending after this report:

- `git diff --check`
- `git diff --cached --check` if committing
