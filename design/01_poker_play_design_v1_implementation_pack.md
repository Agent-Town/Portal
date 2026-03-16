# Poker Play Design v1 Implementation Pack

Status: Draft planning pack  
Date: 2026-03-16  
Scope: redesign poker surfaces into a human-first, testable, modal-first interface system without changing functionality  
Depends on: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md), [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md), [APP_FLOW.md](./APP_FLOW.md), [PRD.md](./PRD.md), [TECH_STACK.md](./TECH_STACK.md), [04_poker_play_design_v1_audit_baseline.md](./04_poker_play_design_v1_audit_baseline.md), [specs/02_api_contract.md](../specs/02_api_contract.md), [AGENTS.md](../AGENTS.md)  
Companion backlog: [02_poker_play_design_v1_backlog.md](./02_poker_play_design_v1_backlog.md)  
Companion TDD spec: [03_poker_play_design_v1_tdd_spec.md](./03_poker_play_design_v1_tdd_spec.md)

This document defines the target poker design direction. It is intentionally strict. The goal is not to decorate the current UI. The goal is to restructure the current experience so the screens feel obvious, quiet, and fast under pressure while preserving every existing feature.

## 1. Executive Summary

The current branch already has:

1. a broad and useful poker feature set,
2. deterministic seeded states for testing,
3. clear route separation between lobby, live table, schedule, review, rail, operator, season, and centaur experiences.

It still does not have:

1. a coherent hierarchy,
2. a poker-specific design system,
3. mobile-first decision composition,
4. clear action role separation,
5. a premium operator interface,
6. a study surface that reads as a study workflow,
7. a distinctive centaur experience.

Design v1 closes those gaps in this order:

1. shell, tokens, and hierarchy,
2. lobby and schedule composition,
3. live table action-first redesign,
4. review and season refinement,
5. operator, rail, and centaur polish.

## 2. Normative Design Decisions

These decisions are binding for this program.

1. Poker remains modal-first and embed-compatible.
2. No design work may change functionality or route meaning.
3. Mobile is the primary composition target.
4. Each screen must have one obvious primary action.
5. All poker surfaces must use one coherent visual language.
6. Player navigation, commit actions, and destructive actions must never share the same visual priority.
7. Metadata should support the task, not dominate it.
8. The live table must be decision-first, not dashboard-first.
9. Operator controls must be safe-by-structure, not just safe-by-label.
10. Design work must remain deterministic and testable through Playwright.

## 3. Current-State Problems To Solve

The baseline audit found these structural issues:

1. the live table hides `Submit Action` beneath too many equal-weight sections,
2. the lobby leads with identity and policy before seatable action,
3. the schedule mixes public event browsing and admin authoring in one flow,
4. review uses the same card weight for every section,
5. operator actions are over-dense and visually flat,
6. the current responsive layer is effectively a desktop stack with narrower padding,
7. poker mixes a local dark-gold palette with global blue heading styles.

## 4. Product Surfaces To Redesign

## 4.1 Live Lobby

Required outcome:

1. `Quick Seat` becomes the hero action,
2. live tables become the second read,
3. identity and policy move to a compact supporting section,
4. native season and schedule become tertiary navigation.

## 4.2 Live Table

Required outcome:

1. the current hand and action area appear first,
2. the acting-seat state is obvious in one glance,
3. legal actions are visually stronger than auxiliary tools,
4. seat thread, study, and auto-act become supporting planes,
5. the table feels live without visual noise.

## 4.3 Tournament Schedule

Required outcome:

1. upcoming events dominate the page,
2. player registration states are obvious,
3. recurring templates remain visible but secondary,
4. admin template authoring is clearly separated from player browsing.

## 4.4 Hand Review

Required outcome:

1. the screen reads as `understand -> replay -> annotate`,
2. result summary and action line appear before forms,
3. notebook and opponent notes feel like a study rail on larger screens,
4. exports remain available but visually secondary.

## 4.5 Native Season

Required outcome:

1. leaderboard information is clean and ranking-first,
2. summary metrics are compact,
3. table and OIL context support the ranking instead of competing with it.

## 4.6 Operator Review

Required outcome:

1. the operator understands the current state before seeing the control wall,
2. destructive actions are grouped and isolated,
3. director actions have clear hierarchy,
4. export and inspection actions are visually lighter than intervention actions.

## 4.7 Public Rail

Required outcome:

1. rail feels observational, not interactive,
2. public tables and series are lighter than player views,
3. spectator scanning is faster than current player-card scanning.

## 4.8 Centaur

Required outcome:

1. lock verification, countdown, discussion, and shared decision feel like one ritual,
2. the agent recommendation is clearly visible but not visually louder than the shared commit,
3. the screen distinguishes `talking` from `locking`.

## 5. Screen Architecture Rules

## 5.1 Primary Action Placement

Rules:

1. the primary action must appear in the top content half of the screen on desktop,
2. on mobile, the primary action must appear within the first viewport for the most important active state,
3. forms used less frequently than the main action must come later.

## 5.2 Content Planes

Every screen must organize into:

1. primary plane,
2. supporting context plane,
3. background reference plane.

If a section cannot be placed into one of those three planes, it likely does not belong on that screen at full weight.

## 5.3 Metric Use

Rules:

1. metrics must not each sit inside equally loud mini-cards,
2. metrics should summarize, not overwhelm,
3. metrics belong at screen tops or inside targeted compact strips.

## 5.4 Action Roles

Required button families:

1. primary commit,
2. secondary utility,
3. navigation,
4. destructive.

These roles require distinct visual systems.

## 6. Responsive Architecture

## 6.1 Mobile

Normative rules:

1. single-column layout,
2. current hand and action area ahead of thread and study tools,
3. operator controls chunked into small groups rather than one huge wall,
4. schedule events appear before recurring templates and admin authoring.

## 6.2 Tablet

Normative rules:

1. larger screen should reduce scrolling, not merely enlarge cards,
2. a supporting right rail is allowed only when it reduces decision friction,
3. schedule and review may use split layouts if the reading order still matches mobile.

## 6.3 Desktop

Normative rules:

1. a composed two-column structure is preferred where density benefits,
2. operator and review views may use wider grids,
3. the hero/title region should remain restrained and not consume excessive height.

## 7. Accessibility and State Design

Required outcomes:

1. visible focus treatment for every interactive control,
2. disabled buttons that remain clearly inactive,
3. consistent empty states per route family,
4. readable loading states that are not only status text,
5. non-hostile error states.

## 8. Motion Rules

Allowed:

1. subtle section fade-in,
2. button emphasis,
3. status and countdown transitions,
4. sticky action bar reveal.

Not allowed:

1. decorative ambient motion on core panels,
2. floating effects that compete with live information,
3. long or playful transitions in operator flows.

## 9. Design Authority Matrix

| Concern | Design authority | Functional authority |
|---|---|---|
| Visual hierarchy | Design | Existing feature flow remains unchanged |
| Button styling by role | Design | Existing click behavior remains unchanged |
| Section order in DOM | Design | Bound handlers and IDs must keep working |
| Responsive composition | Design | Route meaning remains unchanged |
| Modal-first behavior | Design must preserve | Existing route logic |
| Review/export data | Design may restyle | Existing backend contract |

## 10. Approval and Anti-Regression Rules

1. No phase should be implemented before approval.
2. Every design phase must update the design docs in this folder.
3. Every design phase must preserve the current API and functional tests.
4. If a design improvement requires a new feature, it must be flagged separately and excluded from the design phase.
