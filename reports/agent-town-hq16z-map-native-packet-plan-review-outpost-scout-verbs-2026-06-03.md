# AgentTown HQ16Z - Map-Native Packet Plan / Review / Outpost Scout Verbs

Date: 2026-06-03

Verdict: `PASS`

## Summary

HQ16Z turns the proven Expedition Map loop's packet and outpost continuation surfaces into short map verbs without adding authority.

- Packet-derived Site Plan preflight now presents as `Plan`, not `Survey`.
- Packet-derived Site Plan review now presents as `Review`, not `Ready`.
- The bridge exposes `data-map-native-verb` while keeping `data-action-name` bound to the existing guarded endpoint.
- Selected outpost status now shows a compact visual-only `Next Scout` cue for the server-exposed hinted frontier target.
- The Three.js outpost next-frontier beacon now carries `commandId: scout_sector` and `cueLabel: Next Scout` proof metadata while remaining visual-only/read-only.

## Authority Boundary

No new gameplay mutation path was added. The browser proof used only:

- `et.plot.scout_sector`
- `et.plot.draft_site_plan_from_packet`
- `et.plot.review_site_plan`
- `et.plot.prepare_settler_convoy`
- `et.plot.found_settlement`
- existing test-only time advance for convoy arrival after Prepare Convoy

No route, trade, economy, resource, reward, combat, scheduler, hidden-truth, Atlas execution, Generated Universe runtime expansion, public share, deploy, merge, push, or external message behavior was added.

## Artifacts

- Proof JSON: `reports/agent-town-hq16z-map-native-packet-plan-review-outpost-scout-verbs-proof-2026-06-03.json`
- Contact sheet: `reports/agent-town-hq16z-map-native-packet-plan-review-outpost-scout-verbs-contact-sheet-2026-06-03.png`
- Desktop screenshot: `reports/agent-town-hq16z-map-native-packet-plan-review-outpost-scout-verbs-desktop-2026-06-03.png`
- Mobile screenshot: `reports/agent-town-hq16z-map-native-packet-plan-review-outpost-scout-verbs-mobile-2026-06-03.png`

## Files Touched

- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`
- `public/experiences/founders-plot/three_scene_entry.js`
- `public/experiences/founders-plot/three_scene_bundle.js`
- `e2e/202_founders_plot_hq16h_scout_to_survey_bridge.spec.js`
- `e2e/203_founders_plot_hq16l_review_to_convoy_map_bridge.spec.js`
- `e2e/205_founders_plot_hq16q_outpost_status_map_surface.spec.js`
- `e2e/208_founders_plot_hq16z_map_native_packet_plan_review_outpost_scout_verbs.spec.js`

The focused regression run also regenerated older HQ16 proof screenshots/JSON for HQ16H/HQ16L/HQ16Q/HQ16R/HQ16T. Those are verification side effects from the existing specs, not new gameplay behavior.

## Verification

Passed:

- `node --check public/experiences/founders-plot/founders-plot.js`
- `node --check public/experiences/founders-plot/three_scene_entry.js`
- `node --check e2e/208_founders_plot_hq16z_map_native_packet_plan_review_outpost_scout_verbs.spec.js`
- `node --check e2e/202_founders_plot_hq16h_scout_to_survey_bridge.spec.js`
- `node --check e2e/203_founders_plot_hq16l_review_to_convoy_map_bridge.spec.js`
- `node --check e2e/205_founders_plot_hq16q_outpost_status_map_surface.spec.js`
- `npm run build:founders-plot-threejs`
- `PW_PORT=4992 npx playwright test e2e/208_founders_plot_hq16z_map_native_packet_plan_review_outpost_scout_verbs.spec.js --project=chromium --reporter=line` - 1/1 passed
- `PW_PORT=4993 npx playwright test e2e/202_founders_plot_hq16h_scout_to_survey_bridge.spec.js e2e/203_founders_plot_hq16l_review_to_convoy_map_bridge.spec.js e2e/205_founders_plot_hq16q_outpost_status_map_surface.spec.js --project=chromium --reporter=line` - 3/3 passed
- `jq` proof validation
- `file` screenshot/contact-sheet validation
- `git diff --check`

Proof highlights:

- `packetPlanMapNativeVerb: true`
- `packetPlanPrimaryCopyNotSurvey: true`
- `packetReviewMapNativeVerb: true`
- `packetReviewPrimaryCopyNotPaperworkHeavy: true`
- `outpostScoutCueShort: true`
- `outpostCueVisualOnly: true`
- `outpostBeaconVisualOnly: true`
- `commandTargetRingsPreviewOnly: true`
- `existingGuardedEndpointsOnly: true`
- `mobileHorizontalOverflow: 0`
