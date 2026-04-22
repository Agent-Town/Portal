# Codex / GPT-5.4 Handoff Prompt — Founders Plot V1.4.2 Patch 2

You are implementing the attached spec:

`specs/33_founders_plot_v1_4_2_patch_2_mobile_calmness_and_hq_progression.md`

Use GPT-5.4 Extra High thinking.

## Read order

Before changing code, read:

1. `AGENTS.md`
2. `BRAND.md`
3. `DESIGN.md`
4. `GAME_UX.md`
5. `REGISTRY.md`
6. `docs/visual/VISUAL_SIGNOFF_SHEET_V1_4_2.md`
7. `docs/visual/SCENE_LAYERING_DECISION_V1_4_2.md`
8. `specs/31_founders_plot_v1_4_2_acceptance_cleanup.md`
9. `specs/32_founders_plot_v1_4_2_acceptance_cleanup_tdd_matrix.md`
10. `specs/33_founders_plot_v1_4_2_patch_2_mobile_calmness_and_hq_progression.md`
11. `specs/34_founders_plot_v1_4_2_patch_2_tdd_acceptance_matrix.md`

## Objective

Fix the two remaining visual signoff blockers:

1. mobile calmness / hierarchy at 390px;
2. HQ Level 1 / 3 / 5 progression readability at gameplay scale.

Do not reopen other scope.

## Locked decisions

- V1.4.2 GPT Image 2 art baseline is accepted by Robin/product owner.
- The `AI SLOP` Start Gate copy is intentional and must remain.
- Scene layering remains layered plates.
- Founders Plot gameplay must remain focused on the town, current objective, and Clover.
- Hero cast remains platform/marketing identity, not default Founders Plot gameplay.

## Do not add

- new gameplay systems;
- new resources;
- new contracts;
- persistent/off-session Foreman;
- doctrine board;
- specialist agents;
- social systems;
- new OpenClaw runtime architecture;
- hero-cast gameplay cameos;
- renderer rewrite;
- another full GPT Image 2 rebuild.

## Implementation plan first

Before coding, produce a concise implementation plan with:

1. current mobile label/chip audit;
2. current HQ asset/progression audit;
3. files to change;
4. tests to add/update;
5. screenshots to capture;
6. asset generation/editing plan if HQ assets need regeneration.

## Key implementation requirements

### Mobile calmness

At 390px default route:

- no repeated `Build here` labels;
- non-objective lots are quiet icon/stake markers;
- non-objective locked reasons are hidden until select;
- no clipped labels;
- no more than 3 persistent world labels;
- no more than 24 visible on-map words;
- only objective/recommended/selected/critical states may use text labels;
- target-area feedback stack is capped when Clover acts.

### HQ progression

HQ L1/L3/L5 must be visibly different at gameplay scale.

Do not rely on metadata, labels, or tiny accents. Use real asset differences in silhouette, footprint, roofline, props, and civic identity.

If assets are regenerated with GPT Image 2, store prompts under:

```text
specs/prompts/v1_4_2_patch_2/
public/experiences/founders-plot/assets/prompts/v1_4_2_patch_2/
```

Update asset manifest provenance.

## Required tests

Add or update tests for:

- mobile strict default calmness;
- mobile Clover acting calmness;
- HQ asset SHA uniqueness;
- HQ browser-canvas visual delta;
- HQ gameplay-scale gallery;
- no-label HQ gallery;
- signoff truth;
- AI SLOP copy preserved;
- debug chrome hidden;
- hero-cast quarantine preserved;
- scene-layering regression;
- no gameplay scope creep.

## Required screenshots

Capture and commit/link:

- mobile default 390px;
- mobile Clover acting 390px;
- HQ progression 1280px;
- HQ progression no-label 1280px;
- desktop regression 1280px.

## Final report

Your final implementation report must include:

1. mobile label/chip audit before and after;
2. screenshots and paths;
3. HQ asset paths and how they changed;
4. HQ visual-delta metrics;
5. prompts/provenance for new/edited assets;
6. design docs updated;
7. tests added/updated;
8. commands run and results;
9. confirmation that no gameplay/runtime scope was added;
10. remaining limitations, if any.

Begin by reading the docs and writing the plan.
