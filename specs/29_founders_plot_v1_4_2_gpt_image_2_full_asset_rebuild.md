# Agent Town: Founders Plot V1.4.2 — GPT Image 2 Full Asset Rebuild Specification

**Status:** implementation-ready sprint specification  
**Date:** 2026-04-22  
**Applies after:** V1.4 AI Reality branch and V1.4.1 Hero Cast addendum branch  
**Primary audience:** Codex / GPT-5.4 Extra High implementation agents, frontend engineers, product/design QA, art-direction owner  
**Sprint type:** visual production + asset-governance sprint  
**Branch suggestion:** `codex/founders-plot-v1-4-2-gpt-image-2-assets`

---

## 0. Executive summary

V1.4 focused on making Clover/the Foreman actually participate through the OpenClaw Lite + LLM/Test Brain path. V1.4.1 recovered the hero-cast source material and preserved the product boundary: **Clover is the gameplay partner; the Lobster / Chibi Homesteader / Wizard Kid / Prairie Dog Ranger are the platform hero ensemble.**

V1.4.2 is the visual production sprint that uses **GPT Image 2 / `gpt-image-2` through Codex** to rebuild the platform’s player-facing visual assets in a governed, repeatable way.

This sprint must not become a vague “make it prettier” pass. It must establish a reproducible asset pipeline:

```text
Design docs + reference images
→ versioned prompt files
→ Codex / GPT Image 2 generation
→ candidate folders
→ manifest provenance
→ human art-owner signoff
→ optimized production assets
→ integration into actual routes
→ screenshot baselines
→ tests proving no legacy placeholder art remains in normal gameplay
```

The goal is not merely nicer files. The goal is a **future-upgradable visual asset system** where prompts, references, outputs, approvals, and replacements are all traceable.

---

## 1. Why this sprint exists

The current V1.3/V1.3.1 visual work moved Founders Plot from dashboard to stage-first game surface, but reviews still found the art quality closer to a polished prototype than a launch-grade game. The QA research concluded that the gap is not raw coding power; it is a combination of visual brief, reference quality, asset consistency, screenshot review, and human signoff discipline.

GPT Image 2 changes the practical production options. Because the current assets are AI-created and Codex can use GPT Image 2 directly, the team can rebuild the player-facing asset library from a proper prompt system instead of hand-polishing weak placeholder assets one by one.

The new Google `design.md` format is useful as process inspiration: design must be machine-readable enough for coding agents, but still contain human-readable rationale. Agent Town should adopt that discipline by making `DESIGN.md` tokenized, lintable, and explicit about asset-generation law.

---

## 2. Product thesis to preserve

**Agent Town** is the masterbrand.  
**Founders Plot** is the launch chapter / starting campaign.  
The player fantasy remains:

> I am founding a warm frontier town with an AI partner, and over time I teach it how to run by my rules.

V1.4.2 must strengthen the “real game” impression without widening gameplay scope.

---

## 3. Source-of-truth documents to update

This sprint must update these repo docs, not create design rules only inside the sprint spec:

- `AGENTS.md`
- `BRAND.md`
- `DESIGN.md`
- `GAME_UX.md`
- `REGISTRY.md`
- `specs/29_founders_plot_v1_4_2_gpt_image_2_full_asset_rebuild.md`
- `specs/30_founders_plot_v1_4_2_tdd_acceptance_matrix.md`
- `docs/visual/GPT_IMAGE_2_PROMPT_LIBRARY_V1_4_2.md`
- `docs/visual/ASSET_MANIFEST_SCHEMA_V1_4_2.md`
- `docs/visual/VISUAL_SIGNOFF_SHEET_V1_4_2.md`
- `docs/brand/HERO_CAST_AND_VIDEO_SOURCE_ADDENDUM_V1_4_1.md` if the repo has it
- `public/experiences/founders-plot/assets/asset-manifest.json`

Prompts are durable source. They must live in `specs/prompts/v1_4_2/` and/or the asset prompt folder, not only in a chat transcript.

---

## 4. Current assumptions

1. Codex can call image generation with GPT Image 2.
2. Larger asset batches may be generated through the API when `OPENAI_API_KEY` is configured by the developer environment.
3. GPT Image 2 currently does not support transparent output backgrounds, so sprite-like assets require controlled background generation plus post-processing / masking.
4. Prompt, input references, model, date, candidate id, post-processing, and human approval must be recorded in the manifest.
5. Generated image quality must be judged in the real app route, not only as isolated images.

### 4.1 Composition-first production rule

When a full-view render is too brittle for reliable route integration, V1.4.2 may promote production gameplay art from smaller compositional sheets instead of regenerating every screen as one monolithic image.

That means the implementation may:

- keep full-scene renders for the main Founders Plot background;
- use separate building/object/Clover sheet assets as the production source for crop-based promotion;
- document the crop provenance in the asset manifest through `candidatePath`, `candidateId`, hashes, and prompt files.

This is the preferred fallback because it preserves visual direction while making later asset replacement and stage alignment more deterministic.

---

## 5. P0 scope

### 5.1 Design-doc modernization

Implement the updated docs in this pack:

- `DESIGN.md` must follow the Google-style structure:
  - YAML front matter with machine-readable tokens.
  - Markdown body with rationale and rules.
- `BRAND.md` must name the hero cast as recovered brand/platform ensemble, not Founders Plot default gameplay actors.
- `GAME_UX.md` must define the asset-rebuild acceptance rules from the player’s perspective.
- `REGISTRY.md` must define asset-related registry items and contracts.
- `AGENTS.md` must route coding agents to these docs and specify the GPT Image 2 workflow.

### 5.2 Asset inventory and classification

Create or update an inventory file:

```text
docs/visual/ASSET_INVENTORY_V1_4_2.md
```

Every player-facing visual asset must be classified:

```text
KEEP_AS_REFERENCE
REGENERATE_P0
REGENERATE_P1
DEPRECATE_AFTER_REPLACEMENT
DEBUG_ONLY
DO_NOT_TOUCH
```

The inventory must cover at least:

- global platform / Portal shell art;
- Agent Town hub / town shell art;
- Founders Plot scene art;
- Founders Plot building/object art;
- Clover pose art;
- hero-cast source art;
- UI ornaments and badges;
- resource icons;
- onboarding / Town Hall / Brain / Sigil art;
- legacy assets still referenced by normal player-facing routes.

### 5.3 Rebuild P0 player-facing assets

The sprint must regenerate and integrate production replacements for these P0 groups:

#### Group A — Founders Plot scene assets

- desktop hero/stage background;
- mobile hero/stage crop/background;
- optional tablet crop if separate composition is needed;
- quiet ambient overlay elements, if implemented as separate assets.

#### Group B — Founders Plot buildings and civic objects

- HQ level 1;
- HQ level 2;
- HQ level 3 placeholder/future-safe if visible in current progression;
- Lumber Camp;
- Farm Plot;
- Quarry;
- Workshop;
- Market Stall;
- Contract Board;
- Public Square / Welcome Sign;
- Foreman Hut / Clover workspace;
- Town Journal trigger;
- Approval Inbox / town-bell trigger;
- empty buildable lot;
- locked lot / future lot.

#### Group C — Clover gameplay poses

- idle;
- observing/thinking;
- acting toward target;
- waiting for approval;
- blocked / needs restart;
- celebrating completed contract.

Clover must remain the Founders Plot gameplay partner. The hero-cast ensemble must not replace Clover in the default plot loop.

#### Group D — UI ornaments and iconography

- wood;
- stone;
- food;
- coin;
- XP / level;
- contract ready;
- output ready;
- blocked;
- approval pending;
- scheduler / heartbeat active;
- recap / journal;
- resource flyout shape;
- timer ring material frame.

#### Group E — Platform shell / onboarding visual refresh

Only replace art assets, not flow architecture:

- Start Gate hero image / background;
- Start Gate cast rail / brand portraits using the four normalized hero-cast singles;
- town hub / district-map visual background if still using placeholder art;
- Town Hall onboarding illustration assets;
- Brain Connect friendly visual marker;
- Sigil ritual visual marker;
- modal frame ornaments if still inconsistent with new style.

#### Group F — Hero-cast platform ensemble normalization

Generate style-normalized versions of:

- Prairie Dog Ranger;
- Sheriff Lobster;
- Chibi Homesteader Girl;
- Wizard Kid.

These are for brand/marketing/onboarding/loading/future platform identity only. They must not appear by default on the Founders Plot gameplay route unless a later spec explicitly adds them.

### 5.4 Prompt storage

Every production asset must have a prompt file under:

```text
specs/prompts/v1_4_2/<asset-id>.md
```

The prompt file is part of the asset source. It must include:

```yaml
---
assetId: founders_plot_hq_lv1_v1_4_2
assetGroup: founders_plot_building
model: gpt-image-2
generationMode: codex_builtin_or_api
promptVersion: v1.4.2
referenceInputs:
  - docs/brand/reference/platform/agenttown-visual-reference.jpeg
outputTargets:
  - public/experiences/founders-plot/assets/buildings/hq-lv1.webp
requiresPostProcessing: true
humanArtOwner: TBD
status: draft|candidate|approved|rejected
---
```

Then markdown sections:

```text
## Intent
## Reference inputs
## Positive prompt
## Negative prompt
## Output requirements
## Post-processing notes
## Acceptance checks
## Rejection reasons
```

### 5.5 Asset manifest provenance

Update the asset manifest to record:

- asset id;
- asset role;
- path;
- status;
- generator model;
- prompt file path;
- prompt hash;
- reference input paths and hashes;
- candidate id;
- post-processing steps;
- dimensions;
- byte size;
- alt text / accessible label if applicable;
- approved by;
- approved at;
- approval notes;
- replacement target / legacy path.

### 5.6 Screenshot signoff

Capture and commit screenshot baselines for:

- Founders Plot full route desktop `1280x800`;
- Founders Plot full route mobile `390x844`;
- Founders Plot selected building state `1280x800`;
- Founders Plot Clover acting state `1280x800`;
- Start Gate desktop;
- Town shell / hub desktop;
- Town Hall onboarding first step;
- Brain Connect default collapsed state;
- hero-cast platform showcase or marketing preview, if such a route exists or is added as a static review page.

Screenshots are the signoff surface. Isolated asset beauty is not enough.

---

## 6. P1 scope

P1 work may be included only after P0 is green:

- seasonal/alternate variants;
- richer ambient scene elements;
- second/third candidate style packs retained as rejected-but-documented references;
- marketing key art using the hero cast;
- loading screen / interstitial variants;
- refined video-frame-inspired compositions, but no required video extraction.

---

## 7. Explicit non-goals

Do not add in this sprint:

- new gameplay systems;
- new resources or buildings beyond asset replacements;
- new contract types;
- persistent/off-session Foreman;
- doctrine board;
- specialist Foremen;
- social sharing;
- token economy;
- new OpenClaw runtime architecture;
- Pixi/Phaser/canvas rewrite;
- AI-generated mechanics;
- automatic committing of unreviewed generated asset dumps;
- use of hero-cast characters as default Founders Plot actors.

---

## 8. Style target

The target style is:

> warm frontier storybook / soft-3D collectible game art, with tactile materials, readable silhouettes, cozy civic optimism, and clear object-level gameplay affordances.

The target must not become:

- strict historical Western realism;
- cowboy parody;
- cyberpunk;
- generic mobile idle-game clutter;
- flat SaaS illustration;
- arbitrary fantasy RPG;
- pixel art;
- photorealistic UI background collage;
- text-heavy image assets.

### 8.1 Stage annotation restraint

The scenic surface must stay readable without turning into a field of permanent labels or speech bubbles.

Default rule:

- stage-object labels are hidden until hover, focus, or selection;
- the current recommended next object may surface its label without user hover if needed for wayfinding;
- Clover's helper bubble stays hidden in idle/non-urgent states and only appears on hover/focus or when Clover is actively doing something, waiting for approval, blocked, celebrating, or needs restart.

This is a presentation rule, not a gameplay rule. The information still needs to remain available through selection sheets, drawers, keyboard focus, and urgent-state surfacing.

---

## 9. GPT Image 2 production workflow

### 9.1 Candidate creation

For each P0 asset group, produce at least **three candidate directions** unless the art owner explicitly waives this.

Candidate directories:

```text
public/experiences/founders-plot/assets/candidates/v1_4_2/<asset-group>/<candidate-id>/
```

Production assets move to the canonical asset paths only after approval.

### 9.2 Codex built-in generation mode

Codex may be prompted directly with `$imagegen` or natural language image-generation requests.

Use this mode for:

- small batches;
- reference-guided iterations;
- quick replacement candidates;
- images that need to be discussed in the same code thread.

### 9.3 API batch mode

For larger batches, the developer may use the Image API through `OPENAI_API_KEY` in the environment. API-generated outputs must still use the same prompt files and manifest schema.

### 9.4 Reference image rules

Approved source references:

- current platform/town visual reference image;
- current logo reference;
- four supplied hero-cast source images;
- existing Founders Plot screenshots for composition only;
- internally generated candidates from earlier rounds if provenance exists.

Do not train on or directly imitate copyrighted game art. Use external references only as principle-level references in mood boards, not as production style inputs unless rights are clear.

### 9.5 Post-processing

Because `gpt-image-2` does not support transparent backgrounds, every sprite-like asset must go through post-processing:

- remove clean background / mask;
- crop to safe bounding box;
- export WebP/PNG as appropriate;
- verify transparent or game-ready background if required;
- compress;
- record post-processing in the manifest.

---

## 10. Required files and folders

Add or update:

```text
AGENTS.md
BRAND.md
DESIGN.md
GAME_UX.md
REGISTRY.md
specs/29_founders_plot_v1_4_2_gpt_image_2_full_asset_rebuild.md
specs/30_founders_plot_v1_4_2_tdd_acceptance_matrix.md
specs/prompts/v1_4_2/*.md
docs/visual/ASSET_INVENTORY_V1_4_2.md
docs/visual/GPT_IMAGE_2_PROMPT_LIBRARY_V1_4_2.md
docs/visual/ASSET_MANIFEST_SCHEMA_V1_4_2.md
docs/visual/VISUAL_SIGNOFF_SHEET_V1_4_2.md
docs/visual/GOOGLE_DESIGN_MD_ADAPTATION_NOTES_V1_4_2.md
docs/brand/HERO_CAST_AND_VIDEO_SOURCE_ADDENDUM_V1_4_1.md
docs/brand/reference/hero-cast/*
docs/brand/reference/platform/*
public/experiences/founders-plot/assets/asset-manifest.json
public/experiences/founders-plot/assets/**
```

Add tests as described in the TDD matrix.

---

## 11. Asset list: P0 production targets

### 11.1 Founders Plot scene

| Asset id | Target path | Required? |
|---|---|---:|
| `founders_plot_scene_desktop_v1_4_2` | `public/experiences/founders-plot/assets/scenes/founders-plot-desktop.webp` | yes |
| `founders_plot_scene_mobile_v1_4_2` | `public/experiences/founders-plot/assets/scenes/founders-plot-mobile.webp` | yes |
| `founders_plot_scene_tablet_v1_4_2` | `public/experiences/founders-plot/assets/scenes/founders-plot-tablet.webp` | optional |

### 11.2 Founders Plot buildings

| Asset id | Target path |
|---|---|
| `founders_plot_hq_lv1_v1_4_2` | `assets/buildings/hq-lv1.webp` |
| `founders_plot_hq_lv2_v1_4_2` | `assets/buildings/hq-lv2.webp` |
| `founders_plot_hq_lv3_v1_4_2` | `assets/buildings/hq-lv3.webp` |
| `founders_plot_lumber_camp_v1_4_2` | `assets/buildings/lumber-camp.webp` |
| `founders_plot_farm_plot_v1_4_2` | `assets/buildings/farm-plot.webp` |
| `founders_plot_quarry_v1_4_2` | `assets/buildings/quarry.webp` |
| `founders_plot_workshop_v1_4_2` | `assets/buildings/workshop.webp` |
| `founders_plot_market_stall_v1_4_2` | `assets/buildings/market-stall.webp` |
| `founders_plot_contract_board_v1_4_2` | `assets/buildings/contract-board.webp` |
| `founders_plot_public_square_v1_4_2` | `assets/buildings/public-square.webp` |
| `founders_plot_foreman_hut_v1_4_2` | `assets/buildings/foreman-hut.webp` |
| `founders_plot_journal_trigger_v1_4_2` | `assets/buildings/town-journal.webp` |
| `founders_plot_approval_inbox_v1_4_2` | `assets/buildings/approval-inbox.webp` |
| `founders_plot_empty_lot_v1_4_2` | `assets/buildings/empty-lot.webp` |
| `founders_plot_locked_lot_v1_4_2` | `assets/buildings/locked-lot.webp` |

### 11.3 Clover poses

| Asset id | Target path |
|---|---|
| `clover_idle_v1_4_2` | `assets/characters/clover-idle.webp` |
| `clover_thinking_v1_4_2` | `assets/characters/clover-thinking.webp` |
| `clover_acting_v1_4_2` | `assets/characters/clover-acting.webp` |
| `clover_waiting_approval_v1_4_2` | `assets/characters/clover-waiting-approval.webp` |
| `clover_blocked_v1_4_2` | `assets/characters/clover-blocked.webp` |
| `clover_celebrating_v1_4_2` | `assets/characters/clover-celebrating.webp` |

### 11.4 Hero cast normalized platform assets

| Asset id | Target path |
|---|---|
| `hero_prairie_dog_ranger_v1_4_2` | `public/assets/hero-cast/prairie-dog-ranger.webp` |
| `hero_sheriff_lobster_v1_4_2` | `public/assets/hero-cast/sheriff-lobster.webp` |
| `hero_chibi_homesteader_v1_4_2` | `public/assets/hero-cast/chibi-homesteader.webp` |
| `hero_wizard_kid_v1_4_2` | `public/assets/hero-cast/wizard-kid.webp` |
| `hero_cast_group_key_art_v1_4_2` | `public/assets/hero-cast/hero-cast-group.webp` |

---

## 12. Core prompt system

Every prompt must be composed from these layers:

1. **Global style lock** — shared art direction.
2. **Asset role brief** — what the image must do in-game.
3. **Reference inputs** — owned/generated source references.
4. **Positive prompt** — visual target.
5. **Negative prompt** — what must not appear.
6. **Output requirements** — composition, size, background, silhouette, no text.
7. **Post-processing notes** — crop, background removal, compression.
8. **Acceptance checks** — in-game readability and manifest checks.

### 12.1 Global style lock

Use this as the base style for all production prompts:

```text
Warm frontier storybook game art for Agent Town. Soft-3D collectible feel with painterly texture, tactile wood, brass, parchment, sun-warmed clay, sage green, cream canvas, dusty golden light, readable silhouettes, cozy civic optimism, and gentle frontier adventure. Designed for a town-building game UI where objects must read clearly at small size. Polished, cohesive, family-friendly, hopeful, handcrafted, not pixel art, not photorealistic, not cyberpunk, not generic SaaS illustration, not cowboy parody.
```

### 12.2 Global negative prompt

```text
No pixel art. No photorealism. No cyberpunk. No grimdark. No horror. No guns as focal objects. No saloon vice imagery as the main theme. No busy mobile-game clutter. No hard-to-read tiny details. No text, letters, numbers, signage, logos, UI labels, watermarks, signatures, or typography inside the image unless the prompt explicitly requests abstract unreadable marks. No imitation of a specific commercial game or living artist. No inconsistent character identity. No extra limbs. No transparent-background request to GPT Image 2; generate on clean background for post-processing instead.
```

### 12.3 Founders Plot desktop scene prompt

```text
Create a launch-grade hero background for Agent Town: Founders Plot, a warm frontier town-builder game screen. The scene shows a small new settlement from a slightly elevated three-quarter view: a modest HQ cabin, buildable lots, a lumber camp area, a farm patch, a contract notice board, a small public square with a welcome sign, and a cozy foreman workspace. The composition must leave clear empty zones where interactive buildings can be placed by the UI. The eye should move from the current objective area to Clover's workspace to the central HQ. Warm dusty morning light, soft shadows, tactile wood and canvas, friendly civic optimism, storybook soft-3D collectible style, no text labels, no UI panels, no characters unless requested separately. The image should feel like a real game stage, not concept art wallpaper.
```

### 12.4 Clover pose prompt

```text
Create a consistent character pose sheet for Clover Kincaid, the trusted AI Foreman of Agent Town. Clover is warm, practical, intelligent, frontier-marshal inspired without being militaristic, carrying a small ledger or tool satchel, with friendly confident body language. Produce six consistent poses: idle, thinking with ledger, acting toward a building with one hand extended, waiting for approval with patient expression, blocked/needs help with a small concern gesture, and celebrating a finished contract. Warm frontier storybook soft-3D collectible style, readable silhouette at small game size, clean neutral background for later cutout, no text, no logo, no extra props that imply violence.
```

### 12.5 Building pack prompt

```text
Create a coherent asset pack of small frontier town-building objects for Agent Town: HQ cabin, Lumber Camp, Farm Plot, Quarry, Workshop, Market Stall, Contract Board, Public Square with Welcome Sign, Foreman Hut, Town Journal stand, Approval Inbox/Town Bell, Empty Buildable Lot, Locked Future Lot. Each object must have a clear readable silhouette, consistent camera angle, consistent lighting, and enough charm to feel collectible. Warm frontier storybook soft-3D game asset style, clean neutral background for later cutout, no text, no labels, no logos, no characters, no clutter.
```

### 12.6 Hero cast normalization prompt

```text
Using the supplied hero-cast reference image as identity inspiration, recreate this character in the unified Agent Town platform style: warm frontier storybook, soft-3D collectible, family-friendly, bright readable silhouette, expressive personality, polished game marketing asset. Preserve the character's core identity, costume motif, silhouette, and personality, but normalize lighting, material richness, proportions, and rendering style to match the Agent Town asset family. Clean neutral background, no text, no logo, no copyrighted style imitation.
```

The full prompt library lives in `docs/visual/GPT_IMAGE_2_PROMPT_LIBRARY_V1_4_2.md` and individual prompt files live in `specs/prompts/v1_4_2/`.

---

## 13. Implementation milestones

### Milestone 1 — Design source update

Deliver:

- updated `AGENTS.md`, `BRAND.md`, `DESIGN.md`, `GAME_UX.md`, `REGISTRY.md`;
- `DESIGN.md` uses YAML front matter tokens;
- Google `design.md` adaptation notes added.

Acceptance:

- docs are valid markdown;
- `DESIGN.md` can be linted with `@google/design.md` if installed;
- coding agents are routed to the correct docs before asset generation.

### Milestone 2 — Inventory and manifest hardening

Deliver:

- `ASSET_INVENTORY_V1_4_2.md`;
- updated manifest schema;
- script/test that validates manifest fields;
- all current player-facing assets classified.

Acceptance:

- `AssetInventoryCoverage = 100%` for known player-facing assets;
- `ManifestRequiredFieldCoverage = 100%` for generated production assets.

### Milestone 3 — Candidate generation

Deliver:

- candidate assets for all P0 asset groups;
- per-asset prompt files;
- candidate manifests;
- rejected candidates retained outside production path with notes.

Acceptance:

- `PromptFileCoverage = 100%`;
- no untracked generated files required to reproduce the review;
- generated candidates do not overwrite production assets before approval.

### Milestone 4 — Founders Plot production replacement

Deliver:

- integrated Founders Plot scenes, buildings, Clover poses, icons;
- CSS/JS references updated;
- old production assets moved to legacy or reference paths if still needed.

Acceptance:

- `LegacyPlayerFacingAssetUsage = 0` for assets classified `DEPRECATE_AFTER_REPLACEMENT`;
- screenshot baselines updated;
- no debug/provider/runtime UI appears in normal gameplay.

### Milestone 5 — Platform shell / onboarding production replacement

Deliver:

- Start Gate, Town Shell, Town Hall onboarding, Brain Connect, Sigil art refreshed where needed;
- the Start Gate uses the normalized hero-cast singles on a non-gameplay platform surface;
- no flow architecture changes;
- no new gameplay systems.

Acceptance:

- screenshots pass visual review;
- `NoGameplaySystemDiff = true` by review of changed files / tests.

### Milestone 6 — Hero cast normalized pack

Deliver:

- normalized hero-cast assets;
- group key art candidate;
- live platform usage for all four normalized hero portraits outside Founders Plot gameplay;
- route-level quarantine tests that hero-cast assets do not appear in default Founders Plot gameplay.

Acceptance:

- `HeroCastDefaultGameplayLeakCount = 0`;
- platform/marketing assets have provenance and approval state.

### Milestone 7 — Final signoff

Deliver:

- visual signoff sheet;
- final screenshot set;
- final implementation report;
- known limitations.

Acceptance:

- named human art owner approves or lists exact blockers;
- all P0 test gates pass.

---

## 14. Required tests and metrics

See `specs/30_founders_plot_v1_4_2_tdd_acceptance_matrix.md` for the detailed matrix.

Minimum metrics:

| Metric | Required value |
|---|---:|
| `PromptFileCoverage` | 100% |
| `AssetManifestCoverage` | 100% |
| `ReferenceHashCoverage` | 100% |
| `ProductionAssetApprovalCoverage` | 100% or explicitly `needs_human_signoff` |
| `LegacyPlayerFacingAssetUsage` | 0 for deprecated assets |
| `HeroCastDefaultGameplayLeakCount` | 0 |
| `NormalGameplayDebugJargonCount` | 0 |
| `ScreenshotBaselineCoverage` | 100% required states |
| `AssetBudgetViolationCount` | 0 unless waived in signoff |
| `ImageWithReadableTextCount` | 0 unless asset intentionally contains approved text |
| `UntrackedGeneratedAssetCount` | 0 |

---

## 15. Asset size and performance budgets

Production budgets after optimization:

| Asset type | Max bytes target | Hard fail over |
|---|---:|---:|
| desktop scene background | 900 KB | 1.3 MB |
| mobile scene background | 550 KB | 800 KB |
| tablet scene background | 700 KB | 1.0 MB |
| building/object sprite | 180 KB | 260 KB |
| Clover pose | 180 KB | 260 KB |
| resource/icon asset | 45 KB | 80 KB |
| hero-cast single character | 300 KB | 450 KB |
| hero-cast group art | 900 KB | 1.3 MB |
| Start Gate hero | 1.1 MB | 1.6 MB |

Use WebP where practical. Use SVG only for simple ornaments/icons that benefit from vectors. Do not ship raw multi-megabyte generation outputs in production paths.

---

## 16. Safety, licensing, and provenance

All generated assets must be recorded as project-generated, with prompt and reference provenance. Do not imitate a named living artist or a specific commercial game style. External mood references must be documented as inspiration/quality references only, not training or direct imitation sources.

The four supplied hero images are owner-supplied project references. The YouTube hero video is approved as tone/motion/story reference only; no frame extraction is required for this sprint.

---

## 17. Definition of Done

V1.4.2 is done when:

1. design docs are updated and route coding agents to the asset process;
2. every production image asset created or replaced in this sprint has a prompt file;
3. every production image asset has manifest provenance;
4. all P0 Founders Plot visual assets are regenerated or explicitly classified as `DO_NOT_TOUCH`;
5. platform shell/onboarding player-facing art is refreshed or explicitly classified;
6. hero-cast assets are normalized but quarantined from default Founders Plot gameplay;
7. screenshot baselines prove the actual routes look better, not only isolated assets;
8. the named art owner approves the final hero frame or marks clear blockers;
9. tests pass;
10. no new gameplay systems were introduced.

---

## 18. Machine-readable sprint summary

```yaml
specId: founders_plot_v1_4_2_gpt_image_2_full_asset_rebuild
product: Agent Town
chapter: Founders Plot
sprintType: visual_asset_rebuild
primaryModel: gpt-image-2
implementationTool: Codex
p0Goals:
  - update_design_docs_for_machine_readable_asset_governance
  - inventory_all_player_facing_assets
  - regenerate_p0_founders_plot_assets
  - regenerate_platform_shell_onboarding_assets_where_needed
  - normalize_hero_cast_as_platform_ensemble
  - store_prompts_as_versioned_source
  - record_manifest_provenance
  - integrate_and_screenshot_real_routes
nonGoals:
  - gameplay_systems
  - persistent_off_session_foreman
  - doctrine_board
  - specialist_foremen
  - social_layer
  - token_economy
  - renderer_rewrite
mustPreserve:
  - Agent_Town_masterbrand
  - Founders_Plot_launch_chapter
  - Clover_as_gameplay_foreman
  - hero_cast_as_platform_ensemble
  - server_authoritative_game_state
  - OpenClaw_Lite_worker_architecture
releaseGates:
  PromptFileCoverage: 1.0
  AssetManifestCoverage: 1.0
  LegacyPlayerFacingAssetUsage: 0
  HeroCastDefaultGameplayLeakCount: 0
  ScreenshotBaselineCoverage: 1.0
  NamedHumanArtSignoff: required
```
