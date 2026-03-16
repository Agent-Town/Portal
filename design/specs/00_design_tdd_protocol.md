# Design TDD Protocol

Status: required workflow for future AI design agents
Last updated: 2026-03-16

This protocol defines how to do test-driven design in this repo without guessing and without breaking functionality.

## 1. Core rule

Do not implement visual changes until:

1. the baseline context docs are read,
2. the current UI is inspected at mobile, tablet, and desktop,
3. the relevant design phase is approved.

## 2. Required prep

Before touching any UI file:

1. read `design/README.md`,
2. read all root docs in `design/`,
3. read `design/specs/01_design_audit_baseline_2026_03_16.md`,
4. read `design/specs/08_frontend_design_master_implementation_roadmap.md`,
5. read `design/specs/09_global_human_first_design_requirements.md`,
6. read the approved phase spec,
7. read any linked product and engineering specs,
8. inspect the live app in this order:
   - mobile,
   - tablet,
   - desktop.

## 3. Required audit viewports

Minimum required capture sizes:

1. mobile: `390 x 844`
2. tablet: `820 x 1180`
3. desktop: `1440 x 1100`

Recommended additional stress viewports:

1. `375 x 812`
2. `1280 x 900`
3. `1440 x 900`

## 4. Evidence pack requirements

Every phase implementation must produce:

1. before screenshots for the affected surfaces,
2. after screenshots at the same viewports,
3. short notes describing what changed and why,
4. confirmation that no functionality changed,
5. passing tests.

Preferred local evidence folder pattern:

1. `tmp/design-audit/`
2. `tmp/design-phase-<id>/`

Do not rely on screenshots alone.
They are evidence, not the specification.

## 5. Design acceptance checklist

For every changed surface, verify:

1. where the eye lands first is correct,
2. the primary action is dominant,
3. advanced controls are visually subordinate,
4. spacing is consistent,
5. typography establishes hierarchy,
6. no horizontal overflow exists,
7. touch targets remain usable,
8. focus states are visible,
9. empty and loading states remain intentional,
10. the worker/debug shell still behaves correctly,
11. the main action is understandable without AI jargon,
12. the screen remains plausible for English and Chinese UI,
13. the action vocabulary remains compatible with future voice control.
14. the default human view is simpler than the full underlying information model,
15. detailed data remains accessible through disclosure or LLM-facing product state instead of crowding the main screen.
16. the summary surface, advanced surface, and LLM-facing meaning do not contradict one another.

## 6. Functional safety contract

Design work must preserve:

1. routes,
2. ids used by JS controllers,
3. `data-testid` hooks unless intentionally migrated,
4. modal-first navigation,
5. worker continuity,
6. current backend/API behavior.

If a proposed design improvement requires a functional change, the future agent must say so explicitly and stop.

## 6.1 LLM-first simplification rule

The product assumes the user can ask the in-product LLM for explanation and retrieval help.

Design implication:

1. do not surface every available detail by default just because the system has it,
2. keep task-critical context visible,
3. move dense or technical detail behind advanced views when possible,
4. preserve enough structure that the LLM can still retrieve, explain, and act on the richer data model,
5. optimize the human UI for action and confidence, not for exhaustive browsing.

## 6.2 No-drift verification rule

For any concept that appears in multiple layers, the future design agent must check:

1. the default UI summary,
2. the advanced/detail view,
3. the phrasing and structure the LLM would use to explain it.

If those three do not align, the phase is not complete.

## 7. Verification commands

Minimum:

```bash
npm test
```

Targeted runs:

```bash
npx playwright test <affected-spec-file>
```

Useful deterministic server for audit or screenshot work:

```bash
NODE_ENV=test TEST_RESET_TOKEN=test-reset PORT=4212 npm run dev
```

## 8. Documentation updates required after every approved phase

1. update `design/progress.txt`,
2. update `design/LESSONS.md`,
3. update `design/DESIGN_SYSTEM.md` if tokens or component rules changed,
4. summarize what remains approved but not yet implemented.
