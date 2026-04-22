# Codex Handoff — V1.4.1 Hero Cast and Video Integration

You are implementing a documentation and asset-pipeline update for Agent Town.

## Read first

1. `AGENTS.md`
2. `Brand kit/guidelines/agent-town-design-pack/BRAND.md`
3. `Brand kit/guidelines/agent-town-design-pack/DESIGN.md`
4. `Brand kit/guidelines/agent-town-design-pack/GAME_UX.md`
5. `Brand kit/guidelines/agent-town-design-pack/REGISTRY.md`
6. `docs/brand/HERO_CAST_AND_VIDEO_SOURCE_ADDENDUM_V1_4_1.md`
7. `docs/brand/HERO_VIDEO_NO_EXTRACTION_UPDATE_V1_4_1.md`
8. `docs/visual/gpt-image-2-prompts/hero_cast_prompt_library_v1_4_1.md`

## Task

Integrate the recovered hero-cast sources into the repo's brand, design, and asset-governance layers.

## Required assets

Ensure these owner-supplied reference files are present under:

```text
docs/brand/reference/hero-cast/
```

- `prairie-dog-ranger-source.png`
- `sheriff-lobster-source.jpeg`
- `chibi-homesteader-girl-source.png`
- `wizard-kid-source.png`

## Required docs

Create or update:

- `docs/brand/HERO_CAST_AND_VIDEO_SOURCE_ADDENDUM_V1_4_1.md`
- `docs/brand/HERO_VIDEO_NO_EXTRACTION_UPDATE_V1_4_1.md`
- `docs/brand/HERO_VIDEO_SOURCE_INDEX.md`
- `docs/visual/gpt-image-2-prompts/hero_cast_prompt_library_v1_4_1.md`
- `Brand kit/guidelines/agent-town-design-pack/BRAND.md`
- `Brand kit/guidelines/agent-town-design-pack/DESIGN.md`
- `Brand kit/guidelines/agent-town-design-pack/GAME_UX.md`
- `Brand kit/guidelines/agent-town-design-pack/REGISTRY.md`

## Video handling

The hero video URL is:

```text
https://www.youtube.com/watch?v=ZW7tUUZqhdY
```

Rules:

- treat it as tone, motion, and story reference only;
- do not download it;
- do not extract stills;
- do not add `HERO_VIDEO_FRAME_INDEX.md`

unless Robin later asks for a separate extraction task.

## Gameplay boundary

Founders Plot V1 gameplay stays centered on:

- Clover,
- the player's plot,
- the current goal,
- the visible town.

The hero cast is a platform ensemble for brand, onboarding, marketing, and future worldbuilding. It must not crowd the default Founders Plot gameplay route.

## Manifest and test expectations

Add or update deterministic coverage for:

1. hero-cast reference file presence;
2. honest source-index status and the no-extraction rule;
3. manifest support for `referenceSource`, `referenceFiles`, `approvalScope`, and related provenance fields;
4. proof that the normal Founders Plot surface does not import the full hero ensemble by default.

