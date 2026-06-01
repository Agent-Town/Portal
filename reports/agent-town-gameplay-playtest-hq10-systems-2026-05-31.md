# Agent Town Gameplay QA - HQ10 Systems Playtest

Date: 2026-05-31
Agent: Turing
Worktree: `/Users/robin/Projects/Portal-atlas-editor` dirty shared branch
Scope: late-game/HQ10 systems pass for HQ9 Work Orders, HQ10A World Grid, HQ10B civic proposal records/UI, HQ10C Generated Universe overlay-pack records/UI, and Progression Atlas HQ9/HQ10 clarity.

## Verdict

Partially blocked on the newest frontend. The server-owned record model held: I created an HQ10B reviewed civic proposal and an HQ10C draft overlay-pack record through the browser UI/API, and the saved payloads show `executionAllowed: false`, `presentationOnly: true`, no public sharing, and no Atlas execution.

However, the now-current Founders Plot frontend crashes when reloading a plot that already has an overlay-pack record. This leaves the World Grid/Civic Proposal/Overlay panels stuck in loading state, with a visible toast:

`TypeError: Cannot read properties of null (reading 'overlayPackId')`

This is a high-severity blocker for the newest HQ10 systems UI even though the backend records themselves are intact.

## Proof Files

- API/record evidence: `reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-api-evidence.json`
- Initial UI proof JSON: `reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-ui-proof.json`
- Current-source reload proof: `reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-current-ui-proof.json`
- Command/test results: `reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-command-results.json`
- Screenshots:
  - `reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-hq9-work-orders-draft.png`
  - `reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-hq9-work-orders-completed.png`
  - `reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-hq10-panels.png`
  - `reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-progression-atlas.png`
  - `reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-mobile-390.png`

Note: `public/experiences/founders-plot/founders-plot.js` changed in the shared worktree after my first successful UI proof. I reran a read-only current-source pass and overwrote the HQ10/mobile screenshots with the newest behavior. The current-source proof records `founders-plot.js` mtime `2026-05-31T06:59:17.629Z`, sha256 `8973b2e490638a4865880f245aea67113f4fdf580ad5a42b126296fa76de7567`.

## Created Record Evidence

Browser-created HQ10B civic proposal payload:

```json
{
  "url": "/api/founders-plot/civic-proposals",
  "title": "Outpost welcome review",
  "category": "civic_memory",
  "status": "REVIEWED",
  "actor": "HUMAN"
}
```

Server response evidence:

```json
{
  "proposalId": "civic_proposal_871c54e36600fae8",
  "status": "REVIEWED",
  "executionAllowed": false
}
```

Browser-created HQ10C overlay-pack payload:

```json
{
  "url": "/api/founders-plot/overlay-packs",
  "sourceProposalId": "civic_proposal_871c54e36600fae8",
  "title": "Lantern Grid Overlay",
  "theme": "lantern_grid",
  "status": "DRAFT",
  "targetSurfaceIds": ["progression_atlas", "world_grid"]
}
```

Server response evidence:

```json
{
  "overlayPackId": "overlay_pack_eae14d7a5adbe5d0",
  "visualOnly": true,
  "presentationOnly": true,
  "executionAllowed": false
}
```

Final read model summary:

- Work Orders: 1 completed, 2 child receipts, spend cap 0.
- World Grid: `READ_MODEL_READY`, `readOnly: true`, `executableActions: []`.
- Civic proposals: 1 reviewed proposal, proposal-only.
- Overlay packs: 1 draft pack, presentation-only.
- Atlas action refs for civic/overlay/work-order records all have `executableByAtlas: false`; non-false executable Atlas refs list is empty in proof.

## Findings

### High - Current HQ10 panels crash after overlay records exist

Current-source reload against the persisted playtest records shows the HQ10 lower panels do not render. `World Grid` becomes an empty panel, `Civic Proposals` remains `Civic proposal records loading.`, and `Generated Universe Overlay Packs` remains `Overlay pack records loading.` The page shows a toast:

`TypeError: Cannot read properties of null (reading 'overlayPackId')`

Proof:

- `reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-current-ui-proof.json`
- `reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-hq10-panels.png`
- `reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-mobile-390.png`

Likely source area from current file inspection: `renderOverlayApplicationPreview` calls `overlayPackId(active)` while `activeOverlayPack(bundle)` can be `null`. Because `overlayPackId(pack = {})` does not protect against explicit `null`, the render pass aborts once packs exist and no local preview is active.

Player impact: HQ10A/B/C are unreadable after an overlay-pack record exists. This is a direct blocker for the newest HQ10 systems UI.

### High - HQ10B/HQ10C forms can be wiped by the 5s state poll

During the first live browser attempt, I filled the civic proposal form and clicked the create button, but no POST was sent. Debugging showed the form `title` had been reset to empty while other fields remained, caused by the Founders Plot `loadState()` poll rerendering the panel every 5 seconds.

I had to disable the polling interval in the Playwright harness to complete the record creation. A normal player typing the title, category, status, summary, and review note slowly can lose in-progress form fields before submission.

Proof: command/debug notes in `reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-command-results.json`; successful creation after disabling the interval is in `api-evidence.json`.

Player impact: HQ10B/HQ10C record creation is fragile and can silently fail client-side before reaching the server.

### Medium - Current source contains a local overlay apply/preview affordance

The current Founders Plot source includes a local overlay application path with button text `Apply Local Preview` / `Preview Applied` and function `applyLocalOverlayPreview`. That appears outside the requested HQ10C boundary:

- No actual Generated Universe rendering.
- No overlay application beyond server-owned record creation.
- UI should not imply execution/rendering/sharing beyond records.

Because the current render crashes before this preview card appears, this is partly masked. Once the crash is fixed, the local apply affordance should either be removed for this slice or reframed as non-Generated-Universe, browser-only diagnostics outside player-facing HQ10C.

### Medium - Focused HQ10 mocked UI e2e is failing

Command:

```bash
PW_PORT=4198 npx playwright test e2e/200_founders_plot.spec.js --grep "FP-E2E-013|FP-E2E-014|FP-E2E-015|FP-E2E-016|FP-E2E-017|FP-E2E-018" --project=chromium
```

Result: 3 passed, 3 failed.

Passing:

- `FP-E2E-013` HQ9 Work Order UI
- `FP-E2E-015` mobile dense no-overflow
- `FP-E2E-016` dense Expedition Board tile selection

Failing:

- `FP-E2E-014` HQ10A World Grid UI
- `FP-E2E-017` HQ10B civic proposal UI
- `FP-E2E-018` HQ10C overlay-pack UI

The failure snapshots show the same class of problem: HQ10 panel bodies stuck in loading/empty states. Full backend Founders Plot tests still pass, so this is specifically frontend/UI-path coverage.

### Low - Three.js texture warnings are noisy but not blocking this pass

Browser console captured repeated warnings:

`THREE.WebGLRenderer: Texture marked for update but no image data found.`

I did not see this alter the record APIs or HQ9/HQ10 server evidence. It is still worth cleaning up because it makes actual rendering failures harder to spot.

## What Worked

- HQ9 Work Orders after Feynman copy polish: completed work orders with expired timestamps display completed/audit copy, not expired-draft recreate copy. Proof: `...-hq9-work-orders-completed.png`.
- HQ9 execution remains explicit: the completed work order has 2 child receipts, max child actions 2, max spend 0, current plot only.
- HQ10A World Grid server read model is coherent: `READ_MODEL_READY`, read-only, no executable actions, clear prohibited capabilities.
- HQ10B server record creation is bounded: reviewed proposal persisted with `executionAllowed: false`, proposal-only scope, no job/route/spend/public effect.
- HQ10C server record creation is bounded: overlay pack persisted as presentation-only/visual-only, public sharing false, external effects false, raw prompt not stored, no gameplay mutation.
- Progression Atlas clarity is good where it renders: authority boundary panels call out metadata-only refs and non-executable Atlas behavior. `e2e/114_progression_atlas_openclaw_lite.spec.js` passed 2/2.
- Current mobile layout width check passed: `documentScrollWidth: 390`, `bodyScrollWidth: 390`, `clipped: []`.

## Commands Run

```bash
node --check public/experiences/founders-plot/founders-plot.js
node --check public/progression-atlas.js
NODE_ENV=test node --test tests-founders-plot/fp-http.test.js
NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-scene-state.test.js
PW_PORT=4198 npx playwright test e2e/200_founders_plot.spec.js --grep "FP-E2E-013|FP-E2E-014|FP-E2E-015|FP-E2E-016|FP-E2E-017|FP-E2E-018" --project=chromium
PW_PORT=4200 npx playwright test e2e/200_founders_plot.spec.js --grep "FP-E2E-013|FP-E2E-015|FP-E2E-016" --project=chromium
PW_PORT=4201 npx playwright test e2e/114_progression_atlas_openclaw_lite.spec.js --project=chromium
jq . reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-api-evidence.json
jq . reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-ui-proof.json
jq . reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-current-ui-proof.json
identify reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31-*.png
git diff --check -- reports/agent-town-gameplay-playtest-hq10-systems-2026-05-31*
git diff --check
```

Passing summary:

- Syntax checks: pass.
- Founders Plot HTTP tests: 21/21 pass.
- Founders Plot full node tests: 79/79 pass.
- Progression Atlas e2e: 2/2 pass.
- Focused passing Founders Plot subset: 3/3 pass.
- Proof JSON parse: pass.
- Screenshot identify: pass.
- Diff whitespace checks: pass.

Failing summary:

- Focused HQ10 Founders Plot UI e2e: 3/6 pass; HQ10A/B/C UI fixture tests fail.

## Boundary Review

No source edits were made by me. I wrote only report/proof files under the requested prefix.

No push, merge, deploy, external message, public sharing, route/trade/spend/scheduler behavior, Atlas execution, or actual Generated Universe rendering was performed. The only server mutations in the playtest DB were the intended local test-mode record creations: one completed HQ9 work order, one HQ10B civic proposal record, and one HQ10C overlay-pack record.
