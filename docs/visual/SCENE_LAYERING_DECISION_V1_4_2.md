# Agent Town: Founders Plot V1.4.2 Scene Layering Decision

**Decision date:** 2026-04-22  
**Decision owner:** Product / design  
**Decision:** Use **layered plates** for Founders Plot scenes.

---

## 1. Decision

Founders Plot scenes must use a layered-plates model.

The scene background is not a single all-in-one painting of the complete town. It is a base plate for terrain, lighting, roads, shadows, atmosphere, and distant non-interactive context.

Stateful gameplay objects remain separate live assets rendered by game state.

---

## 2. Why this decision is needed

The V1.4.2 GPT Image 2 rebuild improved scene quality, but a risk remains: scene backgrounds can accidentally bake in buildings or markers that are also rendered as live objects.

That creates several problems:

- duplicate HQ/building silhouettes;
- visual mismatch when a building is locked, upgraded, producing, or missing;
- objective markers appearing twice;
- screenshot pass while runtime truth is wrong;
- future difficulty adding animations, upgrades, or Foreman action links.

Layered plates preserve the art quality while protecting server/world truth.

---

## 3. Layer model

| Layer | Name | Content | State-driven? |
|---|---|---|---:|
| 1 | `scene-base` | terrain, road, horizon, ground texture, light, broad shadows | No |
| 2 | `scene-ambient` | rocks, far fences, distant silhouettes, dust, sky, non-interactive decoration | No |
| 3 | `live-object` | HQ, buildings, Contract Board, Public Square, Foreman Hut, lots | Yes |
| 4 | `character` | Clover and future characters | Yes |
| 5 | `effects` | sparkles, timer rings, action links, resource flyouts | Yes |
| 6 | `ui-overlay` | objective cue, contextual labels, status badges, sheets | Yes |

---

## 4. Allowed baked background content

Scene backgrounds may include:

- terrain;
- roads and paths;
- far horizon;
- distant town silhouettes if not tied to a live object;
- atmospheric dust/clouds/sky;
- non-interactive rocks, fences, tufts, barrels, crates;
- broad lighting and shadows;
- decorative signage that is not an interactive object.

---

## 5. Forbidden baked background content

Scene backgrounds must not bake in live/stateful game objects such as:

- HQ;
- Lumber Camp;
- Farm Plot;
- Quarry;
- Workshop;
- Market Stall;
- Contract Board;
- Public Square / Welcome Sign;
- Foreman Hut;
- Clover;
- timer rings;
- ready badges;
- objective markers;
- current-goal glow;
- construction scaffolds that represent live construction state;
- upgrade-specific visual state.

If a far-away decorative shape resembles one of these objects, it must be documented as `ambient_noninteractive` in the asset manifest and must not use the live object ID.

---

## 6. Manifest requirement

Every scene background asset must declare:

```json
{
  "layerRole": "scene-base",
  "sceneLayering": {
    "mode": "layered_plates",
    "containsLiveStatefulObjects": false,
    "allowedBakedContent": ["terrain", "roads", "far_horizon", "ambient_decor"],
    "forbiddenBakedContent": ["hq", "lumber_camp", "farm_plot", "quarry", "workshop", "market_stall", "contract_board", "public_square", "foreman_hut", "clover", "timer_rings", "objective_markers"]
  }
}
```

Live objects must declare:

```json
{
  "layerRole": "live-object",
  "stateDriven": true,
  "worldObjectId": "hq"
}
```

Clover must declare:

```json
{
  "layerRole": "character",
  "stateDriven": true,
  "characterId": "clover"
}
```

---

## 7. Testing requirement

The implementation must include tests proving:

- all scene backgrounds declare `layered_plates`;
- all scene backgrounds declare `containsLiveStatefulObjects: false`;
- P0 live objects are rendered as live objects;
- default route does not load hero-cast reference images as gameplay scene assets;
- changing an object state changes only the live object/effects layer, not the scene background.

---

## 8. Design summary

Use background art for **place**. Use live object art for **game truth**.

The scene should feel illustrated, warm, and cohesive, but the gameplay state must remain inspectable, testable, and separable.
