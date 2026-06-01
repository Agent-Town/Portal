# Agent Town HQ13P Candidate 02 Edge-Cleanup Review Derivatives

Date: 2026-06-01
Lane: HQ13P candidate-02 edge-cleanup review derivatives
Verdict: PASS_REVIEW_PREP_WITH_REPAIR_OR_REGENERATE_NOTES

## Scope

This lane created review-only edge-cleaned PNG derivatives from the HQ13N exact slot-sized `*.slot-review.png` files.

These files are not promoted runtime assets, not an accepted visual pack, and not wired into any loader or renderer. HQ13K and HQ13N files were not edited.

## Artifacts

- Edge-cleaned derivative directory: `reports/media/agent-town-hq13p-candidate-02-edge-cleanup-review-derivatives-2026-06-01/`
- Contact sheet: `reports/agent-town-hq13p-candidate-02-edge-cleanup-review-derivatives-contact-sheet-2026-06-01.png`
- Proof JSON: `reports/agent-town-hq13p-candidate-02-edge-cleanup-review-derivatives-proof-2026-06-01.json`
- Source derivative directory: `reports/media/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-2026-06-01/`

## Cleanup Method

All derivatives were made with local ImageMagick only.

- Preserved exact HQ13L target dimensions.
- Preserved transparent RGBA output for all derivative PNGs.
- Replaced neon-green matte colors with warm neutral/gray review colors.
- Applied green-dominance despill to remaining high-green pixels.
- Applied a small alpha erosion/softening pass to fog, marker, and HUD-frame edges.
- Built the contact sheet without labels by appending image tiles directly after `montage` hit unavailable font support.

The green-count metric below is a rough ImageMagick heuristic for strongly green-dominant visible pixels, not an aesthetic acceptance test.

## Per-Slot Verdicts

| Slot | Output | Size | Green metric before -> after | Cleanup verdict | Notes |
| --- | --- | --- | --- | --- | --- |
| `expedition_map.fog.hinted` | `hinted-fog-veil-v1.edge-cleanup-review.png` | 512x512 | 67620 -> 0 | `CLEANUP_REVIEW_CANDIDATE` | Neon edge is materially reduced. The fog is softer/muddier now, so this remains review-prep only. |
| `expedition_map.fog.locked_unknown` | `locked-unknown-fog-v1.edge-cleanup-review.png` | 512x512 | 50085 -> 0 | `CLEANUP_REVIEW_CANDIDATE` | Green fringe was reduced to a neutral rim. Human review should check whether the softened edge is still readable. |
| `expedition_map.fog.frontier_border` | `frontier-dotted-boundary-v1.edge-cleanup-review.png` | 1024x128 | 9359 -> 148 | `REPAIR_OR_REGENERATE` | Neon spill is mostly removed, but the strip remains very faint/thin after cleanup. |
| `expedition_map.marker.known_site_plan` | `marker-known-site-plan-v1.edge-cleanup-review.png` | 128x192 | 419 -> 257 | `CLEANUP_REVIEW_CANDIDATE` | Visible edge risk is lower. Remaining green-dominant pixels appear mostly internal ornament/detail from the marker. |
| `expedition_map.marker.hinted_unknown` | `marker-hinted-unknown-v1.edge-cleanup-review.png` | 128x192 | 39 -> 2 | `CLEANUP_REVIEW_CANDIDATE` | Edge cleanup looks usable for review. Still needs small runtime-scale readability review. |
| `expedition_map.marker.owned_outpost` | `marker-owned-outpost-v1.edge-cleanup-review.png` | 128x192 | 187 -> 86 | `CLEANUP_REVIEW_CANDIDATE` | Edge cleanup looks usable for review. Check small-size read so it does not imply production/reward state. |
| `expedition_map.stroke.scout_receipt_trace` | `survey-receipt-stroke-v1.edge-cleanup-review.png` | 1024x128 | 5210 -> 96 | `REPAIR_OR_REGENERATE` | Neon spill is mostly removed, but the receipt trace is very faint and likely needs a stronger authored treatment. |
| `hud.frame.selected_sector_card` | `hud-selected-sector-frame-v1.edge-cleanup-review.png` | 640x360 | 2797 -> 87 | `CLEANUP_REVIEW_CANDIDATE` | Edge cleanup retained the empty app-text frame; still needs human crop/detail review. |

## HQ13M Harness

The HQ13M harness matched the HQ13P filenames through slot inference rules.

- Expected slots: 8
- PNG files found: 8
- Present slots: 8
- Missing slots: 0
- Unmatched PNG files: 0
- Warning count: 0
- Status: `pass`
- Verdict: `PASS_ALL_EXPECTED_REVIEW_ASSETS_PRESENT`

As with HQ13N, the harness reports `processedAlphaFilesFound: 0` and `sourceFilesFound: 0` because HQ13P intentionally uses derived review filenames rather than HQ13K `*.review-alpha.png` or `*.gpt-image-2-source.png` originals.

## Review Notes

- This cleanup pass is useful for second visual review, not promotion readiness.
- Fog assets are the best cleanup candidates after the despill pass, but they still need human review for softness and color tone.
- Frontier boundary and survey receipt stroke should be repaired or regenerated with a stronger warm non-route treatment.
- Marker and HUD assets are review candidates, but should still be checked at final runtime scale.

## Verification

Passed:

- `file reports/media/agent-town-hq13p-candidate-02-edge-cleanup-review-derivatives-2026-06-01/*.edge-cleanup-review.png reports/agent-town-hq13p-candidate-02-edge-cleanup-review-derivatives-contact-sheet-2026-06-01.png`
- `magick identify -format '%f|%wx%h|%[channels]\n' reports/media/agent-town-hq13p-candidate-02-edge-cleanup-review-derivatives-2026-06-01/*.edge-cleanup-review.png reports/agent-town-hq13p-candidate-02-edge-cleanup-review-derivatives-contact-sheet-2026-06-01.png`
- `node reports/agent-town-hq13m-generated-asset-qa-harness-2026-06-01.mjs --pretty reports/media/agent-town-hq13p-candidate-02-edge-cleanup-review-derivatives-2026-06-01 | jq '.summary'`
- `jq empty reports/agent-town-hq13p-candidate-02-edge-cleanup-review-derivatives-proof-2026-06-01.json`
- `git diff --check -- reports/media/agent-town-hq13p-candidate-02-edge-cleanup-review-derivatives-2026-06-01 reports/agent-town-hq13p-candidate-02-edge-cleanup-review-derivatives-contact-sheet-2026-06-01.png reports/agent-town-hq13p-candidate-02-edge-cleanup-review-derivatives-2026-06-01.md reports/agent-town-hq13p-candidate-02-edge-cleanup-review-derivatives-proof-2026-06-01.json`

## Guardrails

- No runtime asset promotion.
- No runtime pack directory or loader.
- No HQ13K or HQ13N edits.
- No app/source/server/store/routes/tools/schema/validator edits.
- No Atlas execution.
- No public sharing.
- No Generated Universe rendering.
- No hidden autonomy.
- No route, trade, economy, resource, reward, combat, scheduler, cross-plot, or external effects.
- Scout Sector remains the only current Expedition Map mutation path.
