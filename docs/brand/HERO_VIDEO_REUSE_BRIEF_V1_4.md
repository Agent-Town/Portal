# Agent Town Hero Video Reuse Brief — V1.4

**Status:** source-recovery and reuse brief  
**Purpose:** make sure existing hero-video/script work is reused if available, without inventing canon or expanding gameplay scope.  
**Sprint:** V1.4 AI Reality + Visual Direction

---

## 1. Known remembered material

The product owner remembers prior hero-video/script material from the branding/prompting work that included:

- a Lobster;
- a Chibi girl;
- a Wizard kid;
- a Prairie dog.

The actual source file/script was not found in the currently provided local artifact set during preparation of this spec pack.

Therefore, these are currently **candidate remembered brand assets**, not canonical game entities.

---

## 2. Required recovery process

Search the repo and available project archive for:

```text
hero video
hero-video
trailer
script
storyboard
lobster
chibi
wizard kid
prairie dog
prairie-dog
prarie dog
```

Search paths:

```text
.
docs/
specs/
public/
public/assets/
public/experiences/
Brand kit/
marketing/
prompts/
art/
assets/
```

Recommended command:

```bash
grep -RniE "hero video|hero-video|trailer|script|lobster|chibi|wizard kid|prairie dog|prairie-dog|prarie dog" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=test-results
```

---

## 3. Required output

Create or update:

```text
docs/brand/HERO_VIDEO_SOURCE_INDEX.md
```

with:

```yaml
status: found | partial | not_found_in_repo
searched_at: YYYY-MM-DD
searched_branch: string
searched_terms:
  - hero video
  - lobster
  - chibi
  - wizard kid
  - prairie dog
sources:
  - path: string
    type: script | storyboard | prompt | asset | video | image | note
    summary: string
    provenance: owned | generated_project_owned | licensed | unknown
    recommended_use: marketing_reference | in_game_reference | do_not_use | needs_review
open_questions:
  - string
```

---

## 4. Reuse rules

If recovered, the hero-video/script material may be used for:

- visual tone;
- cinematic opening/trailer direction;
- mood board input;
- optional future cameo/event inspiration;
- asset-generation reference if rights are clear.

It must **not** be used to:

- replace Clover as the Foreman;
- add P0 gameplay systems;
- add uncontrolled mascots to the core game screen;
- imply a finished trailer exists if only prompts or fragments exist;
- train an external model unless rights/provenance are approved.

---

## 5. Character handling

| Character | V1.4 status | Allowed use | Not allowed |
|---|---|---|---|
| Lobster | candidate remembered hero cast | marketing/tone/reference after source recovery | new gameplay system |
| Chibi girl | candidate remembered hero cast | marketing/tone/reference after source recovery | replacing player avatar model |
| Wizard kid | candidate remembered hero cast | marketing/tone/reference after source recovery | magic-system scope expansion |
| Prairie dog | candidate remembered hero cast | marketing/tone/reference after source recovery | cluttering core plot without purpose |
| Clover | canonical in-game Foreman | core gameplay helper | replacement by hero cast |

---

## 6. Optional future direction

If the hero cast is recovered and approved, a later marketing/content spec may define:

- a 20–30 second Agent Town teaser;
- an intro splash animation;
- non-interactive background cameos;
- a seasonal visitor/event pack.

That is out of scope for V1.4.
