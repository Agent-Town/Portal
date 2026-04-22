# Founders Plot V1.4.1 — Hero Cast and Video Addendum

**Status:** implementation spec  
**Date:** 2026-04-22

## Goal

Upgrade the recovered platform hero cast into repo-native brand/design canon without changing Founders Plot V1 gameplay scope.

## Inputs

Required sources:

1. `AGENTS.md`
2. `Brand kit/guidelines/agent-town-design-pack/BRAND.md`
3. `Brand kit/guidelines/agent-town-design-pack/DESIGN.md`
4. `Brand kit/guidelines/agent-town-design-pack/GAME_UX.md`
5. `Brand kit/guidelines/agent-town-design-pack/REGISTRY.md`
6. `docs/brand/HERO_CAST_AND_VIDEO_SOURCE_ADDENDUM_V1_4_1.md`
7. `docs/brand/HERO_VIDEO_NO_EXTRACTION_UPDATE_V1_4_1.md`
8. `docs/visual/gpt-image-2-prompts/hero_cast_prompt_library_v1_4_1.md`

## Product decision

The hero cast is now recovered owner-supplied brand-reference material.

The four canonical hero-cast references are:

- Prairie Dog Ranger
- Sheriff Lobster
- Chibi Homesteader Girl
- Wizard Kid

The hero video URL is canonically recorded, but it remains:

- tone reference,
- motion reference,
- story reference only.

No video-frame extraction is part of V1.4.1.

## Scope

### In scope

- import recovered hero-cast references into the repo;
- update brand/design/UX/registry law for the recovered cast;
- update the hero-video source index to honest recovered status;
- document the no-extraction rule;
- extend manifest provenance support for reference-source and approval-scope metadata;
- add deterministic tests for reference presence, source-index truth, manifest support, and gameplay-surface quarantine.

### Out of scope

- new Founders Plot mechanics,
- new backend gameplay routes,
- new full-cast gameplay scene,
- new onboarding systems,
- hero-video frame extraction,
- cinematic/video production tasks.

## Core rules

### Gameplay rule

Founders Plot default gameplay remains centered on:

1. Clover,
2. the player's plot,
3. the current goal,
4. the visible town.

The hero cast must not become the default-screen ensemble.

### Brand rule

The hero cast is the platform ensemble.

Recommended hierarchy:

- Clover = gameplay-canonical partner
- Prairie Dog Ranger = platform mascot
- Sheriff Lobster = comedic brand mascot
- Chibi Homesteader Girl = founder/player archetype
- Wizard Kid = creator/vibecoding archetype

### Video rule

The hero video may be cited in docs and manifests as a reference source, but:

- `frameExtractionRequired` must be `false`;
- no stills may be checked in for this sprint;
- any later extraction work must be a separate task.

## Manifest contract

The Founders Plot asset-manifest contract must support:

```json
{
  "referenceSource": "string",
  "referenceFiles": ["string"],
  "approvalScope": "brand_reference | marketing_asset | gameplay_asset",
  "sourceTool": "string",
  "rightsStatus": "owned | generated_project_owned | licensed | reference_only | unknown",
  "postProcessing": ["string"]
}
```

And top-level V1.4.1 reference metadata:

```json
{
  "referenceInputs": ["docs/brand/reference/hero-cast/..."],
  "videoReference": {
    "url": "https://www.youtube.com/watch?v=ZW7tUUZqhdY",
    "usage": "tone_motion_story_reference_only",
    "frameExtractionRequired": false
  }
}
```

## Deliverables

1. recovered hero-cast reference images in repo;
2. repo-native addendum docs;
3. updated hero-video source index;
4. updated brand/design/game-ux/registry canon;
5. manifest/schema updates;
6. deterministic tests;
7. updated docs index entries.

