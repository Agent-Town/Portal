# Codex / GPT-5.4 Handoff Prompt — V1.4.2 Acceptance Cleanup

You are implementing the attached spec:

```text
specs/31_founders_plot_v1_4_2_acceptance_cleanup.md
```

Also read:

```text
specs/32_founders_plot_v1_4_2_acceptance_cleanup_tdd_matrix.md
docs/visual/VISUAL_SIGNOFF_SHEET_V1_4_2.md
docs/visual/SCENE_LAYERING_DECISION_V1_4_2.md
AGENTS.md
Brand kit/guidelines/agent-town-design-pack/DESIGN.md
Brand kit/guidelines/agent-town-design-pack/GAME_UX.md
Brand kit/guidelines/agent-town-design-pack/REGISTRY.md
```

## Objective

Perform a narrow V1.4.2 acceptance cleanup patch.

The GPT Image 2 art baseline is approved. Do not restart the asset rebuild. Improve how the approved assets integrate into the full route.

## Locked decisions

- Keep `WARNING! CONTAINS AND PRODUCES AI SLOP.` in the Start Gate.
- Mark V1.4.2 art baseline as product-owner-approved.
- Use layered plates for scenes.
- Keep hero cast out of default Founders Plot gameplay.
- Do not add new gameplay systems.

## Required implementation outcomes

1. Update visual signoff sheet with Robin's approval.
2. Preserve owner-approved AI SLOP copy.
3. Reduce overlay/pill noise.
4. Make mobile calmer and unclipped.
5. Make Clover grounded and target-linked without drawer open.
6. Make HQ Level 1/3/5 visually distinguishable.
7. Add scene-layer metadata and no-duplicate-live-object tests.
8. Reformat compressed markdown/design docs into readable Google-style DESIGN.md-compatible structure.
9. Add tests listed in the TDD matrix.
10. Preserve all existing V1.4/V1.4.2 behavior.

## Do not do

- Do not add persistent/off-session Foreman.
- Do not add doctrine, specialists, new contracts, new resources, social systems, token systems, or multiplayer.
- Do not remove the AI SLOP copy.
- Do not put hero-cast characters into the default plot.
- Do not hide state truth by baking live objects into background art.

## Final report required

Return:

1. files changed;
2. tests added/updated;
3. screenshots captured;
4. how scene layering is represented in manifest;
5. how Clover action is visible without drawer;
6. how mobile label density changed;
7. confirmation that AI SLOP copy remains;
8. confirmation that no new gameplay systems were added.
```
