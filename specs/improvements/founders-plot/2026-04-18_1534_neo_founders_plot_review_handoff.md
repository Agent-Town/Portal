# Founders Plot review handoff

**Author:** Neo  
**Created at:** 2026-04-18 15:34 Asia/Bangkok (GMT+7)  
**Reviewed branch:** `origin/codex/founders-plot-phase1-isolated`  
**Reviewed tip:** `a1b9527` (`Polish Founders Plot browser review`)  
**Previous reference point:** `2a69ad4` (`Implement Founders Plot phase 1`)

> Note: this handoff was written against the latest Founders Plot branch tip above. The local `main` checkout in this workspace is older.

## TL;DR

Founders Plot is promising and already playable end-to-end. The core architecture is strong.

If you only want to keep **one** team moving, this is the safer team to keep, because this branch is the one that actually works through the whole first gameplay loop in the browser.

But do **not** keep it unchanged. The other branch had several stronger ideas that should be imported here.

The newest version I reviewed on this branch was mostly **spec/polish/shell plumbing**, not a core gameplay fix. The most important gameplay issue is still present:

- after placing the first Lumber Camp, the quest jumps to `upgrade_hq_2` too early
- it only switches to `collect_first_wood` once production finishes
- after collection, it snaps back to `upgrade_hq_2`

That behavior still conflicts with the intended onboarding flow.

So my practical recommendation is:
- **continue with this team**
- **stop paying both teams in parallel if that’s a concern**
- **hand this team a concrete import list from `origin/feature/founders-plot-phase1`**

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

## What this team should import from the other branch

The second team’s branch (`origin/feature/founders-plot-phase1`) is not the one I would keep as the active lane right now, because its direct browser flow still has a first-loop blocker.

But it did contain several stronger ideas that are worth explicitly porting into this branch.

## Import list from `origin/feature/founders-plot-phase1`

## A) Fix the early quest progression using the second branch’s better first-loop logic
**Priority:** Very high

The strongest thing in the other branch was the first-run quest truth.

Its quest logic did the early sequence more cleanly:
- no Lumber Camp -> place Lumber Camp
- Lumber Camp exists but first wood not collected -> collect first wood
- only later move into the next expansion step

That is better than the current behavior in this branch, where HQ2 surfaces too early.

### What to import
- the principle from the other branch’s `currentQuest()` logic, not necessarily a blind file copy
- specifically: first wood collection should block HQ2 guidance

### Why it matters
This is the clearest user-facing flaw in the current branch, and the other branch already proved a better direction.

## B) Import the stronger approval-event audit trail
**Priority:** High

The other branch was better at making approval requests and approval resolutions visible as real events that feed replay/audit.

This branch should adopt that idea.

### What to import
- explicit event emission for approval request / resolve lifecycle
- replay visibility for those events
- recap visibility where appropriate
- ideally clearer event names than the donor branch’s current generic `AGENT_PERMISSION_CHANGED`

### Why it matters
Approval is one of the core trust boundaries in the game. If it is important enough to block actions, it is important enough to appear in the audit trail.

## C) Import the fuller spec and design-pack discipline
**Priority:** High

The other branch had a materially stronger documentation package.

Useful assets/patterns there included:
- `docs/specs/agent-town-founders-plot-phase1-spec.md`
- `docs/design/agent-town-design-pack/*`
- tighter local docs under `public/experiences/founders-plot/`

### What to import
- the missing product/design/spec material
- especially one reconciled source of truth for:
  - onboarding sequence
  - unlock order
  - permission ladder
  - replay/recap promises
  - public summary semantics

### Why it matters
Right now too much truth is split between goals, code, and specs. The other branch did a better job of making the product legible.

## D) Import the cleaner replay/recap framing
**Priority:** Medium to High

The other branch had the better conceptual posture here.

### What to import
- replay described as honest event/audit reconstruction, not magical full simulation claims
- recap generated from real events with clearer separation between public summary and full internal state
- any canonical hashing/state-bundle normalization patterns that improve determinism and inspectability

### Why it matters
This improves trust and keeps the system honest about what it actually proves.

## E) Import the broader test discipline
**Priority:** High

The other branch had a stronger overall test surface.

Useful test assets/patterns there included:
- `tests-founders-plot/fp-contract.test.js`
- `tests-founders-plot/fp-http.test.js`
- `tests-founders-plot/fp-perf.test.js`
- `tests-founders-plot/fp-unit.test.js`
- `e2e/200_founders_plot.spec.js`

### What to import
- broader backend and contract coverage
- stronger replay/approval regression tests
- a deterministic first-loop quest-order regression test

### Why it matters
This branch currently wins on working browser flow, but it should steal the other branch’s deeper validation discipline.

## F) Do **not** import the broken standalone-page behavior blindly
**Priority:** Very high

Important caution: the other branch is **not** just a superset upgrade.

In real browser testing, it currently gets stuck after the first Lumber Camp construction finishes:
- quest says collect first wood
- server says the Lumber Camp is `READY`
- server-derived state says it is queueable
- but the page exposes no Queue / Collect / Upgrade action buttons

The re-audit suggests this is likely a client/server contract seam:
- server-side building UI state includes booleans like `canQueue`
- client-side rendering instead checks `buildingDefs[type].produces`
- the state payload does not appear to include `buildingDefs`, so the UI can hide valid actions

### Practical implication
Do not tell this team to “just switch to the other branch.”
Tell them to selectively port the stronger ideas above into the working branch.

If they borrow from that UI, they should prefer server-authoritative flags like `canQueue`, `canCollect`, and `canUpgrade` over reconstructing action availability in the browser.

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

1. **Fix quest sequencing in `server/founders_plot/engine.js` using the second branch’s better first-loop logic as the reference direction**
   - highest user-facing impact
   - smallest targeted fix
   - easy to prove with a regression test

2. **Add replay/recap events for approval lifecycle**
   - borrow the stronger audit-trail idea from the second branch
   - strengthens the trust story
   - makes the auditability claim more honest

3. **Bring the spec/docs package up toward the second branch’s standard**
   - reconcile onboarding, unlock order, and permission rules into one honest source of truth
   - prevents future confusion for frontend, QA, and agent tooling

4. **Broaden the automated test surface**
   - import the second branch’s stronger discipline around contract/http/unit coverage
   - lock in the quest-order fix and approval visibility behavior

5. **Bring `specs/02_api_contract.md` back in sync**
   - update examples from live responses, not stale hand-written payloads

6. **Revisit `productivityScore` once onboarding is correct**
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
   - spec/design reconciliation
   - broader regression test import
   - API spec sync
   - optional scoring cleanup
3. **A retest pass after changes land**, using the checklist above.

That keeps the communication clear and keeps the work from dissolving into one vague "please improve Founders Plot" task.

## Decision recommendation

Since you do **not** want to pay two teams at the same time, I think the practical move is:

- **keep the first branch team active**
- **stop the second branch as an active implementation lane**
- **treat the second branch as a donor of ideas, tests, and docs**

Why:
- the first branch currently has the working end-to-end browser flow
- the second branch has better systems thinking, but it is not actually shippable as-is because the browser flow gets stuck
- paying both teams now is probably wasteful unless you specifically want a competitive bakeoff

So yes, I think your instinct is right.

If forced to choose one team today, I would choose the **first branch team**, then give them a very explicit import brief from the second branch instead of funding both in parallel.

## Future-version compatibility audit

This matters because Founders Plot does **not** need to be “deep enough” in v0 if the current save model can carry players forward cleanly.

My read: **it can**, with good implementation discipline.

### Current persistence shape
Player progress is already stored server-side in persistent SQLite tables, not just in browser memory.

The reviewed branches persist, in various forms:
- plot/core progression state
- buildings
- jobs
- permissions/policy
- approvals
- event log / replay inputs
- idempotency records

That is a solid base for expanding the game later without wiping progress.

### Current identity continuity
The first branch ties Founders Plot progress to a stable server-side identity with this priority:
- `house:<houseId>`
- `wallet:<chain>:<address>`
- `session:<teamCode|sessionId|anonymous>` fallback

That is the key property that makes long-lived progression feasible. If the same player comes back under the same house or wallet identity, the same plot can be loaded.

### What can safely evolve later
These are all realistically compatible with existing player progress:
- new buildings unlocked at later HQ levels
- new quests layered on top of existing state
- new rewards
- new permissions / autonomy tiers
- richer recap/replay views
- economy tuning (costs, durations, outputs)
- broader midgame and lategame depth

In other words: **v0 can be small**, and the game can still grow forward.

### Why extension is feasible here
A good property of the current design is that progression is mostly derived from persisted state, not from fragile hand-authored one-off story checkpoints.

That means future versions can look at facts like:
- HQ level
- built structures
- first collection completed or not
- unlocked permissions

…and then show the correct next content for an existing player.

That is exactly what you want if the game is going to deepen over time.

### The real compatibility risks
The team should treat these as explicit constraints:

1. **Do not break identity continuity casually**
   - if you later change how plots are keyed, add a migration/link step
   - otherwise old progress can become orphaned even if the data still exists

2. **Prefer additive save evolution**
   - adding new fields is easy
   - changing the meaning of old fields is risky

3. **Be careful with board/layout changes**
   - adding new pads is fine
   - moving/removing existing pads requires a real migration because buildings already have coordinates

4. **Do not rename core types lightly**
   - building types, job kinds, event meanings, and policy keys are part of the save contract now

### What I recommend the team add soon
To make later versions safer, I’d explicitly add:
- a save/schema version for Founders Plot state
- formal migration helpers for compatibility changes
- at least one seeded regression test that loads an older v0 plot into a newer version

### Practical conclusion
Yes, the game can start simple and become much deeper later **without wiping player progress**.

I would describe that as a real design advantage of the current architecture, not just a theoretical hope.

The right operating rule is:
- ship v0 simply
- treat persistence and identity as a compatibility surface
- evolve the game additively
