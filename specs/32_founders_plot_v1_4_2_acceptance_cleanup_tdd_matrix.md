# Agent Town: Founders Plot V1.4.2 Acceptance Cleanup — TDD Acceptance Matrix

**Spec ID:** `32_founders_plot_v1_4_2_acceptance_cleanup_tdd_matrix`  
**Date:** 2026-04-22  
**Companion spec:** `31_founders_plot_v1_4_2_acceptance_cleanup.md`  
**Purpose:** convert the V1.4.2 acceptance cleanup into measurable tests for agentic AI developers.

---

## 0. Testing principles

1. Tests must verify player-facing behavior, not only implementation metadata.
2. Screenshot tests are required but not sufficient; DOM and manifest tests must explain failures.
3. Metrics are guardrails. Product-owner screenshot review remains the final art/taste signoff.
4. Existing V1.4 AI-reality tests and V1.4.2 asset-manifest tests must keep passing.
5. No tests may require live external model/API calls.

---

## 1. Required test matrix

| ID | Test file | Type | Goal | Measurable assertions |
|---|---|---|---|---|
| T1 | `tests/v1_4_2_visual_signoff_truth.test.js` | Node | Signoff sheet truth | No required `TBD`; reviewer includes `Robin`; date `2026-04-22`; decision includes `approved`; waiver includes `AI SLOP` |
| T2 | `tests/v1_4_2_design_markdown_format.test.js` | Node | Design docs readable/lintable | `DESIGN.md` starts with `---`; has closing `---`; has `## Overview`; key docs have > 20 lines; no one-line compressed design docs |
| T3 | `tests/v1_4_2_scene_layer_metadata.test.js` | Node | Scene layer decision encoded | scene assets declare `layerRole`; background scenes declare `containsLiveStatefulObjects:false`; forbidden live object list exists |
| T4 | `e2e/186_founders_plot_v1_4_2_overlay_hierarchy_cleanup.spec.js` | Playwright | Overlay hierarchy | exactly one primary objective; no debug/provider/runtime jargon; non-objective lots do not pulse/glow strongly |
| T5 | `e2e/187_founders_plot_v1_4_2_mobile_calmness.spec.js` | Playwright | Mobile calmness | 390px screenshot; visible floating labels <= 6; visible `Build here` labels <= 1; clipped labels = 0 |
| T6 | `e2e/188_founders_plot_v1_4_2_clover_grounding_no_drawer.spec.js` | Playwright | Clover acting proof | Clover visible; shadow visible; no drawer open; target link visible; target object highlighted |
| T7 | `e2e/189_founders_plot_v1_4_2_hq_progression_readability.spec.js` | Playwright + image/DOM | HQ upgrade readability | Level 1/3/5 states have distinct asset/overlay identifiers; screenshots captured; accessible labels reflect level |
| T8 | `e2e/190_founders_plot_v1_4_2_scene_layering_no_duplicate_live_objects.spec.js` | Playwright | No duplicate live objects | Background image is scene plate only; live object layer contains P0 objects; no hero-cast/debug leakage |
| T9 | existing V1.4/V1.4.2 tests | Regression | Preserve working systems | all existing Founders Plot visual, asset, AI-reality, mobile, reduced-motion tests pass |

---

## 2. Detailed acceptance specs

## T1 — visual signoff truth

### Setup
Read:

```text
docs/visual/VISUAL_SIGNOFF_SHEET_V1_4_2.md
```

### Required assertions

- file exists;
- file contains `Reviewer / art owner: Robin` or equivalent;
- file contains `Date: 2026-04-22`;
- file contains `Final decision: Approved as current art baseline` or equivalent;
- file contains `AI SLOP` and `product-owner-approved`;
- file contains no required signoff placeholders:
  - `Reviewer / art owner: TBD`
  - `Date: TBD`
  - `Final decision: TBD`
  - `Screenshot status: TBD`

### Failure message

```text
V1.4.2 visual signoff truth is incomplete. Update VISUAL_SIGNOFF_SHEET_V1_4_2.md with product-owner approval and cleanup caveats.
```

---

## T2 — design markdown format

### Setup
Read canonical design docs:

```text
Brand kit/guidelines/agent-town-design-pack/DESIGN.md
Brand kit/guidelines/agent-town-design-pack/GAME_UX.md
Brand kit/guidelines/agent-town-design-pack/REGISTRY.md
AGENTS.md
```

### Required assertions

For `DESIGN.md`:

- starts with YAML front matter fence `---`;
- has a closing YAML fence;
- includes `version`, `name`, `colors`, `typography`, and `components` in front matter;
- includes `## Overview`, `## Colors`, `## Components`, and `## Do's and Don'ts` sections;
- has at least 40 newline-separated lines.

For `GAME_UX.md` and `REGISTRY.md`:

- has at least 20 newline-separated lines;
- includes V1.4.2 cleanup references;
- is not a one-line compressed document.

---

## T3 — scene layer metadata

### Setup
Read:

```text
public/experiences/founders-plot/assets/asset-manifest.json
```

### Required asset manifest additions

Every scene background asset must include metadata similar to:

```json
{
  "id": "founders-plot-desktop-scene-v1-4-2",
  "layerRole": "scene-base",
  "sceneLayering": {
    "mode": "layered_plates",
    "containsLiveStatefulObjects": false,
    "allowedBakedContent": ["terrain", "roads", "far_horizon", "ambient_decor"],
    "forbiddenBakedContent": [
      "hq",
      "lumber_camp",
      "farm_plot",
      "quarry",
      "workshop",
      "market_stall",
      "contract_board",
      "public_square",
      "foreman_hut",
      "clover",
      "timer_rings",
      "objective_markers"
    ]
  }
}
```

### Required assertions

- all scene backgrounds declare `sceneLayering.mode === "layered_plates"`;
- all scene backgrounds declare `containsLiveStatefulObjects === false`;
- forbidden baked content list contains all P0 live object identifiers;
- all P0 live objects exist as separate live-object assets or renderable object definitions.

---

## T4 — overlay hierarchy cleanup

### Setup
Open full route:

```text
/app?district=founders-plot
```

Desktop viewport:

```text
1280x900
```

### Required assertions

- visible primary objective count = 1;
- `.fp-overlay-objective` count <= 1;
- `.fp-overlay-debug` count = 0;
- visible text must not include:
  - `Worker Tools`
  - `Skill Context`
  - `Worker Traffic`
  - `Brain`
  - `Session Context`
  - `runtimeId`
  - `OpenRouter`
  - `provider`
- same-weight floating pill count <= 3; implement by selecting overlay nodes that share `data-overlay-weight="strong"` or a compatible attribute;
- non-objective lots must not have `data-attention="strong"`.

### Screenshot
Capture:

```text
e2e/186_founders_plot_v1_4_2_overlay_hierarchy_cleanup.spec.js-snapshots/founders-v1-4-2-cleanup-overlay-1280-chromium-darwin.png
```

---

## T5 — mobile calmness

### Setup
Open full route:

```text
/app?district=founders-plot
```

Mobile viewport:

```text
390x844
```

### Required assertions

- visible floating label count <= 6;
- visible `Build here` text count <= 1;
- clipped labels = 0;
- bottom action sheet does not fully cover the objective-relevant lot;
- no horizontally overflowing page;
- all visible interactive objects have tap target >= 44px or are wrapped in a >=44px hit area.

### Clipped label check
For each visible world label:

```js
expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
expect(el.scrollHeight).toBeLessThanOrEqual(el.clientHeight + 1);
```

### Screenshot
Capture:

```text
e2e/187_founders_plot_v1_4_2_mobile_calmness.spec.js-snapshots/founders-v1-4-2-cleanup-mobile-390-chromium-darwin.png
```

---

## T6 — Clover grounding and no-drawer action proof

### Setup
Create a state where Clover can perform or is shown performing an action on a visible target object.

The screenshot must be taken with the Foreman drawer closed.

### Required assertions

- Clover scene node exists;
- Clover node has `data-state="acting"`;
- Clover node has `data-target-object-id` set;
- target object exists;
- target object has `data-clover-linked="true"` or equivalent;
- visible target-link element exists;
- Foreman drawer/sheet is not open;
- Clover has visible grounding: shadow element, contact marker, or CSS class `is-grounded`;
- no black matte/crop error is visible via asset metadata or known bad class.

### Screenshot
Capture:

```text
e2e/188_founders_plot_v1_4_2_clover_grounding_no_drawer.spec.js-snapshots/founders-v1-4-2-cleanup-clover-acting-no-drawer-1280-chromium-darwin.png
```

---

## T7 — HQ progression readability

### Setup
Render or fixture three HQ levels:

- HQ Level 1;
- HQ Level 3;
- HQ Level 5.

### Required assertions

- each rendered HQ level has a distinct `data-hq-level`;
- levels use distinct asset IDs or distinct overlay IDs;
- accessible label includes the level;
- visual/screenshot evidence is captured for at least two comparative states.

### Suggested DOM assertions

```js
const hq1 = page.locator('[data-world-object="hq"][data-hq-level="1"]');
const hq3 = page.locator('[data-world-object="hq"][data-hq-level="3"]');
const hq5 = page.locator('[data-world-object="hq"][data-hq-level="5"]');

await expect(hq1).toHaveAttribute('data-visual-tier', /starter|level-1/);
await expect(hq3).toHaveAttribute('data-visual-tier', /improved|level-3/);
await expect(hq5).toHaveAttribute('data-visual-tier', /established|level-5/);
```

### Screenshot
Capture:

```text
e2e/189_founders_plot_v1_4_2_hq_progression_readability.spec.js-snapshots/founders-v1-4-2-cleanup-hq-progression-1280-chromium-darwin.png
```

---

## T8 — scene layering and duplicate live objects

### Setup
Open default desktop route and inspect scene DOM / canvas-equivalent data attributes.

### Required assertions

- scene background element has `data-layer-role="scene-base"` or `scene-ambient`;
- live object layer exists separately with `data-layer-role="live-object"`;
- P0 objects are rendered in live object layer, not as background-only art;
- manifest scene background forbids baked live-state objects;
- rendered asset URL list for default route contains no hero-cast reference image paths;
- default route contains no debug/provider/runtime asset leakage.

### P0 live objects

```text
hq
lumber_camp
farm_plot
quarry
workshop
market_stall
contract_board
public_square
foreman_hut
clover
```

---

## 3. Required commands

Run at minimum:

```bash
npm test -- tests/v1_4_2_visual_signoff_truth.test.js
npm test -- tests/v1_4_2_design_markdown_format.test.js
npm test -- tests/v1_4_2_scene_layer_metadata.test.js
npx playwright test e2e/186_founders_plot_v1_4_2_overlay_hierarchy_cleanup.spec.js
npx playwright test e2e/187_founders_plot_v1_4_2_mobile_calmness.spec.js
npx playwright test e2e/188_founders_plot_v1_4_2_clover_grounding_no_drawer.spec.js
npx playwright test e2e/189_founders_plot_v1_4_2_hq_progression_readability.spec.js
npx playwright test e2e/190_founders_plot_v1_4_2_scene_layering_no_duplicate_live_objects.spec.js
```

Also run the existing relevant suites:

```bash
npm test -- tests/founders_plot_asset_manifest.test.js
npm test -- tests/v1_4_2_asset_manifest_schema.test.js
npm test -- tests/v1_4_2_asset_prompt_coverage.test.js
npx playwright test e2e/162_founders_plot_full_route_player_surface.spec.js
npx playwright test e2e/165_founders_plot_mobile_label_density.spec.js
npx playwright test e2e/166_founders_plot_goal_relevant_lot_emphasis.spec.js
npx playwright test e2e/183_founders_plot_v1_4_1_hero_cast_default_surface.spec.js
npx playwright test e2e/185_founders_plot_v1_4_2_live_asset_evidence.spec.js
```

---

## 4. Release gate

The cleanup patch may be accepted when:

```yaml
release_gate:
  signoff_sheet_completed: true
  ai_slop_copy_preserved: true
  overlay_hierarchy_passed: true
  mobile_calmness_passed: true
  clover_grounding_passed: true
  hq_progression_readability_passed: true
  scene_layering_passed: true
  design_doc_format_passed: true
  no_new_gameplay_systems: true
```
