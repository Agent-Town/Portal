# Asset Inventory V1.4.2

This is the expanded inventory for the shipped V1.4.2 production pack.

Allowed classifications:

- `KEEP_AS_REFERENCE`
- `REGENERATE_P0`
- `REGENERATE_P1`
- `DEPRECATE_AFTER_REPLACEMENT`
- `DEBUG_ONLY`
- `DO_NOT_TOUCH`

| Asset path / group | Classification | Replacement / prompt id | Notes |
|---|---|---|---|
| `public/assets/hero-cast/hero-cast-group.webp` | REGENERATE_P0 | `hero_cast_group_key_art_v1_4_2` | Start surface / platform identity hero image. |
| `public/assets/hero-cast/prairie-dog-ranger.webp` | REGENERATE_P0 | `hero_prairie_dog_ranger_v1_4_2` | Start Gate cast rail portrait; platform ensemble only. |
| `public/assets/hero-cast/sheriff-lobster.webp` | REGENERATE_P0 | `hero_sheriff_lobster_v1_4_2` | Start Gate cast rail portrait; platform ensemble only. |
| `public/assets/hero-cast/chibi-homesteader.webp` | REGENERATE_P0 | `hero_chibi_homesteader_v1_4_2` | Start Gate cast rail portrait; platform ensemble only. |
| `public/assets/hero-cast/wizard-kid.webp` | REGENERATE_P0 | `hero_wizard_kid_v1_4_2` | Start Gate cast rail portrait; platform ensemble only. |
| `public/assets/platform/town-shell-background-v1_4_2.webp` | REGENERATE_P0 | `town_shell_background_v1_4_2` | Town hub / platform shell production background. |
| `public/assets/platform/townhall-onboarding-illustration-v1_4_2.webp` | REGENERATE_P0 | `townhall_onboarding_illustration_v1_4_2` | Town Hall onboarding illustration. |
| `public/assets/platform/brain-connect-marker-v1_4_2.webp` | REGENERATE_P0 | `brain_connect_marker_v1_4_2` | Brain onboarding illustration. |
| `public/experiences/founders-plot/assets/scenes/founders-plot-desktop.webp` | REGENERATE_P0 | `founders_plot_scene_desktop_v1_4_2` | Main gameplay background. |
| `public/experiences/founders-plot/assets/scenes/founders-plot-mobile.webp` | REGENERATE_P0 | `founders_plot_scene_mobile_v1_4_2` | Mobile gameplay background. |
| `public/experiences/founders-plot/assets/buildings/*` | REGENERATE_P0 | `founders_plot_*_v1_4_2` | Production building pack promoted from compositional building sheets. |
| `public/experiences/founders-plot/assets/objects/*` | REGENERATE_P0 | `founders_plot_*_v1_4_2` | Civic and lot objects promoted from compositional civic sheets. |
| `public/experiences/founders-plot/assets/characters/clover-*.webp` | REGENERATE_P0 | `clover_*_v1_4_2` | Clover gameplay pose set promoted from pose sheets. |
| `public/experiences/founders-plot/assets/overlays/*` | REGENERATE_P0 | `founders_plot_overlay_*_v1_4_2` | Overlay badges and timer frame. |
| `public/assets/candidates/v1_4_2/*` | KEEP_AS_REFERENCE | n/a | Candidate platform renders retained for provenance, not for live routes. |
| `public/experiences/founders-plot/assets/candidates/v1_4_2/*` | KEEP_AS_REFERENCE | n/a | Candidate scene/building/object/character sheets retained for provenance and rebuilds. |
| `public/brand-kit/default_agent_avatar.png` | KEEP_AS_REFERENCE | n/a | Default avatar fallback, outside the V1.4.2 gameplay rebuild scope. |
| `public/brand-kit/default_user_avatar.png` | KEEP_AS_REFERENCE | n/a | Default avatar fallback, outside the V1.4.2 gameplay rebuild scope. |
| `docs/brand/reference/hero-cast/*` | KEEP_AS_REFERENCE | n/a | Recovered hero-cast references, never wired directly into gameplay routes. |
| `docs/brand/reference/platform/*` | KEEP_AS_REFERENCE | n/a | Platform visual references used as generation inputs. |
| `public/favicon-16x16.png` | DO_NOT_TOUCH | n/a | Favicon asset, not part of the hero/platform art rebuild. |
| `public/favicon-32x32.png` | DO_NOT_TOUCH | n/a | Favicon asset, not part of the hero/platform art rebuild. |
| `public/agenttown.jpeg` | DEPRECATE_AFTER_REPLACEMENT | `hero_cast_group_key_art_v1_4_2` + `town_shell_background_v1_4_2` | Legacy monolithic reference no longer used by live player-facing routes. |
| `public/images/atlas-map-bg.jpg` | KEEP_AS_REFERENCE | n/a | Atlas-specific parchment map art retained unchanged in this sprint. |
| `public/images/parchment-bg.jpg` | KEEP_AS_REFERENCE | n/a | Shared parchment texture retained unchanged in this sprint. |
| `public/images/wood-header.jpg` | KEEP_AS_REFERENCE | n/a | Shared wood header texture retained unchanged in this sprint. |
| `public/logo.jpg` | KEEP_AS_REFERENCE | n/a | Logo reference; do not regenerate brand logo without separate approval. |
| `public/openclaw-lite/*` | DEBUG_ONLY | n/a | Runtime/debug assets, not part of the normal player-facing art pack. |
