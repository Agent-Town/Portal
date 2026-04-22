# REGISTRY.md Patch — V1.4.2 Acceptance Cleanup

Apply this patch conceptually to the private `@agent-town` registry documentation.

---

## Add or update registry primitives

### `scene-layer-plate`

**Purpose:** declares scene background plates that contain terrain/atmosphere but no stateful live objects.

Required props/metadata:

```ts
type SceneLayerPlate = {
  id: string;
  layerRole: "scene-base" | "scene-ambient";
  sceneLayering: {
    mode: "layered_plates";
    containsLiveStatefulObjects: false;
    allowedBakedContent: string[];
    forbiddenBakedContent: string[];
  };
};
```

### `world-overlay-marker`

**Purpose:** canonical semantic overlay component for map labels/badges.

Variants:

```ts
type WorldOverlayVariant =
  | "objective"
  | "primary-action"
  | "available"
  | "status"
  | "ambient"
  | "debug";
```

Rules:

- `objective`: max one visible;
- `debug`: never normal gameplay;
- `available`: quiet, icon/stake preferred, hidden text on mobile;
- `status`: compact icon/badge;
- `ambient`: low priority.

### `clover-action-link`

**Purpose:** renders Clover-to-target action relationship without opening the Foreman drawer.

Required props:

```ts
type CloverActionLinkProps = {
  cloverState: "idle" | "thinking" | "acting" | "waiting" | "blocked";
  targetObjectId?: string;
  targetAnchor?: { x: number; y: number };
  showWhenDrawerClosed: boolean;
};
```

### `hq-progression-visual`

**Purpose:** renders HQ upgrade visual state.

Required states:

```ts
type HqProgressionTier = "starter" | "improved" | "established";
```

Mapping:

- HQ 1 -> `starter`
- HQ 3 -> `improved`
- HQ 5 -> `established`
