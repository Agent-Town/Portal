# Agent Town Next-Stage HQ10 QA Matrix - 2026-05-31

Agent: Katherine
Worktree: `/Users/robin/Projects/Portal-atlas-editor`
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Scope: dirty shared branch; report/proofs only; no source edits, push, merge, deploy, external messages, cleanup, or public behavior.

## Verdict

Not clean yet, but the playable/gameplay core is in good shape.

Fresh progression, HQ9 Work Orders, server-owned HQ10A/B/C/D contracts, 390px mobile layout, current full-envelope HQ10 panels, local overlay preview, and no-external-effect boundaries passed targeted checks. The main open player-facing blocker is the HQ10B/HQ10C form wipe: the 5s state poll rerenders the panel and clears typed form fields before submit. The current Progression Atlas Playwright spec also fails in the editor/save path and should be treated as a medium regression until reconciled.

## Severity-Ordered Findings

### High - HQ10B/HQ10C forms still lose typed input on the 5s state poll

The existing HQ10 systems report already observed that slow civic/overlay form entry can be wiped by `loadState()` polling. I reproduced this against the current source with a route-backed HQ10-ready fixture: after waiting 5.6s, the civic proposal title and summary inputs were both reset to empty.

Evidence: `reports/agent-town-next-stage-hq10-qa-matrix-form-poll-proof-2026-05-31.json`

Player impact: a normal player can fill the HQ10B/HQ10C form slowly, then click create and silently fail client-side because required fields were cleared before the POST.

### Medium - Current Progression Atlas Playwright spec fails 0/2

`AC-63` now fails after saving an edited strategy because `progression-atlas-step-editor_custom_11` / `Scout Ridge` is not visible. `AC-64` then fails with `ECONNREFUSED` because the web server is gone after the first failure.

This does not prove the Founders Plot gameplay loop is broken, but it is a real current test failure in the Atlas editor/save surface.

### Medium - Existing HQ10 mocked UI specs are stale/failing 0/2

`FP-E2E-014` and `FP-E2E-017` fail when their mocked state omits the now-current HQ10 read-model siblings such as `overlayPacks` / `civicProjects`. In that stale fixture path, the World Grid and Civic Proposal bodies stay empty/loading. A current server-shaped full HQ10 envelope passed the QA proof probe, so this is likely test-fixture drift rather than a live server envelope blocker.

Evidence: Playwright command below failed 0/2. Current full-envelope proof passed 12/12 in `reports/agent-town-next-stage-hq10-qa-matrix-playwright-proof-2026-05-31.json`.

### Low - Three.js texture warnings remain noisy

Existing mobile/visual reports and the current Atlas failure log both show repeated `THREE.WebGLRenderer: Texture marked for update but no image data found.` warnings. Screenshots and canvas checks are nonblank, so this is not a blocker, but it makes real rendering failures harder to spot.

### Low - Late-game panel density remains a product-sense risk

Reports, Site Plans, Claims, Research, Work Orders, World Grid, Civic Proposals, Overlay Packs, and local preview controls all fit at 390px in the proof, but the right column is long and hard to scan.

## Already-Observed Failures Reviewed

- Franklin: mobile overflow/occlusion and dense Expedition Board tile selection were high/medium. Parfit follow-up and this run show those are fixed: mobile width stayed 390px and `FP-E2E-016` passed.
- Curie: completed HQ9 Work Orders could show expired-draft copy. Feynman fixed it; this run confirms completed cards show `Completed receipt. Child receipts are preserved for audit.`
- Turing: HQ10 panels crashed after overlay records existed and forms were wiped by polling. The panel crash was not reproduced with the current full server-shaped envelope after HQ10D, but stale mocks still fail. The form wipe is still reproducible and remains high.
- Turing: local overlay application/preview was flagged as potentially outside HQ10C. HQ10D now explicitly scopes it as browser-local presentation preview; current proof shows it sends no POST.

## QA Matrix

| Area | Current result | Evidence |
| --- | --- | --- |
| Fresh progression | PASS | `FP-E2E-001/008/009` passed; server `FP-IT-004` passed |
| HQ6-HQ8 spine | PASS | `FP-E2E-010/011/012` passed |
| HQ9 Work Orders | PASS | `FP-E2E-013` passed; copy proof in QA JSON passed |
| HQ10A World Grid | PASS with stale-spec risk | Server tests passed; full-envelope UI proof passed; `FP-E2E-014` stale fixture failed |
| HQ10B Civic Proposals | MIXED | Server tests and full-envelope UI proof passed; form poll wipe failed; `FP-E2E-017` stale fixture failed |
| HQ10C Overlay Packs | MIXED | Server tests and full-envelope UI proof passed; form poll risk applies; prior HQ10D report covers current overlay UI spec |
| HQ10D Civic Projects | PASS server/API | `FP-CT-012`, `FP-HT-011g`, `FP-UT-026` passed; no dedicated Founders Plot player panel verified |
| HQ10D local overlay preview | PASS | QA proof: rendered, applied locally, no POST/external action |
| Mobile 390px | PASS | QA proof: `documentScrollWidth: 390`, `bodyScrollWidth: 390`, `clipped: []` |
| Desktop UI | PASS with density note | QA proof: 1280px no overflow; panel stack is long |
| GPT Image 2.0 assets | PASS spot-check | selected icon/prop/sprite assets identify cleanly |
| External/deploy/public behavior | PASS | rg audit found guardrail text only; no deploy/external send behavior observed |

## Proof Files Written

- `reports/agent-town-next-stage-hq10-qa-matrix-playwright-proof-2026-05-31.json`
- `reports/agent-town-next-stage-hq10-qa-matrix-form-poll-proof-2026-05-31.json`
- `reports/agent-town-next-stage-hq10-qa-matrix-desktop-hq10-render-blocker-2026-05-31.png`
- `reports/agent-town-next-stage-hq10-qa-matrix-mobile-390-hq10-render-blocker-2026-05-31.png`
- `reports/agent-town-next-stage-hq10-qa-matrix-overlay-preview-preseed-2026-05-31.png`

## Commands And Results

```bash
node --check public/experiences/founders-plot/founders-plot.js && node --check public/experiences/founders-plot/scene_state.js && node --check public/experiences/founders-plot/three_scene_entry.js && node --check public/progression-atlas.js && node --check e2e/200_founders_plot.spec.js && node --check e2e/114_progression_atlas_openclaw_lite.spec.js
# PASS
```

```bash
NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-scene-state.test.js
# PASS: 83/83
```

```bash
PW_PORT=4252 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-001|FP-E2E-008|FP-E2E-009|FP-E2E-010|FP-E2E-011|FP-E2E-012|FP-E2E-013|FP-E2E-016"
# PASS: 8/8
```

```bash
PW_PORT=4241 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-014|FP-E2E-017"
# FAIL: 0/2
```

```bash
PW_PORT=4249 npx playwright test e2e/114_progression_atlas_openclaw_lite.spec.js --project=chromium
# FAIL: 0/2
```

```bash
node - <<'NODE'
# Inline Playwright QA-matrix probe against PORT=4246, route-backed full HQ10 envelope.
# Wrote reports/agent-town-next-stage-hq10-qa-matrix-playwright-proof-2026-05-31.json and screenshots.
NODE
# PASS: 12/12 checks
```

```bash
node - <<'NODE'
# Inline Playwright form-poll probe against PORT=4251, route-backed HQ10B-ready envelope.
# Wrote reports/agent-town-next-stage-hq10-qa-matrix-form-poll-proof-2026-05-31.json.
NODE
# FAIL: 0/1; titleValue="", summaryValue="" after one poll
```

```bash
jq . reports/agent-town-next-stage-hq10-qa-matrix-playwright-proof-2026-05-31.json >/dev/null
# PASS
```

```bash
identify reports/agent-town-next-stage-hq10-qa-matrix-*.png
# PASS: 1280x7668, 390x8700, 1280x7743
```

```bash
identify public/assets/icons/agent-town/expedition-board-gpt-image-2-v1.png public/assets/icons/agent-town/research-lodge-gpt-image-2-v1.png public/assets/icons/agent-town/cohort-work-order-gpt-image-2-v1.png public/experiences/founders-plot/assets/objects/world-grid-civic-beacon.webp public/experiences/founders-plot/assets/characters/inhabitants/scout/pathfinder-scout-v1.png public/experiences/founders-plot/assets/characters/inhabitants/civic_routekeeper/civic-routekeeper-v1.png
# PASS: 256x256 icons, 1024x1024 beacon, 2048x2048 sprites
```

```bash
rg -n "publicSharing:\s*true|externalEffects:\s*true|deploy|vercel|netlify|fetch\(['\"]https?://|window\.open\(|navigator\.sendBeacon|routeCreation:\s*true|tradeRoute|public share|external effect" public/experiences/founders-plot server/founders_plot e2e/200_founders_plot.spec.js tests-founders-plot || true
# PASS audit: matches were guardrail/prohibition text or false flags, not deploy/external behavior
```

```bash
git diff --check
# PASS
```

## Rerun Checklist

- Rerun `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js tests-founders-plot/fp-scene-state.test.js`.
- Rerun the no-screenshot Founders Plot subset above for fresh progression, HQ6-HQ9, and Expedition Board.
- After fixing form preservation, add/enable an e2e that fills HQ10B and HQ10C forms, waits past one poll, then submits.
- Reconcile `FP-E2E-014` and `FP-E2E-017` fixtures with the current full state envelope.
- Fix or update the Progression Atlas `AC-63/AC-64` expectations for edited-step save visibility.
- Only rerun `FP-E2E-018/019/015` if overwriting their existing non-QA-prefixed screenshot paths is acceptable, or first change them to emit QA-prefixed proofs.
