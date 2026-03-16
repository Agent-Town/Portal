# Design Agent Runbook

Status: Active execution guide

This runbook tells future agentic AI developers how to execute the design program in a disciplined way.

## 1. Mission

Improve the product's design without changing how the product works.

## 2. Required Read Order

Before touching any file:

1. [design/01_design_context_and_system_baseline.md](/Users/robin/.codex/worktrees/3e47/Portal/design/01_design_context_and_system_baseline.md)
2. [design/02_design_audit_and_target_state.md](/Users/robin/.codex/worktrees/3e47/Portal/design/02_design_audit_and_target_state.md)
3. [design/03_design_tdd_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/03_design_tdd_spec.md)
4. [design/formal/README.md](/Users/robin/.codex/worktrees/3e47/Portal/design/formal/README.md)
5. [design/05_screen_inventory_and_selector_map.md](/Users/robin/.codex/worktrees/3e47/Portal/design/05_screen_inventory_and_selector_map.md)
6. [design/08_design_system_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/08_design_system_spec.md)
7. [design/09_component_contracts.md](/Users/robin/.codex/worktrees/3e47/Portal/design/09_component_contracts.md)
8. [design/10_frontend_design_build_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/10_frontend_design_build_spec.md)
9. [design/11_global_audience_and_voice_requirements.md](/Users/robin/.codex/worktrees/3e47/Portal/design/11_global_audience_and_voice_requirements.md)

Then read only the specific target files for the current milestone.

## 3. Required Workflow

### Step 1. Capture baseline

- Run the app
- Walk the target surfaces at mobile, tablet, and desktop
- Capture before screenshots

Minimum surfaces:

- start
- town hub / district modal
- house console
- house office
- leaderboard
- registry
- create
- agent dock

### Step 2. Write or confirm acceptance checks first

Before styling changes:

- define the milestone acceptance checks
- decide which checks are DOM/layout assertions
- decide which checks are screenshot review requirements
- confirm the relevant token and component rules already exist in [design/08_design_system_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/08_design_system_spec.md) and [design/09_component_contracts.md](/Users/robin/.codex/worktrees/3e47/Portal/design/09_component_contracts.md)
- confirm the phase satisfies [design/11_global_audience_and_voice_requirements.md](/Users/robin/.codex/worktrees/3e47/Portal/design/11_global_audience_and_voice_requirements.md)
- confirm the phase keeps visible UI summary-first while preserving deeper detail for advanced or assistant-guided access
- confirm the simple view, advanced view, and assistant-facing structured detail still tell the same story
- if the phase changes disclosure boundaries, modal continuity, or summary/detail/assistant truth, review the relevant module in [design/formal/](/Users/robin/.codex/worktrees/3e47/Portal/design/formal) and update it before treating the milestone as complete

### Step 3. Design in the smallest possible scope

- One milestone at a time
- Do not mix unrelated screens in one pass
- Do not redesign the entire app in one commit

### Step 4. Remove before adding

For every target surface:

- remove redundant chrome
- reduce duplicated copy
- simplify hierarchy
- only then adjust color, radius, motion, or shadow

### Step 5. Tokenize the result

- move repeated visual rules into shared tokens/classes
- remove inline visual/layout styling from the target area

### Step 6. Verify at all viewports

- mobile first
- tablet second
- desktop third
- then validate translated/CJK fit for the affected high-priority surfaces

If it only looks good on desktop, the phase is not complete.

### Step 7. Re-run functional regression

- run the relevant design acceptance checks
- run the relevant nearby product tests
- run the full suite before finalizing a major phase

## 4. Commands

Local dev:

```bash
npm run dev
```

Full regression:

```bash
npm test
```

Inline-style inventory for target templates:

```bash
rg -n 'style="' public/start.html public/index.html public/views/house.html public/leaderboard.html public/registry.html public/create.html
```

Color/spacing/radius hardcode scan:

```bash
rg -n '#[0-9a-fA-F]{3,8}|border-radius:|box-shadow:|padding:|margin:' public/styles.css public/registry.html public/views/house.html public/index.html
```

## 5. Design Review Questions

Before marking a milestone complete, answer:

- Can a new user tell what to do in 2 seconds?
- Is there exactly one dominant action in the first viewport?
- Did visual noise decrease?
- Did consistency increase?
- Does mobile feel designed, not tolerated?
- Did any functionality change, even accidentally?
- Could a basic non-technical user understand the first viewport without AI jargon?
- Could the user learn the deeper detail by asking the assistant instead of reading another dense block?
- Would the layout survive translated or Chinese copy?
- Are the main controls short and clear enough for future voice interaction?

## 6. Screen Review Template

For each changed screen, record:

- Current issue
- Design decision
- Files changed
- Tokens used or added
- Acceptance metrics that passed
- Remaining known compromises

## 7. Stop Conditions

Stop and escalate if:

- the improvement requires product behavior changes
- the needed component/token does not exist and would become a new design-system rule
- the phase forces a new navigation model
- the redesign would conflict with modal-first continuity

## 8. Required Doc Sync After A Phase

After each design phase:

- update [design/02_design_audit_and_target_state.md](/Users/robin/.codex/worktrees/3e47/Portal/design/02_design_audit_and_target_state.md) with status
- update [design/03_design_tdd_spec.md](/Users/robin/.codex/worktrees/3e47/Portal/design/03_design_tdd_spec.md) with implemented milestone state
- update [design/05_screen_inventory_and_selector_map.md](/Users/robin/.codex/worktrees/3e47/Portal/design/05_screen_inventory_and_selector_map.md) if selectors or file ownership changed
- update [design/formal/04_formal_mapping.md](/Users/robin/.codex/worktrees/3e47/Portal/design/formal/04_formal_mapping.md) if the milestone changes disclosure or continuity logic

## 9. Non-Negotiable Rules

- Do not change behavior under the banner of design
- Do not add decorative elements to solve hierarchy problems
- Do not invent third or fourth component variants when the fix is to standardize
- Do not preserve inline styling for speed
- Do not move to the next phase if the current result still feels wrong
