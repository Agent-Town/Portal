# Agent Town: Founders Plot V1.3 Specification
## Visual Game Surface, Diegetic UI, and GenAI Asset Pipeline

**Status:** implementation-ready specification for the next sprint  
**Version:** v1.3.0  
**Date:** 2026-04-20  
**Primary branch context:** `codex/founders-plot-v1-2-hardening`  
**Product name:** **Agent Town**  
**Chapter / campaign name:** **Founders Plot**  
**Sprint name:** **V1.3 Visual Game Surface**

---

## 0. Executive summary

The current Founders Plot implementation has a real game backend: persistent plot state, contracts, town signals, a Public Square, a Town Journal, an OpenClaw Lite Foreman path, a scheduler, audit/recap surfaces, and useful tests. The main remaining product gap is visual: the experience still reads too much like a **text-heavy management dashboard** instead of a **real town-building game**.

V1.3 must convert the default player surface from:

> panels about a town

into:

> a visible town where buildings, requests, resources, timers, shortages, rewards, and Clover the Foreman are represented inside the scene.

This sprint must **not** add major new gameplay systems. The goal is to make the existing V1 systems feel like a flagship game surface.

### V1.3 hero moment

A player opens Agent Town: Founders Plot and immediately understands:

1. this is a cozy frontier town-building game;
2. this is my plot;
3. this is the next thing I should do;
4. this is Clover, my AI Foreman;
5. Clover is visibly helping in the world, not just in a text card.

### Required outcome

By the end of V1.3, the default Founders Plot screen must show:

- a scenic frontier plot as the dominant composition;
- clickable in-world buildings and town objects;
- visible building states instead of mostly textual state panels;
- one current goal and one obvious primary action;
- Clover embodied as a character in the scene;
- panels moved into drawers, sheets, tooltips, and in-world objects;
- GenAI-created visual assets that match the established Agent Town style;
- screenshot-tested mobile and desktop layouts.

---

## 1. Source context and design commitments

### 1.1 Locked product direction

These decisions are already accepted and must not be reopened in this sprint.

- **Agent Town** is the product/masterbrand.
- **Founders Plot** is the launch chapter / starting campaign.
- V1 is about founding a living town, not building a broad AI platform UI.
- V1 should prove the home-plot game with contracts, recap, light Foreman assistance, and visual attachment.
- V2 is where persistent off-session Foreman/governance work grows.
- V3 is where operating identity, charters, specialists, and deeper replayability grow.

### 1.2 Style direction

The project has moved away from pixel style.

V1.3 must use the current **Frontier Storybook Shell** direction:

- warm frontier civic-builder;
- illustrated / storybook / tactile;
- non-pixel;
- sunlit, welcoming, dusty, practical;
- wood, brass, parchment, cream, ochre, teal, rust;
- friendly silhouettes;
- no grim western;
- no cowboy parody;
- no dashboard-first layout.

Existing style anchors:

- `public/agenttown.jpeg`
- `public/logo.jpg`
- `agent-town-design-pack/BRAND.md`
- `agent-town-design-pack/DESIGN.md`
- `agent-town-design-pack/GAME_UX.md`

### 1.3 Current implementation reality

The current page is implemented in vanilla DOM/CSS/JS:

- `public/founders-plot.html`
- `public/experiences/founders-plot/app.js`
- `public/experiences/founders-plot/styles.css`

Current visible structure includes:

- hero panel;
- HQ/status strip;
- inventory strip;
- 3x3 settlement board;
- timers/queues;
- current goal panel;
- action sheet panel;
- contract board panel;
- town signals panel;
- public square panel;
- Foreman panel;
- delegation panel;
- approvals panel;
- rewards panel;
- journal panel;
- recap drawer;
- footer status.

This has the right data surfaces, but too many of them are visible at once. V1.3 must preserve the underlying gameplay and tests while changing the default visual hierarchy.

---

## 2. Goals and non-goals

### 2.1 Goals

1. **Make the world the interface.**  
   The player should interact with buildings and town objects, not mostly with stacked panels.

2. **Make the game legible in 5 seconds.**  
   A new user should understand the genre, next action, and Clover’s role without reading long prose.

3. **Reduce default visible text.**  
   The default screen must not be a wall of cards or paragraphs.

4. **Embody the Foreman.**  
   Clover must appear in or next to the plot scene and visibly respond to scheduler/Foreman states.

5. **Represent state visually.**  
   Building, contract, resource, scheduler, and reward states must have visual forms.

6. **Preserve the working backend.**  
   Do not rewrite the Founders Plot simulation, contracts, scheduler, tools, or OpenClaw Lite integration.

7. **Create a GenAI asset pipeline.**  
   The team may generate visual assets, but assets must be style-locked, reviewed, optimized, and manifest-driven.

8. **Strengthen test-driven frontend delivery.**  
   Visual hierarchy must be enforced with automated tests and screenshot baselines.

### 2.2 Non-goals

The V1.3 sprint must **not** implement:

- persistent off-session Foreman execution;
- new contract archetypes;
- new resources;
- new economy/currency systems;
- doctrine board expansion;
- specialist Foremen;
- creator/UGC systems;
- social sharing;
- PixiJS/Phaser full rewrite;
- blockchain/wallet UI changes;
- full map/camera/pathfinding system;
- real-time NPC citizen simulation.

V1.3 is a **visual game-surface sprint**, not a systems-expansion sprint.

---

## 3. Product UX thesis

### 3.1 Old default feeling to eliminate

The default screen must no longer feel like:

> I am operating a task dashboard for a resource simulator.

### 3.2 New default feeling to create

The default screen must feel like:

> I am standing over my warm frontier plot, watching it grow with Clover’s help.

### 3.3 Five-second comprehension target

A person seeing the screen for five seconds should be able to answer:

1. **What kind of game is this?**  
   “A town-building / settlement-building game.”

2. **What is the next thing to do?**  
   “Build/collect/upgrade the highlighted thing.”

3. **Where is the AI helper?**  
   “That character, Clover.”

4. **What is happening right now?**  
   “This building is producing / this building is ready / this contract is available.”

5. **Does it look like a game?**  
   “Yes, it looks like a playable town scene, not a form dashboard.”

This five-second test is a manual product gate, but automated tests in this document enforce measurable proxies.

---

## 4. Target screen architecture

### 4.1 Desktop default layout

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Top HUD: Agent Town: Founders Plot | HQ Lvl | Wood Stone Food Coin   │
│          One compact current objective                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                         SCENIC FOUNDERS PLOT                         │
│                                                                      │
│        HQ       Lumber Camp       Farm Plot       Quarry              │
│                                                                      │
│        Workshop        Market Stall       Contract Board              │
│                                                                      │
│        Public Square / Welcome Sign       Foreman Hut / Clover        │
│                                                                      │
│  Building badges, timers, ready states, citizens/wagons, resource FX  │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ Contextual bottom sheet: selected object OR next action OR Foreman    │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Mobile default layout

```text
┌──────────────────────────────┐
│ Compact HUD + current goal   │
├──────────────────────────────┤
│                              │
│      Scrollable/fit plot     │
│                              │
│      Clover + buildings      │
│                              │
├──────────────────────────────┤
│ Bottom action sheet          │
└──────────────────────────────┘
```

### 4.3 Required visible regions

The default screen must include these regions:

1. **Top HUD**  
   Core resources, HQ level, and one compact objective.

2. **Scenic Plot Stage**  
   Dominant world view with buildings and town objects.

3. **Contextual Action Sheet**  
   Appears at bottom or side only when relevant; never competes with the world as the main composition.

4. **Clover / Foreman Presence**  
   Visible avatar or portrait anchored to the stage.

5. **Drawer Tray / Object Access**  
   Contract Board, Journal, Delegation, Approvals, Rewards, and Recap must be accessible but not all expanded by default.

---

## 5. Default information hierarchy

### 5.1 One primary objective

There must be exactly one current objective visible in default state.

Examples:

- “Build the Farm Plot.”
- “Collect wood from the Lumber Camp.”
- “Turn in the Depot’s wood request.”
- “Let Clover collect ready output.”

### 5.2 One primary CTA

There must be exactly one primary CTA visible above the fold.

Examples:

- `Build Farm Plot`
- `Collect Wood`
- `Turn In Contract`
- `Start Clover`
- `Approve Clover`

Secondary actions must be visually secondary.

### 5.3 Maximum visible prose

Default screen prose limits:

- desktop: **≤ 120 visible words**;
- mobile: **≤ 80 visible words**.

Do not count text hidden inside closed drawers, tooltips, dialogs, or `<details>` elements.

### 5.4 No default debug language

The default game surface must not include these terms:

- provider
- model
- API key
- endpoint
- bearer
- token
- runtime bridge
- OpenClaw
- worker command
- HTTP
- JSON
- schema
- wallet
- chain
- ERC

Those concepts may exist backstage, but not in the player’s main game loop.

---

## 6. Diegetic transformation map

V1.3 must transform the current panel surfaces as follows.

| Current UI surface | V1.3 game-surface representation | Default visibility |
|---|---|---|
| Settlement board | Scenic plot stage | Always visible |
| 3x3 starter pads | In-world buildable lots / stakes / signs | Always visible if unlocked/relevant |
| Current goal card | Quest ribbon / objective banner | Always visible |
| Action sheet card | Contextual bottom sheet | Only when selected or goal needs action |
| Contract board panel | Physical Contract Board object in the plot | Object visible; drawer opens on click |
| Town signals panel | Town bell / mood badges / small HUD icons | Compact only; details in drawer |
| Public square panel | Public Square / Welcome Sign object | Object visible; drawer opens on click |
| Foreman panel | Clover avatar + Foreman Hut + speech bubble | Avatar visible; details in drawer |
| Delegation panel | Foreman drawer tab | Hidden by default |
| Approvals panel | Badge/inbox on Clover or Town Hall | Hidden unless blocking |
| Rewards panel | Sparkles/badges on relevant object | Hidden unless reward ready |
| Journal panel | Journal/book icon or Town Hall drawer | Hidden by default |
| Recap drawer | Morning Brief / Return Brief modal/drawer | Only on return or user opens |
| Queue list | Timer rings and small queue drawer | Visual badges by default; list hidden |

---

## 7. Scenic Plot Stage specification

### 7.1 Required object set

The stage must include visual representations for these P0 objects:

1. HQ / Headquarters
2. Lumber Camp
3. Farm Plot
4. Quarry
5. Workshop
6. Market Stall
7. Contract Board
8. Public Square / Welcome Sign
9. Foreman Hut or Clover’s work corner
10. Empty buildable lots / stakes

### 7.2 Building states

Every buildable building must support these visual states:

| State | Meaning | Required visual treatment |
|---|---|---|
| `LOCKED` | Not yet unlocked | dim silhouette, lock badge, low contrast |
| `BUILDABLE` | Can be placed | empty lot with sign/stakes, gentle pulse on goal-relevant lot |
| `UNDER_CONSTRUCTION` | Construction job active | scaffolding/dust/hammer icon/timer ring |
| `IDLE` | Built, no active job, no output | normal building, subtle idle animation |
| `PRODUCING` | Active job running | timer ring + small activity animation |
| `READY` | Output ready to collect | bounce/sparkle + resource crate/badge |
| `BLOCKED` | Cannot act due to missing resource/storage/permission | rust warning badge + tooltip |
| `UPGRADE_READY` | Upgrade possible and relevant | brass/teal upgrade badge |

### 7.3 Stage area dominance

The stage must visually dominate the route.

Automated metrics:

- Desktop 1280px: `stageVisibleAreaRatio >= 0.56`
- Tablet 768px: `stageVisibleAreaRatio >= 0.52`
- Mobile 390px: `stageVisibleAreaRatio >= 0.58` of initial viewport after top HUD

Definition:

```text
stageVisibleAreaRatio = visibleBoundingBox(plotStage within viewport below top HUD) / visibleViewportAreaBelowTopHud
```

### 7.4 Stage interaction rules

- Every interactive object in the plot must be a real `<button>` or accessible element with `role="button"`, keyboard focus, and an `aria-label`.
- Clicking a building opens the contextual action sheet for that building.
- Clicking empty buildable lot opens build options or performs the current build CTA if there is only one valid option.
- Clicking Contract Board opens the contract drawer.
- Clicking Clover opens the Foreman drawer.
- Clicking Public Square / Welcome Sign opens the civic/aesthetic drawer.
- Hover/focus shows short tooltip; mobile tap opens sheet instead.

---

## 8. Clover / Foreman embodiment

### 8.1 Required Clover states

Clover must have visible state, not only text status.

| Foreman state | Visual representation | Copy style |
|---|---|---|
| `NOT_STARTED` | Clover near hut, relaxed / waiting | “Clover is ready when you are.” |
| `OBSERVING` | Clover looking at clipboard / map | “Watching the plot.” |
| `THINKING` | subtle thought bubble / map glance | “Checking the safest move.” |
| `ACTING` | Clover walks or points toward target building | “Collecting food.” |
| `WAITING_FOR_PERMISSION` | Clover near player/HQ with approval badge | “Needs your say-so.” |
| `PAUSED` | Clover seated / lantern dim | “Foreman paused.” |
| `STALE_OR_RESTART_NEEDED` | Clover faded/greyed, restart icon | “Clover needs a fresh start.” |
| `ERROR` | calm warning badge, no panic | “Clover hit a snag.” |

### 8.2 Foreman action feedback

When Clover executes a scheduled or manual Foreman action:

1. Clover enters `ACTING`.
2. Clover is visually associated with the target building:
   - walk animation, arrow path, or camera-safe pointer line;
   - target building highlights briefly.
3. The action result appears as a compact receipt:
   - default one line;
   - expandable for audit detail.
4. If resources changed, resource flyouts animate from building to top HUD.
5. The event is reflected in Journal/Recap.

### 8.3 Foreman copy limit

Clover’s default speech bubble must be one sentence, maximum 90 characters.

Good:

> “The farm is ready. I can collect it safely.”

Bad:

> “The OpenClaw Lite worker runtime has authenticated and will execute the collect_outputs tool because the scheduler tick determined that the action is allowed.”

### 8.4 Runtime truth remains available, but backstage

Detailed runtime state may remain available behind a Foreman details disclosure.

Default player surface shows:

- “Clover is watching.”
- “Clover is paused.”
- “Clover needs a fresh start.”

Backstage details may show:

- runtime id;
- token state;
- worker trace id;
- scheduler due time.

---

## 9. Asset generation specification

### 9.1 Asset generation is allowed and expected

The implementation team may use generative AI to create visual assets. This sprint should use GenAI for the first complete visual pack, because the goal is to move quickly from dashboard UI to game UI.

However, generated assets must be controlled. They must match the Agent Town style and must not introduce inconsistent, copyrighted, or unreviewed art.

### 9.2 Asset style lock

All generated assets must follow this style lock.

```text
Agent Town Frontier Storybook style.
Warm stylized frontier civic-builder, hand-painted digital illustration, non-pixel, soft 2.5D / three-quarter view, friendly rounded silhouettes, sunlit ochre sand and cream parchment palette, wood and brass details, subtle teal accents for intelligence and active systems, cozy hopeful settlement mood, clean readable shape language, gentle shadows, no photorealism, no grim western, no weapons focus, no parody cowboy exaggeration, no text baked into the image, no logos, no copyrighted characters, no copying existing game assets.
```

### 9.3 Negative style prompt

Use this negative style prompt for every image model when supported:

```text
Do not use pixel art, photorealism, cyberpunk, dark horror, gritty violence, guns as focal objects, saloon brawl imagery, modern skyscrapers, UI text inside the image, readable signs, brand logos, copyrighted characters, direct imitation of Township, SimCity, Stardew Valley, Clash of Clans, Disney, Pixar, or any named game/animation studio style.
```

### 9.4 Asset prompt prefix

Every prompt must begin with the style lock or a shortened approved prefix:

```text
Style: Agent Town Frontier Storybook, warm non-pixel illustrated frontier town-builder, sunlit ochre/cream/wood/brass palette with subtle teal accents, friendly readable silhouettes, three-quarter view, no baked-in text, no logos.
```

### 9.5 Prompt examples

#### HQ level 1

```text
Style: Agent Town Frontier Storybook, warm non-pixel illustrated frontier town-builder, sunlit ochre/cream/wood/brass palette with subtle teal accents, friendly readable silhouettes, three-quarter view, no baked-in text, no logos.

Create a small frontier headquarters building for a cozy town-building game. It should feel like the first civic building of a hopeful settlement: wooden porch, warm windows, small flagpole without readable symbols, a notice rail, simple roof, dust and grass details. Transparent background. Centered object. 3/4 top-down view. Readable at small size. No text on signs.
```

#### Lumber Camp

```text
Style: Agent Town Frontier Storybook, warm non-pixel illustrated frontier town-builder, sunlit ochre/cream/wood/brass palette with subtle teal accents, friendly readable silhouettes, three-quarter view, no baked-in text, no logos.

Create a cozy frontier lumber camp building for a town-builder. Include stacked logs, a covered saw bench, a tiny work shed, friendly rounded shape language, warm dusty lighting, and safe non-violent tools. Transparent background. Centered object. 3/4 top-down view. Readable silhouette at 120px.
```

#### Farm Plot

```text
Style: Agent Town Frontier Storybook, warm non-pixel illustrated frontier town-builder, sunlit ochre/cream/wood/brass palette with subtle teal accents, friendly readable silhouettes, three-quarter view, no baked-in text, no logos.

Create a small frontier farm plot for a cozy civic town-builder. Include tilled rows, sprouting crops, a water barrel, a little fence, and warm sunlit soil. Transparent background. Centered object. 3/4 top-down view. Friendly and readable, not realistic farming simulation.
```

#### Quarry

```text
Style: Agent Town Frontier Storybook, warm non-pixel illustrated frontier town-builder, sunlit ochre/cream/wood/brass palette with subtle teal accents, friendly readable silhouettes, three-quarter view, no baked-in text, no logos.

Create a small frontier quarry building for a cozy town-builder. Include light stone piles, a wooden crane or pulley, a cart, and safe hand tools. Warm desert light, friendly rounded shapes, transparent background, centered object, 3/4 top-down view.
```

#### Workshop

```text
Style: Agent Town Frontier Storybook, warm non-pixel illustrated frontier town-builder, sunlit ochre/cream/wood/brass palette with subtle teal accents, friendly readable silhouettes, three-quarter view, no baked-in text, no logos.

Create a frontier workshop for a cozy town-builder. Include a small craft building with brass/wood details, a chimney, workbench, crates, and a warm inviting look. Transparent background. Centered object. 3/4 top-down view. No text.
```

#### Market Stall

```text
Style: Agent Town Frontier Storybook, warm non-pixel illustrated frontier town-builder, sunlit ochre/cream/wood/brass palette with subtle teal accents, friendly readable silhouettes, three-quarter view, no baked-in text, no logos.

Create a small frontier market stall for a cozy town-builder. Include a canvas awning, baskets, crates, a small counter, and warm civic market feeling. Transparent background. Centered object. 3/4 top-down view. No readable signs or logos.
```

#### Contract Board

```text
Style: Agent Town Frontier Storybook, warm non-pixel illustrated frontier town-builder, sunlit ochre/cream/wood/brass palette with subtle teal accents, friendly readable silhouettes, three-quarter view, no baked-in text, no logos.

Create a physical town contract board object for a cozy frontier town-builder. Wooden posts, parchment papers pinned to it, brass pins, small lantern, but no readable text. Transparent background. Centered object. 3/4 top-down view.
```

#### Public Square / Welcome Sign

```text
Style: Agent Town Frontier Storybook, warm non-pixel illustrated frontier town-builder, sunlit ochre/cream/wood/brass palette with subtle teal accents, friendly readable silhouettes, three-quarter view, no baked-in text, no logos.

Create a cozy frontier public square centerpiece with a welcome sign shape, flower barrel, small path stones, lanterns, and civic warmth. Do not include readable text on the sign. Transparent background. Centered object. 3/4 top-down view.
```

#### Foreman Hut

```text
Style: Agent Town Frontier Storybook, warm non-pixel illustrated frontier town-builder, sunlit ochre/cream/wood/brass palette with subtle teal accents, friendly readable silhouettes, three-quarter view, no baked-in text, no logos.

Create a small Foreman's Hut for a cozy AI town-building game. It should look like a friendly work office: map table, small porch, hanging lantern, rolled plans, teal detail suggesting smart assistance. Transparent background. Centered object. 3/4 top-down view.
```

#### Clover character

```text
Style: Agent Town Frontier Storybook, warm non-pixel illustrated frontier town-builder, sunlit ochre/cream/wood/brass palette with subtle teal accents, friendly readable silhouettes, three-quarter view, no baked-in text, no logos.

Create Marshal Clover Kincaid, a friendly AI Foreman guide for a cozy frontier town-builder. Warm trustworthy expression, practical hat, small badge, rolled plans or clipboard, upright helpful stance, approachable non-threatening design. Full body, transparent background. Keep silhouette readable at small size. No weapons.
```

### 9.6 Required asset list

V1.3 must ship a complete P0 asset pack.

#### Scene assets

| Asset id | Required | Format | Notes |
|---|---:|---|---|
| `scene_founders_plot_desktop` | yes | `.webp` | 2560x1440 or similar |
| `scene_founders_plot_mobile` | yes | `.webp` | vertical/cropped safe composition |
| `scene_ground_overlay` | optional | `.webp`/`.png` | roads/lots/decor if separate |

#### Building/object assets

| Asset id prefix | Required states |
|---|---|
| `building_hq` | `level_1`, `level_2`, `level_3`, `level_4`, `level_5` OR one base plus clear level overlays |
| `building_lumber_camp` | base |
| `building_farm_plot` | base |
| `building_quarry` | base |
| `building_workshop` | base |
| `building_market_stall` | base |
| `object_contract_board` | base |
| `object_public_square_welcome_sign` | base + upgraded |
| `object_foreman_hut` | base |
| `object_empty_lot` | buildable |
| `object_locked_lot` | locked |

#### State overlay assets

| Asset id | Required |
|---|---:|
| `overlay_construction` | yes |
| `overlay_producing_timer_frame` | yes, may be CSS/SVG |
| `overlay_ready_sparkle` | yes, may be CSS/SVG |
| `overlay_blocked_badge` | yes, may be CSS/SVG |
| `overlay_upgrade_badge` | yes, may be CSS/SVG |
| `overlay_contract_available` | yes, may be CSS/SVG |
| `overlay_approval_needed` | yes, may be CSS/SVG |

#### Character assets

| Asset id | Required |
|---|---:|
| `clover_idle` | yes |
| `clover_observing` | yes |
| `clover_thinking` | yes |
| `clover_acting` | yes |
| `clover_waiting_approval` | yes |
| `clover_paused` | yes |
| `clover_restart_needed` | yes |

Clover may use one base image plus CSS pose overlays only if the visible states are clearly distinct.

### 9.7 Asset file placement

Use this structure:

```text
public/experiences/founders-plot/assets/
  manifest.json
  README.md
  prompts/
    style-lock.md
    buildings.md
    clover.md
    scene.md
  scenes/
    founders-plot-desktop.webp
    founders-plot-mobile.webp
  buildings/
    hq-lv1.webp
    hq-lv2.webp
    hq-lv3.webp
    hq-lv4.webp
    hq-lv5.webp
    lumber-camp.webp
    farm-plot.webp
    quarry.webp
    workshop.webp
    market-stall.webp
  objects/
    contract-board.webp
    welcome-sign.webp
    welcome-sign-upgraded.webp
    foreman-hut.webp
    empty-lot.webp
    locked-lot.webp
  characters/
    clover-idle.webp
    clover-observing.webp
    clover-thinking.webp
    clover-acting.webp
    clover-waiting-approval.webp
    clover-paused.webp
    clover-restart-needed.webp
  overlays/
    construction.webp
    sparkle.svg
    blocked.svg
    upgrade.svg
    approval.svg
    contract.svg
```

### 9.8 Asset manifest schema

Create `public/experiences/founders-plot/assets/manifest.json`.

```json
{
  "schemaVersion": "founders-plot-assets-v1",
  "styleFamily": "agent-town-frontier-storybook-v1",
  "generatedAt": "2026-04-20T00:00:00.000Z",
  "reviewStatus": "approved",
  "assets": [
    {
      "id": "building_lumber_camp_base",
      "kind": "building",
      "buildingType": "LUMBER_CAMP",
      "state": "base",
      "src": "/experiences/founders-plot/assets/buildings/lumber-camp.webp",
      "width": 512,
      "height": 512,
      "transparent": true,
      "anchor": { "x": 0.5, "y": 0.86 },
      "hitbox": { "x": 0.18, "y": 0.2, "w": 0.64, "h": 0.62 },
      "zIndexHint": 30,
      "promptFile": "prompts/buildings.md#lumber-camp",
      "license": "project-owned-generated",
      "styleReview": {
        "passed": true,
        "score": 5,
        "reviewer": "human"
      }
    }
  ]
}
```

### 9.9 Asset acceptance rules

Every generated asset must pass these rules before merge.

#### Automated checks

- file exists;
- file path is listed in manifest;
- width/height match manifest;
- transparent assets actually have alpha, unless scene background;
- no individual sprite asset > 400 KB;
- no scene asset > 900 KB;
- total initial Founders Plot visual asset load <= 2.8 MB;
- all assets have `license`, `promptFile`, and `styleReview` fields;
- all P0 object ids exist.

#### Human/AI-assisted visual review checks

Reviewer must answer yes/no:

1. Does the asset match Agent Town Frontier Storybook style?
2. Does it avoid pixel art?
3. Does it avoid photorealism?
4. Does it avoid direct imitation of a known game?
5. Does it avoid baked-in text/logos?
6. Is the silhouette readable at 120px?
7. Does it feel warm/hopeful rather than grim/violent?
8. Does it match the palette of the existing Portal shell?

All answers must be yes for P0 assets.

### 9.10 Style review prompt for AI-assisted checking

The team may use a vision-capable model to assist asset review. It must not replace human approval, but it can catch mismatches.

```text
You are reviewing visual assets for Agent Town: Founders Plot.

Style target:
Warm non-pixel Frontier Storybook town-builder. Sunlit ochre/cream/wood/brass palette with subtle teal accents. Friendly readable silhouettes. Cozy civic-builder mood. No photorealism, no pixel art, no grim western, no baked-in text, no logos, no direct imitation of known games.

Review the attached asset against the target style.
Return JSON only:
{
  "matchesStyle": true|false,
  "score": 1-5,
  "problems": ["..."],
  "readableAtSmallSize": true|false,
  "containsTextOrLogo": true|false,
  "looksLikeKnownGameClone": true|false,
  "mergeRecommendation": "approve"|"revise"|"reject"
}
```

---

## 10. Implementation architecture

### 10.1 Preserve the current app model

V1.3 should use the existing vanilla JS/DOM route unless the team already has a no-risk migration path.

Do **not** rewrite the Founders Plot experience into React, PixiJS, or Phaser in this sprint.

### 10.2 Proposed file changes

Add:

```text
public/experiences/founders-plot/assets/...
public/experiences/founders-plot/scene_state.js
public/experiences/founders-plot/scene_render.js
public/experiences/founders-plot/effects.js
public/experiences/founders-plot/visual_metrics.js
scripts/validate_founders_plot_assets.mjs
```

Modify:

```text
public/founders-plot.html
public/experiences/founders-plot/app.js
public/experiences/founders-plot/styles.css
public/experiences/founders-plot/manifest.json
public/experiences/founders-plot/skill.md
public/experiences/founders-plot/heartbeat.md
public/experiences/founders-plot/tools.md
```

Add tests:

```text
e2e/151_founders_plot_visual_game_surface.spec.js
e2e/152_founders_plot_scene_object_states.spec.js
e2e/153_founders_plot_foreman_embodiment.spec.js
e2e/154_founders_plot_asset_manifest.spec.js
e2e/155_founders_plot_mobile_visual_hierarchy.spec.js
e2e/156_founders_plot_reduced_motion_accessibility.spec.js
```

Add optional unit tests:

```text
tests/founders_plot_visual_state.test.js
tests/founders_plot_asset_manifest.test.js
```

### 10.3 Preserve current selectors where possible

Existing tests and code may rely on these ids/test ids. V1.3 should preserve them as aliases or update tests deliberately.

- Keep `data-testid="founders-board"` on the new scenic stage root.
- Keep `id="plotBoard"` as the stage root or provide a compatibility wrapper.
- Keep `data-testid="founders-current-goal"` for the objective banner/ribbon.
- Keep `data-testid="founders-selection-panel"` for the contextual action sheet.
- Keep `data-testid="founders-contract-board"` for the contract drawer content.
- Keep `data-testid="founders-foreman-panel"` for the Foreman drawer content.
- Keep `data-testid="founders-standing-order"`, `founders-plan-card`, and `founders-receipt` inside the Foreman drawer.
- Keep `data-testid="founders-recap-drawer"` or replace with a compatible Morning Brief drawer with the same test id.

### 10.4 New required test ids

Add these test ids for visual tests:

```text
founders-game-shell
founders-top-hud
founders-objective-ribbon
founders-plot-stage
founders-stage-object-HQ
founders-stage-object-LUMBER_CAMP
founders-stage-object-FARM_PLOT
founders-stage-object-QUARRY
founders-stage-object-WORKSHOP
founders-stage-object-MARKET_STALL
founders-stage-object-CONTRACT_BOARD
founders-stage-object-PUBLIC_SQUARE
founders-stage-object-FOREMAN_HUT
founders-clover-avatar
founders-clover-bubble
founders-bottom-action-sheet
founders-drawer-tray
founders-resource-flyout-layer
```

### 10.5 Scene state adapter

Create a deterministic adapter that maps server state to visual state.

```ts
type SceneState = {
  hq: {
    level: number;
    xp: number;
    xpToNext: number;
  };
  resources: Record<'wood'|'stone'|'food'|'coin'|'townXp', number>;
  objects: SceneObject[];
  currentGoal: {
    title: string;
    body: string;
    primaryCtaLabel: string;
    primaryCtaAction: string;
    targetObjectId?: string;
  };
  clover: {
    state: 'NOT_STARTED'|'OBSERVING'|'THINKING'|'ACTING'|'WAITING_FOR_PERMISSION'|'PAUSED'|'STALE_OR_RESTART_NEEDED'|'ERROR';
    bubbleText: string;
    targetObjectId?: string;
  };
  drawers: {
    contractBadgeCount: number;
    approvalBadgeCount: number;
    rewardBadgeCount: number;
    journalBadgeCount: number;
  };
};

type SceneObject = {
  id: string;
  kind: 'building'|'object'|'lot'|'character';
  buildingType?: string;
  label: string;
  state: 'LOCKED'|'BUILDABLE'|'UNDER_CONSTRUCTION'|'IDLE'|'PRODUCING'|'READY'|'BLOCKED'|'UPGRADE_READY';
  x: number; // 0..1 stage coordinate
  y: number; // 0..1 stage coordinate
  z: number;
  assetId: string;
  badges: Array<{ type: string; label: string; tone: 'good'|'warn'|'neutral' }>;
  timer?: { startedAtMs: number; endsAtMs: number; progress: number };
  primaryAction?: { label: string; action: string };
  ariaLabel: string;
};
```

The adapter must be pure and testable.

### 10.6 No server change requirement

V1.3 should not require backend schema changes. It may add optional server-provided visual hints later, but the sprint must be implementable from the existing `/api/founders-plot/state` response.

---

## 11. Main UI components

### 11.1 `FoundersGameShell`

Purpose: route-level wrapper.

Responsibilities:

- apply visual background;
- own top HUD, stage, bottom sheet, drawers;
- avoid page-level scrolling on desktop except when drawer expanded;
- support mobile vertical layout.

Acceptance:

- `data-testid="founders-game-shell"` exists;
- no duplicate ids in DOM;
- no default debug language;
- stage dominates viewport.

### 11.2 `FoundersTopHud`

Purpose: compact core state.

Contents:

- Agent Town: Founders Plot label;
- HQ level;
- wood, stone, food, coin;
- compact current objective or objective progress;
- optional drawer/menu button.

Rules:

- no more than 2 rows on mobile;
- no resource paragraphs;
- resource values update with flyout animation on collection.

### 11.3 `ObjectiveRibbon`

Purpose: single current goal.

Contents:

- short title;
- one sentence max;
- primary CTA.

Rules:

- exactly one `.primary` CTA;
- if a blocking approval exists, the approval owns the objective;
- if a contract is ready to turn in, the contract owns the objective;
- otherwise tutorial/progression owns the objective.

### 11.4 `PlotStage`

Purpose: main scenic world.

Rules:

- uses scene background image/layers;
- renders all visible building and object buttons;
- handles hover/focus/tap;
- provides state badges and timer rings;
- contains Clover avatar;
- contains resource flyout layer;
- supports `prefers-reduced-motion`.

### 11.5 `SceneObjectButton`

Purpose: clickable building/town object.

Required props/data:

- id;
- label;
- state;
- asset id;
- coordinates;
- primary action;
- badges;
- timer;
- accessibility label.

Rules:

- must be keyboard focusable;
- must expose `aria-label` that includes object label and state;
- must have visible focus ring;
- should not rely only on color to convey state.

### 11.6 `BottomActionSheet`

Purpose: contextual actions for selected object or current goal.

Rules:

- closed or compact by default when no selection/action needed;
- expands when object selected;
- shows only relevant actions;
- no more than one primary action;
- secondary details behind “More”.

### 11.7 `CloverAvatar`

Purpose: embodied AI helper.

Rules:

- visible by default;
- stateful pose/status;
- one-line bubble;
- clicking opens Foreman drawer;
- scheduled Foreman actions trigger visible state changes.

### 11.8 `DrawerTray`

Purpose: access to secondary systems without default panel overload.

Drawer entries:

- Contracts;
- Foreman;
- Journal;
- Recap / Morning Brief;
- Town Signals;
- Rewards;
- Approvals.

Rules:

- icons or short labels;
- badges for attention;
- drawers must not cover the full stage unless opened intentionally;
- mobile drawers become bottom sheets.

---

## 12. Game-feel and motion specification

### 12.1 Required event feedback

| Event | Required feedback |
|---|---|
| building placed | dust puff + object appears + short sound placeholder hook |
| construction started | scaffold/hammer overlay + timer ring |
| construction complete | sparkle + building bounce once |
| job queued | building enters producing state + timer ring |
| output ready | ready badge + gentle bounce |
| output collected | resource flyout to HUD + brief sparkle |
| contract accepted | paper pin animation on Contract Board |
| contract turned in | board sparkle + town signal badge update |
| Foreman action executed | Clover moves/points + target highlight + receipt line |
| HQ upgraded | short level-up ceremony + HUD glow |
| approval needed | Clover badge + objective ribbon takeover |

### 12.2 Motion rules

- Motion should clarify state, not decorate constantly.
- Continuous animation must be subtle.
- Action feedback should be brief: 300–1200ms.
- No motion should block input longer than 300ms.
- `prefers-reduced-motion: reduce` must disable continuous animations and replace them with static state changes.

### 12.3 CSS animation names

Use predictable names:

```css
@keyframes at-resource-flyout { ... }
@keyframes at-ready-bounce { ... }
@keyframes at-construction-dust { ... }
@keyframes at-object-highlight { ... }
@keyframes at-clover-act { ... }
@keyframes at-hq-level-up { ... }
```

---

## 13. Visual text compression rules

### 13.1 Default screen allowed text

Allowed by default:

- product/chapter label;
- HQ/resource labels;
- current goal title/body;
- one primary CTA;
- one Clover bubble;
- object labels if short.

### 13.2 Default screen disallowed text

Disallowed by default:

- long contract descriptions;
- raw reward breakdowns;
- detailed town signal explanations;
- scheduler timing internals;
- runtime ids;
- long recap paragraphs;
- tool names;
- JSON or schema language.

### 13.3 Progressive disclosure

Detailed content must live in:

- bottom sheets;
- drawers;
- tooltips;
- `details` blocks;
- backstage/developer mode.

---

## 14. Mobile behavior

### 14.1 Mobile-first rules

At 390px width:

- top HUD must fit in two rows max;
- stage must appear immediately after HUD;
- stage must be the largest region;
- primary CTA must remain visible without scrolling if there is a blocking/goal action;
- drawers must open as bottom sheets;
- no sidebar stack.

### 14.2 Touch target rules

- minimum target size: 44px × 44px;
- in-world object visual may be smaller, but hitbox must be at least 44px;
- object hitbox must not overlap another hitbox by more than 20% unless z-order/focus rules are explicit.

### 14.3 Small-screen labels

On mobile:

- building labels may hide until selected;
- state icons remain visible;
- the current goal and selected sheet provide text.

---

## 15. Accessibility requirements

- All interactive scene objects keyboard reachable.
- Focus order:
  1. primary CTA;
  2. stage objects in logical build order;
  3. Clover;
  4. drawer tray;
  5. bottom sheet actions.
- Every scene object has `aria-label` with object name + state + primary action.
- Resource flyouts must not be the only indication of resource changes; HUD values must update textually.
- Reduced motion supported.
- Color is never the only state indicator.
- Contrast meets WCAG AA for all text on UI surfaces.
- Body text never appears directly over busy image areas without a surface/scrim.

---

## 16. Registry extension

The previous `@agent-town` registry focused on shell/onboarding surfaces. V1.3 extends it with a DOM-game layer. This is a design/contract extension; it does not require a framework migration.

### 16.1 New registry item family

Use family:

```text
@agent-town/founders-game-v1
```

### 16.2 New registry items

| Item | Purpose |
|---|---|
| `@agent-town/founders-game-shell` | route wrapper / game page composition |
| `@agent-town/founders-top-hud` | resource and level HUD |
| `@agent-town/objective-ribbon` | one current goal and CTA |
| `@agent-town/plot-stage` | scenic game stage shell |
| `@agent-town/scene-object-button` | accessible clickable building/object |
| `@agent-town/building-state-badge` | locked/building/producing/ready/blocked state indicator |
| `@agent-town/timer-ring` | visual production timer |
| `@agent-town/resource-flyout` | resource collection animation |
| `@agent-town/clover-avatar` | embodied Foreman character |
| `@agent-town/game-bottom-sheet` | contextual action sheet |
| `@agent-town/drawer-tray` | secondary systems access |
| `@agent-town/morning-brief` | recap/return surface |

### 16.3 Registry rule

No generated one-off panel style may be introduced if it can be expressed with one of these items or current primitives.

---

## 17. Testing and metrics

### 17.1 Required automated metrics

| Metric | Required value |
|---|---:|
| `DefaultVisibleWordsDesktop` | `<= 120` |
| `DefaultVisibleWordsMobile` | `<= 80` |
| `PrimaryCtaCountAboveFold` | `== 1` |
| `StageVisibleAreaRatioDesktop1280` | `>= 0.56` |
| `StageVisibleAreaRatioTablet768` | `>= 0.52` |
| `StageVisibleAreaRatioMobile390` | `>= 0.58` |
| `DefaultVisiblePanelCountDesktop` | `<= 3` |
| `DefaultVisiblePanelCountMobile` | `<= 2` |
| `DebugTerminologyCount` | `== 0` |
| `P0SceneObjectCoverage` | `100%` |
| `BuildingStateVisualCoverage` | `100%` |
| `CloverVisibleByDefault` | `true` |
| `CloverStateCoverage` | `100% for required states` |
| `DuplicateDomIdCount` | `0` |
| `ConsoleErrorCountGoldenPath` | `0` |
| `ReducedMotionContinuousAnimationCount` | `0` |
| `AssetManifestP0Coverage` | `100%` |
| `InitialFoundersVisualAssetBytes` | `<= 2.8 MB` |

### 17.2 Screenshot baselines

Add/approve Playwright screenshots:

```text
founders-v1-3-home-390.png
founders-v1-3-home-768.png
founders-v1-3-home-1280.png
founders-v1-3-object-selected-390.png
founders-v1-3-object-selected-1280.png
founders-v1-3-clover-action-1280.png
founders-v1-3-contract-drawer-390.png
founders-v1-3-reduced-motion-1280.png
```

Screenshot tests should allow normal font/image rendering tolerance but fail large layout regressions.

### 17.3 Required tests

#### `e2e/151_founders_plot_visual_game_surface.spec.js`

Must verify:

- `founders-game-shell` exists;
- `founders-plot-stage` exists and dominates viewport;
- default prose count <= limit;
- exactly one primary CTA above fold;
- no default debug language;
- no duplicate DOM ids;
- screenshot baseline captured/compared for 390/768/1280.

#### `e2e/152_founders_plot_scene_object_states.spec.js`

Must verify:

- all P0 objects render;
- building states map to CSS state classes;
- ready output shows ready badge;
- producing job shows timer ring;
- locked/buildable lots are visually distinct;
- clicking object opens bottom action sheet.

#### `e2e/153_founders_plot_foreman_embodiment.spec.js`

Must verify:

- Clover visible by default;
- starting Clover changes visible state;
- scheduler/Run Now action triggers visible acting state;
- target building highlights;
- compact receipt appears;
- runtime/debug language not visible in default Foreman bubble.

#### `e2e/154_founders_plot_asset_manifest.spec.js`

Must verify:

- manifest loads;
- all P0 assets exist;
- dimensions match;
- file size budgets pass;
- transparent assets have alpha where required;
- all assets include promptFile/license/styleReview.

#### `e2e/155_founders_plot_mobile_visual_hierarchy.spec.js`

Must verify at 390px:

- no sidebar stack visible;
- stage appears before secondary drawers;
- drawer tray is compact;
- top HUD two rows max;
- primary CTA visible;
- no horizontal scroll.

#### `e2e/156_founders_plot_reduced_motion_accessibility.spec.js`

Must verify:

- `prefers-reduced-motion` disables continuous animation;
- scene object buttons are keyboard focusable;
- focus ring visible;
- `aria-label`s exist;
- resource changes update text values, not only animation.

### 17.4 Unit tests

#### `tests/founders_plot_visual_state.test.js`

Must verify pure mapping:

- empty plot maps to buildable lots + HQ;
- built Lumber Camp maps to correct object;
- job in progress maps to `PRODUCING` and timer progress;
- output ready maps to `READY`;
- contract ready maps to Contract Board badge;
- approval pending maps to objective takeover;
- Foreman stale maps to restart-needed Clover state.

#### `tests/founders_plot_asset_manifest.test.js`

Must verify:

- manifest schema;
- required ids;
- no unknown style family;
- no missing prompts;
- no unapproved asset.

---

## 18. Implementation milestones

### M0 — Baseline and guardrails

Deliverables:

- capture current screenshots at 390/768/1280;
- count default visible words and panels;
- document current selectors/tests that must remain compatible;
- add `visual_metrics.js` helper for text/panel/stage metrics.

Acceptance:

- baseline metrics recorded in `specs/22_founders_plot_v1_3_visual_game_surface.md` or test output;
- no gameplay/server changes.

### M1 — Asset pack generation and approval

Deliverables:

- generate P0 asset pack;
- create prompts directory;
- create asset manifest;
- optimize assets;
- run automated asset validation;
- complete visual review.

Acceptance:

- `AssetManifestP0Coverage = 100%`;
- total initial visual asset bytes <= 2.8 MB;
- style review passed for all P0 assets.

### M2 — Scenic stage shell

Deliverables:

- update `founders-plot.html` structure;
- add `founders-game-shell`, top HUD, objective ribbon, plot stage, bottom sheet, drawer tray;
- preserve old ids/test ids as compatible aliases.

Acceptance:

- stage dominates viewport;
- one primary CTA;
- default word count below threshold;
- no duplicate DOM ids;
- 390/768/1280 layout screenshots stable.

### M3 — In-world object rendering

Deliverables:

- implement `scene_state.js`;
- implement `scene_render.js`;
- render P0 buildings/objects/lots from current plot state;
- implement state classes, badges, timers, hitboxes, and accessibility labels.

Acceptance:

- all P0 objects appear;
- all required states covered;
- object selection opens bottom action sheet;
- old action flows still work.

### M4 — Panel-to-drawer migration

Deliverables:

- move Contract Board, Town Signals, Public Square, Delegation, Approvals, Rewards, Journal, Recap into drawers/sheets;
- object clicks open corresponding drawers;
- attention badges appear on in-world objects or drawer tray.

Acceptance:

- default visible panel count <= threshold;
- existing content remains reachable;
- no core gameplay information lost;
- mobile drawers work.

### M5 — Clover embodiment

Deliverables:

- add Clover avatar;
- map runtime/Foreman/scheduler status to Clover state;
- add speech bubble;
- animate/indicate Foreman actions;
- target highlight on Foreman action;
- receipt remains available.

Acceptance:

- Clover visible by default;
- all required states represented;
- scheduled/Run Now action produces visible feedback;
- debug/runtime language absent from default bubble.

### M6 — Game juice pass

Deliverables:

- resource flyouts;
- completion sparkles;
- ready bounce;
- construction dust/scaffold;
- timer rings;
- contract pin animation;
- HQ level-up ceremony;
- reduced-motion fallbacks.

Acceptance:

- all required event feedback implemented;
- animations do not block input;
- reduced motion test passes.

### M7 — Final visual QA and TDD gate

Deliverables:

- all new E2E tests;
- all unit tests;
- screenshot baselines;
- updated `skill.md`, `heartbeat.md`, and UX notes where needed;
- update future backlog if any design work is deferred.

Acceptance:

- all existing Founders Plot tests pass;
- all V1.3 visual tests pass;
- manual five-second comprehension review passes;
- product owner approves screenshots.

---

## 19. Data-testid and class contract

Use these CSS state classes.

```text
.at-fp-stage-object
.at-fp-stage-object--locked
.at-fp-stage-object--buildable
.at-fp-stage-object--under-construction
.at-fp-stage-object--idle
.at-fp-stage-object--producing
.at-fp-stage-object--ready
.at-fp-stage-object--blocked
.at-fp-stage-object--upgrade-ready
.at-fp-stage-object--goal-target
.at-fp-clover
.at-fp-clover--idle
.at-fp-clover--observing
.at-fp-clover--thinking
.at-fp-clover--acting
.at-fp-clover--waiting-approval
.at-fp-clover--paused
.at-fp-clover--restart-needed
```

Use these drawer ids/classes.

```text
foundersDrawer-contracts
foundersDrawer-foreman
foundersDrawer-journal
foundersDrawer-recap
foundersDrawer-signals
foundersDrawer-rewards
foundersDrawer-approvals
```

---

## 20. Player-facing copy rules

### 20.1 Product naming

Use:

- **Agent Town** for the game/product.
- **Founders Plot** for the launch chapter.

Good:

> Agent Town: Founders Plot

Bad:

> Founders Plot Runtime Dashboard

### 20.2 Clover wording

Clover should speak like a practical, warm Foreman.

Good:

- “The farm is ready. I can collect it.”
- “Wood is blocking the next build.”
- “I need your say-so before spending coin.”

Bad:

- “Scheduler task run has succeeded.”
- “Worker command origin accepted.”
- “Tool invocation completed.”

### 20.3 Contract wording

Contracts must read like town requests, not abstract resource checks.

Good:

- “Mara at the Depot needs 6 wood before market morning.”
- “The Welcome Sign needs stone to finish the square.”

Bad:

- “Deliver { wood: 6 } to complete SUPPLY contract.”

---

## 21. Risk register

### Risk 1 — Generated assets look inconsistent

Mitigation:

- style lock;
- prompt manifest;
- visual review;
- asset replacement allowed without logic changes.

### Risk 2 — Layout becomes prettier but still text-heavy

Mitigation:

- visible word count tests;
- panel count tests;
- one CTA tests;
- screenshot review.

### Risk 3 — Asset work delays implementation

Mitigation:

- allow placeholder silhouettes only for M2/M3;
- require final P0 assets before merge;
- no new gameplay systems in sprint.

### Risk 4 — Accessibility regresses due to image buttons

Mitigation:

- scene objects must be buttons;
- aria labels;
- focus rings;
- keyboard tests.

### Risk 5 — Old gameplay tests break due to selector changes

Mitigation:

- preserve ids/test ids;
- add compatibility wrappers;
- update tests only when semantic behavior changed.

### Risk 6 — Visual scene hides important state

Mitigation:

- every former panel status must map to either:
  - visible state badge;
  - objective takeover;
  - drawer badge;
  - bottom sheet;
  - recap/morning brief.

---

## 22. Definition of done

V1.3 is done only when all of the following are true.

### Product

- The first screen reads as a town-building game, not a dashboard.
- The scenic plot is the main composition.
- Clover is visibly present and understandable.
- The next action is obvious.
- Current gameplay remains intact.

### Visual

- P0 asset pack exists and passes review.
- Assets match Agent Town style.
- No generated asset contains baked-in text/logos.
- No asset imitates a specific existing game or protected IP.

### UX

- Default visible text below limits.
- One primary CTA.
- Secondary systems moved into drawers/sheets/objects.
- Mobile layout is not a sidebar stack.

### Technical

- Existing V1.2/hardening tests pass.
- New V1.3 visual tests pass.
- Asset validation passes.
- Screenshot baselines approved.
- No duplicate DOM ids.
- No console errors on golden path.

### Accessibility

- Scene object buttons are keyboard accessible.
- ARIA labels exist.
- Reduced motion works.
- Focus rings are visible.

---

## 23. LLM implementation handoff

Agentic AI developers must read these in order:

1. this spec;
2. `agent-town-design-pack/BRAND.md`;
3. `agent-town-design-pack/DESIGN.md`;
4. `agent-town-design-pack/GAME_UX.md`;
5. `public/founders-plot.html`;
6. `public/experiences/founders-plot/app.js`;
7. `public/experiences/founders-plot/styles.css`;
8. `specs/20_founders_plot_v1_2_living_town.md`;
9. `specs/21_founders_plot_v1_2_hardening.md`.

### Required implementation behavior for AI developers

- Do not add new gameplay systems.
- Do not rewrite backend simulation.
- Do not remove existing tests; update only if visual semantics changed.
- Do not introduce debug/provider/runtime language into the game surface.
- Do not invent a new art style.
- Do not use named commercial game styles in generation prompts.
- Use existing state/API/tools.
- Make the stage the interface.

---

## 24. Machine-readable planning summary

```yaml
spec_id: agent-town-founders-plot-v1.3-visual-game-surface
version: 1.3.0
status: implementation-ready
product: Agent Town
chapter: Founders Plot
sprint_name: V1.3 Visual Game Surface
primary_goal: >
  Convert Founders Plot from a text-heavy management dashboard into a scenic,
  diegetic, game-like frontier town-building surface using generated assets
  that match the Agent Town style.

must_not_build:
  - persistent_off_session_foreman
  - new_gameplay_systems
  - new_resources
  - new_contract_types
  - doctrine_expansion
  - specialist_foremen
  - social_sharing
  - pixi_or_phaser_rewrite
  - blockchain_ui_changes

p0_deliverables:
  - scenic_plot_stage
  - in_world_building_objects
  - clover_avatar_and_state_mapping
  - bottom_action_sheet
  - drawer_tray_for_secondary_systems
  - generated_asset_pack_with_manifest
  - visual_hierarchy_tests
  - screenshot_baselines
  - reduced_motion_and_accessibility_tests

p0_objects:
  - HQ
  - LUMBER_CAMP
  - FARM_PLOT
  - QUARRY
  - WORKSHOP
  - MARKET_STALL
  - CONTRACT_BOARD
  - PUBLIC_SQUARE
  - FOREMAN_HUT
  - EMPTY_LOT

key_metrics:
  default_visible_words_desktop_max: 120
  default_visible_words_mobile_max: 80
  primary_cta_count_above_fold: 1
  stage_visible_area_ratio_desktop_min: 0.56
  stage_visible_area_ratio_tablet_min: 0.52
  stage_visible_area_ratio_mobile_min: 0.58
  default_visible_panel_count_desktop_max: 3
  default_visible_panel_count_mobile_max: 2
  debug_terminology_count: 0
  p0_scene_object_coverage: 1.0
  clover_visible_by_default: true
  duplicate_dom_id_count: 0
  initial_visual_asset_bytes_max: 2800000

tests_to_add:
  - e2e/151_founders_plot_visual_game_surface.spec.js
  - e2e/152_founders_plot_scene_object_states.spec.js
  - e2e/153_founders_plot_foreman_embodiment.spec.js
  - e2e/154_founders_plot_asset_manifest.spec.js
  - e2e/155_founders_plot_mobile_visual_hierarchy.spec.js
  - e2e/156_founders_plot_reduced_motion_accessibility.spec.js
  - tests/founders_plot_visual_state.test.js
  - tests/founders_plot_asset_manifest.test.js

asset_style_family: agent-town-frontier-storybook-v1
asset_rule: >
  Generated assets are allowed, but must match warm non-pixel Frontier Storybook
  style, avoid copyrighted/trademarked imitation, contain no baked-in text/logos,
  and pass manifest plus visual review gates.
```

---

## 25. Final instruction to the implementation team

V1.3 succeeds if the same existing systems suddenly feel like a game.

Do not measure success by how many panels were restyled. Measure success by whether the player can look at the screen and say:

> “That is my town. That is the next thing to do. That is Clover helping me.”
