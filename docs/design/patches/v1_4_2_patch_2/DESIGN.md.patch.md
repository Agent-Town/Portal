# DESIGN.md Patch — V1.4.2 Patch 2

Add this section to the canonical `DESIGN.md`.

---

## Founders Plot V1.4.2 Patch 2 — Mobile Calmness and HQ Progression

### Mobile calmness law

At mobile widths, the Founders Plot stage must feel like a calm game surface, not a compressed annotated map.

Default 390px route rules:

```yaml
mobile_calmness:
  max_persistent_world_labels: 3
  max_on_map_visible_words: 24
  max_primary_attention_objects: 2
  max_same_weight_pills: 2
  non_objective_text_labels: 0
  clipped_labels: 0
```

Persistent labels may appear only for:

- current objective/recommended object;
- selected object;
- Clover when actively relevant;
- critical blocking state.

All other lots must be icon-only, quiet, or represented in the bottom sheet.

### Signal priority

```yaml
mobile_signal_priority:
  - blocking_approval_or_critical_warning
  - current_objective_marker
  - clover_acting_target_link
  - selected_object_label
  - resource_flyout
  - ready_or_blocked_badge
  - ambient_label
```

If signals overlap on mobile, lower-priority signals must be suppressed.

### HQ progression visual ladder

HQ upgrades must communicate civic growth through silhouette, massing, footprint, and props.

```yaml
hq_progression:
  level_1: humble claim cabin or starter office
  level_3: expanded homestead / civic office
  level_5: proper frontier town hall
  required_difference_axes:
    - footprint_width
    - silhouette_height
    - roofline_shape
    - civic_props
    - entrance_treatment
    - tower_bell_flag_or_signature_feature
    - material_finish
  not_sufficient:
    - color_only
    - trim_only
    - level_label_only
    - metadata_only
```

### Visual proof rule

Do not satisfy visual progression through metadata alone. HQ progression requires:

- unique asset hashes;
- visual delta test;
- gameplay-scale screenshot;
- no-label screenshot.
