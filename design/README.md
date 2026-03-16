# Design Workspace

This folder is the canonical design source-of-truth for future AI design agents working in this repo.

It exists because the repository already has strong product and engineering specs, but did not yet have an equivalent design-spec layer with the same level of discipline.

Use this folder when the task is any of the following:

1. audit the visual design,
2. plan UI or UX changes,
3. implement approved design work without changing functionality,
4. create screenshot evidence and before/after comparisons,
5. update the design system or visual acceptance rules.

## Folder contract

The root of this folder intentionally mirrors the document names a future design agent may expect:

1. `DESIGN_SYSTEM.md`
2. `FRONTEND_GUIDELINES.md`
3. `APP_FLOW.md`
4. `PRD.md`
5. `TECH_STACK.md`
6. `LESSONS.md`
7. `progress.txt`

The `specs/` subfolder mirrors the repo's engineering TDD style, but for design work:

1. each phase is documented as a standalone design spec,
2. each spec includes measurable visual acceptance criteria,
3. each spec names exact files and surfaces to touch,
4. each spec defines evidence requirements for mobile, tablet, and desktop,
5. no design implementation should begin without explicit approval of the phase.

The `formal/` subfolder holds machine-checkable semantic models for design rules that cross UI layers:

1. canonical product meaning,
2. simple human summary,
3. advanced/detail disclosure,
4. LLM explanation/action surface,
5. future voice alignment.

## LLM-first information architecture rule

The user is assumed to have an always-available LLM companion inside the product.

That changes the design goal:

1. rich information should remain available to the system,
2. rich information should remain available to advanced or detailed views,
3. the default human UI should show only the minimum needed to act confidently,
4. the user should be able to learn about complexity by asking the LLM instead of decoding crowded screens.

This means future design agents must treat:

1. default UI as summary, action, and orientation,
2. advanced drawers and detail views as optional human deep dives,
3. data-rich system state as something the LLM can interpret on demand without forcing the user to browse raw structure first.

## Required reading order for future design agents

Read in this order before proposing changes:

1. `DESIGN_SYSTEM.md`
2. `FRONTEND_GUIDELINES.md`
3. `APP_FLOW.md`
4. `PRD.md`
5. `TECH_STACK.md`
6. `progress.txt`
7. `LESSONS.md`
8. `specs/00_design_tdd_protocol.md`
9. `specs/01_design_audit_baseline_2026_03_16.md`
10. `specs/08_frontend_design_master_implementation_roadmap.md`
11. `specs/09_global_human_first_design_requirements.md`

Then read only the approved phase spec(s) you need to execute.

If the task changes how meaning is projected between:

1. the simple human UI,
2. advanced/detail drawers,
3. LLM explanations or actions,
4. future voice-first naming,

also read:

1. `formal/README.md`
2. `formal/DesignProjectionNoDrift.tla`

## Design scope guardrail

This folder is for design work, not feature work.

Allowed:

1. typography,
2. spacing,
3. hierarchy,
4. color,
5. component styling,
6. layout,
7. responsive behavior,
8. motion,
9. empty, loading, and error presentation,
10. accessibility improvements that preserve functionality.

Not allowed without a separate product or engineering decision:

1. new product features,
2. changed workflows,
3. changed API behavior,
4. changed data models,
5. changed navigation architecture that breaks the modal-first worker continuity rule,
6. design changes that silently require backend logic changes.

Also required:

1. preserve the existence of information even when removing it from the default visual layer,
2. prefer moving detail behind disclosure over deleting it,
3. keep the human-facing path dead simple while preserving system richness for the LLM.

## No-drift design rule

Design should follow a one-source-of-truth principle similar to the core idea behind `tla-precheck`:

1. one canonical underlying task and state model,
2. one simple human surface derived from it,
3. one advanced/detail surface derived from it,
4. one LLM explanation/action surface derived from it,
5. later one voice surface derived from it.

Future design agents must not let these layers drift into conflicting stories.

If:

1. the default UI says one thing,
2. the advanced view says another,
3. the LLM would explain a third,

then the design is wrong even if each individual screen looks good.

## Verification rule

Every approved design phase must produce all of the following:

1. screenshot evidence at mobile, tablet, and desktop,
2. a concise before/after summary,
3. confirmation that existing functionality is preserved,
4. passing Playwright tests,
5. updates to `progress.txt` and `LESSONS.md`.

## Related repo sources

These remain important supporting references outside this folder:

1. `AGENTS.md`
2. `README.md`
3. `IMPLEMENTATION_PLAN.md`
4. `LOOP.md`
5. `specs/00_product_story.md`
6. `specs/39_house_library_safety_moderation_tdd_spec.md`
7. `specs/40_house_library_trust_aware_discovery_tdd_spec.md`
8. `specs/41_house_library_route_sync_tdd_spec.md`
9. `specs/42_house_library_shellwide_icon_first_tdd_spec.md`
10. `public/styles.css`
11. `public/index.html`
12. `public/start.html`
13. `public/views/*.html`
