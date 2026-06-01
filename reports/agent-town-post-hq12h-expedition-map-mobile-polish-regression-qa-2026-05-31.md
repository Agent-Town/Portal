# AgentTown Post-HQ12H Expedition Map Mobile Polish Regression QA

Date: 2026-05-31
Status: `PASS`
Owner: AgentTown parent verification

## Scope

This pass verifies the HQ12H Expedition Map mobile polish after the handoff was completed and parent-verified. It covers the Founders Plot Expedition Map, Scout Sector affordance, read-only Event Packet presentation, read-only Expedition Party presentation, and bounded Three.js Expedition Map renderer.

This pass is report/proof-only. It does not add source changes.

## Result

No regressions found.

The HQ12H mobile proof remains valid: the 390px mobile viewport keeps document/body width at 390, reports no clipped surfaces, keeps metrics/packet/party fact grids compact, and exposes zero Event Packet, Expedition Party, or Scout buttons in the captured proof state.

The focused Founders Plot Expedition Map UI test still passes, the bounded Three.js map renderer smoke still passes, and the Founders Plot server unit/contract/HTTP tests still pass `83/83`.

## Proof Artifacts

- `reports/agent-town-post-hq12h-expedition-map-mobile-polish-regression-qa-proof-2026-05-31.json`
- `reports/agent-town-hq12h-expedition-map-mobile-polish-proof-2026-05-31.json`
- `reports/agent-town-hq12h-expedition-map-mobile-polish-desktop-2026-05-31.png`
- `reports/agent-town-hq12h-expedition-map-mobile-polish-mobile-2026-05-31.png`

Screenshot dimensions:

- Desktop proof: `465x4440 sRGB srgb`
- Mobile proof: `366x3055 sRGB srgb`

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check e2e/200_founders_plot.spec.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `NODE_ENV=test node --test tests-founders-plot/fp-unit.test.js tests-founders-plot/fp-contract.test.js tests-founders-plot/fp-http.test.js` (`83/83`)
- `PW_PORT=4262 npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022"` (`1/1`)
- `PW_PORT=4263 npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --project=chromium` (`1/1`)
- `git diff --check`

## Boundary

Boundary held:

- Scout Sector remains the only Expedition Map UI mutation path.
- Event Packet and Expedition Party presentation stay read-only.
- No packet actions or party actions were added.
- No server/store/engine/routes/tools/spec changes were made.
- No Atlas execution, public sharing, Generated Universe rendering, autonomous movement, route/trade/economy hooks, combat, scheduler behavior, hidden autonomy, cross-plot mutation, or Wild West genre drift was introduced.

## Notes

This closes the missing post-HQ12H QA artifact directly from parent verification. The next bounded lane can be event-packet visual polish, Expedition Map semantic-zoom polish, or a similarly narrow HQ12 follow-up with report/proof coverage.
