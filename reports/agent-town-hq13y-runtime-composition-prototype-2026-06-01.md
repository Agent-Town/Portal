# AgentTown HQ13Y Runtime Composition Prototype

Date: 2026-06-01

Verdict: PASS

## Summary

HQ13Y ports the HQ13W/HQ13V AgentTown frontier-tech civic map direction into the existing runtime Expedition Map renderer as a procedural prototype:

- New runtime shell: `hq13y_agenttown_runtime_composition_prototype_v1`.
- Adds parchment/ledger map-paper treatment, scout-ledger tick marks, plan-wagon cues, civic beacon cues, warmer hidden-frontier mist, and receipt-trace styling.
- Updates the Expedition Map shell CSS so the runtime surface reads closer to a scout board instead of a plain data panel.
- Keeps the renderer read-only over existing server-owned `expeditionMap.cells`.

No report-media PNGs were promoted, no runtime visual-pack loader or pack directory was created, and no generated-image asset was wired into production.

## Scope

Changed:

- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `public/experiences/founders-plot/founders-plot.css`
- `e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`

Created:

- `reports/agent-town-hq13y-runtime-composition-prototype-proof-2026-06-01.json`
- `reports/agent-town-hq13y-runtime-composition-prototype-desktop-2026-06-01.png`
- `reports/agent-town-hq13y-runtime-composition-prototype-mobile-2026-06-01.png`

## Proof Highlights

Proof JSON records:

- `ok: true`
- `visualShell: hq13y_agenttown_runtime_composition_prototype_v1`
- `agentTownIdentityCues: true`
- `scoutLedgerHud: true`
- `beaconPlanWagonCues: true`
- `frontierBoundaryVisualOnly: true`
- `receiptTraceVisualOnly: true`
- `clientAuthority: false`
- `readOnly: true`
- `executableActions: []`
- `routeCreation: false`
- `atlasExecution: false`
- `scoutSectorOnlyMutationPath: true`

Screenshots:

- `reports/agent-town-hq13y-runtime-composition-prototype-desktop-2026-06-01.png`
- `reports/agent-town-hq13y-runtime-composition-prototype-mobile-2026-06-01.png`

## Verification

Passed:

- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js`
- `npm run build:founders-plot-threejs`
- `node --check public/experiences/founders-plot/three_scene_bundle.js`
- `npx playwright test e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js --reporter=line`
- `npx playwright test e2e/200_founders_plot.spec.js --project=chromium --grep "FP-E2E-022" --reporter=line`
- `jq` guardrail predicate on the HQ13Y proof JSON
- `file` check on desktop/mobile screenshots
- focused `git diff --check`

## Guardrails

Held:

- Scout Sector remains the only current Expedition Map mutation path.
- Hidden cells still suppress resource truth and receipt links.
- Event Packet, Expedition Party, and current-focus surfaces remain read-only/buttonless.
- No server, store, route, tool, schema, gameplay authority, Atlas execution, public sharing, Generated Universe rendering, route/trade/economy/resource/reward/combat/scheduler, hidden-autonomy, cross-plot mutation, or external-effect changes.
- No Wild West/cowboy/saloon/gold-rush drift.

## Residual

This is a procedural runtime composition prototype, not final asset-pack promotion. The next safe step is post-HQ13Y runtime visual QA against HQ13W/HQ13X style gates, with screenshots and guardrail proof, before any runtime-pack or asset-promotion decision.
