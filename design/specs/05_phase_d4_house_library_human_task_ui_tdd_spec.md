# Phase D4 - House Library Human Task UI TDD Spec

Status: Draft

## 1. Goal

Make the House Library feel human-meaningful without changing its underlying capabilities.

This phase is about hierarchy and presentation only.

The Library should feel like:

1. a working surface,
2. a discovery surface,
3. a set of secondary desks,

not like one long administrative form.

Cross-cutting requirement:

1. all changes must satisfy `design/specs/09_global_human_first_design_requirements.md`

## 2. Scope

Primary files:

1. `public/views/house.html`
2. `public/styles.css`
3. `public/app.js` only if presentation ordering or presentational state requires it

Supporting specs to preserve:

1. `specs/39_house_library_safety_moderation_tdd_spec.md`
2. `specs/40_house_library_trust_aware_discovery_tdd_spec.md`
3. `specs/41_house_library_route_sync_tdd_spec.md`
4. `specs/42_house_library_shellwide_icon_first_tdd_spec.md`

## 3. Non-goals

1. new Library features,
2. changing trust semantics,
3. changing import logic,
4. removing advanced controls entirely,
5. changing backend or data models.

## 4. Required design outcomes

1. the first screenful must show the user's likely next task, not every possible system,
2. discovery must remain legible,
3. advanced/manual tools must remain available but quiet,
4. route, safety, relay, satchel, and local item surfaces must look like one family,
5. trust and safety must remain visible without long reading.

## 5. Measurable acceptance criteria

### 5.1 Default hierarchy

1. at mobile and desktop, the first screenful reveals one clear primary Library purpose,
2. the user can identify where to save, discover, or open without reading the entire panel,
3. no more than one visually dominant action cluster appears at once,
4. the main Library verbs remain understandable without AI terminology.

### 5.2 Progressive disclosure

1. manual and advanced controls remain hidden by default where already possible,
2. drawers read as supporting tools, not primary content,
3. technical inputs do not dominate the first screenful.

### 5.3 Card consistency

1. route feed, safety desk, relay desk, satchel desk, and local items read as one related card language,
2. card metadata is calmer than card titles,
3. imported, trusted, reported, and ready states remain visually distinct.

### 5.4 Cross-device behavior

1. Library remains usable at `390 x 844`,
2. no content blocks collide with the agent sidebar,
3. no horizontal overflow occurs,
4. touch actions remain comfortable.

## 6. Evidence requirements

Required captures:

1. Library mobile,
2. Library desktop,
3. Public Stack preview,
4. Safety Desk state,
5. Relay Desk state,
6. local Library detail state.

## 7. Verification

Required targeted regression areas:

1. `e2e/260` through `e2e/271`
2. `e2e/405` through `e2e/413`

Then:

1. full `npm test`

## 8. Exit criteria

This phase is complete only when:

1. the Library feels task-first,
2. the underlying power remains intact,
3. a non-technical user can infer what the Library is for without reading every section heading.
