# REGISTRY.md Patch — V1.4.2 Patch 2

Add these items to the private `@agent-town` registry documentation.

---

## New / updated game-surface registry items

### `mobile-stage-signal-policy`

Defines mobile label, badge, and feedback suppression for Founders Plot.

Required behavior:

- exposes current viewport class;
- accepts selected object, objective object, Clover target, and feedback list;
- returns visible/suppressed signals;
- enforces mobile text and label budgets.

### `quiet-lot-marker`

A small in-world marker for non-objective available lots.

Must not use persistent text on mobile.

### `objective-lot-marker`

The only strong default lot marker when the current objective points to a lot.

Must be visually distinct from quiet lot markers.

### `hq-progression-gallery`

A test/review component that renders HQ L1/L3/L5 at gameplay scale.

Required modes:

- labeled;
- no-label;
- desktop;
- mobile crop, if useful.

### `hq-upgrade-visual-ladder`

The asset contract for HQ L1/L3/L5 progression.

Must include:

- asset paths;
- visual tier metadata;
- prompt/provenance path;
- approval state;
- visual-delta test status.
