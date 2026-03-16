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
4. read the approved phase spec,
5. read any linked product and engineering specs,
6. inspect the live app in this order:
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
10. the worker/debug shell still behaves correctly.

## 6. Functional safety contract

Design work must preserve:

1. routes,
2. ids used by JS controllers,
3. `data-testid` hooks unless intentionally migrated,
4. modal-first navigation,
5. worker continuity,
6. current backend/API behavior.

If a proposed design improvement requires a functional change, the future agent must say so explicitly and stop.

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

