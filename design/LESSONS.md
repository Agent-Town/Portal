# LESSONS

Status: Design lessons log  
Date initialized: 2026-03-16

## 2026-03-16 Baseline

### What the current poker UI gets right

1. It exposes a large amount of useful state.
2. It already separates player, rail, review, operator, and centaur product areas functionally.
3. It is testable because most screens are seeded deterministically.

### Current design mistakes to avoid repeating

1. Equal-weight card stacking makes everything feel equally important.
2. The live table asks users to scroll through context before they can act.
3. Navigation pills and commit buttons look too similar.
4. Destructive operator actions are not visually isolated enough.
5. Responsive design cannot be handled by padding reduction alone.
6. Poker-specific color language should not borrow global sky/cream heading styling by accident.
7. Review screens should not present forms before understanding.
8. Poker cannot assume users understand AI terms before they play.
9. English and Simplified Chinese resilience must be designed early, not patched later.
10. Voice providers and model brands should be anticipated structurally, not allowed to drive the main UI.

### Rules for future design agents

1. Fix hierarchy before polish.
2. Fix mobile order before desktop composition.
3. Separate primary, secondary, and destructive actions visually and structurally.
4. Prefer fewer stronger sections over many equal-weight panels.
5. When a design issue can be solved by removing something, remove it before styling around it.

## Lessons Template

When a future design phase lands, append:

1. what changed,
2. what worked,
3. what regressed,
4. what should become a permanent rule.

## 2026-03-16 D0 Foundation

### What changed

1. Poker now exposes route-level `data-poker-view` hooks and section-level `data-poker-section` metadata on the key design surfaces.
2. Poker action controls now receive deterministic role markers and role classes after render.
3. The poker shell now uses the v1 token set as the visual base, including Chinese-capable font fallbacks.

### What worked

1. Post-render action-role decoration was lower risk than rewriting every button template by hand.
2. Section-card descriptors let the design system add structure without changing route behavior.

### What should become a permanent rule

1. New poker surfaces should be added with explicit view and section metadata from the start.
2. Button roles must stay machine-detectable so design tests can verify hierarchy deterministically.

## 2026-03-16 D1 Hierarchy Start

### What changed

1. The live lobby now reorders to player-first hierarchy: quick seat, live tables, tournament series, then identity and policy.
2. The schedule now reorders to event-first hierarchy: snapshot, upcoming day cards, recurring templates, then admin tools.

### What worked

1. Post-render reordering by stable `data-poker-section` hooks preserved behavior while still changing composition deterministically.

### What should become a permanent rule

1. Once a route has stable section hooks, hierarchy changes should prefer structural reordering over duplicating template logic.

## 2026-03-16 D2 Live Table Composition

### What changed

1. The live table now leads with current hand and submit action instead of burying them below seat-thread and support panels.
2. The table surface now uses explicit live-state hooks and a route-specific responsive grid for mobile, tablet, and desktop.
3. Previously untagged support panels such as study, table review, invite access, and series director are now part of the same section system.

### What worked

1. Converting stray panels into section-tagged cards made the responsive layout predictable without touching game logic.
2. A single route-specific grid is enough to create a true decision lane plus support rail once the section order is correct.

### What regressed and had to be corrected

1. Long operator identifiers broke mobile width until summary values were allowed to wrap anywhere.

### What should become a permanent rule

1. Any poker metric that may contain IDs, wallet subjects, or machine-generated labels must support wrapping on mobile.
2. Each design phase should capture deterministic before/after screenshots so visual drift is documented, not guessed.

## 2026-03-16 D3 Review, Season, And Rail

### What changed

1. Hand review now reads as summary and replay first, with study and annotation pushed into a supporting rail on larger screens.
2. Native season now keeps the leaderboard ahead of economy detail so ranking remains the center of gravity.
3. Rail summary and series views now use explicit rail sections and a quieter observational treatment instead of feeling like player tables with features removed.

### What worked

1. The existing section-tag system scaled cleanly from live-table work into review, season, and rail without changing route semantics.
2. Rail became much easier to distinguish once the route was structured around summary, observed tables, and payout context instead of equal-weight blocks.

### What should become a permanent rule

1. Review routes should always privilege understanding before input.
2. Ranking surfaces should never place supporting economy detail ahead of the leaderboard itself.
3. Public rail routes should expose navigation only; player-action styling should remain absent by structure, not by luck.

## 2026-03-16 D4 Operator And Centaur Refinement

### What changed

1. Operator review now separates inspection/export, operational controls, and destructive actions into distinct visual clusters.
2. Centaur now leads with live hand and shared action before discussion and snapshot support, while verify and join states remain simpler entry variants of the same screen.
3. Centaur gained its own route state hook so design tests can distinguish verify, join, and live states deterministically.

### What worked

1. Grouping operator controls by intent made the review surface calmer without removing any capability.
2. Centaur responded well to the same section-order pattern used on live play, but with a clearer split between commitment and discussion.

### What regressed and had to be corrected

1. The first centaur mobile assertion used a fixed fold-height cutoff that was too rigid; the durable design requirement was order and usability, not a hard pixel boundary.

### What should become a permanent rule

1. Operator surfaces must visually isolate destructive actions from audit and export tools.
2. Centaur screens should always present the shared game state and commitment control before the conversational layer.
3. Design tests should assert durable hierarchy and responsiveness goals, not arbitrary viewport cutoffs that can turn valid layouts into false failures.

## 2026-03-16 D4 Accessibility, State, And Motion

### What changed

1. The poker status line now exposes explicit loading, ready, empty, and error kinds instead of behaving like plain text.
2. Route-level loading and error shells now use the same state-card language as the rest of the poker UI.
3. Empty states are now deliberate cards, not leftover paragraphs.
4. Reduced-motion users now get animation-free poker states while default users keep restrained motion.

### What worked

1. Inferring status kinds from existing copy let the state system land without rewriting every route handler.
2. A shared state-card component made loading, empty, and error states structurally consistent across lobby, schedule, ops, centaur, and route failures.
3. Token-level contrast assertions are more durable than screenshot-only accessibility checks.

### What regressed and had to be corrected

1. The first empty-state test assumed the baseline poker seed had no live tables, but the seed had evolved; the design contract needed a deterministic mocked-empty payload instead.

### What should become a permanent rule

1. Empty, loading, and error states should always be first-class section cards, not plain fallback strings.
2. Accessibility tests should prefer durable contracts like contrast, focus visibility, disabled affordance, and reduced-motion behavior over subjective visual guesses.
3. If a seeded environment no longer represents the target state, mock the exact state needed for the design assertion instead of pretending the seed is stable.

## 2026-03-16 D5 Beginner, International, And Voice-Ready Structure

### What changed

1. Player-facing poker copy now uses plain-language teammate framing instead of worker and seat-agent jargon on the key live-play surfaces.
2. Simplified Chinese overlays now reach route titles plus the most important section headings and action controls on lobby, schedule, live table, season, and centaur routes.
3. Provider metadata remains structurally available but hidden inside supporting containers, and dormant voice-ready slots now sit next to discussion and action inputs without changing visible layout.

### What worked

1. Keeping localization as a deterministic overlay on stable `data-poker-section` hooks made it possible to expand language coverage without rewriting route builders.
2. Converting helper flows from English text matching to stable IDs was necessary before locale tests could measure the design instead of the helper.
3. Treating provider and voice seams as invisible structure keeps future flexibility without polluting today’s hierarchy.

### What regressed and had to be corrected

1. The first locale helper only updated the first matching element, which would have left repeated schedule actions untranslated; the overlay had to become multi-node aware.
2. The first native-season locale assertion assumed a table layout, but the route actually renders ranked card rows; the test had to match the real stable contract.

### What should become a permanent rule

1. Localization hooks must target repeated action surfaces, not only the first match.
2. New helper code should never depend on English visible text if the route is expected to localize.
3. Provider names, model names, and future voice affordances must stay secondary to the main player task at every viewport.

## 2026-03-16 Simplicity Reset

### What changed

1. External poker-product research was added to the design pack.
2. The design bar now explicitly favors dead-simple default routes over visible richness.
3. LLM-rich secondary detail is now treated as a design asset, not as a reason to keep clutter visible.

### What worked

1. Mature poker products validate the idea that notes, stats, and secondary detail can live outside the main action plane.
2. The user feedback was directionally correct: hierarchy improvements alone do not automatically remove clutter.

### What should become a permanent rule

1. If a detail is mainly there for explanation, study, or the LLM, it should not automatically earn space in the default player route.
2. Default player routes should benchmark against fast poker clients, not internal admin surfaces.
3. A simpler default route is more important than preserving every visible metric.
4. Simplicity should come from projecting one canonical state more selectively, not from creating a second truth for the simple UI.

## 2026-03-16 D6 Dead-Simple Default Pass

### What changed

1. Lobby and schedule now treat policy, template, and extra table detail as explicit advanced drawers instead of default full-weight content.
2. Live-table and series cards in the lobby now lead with one route action and a shorter first read, while history, payout, and director detail sit behind drawers.
3. Schedule cards now lead with register and open-table actions, while recurring templates, admin authoring, and break or waitlist detail stay secondary.

### What worked

1. `details` drawers were the cleanest way to preserve the existing DOM, forms, and deterministic tests while reducing visible clutter.
2. Scoping old schedule tests to the explicit-open drawer preserved functionality coverage without forcing the dense default layout back onto the player route.
3. The screenshot pass made it obvious that simplification has to be measured on mobile first; desktop can tolerate more context without feeling as crowded.

### What regressed and had to be corrected

1. Older schedule UI tests assumed recurring and admin content was always visible, so they had to be rewritten to open the drawer before asserting on those inner controls.
2. The first admin-template assertion targeted text that no longer stayed visible after the rerender, so the test had to validate the recurring-template projection instead of a stale admin mirror.

### What should become a permanent rule

1. Support detail should default to a closed drawer if the primary player action still works without it.
2. If a route exposes both a player projection and an admin or study projection, the player projection should win the first read every time.
3. Every simplification pass should ship with screenshots of both the default closed state and the explicit-open state so design intent cannot drift.

## 2026-03-16 TLA+ Design Logic Layer

### What changed

1. The poker design pack now has a TLA+ model for route projection logic under `design/tla/`.

## 2026-03-16 D6 Lobby Minimal Follow-Through

### What changed

1. Quick Seat now defaults to one game picker, one primary join action, and one compact defaults summary.
2. Stakes, invite-only setup, naming, and secondary poker destinations moved behind the Quick Seat advanced drawer instead of staying full-weight.
3. Lobby live tables and tournament series now render as compact poker-room rows with one obvious action and lighter supporting facts.

### What worked

1. Hiding configuration behind the existing advanced drawer preserved all functionality without inventing a separate “simple mode” backend truth.
2. Compact rows feel much closer to a real poker client than tall multi-card stacks, especially on mobile.
3. The canonical-state rule held: the LLM and advanced surfaces still have the same detail even though the default player projection is much quieter.

### What regressed and had to be corrected

1. The first lobby rewrite broke at runtime because the simplified summary reused variables outside the right scope; the fix was to keep the summary fully inside the same canonical sync path as the tournament-option gating.

### What should become a permanent rule

1. Quick Seat should default to one decision and one action; everything else must justify why it belongs outside the advanced drawer.
2. Lobby rows should look like poker-room listings, not like generic product cards.
3. If a detail is useful mostly after the user sits or for the LLM, it does not belong in the first lobby read.

## 2026-03-16 D6 Live Table Support Drawers

### What changed

1. Team notes, AI teammate detail, auto-play settings, player review forms, and study note bodies now stay behind explicit drawers on the live table.
2. The default live-table rail now leads with short summaries and counts instead of full logs and full forms.
3. The simplified live table was validated again in Simplified Chinese so the default action lane stays clear under localized copy.

### What worked

1. Keeping the forms in the DOM but behind `details` preserved behavior and made the regression fixes straightforward.
2. The action lane already had the right hierarchy from D2, so reducing support density created a meaningful calm without moving the core poker flow.
3. Updating the affected functional tests immediately was necessary; hidden-by-default controls are still real controls and the suite has to treat them that way.

### What regressed and had to be corrected

1. The dispute-review UI test originally assumed review fields and audit detail were always visible; it had to be rewritten to open the right drawers at the right time.

### What should become a permanent rule

1. Live-table support should summarize by default and explain in drawers.
2. If a player can still act correctly without reading a support panel, that panel should not ship expanded by default.
3. Localization checks for simple-default poker routes must include hidden-support layouts, not just visible-button overflow.
2. The design workflow now explicitly treats TLA+ as the precheck for visibility, gating, and projection invariants.
3. The docs now distinguish formalizable design logic from non-formalizable visual taste.

### What worked

1. The dead-simple vs advanced-detail rule is much clearer when modeled as projection logic instead of prose alone.
2. Locale invariance and admin gating are both easier to reason about when they are explicit invariants instead of scattered documentation bullets.
3. Running TLC immediately exposed an ambiguity between admin-visible shells and advanced detail panels that would have stayed fuzzy in prose.

### What should become a permanent rule

1. If a design change can be stated as a visibility or projection rule, it belongs in the TLA+ model.
2. Do not use TLA+ as fake cover for visual judgment; use it only where the logic is genuinely structural.
