# Agent Town: Founders Plot V1.3.1 — Visual Surface Signoff Pass

_Status: implementation specification_  
_Date: 2026-04-21_  
_Applies to branch line after `codex/founders-plot-v1-3-visual-surface`_  
_Target implementers: Codex / GPT-5.4 agentic AI developers, frontend engineers, game UX, QA, art/design owner_

---

## 0. Executive summary

V1.3 moved Founders Plot from a panel-heavy management surface toward a real scene-first game surface. The architecture is structurally correct and should not be reopened.

V1.3.1 is a **focused visual-surface signoff pass**. It is not a new gameplay sprint and not a rewrite.

The sprint objective is:

> Finish the current Founders Plot visual surface so the full player-facing route immediately reads as a launch-grade Agent Town frontier town-builder, with Clover visibly helping in-world and no normal-surface developer/debug console clutter.

This spec incorporates the QA review that identified five focused finish areas:

1. raise the art pack to flagship / frontier-storybook quality;
2. make Clover's `ACTING` state visibly target-linked;
3. reduce mobile label density and give the stage breathing room;
4. narrow buildable-lot attention to the objective-relevant lot;
5. isolate or quarantine OpenRouter/proxy scope from V1.3 visual signoff.

It also includes the page-level blocker found in implementation review: the **full app route** must not show Agent Comms / Worker Tools / Skill Context / Worker Traffic / Brain / Session Context / Trainer as normal gameplay.

---

## 1. Source-of-truth documents to update

This sprint must update the durable design-governance files, not only local CSS.

Required file updates:

```text
AGENTS.md
Brand kit/guidelines/agent-town-design-pack/BRAND.md
Brand kit/guidelines/agent-town-design-pack/DESIGN.md
Brand kit/guidelines/agent-town-design-pack/GAME_UX.md
Brand kit/guidelines/agent-town-design-pack/REGISTRY.md
specs/23_founders_plot_v1_3_1_visual_signoff_pass.md
```

If the repo also mirrors design docs at root-level paths (`BRAND.md`, `DESIGN.md`, `GAME_UX.md`, `REGISTRY.md`), keep the root copies in sync.

The updated design docs included with this handoff are part of the implementation input and should replace the corresponding repo files.

---

## 2. Non-goals

Do **not** add or change:

- new resources;
- new contracts;
- new economy mechanics;
- persistent/off-session Foreman;
- new OpenClaw runtime architecture;
- doctrine board;
- specialist Foremen;
- public/social sharing systems;
- blockchain/token/wallet flows;
- PixiJS/Phaser rewrite;
- a new shell navigation model.

Do **not** treat this as an opportunity to rebuild Founders Plot. V1.3 already has the right scene-first direction. Finish it.

---

## 3. Locked wins from V1.3

The next sprint must preserve these V1.3 wins:

- scene-first Founders Plot surface;
- visual state adapter / renderer / effects / metrics layering;
- secondary systems moved into drawers/sheets;
- Clover visible in-world;
- restart/runtime-truth preserved;
- asset pipeline and asset manifest;
- Playwright coverage for visual hierarchy, object states, Clover, assets, mobile, reduced motion;
- V1.2 gameplay/runtime behavior.

Any change that weakens these is a regression.

---

## 4. P0 release gates

V1.3.1 is acceptable only when all P0 gates pass.

### Gate A — Product direction

The full app route must read as a frontier town-building game within five seconds.

Pass criteria:

- scenic plot dominates the default view;
- one current goal / next object is obvious;
- Clover is visible in-world;
- no Agent Comms / worker-debug console is visible in normal gameplay;
- screenshot reviewer does not read the screen as a dashboard, admin tool, or AI config panel.

### Gate B — Art direction

The default frame must feel launch-grade, not placeholder-grade.

Pass criteria:

- canonical 1280px hero screenshot is approved;
- named human art/design owner signoff is recorded;
- primary-view assets carry approval metadata;
- no primary-view asset is `draft` or `needs_revision`.

### Gate C — Clover embodiment

Clover must visibly act on the world.

Pass criteria:

- `ACTING` state has a target-linked visual treatment;
- the target object is identifiable without reading a long receipt;
- target link is testable through DOM hooks;
- accessible text announces the target and action.

### Gate D — Mobile hierarchy

Mobile must remain a game surface.

Pass criteria:

- mobile stage breathes;
- default visible words hard max <= 80, target <= 65;
- visible stage labels <= 3;
- no overlapping labels;
- no stacked permanent panels.

### Gate E — Goal-relevant lot emphasis

The default next action must be singular.

Pass criteria:

- exactly one world object receives `recommended` / primary attention by default;
- other buildable lots are quieter `available` states;
- objective ribbon, primary CTA, and Clover suggestion agree when possible.

### Gate F — Scope hygiene

Visual signoff must not implicitly approve unrelated migration/proxy work.

Pass criteria:

- OpenRouter/proxy changes are split out, or;
- branch includes `specs/OPENROUTER_SCOPE_QUARANTINE.md` with owner, files, tests, and rollback plan.

---

## 5. Work packages

## WP1 — Full-route player-surface quarantine

### Goal

Normal Founders Plot gameplay must not expose the global Agent Comms / worker-debug panel.

### Required behavior

On normal player routes such as:

```text
/app?district=founders-plot
/app#founders-plot
/founders-plot
```

hide or collapse large debug/backstage surfaces, including:

- Agent Comms as a large always-visible panel;
- Worker Tools;
- Skill Context;
- Worker Traffic;
- Brain provider/config tabs;
- Session Context;
- Trainer;
- raw runtime IDs / worker command IDs / tokens / provider labels.

Allowed normal-game replacements:

- small Clover/Foreman drawer trigger;
- one-line Clover receipt;
- approval badge;
- friendly restart/pause truth.

Debug surfaces may still exist if explicit debug mode is enabled through `?debug=1`, local dev flag, or authenticated developer route.

### Suggested files

```text
public/app.js
public/index.html
public/experiences/founders-plot/app.js
public/experiences/founders-plot/styles.css
Brand kit/guidelines/agent-town-design-pack/GAME_UX.md
Brand kit/guidelines/agent-town-design-pack/DESIGN.md
```

### Tests

Add or update:

```text
e2e/162_founders_plot_full_route_player_surface.spec.js
```

Assertions:

- normal route does not contain visible text: `Agent Comms`, `Worker Tools`, `Skill Context`, `Worker Traffic`, `Brain`, `Session Context`, `Trainer`;
- debug route with explicit debug flag may show them;
- normal full-route screenshot baseline at 1280 and 390 has no large debug panel.

### Metrics

```text
NormalSurfaceDebugJargonCount = 0
NormalSurfaceDebugPanelVisible = false
FullRouteScreenshotCoverage = true
```

---

## WP2 — Art-direction and canonical hero frame

### Goal

Raise the visual asset pack and default scene composition to flagship frontier-storybook quality.

### Required behavior

Create a canonical hero frame from the actual app route, not Figma.

Required screenshot:

```text
e2e/.../snapshots/founders-v1-3-1-hero-1280.png
```

The frame must show:

- dominant scenic stage;
- richer background/object composition;
- approved HQ / lot / Clover primary assets;
- one objective-relevant object;
- no debug UI;
- no placeholder-looking primary-view assets.

### Asset manifest update

Extend asset entries with:

```json
{
  "approvalStatus": "draft|needs_revision|approved",
  "approvedBy": "name-or-handle|null",
  "approvedAt": "YYYY-MM-DD|null",
  "approvalNotes": "short note"
}
```

Primary-view assets must be `approved` for final signoff.

### Suggested files

```text
public/experiences/founders-plot/assets/asset-manifest.json
public/experiences/founders-plot/assets/**
public/experiences/founders-plot/styles.css
scripts/validate_founders_plot_assets.mjs
Brand kit/guidelines/agent-town-design-pack/BRAND.md
Brand kit/guidelines/agent-town-design-pack/DESIGN.md
```

### Tests

Add or update:

```text
e2e/163_founders_plot_art_signoff_manifest.spec.js
```

Assertions:

- every `usage: primary-view` asset has approval metadata;
- no `primary-view` asset has `approvalStatus !== "approved"` in signoff mode;
- hero screenshot exists;
- asset validator fails on missing approval fields.

### Metrics

```text
PrimaryViewAssetApprovalCoverage = 100%
PrimaryViewAssetDraftCount = 0
HeroFrameApproved = true
AssetManifestValid = true
```

---

## WP3 — Clover `ACTING` target linkage

### Goal

Clover should not merely display an acting state; Clover should visibly act on a specific world object.

### Required behavior

When the Foreman action targets an object, scene state must expose the target:

```ts
type CloverSceneState = {
  state: "idle" | "observing" | "thinking" | "acting" | "waiting-approval" | "paused" | "needs-restart";
  actionVerb?: string;
  targetObjectId?: string;
  targetLabel?: string;
};
```

Renderer must show one target-link treatment:

- Clover re-anchors near target;
- visible path/gesture line/arrow/footprints/dust trail;
- synchronized Clover + target action effect;
- equivalent approved treatment.

Required test hooks or equivalent:

```html
<div data-testid="clover-foreman" data-state="acting" data-target-object-id="farm-plot-1">
<div data-testid="clover-target-link" data-target-object-id="farm-plot-1">
```

Accessible text example:

> “Clover is collecting from the Farm Plot.”

### Suggested files

```text
public/experiences/founders-plot/scene_state.js
public/experiences/founders-plot/scene_render.js
public/experiences/founders-plot/effects.js
public/experiences/founders-plot/styles.css
Brand kit/guidelines/agent-town-design-pack/DESIGN.md
Brand kit/guidelines/agent-town-design-pack/GAME_UX.md
Brand kit/guidelines/agent-town-design-pack/REGISTRY.md
```

### Tests

Add or update:

```text
e2e/164_founders_plot_clover_target_link.spec.js
```

Assertions:

- Foreman acting state includes target object id;
- target-link element exists;
- target object gets action-linked state/effect;
- accessible label includes action and target;
- reduced motion still shows non-motion target relationship.

### Metrics

```text
CloverActingTargetLinkCoverage = 100%
CloverActingAccessibleTargetCoverage = 100%
ReducedMotionTargetLinkCoverage = 100%
```

---

## WP4 — Mobile hierarchy and label suppression

### Goal

Mobile should feel like a game scene, not an annotated map.

### Required behavior

At widths <= 430px:

- hide nonessential object labels by default;
- allow selected object label;
- allow objective-relevant object label;
- use icons/badges for ready/blocked/producing states;
- move details into objective ribbon and bottom sheet;
- keep visible stage labels <= 3;
- target visible word count <= 65, hard max <= 80.

### Suggested files

```text
public/experiences/founders-plot/scene_render.js
public/experiences/founders-plot/styles.css
public/experiences/founders-plot/visual_metrics.js
Brand kit/guidelines/agent-town-design-pack/DESIGN.md
Brand kit/guidelines/agent-town-design-pack/GAME_UX.md
Brand kit/guidelines/agent-town-design-pack/REGISTRY.md
```

### Tests

Add or update:

```text
e2e/165_founders_plot_mobile_label_density.spec.js
```

Assertions:

- at 390px, visible stage labels <= 3;
- default visible word count <= 80;
- no label overlap detected through bounding boxes;
- selected object label appears after selection;
- objective-relevant label may appear;
- non-recommended available lot labels remain hidden/muted.

### Metrics

```text
MobileDefaultVisibleWords <= 80
MobileTargetVisibleWords <= 65
MobileVisibleStageLabels <= 3
MobileLabelOverlapCount = 0
```

---

## WP5 — Objective-relevant lot emphasis

### Goal

When multiple lots are buildable, the player still sees one next action.

### Required behavior

Scene state must distinguish:

```ts
type AttentionLevel = "none" | "available" | "recommended" | "blocked";
```

Only one world object may be `recommended` by default.

Other legal buildable lots should remain available but visually quieter.

The resolver should consider:

1. current tutorial/quest blocker;
2. active contract requirement;
3. ready turn-in / critical production need;
4. Foreman suggestion only if aligned with higher-priority goal.

### Suggested files

```text
public/experiences/founders-plot/scene_state.js
public/experiences/founders-plot/scene_render.js
public/experiences/founders-plot/styles.css
public/experiences/founders-plot/visual_metrics.js
Brand kit/guidelines/agent-town-design-pack/GAME_UX.md
```

### Tests

Add or update:

```text
e2e/166_founders_plot_goal_relevant_lot_emphasis.spec.js
```

Assertions:

- with multiple buildable lots, exactly one has `data-attention="recommended"`;
- other buildable lots are `data-attention="available"` or lower;
- objective ribbon names the recommended object;
- primary CTA references the recommended object;
- Clover suggestion does not contradict the recommendation.

### Metrics

```text
RecommendedObjectCount = 1
AttentionCTAAlignment = 100%
NonRecommendedStrongAttentionCount = 0
```

---

## WP6 — Badge and signal density cleanup

### Goal

Prevent badges/pills from pulling the scene back toward dashboard territory.

### Required behavior

Per object:

- desktop max visible badges: 2;
- mobile max visible badges: 1 unless selected;
- additional state goes to selected-object sheet/tooltip;
- badge priority: blocked > ready > producing/timer > upgradeable > available.

### Tests

Can be part of:

```text
e2e/165_founders_plot_mobile_label_density.spec.js
```

or separate:

```text
e2e/167_founders_plot_badge_stack_governor.spec.js
```

### Metrics

```text
ObjectBadgeMaxDesktop <= 2
ObjectBadgeMaxMobile <= 1 unless selected
BadgePriorityOrderValid = true
```

---

## WP7 — OpenRouter/proxy scope quarantine

### Goal

Keep V1.3.1 visual signoff review clean.

### Required behavior

Preferred: split OpenRouter/proxy work into its own PR/branch.

If not split, add:

```text
specs/OPENROUTER_SCOPE_QUARANTINE.md
```

Required contents:

```md
# OpenRouter Scope Quarantine

## Why this is present
## Files changed
## Owner
## Reviewer / signoff
## Tests run
## Impact on Founders Plot visual signoff
## Rollback plan
```

### Tests

Add simple guard:

```text
e2e/168_founders_plot_scope_quarantine.spec.js
```

or script:

```text
scripts/check_v13_scope_quarantine.mjs
```

Assertions:

- if OpenRouter/proxy paths changed in the branch, quarantine doc exists;
- quarantine doc names owner/reviewer;
- visual tests do not depend on OpenRouter/proxy changes.

### Metrics

```text
UnquarantinedOpenRouterScope = 0
ScopeQuarantineDocPresent = true when needed
```

---

## WP8 — Registry and stale-doc cleanup

### Goal

Ensure future coding agents inherit the V1.3.1 rules from the correct durable docs.

### Required updates

Update design-governance docs:

```text
AGENTS.md
Brand kit/guidelines/agent-town-design-pack/BRAND.md
Brand kit/guidelines/agent-town-design-pack/DESIGN.md
Brand kit/guidelines/agent-town-design-pack/GAME_UX.md
Brand kit/guidelines/agent-town-design-pack/REGISTRY.md
```

Add registry items/contracts for:

- `hero-frame-baseline`;
- `clover-target-link`;
- `objective-attention-ring`;
- `mobile-label-controller`;
- `badge-stack-governor`;
- `devtools-quarantine-toggle`.

Update or explicitly retire stale docs such as `IMPLEMENTATION_PLAN.md` if they still describe Portal as only a minimal landing page or omit Founders Plot.

### Tests

Add or update a docs presence test if the repo has docs validation:

```text
e2e/169_founders_plot_design_docs_v13_1.spec.js
```

Assertions:

- design docs contain V1.3.1 addenda;
- AGENTS links to design docs;
- registry lists required V1.3.1 items;
- stale `IMPLEMENTATION_PLAN.md` does not contradict current product identity, or has a deprecation note.

---

## 6. Required test matrix

| ID | Area | Test name | Required metric |
|---|---|---|---|
| T1 | Full route | `162_founders_plot_full_route_player_surface.spec.js` | `NormalSurfaceDebugJargonCount = 0` |
| T2 | Full route | same | `NormalSurfaceDebugPanelVisible = false` |
| T3 | Art signoff | `163_founders_plot_art_signoff_manifest.spec.js` | `PrimaryViewAssetApprovalCoverage = 100%` |
| T4 | Art signoff | same | `HeroFrameApproved = true` |
| T5 | Clover | `164_founders_plot_clover_target_link.spec.js` | `CloverActingTargetLinkCoverage = 100%` |
| T6 | Mobile | `165_founders_plot_mobile_label_density.spec.js` | `MobileVisibleStageLabels <= 3` |
| T7 | Mobile | same | `MobileDefaultVisibleWords <= 80` |
| T8 | Goal emphasis | `166_founders_plot_goal_relevant_lot_emphasis.spec.js` | `RecommendedObjectCount = 1` |
| T9 | Badges | `167_founders_plot_badge_stack_governor.spec.js` | `ObjectBadgeMaxMobile <= 1 unless selected` |
| T10 | Scope | `168_founders_plot_scope_quarantine.spec.js` or script | `UnquarantinedOpenRouterScope = 0` |
| T11 | Docs | `169_founders_plot_design_docs_v13_1.spec.js` | required addenda present |
| T12 | Regression | existing V1.2/V1.3 tests | no failures |

---

## 7. Definition of done

V1.3.1 is done when:

- all P0 gates pass;
- full-route normal gameplay screenshots look like a game, not a debug console;
- canonical hero frame approved by named design/art owner;
- all primary-view assets approved in manifest;
- Clover acting has a target-linked visual treatment;
- mobile labels are suppressed and stage breathes;
- only objective-relevant lot gets strong attention by default;
- OpenRouter/proxy scope split or quarantined;
- updated `BRAND.md`, `DESIGN.md`, `GAME_UX.md`, `REGISTRY.md`, and `AGENTS.md` are committed;
- existing V1.2/V1.3 gameplay/runtime tests remain green;
- no new gameplay systems were added.

---

## 8. Machine-readable planning summary

```yaml
spec_id: agent-town-founders-plot-v1.3.1-visual-signoff-pass
version: v1.3.1
sprint_type: focused_polish_signoff
product: Agent Town
chapter: Founders Plot
must_preserve:
  - scene_first_architecture
  - visual_state_adapter_renderer_effects_metrics_split
  - clover_visible_in_world
  - v1_2_gameplay_runtime_behavior
  - restart_runtime_truth
p0_work_packages:
  - full_route_player_surface_quarantine
  - art_direction_and_canonical_hero_frame
  - clover_acting_target_linkage
  - mobile_label_density_cleanup
  - objective_relevant_lot_emphasis
  - badge_signal_density_cleanup
  - openrouter_proxy_scope_quarantine
  - registry_and_stale_doc_cleanup
explicit_non_goals:
  - new_gameplay_systems
  - persistent_off_session_foreman
  - doctrine_board
  - new_resources_or_contracts
  - shell_rewrite
  - pixi_or_phaser_rewrite
primary_metrics:
  NormalSurfaceDebugJargonCount: 0
  PrimaryViewAssetApprovalCoverage: "100%"
  CloverActingTargetLinkCoverage: "100%"
  MobileVisibleStageLabels: "<=3"
  MobileDefaultVisibleWords: "<=80"
  RecommendedObjectCount: 1
  UnquarantinedOpenRouterScope: 0
```
