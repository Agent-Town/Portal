# GPT Image 2 Prompt Library V1.4.2

This file contains shared prompt material for Agent Town V1.4.2 asset rebuild. Production assets must also have individual prompt files under `specs/prompts/v1_4_2/`.

---

## Global style lock

```text
Warm frontier storybook game art for Agent Town. Soft-3D collectible feel with painterly texture, tactile wood, brass, parchment, sun-warmed clay, sage green, cream canvas, dusty golden light, readable silhouettes, cozy civic optimism, and gentle frontier adventure. Designed for a town-building game UI where objects must read clearly at small size. Polished, cohesive, family-friendly, hopeful, handcrafted, not pixel art, not photorealistic, not cyberpunk, not generic SaaS illustration, not cowboy parody.
```

## Global negative prompt

```text
No pixel art. No photorealism. No cyberpunk. No grimdark. No horror. No guns as focal objects. No saloon vice imagery as the main theme. No busy mobile-game clutter. No hard-to-read tiny details. No text, letters, numbers, signage, logos, UI labels, watermarks, signatures, or typography inside the image unless explicitly requested as abstract unreadable marks. No imitation of a specific commercial game or living artist. No inconsistent character identity. No extra limbs. No transparent-background request to GPT Image 2; generate on clean background for post-processing instead.
```

---

## Prompt: Founders Plot desktop stage

```text
[GLOBAL STYLE LOCK]

Create a launch-grade hero background for Agent Town: Founders Plot, a warm frontier town-builder game screen. The scene shows a small new settlement from a slightly elevated three-quarter view: a modest HQ cabin, buildable lots, a lumber camp area, a farm patch, a contract notice board, a small public square with a welcome sign, and a cozy foreman workspace.

The composition must leave clear empty zones where interactive buildings can be placed by the UI. The eye should move from the current objective area to Clover's workspace to the central HQ. Use warm dusty morning light, tactile wood and canvas, soft shadows, and gentle civic optimism. The image should feel like a real game stage, not concept art wallpaper.

No readable text. No UI panels. No characters. No logo. No pixel art. No photorealism.
```

## Prompt: Founders Plot mobile stage

```text
[GLOBAL STYLE LOCK]

Create a mobile-first cropped stage background for Agent Town: Founders Plot. The composition must work in a narrow portrait game UI with a compact HUD above and a bottom action sheet below. Use fewer visual elements than desktop: HQ cabin, one or two buildable lots, a contract board, a small public square marker, and space for Clover to appear. Clear focal area for the current objective. Warm frontier storybook style, soft-3D collectible, readable at small scale.

No readable text. No UI panels. No clutter. No characters unless added separately.
```

## Prompt: Clover pose sheet

```text
[GLOBAL STYLE LOCK]

Create a consistent character pose sheet for Clover Kincaid, the trusted AI Foreman of Agent Town. Clover is warm, practical, intelligent, frontier-marshal inspired without being militaristic, with a small ledger or tool satchel, friendly confident body language, and a readable silhouette.

Include six consistent poses: idle, thinking with ledger, acting toward a building with one hand extended, waiting for approval with patient expression, blocked/needs help with a small concern gesture, and celebrating a finished contract. Clean neutral background for later cutout. No text. No logo. No weapon-forward props.
```

## Prompt: Clover acting pose

```text
[GLOBAL STYLE LOCK]

Create a single game-ready pose of Clover Kincaid acting on a town object. Clover is leaning or stepping toward an off-screen building target, one hand extended as if collecting or directing work, with a clear line of intent in the body pose. The pose must read at small UI size as "Clover is doing something to that target." Warm, trustworthy, practical, cheerful but not silly. Clean neutral background for cutout. No text.
```

## Prompt: Building object pack

```text
[GLOBAL STYLE LOCK]

Create a coherent pack of small frontier town-building objects for Agent Town: HQ cabin, Lumber Camp, Farm Plot, Quarry, Workshop, Market Stall, Contract Board, Public Square with Welcome Sign, Foreman Hut, Town Journal stand, Approval Inbox/Town Bell, Empty Buildable Lot, Locked Future Lot.

Each object must have a clear readable silhouette, consistent three-quarter camera angle, consistent warm lighting, and enough charm to feel collectible. Clean neutral background for later cutout. No text. No labels. No characters.
```

## Prompt: Individual building template

```text
[GLOBAL STYLE LOCK]

Create one game asset: [ASSET NAME]. It is part of Agent Town: Founders Plot, a warm frontier civic-builder. The object must be readable at small size, with a strong silhouette, tactile materials, consistent three-quarter camera angle, warm sunlight, and enough detail to feel polished but not cluttered. Clean neutral background for cutout. No text, no logo, no characters.

Specific identity: [DESCRIBE BUILDING PURPOSE AND KEY MOTIFS].
```

## Prompt: Resource icons

```text
[GLOBAL STYLE LOCK]

Create a coherent set of small game resource icons for Agent Town: wood, stone, food, coin, town XP/level, contract ready, output ready, approval pending, blocked, scheduler heartbeat active, recap/journal. Each icon must be legible at 24px and 48px, with a tactile carved/painted frontier material feel. Clean background, no text, no numbers, no labels.
```

## Prompt: Hero cast normalization

```text
[GLOBAL STYLE LOCK]

Using the supplied hero-cast reference image as identity inspiration, recreate this character in the unified Agent Town platform style. Preserve the character's core identity, silhouette, costume motif, and personality, but normalize lighting, proportions, material richness, and rendering quality to match the Agent Town warm frontier storybook / soft-3D collectible asset family. Clean neutral background. No text. No logo. Do not imitate a commercial game or living artist.
```

## Prompt: Hero cast group key art

```text
[GLOBAL STYLE LOCK]

Create platform key art for Agent Town featuring the recovered hero cast as an ensemble: Prairie Dog Ranger, Sheriff Lobster, Chibi Homesteader Girl, and Wizard Kid. They stand together as friendly explorers of Agent Town, with a warm frontier settlement in the background. The image should feel like brand/marketing art, not default gameplay UI. Preserve each character's identity while unifying rendering, lighting, scale, and material style. No readable text or logo.
```

## Prompt: UI ornaments

```text
[GLOBAL STYLE LOCK]

Create a set of UI ornament ingredients for Agent Town: parchment panel corners, brass button frame, wooden sign stake, timer ring frame, objective ribbon ends, resource flyout burst, approval badge frame, contract-paper pin, journal tab. Must be game UI ingredients, not full panels. Tactile frontier materials, readable at small size, consistent lighting, no text.
```
