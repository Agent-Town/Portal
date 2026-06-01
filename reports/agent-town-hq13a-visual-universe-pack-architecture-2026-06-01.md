# Agent Town HQ13A Visual Universe Pack Architecture

Date: 2026-06-01
Lane: HQ13A architecture/report only
Verdict: COMPLETE_ARCHITECTURE_DRAFT

## Summary

Created the HQ13A architecture spec for packable/swappable Agent Town visual universe systems:

- `docs/specs/agent-town-visual-universe-pack-architecture.md`
- `reports/agent-town-hq13a-visual-universe-pack-architecture-proof-2026-06-01.json`

The spec turns the current GPT Image 2-quality visual direction into a concrete presentation-only pack contract. It covers map terrain, fog/markers, HUD/card art, inhabitant/operator packs, location scene packs, prompt/provenance sidecars, runtime slot bindings, versioning, validation, promotion, and future in-game editor hooks.

No app JS, CSS, server, tests, routes, assets, or runtime pack directories were edited.

## Existing Patterns Inspected

Read-only inspection covered:

- Founders Plot manifest: experience metadata, routes, theme, tools, metrics.
- `scene_state.js`: fixed asset resolution, `ACTOR_SPRITE_SHEETS`, actor metadata sources, stage backgrounds, visual-only actor slots.
- `engine.js`: Generated Universe overlay-pack read model, provenance normalization, Expedition Map/Packet/Party read-only boundary flags, canonical `visualActors`.
- GPT Image 2 asset sidecars: character sheets, object/card art, prompt files, generated/source/runtime images, provenance, post-processing notes, constraints.
- Icon manifest pattern: generated source sheet, crop manifest, stable icon IDs, scene asset list.
- Prior reports: HQ10C overlay pack UI, playable world visual roadmap, asset readiness smoke, HQ12 Expedition Map evidence/wrap, editor-vs-engine boundary, generated-universe inhabitant planning.

## Architecture Decisions

- Use a top-level `visual_universe_pack` manifest with typed modules instead of ad hoc asset references.
- Bind packs to named runtime slots such as `founders_plot.actor.scout`, `expedition_map.fog.known`, `hud.card.event_packet`, and `founders_plot.stage.background.desktop`.
- Split modules into `map_terrain_pack`, `fog_marker_pack`, `hud_card_pack`, `inhabitant_operator_pack`, and `location_scene_pack`.
- Require prompt/provenance sidecars for generated assets, preserving the current `.prompt.md`, `.json`, `.generated.png`, `.source.png`, and runtime asset pattern.
- Keep pack promotion presentation-only. Any gameplay promotion must be a separate engine/server/store/tool slice with tests.
- Future in-game editor flow is propose -> generate -> preview -> approve -> commit, with preview/commit unable to mutate gameplay state or execute Atlas/genAI directly.

## Guardrails Preserved

The spec explicitly forbids packs from owning:

- gameplay authority;
- Atlas execution;
- public sharing;
- real Generated Universe rendering;
- autonomous operations;
- routes, trade, economy, combat, scheduler behavior;
- resources, formulas, timers, unlocks, permissions, fog transitions, scout eligibility, or actor counts with gameplay meaning;
- cross-plot mutation, external effects, account identity, provider settings, API credentials, wallet data, tools, or server handlers.

## Recommended Next Lane

The next safe implementation slice is a read-only schema/validator lane:

- add a draft JSON schema for `agent-town.visual-pack.v1`;
- validate a tiny fixture manifest under reports or docs only;
- prove invalid packs fail closed on unknown slots, external URLs, tool/action fields, public sharing, Atlas execution, and gameplay mutation fields.

Do not start runtime rendering, generation workers, pack selection UI, editor commits, public sharing, or gameplay promotion in the next lane unless it is separately scoped and guarded.

## Verification

Passed:

- `jq empty reports/agent-town-hq13a-visual-universe-pack-architecture-proof-2026-06-01.json`
- `git diff --check -- docs/specs/agent-town-visual-universe-pack-architecture.md reports/agent-town-hq13a-visual-universe-pack-architecture-2026-06-01.md reports/agent-town-hq13a-visual-universe-pack-architecture-proof-2026-06-01.json`
- focused trailing-whitespace/tab scan over the three created files

No JS syntax checks or Playwright runs are needed because this lane edits only Markdown and JSON architecture artifacts.
