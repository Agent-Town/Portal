# Agent Town V1.4.1 — Hero Cast and Hero Video Source Addendum

**Status:** canonical V1.4.1 brand-reference addendum  
**Date:** 2026-04-22  
**Audience:** product, design, art direction, engineering, QA  
**Supersedes:** the older V1.4 assumption that the hero cast was only partially recovered from repo history

## Purpose

Robin supplied the recovered hero-cast reference images used for the Agent Town hero-video line together with the canonical video URL:

```text
https://www.youtube.com/watch?v=ZW7tUUZqhdY
```

This addendum upgrades the hero cast from remembered/candidate material to recovered owner-supplied source material.

The supplied images are approved for:

- brand-reference work,
- marketing direction,
- onboarding atmosphere,
- loading/interstitial art direction,
- future platform-cast and requester exploration.

They are **not** automatically approved as default Founders Plot gameplay assets.

## Product boundary

Founders Plot V1 remains centered on:

1. the player's plot,
2. the current goal,
3. Clover as the gameplay Foreman,
4. the visible town.

The hero cast may inform:

- platform hero art,
- landing-page and onboarding identity,
- story/tone continuity with the hero video,
- future NPC/requester worldbuilding.

The hero cast must **not**:

- replace Clover on the default Founders Plot route,
- turn the gameplay screen into an ensemble lineup,
- add new V1 mechanics or tutorial actors,
- distract from the one obvious next action.

## Recovered hero cast

| Character | Source file | Canonical V1.4.1 role | Notes |
|---|---|---|---|
| Prairie Dog Ranger | `docs/brand/reference/hero-cast/prairie-dog-ranger-source.png` | brand-canonical mascot | strongest style anchor for soft 3D storybook refresh |
| Sheriff Lobster | `docs/brand/reference/hero-cast/sheriff-lobster-source.jpeg` | comedic brand mascot | preserve concept, regenerate into unified style before production use |
| Chibi Homesteader Girl | `docs/brand/reference/hero-cast/chibi-homesteader-girl-source.png` | player/founder archetype | keep wholesome, practical, non-sexualized |
| Wizard Kid | `docs/brand/reference/hero-cast/wizard-kid-source.png` | creator/vibecoding archetype | supports platform-creation identity, not V1 fantasy-scope drift |

## Canonical role hierarchy

The hierarchy for V1.4.1 is:

- `Clover / Foreman`: gameplay-canonical partner on Founders Plot.
- `Prairie Dog Ranger`: platform-wide warmth / mascot identity.
- `Sheriff Lobster`: comedic marketing mascot.
- `Chibi Homesteader Girl`: founder/player archetype.
- `Wizard Kid`: creation/vibecoding archetype.

The rule is fixed:

> Clover is the gameplay partner.  
> The hero cast is the platform ensemble.

## Style unification target

The supplied references do not share one rendering style. Production refresh work should unify them around:

> warm frontier storybook / soft 3D collectible / polished game mascot

Preserve:

- silhouette,
- hat/star/frontier gear motifs,
- personality,
- approachable tone,
- warm palette logic.

Do not preserve:

- low-resolution artifacts,
- inconsistent outline systems,
- flatter placeholder rendering styles,
- gameplay-cluttering compositions.

## Hero video handling

The hero video is approved as:

- tone reference,
- motion reference,
- story reference.

It is **not** a blocking extraction task for this sprint.

Rules:

- do not download, extract, or commit video frames in V1.4.1;
- do not create `docs/brand/HERO_VIDEO_FRAME_INDEX.md` unless Robin explicitly asks later;
- if future marketing/cinematic work needs frame extraction, create a separate `hero-video-marketing-extraction` task.

## V1.4.2 continuation note

V1.4.2 treats the four owner-supplied cast files as the primary recovered hero-cast references and adds platform reference images under `docs/brand/reference/platform/`.

The V1.4.2 asset sprint may use those files to normalize platform/marketing art, but the same boundary remains in force:

- the hero cast is platform identity;
- Clover is the gameplay partner;
- the hero video stays a tone/motion/story reference only unless Robin explicitly requests a later extraction sprint.

## Asset-pipeline requirements

The Founders Plot asset manifest and future brand-asset manifests must support provenance fields that make the recovered hero-cast inputs explicit.

Required per-asset fields:

```json
{
  "sourceTool": "string",
  "referenceSource": "string",
  "referenceFiles": ["string"],
  "rightsStatus": "owned | generated_project_owned | licensed | reference_only | unknown",
  "postProcessing": ["string"],
  "approvalScope": "brand_reference | marketing_asset | gameplay_asset"
}
```

Required top-level support for V1.4.1 brand references:

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

## Approval law

Approval scopes now mean:

- `brand_reference`: recovered source material and exploratory derivatives for canon-setting and style alignment.
- `marketing_asset`: approved for site/marketing/onboarding/loading/interstitial use.
- `gameplay_asset`: approved for the playable Founders Plot route.

No asset may be treated as `gameplay_asset` unless:

- a named human owner approves it,
- approval metadata is recorded,
- route screenshot proof exists where applicable,
- it does not crowd the default Founders Plot surface.

## Required implementation outputs

V1.4.1 implementation must:

1. add the recovered hero-cast reference files to the repo;
2. update `docs/brand/HERO_VIDEO_SOURCE_INDEX.md` to reflect recovered owner-supplied sources;
3. patch brand/design/UX/registry docs so the hero cast is platform-canonical but gameplay-quarantined;
4. update manifest schema/docs for the new provenance fields;
5. add deterministic tests for:
   - hero reference-file presence,
   - honest source-index status and no-extraction rule,
   - manifest provenance support,
   - gameplay-surface quarantine.
