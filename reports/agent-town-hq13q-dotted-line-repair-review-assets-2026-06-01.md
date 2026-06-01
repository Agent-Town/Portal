# Agent Town HQ13Q Dotted Line Repair Review Assets

Date: 2026-06-01
Lane: HQ13Q dotted-line repair review assets
Verdict: PASS_REVIEW_REPAIR_WITH_NOTES

## Scope

This lane repairs only the two weak HQ13P dotted-line slots:

- `expedition_map.fog.frontier_border`
- `expedition_map.stroke.scout_receipt_trace`

The outputs are review-only assets under `reports/media`. They are not runtime assets, not a promoted visual pack, and not wired into any renderer or loader.

## Artifacts

- Repair asset directory: `reports/media/agent-town-hq13q-dotted-line-repair-review-assets-2026-06-01/`
- Contact sheet: `reports/agent-town-hq13q-dotted-line-repair-review-assets-contact-sheet-2026-06-01.png`
- Proof JSON: `reports/agent-town-hq13q-dotted-line-repair-review-assets-proof-2026-06-01.json`

## Outputs

| Slot | Source | Processed review PNG | Size | Review verdict | Notes |
| --- | --- | --- | --- | --- | --- |
| `expedition_map.fog.frontier_border` | `frontier-dotted-boundary-v2.gpt-image-2-source.png` | `frontier-dotted-boundary-v2.repair-review.png` | 1024x128 | `REVIEW_CANDIDATE_WITH_STYLE_NOTES` | Stronger and more readable than HQ13P, but ornate and closer to an illustrated border. Good for review, not promotion-ready. |
| `expedition_map.stroke.scout_receipt_trace` | `survey-receipt-stroke-v2.gpt-image-2-source.png` | `survey-receipt-stroke-v2.repair-review.png` | 1024x128 | `REVIEW_CANDIDATE` | Cleaner, brighter, and more readable than HQ13P while still non-directional. Needs runtime-scale review before acceptance. |

## Processing

Both source images were generated as flat `#00ff00` chroma-key PNGs, copied into the report bundle, alpha-cleaned with ImageMagick, trimmed, resized, and centered into the target `1024x128` slot size.

The stronger chroma-key cleanup was necessary because the first frontier repair pass retained a visible green halo.

## Review Notes

- The survey receipt trace is the stronger repair output.
- The frontier boundary is now readable, but its parchment shape may be too heavy for a fog-edge line; keep it as a visual candidate, not an accepted pack asset.
- Both outputs avoid text, arrows, route labels, trade goods, combat, military, Wild West, and public-sharing cues.
- Future acceptance still needs small-size map mock review against the HQ13F runtime map shell.

## Verification

Passed:

- `file reports/media/agent-town-hq13q-dotted-line-repair-review-assets-2026-06-01/*.png`
- `magick identify reports/media/agent-town-hq13q-dotted-line-repair-review-assets-2026-06-01/*.png`
- `node reports/agent-town-hq13m-generated-asset-qa-harness-2026-06-01.mjs --pretty reports/media/agent-town-hq13q-dotted-line-repair-review-assets-2026-06-01`
- `jq empty reports/agent-town-hq13q-dotted-line-repair-review-assets-proof-2026-06-01.json`
- `git diff --check -- reports/media/agent-town-hq13q-dotted-line-repair-review-assets-2026-06-01 reports/agent-town-hq13q-dotted-line-repair-review-assets-contact-sheet-2026-06-01.png reports/agent-town-hq13q-dotted-line-repair-review-assets-2026-06-01.md reports/agent-town-hq13q-dotted-line-repair-review-assets-proof-2026-06-01.json`

The HQ13M harness reports this as a partial review input because HQ13Q intentionally covers only two of the eight candidate-02 slots and keeps source/alpha images in the same report bundle.

## Guardrails

- No runtime asset promotion.
- No runtime pack directory or loader.
- No HQ13K/HQ13N/HQ13P edits.
- No app/source/server/store/routes/tools/schema/validator edits.
- No Atlas execution.
- No public sharing.
- No Generated Universe rendering.
- No hidden autonomy.
- No route, trade, economy, resource, reward, combat, scheduler, cross-plot, or external effects.
- Scout Sector remains the only current Expedition Map mutation path.
