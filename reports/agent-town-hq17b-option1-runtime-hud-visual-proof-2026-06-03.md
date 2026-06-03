# Agent Town HQ17B Option 1 Runtime HUD Visual Proof

Date: 2026-06-03
Branch: `neo/progression-atlas-editor-next-2026-05-29`
Verdict: `PASS`

## Scope

This is the missing browser/runtime proof for the HQ17B option 1 HUD implementation. It treats the GPT Image 2 concept 01 as a layout grammar and verifies the current Expedition Map runtime can map the live gameplay loop into compact HUD slots:

- top-left crest/status
- top-left objective/progress loop
- bottom unit dock
- near-unit command puck
- lower/right selected context
- collapsed right-edge ledger/details rail
- outpost context and visual-only Next Scout cue after founding

The test replays the current guarded loop from Scout Sector through packet Plan, Review, Prepare Convoy, Found Outpost, and the next Scout bridge.

## Artifacts

- Proof JSON: `reports/agent-town-hq17b-option1-runtime-hud-proof-2026-06-03.json`
- Desktop screenshot: `reports/agent-town-hq17b-option1-runtime-hud-visual-proof-desktop-2026-06-03.png`
- Mobile screenshot: `reports/agent-town-hq17b-option1-runtime-hud-visual-proof-mobile-2026-06-03.png`
- Contact sheet: `reports/agent-town-hq17b-option1-runtime-hud-visual-proof-contact-sheet-2026-06-03.png`
- Focused e2e harness: `e2e/209_founders_plot_hq17b_option1_runtime_hud_visual_proof.spec.js`

## Verification

- `node --check e2e/209_founders_plot_hq17b_option1_runtime_hud_visual_proof.spec.js`
- `PW_PORT=4988 npx playwright test e2e/209_founders_plot_hq17b_option1_runtime_hud_visual_proof.spec.js --project=chromium --reporter=line`
- `jq -e '.ok == true and .guardrails.mapFirstHudComposition == true and .guardrails.requiredHudSlotsVisible == true and .guardrails.primaryHudNoEndpointNames == true and .guardrails.mobileHorizontalOverflow == true and .guardrails.commandTargetRingsPreviewOnly == true and .guardrails.existingGuardedEndpointsOnly == true and .guardrails.noAtlasExecution == true and .guardrails.noPushMergeDeployPublicShareExternalMessage == true' reports/agent-town-hq17b-option1-runtime-hud-proof-2026-06-03.json`
- `file reports/agent-town-hq17b-option1-runtime-hud-visual-proof-desktop-2026-06-03.png reports/agent-town-hq17b-option1-runtime-hud-visual-proof-mobile-2026-06-03.png reports/agent-town-hq17b-option1-runtime-hud-visual-proof-contact-sheet-2026-06-03.png`
- `git diff --check -- e2e/209_founders_plot_hq17b_option1_runtime_hud_visual_proof.spec.js reports/agent-town-hq17b-option1-runtime-hud-proof-2026-06-03.json`

## Guardrails

- Uses only existing guarded endpoints: `et.plot.scout_sector`, `et.plot.draft_site_plan_from_packet`, `et.plot.review_site_plan`, `et.plot.prepare_settler_convoy`, and `et.plot.found_settlement`.
- Scout Sector remains the only fog/reveal mutation path.
- Command target rings and outpost Next Scout cue remain visual-only/read-only proof surfaces with zero executable renderer actions.
- No server route/tool/schema/store authority change.
- No runtime asset promotion.
- No Atlas execution, Generated Universe runtime expansion, hidden autonomy, hidden-truth leakage, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation, external effect, deploy, merge, push, or public share.

## Notes

The first proof run treated the collapsed right ledger rail as a mobile clipping failure because its hidden drawer contents intentionally exceed the collapsed rail width. The harness was corrected to measure primary HUD clipping and ledger-collapse behavior separately. The rerun passed.

This output is uncommitted local proof. It does not make HQ16Y/HQ16Z/HQ17A/HQ17B commit-ready by itself; the broader dirty worktree still needs an explicit commit-readiness pass if Robin asks.
