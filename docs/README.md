# Agent Town Portal Docs

This docs set is designed for users who are new to local agents and model providers.

## Start here

- [Getting Started](/docs/getting-started.md)
- [Which Provider Should I Pick?](/docs/which-provider.md)
- [Providers Overview](/docs/providers/README.md)

## Product and design specs

- [Founders Plot Phase 1 spec](/specs/17_founders_plot_phase1.md)
- [Founders Plot V1.1 refined spec](/specs/18_founders_plot_v1_1_refined.md)
- [Founders Plot V1.1 TDD acceptance matrix](/specs/18_founders_plot_v1_1_tdd_acceptance_matrix.md)
- [Founders Plot V1.1 feedback resolution](/specs/18_founders_plot_v1_1_feedback_resolution.md)
- [Founders Plot future specs backlog](/specs/19_founders_plot_future_specs_backlog.md)
- [Founders Plot V1.2 living town spec](/specs/20_founders_plot_v1_2_living_town.md)
- [Founders Plot V1.2 hardening spec](/specs/21_founders_plot_v1_2_hardening.md)
- [Founders Plot V1.3 visual game-surface spec](/specs/22_founders_plot_v1_3_visual_game_surface.md)
- [Founders Plot V1.3.1 visual signoff pass](/specs/23_founders_plot_v1_3_1_visual_signoff_pass.md)
- [Founders Plot V1.3.1 TDD acceptance matrix](/specs/24_founders_plot_v1_3_1_tdd_acceptance_matrix.md)
- [Founders Plot V1.4 AI reality and visual direction pack](/specs/26_founders_plot_v1_4_ai_reality_and_visual_direction_pack.md)
- [Founders Plot V1.4 TDD acceptance matrix](/specs/27_founders_plot_v1_4_tdd_acceptance_matrix.md)
- [Founders Plot V1.4.1 hero-cast and video addendum](/specs/28_founders_plot_v1_4_1_hero_cast_video_addendum.md)
- [Founders Plot V1.4.1 TDD acceptance matrix](/specs/29_founders_plot_v1_4_1_tdd_acceptance_matrix.md)
- [Founders Plot V1.4.2 GPT Image 2 full asset rebuild spec](/specs/29_founders_plot_v1_4_2_gpt_image_2_full_asset_rebuild.md)
- [Founders Plot V1.4.2 TDD acceptance matrix](/specs/30_founders_plot_v1_4_2_tdd_acceptance_matrix.md)
- [Founders Plot V1.4.2 acceptance cleanup spec](/specs/31_founders_plot_v1_4_2_acceptance_cleanup.md)
- [Founders Plot V1.4.2 acceptance cleanup TDD matrix](/specs/32_founders_plot_v1_4_2_acceptance_cleanup_tdd_matrix.md)
- [Founders Plot V1.4.2 Patch 2 mobile calmness and HQ progression spec](/specs/33_founders_plot_v1_4_2_patch_2_mobile_calmness_and_hq_progression.md)
- [Founders Plot V1.4.2 Patch 2 TDD acceptance matrix](/specs/34_founders_plot_v1_4_2_patch_2_tdd_acceptance_matrix.md)
- [Agent Town design pack](/Brand%20kit/guidelines/agent-town-design-pack/README.md)
- [Agent Town V1.3 implementation start pack note](/docs/design/agent-town-v1.3-implementation-start-pack.md)
- [Agent Town V1.3.1 signoff pack note](/docs/design/agent-town-v1.3.1-signoff-pack.md)
- [Agent Town V1.4 AI reality + visual direction pack note](/docs/design/agent-town-v1.4-ai-reality-visual-direction-pack.md)
- [Agent Town V1.4.1 hero-cast addendum note](/docs/design/agent-town-v1.4.1-hero-cast-video-addendum.md)
- [Agent Town V1.4.2 GPT Image 2 pack note](/docs/design/agent-town-v1.4.2-gpt-image-2-full-asset-rebuild-pack.md)
- [Agent Town V1.4.2 acceptance cleanup pack note](/docs/design/agent-town-v1.4.2-acceptance-cleanup-pack.md)
- [Agent Town V1.4.2 Patch 2 mobile + HQ pack note](/docs/design/agent-town-v1.4.2-patch2-mobile-hq-pack.md)

## Founders Plot implementation note

The current implementation lane is driven by the V1.4 AI-reality documents in `specs/26_*` and `specs/27_*`, the V1.4.1 hero-cast addendum in `specs/28_*`, and the V1.4.2 GPT Image 2 asset-rebuild lane in `specs/29_founders_plot_v1_4_2_gpt_image_2_full_asset_rebuild.md` and `specs/30_founders_plot_v1_4_2_tdd_acceptance_matrix.md`.
V1.3.1 remains the gameplay-surface baseline, V1.4 remains the AI-reality/runtime baseline, V1.4.1 keeps hero-cast governance honest, and V1.4.2 adds prompt-provenanced visual production and screenshot-first signoff.

The current follow-up sprint is the V1.4.2 acceptance-cleanup lane in `specs/31_*` and `specs/32_*`, which assumes the V1.4.2 art baseline is approved and focuses on route-level polish: signoff truth, overlay hierarchy, mobile calmness, Clover grounding, HQ progression readability, and layered-plates scene truth.

The current patch lane is `specs/33_*` and `specs/34_*`, which keeps scope narrow: stricter 390px calmness, stronger HQ level 1/3/5 progression, Patch 2 screenshot proof, and no gameplay/runtime expansion.

## Principles

- Local-first setup by default.
- User-controlled credentials.
- Minimal configuration surface.
- Same Brain/Mind block on both index and house pages.

## Where you configure the Mind

- Index page (`/`) in hatch flow: **Give it a Mind**
- House page (`/house?...`) in agent state panel: **Mind configuration**

Both views use the same provider/model/auth behavior.
