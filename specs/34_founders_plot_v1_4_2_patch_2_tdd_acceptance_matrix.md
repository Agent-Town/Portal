# Agent Town: Founders Plot V1.4.2 Patch 2 — TDD Acceptance Matrix

**Companion spec:** `33_founders_plot_v1_4_2_patch_2_mobile_calmness_and_hq_progression.md`  
**Target:** mobile calmness + HQ progression only  
**Date:** 2026-04-22

---

## 0. Test philosophy

Patch 2 must not pass by metadata alone. The two remaining blockers are visual/product blockers, so tests must inspect the real route, real screenshots, real label geometry, and real HQ asset visual differences.

Automated tests are guardrails. Human/product-owner screenshot review remains the final signoff surface.

---

## 1. Acceptance matrix

| ID | Area | Test | Metric | Pass condition | Suggested file |
|---|---|---|---|---|---|
| P2-MOB-001 | Mobile default calmness | Open Founders Plot full route at 390px and count visible persistent world labels | `MobilePersistentWorldLabels` | `<= 3` | `e2e/191_founders_plot_v1_4_2_patch2_mobile_calmness_strict.spec.js` |
| P2-MOB-002 | Mobile word budget | Count visible on-map words excluding top HUD/objective sheet | `MobileOnMapVisibleWords` | `<= 24` | same |
| P2-MOB-003 | Non-objective labels | Ensure non-objective available lots do not show text labels | `MobileNonObjectiveTextLabels` | `0` | same |
| P2-MOB-004 | Clipping | For all visible labels/chips/buttons in the stage, assert no clipped text | `MobileClippedLabelCount` | `0` | same |
| P2-MOB-005 | Primary attention | Count strong-emphasis world objects | `MobilePrimaryAttentionObjects` | `<= 2` | same |
| P2-MOB-006 | Same-weight pills | Count same visual class high-emphasis chips in scene | `MobileSameWeightPillCount` | `<= 2` | same |
| P2-MOB-007 | Clover acting mobile | Trigger Clover acting state at 390px, drawer closed | `MobileCloverTargetReadable` | `true` | `e2e/191...` or `e2e/193...` |
| P2-MOB-008 | Clover feedback stack | Count overlapping feedback items in target region | `MobileFeedbackStackAtTarget` | `<= 2` | same |
| P2-HQ-001 | HQ asset uniqueness | SHA-256 for `hq-lv1.webp`, `hq-lv3.webp`, `hq-lv5.webp` | `HQAssetShaUnique` | `true` | `tests/v1_4_2_patch2_hq_asset_uniqueness.test.js` |
| P2-HQ-002 | HQ visual delta L1/L3 | Browser-canvas image delta | `HQCanvasRmsDeltaL1L3` | `>= 0.08` | `e2e/192_founders_plot_v1_4_2_patch2_hq_visual_delta.spec.js` |
| P2-HQ-003 | HQ visual delta L3/L5 | Browser-canvas image delta | `HQCanvasRmsDeltaL3L5` | `>= 0.08` | same |
| P2-HQ-004 | HQ visual delta L1/L5 | Browser-canvas image delta | `HQCanvasRmsDeltaL1L5` | `>= 0.12` | same |
| P2-HQ-005 | HQ gallery | Screenshot L1/L3/L5 at gameplay scale | `HQGameplayScaleScreenshotExists` | `true` | same |
| P2-HQ-006 | No-label HQ gallery | Screenshot L1/L3/L5 with labels hidden | `HQLabelIndependentScreenshotExists` | `true` | same |
| P2-DOC-001 | Signoff truth | Signoff sheet has no stale blocker TBDs and says Patch 2 status | `VisualSignoffTruthValid` | `true` | `tests/v1_4_2_patch2_signoff_truth.test.js` |
| P2-DOC-002 | Prompt provenance | New/edited HQ assets have prompt/provenance entries | `HQPromptCoverage` | `100%` | `tests/v1_4_2_patch2_asset_prompt_coverage.test.js` |
| P2-REG-001 | AI SLOP copy | Start Gate keeps product-owner-approved copy | `AiSlopCopyPreserved` | `true` | `e2e/193_founders_plot_v1_4_2_patch2_regression_guardrails.spec.js` |
| P2-REG-002 | Debug chrome hidden | Normal Founders Plot route has no Agent Comms/Worker Tools chrome | `DebugChromeAbsentNormalRoute` | `true` | same |
| P2-REG-003 | Hero-cast quarantine | Hero-cast assets not loaded/rendered in default Founders Plot gameplay route | `HeroCastGameplayLeakage` | `0` | same |
| P2-REG-004 | Scene layering | Existing no-duplicate-live-object test still passes | `SceneLayeringContractValid` | `true` | existing / updated test |
| P2-REG-005 | No gameplay scope creep | Diff scanner finds no new resources/contracts/persistent runtime systems | `GameplayScopeCreepDetected` | `false` | `tests/v1_4_2_patch2_scope_guard.test.js` |

---

## 2. Implementation notes for measurable tests

### 2.1 Counting visible labels

A label is visible if:

- it is not `display:none`, `visibility:hidden`, or `opacity:0`;
- it has a non-empty bounding box;
- it intersects the viewport;
- it contains readable text.

Recommended label selector list should include:

```text
[data-world-label]
[data-scene-chip]
[data-object-label]
[data-lot-label]
[data-status-badge]
[data-object-state-badge]
.scene-chip
.world-label
.object-label
.lot-label
```

The team may adapt selectors to actual code but must keep the test broad enough to catch visible text regardless of class naming.

### 2.2 Detecting clipped labels

For every visible label element:

```js
const clipped = element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
```

Also fail if bounding box is partly outside the viewport by more than 2px.

### 2.3 Detecting non-objective labels

Every visible world-label element should carry machine-readable role metadata:

```html
<div data-world-label data-label-role="objective|selected|clover|critical|ambient|locked|available"></div>
```

At 390px default route, only these roles may be visible:

```text
objective
selected
clover
critical
```

`ambient`, `locked`, and non-objective `available` labels must be hidden or iconified.

### 2.4 HQ visual delta helper

Use Playwright/browser canvas so WebP decoding works without adding heavy Node image packages.

Pseudo-code:

```js
async function imageRmsDelta(page, assetA, assetB) {
  return page.evaluate(async ({ assetA, assetB }) => {
    const size = 256;
    async function load(src) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      return ctx.getImageData(0, 0, size, size).data;
    }
    const a = await load(assetA);
    const b = await load(assetB);
    let sum = 0;
    let n = 0;
    for (let i = 0; i < a.length; i += 4) {
      // Ignore fully transparent pixels if alpha exists.
      const alphaWeight = Math.max(a[i + 3], b[i + 3]) / 255;
      if (alphaWeight < 0.05) continue;
      for (let c = 0; c < 3; c++) {
        const d = (a[i + c] - b[i + c]) / 255;
        sum += d * d * alphaWeight;
        n += alphaWeight;
      }
    }
    return Math.sqrt(sum / Math.max(n, 1));
  }, { assetA, assetB });
}
```

The test should also compute SHA-256 or equivalent file hash uniqueness in Node.

---

## 3. Required screenshots

The following screenshots must be committed or linked in the implementation report:

| Screenshot | Viewport | Purpose |
|---|---:|---|
| `founders-v1-4-2-patch2-mobile-default-390.png` | 390px | prove mobile default calmness |
| `founders-v1-4-2-patch2-mobile-clover-acting-390.png` | 390px | prove Clover acting remains readable without clutter |
| `founders-v1-4-2-patch2-hq-progression-1280.png` | 1280px | prove HQ L1/L3/L5 progression at gameplay scale |
| `founders-v1-4-2-patch2-hq-progression-no-labels-1280.png` | 1280px | prove progression is not label-dependent |
| `founders-v1-4-2-patch2-desktop-regression-1280.png` | 1280px | prove desktop cleanup did not regress |

---

## 4. Release gate

Patch 2 can be accepted only when:

```yaml
mobile_default_calmness: pass
mobile_clover_acting_calmness: pass
hq_asset_uniqueness: pass
hq_visual_delta: pass
hq_gameplay_scale_gallery: pass
signoff_truth: pass
regression_guardrails: pass
scope_creep: pass
product_owner_visual_review: pass
```

---

## 5. Manual review checklist

Show Robin/product owner these screenshots only:

1. mobile default 390px;
2. mobile Clover acting 390px;
3. desktop default 1280px;
4. HQ progression no-label gallery.

Ask four questions:

1. Does mobile feel calm enough to play, not like a compressed annotated map?
2. Is the next action obvious within five seconds?
3. Are HQ L1/L3/L5 obviously different without reading labels?
4. Did we preserve the accepted V1.4.2 art style?

Signoff requires `yes` to all four.
