# Portal Design Workspace

This folder is the design equivalent of the repo's product and TDD spec layer.

Its purpose is to let future agentic AI designers work against a documented visual contract instead of inventing style changes from scratch.

## Baseline

- Repo baseline commit: `a56503d`
- Product shell baseline: town-hub, modal-first, wallet-first Agent Town
- Scope: visual design, layout, copy hierarchy, spacing, typography, color, motion, accessibility, and responsive behavior
- Out of scope: feature changes, backend behavior changes, state-machine changes, new identity models, or worker/runtime architecture changes

## Why this folder exists

The repo has a strong current product contract, but the design context is fragmented:

- live product styling is in [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- current product rules live in [AGENTS.md](/Users/robin/.codex/worktrees/afe5/Portal/AGENTS.md), [README.md](/Users/robin/.codex/worktrees/afe5/Portal/README.md), [specs/11_district_map_storefront_spec.md](/Users/robin/.codex/worktrees/afe5/Portal/specs/11_district_map_storefront_spec.md), and [research/portal/loss.md](/Users/robin/.codex/worktrees/afe5/Portal/research/portal/loss.md)
- the Brand kit expresses visual intent, but it is not the authoritative shipped system

Future design work must start here so product, implementation, and design do not drift again.

## File Map

- [DESIGN_SYSTEM.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_SYSTEM.md)
  Canonical visual-system contract for shipped UI work.
- [FRONTEND_GUIDELINES.md](/Users/robin/.codex/worktrees/afe5/Portal/design/FRONTEND_GUIDELINES.md)
  Design-engineering rules and implementation boundaries.
- [APP_FLOW.md](/Users/robin/.codex/worktrees/afe5/Portal/design/APP_FLOW.md)
  Route and screen inventory with primary user jobs and hierarchy expectations.
- [AUDIENCE_AND_GLOBALIZATION.md](/Users/robin/.codex/worktrees/afe5/Portal/design/AUDIENCE_AND_GLOBALIZATION.md)
  Audience, language, localization, cultural, and future voice-readiness requirements.
- [PRD.md](/Users/robin/.codex/worktrees/afe5/Portal/design/PRD.md)
  Design-facing product requirements and non-goals.
- [TECH_STACK.md](/Users/robin/.codex/worktrees/afe5/Portal/design/TECH_STACK.md)
  Runtime and platform constraints that design work must respect.
- [DESIGN_AUDIT_BASELINE.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_AUDIT_BASELINE.md)
  Current-state audit and phased visual plan.
- [IMPLEMENTATION_ROADMAP.md](/Users/robin/.codex/worktrees/afe5/Portal/design/IMPLEMENTATION_ROADMAP.md)
  Execution order, dependencies, and phase handoff rules for implementing the audit findings.
- [BACKLOG.md](/Users/robin/.codex/worktrees/afe5/Portal/design/BACKLOG.md)
  Atomic design tickets covering every current audit finding with file targets and measurable outcomes.
- [TDD_SPEC.md](/Users/robin/.codex/worktrees/afe5/Portal/design/TDD_SPEC.md)
  Test-driven design milestones, measurable gates, and reserved visual-regression work.
- [AGENT_RUNBOOK.md](/Users/robin/.codex/worktrees/afe5/Portal/design/AGENT_RUNBOOK.md)
  Step-by-step execution guide for future agentic AI design work.
- [progress.txt](/Users/robin/.codex/worktrees/afe5/Portal/design/progress.txt)
  Lightweight status log for completed design phases.
- [LESSONS.md](/Users/robin/.codex/worktrees/afe5/Portal/design/LESSONS.md)
  Design lessons and anti-patterns to preserve across sessions.

## Source-of-Truth Mapping

These files replace the missing standalone design artifacts that a future design prompt might expect:

- `DESIGN_SYSTEM(.md)` -> [DESIGN_SYSTEM.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_SYSTEM.md)
- `FRONTEND_GUIDELINES(.md)` -> [FRONTEND_GUIDELINES.md](/Users/robin/.codex/worktrees/afe5/Portal/design/FRONTEND_GUIDELINES.md)
- `APP_FLOW(.md)` -> [APP_FLOW.md](/Users/robin/.codex/worktrees/afe5/Portal/design/APP_FLOW.md)
- `AUDIENCE / GLOBALIZATION / VOICE requirements` -> [AUDIENCE_AND_GLOBALIZATION.md](/Users/robin/.codex/worktrees/afe5/Portal/design/AUDIENCE_AND_GLOBALIZATION.md)
- `PRD(.md)` -> [PRD.md](/Users/robin/.codex/worktrees/afe5/Portal/design/PRD.md)
- `TECH_STACK(.md)` -> [TECH_STACK.md](/Users/robin/.codex/worktrees/afe5/Portal/design/TECH_STACK.md)
- `progress(.txt)` -> [progress.txt](/Users/robin/.codex/worktrees/afe5/Portal/design/progress.txt)
- `LESSONS(.md)` -> [LESSONS.md](/Users/robin/.codex/worktrees/afe5/Portal/design/LESSONS.md)

## Working Model For Future Agents

1. Read this folder before proposing any UI changes.
2. Treat [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css) as shipped truth until the design system is migrated.
3. Preserve the town-hub shell, modal-first navigation, wallet-first identity, and worker continuity rules from [AGENTS.md](/Users/robin/.codex/worktrees/afe5/Portal/AGENTS.md).
4. Treat [AUDIENCE_AND_GLOBALIZATION.md](/Users/robin/.codex/worktrees/afe5/Portal/design/AUDIENCE_AND_GLOBALIZATION.md) as a hard product requirement, not optional polish.
5. Add measurable Playwright coverage before changing visuals that affect hierarchy, responsive layout, language flexibility, or information density.
6. Work from [IMPLEMENTATION_ROADMAP.md](/Users/robin/.codex/worktrees/afe5/Portal/design/IMPLEMENTATION_ROADMAP.md) and [BACKLOG.md](/Users/robin/.codex/worktrees/afe5/Portal/design/BACKLOG.md) instead of improvising priorities.
7. Update [progress.txt](/Users/robin/.codex/worktrees/afe5/Portal/design/progress.txt) and [LESSONS.md](/Users/robin/.codex/worktrees/afe5/Portal/design/LESSONS.md) after each approved phase.

## Design Verification Philosophy

Design is not treated as subjective polish here. Future design work should be verified through:

- route- and viewport-based screenshot baselines
- DOM-level assertions for clutter, hierarchy, and touch targets
- computed-style assertions for token usage
- accessibility checks for contrast, focus, and readable copy hierarchy
- existing product invariants such as [research/portal/loss.md](/Users/robin/.codex/worktrees/afe5/Portal/research/portal/loss.md)

## Important Caveat

The Brand kit is useful reference material, but it is not the live source of truth.

- live app: [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- aspirational reference: [Brand kit/src/app/components/BrandCore.tsx](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/src/app/components/BrandCore.tsx), [Brand kit/src/app/components/ColorSystem.tsx](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/src/app/components/ColorSystem.tsx), [Brand kit/src/app/components/TypographySystem.tsx](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/src/app/components/TypographySystem.tsx), [Brand kit/src/app/components/MotionGuide.tsx](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/src/app/components/MotionGuide.tsx)
- non-authoritative template file: [Brand kit/guidelines/Guidelines.md](/Users/robin/.codex/worktrees/afe5/Portal/Brand%20kit/guidelines/Guidelines.md)

Any future agent that silently treats the Brand kit as production truth will make the design system less coherent, not more.
