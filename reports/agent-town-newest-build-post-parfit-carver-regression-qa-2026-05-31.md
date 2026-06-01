# AgentTown Newest Build Post-Parfit/Carver Regression QA - 2026-05-31

## Verdict

Works, with one low-severity product-sense issue.

Parfit's two Franklin blockers stayed fixed in the newest dirty build: dense 390px mobile layout no longer horizontally overflows, and the dense 3x3 Expedition Board tile selects reliably. HQ9 Work Orders remain explicit and bounded, HQ10A World Grid remains read-only/proposal-only, HQ10B civic proposal records are visible through state/API/Atlas test coverage without any civic execution surface, and Carver's Batch C assets are present as asset-ready files only.

## Findings

### Low - Completed Work Orders can still show expired-draft copy

The HQ9 Work Orders UI is safe, but the completed work-order card can display `Expired draft. Recreate it before execution.` when `expiresAt` is in the past, even while the same card is labeled `COMPLETED` and has no execute button.

- Evidence: `reports/agent-town-newest-build-post-parfit-carver-ui-proof-2026-05-31.json`
- Code reference: `public/experiences/founders-plot/founders-plot.js:339` computes expiry text from `expiresAt` without checking final status.
- Code reference: `public/experiences/founders-plot/founders-plot.js:1547` appends that expiry text to every work-order card, including completed receipts.

This is not an authority or gameplay blocker. It is a clarity issue: completed receipts should probably show completion/receipt copy, while DRAFT/EXPIRED cards carry expiry/recreate copy.

No high or medium findings.

## Product-Sense Notes

- Founders Plot now reads as a coherent late-game slice: build/produce/collect, scout, review a site plan, found an outpost, select doctrine, draft/execute a bounded work order, then inspect World Grid readiness.
- The mobile dense layout is usable after Parfit. The full-page proof is 390px wide, and the measured `documentScrollWidth` and `bodyScrollWidth` are both 390.
- Expedition Board selection feels fixed at the QA level. The dense tile click opens the Expedition Board panel and exposes `Dispatch scout`.
- HQ9 Work Orders are explicit enough for the current slice: `Create Draft`, no scheduler/spend/placement/scouting/founding/Atlas mutation copy, and completed child receipt count are visible.
- HQ10A World Grid is clear and restrained: read-only status, requirements, known scope, civic readiness, prohibited capabilities, and zero buttons in the panel proof.
- HQ10B civic proposal records are represented in engine/API/Atlas tests as advisory persisted records only. I did not find a civic execution/trade/route/scheduler/public-effect UI.
- Batch C assets are present and asset-ready. `rg` found no `civic_routekeeper`, `oracle_adjunct`, `outpost_keeper`, or `world-grid-civic-beacon` references in `scene_state.js`, server code, Atlas UI, e2e, or tests, which matches Carver's intended "not scene-wired until server actors exist" boundary.
- The late-game right column is still long. It works, but product scanning will eventually need grouping or progressive disclosure as Reports, Plans, Claims, Doctrine, Work Orders, World Grid, and proposals accumulate.

## Proof Paths

- Mobile dense layout: `reports/agent-town-newest-build-post-parfit-carver-mobile-dense-390x844-2026-05-31.png`
- Expedition Board selected: `reports/agent-town-newest-build-post-parfit-carver-expedition-board-selected-390x844-2026-05-31.png`
- HQ9 Work Orders panel: `reports/agent-town-newest-build-post-parfit-carver-hq9-work-orders-panel-2026-05-31.png`
- HQ10 World Grid panel: `reports/agent-town-newest-build-post-parfit-carver-hq10-world-grid-panel-2026-05-31.png`
- UI/layout proof JSON: `reports/agent-town-newest-build-post-parfit-carver-ui-proof-2026-05-31.json`
- Existing Batch C proof JSON: `reports/agent-town-batch-c-civic-world-grid-inhabitants-proof-2026-05-31.json`

Proof highlights:

```json
{
  "layout": {
    "viewport": 390,
    "documentScrollWidth": 390,
    "bodyScrollWidth": 390,
    "clipped": [],
    "noHorizontalOverflow": true
  },
  "expeditionBoard": {
    "selected": true,
    "scoutAffordanceVisible": true
  },
  "hq10WorldGrid": {
    "buttonCount": 0,
    "readOnlyCopyVisible": true,
    "civicProposalRecordsVisible": true,
    "noMutationButtons": true
  }
}
```

Image dimensions validated:

```bash
identify reports/agent-town-newest-build-post-parfit-carver-mobile-dense-390x844-2026-05-31.png reports/agent-town-newest-build-post-parfit-carver-expedition-board-selected-390x844-2026-05-31.png reports/agent-town-newest-build-post-parfit-carver-hq9-work-orders-panel-2026-05-31.png reports/agent-town-newest-build-post-parfit-carver-hq10-world-grid-panel-2026-05-31.png
# 390x4525, 390x4751, 366x757, 366x964
```

Batch C asset dimensions validated:

```bash
identify public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.png public/experiences/founders-plot/assets/characters/inhabitants/oracle_adjunct/oracle-adjunct-v1.png public/experiences/founders-plot/assets/characters/inhabitants/outpost_keeper/outpost-keeper-v1.png public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.png public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.webp
# 2048x2048, 2048x2048, 2048x2048, 1024x1024, 1024x1024
```

## Verification Commands

Passed:

```bash
PW_PORT=4213 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-014|FP-E2E-015|FP-E2E-016"
# 3 passed
```

```bash
PW_PORT=4214 npx playwright test e2e/114_progression_atlas_openclaw_lite.spec.js --project=chromium
# 2 passed
```

```bash
NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-scene-state.test.js
# 75 passed
```

```bash
PW_PORT=4216 npx playwright test e2e/200_founders_plot.spec.js --project=chromium
# 16 passed
```

```bash
jq . reports/agent-town-newest-build-post-parfit-carver-ui-proof-2026-05-31.json
jq . reports/agent-town-batch-c-civic-world-grid-inhabitants-proof-2026-05-31.json
# passed
```

```bash
rg -n "civic_routekeeper|oracle_adjunct|outpost_keeper|world-grid-civic-beacon" public/experiences/founders-plot/scene_state.js server/founders_plot public/progression-atlas.js e2e tests-founders-plot
# no matches
```

```bash
git diff --check
# passed
```

## Residual Risk

- This was a bounded smoke/product-sense pass, not a full repository regression run.
- The proof screenshots use the dense e2e fixture shape so the UI can be stressed deterministically. Full Founders Plot e2e and server tests cover the canonical API/gameplay contracts separately.
- I did not patch the low Work Orders copy issue because this lane was report-first and source-edit-avoidant.
- I did not push, merge, deploy, or make source edits.
