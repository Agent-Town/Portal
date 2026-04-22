# Agent Town: Founders Plot V1.4.2 Patch 2 — Mobile Calmness and HQ Progression

**Spec status:** implementation-ready  
**Date:** 2026-04-22  
**Target branch:** `codex/founders-plot-v1-4-2-acceptance-cleanup`  
**Reviewed commit:** `db40f81`  
**Base asset rebuild commit:** `a994e28`  
**Patch type:** narrow visual acceptance cleanup  
**Primary audience:** Codex / GPT-5.4 implementation team, frontend engineers, QA, product owner  

---

## 0. Executive summary

The V1.4.2 GPT Image 2 art rebuild is accepted as the current Agent Town / Founders Plot art baseline by the product owner. The `AI SLOP` warning copy is intentional product-owner-approved humor and must remain unless Robin explicitly changes it later.

The acceptance-cleanup branch improved desktop hierarchy, docs/signoff truth, scene-layer metadata, Clover grounding, and mobile behavior. However, QA has not signed off the branch because two blockers remain:

1. **Mobile calmness / hierarchy is still too busy at 390px.**  
2. **HQ Level 1 / 3 / 5 progression still does not read strongly enough at gameplay scale.**

This patch must resolve those two blockers only. Do not reopen gameplay scope, art direction, runtime architecture, AI Foreman logic, contracts, resources, economy, hero-cast usage, or full GPT Image 2 rebuild.

The patch is complete when the default 390px mobile route feels calm and game-first, and the HQ level progression is visibly readable from the actual gameplay view without relying on text labels.

---

## 1. Source inputs and decisions

### 1.1 Inputs

This spec incorporates:

- `FOUNDERS_PLOT_V1_4_2_ACCEPTANCE_CLEANUP_REVIEW_2026-04-22.md`
- prior review of `codex/founders-plot-v1-4-2-acceptance-cleanup`
- V1.4.2 GPT Image 2 rebuild review
- V1.4.2 acceptance cleanup spec and TDD matrix
- current design governance docs: `BRAND.md`, `DESIGN.md`, `GAME_UX.md`, `REGISTRY.md`, `AGENTS.md`

### 1.2 Locked decisions

These decisions are locked and must not be reopened in this patch:

1. **V1.4.2 art baseline is accepted.**  
   The current GPT Image 2 art direction is the production baseline for Agent Town / Founders Plot.

2. **`AI SLOP` copy remains.**  
   This is intentional product-owner-approved humorous copy.

3. **Founders Plot remains the V1 launch chapter.**  
   Agent Town is the product/masterbrand; Founders Plot is the launch chapter.

4. **The gameplay surface remains stage-first.**  
   Do not return to a dashboard/panel-first UI.

5. **Clover remains the gameplay partner.**  
   The hero cast remains platform/marketing identity and must not crowd default Founders Plot gameplay.

6. **Layered plates remain the scene model.**  
   Background plates may contain terrain, roads, lighting, shadows, and non-interactive atmosphere. Stateful game objects must be live layers.

7. **No new gameplay systems.**  
   This patch is visual acceptance cleanup only.

---

## 2. Goals and non-goals

### 2.1 Goals

P0 goals:

1. Reduce mobile density until the default 390px route feels calm, guided, and game-first.
2. Make HQ levels 1, 3, and 5 visually distinct at actual gameplay scale.
3. Strengthen tests so mobile calmness and HQ progression are proven by route screenshots and visual artifacts, not only metadata.
4. Preserve the existing accepted V1.4.2 art direction, signoff, overlay improvements, scene-layer contract, and Clover no-drawer grounding.

### 2.2 Non-goals

Do **not** add or change:

- resources, contracts, buildings, economy, or timers;
- Foreman/LLM/OpenClaw runtime behavior;
- persistent/off-session Foreman;
- doctrine board;
- specialist agents;
- hero-cast gameplay cameos;
- social systems;
- token economy;
- renderer rewrite;
- a second full GPT Image 2 rebuild;
- Start Gate copy, except only if required to preserve layout/accessibility.

---

## 3. P0 Work Package A — Mobile calmness and hierarchy

### 3.1 Problem

The 390px mobile route mechanically passes existing tests but visually remains too dense. The stage still carries too many persistent labels, chips, and annotations before interaction. The objective row is cramped, the map carries too much visible annotation, and the route can still feel like a compressed annotated prototype instead of a calm game surface.

### 3.2 Required design outcome

At 390px width, the player should immediately see:

1. the town stage;
2. the current objective;
3. the one relevant world object or lot;
4. Clover, if relevant;
5. one clear primary action.

Everything else must be quiet, icon-only, hidden until selected, or moved into the contextual sheet/drawer.

### 3.3 Mobile visibility rules

At `max-width: 480px`, default unselected state must obey these rules:

#### Persistent on-map text

Allowed on-map text:

- selected object name, if an object is selected;
- recommended/objective object label, if no object is selected;
- one Clover speech/receipt line, only when Clover is actively relevant;
- one critical blocked/ready state, only if it is the current objective blocker.

Disallowed on-map text by default:

- repeated `Build here` labels;
- non-objective `Unlocks at HQ2` labels;
- ambient `Civic project` labels;
- secondary status chips for unrelated lots;
- duplicate labels that repeat the top objective text;
- any label clipped/truncated by its container.

#### Lots and locked objects

- Non-objective available lots must render as quiet stakes/icons, not text pills.
- Locked lots must render as quiet lock/ghost markers; the reason belongs in the selected sheet, not always on the map.
- Only the current objective or selected lot may use a strong glow/pulse/primary badge.

#### Current objective row

- The objective row must be short and readable.
- It may contain one concise objective sentence and one primary CTA.
- It must not wrap into a cramped multi-line task panel on the default 390px route.

#### Feedback stacking

On mobile, the same focal area must not show all of these at once:

- Clover speech bubble;
- resource flyout;
- building label;
- objective marker;
- readiness badge;
- timer badge.

If more than two of these would overlap, the renderer must suppress the lower-priority items.

Priority order:

1. blocking approval / critical warning;
2. current objective marker;
3. Clover acting target link;
4. selected object label;
5. resource flyout;
6. ready/blocked badge;
7. ambient label.

### 3.4 Required implementation changes

Implement a mobile-specific surface policy, preferably in the scene state/renderer layer, not as scattered CSS-only hacks.

Recommended files to inspect/change:

- `public/experiences/founders-plot/scene_state.js`
- `public/experiences/founders-plot/scene_render.js`
- `public/experiences/founders-plot/styles.css`
- `public/experiences/founders-plot/app.js`
- relevant V1.4.2 mobile Playwright tests

Add or update a function equivalent to:

```ts
type MobileSceneSignalPolicy = {
  viewportClass: "mobile" | "tablet" | "desktop";
  selectedObjectId?: string;
  objectiveObjectId?: string;
  cloverTargetObjectId?: string;
  activeFeedbackTypes: string[];
};

function shouldShowWorldLabel(signal, policy): boolean;
function getMobileSignalPriority(signal, policy): number;
function suppressOverlappingMobileSignals(signals, policy): SceneSignal[];
```

Implementation may differ, but the behavior must be centralized and testable.

### 3.5 Acceptance metrics

At 390px full-route default state:

- `MobilePersistentWorldLabels <= 3`
- `MobileOnMapVisibleWords <= 24`
- `MobilePrimaryAttentionObjects <= 2`
- `MobileClippedLabelCount = 0`
- `MobileSameWeightPillCount <= 2`
- `MobileNonObjectiveTextLabels = 0`
- `MobileDefaultScreenshotApproved = true`

At 390px Clover-acting state:

- `MobileCloverTargetReadable = true`
- `MobileFeedbackStackAtTarget <= 2`
- `MobileClippedLabelCount = 0`
- `MobilePrimaryCTAVisible = true`

---

## 4. P0 Work Package B — HQ progression readability

### 4.1 Problem

HQ Level 1 / 3 / 5 currently has technical metadata hooks and/or subtle differences, but it does not read as strong civic growth at normal gameplay scale. The player must feel the town grew when HQ upgrades.

### 4.2 Required design outcome

HQ progression must communicate growth through **silhouette, massing, footprint, props, and civic identity**, not only trim, color, level labels, or small accents.

The player should be able to distinguish HQ Level 1, Level 3, and Level 5 in a 5-second screenshot review without reading labels.

### 4.3 Required art direction

Use the accepted V1.4.2 warm frontier storybook / soft 3D collectible style.

#### HQ Level 1 — Claim Cabin / Starter Office

Must read as:

- humble first settlement headquarters;
- small footprint;
- simple cabin/tent/wagon-office feeling;
- rough materials;
- one modest sign or mailbox;
- low roofline and simple silhouette.

Avoid:

- too polished;
- too civic/town-hall-like;
- same footprint as higher levels.

#### HQ Level 3 — Expanded Homestead / Civic Office

Must read as:

- noticeably upgraded from Level 1;
- wider footprint or added side room;
- stronger porch/awning;
- improved roof/trim;
- visible town planning props: map table, notice board, supply crates, lamp, water barrel;
- clear mid-tier civic identity.

Avoid:

- merely recolored Level 1;
- a full town hall too early.

#### HQ Level 5 — Proper Frontier Town Hall

Must read as:

- final current V1 civic anchor;
- largest and most formal HQ silhouette;
- tower/bell/flag/signature roofline or civic crest;
- polished material quality;
- public-facing entrance, steps, banners, and civic sign;
- unmistakable difference from Level 1 and Level 3.

Avoid:

- looking like just another cabin;
- same bounding silhouette as Level 1.

### 4.4 Asset requirements

Production assets must include at minimum:

```text
public/experiences/founders-plot/assets/buildings/hq-lv1.webp
public/experiences/founders-plot/assets/buildings/hq-lv3.webp
public/experiences/founders-plot/assets/buildings/hq-lv5.webp
```

These must be distinct files with distinct visual content.

They may be regenerated with GPT Image 2 or manually edited. If regenerated, prompts must be stored under:

```text
public/experiences/founders-plot/assets/prompts/v1_4_2_patch_2/
specs/prompts/v1_4_2_patch_2/
```

Asset manifest must record:

- prompt file path;
- model/generator, if generated;
- reference inputs;
- post-processing notes;
- approved by Robin / product owner or marked pending if not yet reviewed;
- gameplay-scale signoff status.

### 4.5 Visual proof requirements

The previous metadata-only proof is not sufficient.

Tests must prove:

1. **Artifact uniqueness**  
   HQ Level 1 / 3 / 5 assets are not byte-identical and not trivially identical in dimensions/content.

2. **Gameplay-scale difference**  
   A Playwright-rendered HQ progression gallery must display L1 / L3 / L5 at the same size used in the actual game, and the screenshot must be committed.

3. **Visual delta**  
   Use a browser-canvas or image-comparison helper to compare normalized renderings of L1 vs L3, L3 vs L5, and L1 vs L5. If the repository lacks image-diff tooling, implement a small deterministic browser-canvas RMS/pixel-delta check in Playwright.

4. **No label dependency**  
   The HQ progression gallery must include a screenshot with level labels hidden. The silhouettes must still be distinguishable.

Recommended minimum thresholds:

- `HQAssetShaUnique = true`
- `HQCanvasRmsDeltaL1L3 >= 0.08`
- `HQCanvasRmsDeltaL3L5 >= 0.08`
- `HQCanvasRmsDeltaL1L5 >= 0.12`
- `HQGameplayScaleScreenshotApproved = true`

Thresholds may be adjusted if the team provides an equivalent stronger visual-difference metric.

---

## 5. P1 Work Package C — Preserve existing acceptance wins

This patch must not regress:

- Robin/product-owner visual signoff for V1.4.2 art baseline;
- owner-approved `AI SLOP` copy;
- hidden normal-route debug/Agent Comms chrome;
- scene-first full route;
- Clover no-drawer acting proof;
- hero-cast quarantine from default Founders Plot gameplay;
- asset manifest/provenance coverage;
- design-doc governance;
- layered-plate scene metadata;
- reduced-motion handling;
- accessibility labels for interactive objects.

Existing tests covering these areas must remain green.

---

## 6. Scene layering clarification

QA reports scene-layering / duplicate live-object checks as passing in the current acceptance-cleanup branch. Therefore, this patch does **not** require another scene-background rebuild unless the team discovers duplicate live objects while fixing mobile or HQ.

The layered-plate rule remains:

- background plates may contain terrain, roads, shadows, lighting, atmospheric props, and non-interactive world dressing;
- live objects contain all gameplay-stateful elements;
- HQ upgrade progression must be live-object-layer driven, not baked solely into the background.

If the team regenerates scene backgrounds for mobile calmness, the new backgrounds must maintain this contract.

---

## 7. Tests to add or update

### 7.1 Required new tests

Suggested files:

```text
e2e/191_founders_plot_v1_4_2_patch2_mobile_calmness_strict.spec.js
e2e/192_founders_plot_v1_4_2_patch2_hq_visual_delta.spec.js
e2e/193_founders_plot_v1_4_2_patch2_regression_guardrails.spec.js
```

#### Test: mobile strict default calmness

Scenario:

- open `/app?district=founders-plot` or canonical Founders Plot full route at 390px;
- wait for stage ready;
- capture screenshot;
- count visible world labels/chips and on-map text words;
- assert no clipped labels;
- assert only objective/recommended/selected object has strong emphasis.

Metrics:

```text
MobilePersistentWorldLabels <= 3
MobileOnMapVisibleWords <= 24
MobileNonObjectiveTextLabels = 0
MobileClippedLabelCount = 0
MobilePrimaryAttentionObjects <= 2
```

#### Test: mobile Clover acting calmness

Scenario:

- trigger Clover ACTING state with drawer closed;
- viewport 390px;
- capture screenshot;
- assert target link visible;
- assert no more than two feedback items overlap target area;
- assert no clipped labels.

Metrics:

```text
MobileCloverTargetReadable = true
MobileFeedbackStackAtTarget <= 2
MobileClippedLabelCount = 0
```

#### Test: HQ asset visual delta

Scenario:

- load HQ L1/L3/L5 assets in browser canvas;
- normalize to same size;
- compute deterministic RMS or equivalent pixel delta;
- assert thresholds.

Metrics:

```text
HQAssetShaUnique = true
HQCanvasRmsDeltaL1L3 >= 0.08
HQCanvasRmsDeltaL3L5 >= 0.08
HQCanvasRmsDeltaL1L5 >= 0.12
```

#### Test: HQ gameplay-scale progression gallery

Scenario:

- render HQ L1/L3/L5 at actual gameplay size in the Founders Plot route or dedicated gallery route/test mode;
- hide level text labels for one screenshot;
- capture screenshot.

Metrics:

```text
HQGameplayScaleScreenshotExists = true
HQLabelIndependentScreenshotExists = true
HQProgressionHumanApproved = true
```

#### Test: regression guardrails

Scenario:

- assert `AI SLOP` copy remains in Start Gate;
- assert Agent Comms/debug chrome absent in normal gameplay route;
- assert hero-cast asset paths absent from default Founders Plot gameplay route;
- assert scene-layer duplicate live-object test still passes;
- assert existing V1.4 / V1.4.2 LLM Foreman tests unaffected if this branch touches no runtime code.

---

## 8. Updated screenshot requirements

Commit updated screenshots for:

```text
founders-v1-4-2-patch2-mobile-default-390.png
founders-v1-4-2-patch2-mobile-clover-acting-390.png
founders-v1-4-2-patch2-hq-progression-1280.png
founders-v1-4-2-patch2-hq-progression-no-labels-1280.png
founders-v1-4-2-patch2-desktop-regression-1280.png
```

The implementation report must link all screenshot paths.

---

## 9. Design-document updates required

The team must update these docs in the repository, not only the code:

### `DESIGN.md`

Add:

- mobile calmness budget;
- mobile overlay suppression law;
- HQ progression visual ladder;
- asset-generation/prompt storage requirement for HQ replacements.

### `GAME_UX.md`

Add:

- mobile attention arbitration rules;
- mobile label visibility rules;
- HQ upgrade emotional reward rule;
- 5-second mobile game-read test.

### `REGISTRY.md`

Add/adjust components:

- `mobile-stage-signal-policy`
- `quiet-lot-marker`
- `objective-lot-marker`
- `hq-progression-gallery`
- `hq-upgrade-visual-ladder`

### `AGENTS.md`

Add a short guardrail:

- When implementing Founders Plot visual patches, do not satisfy visual requirements only through metadata. Mobile calmness and HQ progression must be proven through real route screenshots and visual artifact tests.

### `VISUAL_SIGNOFF_SHEET_V1_4_2.md`

Update final acceptance status to:

```text
Art baseline: approved by Robin / product owner.
Acceptance cleanup final signoff: pending Patch 2 mobile calmness and HQ progression checks.
```

After Patch 2 passes, update it to final acceptance with screenshot references.

---

## 10. Implementation roadmap

### Milestone 1 — Mobile signal audit

Deliver:

- inspect current 390px route;
- list every persistent on-map label/chip in default and Clover-acting states;
- map each to objective/selected/Clover/ambient/locked roles;
- identify which must be suppressed, iconified, or moved to sheet.

Acceptance:

- audit appears in implementation report;
- no code changes beyond optional debug helpers.

### Milestone 2 — Mobile calmness implementation

Deliver:

- centralized mobile signal suppression / priority logic;
- CSS/layout changes for 390px calmness;
- updated screenshots.

Acceptance:

- mobile strict default calmness test passes;
- mobile Clover acting calmness test passes;
- screenshot review confirms game-first mobile read.

### Milestone 3 — HQ progression asset pass

Deliver:

- distinct HQ L1/L3/L5 assets;
- prompt files, if generated;
- manifest updates;
- progression gallery screenshots.

Acceptance:

- asset SHA uniqueness passes;
- visual delta test passes;
- no-label gameplay-scale gallery screenshot passes review.

### Milestone 4 — Design-doc and signoff update

Deliver:

- `DESIGN.md`, `GAME_UX.md`, `REGISTRY.md`, `AGENTS.md`, signoff sheet updates;
- screenshot paths added to signoff sheet;
- implementation report.

Acceptance:

- design-doc formatting tests pass;
- signoff truth test passes;
- no stale `TBD` fields in V1.4.2 signoff sheet for Patch 2.

### Milestone 5 — Regression sweep

Deliver:

- run targeted V1.4.2 and Patch 2 tests;
- run existing Founders Plot route tests;
- verify no gameplay/runtime changes.

Acceptance:

- all targeted tests pass;
- no new gameplay systems detected;
- implementation report lists commands and results.

---

## 11. Definition of done

Patch 2 is done only when all are true:

- mobile default route at 390px feels calm and game-first;
- mobile on-map label budget passes;
- no mobile clipped labels;
- only the objective/recommended/selected lot receives strong attention;
- Clover acting remains visible without a drawer and does not create clutter;
- HQ L1/L3/L5 assets are meaningfully distinct at gameplay scale;
- HQ progression is proven by real image/artifact tests and screenshots;
- V1.4.2 signoff sheet is updated truthfully;
- `AI SLOP` copy is preserved;
- no new gameplay systems are added;
- existing V1.4 / V1.4.2 tests remain green or failures are explained.

---

## 12. Required final implementation report

The team must include:

1. summary of mobile changes;
2. before/after label counts at 390px;
3. screenshots captured and paths;
4. HQ asset files changed;
5. HQ generation/edit prompts and provenance;
6. visual-delta metric results;
7. design docs changed;
8. tests added/updated;
9. commands run and results;
10. confirmation that no gameplay/runtime systems changed;
11. any remaining visual limitations.

---

## 13. Machine-readable summary

```yaml
spec_id: founders_plot_v1_4_2_patch_2_mobile_calmness_hq_progression
version: v1.4.2-patch2
branch_base: codex/founders-plot-v1-4-2-acceptance-cleanup
reviewed_commit: db40f81
status: implementation_ready
scope: narrow_visual_acceptance_cleanup
locked_decisions:
  art_baseline: approved_by_product_owner
  ai_slop_copy: preserve_owner_approved_humor
  scene_model: layered_plates
  gameplay_scope: no_new_systems
p0_blockers:
  - mobile_calmness_at_390px
  - hq_1_3_5_progression_readability_at_gameplay_scale
required_docs:
  - DESIGN.md
  - GAME_UX.md
  - REGISTRY.md
  - AGENTS.md
  - docs/visual/VISUAL_SIGNOFF_SHEET_V1_4_2.md
required_tests:
  - mobile_strict_default_calmness
  - mobile_clover_acting_calmness
  - hq_asset_visual_delta
  - hq_gameplay_scale_progression_gallery
  - regression_guardrails
non_goals:
  - new_gameplay_systems
  - persistent_foreman
  - doctrine_board
  - hero_cast_gameplay_cameos
  - new_contracts_or_resources
  - renderer_rewrite
```
