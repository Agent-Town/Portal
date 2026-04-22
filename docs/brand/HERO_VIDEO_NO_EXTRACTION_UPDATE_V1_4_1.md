# Agent Town V1.4.1 — Hero Video Source Handling Update

**Status:** supplemental clarification for the V1.4.1 hero-cast addendum  
**Date:** 2026-04-22

## Decision

Do **not** require video-frame extraction for the current sprint.

The four supplied hero images are the primary recovered reference sources:

1. Prairie Dog Ranger
2. Sheriff Lobster
3. Chibi Homesteader Girl
4. Wizard Kid

The YouTube hero video remains approved for:

- tone,
- motion,
- story continuity.

It does not create a blocking extraction task for V1.4.1.

## Implementation rule

Use the four supplied hero images as the canonical brand-reference inputs.

Do not:

- download the video,
- extract frames,
- commit stills,
- create `docs/brand/HERO_VIDEO_FRAME_INDEX.md`

unless Robin explicitly asks later.

## Scope guard

The hero cast should support:

- brand and marketing identity,
- onboarding and loading continuity,
- future platform ensemble identity,
- later requester/NPC inspiration.

It should **not** crowd the Founders Plot default gameplay surface.

Founders Plot V1 remains centered on:

- the player's plot,
- the current goal,
- Clover as gameplay Foreman,
- one obvious next action.

