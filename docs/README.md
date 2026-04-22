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
- [Agent Town design pack](/Brand%20kit/guidelines/agent-town-design-pack/README.md)
- [Agent Town V1.3 implementation start pack note](/docs/design/agent-town-v1.3-implementation-start-pack.md)
- [Agent Town V1.3.1 signoff pack note](/docs/design/agent-town-v1.3.1-signoff-pack.md)
- [Agent Town V1.4 AI reality + visual direction pack note](/docs/design/agent-town-v1.4-ai-reality-visual-direction-pack.md)
- [Agent Town V1.4.1 hero-cast addendum note](/docs/design/agent-town-v1.4.1-hero-cast-video-addendum.md)

## Founders Plot implementation note

The current implementation lane is driven by the V1.4 AI-reality documents in `specs/26_*` and `specs/27_*`, then refined by the V1.4.1 hero-cast addendum in `specs/28_*` and `specs/29_*` together with the checked-in design-pack addenda under `Brand kit/guidelines/agent-town-design-pack/`.
V1.3.1 remains the gameplay-surface baseline, V1.4 remains the AI-reality/runtime baseline, and V1.4.1 adds recovered hero-cast governance without changing the core Clover-first route.

## Principles

- Local-first setup by default.
- User-controlled credentials.
- Minimal configuration surface.
- Same Brain/Mind block on both index and house pages.

## Where you configure the Mind

- Index page (`/`) in hatch flow: **Give it a Mind**
- House page (`/house?...`) in agent state panel: **Mind configuration**

Both views use the same provider/model/auth behavior.
