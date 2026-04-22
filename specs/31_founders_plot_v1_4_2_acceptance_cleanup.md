# Agent Town: Founders Plot V1.4.2 Acceptance Cleanup Specification

**Spec ID:** `31_founders_plot_v1_4_2_acceptance_cleanup`  
**Date:** 2026-04-22  
**Target branch base:** `codex/founders-plot-v1-4-2-gpt-image2-full-rebuild`  
**Target product:** Agent Town: Founders Plot, V1 visual route  
**Sprint type:** acceptance cleanup, not a new feature sprint  
**Primary audience:** Codex / GPT-5.4 agentic implementation team, QA, design owner, product owner

---

## 0. Executive summary

V1.4.2 materially improves Founders Plot. The GPT Image 2 rebuild is accepted as the current art baseline by the product owner. The remaining work is **route-level integration polish**, not another full asset rebuild.

This sprint must make the existing V1.4.2 art pack feel cleanly integrated into a game surface by fixing:

1. signoff truth;
2. overlay hierarchy;
3. mobile label calmness;
4. Clover grounding and no-drawer action readability;
5. HQ upgrade readability;
6. scene-background layering truth.

This sprint must not add new gameplay systems, resources, contracts, persistent/off-session Foreman, doctrine board, specialist agents, social systems, token economy, or renderer rewrites.

The acceptance target is:

> A player opens Agent Town: Founders Plot and sees a polished frontier game route with a clear next action, accepted V1.4.2 art, calm mobile hierarchy, grounded Clover action feedback, and no duplicate/baked state conflicts between background art and live game objects.

---

## 1. Source-of-truth decisions already made

These decisions are locked for this sprint. Do not reopen them unless the product owner explicitly changes direction.

### 1.1 V1.4.2 art baseline is approved

The product owner has reviewed the V1.4.2 GPT Image 2 rebuild and signs off on it as the current production art baseline.

Approval meaning:

- The GPT Image 2 visual direction is accepted.
- The current scene, building, Clover, object, platform-shell, onboarding, and hero-cast art direction is accepted as the baseline.
- Acceptance does **not** waive route-level cleanup around overlays, mobile labels, Clover grounding, HQ upgrade readability, or background layering.

### 1.2 `AI SLOP` copy is product-owner-approved

The public Start Gate phrase:

```text
WARNING! CONTAINS AND PRODUCES AI SLOP.
```

is product-owner-authored and approved as humorous brand copy. Do **not** remove it. Do not file it as a launch blocker.

Implementation rule:

- It may be styled more intentionally as a playful warning sign if needed.
- It must remain legible.
- It must not be changed into corporate/provenance language without product-owner approval.
- Asset provenance details still belong in docs/manifests, not in gameplay panels.

### 1.3 Hero cast remains platform ensemble, not default gameplay cast

The Lobster, Chibi Homesteader, Wizard Kid, and Prairie Dog Ranger are approved platform/brand/hero-video references.

They must not appear in the default Founders Plot gameplay route unless explicitly approved in a later spec.

### 1.4 Scene backgrounds use layered plates

This sprint adopts the **layered-plates** scene model.

The product owner does not need to choose between terrain-only and baked-landmark backgrounds during implementation. The decision is:

> Founders Plot scenes are layered plates. Background images may contain terrain, roads, shadows, atmosphere, distant non-interactive landmarks, and non-stateful decorative context. Stateful gameplay objects must be rendered separately as live objects.

See `docs/visual/SCENE_LAYERING_DECISION_V1_4_2.md` for the normative rule.

---

## 2. Problem statement

V1.4.2 successfully improves the raw art pack, but the default route still risks feeling like an annotated prototype because the interaction layer is too loud relative to the improved environment art.

The specific failure modes are:

- too many same-weight floating labels and white/pale pill callouts;
- repeated `Build here` labels, especially on mobile;
- weak differentiation between objective/action/info/locked/status markers;
- Clover sometimes reads as pasted onto the scene instead of physically acting in it;
- Clover target/action state can be hidden by drawers or overlays;
- HQ level progression does not yet read strongly enough at gameplay scale;
- background scenes may contain baked objects that conflict with live state-rendered objects;
- `VISUAL_SIGNOFF_SHEET_V1_4_2.md` does not yet reflect product-owner signoff.

The fix is a narrow cleanup patch that integrates the accepted art pack more cleanly into the game surface.

---

## 3. Non-goals

Do not implement these in this sprint:

- another full GPT Image 2 asset rebuild;
- new Founders Plot buildings/resources/contracts;
- persistent/off-session Foreman;
- doctrine board;
- specialist agents;
- social sharing;
- economy/token systems;
- hero-cast gameplay cameos;
- PixiJS/Phaser/canvas renderer rewrite;
- provider/proxy/OpenRouter work unless required by existing tests;
- changes to V1.4 AI-reality / LLM decision path except to preserve compatibility.

---

## 4. Required work packages

## WP1 — Signoff truth and owner-approved copy

### Goal
Make branch signoff truth match product-owner decisions.

### Required changes

1. Replace `docs/visual/VISUAL_SIGNOFF_SHEET_V1_4_2.md` with the approved version supplied in this pack.
2. Ensure the sheet states:
   - reviewer/art owner: `Robin / product owner`;
   - date: `2026-04-22`;
   - decision: `Approved as current art baseline with targeted acceptance cleanup required`;
   - waiver: `AI SLOP Start Gate copy is product-owner-approved and must remain`.
3. Add or update tests that fail if the signoff sheet returns to `TBD` for reviewer, date, screenshot status, final decision, or branch identifier.
4. Do not mark remaining cleanup items as art-signoff blockers. They are acceptance-cleanup tasks, not rejection of the art baseline.

### Acceptance criteria

- `VISUAL_SIGNOFF_SHEET_V1_4_2.md` contains no `TBD` in required signoff fields.
- It explicitly approves the V1.4.2 art baseline.
- It explicitly records remaining cleanup requirements.
- It explicitly preserves the product-owner-approved `AI SLOP` copy.

---

## WP2 — Overlay hierarchy cleanup

### Goal
Replace same-weight floating UI with a clear visual language that distinguishes current objective, primary action, available-but-not-primary lots, locked objects, status markers, and ambient labels.

### Required design rule

The map may not treat every callout like a white pill. The player must visually distinguish:

| Overlay category | Purpose | Default treatment |
|---|---|---|
| `objective` | The one thing the current goal wants | strongest; one at a time; warm/gold/brass; may pulse gently |
| `primary-action` | Immediate CTA on selected/recommended object | strong but below objective; can live in bottom sheet |
| `available` | Can be built/used but not current objective | quiet stake/icon; no persistent text on mobile |
| `status` | ready/producing/blocked/locked | compact icon/badge; color + shape + accessible label |
| `ambient` | flavor/location identity | hidden or low-contrast unless selected |
| `debug` | runtime/provider/dev info | never visible in normal gameplay |

### Required changes

1. Introduce or formalize overlay semantic classes:
   - `fp-overlay-objective`
   - `fp-overlay-primary-action`
   - `fp-overlay-available`
   - `fp-overlay-status`
   - `fp-overlay-ambient`
   - `fp-overlay-debug`
2. Reduce repeated `Build here` labels.
3. Only the objective-relevant lot may receive strong glow/pulse/large label treatment.
4. Non-objective available lots should read as quiet possible places, not current instructions.
5. White/pale pill shape should not be the default for every world label. Use diegetic signs, small badges, stakes, or icons.
6. The top objective ribbon, on-map objective cue, and bottom action sheet must agree on the same current goal.

### Acceptance metrics

- `DefaultRoutePrimaryObjectiveCount = 1`
- `SameWeightFloatingPillCount <= 3` on desktop default route
- `NonObjectiveBuildHereTextCount = 0` on mobile default route
- `ObjectiveRelevantLotStrongAttention = true`
- `NonObjectiveLotStrongAttention = false`
- No debug/provider/runtime text in normal route.

---

## WP3 — Mobile calmness and label clipping

### Goal
Make mobile feel like a game surface, not an annotated map.

### Required changes

1. On 390px mobile default route:
   - hide labels for non-objective buildable lots;
   - show at most one strong objective label;
   - show HQ/location identity only when needed;
   - show selected-object details in the bottom sheet, not as persistent map text.
2. Replace most persistent map text with icons/stakes/badges.
3. Ensure no labels clip, truncate awkwardly, or overflow their containers.
4. Ensure touch targets remain usable.

### Acceptance metrics

- `MobileVisibleFloatingLabelCount <= 6`
- `MobileVisibleBuildHereTextCount <= 1`
- `MobileClippedLabelCount = 0`
- `MobilePrimaryCTAVisible = true`
- `MobileBottomSheetDoesNotCoverObjective = true`
- `TapTargetMinSize >= 44px` for interactive objects/sheets.

---

## WP4 — Clover grounding and no-drawer action proof

### Goal
Clover must read as an embodied Foreman acting in the world, not as a UI mascot or drawer-only state.

### Required changes

1. Clover must have a visible ground shadow/contact point in normal route.
2. Clover scale must be consistent with scene/buildings at gameplay scale.
3. Clover `ACTING` state must be visually target-linked without relying on an open Foreman drawer.
4. Add or improve target-link treatment:
   - path line,
   - gesture/pointer,
   - action glow between Clover and target,
   - or target-relative re-anchoring.
5. After a Foreman action, show a short receipt without covering the world.
6. The detailed audit remains expandable, not always open.

### Acceptance metrics

- `CloverVisibleInDefaultRoute = true`
- `CloverGroundShadowVisible = true`
- `CloverActingTargetLinkVisibleNoDrawer = true`
- `CloverActionTargetObjectHighlighted = true`
- `ForemanDrawerOpenDuringNoDrawerScreenshot = false`
- `CloverBlackMatteOrCropIssue = false`

---

## WP5 — HQ progression readability

### Goal
HQ upgrades must feel like visible town growth.

### Required changes

1. HQ levels must not look identical at gameplay scale.
2. At minimum, the following must be visually distinguishable:
   - HQ Level 1: humble starter HQ;
   - HQ Level 3: visibly improved civic center;
   - HQ Level 5: clearly established town HQ.
3. The team may achieve this by:
   - targeted GPT Image 2 regeneration for HQ variants;
   - live upgrade overlays layered on the existing HQ asset;
   - additive props such as sign, porch, second roofline, flag, lantern, office annex, upgrade plaque.
4. Do not rebuild the entire art pack to solve this.

### Acceptance metrics

- `HqLevel1Vs3VisualDifference = pass`
- `HqLevel3Vs5VisualDifference = pass`
- `HqUpgradeMomentReadsAsProgress = pass`
- Screenshot baseline includes at least one HQ-upgraded state.

### Suggested implementation shortcut

If regeneration is too slow, implement HQ progression overlays:

```text
hq-lv1.webp + hq-upgrade-lv3-overlay.webp + hq-upgrade-lv5-overlay.webp
```

The manifest must record overlays separately and mark them as stateful live assets.

---

## WP6 — Scene layering decision and no duplicate live objects

### Goal
Avoid conflicts where a scene background bakes in objects that are also rendered as live/stateful objects.

### Required decision

Adopt **layered plates**:

1. `scene-base` layer: terrain, road, horizon, lighting, ground texture, broad shadows.
2. `scene-ambient` layer: non-interactive distant silhouettes, far fences, dust, rocks, decorative atmosphere.
3. `live-object` layer: HQ, Lumber Camp, Farm Plot, Quarry, Workshop, Market Stall, Contract Board, Public Square / Welcome Sign, Foreman Hut, Town Journal, buildable lots.
4. `character` layer: Clover and any future in-world characters.
5. `effects` layer: resource flyouts, sparkles, action link, timer rings.
6. `ui-overlay` layer: objective badge, status icons, context sheets.

### Required changes

1. Update `asset-manifest.json` scene entries with layer metadata.
2. Add `containsLiveStatefulObjects: false` for background scene plates.
3. Add `allowedBakedContent` and `forbiddenBakedContent` fields.
4. Ensure scene renderer does not duplicate live object silhouettes baked into background.
5. Add tests that fail if background manifest metadata permits P0 live objects to be baked into the background.

### Allowed baked background content

- terrain;
- paths/roads;
- far horizon shapes;
- lighting/shadow gradients;
- non-interactive rocks, fences, tufts, distant tiny structures;
- decorative signage that is not an interactable game object;
- atmospheric dust, clouds, sky, mountains.

### Forbidden baked background content

Unless explicitly marked as distant non-interactive decoration unrelated to a live object, the background must not bake in:

- HQ;
- production buildings;
- Contract Board;
- Public Square / Welcome Sign;
- Foreman Hut;
- Clover;
- active construction scaffolds;
- timer rings;
- ready badges;
- current objective markers;
- any object whose state changes during gameplay.

### Acceptance metrics

- `SceneLayerMode = layered_plates`
- `SceneBackgroundContainsLiveStatefulObjects = false`
- `LiveObjectDuplicateEvidence = 0`
- `SceneManifestLayerMetadataCoverage = 100%`

---

## WP7 — Markdown/design-doc formatting cleanup

### Goal
Make the design/spec/prompt docs readable and lintable by LLMs and humans.

### Required changes

1. Reformat newly added one-line markdown files into normal multi-line markdown.
2. Use valid YAML front matter where DESIGN-style docs require it:

```md
---
version: "1.4.2-cleanup"
name: "Agent Town"
...
---

## Overview
...
```

3. Keep tokens machine-readable and rationale human-readable.
4. Preserve Google `DESIGN.md` inspiration:
   - YAML front matter for tokens;
   - markdown body for rationale;
   - section order and lintability.
5. Add tests that detect one-line compressed docs for key files.

### Acceptance metrics

- `DesignDocsHaveYamlFrontMatter = true`
- `DesignDocsHaveMarkdownSections = true`
- `CompressedOneLineDesignDocs = 0`
- `PromptFilesHaveReadableSections = true`

---

## 5. Files expected to change

Likely files:

```text
docs/visual/VISUAL_SIGNOFF_SHEET_V1_4_2.md
docs/visual/SCENE_LAYERING_DECISION_V1_4_2.md
Brand kit/guidelines/agent-town-design-pack/DESIGN.md
Brand kit/guidelines/agent-town-design-pack/GAME_UX.md
Brand kit/guidelines/agent-town-design-pack/REGISTRY.md
AGENTS.md
public/experiences/founders-plot/app.js
public/experiences/founders-plot/scene_render.js
public/experiences/founders-plot/scene_state.js
public/experiences/founders-plot/visual_metrics.js
public/experiences/founders-plot/styles.css
public/experiences/founders-plot/assets/asset-manifest.json
public/experiences/founders-plot/assets/buildings/*hq*
public/experiences/founders-plot/assets/characters/clover-*.webp
public/start.html
specs/31_founders_plot_v1_4_2_acceptance_cleanup.md
specs/32_founders_plot_v1_4_2_acceptance_cleanup_tdd_matrix.md
```

New tests likely:

```text
tests/v1_4_2_visual_signoff_truth.test.js
tests/v1_4_2_design_markdown_format.test.js
tests/v1_4_2_scene_layer_metadata.test.js
e2e/186_founders_plot_v1_4_2_overlay_hierarchy_cleanup.spec.js
e2e/187_founders_plot_v1_4_2_mobile_calmness.spec.js
e2e/188_founders_plot_v1_4_2_clover_grounding_no_drawer.spec.js
e2e/189_founders_plot_v1_4_2_hq_progression_readability.spec.js
e2e/190_founders_plot_v1_4_2_scene_layering_no_duplicate_live_objects.spec.js
```

---

## 6. Definition of done

The sprint is complete only when:

1. `VISUAL_SIGNOFF_SHEET_V1_4_2.md` records product-owner approval and no longer has TBD signoff fields.
2. `AI SLOP` copy remains and is documented as product-owner-approved.
3. The default desktop route has one clear primary objective and reduced same-weight map labels.
4. The 390px mobile route has no clipped labels and no repeated non-objective `Build here` labels.
5. Clover’s ACTING state is visible and target-linked without an open Foreman drawer.
6. HQ level progression reads visually at gameplay scale.
7. Scene backgrounds are declared and validated as layered plates without live-state duplication.
8. Updated design docs are readable, structured, and aligned with Google-style DESIGN.md principles.
9. Existing V1.4 AI-reality and V1.4.2 asset tests still pass.
10. No new gameplay systems were added.

---

## 7. Machine-readable summary

```yaml
spec_id: founders_plot_v1_4_2_acceptance_cleanup
sprint_type: acceptance_cleanup
base_branch: codex/founders-plot-v1-4-2-gpt-image2-full-rebuild
product_owner_decisions:
  v1_4_2_art_baseline: approved
  ai_slop_copy: keep_owner_approved
  hero_cast_default_gameplay: excluded
  scene_layering_model: layered_plates
p0_work_packages:
  - visual_signoff_truth
  - overlay_hierarchy_cleanup
  - mobile_label_calmness
  - clover_grounding_no_drawer_action
  - hq_progression_readability
  - scene_layering_no_duplicate_live_objects
  - design_doc_formatting_cleanup
non_goals:
  - full_asset_rebuild
  - new_gameplay_systems
  - persistent_foreman
  - doctrine_board
  - specialist_agents
  - social_layer
  - renderer_rewrite
required_metrics:
  DefaultRoutePrimaryObjectiveCount: 1
  SameWeightFloatingPillCount: "<=3"
  MobileVisibleFloatingLabelCount: "<=6"
  MobileVisibleBuildHereTextCount: "<=1"
  MobileClippedLabelCount: 0
  CloverActingTargetLinkVisibleNoDrawer: true
  HqLevel1Vs3VisualDifference: pass
  SceneBackgroundContainsLiveStatefulObjects: false
  SceneManifestLayerMetadataCoverage: "100%"
```
