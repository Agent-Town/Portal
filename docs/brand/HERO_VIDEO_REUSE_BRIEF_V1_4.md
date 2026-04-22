# Agent Town Hero Video Reuse Brief — V1.4

**Status:** source-recovery and reuse brief  
**Purpose:** document the safe reuse boundary for the recovered hero cast and hero video without expanding gameplay scope  
**Sprint baseline:** V1.4 AI Reality + Visual Direction  
**V1.4.1 update:** the hero cast is now recovered from owner-supplied images

## 1. Recovered source set

The current canonical hero-cast source set is:

- Prairie Dog Ranger
- Sheriff Lobster
- Chibi Homesteader Girl
- Wizard Kid

These references now live in:

```text
docs/brand/reference/hero-cast/
```

The hero video URL is also canonically known:

```text
https://www.youtube.com/watch?v=ZW7tUUZqhdY
```

The video remains a tone/motion/story reference only.

## 2. Required source-of-truth file

Maintain:

```text
docs/brand/HERO_VIDEO_SOURCE_INDEX.md
```

The source index must record:

- recovered reference files,
- the canonical video URL,
- provenance,
- approved usage,
- the rule that frame extraction is not required for V1.4.1.

## 3. Reuse rules

The recovered hero media may be used for:

- marketing tone,
- onboarding/loading/interstitial direction,
- hero key art and platform identity,
- future optional cameo/NPC inspiration after a later spec,
- controlled asset-generation reference with clear provenance.

It must **not** be used to:

- replace Clover as the Foreman,
- add P0 gameplay systems,
- add uncontrolled mascots to the core gameplay surface,
- imply that the current sprint requires video-frame extraction,
- train an external model unless rights/provenance are approved.

## 4. Character handling

| Character | V1.4.1 status | Allowed use | Not allowed |
|---|---|---|---|
| Prairie Dog Ranger | recovered platform mascot source | marketing, onboarding, brand warmth | cluttering the core plot screen |
| Sheriff Lobster | recovered comedic mascot source | marketing and hero-art reference after style refresh | new gameplay system |
| Chibi Homesteader Girl | recovered founder archetype source | marketing, avatar concept, onboarding reference | replacing player identity model by default |
| Wizard Kid | recovered creator archetype source | marketing, creation/vibecoding identity | magic-system scope expansion |
| Clover | canonical in-game Foreman | core gameplay helper | replacement by hero cast |

## 5. Video rule

The hero video is approved only as:

- tone reference,
- motion reference,
- story reference.

For V1.4.1:

- do not download the video,
- do not extract stills,
- do not add `docs/brand/HERO_VIDEO_FRAME_INDEX.md`,
- do not block gameplay or visual implementation on video processing.

If later marketing work needs stills, create a separate `hero-video-marketing-extraction` task.

## 6. Future direction

A later marketing/content spec may define:

- a 20–30 second teaser,
- an intro splash animation,
- non-interactive background cameos,
- platform hero art refreshes,
- seasonal or future visitor packs.

Those are separate from the current Founders Plot V1 gameplay scope.
