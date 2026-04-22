# Founders Plot V1.4.2 — Visual Signoff Sheet Patch 2

## Status before Patch 2

**Art baseline:** Approved by Robin / product owner.  
**Approval date:** 2026-04-22.  
**Approval scope:** GPT Image 2 V1.4.2 art rebuild as the current Agent Town / Founders Plot art baseline.

## Owner-approved copy

The Start Gate phrase:

> WARNING! CONTAINS AND PRODUCES AI SLOP.

is approved humorous brand copy and must not be removed as a QA cleanup item.

## Acceptance status

Final V1.4.2 route signoff: Ready for Robin review.

Patch 2 resolved:

1. mobile calmness / hierarchy at 390px;
2. HQ Level 1 / 3 / 5 progression readability at gameplay scale.

## Patch 2 signoff checklist

| Item | Required evidence | Status |
|---|---|---|
| Mobile default 390px calmness | `founders-v1-4-2-patch2-mobile-default-390.png` + label metrics in `e2e/191_founders_plot_v1_4_2_patch2_mobile_calmness_strict.spec.js` | Complete |
| Mobile Clover acting 390px | `founders-v1-4-2-patch2-mobile-clover-acting-390.png` + target/stack metrics in `e2e/191_founders_plot_v1_4_2_patch2_mobile_calmness_strict.spec.js` | Complete |
| HQ visual delta | automated RMS delta checks in `e2e/192_founders_plot_v1_4_2_patch2_hq_visual_delta.spec.js` | Complete |
| HQ gameplay-scale gallery | `founders-v1-4-2-patch2-hq-progression-1280.png` | Complete |
| HQ no-label gallery | `founders-v1-4-2-patch2-hq-progression-no-labels-1280.png` | Complete |
| Desktop regression | existing V1.4.2 acceptance-cleanup scenic/mobile regression slice | Complete |
| Design docs updated | Patch 2 spec, TDD matrix, mobile calmness rules, HQ progression art direction, and governance diffs | Complete |
| Tests passed | `node scripts/validate_founders_plot_assets.mjs`; Patch 2 node slice; focused Playwright cleanup slice; full `npm test` | Complete |
| Product-owner final signoff | Robin review | Ready for review |

## Final decision field

```text
Final V1.4.2 acceptance decision: Ready for Robin review
Reviewer: Robin
Date: 2026-04-22
Decision notes: Patch 2 evidence is complete. Remaining approval is Robin's product-owner visual review on the committed screenshots and passing acceptance suite.
```
