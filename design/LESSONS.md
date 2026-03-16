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
