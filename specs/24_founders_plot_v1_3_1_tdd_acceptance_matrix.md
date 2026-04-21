# Agent Town: Founders Plot V1.3.1 — TDD Acceptance Matrix

_Status: companion test matrix for V1.3.1 visual-surface signoff_  
_Date: 2026-04-21_

This document extracts the measurable test obligations from `23_founders_plot_v1_3_1_visual_signoff_pass.md`.

## 1. Test philosophy

The goal is not to prove that the UI is merely functional. The goal is to prove that the **full player route** reads as a launch-grade game surface and not a developer console.

All tests must be deterministic. Use fixture state, fake timers, and deterministic asset manifests where needed.

---

## 2. Acceptance matrix

| Test ID | File | Scenario | Must assert |
|---|---|---|---|
| T1 | `e2e/162_founders_plot_full_route_player_surface.spec.js` | Normal full app route | No visible `Agent Comms`, `Worker Tools`, `Skill Context`, `Worker Traffic`, `Brain`, `Session Context`, `Trainer` |
| T2 | same | Debug route | Debug panels visible only after explicit `?debug=1` or dev flag |
| T3 | same | Full route screenshots | 1280 and 390 baselines captured; no large debug panel |
| T4 | `e2e/163_founders_plot_art_signoff_manifest.spec.js` | Asset manifest | All `usage: primary-view` assets have approval metadata |
| T5 | same | Signoff mode | No `primary-view` asset has `approvalStatus` other than `approved` |
| T6 | same | Hero frame | Canonical hero frame metadata exists and references real screenshot |
| T7 | `e2e/164_founders_plot_clover_target_link.spec.js` | Clover acting | `data-testid="clover-foreman"` has `data-state="acting"` and target id |
| T8 | same | Clover acting | `data-testid="clover-target-link"` exists and references same target id |
| T9 | same | Accessibility | Accessible text includes action verb and target label |
| T10 | same | Reduced motion | Reduced-motion mode still shows target relationship without relying on animation |
| T11 | `e2e/165_founders_plot_mobile_label_density.spec.js` | 390px default | Visible stage labels <= 3 |
| T12 | same | 390px default | Visible words <= 80; target <= 65 tracked in metrics |
| T13 | same | 390px default | Label overlap count = 0 by bounding-box check |
| T14 | same | Object selection | Selected object label/sheet appears after tap |
| T15 | `e2e/166_founders_plot_goal_relevant_lot_emphasis.spec.js` | Multiple buildable lots | Exactly one `data-attention="recommended"` |
| T16 | same | Multiple buildable lots | Other legal lots are `available` or muted |
| T17 | same | Objective alignment | Objective ribbon, primary CTA, and Clover suggestion agree |
| T18 | `e2e/167_founders_plot_badge_stack_governor.spec.js` | Desktop object badges | Max 2 badges per unselected object |
| T19 | same | Mobile object badges | Max 1 badge per unselected object |
| T20 | `e2e/168_founders_plot_scope_quarantine.spec.js` or script | OpenRouter/proxy files changed | Quarantine doc exists or changes absent |
| T21 | same | Quarantine doc | Owner, reviewer, tests, rollback plan present |
| T22 | `e2e/169_founders_plot_design_docs_v13_1.spec.js` | Docs | V1.3.1 addenda present in DESIGN/GAME_UX/REGISTRY/BRAND/AGENTS |
| T23 | existing V1.2/V1.3 tests | Regression | No failures |

---

## 3. Metrics contract

The implementation should expose or compute these metrics during tests:

```ts
type VisualSignoffMetricsV131 = {
  normalSurfaceDebugJargonCount: number;
  normalSurfaceDebugPanelVisible: boolean;
  primaryViewAssetApprovalCoverage: number;
  primaryViewAssetDraftCount: number;
  heroFrameApproved: boolean;
  cloverActingTargetLinkCoverage: number;
  cloverActingAccessibleTargetCoverage: number;
  mobileDefaultVisibleWords: number;
  mobileVisibleStageLabels: number;
  mobileLabelOverlapCount: number;
  recommendedObjectCount: number;
  attentionCtaAlignment: number;
  objectBadgeMaxDesktop: number;
  objectBadgeMaxMobile: number;
  unquarantinedOpenRouterScope: number;
};
```

Required thresholds:

```text
normalSurfaceDebugJargonCount = 0
normalSurfaceDebugPanelVisible = false
primaryViewAssetApprovalCoverage = 1.0
primaryViewAssetDraftCount = 0
heroFrameApproved = true
cloverActingTargetLinkCoverage = 1.0
cloverActingAccessibleTargetCoverage = 1.0
mobileDefaultVisibleWords <= 80
mobileVisibleStageLabels <= 3
mobileLabelOverlapCount = 0
recommendedObjectCount = 1
attentionCtaAlignment = 1.0
objectBadgeMaxDesktop <= 2
objectBadgeMaxMobile <= 1 unless selected
unquarantinedOpenRouterScope = 0
```

---

## 4. Required screenshots

Capture at minimum:

```text
founders-v1-3-1-full-route-hero-1280.png
founders-v1-3-1-full-route-mobile-390.png
founders-v1-3-1-clover-acting-target-1280.png
founders-v1-3-1-mobile-selected-object-390.png
founders-v1-3-1-objective-lot-emphasis-1280.png
founders-v1-3-1-debug-enabled-1280.png  # only if debug UI changed
```

The first two screenshots are the release-critical ones.

---

## 5. CI recommendation

Run order:

```bash
node --check public/experiences/founders-plot/app.js
node --check public/experiences/founders-plot/scene_state.js
node --check public/experiences/founders-plot/scene_render.js
node --check public/experiences/founders-plot/effects.js
node --check public/experiences/founders-plot/visual_metrics.js
node scripts/validate_founders_plot_assets.mjs
npx playwright test e2e/162_founders_plot_full_route_player_surface.spec.js
npx playwright test e2e/163_founders_plot_art_signoff_manifest.spec.js
npx playwright test e2e/164_founders_plot_clover_target_link.spec.js
npx playwright test e2e/165_founders_plot_mobile_label_density.spec.js
npx playwright test e2e/166_founders_plot_goal_relevant_lot_emphasis.spec.js
npx playwright test e2e/167_founders_plot_badge_stack_governor.spec.js
npx playwright test e2e/168_founders_plot_scope_quarantine.spec.js
npx playwright test e2e/169_founders_plot_design_docs_v13_1.spec.js
npm test
```

If a command is unavailable, the implementer must state why and list the CI command that should run it.
