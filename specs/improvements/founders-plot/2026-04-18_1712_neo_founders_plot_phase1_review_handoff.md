# Founders Plot review handoff

**Author:** Neo  
**Created at:** 2026-04-18 17:12 Asia/Bangkok (GMT+7)  
**Reviewed branch:** `origin/feature/founders-plot-phase1`  
**Reviewed tip:** `e0ed5e0` (`claude founders plot`)  
**Comparison baseline:** `origin/codex/founders-plot-phase1-isolated` @ `a1b9527`

## TL;DR

This branch is the stronger **core Founders Plot implementation**.

Compared with the other version, it is much more complete on:
- actual simulation/backend depth
- early quest flow correctness
- approval lifecycle auditability
- replay/recap honesty
- test coverage breadth
- first-class spec/docs pack

But after a higher-effort re-audit, I would **not** treat it as the active delivery branch right now.

Two reasons:
- it is weaker on **Portal shell integration polish**
- more importantly, it has a **real browser blocker** after the first construction completes

So the cleaner read is now:
- **this branch wins on game/system truth**
- **the other branch is still the safer branch to actively continue if only one team stays funded**

That changes the practical recommendation.

If Robin keeps only one lane active, I would keep the **first branch team** moving and use this branch as a **donor branch** for logic, tests, and docs.

## What I validated

### Branch shape
This branch is much broader than the other one.

Relative to `origin/main`, it adds or changes:
- a full `server/founders_plot/*` implementation
- dedicated Founders Plot frontend under `public/experiences/founders-plot/*`
- focused Founders Plot tests in `tests-founders-plot/*`
- Playwright smoke tests in `e2e/200_founders_plot.spec.js`
- a substantial design/spec pack under `docs/design/*` and `docs/specs/agent-town-founders-plot-phase1-spec.md`
- experience registry support and direct `/founders-plot` serving

### Focused runtime validation
I ran the same focused Founders Plot E2E suite here too.

Result: **8/8 passed**
- page loads with grid + resource strip
- tools endpoint exposes 8 `et.plot.*` tools
- state seeds HQ + starter coin
- Lumber Camp placement works
- idempotency works
- idempotency conflict returns 409
- agent placement is policy-blocked with 403
- full construct → produce → collect loop adds wood

That gives real confidence that the API/test harness loop is live in this branch.

### Real browser result
I then ran the direct `/founders-plot` page in a real Playwright browser session on a local test server and stepped through the first loop.

What worked:
- page loads cleanly
- placing a Lumber Camp through the browser UI works
- the quest stays on `collect-first-wood` after placement, which is better than the other branch
- after test-time construction advance, server state is still coherent: the Lumber Camp is `READY`, quest remains `collect-first-wood`, and `canQueue: true`

What broke:
- after construction completes, the browser UI exposes **no actionable control** for the ready Lumber Camp
- the building panel showed no Queue button, no Collect button, and no Upgrade button
- the tile rendered as `Idle`, while the quest still told the user to collect the first wood output

That means the direct browser experience is currently **not fully playable end-to-end**, even though the backend/test flow passes.

## Most important comparison result

## 1) This branch fixes the first onboarding quest bug, but not all quest-design drift
**Priority:** Very high

### Other branch
In the earlier reviewed branch, the quest order was wrong:
- place Lumber Camp
- quest jumps too early to HQ2
- only later asks for first wood collection
- then snaps back to HQ2

That contradicted the product goals.

### This branch
This branch’s `currentQuest()` is materially better on the first loop:
- if no Lumber Camp -> `place-lumber-camp`
- if Lumber Camp exists but hasn’t been collected -> `collect-first-wood`

That directly fixes the worst onboarding bug from the other branch.

### Remaining mismatch
The quest logic then moves to `place-farm-plot` before `upgrade-hq-2`.

That is still not fully clean against the written design materials:
- `public/experiences/founders-plot/goals.md` says upgrade HQ to Level 2 before placing Farm Plot
- `docs/specs/agent-town-founders-plot-phase1-spec.md` is internally inconsistent, because one section says Farm Plot comes early while the HQ unlock table says Farm Plot unlocks at HQ2

So this branch is better, but not perfectly aligned yet.

### Evidence
- `server/founders_plot/engine.js`, `currentQuest(bundle)`
- `public/experiences/founders-plot/goals.md`
- `docs/specs/agent-town-founders-plot-phase1-spec.md`

### Conclusion
This is a real improvement, not just a wording change, but the later Farm Plot vs HQ2 progression still needs reconciliation.

For first-run Lumber Camp -> first wood truth, this branch is better.

## 2) Approval lifecycle is better represented here than in the other branch
**Priority:** High

The earlier branch had a real auditability weakness around approval request/resolve visibility.

This branch is stronger.

### What I found
Approval request and approval resolution both create events:
- request -> `AGENT_PERMISSION_CHANGED` with summary `A user approval request is waiting in the queue.`
- resolve -> `AGENT_PERMISSION_CHANGED` with summary `A pending approval request was approved.` or rejected

### Evidence
- `server/founders_plot/engine.js`
  - `createApprovalRequest(...)`
  - `resolveApproval(...)`
- replay audit is derived from stored events in `server/founders_plot/replay.js`

Static inspection shows those approval events are emitted and then surfaced through the replay audit path.

### Caveat
The event type name `AGENT_PERMISSION_CHANGED` is semantically a bit muddy for approval-request / approval-resolution events. It works, but it is not the clearest label.

### Recommendation
Keep the event logging behavior, but consider using sharper event types later, for example:
- `APPROVAL_REQUESTED`
- `APPROVAL_APPROVED`
- `APPROVAL_REJECTED`

Still, this branch is already better than the other one on the core trust story.

## 3) This branch has the more complete and honest product spec package
**Priority:** High

The other reviewed branch added a useful spec, but this branch goes much further.

### Strong additions here
- `docs/specs/agent-town-founders-plot-phase1-spec.md`
- `docs/design/agent-town-design-pack/*`
- local experience docs under `public/experiences/founders-plot/`
  - `goals.md`
  - `heartbeat.md`
  - `safety.md`
  - `skill.md`
  - `tools.md`

### Why this matters
This branch makes the product intent easier to recover and reason about.

The system goals, economy, quest framing, permission ladder, and replay expectations are documented much more explicitly here.

### Conclusion
For implementation clarity and future maintenance, this branch is substantially stronger.

## 4) Replay/recap architecture is clearer and more honest here
**Priority:** Medium to High

### What I found
This branch has a simpler, cleaner replay story:
- canonical state hashing from sorted bundle structure
- replay audit derived from visible event log entries
- recap generated from real events
- public summary separated from full internal state

### Evidence
- `server/founders_plot/replay.js`
- `server/founders_plot/recap.js`
- `server/founders_plot/engine.js`

### Why it’s better
The design reads more like honest event-sourced bookkeeping than over-claiming “full simulation replay magic.”

That’s the right posture.

## 5) This branch has a specific client/server contract bug in the real browser flow
**Priority:** High

This is the biggest newly confirmed product blocker in the branch.

### What I found
In a real browser run of `/founders-plot`:
- initial page load worked
- manual Lumber Camp placement worked
- quest text updated correctly to `collect-first-wood`
- after advancing construction, server state said the Lumber Camp was `READY`
- server-derived UI state also said `canQueue: true`
- but the page showed the building as `Idle` and exposed no Queue / Collect / Upgrade action buttons

### Stronger root-cause hypothesis from re-audit
This no longer looks like a vague rendering glitch. It looks like a concrete client/server seam bug.

Server-side:
- `buildingUiState()` computes `canQueue`, `canCollect`, and `canUpgrade`
- those booleans are included in `state.buildings`

Client-side:
- `renderBuildingPanel()` does **not** use `building.canQueue` or `building.canCollect`
- instead it checks `def.produces` from `bundle.buildingDefs[type]`
- but the state payload assembled in `buildState()` does **not** include `buildingDefs`

That means the browser can receive a building that is truly queueable, while the UI still renders no queue action because it is looking at the wrong contract surface.

### Evidence
- browser capture from local test run
- result artifact: `tmp/founders-plot-browser-check/result.json`
- screenshots captured at:
  - `tmp/founders-plot-browser-check/01-initial.png`
  - `tmp/founders-plot-browser-check/02-after-place.png`
  - `tmp/founders-plot-browser-check/03-after-construction.png`
- server logic:
  - `server/founders_plot/engine.js` -> `buildingUiState()` and `buildState()`
- client logic:
  - `public/experiences/founders-plot/founders-plot.js` -> `renderBuildingPanel()` and `normalizeBundle()`

### Practical meaning
The second branch is stronger on game logic, but the direct browser experience still has a real first-loop blocker. A player can place the first Lumber Camp, then gets stuck because the next action surface does not appear.

### Recommended fix
Pick one contract and use it consistently:
- best option: make the client render from `building.canQueue`, `building.canCollect`, and `building.canUpgrade`
- secondary option: include a fully serializable `buildingDefs` shape in the state payload and keep client logic aligned with that

I strongly prefer the first option, because it keeps the server authoritative for action availability.

### Conclusion
Do not describe this branch as fully browser-playable yet. The server/test harness says the loop is valid, but the real page currently breaks at the first post-construction interaction.

## 6) This branch is weaker on town-shell/modal integration
**Priority:** High

This is the biggest place where the other branch still has an advantage once the standalone-page blocker above is fixed.

### What I found
This branch includes:
- manifest-backed experience registration
- `/api/experiences`
- direct route serving for `/founders-plot`
- direct page implementation at `public/experiences/founders-plot/index.html`

But the Portal shell path is not obviously completed in the same way as the other branch.

Specifically:
- `public/app.js` still has `districtViews` hardcoded to the older district set
- `EXPERIENCE_UI_MODAL_NAMES` does **not** include `founders-plot`
- `showDistrict()` is not obviously wired to open Founders Plot as a modal district
- the route exists directly via `server/index.js`, but the town-shell UX seam looks unfinished

### Practical meaning
This branch looks like the better game implementation, but not the cleaner final Portal UX integration.

### Conclusion
If Robin is choosing “which branch is closer to shipping inside Portal as a coherent user journey,” the other branch still has a real edge there.

## 7) Tool contract/docs have one local mismatch that should be fixed
**Priority:** Medium

In `public/experiences/founders-plot/tools.md`, the docs say:
- agent building placement is gated to human callers
- `et.plot.request_user_approval` creates a visible approval card with no state mutation

But actual implementation is more nuanced:
- agent placement is blocked unless there is a matching approval request, then it can proceed
- approval request does create a logged event

So the docs are directionally right but not fully precise.

### Recommendation
Sync `tools.md` with actual behavior, especially around:
- approval-request side effects
- approved agent mutations
- route shapes (the docs mention `/api/founders-plot/tools/<name>` POST style, while implementation is split across concrete endpoints)

## 8) Test surface is stronger here
**Priority:** Positive note

Compared with the other branch, this one has much more substantial validation:
- `e2e/200_founders_plot.spec.js`
- `tests-founders-plot/fp-contract.test.js`
- `tests-founders-plot/fp-http.test.js`
- `tests-founders-plot/fp-perf.test.js`
- `tests-founders-plot/fp-unit.test.js`

That is a meaningful advantage.

Even before reading every test in depth, the shape alone suggests this branch was built more as a complete system slice.

## Side-by-side comparison

## Where `feature/founders-plot-phase1` is better
- initial Lumber Camp -> first wood progression is better
- approval lifecycle is more visible in the event log
- replay/recap architecture is cleaner and more honest
- Founders Plot backend is fuller and more coherent
- docs/spec pack is much stronger
- test surface is broader and more mature

## Where `codex/founders-plot-phase1-isolated` is better
- cleaner town-shell/modal integration direction
- better evidence of fitting Founders Plot into the existing house/town UI flow
- likely closer to a polished Portal-facing experience layer
- narrower delta, easier to review in isolation

## Best current interpretation
- **core game lane winner:** `feature/founders-plot-phase1`
- **shell integration winner:** `codex/founders-plot-phase1-isolated`

## Recommended decision

After the re-audit, I would no longer frame this as a clean merge-base winner.

If Robin were funding both teams and willing to pay for reconciliation work, then yes, a merge strategy could still make sense.

But if Robin wants **one active team only**, I would now recommend this instead:

### Practical recommendation
- keep **`codex/founders-plot-phase1-isolated`** as the active delivery lane
- treat **`feature/founders-plot-phase1`** as a donor branch
- explicitly harvest the strongest ideas from this branch into the working branch

### Why this changed
Because the most important question is not just “which branch has better architecture?”
It is “which branch is safest to continue right now without stalling the product?”

This branch still loses that practical test because:
- the real browser flow is blocked after first construction
- the Portal shell/modal path is weaker
- the passing E2E suite proves backend/test-loop health, not full browser usability

### What should be harvested from this branch
- first-loop quest truth
- approval event visibility
- replay/recap framing
- richer spec/design docs
- broader tests

That gives Robin the best trade: keep the branch that already works end-to-end in the browser, but import the stronger systems thinking from this one.

## Suggested harvest plan

1. **Keep the `codex/founders-plot-phase1-isolated` branch as the shipping base**
   - preserve the working browser flow
   - preserve the Portal shell/modal integration path

2. **Harvest from `feature/founders-plot-phase1` selectively**
   - quest logic for Lumber Camp -> first wood
   - approval-event logging discipline
   - replay/recap honesty
   - stronger tests
   - stronger docs/spec pack

3. **Avoid blind copying of the current standalone-page UI layer**
   - fix the client/server action-surface seam first
   - then port only what survives real browser validation

4. **Do one narrow reconciliation pass on interfaces, not a whole-branch replacement**
   - quest sequencing
   - approval visibility
   - doc/tool contract sync
   - test import

## Retest checklist after reconciliation

- [ ] Founders Plot opens from the intended town-shell flow, not just direct route access
- [ ] First-run quest flow is still: Lumber Camp -> collect first wood -> later progression
- [ ] Approval request and resolution still appear in replay/recap
- [ ] E2E suite still passes 8/8 or better
- [ ] Tool docs match real endpoint behavior
- [ ] No regression in house/wallet/session identity continuity

## Bottom line

If you need me to call it plainly:

**The second team built the better Founders Plot game system.**  
**The first team built the cleaner Portal integration shell.**

So the right move is probably: **promote the second team’s game logic, steal the first team’s integration ideas, then do one honest reconciliation branch.**
