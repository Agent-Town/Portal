# DESIGN.md Patch — V1.4.2 Acceptance Cleanup

Apply this patch conceptually to the canonical `DESIGN.md`.

---

## Add to YAML front matter

```yaml
version: "1.4.2-cleanup"
sceneLayers:
  mode: layered_plates
  base: scene-base
  ambient: scene-ambient
  liveObjects: live-object
  characters: character
  effects: effects
  overlays: ui-overlay
  backgroundContainsLiveStatefulObjects: false
components:
  overlay-objective:
    role: objective
    maxVisible: 1
    attention: strongest
  overlay-primary-action:
    role: primary-action
    attention: strong
  overlay-available:
    role: available
    attention: quiet
  overlay-status:
    role: status
    attention: compact
  overlay-ambient:
    role: ambient
    attention: quiet
  overlay-debug:
    role: debug
    normalGameplayVisible: false
```

---

## Add to `## Components`

### World overlays

World overlays must not all use the same white/pale pill treatment.

Use semantic classes:

- `objective`: one dominant current goal marker;
- `primary-action`: selected or recommended immediate action;
- `available`: quiet possible action marker;
- `status`: compact ready/producing/locked/blocked marker;
- `ambient`: optional flavor/location identity;
- `debug`: hidden in normal gameplay.

Only the objective-relevant lot may get strong attention by default.

### Scene layering

Founders Plot uses layered plates:

- background plate for terrain/roads/atmosphere;
- live object layer for all stateful objects;
- character layer for Clover;
- effects layer for action feedback;
- overlay layer for objective/status/action UI.

Background plates must not contain stateful objects such as HQ, production buildings, Contract Board, Public Square, Foreman Hut, Clover, timer rings, or objective markers.

### Clover grounding

Clover must read as physically present:

- visible ground shadow/contact;
- scale consistent with scene;
- clear target link when acting;
- no black matte/crop artifacts.

### HQ progression

HQ Level 1, Level 3, and Level 5 must be visually distinguishable at gameplay scale.

---

## Add to `## Do's and Don'ts`

### Do

- Keep `WARNING! CONTAINS AND PRODUCES AI SLOP.` as product-owner-approved humorous Start Gate copy.
- Use one strong objective cue and quiet everything else.
- Keep mobile labels minimal.
- Put selected details in sheets rather than duplicating everything on the map.
- Keep art provenance and prompt history in manifests/docs.

### Don't

- Do not remove the `AI SLOP` warning without product-owner approval.
- Do not bake stateful gameplay objects into background plates.
- Do not show repeated `Build here` labels on mobile.
- Do not let Clover action be understandable only when a debug/drawer panel is open.
- Do not treat test-passing asset metadata as a substitute for product-owner visual signoff.
```
