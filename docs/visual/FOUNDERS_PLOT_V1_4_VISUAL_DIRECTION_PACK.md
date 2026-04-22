# Founders Plot V1.4 Visual Direction Pack

**Status:** required planning artifact for the next visual-art implementation pass  
**Purpose:** freeze the visual target before asking Codex/GPT/Scenario/other tools to generate or integrate art.  
**Owner:** `TBD_ART_OWNER`  
**Version:** V1.4 planning pack

---

## 1. One-page visual brief

### Product name
Agent Town

### Chapter
Founders Plot

### Core visual promise
A warm frontier civic-builder where the player can understand, in one glance:

1. this is my town;
2. this is the next thing to do;
3. Clover is my AI Foreman;
4. the town is alive enough to care about.

### Must feel

- warm frontier storybook;
- newly settled but hopeful;
- tactile, authored, and coherent;
- game-first, not SaaS;
- charming without parody;
- readable at mobile size.

### Must not feel

- dashboard with decorative art;
- generic mobile idle game clutter;
- crypto/provider/admin console;
- cowboy parody;
- flat placeholder vector UI;
- noisy AI debug tool;
- overly polished marketing art disconnected from actual gameplay.

---

## 2. Five-second hero-frame test

A person seeing the default 1280 screenshot for five seconds should be able to answer:

1. What kind of game is this?
2. What should I do next?
3. Who is Clover / where is the helper?
4. What is happening in the town?

Passing answer target:

> “It is a town-building game. I need to build/collect/upgrade the highlighted thing. Clover is the helper character. The town has a working building/lot and something ready or in progress.”

Failing answer examples:

> “It is an AI dashboard.”  
> “It is a landing page.”  
> “It is a task manager with a background.”  
> “I do not know what to click.”

---

## 3. Mood board inventory

Populate this table before the visual implementation sprint.

| Ref ID | Source / file | Rights status | Borrow this principle | Do not borrow |
|---|---|---|---|---|
| M01 | TBD | TBD | warm frontier light/materials | exact character/style copy |
| M02 | TBD | TBD | cozy town depth | interface clutter |
| M03 | TBD | TBD | character charm / pose clarity | IP/trade dress |
| M04 | TBD | TBD | readable world-object states | overly flat badges |
| M05 | TBD | TBD | mobile calmness | hidden affordances |

Rules:

- Use references as principle maps, not clone targets.
- Prefer owned/internal/approved images.
- Do not train on or imitate a single living artist/commercial style.
- If using a dedicated visual platform, record source/provenance.

---

## 4. Reference board inventory

Populate with concrete UI/game reference screens.

| Ref ID | Product / screen | Borrow this UX structure | Avoid this |
|---|---|---|---|
| R01 | TBD | world-as-interface | cluttered icon storm |
| R02 | TBD | objective focal path | panel stack |
| R03 | TBD | character action readability | mascot detached from world |
| R04 | TBD | resource flyout / timer readability | casino-style attention spam |
| R05 | TBD | mobile object interaction | tiny tap targets |

---

## 5. Anti-example strip

Add 3–5 anti-examples.

| Anti ID | Source / screenshot | Why it is wrong for Agent Town |
|---|---|---|
| A01 | Dashboard with decorative art | world is not the interface |
| A02 | Generic SaaS cards | destroys town fantasy |
| A03 | Busy fake mobile game HUD | too much noise, no trust |
| A04 | Flat placeholder vector scene | not flagship enough |
| A05 | Debug console in player path | violates game-first rule |

---

## 6. Required paintovers

The visual implementation sprint must not start until these paintovers or equivalent annotated target frames exist.

| Frame | Size | Required contents | Owner | Status |
|---|---:|---|---|---|
| Desktop hero | 1280×720 or current baseline | town stage, one goal, Clover, recommended lot/building | TBD_ART_OWNER | pending |
| Mobile hero | 390×844 or current baseline | compact HUD, scenic plot, no label clutter | TBD_ART_OWNER | pending |
| Clover acting | 1280×720 | Clover visibly linked to target object, no drawer covering proof | TBD_ART_OWNER | pending |
| Goal lot emphasis | 1280×720 | only objective-relevant lot is loud | TBD_ART_OWNER | pending |
| Recap / Morning brief | optional | return value / audit reward surface | TBD_ART_OWNER | optional |

---

## 7. Weak asset list

Populate after reviewing the latest V1.3.1 screenshots.

| Asset ID | Current path | Problem | Replacement brief | Priority | Target screenshot |
|---|---|---|---|---:|---|
| stage_background_desktop | TBD | possibly flat / low depth | richer frontier storybook depth, still calm | P0 | desktop hero |
| clover_acting | TBD | target linkage weak | clear acting pose toward selected building | P0 | Clover acting |
| hq_lv1 | TBD | may feel placeholder | stronger landmark silhouette | P1 | desktop hero |
| buildable_lot_marker | TBD | label-heavy | stakes/icons, fewer words | P0 | mobile hero |
| timer_badge | TBD | badge stack risk | lower-noise diegetic timer | P1 | selected object |

---

## 8. Visual platform pilot rules

Dedicated visual platforms may be used only as a supporting production layer.

Allowed uses:

- consistent character pose variants;
- building/object replacement candidates;
- background/style variants;
- controlled variation from approved internal/reference images;
- upscaling/cleanup;
- icon/badge/frame exploration.

Not allowed:

- replacing product design judgment;
- copying third-party trade dress;
- training on unlicensed material;
- generating a giant unreviewed asset dump;
- deciding final signoff.

Required provenance fields for generated assets:

```yaml
assetId: string
sourceTool: string
promptFile: string | null
referenceFiles: string[]
rightsStatus: owned | generated_project_owned | licensed | reference_only | unknown
approvedBy: string | needs_human_signoff
approvedAt: string | null
approvalNotes: string
```

---

## 9. Screenshot signoff rubric

For each candidate visual branch, capture:

- desktop hero;
- mobile hero;
- selected building/object;
- Clover acting;
- active contract / town signal;
- low resource or bottleneck;
- reduced motion state if animation changed.

Score 1–5:

| Criterion | 1 | 3 | 5 |
|---|---|---|---|
| Game read | dashboard/tool | mixed | unmistakable game |
| Frontier warmth | absent | acceptable | emotionally strong |
| Objective clarity | unclear | readable | obvious in 5 sec |
| Clover embodiment | decorative | visible | visibly acting in world |
| Asset quality | placeholder | coherent | launch-grade |
| Mobile calmness | cluttered | usable | calm and clear |
| Agent truth | fake/hidden | traceable | visible partner, debug hidden |

Signoff requires:

- no criterion below 4 for desktop hero;
- no criterion below 3 for mobile hero;
- Clover embodiment >= 4;
- named art/design owner approval.

---

## 10. Hero-media linkage

If the prior hero video/script material is recovered, use it here as a **tone and character reference**, not as automatic gameplay scope.

Candidate remembered elements:

- Lobster;
- Chibi girl;
- Wizard kid;
- Prairie dog.

Possible use after recovery:

- marketing/trailer cast;
- style reference for charm and humor;
- future visitor/event cameos;
- optional non-interactive visual easter eggs if approved.

Not allowed in V1.4:

- replacing Clover;
- adding new NPC gameplay systems;
- adding new quests/contracts;
- inserting unrelated mascot clutter into the main plot.
