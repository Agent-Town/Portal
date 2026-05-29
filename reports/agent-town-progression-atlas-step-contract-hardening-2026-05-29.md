# Agent Town Progression Atlas Step Contract Hardening - 2026-05-29

## Scope

Implemented the P0 Progression Atlas saved strategy step contract hardening in `/Users/robin/Projects/Portal-atlas-editor` on branch `neo/progression-atlas-editor-next-2026-05-29`.

The strategy editor remains private/advisory-only. This change does not add gameplay mutations, store migrations, gameplay engine edits, Three.js edits, or StemStudio spike edits.

## Files Changed

- `server/founders_plot/progression_atlas.js`
- `tests-founders-plot/fp-http.test.js`
- `reports/agent-town-progression-atlas-step-contract-hardening-2026-05-29.md`

## Contract Fields Implemented

Step-level strategy JSON now preserves a typed planning contract:

- `stepKind`: `canonical_node`, `custom_note`, or `future_placeholder`
- `canonicalNodeId`: known canonical node ID for canonical edited/template steps, otherwise `null`
- `futureSystem`: `expedition`, `research`, `territory`, `unit`, `oracle`, or `null`
- `targetRef`: normalized `{ kind, id, type }` where safe/known
- `requirements`: normalized requirement envelope; custom/future requirements and items are marked `advisory: true`
- `estimatedCost`: normalized resource map or `null`
- `expectedBenefit`: string array
- `riskLevel`: `low`, `medium`, `high`, or `unknown`
- `reversibility`: `safe`, `layout_sensitive`, `irreversible`, or `unknown`
- `assumptions`: string array
- `privacy`: `private`, `share_redacted`, or `public_template_allowed`
- `actionRef`: only `et.plot.*` tools are preserved; all saved strategy action refs are marked `executable: false`

Strategy-level JSON now carries metadata without schema migration:

- `createdBy`: `human`, `openclaw_lite`, `clover`, or `atlas_oracle`
- `source`: `template`, `editor`, `oracle_draft`, `import`, or `fork`
- `contentHash`
- `parentStrategyId`
- `revision`
- `sharePolicy`

Unknown requested canonical nodes are not silently saved as canonical. They are downgraded to `future_placeholder` when a future system is inferable, otherwise to `custom_note`.

## Advisory/Mutation Boundary

Gameplay mutations remain owned by the existing `et.plot.*` tool surface. Progression Atlas saves only write private strategy-planning JSON and do not mutate Founders Plot gameplay state.

The hardened save path preserves the previous advisory invariants: `gameplayStableHash`, audit event count, and inventory remain stable across icon generation, edited strategy save, and strategy selection.

## Validation

Passed:

- `node --check server/founders_plot/progression_atlas.js`
- `node --check tests-founders-plot/fp-http.test.js`
- `node --check e2e/114_progression_atlas_openclaw_lite.spec.js`
- `NODE_PATH=/Users/robin/Projects/Portal/node_modules node --test tests-founders-plot/fp-http.test.js` - 11/11 passed
- `NODE_PATH=/Users/robin/Projects/Portal/node_modules npm run test:founders-plot` - 42/42 passed
- `PW_PORT=4384 NODE_PATH=/Users/robin/Projects/Portal/node_modules /Users/robin/Projects/Portal/node_modules/.bin/playwright test e2e/114_progression_atlas_openclaw_lite.spec.js` - 2/2 passed
- `git diff --check`

Notes:

- A first Playwright attempt using `npx playwright` plus cross-worktree `NODE_PATH` failed due mixed Playwright package resolution. Re-running with the matching Portal Playwright binary and module tree passed.
- The targeted Playwright run appears to have cleaned the pre-existing untracked `test-results/214_founders_plot_threejs_-9ecf9-er-from-server-visualActors-chromium/` artifact directory as part of Playwright output handling. No manual cleanup command was run.
- This session did not have a callable subagent interface exposed, so no additional worker sessions were spawned.
