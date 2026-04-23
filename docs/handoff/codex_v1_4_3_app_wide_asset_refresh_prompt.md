# Codex / GPT-5.4 Handoff Prompt — Agent Town V1.4.3 App-Wide GPT Image 2 Asset Refresh

You are implementing the attached spec:

`specs/35_agent_town_v1_4_3_app_wide_gpt_image2_asset_refresh.md`

Use GPT-5.4 Extra High reasoning for planning and implementation. Use Codex built-in image generation / `$imagegen` with `gpt-image-2` for controlled asset generation where needed.

## Mandatory read order

1. `AGENTS.md`
2. `BRAND.md` or `Brand kit/guidelines/agent-town-design-pack/BRAND.md`
3. `DESIGN.md` or `Brand kit/guidelines/agent-town-design-pack/DESIGN.md`
4. `GAME_UX.md` or `Brand kit/guidelines/agent-town-design-pack/GAME_UX.md`
5. `REGISTRY.md` or `Brand kit/guidelines/agent-town-design-pack/REGISTRY.md`
6. `docs/visual/VISUAL_SIGNOFF_SHEET_V1_4_2.md`
7. `docs/visual/SCENE_LAYERING_DECISION_V1_4_2.md`
8. `specs/35_agent_town_v1_4_3_app_wide_gpt_image2_asset_refresh.md`
9. `specs/36_agent_town_v1_4_3_tdd_acceptance_matrix.md`

## Objective

Upgrade the rest of Agent Town’s app assets so the entire app feels coherent with the new GPT Image 2 Founders Plot art baseline.

Do not change gameplay systems.

## Plan-first requirement

Before editing files, produce a concise plan containing:

- asset inventory strategy;
- target surfaces;
- prompt files to create;
- assets to generate;
- candidate folder strategy;
- production integration strategy;
- tests to add/update;
- screenshots to capture;
- risks.

## Required workflow

1. Inventory assets.
2. Create prompt files.
3. Generate candidates.
4. Select candidates.
5. Integrate selected production assets.
6. Update manifests.
7. Update design docs.
8. Capture screenshots.
9. Run tests.
10. Complete signoff sheet.

## Hard rules

- Prompts are source files.
- No production generated image without prompt + manifest entry.
- No orphan production assets.
- No new gameplay systems.
- Do not reopen accepted Founders Plot gameplay art unless required by the latest Patch 2 spec.
- Keep the owner-approved `WARNING! CONTAINS AND PRODUCES AI SLOP.` copy.
- Normal routes must not expose worker/provider/runtime/debug visuals.
- Human signoff must be recorded before final acceptance.

## Final report must include

- inventory summary;
- generated asset list;
- prompt files added;
- production assets replaced;
- old assets retired or rollback paths;
- manifest status;
- screenshots captured;
- tests run and results;
- signoff status;
- any unresolved caveats.
