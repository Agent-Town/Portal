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
- [Agent Town design pack](/Brand%20kit/guidelines/agent-town-design-pack/README.md)

## Founders Plot implementation note

The current implementation sprint is driven by the refined V1.1 documents in `specs/18_*` and `specs/19_*`.
Any earlier broader V1.1 scope notes should be treated as superseded unless they are explicitly restated there.

## Principles

- Local-first setup by default.
- User-controlled credentials.
- Minimal configuration surface.
- Same Brain/Mind block on both index and house pages.

## Where you configure the Mind

- Index page (`/`) in hatch flow: **Give it a Mind**
- House page (`/house?...`) in agent state panel: **Mind configuration**

Both views use the same provider/model/auth behavior.
