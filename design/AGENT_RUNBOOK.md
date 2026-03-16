# Design Agent Runbook

This runbook tells a future agentic AI contributor how to execute design work in this repo safely.

## 1. Before Touching Code

Read, in order:

1. [design/README.md](/Users/robin/.codex/worktrees/afe5/Portal/design/README.md)
2. [design/DESIGN_SYSTEM.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_SYSTEM.md)
3. [design/FRONTEND_GUIDELINES.md](/Users/robin/.codex/worktrees/afe5/Portal/design/FRONTEND_GUIDELINES.md)
4. [design/APP_FLOW.md](/Users/robin/.codex/worktrees/afe5/Portal/design/APP_FLOW.md)
5. [design/AUDIENCE_AND_GLOBALIZATION.md](/Users/robin/.codex/worktrees/afe5/Portal/design/AUDIENCE_AND_GLOBALIZATION.md)
6. [design/PRD.md](/Users/robin/.codex/worktrees/afe5/Portal/design/PRD.md)
7. [design/TECH_STACK.md](/Users/robin/.codex/worktrees/afe5/Portal/design/TECH_STACK.md)
8. [design/DESIGN_AUDIT_BASELINE.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_AUDIT_BASELINE.md)
9. [design/IMPLEMENTATION_ROADMAP.md](/Users/robin/.codex/worktrees/afe5/Portal/design/IMPLEMENTATION_ROADMAP.md)
10. [design/BACKLOG.md](/Users/robin/.codex/worktrees/afe5/Portal/design/BACKLOG.md)
11. [design/TDD_SPEC.md](/Users/robin/.codex/worktrees/afe5/Portal/design/TDD_SPEC.md)
12. [design/tla/README.md](/Users/robin/.codex/worktrees/afe5/Portal/design/tla/README.md)

Then confirm the current product rules in:

- [AGENTS.md](/Users/robin/.codex/worktrees/afe5/Portal/AGENTS.md)
- [README.md](/Users/robin/.codex/worktrees/afe5/Portal/README.md)
- [research/portal/loss.md](/Users/robin/.codex/worktrees/afe5/Portal/research/portal/loss.md)

Assume throughout this runbook that:

- the assistant stays with the user
- humans should see the fewest possible details needed to act
- richer detail should be staged for assistant interpretation and advanced review, not surfaced by default
- docs, tests, captures, and shipped UI must not drift apart

## 2. Design Workflow

### Step 1 - Pick one milestone only

Do not mix multiple design milestones in one pass unless the spec explicitly says they are coupled.

### Step 2 - Write failing tests first

Add or extend the required design tests from [TDD_SPEC.md](/Users/robin/.codex/worktrees/afe5/Portal/design/TDD_SPEC.md) before changing styles.

Pick the exact ticket(s) from [BACKLOG.md](/Users/robin/.codex/worktrees/afe5/Portal/design/BACKLOG.md) that belong to that milestone before editing code.

Treat this as a design-precheck loop:

1. define or extend the contract
2. make the design test fail
3. implement the smallest fix
4. capture the resulting surface
5. update docs so nothing drifts

If the milestone changes disclosure, hierarchy ordering, or modal-shell logic, also update the related TLA+ model in [design/tla](/Users/robin/.codex/worktrees/afe5/Portal/design/tla).

### Step 3 - Capture the current state

At minimum, inspect the affected route at:

- `390px`
- `768px`
- `1440px`

If the phase affects top-layer copy or layout, also inspect with:

- longer translated fixture strings
- mixed Latin plus Simplified Chinese fixture strings

If the phase affects House, Office, Registry, or other detail-heavy surfaces, also inspect:

- whether the first visible human layer can be understood without scanning dense metadata
- whether detailed evidence still exists in grouped secondary or advanced layers

Required route families:

- town shell
- house / house console / house office
- leaderboard
- registry
- poker

### Step 4 - Implement the smallest design change

Prefer:

- token cleanup
- selector simplification
- layout hierarchy improvement
- staging detail behind clear summary and lower-priority advanced layers

Avoid:

- rewriting markup unless necessary
- introducing new component patterns when an existing one can be tightened

### Step 5 - Validate

Run:

```bash
npx playwright test <changed-tests>
npm test
```

If the change affects shell clarity or clutter, also run:

```bash
npm run research:portal:eval
```

### Step 6 - Update docs

Update:

- [design/progress.txt](/Users/robin/.codex/worktrees/afe5/Portal/design/progress.txt)
- [design/LESSONS.md](/Users/robin/.codex/worktrees/afe5/Portal/design/LESSONS.md)

If tokens or system rules changed, also update:

- [design/DESIGN_SYSTEM.md](/Users/robin/.codex/worktrees/afe5/Portal/design/DESIGN_SYSTEM.md)

Then explicitly verify:

- current screenshots still match the intended hierarchy
- the changed surface still matches the written design contract
- no design drift was introduced by leaving docs or tests behind
- the related TLA+ model still matches the interaction and disclosure rules if the milestone touched design logic

## 3. Review Questions

Before finishing a design pass, answer:

1. Is the most important action the most visually prominent?
2. Did product become clearer without changing behavior?
3. Did debug remain available but more secondary?
4. Did mobile improve, not just desktop?
5. Did the change reduce visual noise instead of just restyling it?
6. Would a low-technical user still understand this without AI vocabulary?
7. Would this still work with translated or Chinese text?
8. Would the main action still be understandable if spoken aloud?
9. Can the user rely on the assistant for deeper detail instead of manually parsing a dense screen?

If any answer is no, keep refining before closing the milestone.

## 4. File Priorities

Most design phases will center on:

- [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css)
- [public/index.html](/Users/robin/.codex/worktrees/afe5/Portal/public/index.html)
- [public/views/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/views/house.html)
- [public/house.html](/Users/robin/.codex/worktrees/afe5/Portal/public/house.html)
- [public/app.js](/Users/robin/.codex/worktrees/afe5/Portal/public/app.js)

Treat cross-surface selectors carefully. One CSS change can alter multiple routes.

## 5. Anti-Patterns

Do not:

- add more buttons to solve hierarchy
- add more color to solve hierarchy
- add more labels when spacing and emphasis are the real problem
- surface logs, ids, provider names, or dense operational evidence in the top layer when a summary-first layout would work
- bury the worker/debug panel if product rules require it
- quietly introduce new identity or navigation concepts

## 6. Design Phase Order

Follow this order unless explicitly re-approved:

1. design-system source of truth
2. audience and globalization readiness
3. town hub hierarchy
4. house hierarchy
5. house office readability
6. debug separation
7. cross-surface consistency
8. empty/loading/error polish
9. accessibility and responsive hardening
10. globalization and voice-readiness hardening
