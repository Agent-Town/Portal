# Founders Plot review handoff

**Author:** Neo  
**Created at:** 2026-04-18 15:34 Asia/Bangkok (GMT+7)  
**Reviewed branch:** `origin/codex/founders-plot-phase1-isolated`  
**Reviewed tip:** `a1b9527` (`Polish Founders Plot browser review`)  
**Previous reference point:** `2a69ad4` (`Implement Founders Plot phase 1`)

> Note: this handoff was written against the latest Founders Plot branch tip above. The local `main` checkout in this workspace is older.

## TL;DR

Founders Plot is promising and already playable end-to-end. The core architecture is strong.

The newest version I reviewed was mostly **spec/polish/shell plumbing**, not a core gameplay fix. The most important gameplay issue is still present:

- after placing the first Lumber Camp, the quest jumps to `upgrade_hq_2` too early
- it only switches to `collect_first_wood` once production finishes
- after collection, it snaps back to `upgrade_hq_2`

That behavior still conflicts with the intended onboarding flow.

## What I validated

### Architecture and contracts
- Worker tool surface is wired end-to-end for Founders Plot.
- Mutation tools are idempotency-keyed.
- Server owns authoritative state, timers, rules, and outcomes.
- Identity continuity follows the expected priority: `house -> wallet -> session/team code`.
- Town-shell integration works through the Founders Plot route/modal flow.
- Public summary routes omit internal pair/session identifiers.

### Gameplay and replay
- Founders Plot is actually playable, not just spec-complete.
- A live run completed the first real loop: place Lumber Camp, wait through construction, queue production, wait, collect output.
- Replay/hash parity worked when fed a complete authoritative event history.

### Latest-version check
I re-checked the newer tip and confirmed:
- the game still runs
- the main onboarding bug still reproduces
- no core gameplay fix landed for the issue above

## What changed in the newer version

Diff from `2a69ad4` to `a1b9527` touched only:
- `public/app.js`
- `public/experiences/founders-plot/styles.css`
- `server/index.js`
- `specs/17_founders_plot_phase1.md`

It did **not** touch:
- `server/founders_plot/*`
- `public/experiences/founders-plot/app.js`
- `e2e/132_founders_plot_registry_handoff.spec.js`
- `e2e/133_founders_plot_runtime_contract.spec.js`
- `e2e/134_founders_plot_resume_recap.spec.js`

### Practical meaning
The newer version improved documentation and some shell/config polish, but it did not change the Founders Plot core simulation or the onboarding quest logic.

## Findings

## 1) Onboarding quest order still contradicts the intended product flow
**Priority:** High

### Expected flow
From `public/experiences/founders-plot/goals.md`:
1. Place the first Lumber Camp.
2. Collect the first wood.
3. Upgrade Headquarters to level 2.

### Actual behavior
Observed in live validation and still reproduced on the newer tip:
1. Place the first Lumber Camp.
2. Quest immediately changes to `upgrade_hq_2`.
3. Only once Lumber Camp output is ready does the quest switch to `collect_first_wood`.
4. After collection, it returns to `upgrade_hq_2`.

### Evidence
- Intended goals: `public/experiences/founders-plot/goals.md`
- Current quest logic: `server/founders_plot/engine.js` (`nextQuest()`)
- Relevant current code shape:
  - if there is no Lumber Camp -> `place_lumber_camp`
  - if first lumber has not been collected **and output is ready** -> `collect_first_wood`
  - otherwise, if HQ level < 2 -> `upgrade_hq_2`

### Impact
This makes the first-run experience feel wrong. It teaches the player to ignore the first resource loop, even though the design says the opposite.

### Recommended fix
Change `nextQuest()` so the first wood-collection milestone blocks HQ2 guidance until the first collection is complete.

### Recommended regression test
Add a deterministic test that asserts this exact sequence:
1. place Lumber Camp
2. wait until output is ready
3. collect first wood
4. only then surface `upgrade_hq_2`

## 2) Approval request/resolve are underrepresented in replay and recap
**Priority:** Medium

### What I found
Approval state changes happen, but they do not appear to be recorded as first-class replay/recap events in the same way as normal town actions.

### Evidence
- `server/founders_plot/routes.js` resolves approvals with `appendEvent: null`
- `server/founders_plot/engine.js` has `applyRequestUserApproval(...)` and `applyResolveApproval(...)`, but the reviewed path does not add normal event-log entries for those state changes

### Impact
This weakens the auditability story for one of the most important trust boundaries in the system.

### Recommended fix
Add explicit event types for:
- approval requested
- approval approved
- approval rejected

Then include them in:
- replay output
- recap generation
- approval-related tests

## 3) API/spec examples are stale relative to the implementation
**Priority:** Medium

### Evidence
Current implementation:
- `server/founders_plot/engine.js` defines **6** build pads
- `server/founders_plot/engine.js` starts inventory with `coin: 20`

Current examples in `specs/02_api_contract.md` still imply older shapes/values in places, including outdated public summary examples and earlier assumptions from the original review.

### Impact
This creates drift between implementation, QA expectations, and future agent/runtime integrations.

### Recommended fix
Update `specs/02_api_contract.md` from live implementation constants and real response payloads, not hand-maintained examples.

## 4) `productivityScore` likely rewards stockpiling more than meaningful operations
**Priority:** Low to Medium

### Evidence
In `server/founders_plot/engine.js`, `productivityScore` currently derives heavily from:
- HQ level
- built structure count
- stored resources
- pending rewards

### Impact
That makes the public summary metric look plausible, but not obviously honest as a measure of operational efficiency.

### Recommended fix
Treat this as a follow-up after onboarding is corrected. Either:
- rename it to something softer, or
- redesign it around throughput, completed jobs, uptime, and efficiency instead of mostly static accumulation.

## 5) One thing got better: there is now a real phase-1 spec
**Priority:** Positive note

The newer version added `specs/17_founders_plot_phase1.md`, which is a real improvement.

That helps a lot. Before that, product/design intent was scattered across tests, goals, and implementation.

### Recommendation
Keep `specs/17_founders_plot_phase1.md`, but make sure the live implementation and tests stay aligned with it. Right now the onboarding quest order is the clearest mismatch.

## Recommended implementation order

1. **Fix quest sequencing in `server/founders_plot/engine.js`**
   - highest user-facing impact
   - smallest targeted fix
   - easy to prove with a regression test

2. **Add replay/recap events for approval lifecycle**
   - strengthens the trust story
   - makes the auditability claim more honest

3. **Bring `specs/02_api_contract.md` back in sync**
   - prevents future confusion for frontend, QA, and agent tooling

4. **Revisit `productivityScore` once onboarding is correct**
   - lower urgency than the flow bug

## Retest checklist after fixes

When the team ships the next version, I should re-check these exact items:

- [ ] After placing the first Lumber Camp, the quest does **not** jump early to HQ2
- [ ] First collection is required before HQ2 becomes the primary quest
- [ ] Approval request and resolve actions appear in replay/recap output
- [ ] API examples match live response shapes
- [ ] Updated e2e or unit regression tests cover the quest-order fix
- [ ] Live play still completes the first loop without breaking determinism

## Suggested team workflow

The most effective handoff is **not just one markdown file**. I recommend this package:

1. **This markdown handoff** for shared context and evidence.
2. **One implementation ticket per concrete issue**:
   - quest-order fix
   - approval audit trail fix
   - API spec sync
   - optional scoring cleanup
3. **A retest pass after changes land**, using the checklist above.

That keeps the communication clear and keeps the work from dissolving into one vague "please improve Founders Plot" task.
