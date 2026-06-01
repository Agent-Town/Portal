# Agent Town HQ13N Candidate 02 Slot-Sized Review Derivatives

Date: 2026-06-01
Lane: HQ13N candidate-02 slot-sized review derivative prep
Verdict: PASS_SLOT_SIZED_REVIEW_DERIVATIVES_CREATED

## Scope

This lane created exact-dimension PNG derivatives from the HQ13K `*.review-alpha.png` files for review against the HQ13L final slot sizes.

These files are derived review candidates only. They are not accepted runtime assets, not a promoted visual pack, and not wired into any runtime loader or renderer.

No HQ13K files were edited, moved, deleted, or overwritten. No app source, server, store, routes, tools, schema, validator, runtime pack directory, runtime loader, Atlas execution path, public sharing path, Generated Universe rendering path, gameplay authority, or Expedition Map mutation path was changed.

## Artifacts

- Derivative directory: `reports/media/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-2026-06-01/`
- Contact sheet: `reports/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-contact-sheet-2026-06-01.png`
- Proof JSON: `reports/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-proof-2026-06-01.json`
- Source review bundle: `reports/media/agent-town-hq13k-candidate-02-gpt-image-2-review-assets-2026-06-01/`

## Derivatives

| Slot | Source review-alpha | Derived review candidate | Target/output size |
| --- | --- | --- | --- |
| `expedition_map.fog.hinted` | `hinted-fog-veil-v1.review-alpha.png` | `hinted-fog-veil-v1.slot-review.png` | 512x512 |
| `expedition_map.fog.locked_unknown` | `locked-unknown-fog-v1.review-alpha.png` | `locked-unknown-fog-v1.slot-review.png` | 512x512 |
| `expedition_map.fog.frontier_border` | `frontier-dotted-boundary-v1.review-alpha.png` | `frontier-dotted-boundary-v1.slot-review.png` | 1024x128 |
| `expedition_map.marker.known_site_plan` | `marker-known-site-plan-v1.review-alpha.png` | `marker-known-site-plan-v1.slot-review.png` | 128x192 |
| `expedition_map.marker.hinted_unknown` | `marker-hinted-unknown-v1.review-alpha.png` | `marker-hinted-unknown-v1.slot-review.png` | 128x192 |
| `expedition_map.marker.owned_outpost` | `marker-owned-outpost-v1.review-alpha.png` | `marker-owned-outpost-v1.slot-review.png` | 128x192 |
| `expedition_map.stroke.scout_receipt_trace` | `survey-receipt-stroke-v1.review-alpha.png` | `survey-receipt-stroke-v1.slot-review.png` | 1024x128 |
| `hud.frame.selected_sector_card` | `hud-selected-sector-frame-v1.review-alpha.png` | `hud-selected-sector-frame-v1.slot-review.png` | 640x360 |

## Processing Notes

- All derivatives were made with ImageMagick from HQ13K review-alpha PNGs, preserving RGBA alpha.
- Derivatives use Lanczos resize, center gravity, and exact transparent extents/crops to hit the HQ13L slot boxes.
- The marker sources already matched the 128x192 aspect ratio and resized directly.
- The fog sources already matched square slot aspect and resized directly.
- The frontier boundary, survey receipt stroke, and selected-sector frame sources did not match final slot aspect. They were center-fitted/cropped to the target boxes, so crop/readability should receive human review before any later acceptance.
- The contact sheet has no labels. ImageMagick `montage` attempted to use unavailable font support, so the sheet was composed by appending unlabeled image tiles directly.

## Review Risks

Observable from the source/contact sheet and processing only:

- HQ13K review-alpha assets still show green-edge or matte cleanup risk around some alpha edges. HQ13N did not perform edge repair.
- The 1024x128 strip assets and 640x360 HUD frame involve aspect conversion from larger HQ13K review-alpha sources, so centered crop choices may need adjustment after human visual review.
- This lane did not perform aesthetic acceptance, hidden-truth review, gameplay-implication review, text/logo review, or mobile readability judgment beyond dimension and alpha-preserving processing checks.

## HQ13M Harness

The HQ13M harness can match the HQ13N `*.slot-review.png` filenames through its slot inference rules.

Harness summary for the derivative directory:

- Expected slots: 8
- PNG files found: 8
- Present slots: 8
- Missing slots: 0
- Unmatched PNG files: 0
- Warning count: 0
- Status: `pass`
- Verdict: `PASS_ALL_EXPECTED_REVIEW_ASSETS_PRESENT`

The harness reports `processedAlphaFilesFound: 0` and `sourceFilesFound: 0` because these files are named as `*.slot-review.png` derivatives rather than HQ13K `*.review-alpha.png` or `*.gpt-image-2-source.png` originals.

## Verification

Passed:

- `node reports/agent-town-hq13m-generated-asset-qa-harness-2026-06-01.mjs --pretty reports/media/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-2026-06-01 | jq '.summary'`
- `file reports/media/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-2026-06-01/*.slot-review.png reports/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-contact-sheet-2026-06-01.png`
- `magick identify -format '%f|%wx%h|%[channels]\n' reports/media/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-2026-06-01/*.slot-review.png reports/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-contact-sheet-2026-06-01.png`
- `shasum -a 256 reports/media/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-2026-06-01/*.slot-review.png reports/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-contact-sheet-2026-06-01.png`
- `jq empty reports/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-proof-2026-06-01.json`
- `git diff --check -- reports/media/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-2026-06-01 reports/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-contact-sheet-2026-06-01.png reports/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-2026-06-01.md reports/agent-town-hq13n-candidate-02-slot-sized-review-derivatives-proof-2026-06-01.json`

## Guardrails

- No runtime asset promotion.
- No runtime pack directory or loader.
- No HQ13K image edits, moves, deletes, or overwrites.
- No app/source/server/store/routes/tools/schema/validator edits.
- No Atlas execution.
- No public sharing.
- No real Generated Universe rendering.
- No hidden autonomy.
- No route, trade, economy, resource, reward, combat, scheduler, cross-plot, or external effects.
- Scout Sector remains the only current Expedition Map mutation path.
