# Codex Task — Agent Town V1.4.2 GPT Image 2 Full Asset Rebuild

You are implementing the attached specification:

`specs/29_founders_plot_v1_4_2_gpt_image_2_full_asset_rebuild.md`

Use GPT-5.4 Extra High thinking.

## Read order

Before editing files, read:

1. `AGENTS.md`
2. `BRAND.md`
3. `DESIGN.md`
4. `GAME_UX.md`
5. `REGISTRY.md`
6. `specs/29_founders_plot_v1_4_2_gpt_image_2_full_asset_rebuild.md`
7. `specs/30_founders_plot_v1_4_2_tdd_acceptance_matrix.md`
8. `docs/visual/GPT_IMAGE_2_PROMPT_LIBRARY_V1_4_2.md`
9. `docs/visual/ASSET_MANIFEST_SCHEMA_V1_4_2.md`

## Objective

Use Codex-accessible GPT Image 2 / `gpt-image-2` to rebuild the player-facing visual assets of Agent Town and Founders Plot through a governed prompt/manifest/screenshot/signoff pipeline.

The output must make the actual product routes look more like a launch-grade warm frontier game, while preserving V1 gameplay behavior.

## Do not expand scope

Do not add:

- new gameplay systems;
- new resource/economy rules;
- new contracts;
- persistent/off-session Foreman;
- doctrine board;
- specialist agents;
- social sharing;
- token economy;
- renderer rewrite;
- hero-cast gameplay cameos.

## Implementation plan first

Before coding, produce a concise plan:

- current asset inventory approach;
- target assets to regenerate;
- prompt files to create;
- generation mode: Codex built-in vs API batch;
- manifest changes;
- integration files;
- tests;
- screenshots;
- risks.

## Generation rules

- Create prompt files before generating assets.
- Do not generate directly into production paths.
- Use candidate folders first.
- Record all generation metadata.
- Use reference images supplied in `docs/brand/reference/`.
- Do not request transparent output from GPT Image 2; post-process sprite-like assets.
- Do not rely on embedded image text.
- Evaluate assets inside actual routes.

## Required final report

Your final implementation report must include:

1. summary of visual changes;
2. files changed;
3. generated asset list;
4. prompt files added;
5. manifest changes;
6. reference inputs used;
7. post-processing steps;
8. tests added/updated;
9. commands run;
10. screenshots captured;
11. known limitations;
12. confirmation that no new gameplay systems were added.
