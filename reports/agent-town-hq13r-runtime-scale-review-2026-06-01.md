# Agent Town HQ13R Runtime-Scale Review

Date: 2026-06-01
Lane: HQ13R review-only runtime-scale visual QA
Verdict: PASS_REVIEW_MOCK_WITH_FRONTIER_BOUNDARY_HOLD

## Scope

This lane compares the likely best existing candidate-02 review PNGs at small/runtime-like sizes. It is review-only: no runtime assets, visual-pack directories, loaders, app/source/server/schema edits, Atlas execution, generated images, public sharing, or gameplay authority changes were made.

Inputs were selected as requested:

- HQ13P edge-cleanup derivatives for fog, markers, and HUD.
- HQ13Q repaired review candidates for `frontier_border` and `scout_receipt_trace`.

## Artifacts

- Contact sheet: `reports/agent-town-hq13r-runtime-scale-review-contact-sheet-2026-06-01.png`
- Scratch review directory: `reports/media/agent-town-hq13r-runtime-scale-review-2026-06-01/`
- Proof JSON: `reports/agent-town-hq13r-runtime-scale-review-proof-2026-06-01.json`

The contact sheet is unlabeled because earlier HQ13 lanes already hit unavailable ImageMagick font support. Read it left-to-right, top-to-bottom:

1. hinted fog veil at 128x128 and 96x96
2. locked unknown fog at 128x128 and 96x96
3. repaired frontier boundary at 512x64 and 256x32
4. known site marker at 64x96 and 32x48
5. hinted unknown marker at 64x96 and 32x48
6. owned outpost marker at 64x96 and 32x48
7. repaired survey receipt trace at 512x64 and 256x32
8. selected sector HUD frame at 320x180

## Per-Slot Verdicts

| Slot | Candidate used | Runtime-scale samples | Verdict | Notes |
| --- | --- | --- | --- | --- |
| `expedition_map.fog.hinted` | HQ13P `hinted-fog-veil-v1.edge-cleanup-review.png` | 128x128, 96x96 | `ACCEPT_FOR_REVIEW_MOCK` | Still soft and pale, but the silhouette reads at small scale and no neon edge dominates. |
| `expedition_map.fog.locked_unknown` | HQ13P `locked-unknown-fog-v1.edge-cleanup-review.png` | 128x128, 96x96 | `ACCEPT_FOR_REVIEW_MOCK` | Reads as a cooler obscured-sector fog patch. Edge is visible but acceptable for mock review. |
| `expedition_map.fog.frontier_border` | HQ13Q `frontier-dotted-boundary-v2.repair-review.png` | 512x64, 256x32 | `HOLD_REFERENCE_ONLY` | Readable after repair, but visually too ornate/heavy for a lightweight fog boundary. Keep as direction reference, not mock acceptance. |
| `expedition_map.marker.known_site_plan` | HQ13P `marker-known-site-plan-v1.edge-cleanup-review.png` | 64x96, 32x48 | `ACCEPT_FOR_REVIEW_MOCK` | Strong silhouette and state color survive. Internal detail collapses at 32x48 but remains recognizable. |
| `expedition_map.marker.hinted_unknown` | HQ13P `marker-hinted-unknown-v1.edge-cleanup-review.png` | 64x96, 32x48 | `ACCEPT_FOR_REVIEW_MOCK` | Best marker at small size; it keeps a distinct survey/unknown read without neon edge noise. |
| `expedition_map.marker.owned_outpost` | HQ13P `marker-owned-outpost-v1.edge-cleanup-review.png` | 64x96, 32x48 | `ACCEPT_FOR_REVIEW_MOCK` | Readable and compact. Confirm in a real map mock that it does not imply production/reward state. |
| `expedition_map.stroke.scout_receipt_trace` | HQ13Q `survey-receipt-stroke-v2.repair-review.png` | 512x64, 256x32 | `ACCEPT_FOR_REVIEW_MOCK` | Subtle but visible at both line sizes and remains non-directional. Needs contextual review over the map texture. |
| `hud.frame.selected_sector_card` | HQ13P `hud-selected-sector-frame-v1.edge-cleanup-review.png` | 320x180 | `ACCEPT_FOR_REVIEW_MOCK` | Frame remains crisp at HUD-like size. It is still a review mock frame, not an accepted runtime UI skin. |

## Overall Read

Seven of eight slots are acceptable for a review mock at runtime-like scale. The repaired frontier boundary is the only non-accept: it proves the dotted-line concept can be readable, but its parchment ornament makes it feel like a decorative divider instead of a light map/fog boundary.

Recommended next visual step, still review-only: build a contextual mini-map mock that layers the accepted fog, marker, survey trace, and HUD frame over a candidate-02 terrain crop, while replacing the frontier boundary with a simpler dotted/stitched edge.

## Verification

Passed:

- `file reports/agent-town-hq13r-runtime-scale-review-contact-sheet-2026-06-01.png reports/media/agent-town-hq13r-runtime-scale-review-2026-06-01/*.png`
- `magick identify reports/agent-town-hq13r-runtime-scale-review-contact-sheet-2026-06-01.png reports/media/agent-town-hq13r-runtime-scale-review-2026-06-01/*.png`
- `jq empty reports/agent-town-hq13r-runtime-scale-review-proof-2026-06-01.json`
- `git diff --check -- reports/agent-town-hq13r-runtime-scale-review-contact-sheet-2026-06-01.png reports/agent-town-hq13r-runtime-scale-review-2026-06-01.md reports/agent-town-hq13r-runtime-scale-review-proof-2026-06-01.json reports/media/agent-town-hq13r-runtime-scale-review-2026-06-01`

## Guardrails

- No runtime assets were created or promoted.
- No runtime pack directories or loaders were created.
- No app/source/server/store/routes/tools/schema files were edited.
- No generated images were requested.
- No Atlas execution, public sharing, or Generated Universe rendering happened.
- No route, trade, economy, resource, reward, combat, scheduler, cross-plot, external-effect, or gameplay-authority changes happened.
- Scout Sector remains the only current Expedition Map mutation path.
