# Agent Town HQ13K Candidate 02 GPT Image 2 Review Assets

Date: 2026-06-01
Lane: HQ13K candidate-02 GPT Image 2 review asset batch
Verdict: COMPLETE_REVIEW_BUNDLE_WITH_NOTES

## Scope

This lane generated the first real GPT Image 2 candidate-02 visual asset batch for AgentTown Expedition Map visual-pack review.

The assets are review-only and live under `reports/media`. They are not runtime assets, not a promoted visual pack, and not wired into any renderer or loader.

No app source, server/store/routes/tools, Atlas execution path, public sharing path, Generated Universe rendering path, runtime pack directory, runtime pack loader, gameplay authority, or Expedition Map mutation path was changed.

## Assets

Review bundle directory:

`reports/media/agent-town-hq13k-candidate-02-gpt-image-2-review-assets-2026-06-01/`

Contact sheet:

`reports/agent-town-hq13k-candidate-02-gpt-image-2-review-assets-contact-sheet-2026-06-01.png`

Generated source and processed review-alpha files:

| Slot | Source file | Review-alpha file |
| --- | --- | --- |
| `expedition_map.fog.hinted` | `hinted-fog-veil-v1.gpt-image-2-source.png` | `hinted-fog-veil-v1.review-alpha.png` |
| `expedition_map.fog.locked_unknown` | `locked-unknown-fog-v1.gpt-image-2-source.png` | `locked-unknown-fog-v1.review-alpha.png` |
| `expedition_map.fog.frontier_border` | `frontier-dotted-boundary-v1.gpt-image-2-source.png` | `frontier-dotted-boundary-v1.review-alpha.png` |
| `expedition_map.marker.known_site_plan` | `marker-known-site-plan-v1.gpt-image-2-source.png` | `marker-known-site-plan-v1.review-alpha.png` |
| `expedition_map.marker.hinted_unknown` | `marker-hinted-unknown-v1.gpt-image-2-source.png` | `marker-hinted-unknown-v1.review-alpha.png` |
| `expedition_map.marker.owned_outpost` | `marker-owned-outpost-v1.gpt-image-2-source.png` | `marker-owned-outpost-v1.review-alpha.png` |
| `expedition_map.stroke.scout_receipt_trace` | `survey-receipt-stroke-v1.gpt-image-2-source.png` | `survey-receipt-stroke-v1.review-alpha.png` |
| `hud.frame.selected_sector_card` | `hud-selected-sector-frame-v1.gpt-image-2-source.png` | `hud-selected-sector-frame-v1.review-alpha.png` |

## Observations

- All 8 planned HQ13E/HQ13L slots are represented.
- Each slot has a GPT Image 2 source PNG and a processed RGBA review-alpha PNG.
- The HQ13M dependency-free QA harness sees 16 PNGs, 8/8 present slots, 8 source files, 8 processed alpha files, 0 missing slots, and 0 unmatched PNG files.
- The contact sheet gives a quick visual review surface for the alpha assets.
- The first chroma-key helper attempt failed because Pillow is not installed in the active environment. The parent used ImageMagick alpha conversion instead.
- A labeled ImageMagick montage failed due missing font configuration, so the contact sheet was rebuilt as unlabeled image tiles.

## Review Notes

This batch is useful and materially closer to candidate-02 art direction, but it is not promotion-ready.

- The generated source/review PNGs are larger than HQ13L final slot dimensions. A later reports-only or asset-only review lane should crop/resize/derive final slot-sized candidates.
- The fog overlays and dotted/stroke assets still show visible green-edge cleanup risk in the contact sheet. They need edge cleanup or regeneration before any runtime-pack promotion.
- The marker pins and HUD frame are stronger review candidates, but still need small-size/mobile visual review against the HQ13L rubric.
- The selected-sector frame is empty and readable, but any future pack version must keep runtime text app-rendered and server-read-model sourced.

## Verification

Passed:

- HQ13M harness full-bundle run: 8/8 expected slots present, 16 PNGs found, 8 processed alpha files, 8 source files, no unmatched files.
- `file` on all 16 bundle PNGs and contact sheet.
- `magick identify` on contact sheet.
- SHA-256 capture for all source/review-alpha files and contact sheet.
- `jq empty` on HQ13K proof JSON.
- Focused `git diff --check` on HQ13K report/proof/contact/media, plus HQ13L/HQ13M report/proof files.

Warnings:

- HQ13M harness correctly reports dimension warnings because the review/source images are larger than final slot dimensions.
- Visual review notes remain open for green-edge cleanup and small-size readability.

## Guardrails

- Review assets only under `reports/` and `reports/media`.
- No runtime asset promotion.
- No runtime visual-pack directory.
- No runtime loader.
- No app source edits.
- No server/store/routes/tools edits.
- No schema/validator changes in this lane.
- No Atlas execution.
- No public sharing.
- No real Generated Universe rendering.
- No hidden autonomy, route/trade/economy/resource/reward/combat/scheduler behavior, cross-plot mutation, or external effects.
- Scout Sector remains the only current Expedition Map mutation path.
