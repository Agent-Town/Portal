# AGENTS.md Patch — V1.4.2 Acceptance Cleanup

Add this to the Founders Plot / visual implementation guardrails section.

---

## V1.4.2 visual acceptance cleanup rules

When implementing the V1.4.2 acceptance cleanup:

1. Treat the GPT Image 2 art baseline as product-owner-approved.
2. Do not start a broad asset rebuild.
3. Preserve the Start Gate copy: `WARNING! CONTAINS AND PRODUCES AI SLOP.` It is product-owner-approved.
4. Implement the layered-plates scene model:
   - background plates for terrain/atmosphere;
   - live object layer for stateful gameplay objects;
   - character layer for Clover;
   - effects and overlay layers for feedback.
5. Do not bake stateful gameplay objects into scene backgrounds.
6. Reduce same-weight floating labels and repeated `Build here` text.
7. On mobile, keep only selected/recommended/urgent labels visible by default.
8. Clover must visibly act on a target object without requiring a drawer/debug panel.
9. HQ progression must be visually readable.
10. Do not add new gameplay systems in this cleanup patch.

Read before implementation:

```text
specs/31_founders_plot_v1_4_2_acceptance_cleanup.md
specs/32_founders_plot_v1_4_2_acceptance_cleanup_tdd_matrix.md
docs/visual/VISUAL_SIGNOFF_SHEET_V1_4_2.md
docs/visual/SCENE_LAYERING_DECISION_V1_4_2.md
Brand kit/guidelines/agent-town-design-pack/DESIGN.md
Brand kit/guidelines/agent-town-design-pack/GAME_UX.md
Brand kit/guidelines/agent-town-design-pack/REGISTRY.md
```
