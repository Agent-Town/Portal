# Founders Plot V1.4.1 — TDD Acceptance Matrix

**Status:** canonical acceptance matrix for the V1.4.1 hero-cast addendum sprint

## Acceptance table

| ID | Area | Requirement | Verification |
|---|---|---|---|
| A1 | Reference files | The four owner-supplied hero-cast images exist under `docs/brand/reference/hero-cast/`. | `tests/founders_plot_hero_cast_reference_files.test.js` |
| A2 | Source index | `docs/brand/HERO_VIDEO_SOURCE_INDEX.md` records the hero cast as recovered, includes the YouTube URL, and states that frame extraction is not required. | `tests/founders_plot_hero_source_index.test.js` |
| A3 | Addendum docs | The repo contains the V1.4.1 addendum docs and prompt library needed for future visual work. | `tests/founders_plot_visual_direction_pack.test.js` |
| A4 | Manifest schema | The Founders Plot asset manifest supports `referenceSource`, `referenceFiles`, `approvalScope`, `sourceTool`, `rightsStatus`, and `postProcessing`, and exposes the V1.4.1 `videoReference` rule. | `tests/founders_plot_asset_manifest.test.js`, `e2e/163_founders_plot_art_signoff_manifest.spec.js` |
| A5 | Gameplay quarantine | The normal Founders Plot gameplay route does not surface the hero ensemble by default. | `tests/founders_plot_gameplay_hero_cast_quarantine.test.js`, `e2e/183_founders_plot_v1_4_1_hero_cast_default_surface.spec.js` |
| A6 | Scope discipline | The hero video is documented as a non-blocking tone/motion/story reference only; no frame-extraction task is required. | `tests/founders_plot_hero_source_index.test.js`, doc review |

## Definition of done

V1.4.1 is complete when:

1. all required docs and reference assets are present;
2. the recovered cast is reflected in brand/design/gameplay law;
3. the no-extraction rule is explicit and consistent;
4. the asset-manifest contract is future-safe for hero-cast provenance;
5. the gameplay route remains Clover-first;
6. `npm test` passes.
