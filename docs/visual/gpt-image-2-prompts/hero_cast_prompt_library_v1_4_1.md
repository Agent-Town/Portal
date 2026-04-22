# Agent Town V1.4.1 — GPT Image 2 Hero Cast Prompt Library

**Status:** supplemental prompt library for the V1.4.1 asset-production line  
**Goal:** unify the recovered hero cast without expanding Founders Plot gameplay scope

## Shared style target

```text
Warm frontier storybook game art, soft 3D collectible character design, cozy mythic Wild West civic-builder tone, gentle morning light, polished but approachable, tactile materials, rounded silhouettes, expressive eyes, frontier hats and practical gear, hopeful and welcoming, readable at small game UI sizes, no text, no logos, no dashboard UI, no harsh realism, no gritty violence, no cyberpunk, no parody cowboy excess.
```

## Shared negative prompt

```text
Do not create photorealistic animals, grotesque creatures, horror, weapons-first poses, gambling/casino imagery, saloon stereotypes, hypersexualized characters, realistic children in unsafe contexts, cluttered UI, text labels, logos, pixel art unless explicitly requested, cyberpunk neon, grimdark western violence, or cheap mobile-game ad compositions.
```

## Prairie Dog Ranger

**Reference input:** `docs/brand/reference/hero-cast/prairie-dog-ranger-source.png`

```text
Create a polished character sheet for the Agent Town Prairie Dog Ranger based on the supplied reference image.

Character: a cute prairie-dog-like frontier ranger mascot with a warm smile, oversized expressive eyes, soft plush/3D collectible fur, brown cowboy hat with gold star badge, red scarf, small backpack, and practical explorer gear.

Style: warm frontier storybook game art, soft 3D collectible, cozy, polished, readable at small game sizes.

Poses:
1. idle friendly wave,
2. saluting with hat,
3. pointing toward a town objective,
4. carrying a small map,
5. cheerful celebration.

Keep the same character identity, fur colors, scarf, hat silhouette, and star badge across all poses. No text, no logo, clean neutral background, wholesome tone.
```

## Sheriff Lobster

**Reference input:** `docs/brand/reference/hero-cast/sheriff-lobster-source.jpeg`

```text
Reimagine the Agent Town Sheriff Lobster from the supplied reference image in the same warm frontier storybook / soft 3D collectible style as the Prairie Dog Ranger.

Character: a cute friendly red lobster wearing a brown frontier sheriff hat with a gold star badge. Rounded claws, readable silhouette, warm expression, tiny frontier accessory such as a small bandana or satchel.

Create 4 full-body poses:
1. proud sheriff stance,
2. waving with one claw,
3. holding a tiny town notice paper,
4. celebrating a completed contract.

No text, no logo, no threatening claws, no weapons, no realistic seafood texture.
```

## Chibi Homesteader Girl

**Reference input:** `docs/brand/reference/hero-cast/chibi-homesteader-girl-source.png`

```text
Create a wholesome Agent Town founder avatar concept based on the supplied reference image.

Character: a young-looking chibi frontier homesteader / first-town founder with a brown cowboy hat, practical vest, work shirt, blue work pants, boots, and a confident but friendly stance.

Style: warm frontier storybook game art, soft 3D collectible, non-pixel, polished, readable at small UI sizes, safe and wholesome.

Create 4 poses:
1. idle confident stance,
2. holding a hammer or blueprint,
3. pointing at a buildable lot,
4. happy after first building completion.

No sexualized styling, no glamour pose, no weapons, no text, no logo.
```

## Wizard Kid

**Reference input:** `docs/brand/reference/hero-cast/wizard-kid-source.png`

```text
Create a polished character sheet for the Agent Town Wizard Kid based on the supplied reference image.

Character: a wholesome young wizard/adventurer with a large soft brown wizard hat, warm brown frontier poncho with subtle trim, utility belt, boots, gentle smile, and practical frontier materials.

Style: warm frontier storybook game art, soft 3D collectible, cozy and polished, not generic castle fantasy.

Poses:
1. idle warm smile,
2. holding a glowing blueprint scroll,
3. conjuring small harmless building sparkles,
4. inspecting a tiny model town,
5. celebrating a generated asset.

No weapons, no dark magic, no text, no logo.
```

## Ensemble hero key art

**Reference inputs:** all four hero-cast source images

```text
Create a hero key art image for Agent Town using the supplied Prairie Dog Ranger, Sheriff Lobster, Chibi Homesteader Girl, and Wizard Kid references.

Scene: warm frontier town morning, newly founded settlement in the background, small Town Hall / HQ, wagon road, public notice board, golden dust, hopeful civic-builder atmosphere.

Composition:
- Prairie Dog Ranger as the warm mascot guide,
- Sheriff Lobster as comedic side character,
- Chibi Homesteader Girl as founder/player archetype,
- Wizard Kid as creation/vibecoding archetype.

Style: unified warm frontier storybook / soft 3D collectible game art, polished, bright but not plastic, no text, no logo, no UI, no grimdark western tropes, no cyberpunk.
```

## Founders Plot integration caution prompt

```text
Create a Founders Plot gameplay-supporting image in the Agent Town style.

Important: the gameplay surface must remain centered on Clover the Foreman, the player's frontier plot, the current objective, and the visible town. Do not place the full hero cast into the gameplay screen. The Prairie Dog Ranger, Sheriff Lobster, Chibi Homesteader Girl, and Wizard Kid are platform and marketing heroes and may appear only as optional onboarding or brand-reference art unless explicitly requested.

Style: warm frontier storybook civic-builder, soft 3D collectible materials, polished in-game readability, no debug UI, no text labels, no crowded mascot staging.
```

## Optional future video-still review prompt

Use this only if Robin later requests frame extraction in a separate marketing task.

```text
Review these hero video still frames for Agent Town brand guidance.

For each frame, identify:
1. which hero characters are visible,
2. what visual qualities should be preserved,
3. what should not be imported into Founders Plot gameplay,
4. whether the frame is best used as marketing reference, brand reference, gameplay reference, or anti-example,
5. whether the image supports the warm frontier civic-builder identity.

Return a table with: timestamp, characters, preserve, avoid, recommended usage, approval status.
```

## Asset promotion checklist

- [ ] Reference file(s) recorded in the manifest.
- [ ] Prompt file saved under `docs/visual/gpt-image-2-prompts/`.
- [ ] Generator/model recorded.
- [ ] Post-processing recorded.
- [ ] Human art/design owner approved it.
- [ ] Approval scope is explicit: `brand_reference`, `marketing_asset`, or `gameplay_asset`.
- [ ] If `gameplay_asset`, route screenshot proof exists.
- [ ] It does not crowd the default Founders Plot surface.
- [ ] Clover remains the primary game-facing AI partner in Founders Plot.

