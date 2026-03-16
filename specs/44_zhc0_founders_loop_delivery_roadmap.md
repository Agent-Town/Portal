# 44. ZHC0 Founders Loop Delivery Roadmap

Status: roadmap and measurable TDD contract for agentic AI developers  
Last updated: 2026-03-16
Branch: `zhc0-founders-loop`

## 1. Purpose

This spec turns the ZHC0 founders loop into a delivery roadmap that agentic AI developers can implement against.

It exists to ensure that:

1. work happens in clear milestones,
2. each milestone has measurable goals,
3. product, design, formal state, and tests stay aligned,
4. the resulting work can be reasoned about and reproduced later.

---

## 2. Artifact chain

Every milestone in this roadmap must keep these artifacts aligned:

1. `docs/zhc0-screen-plan.md`
2. `docs/founders-loop-state-model.md`
3. `machines/FoundersLoop.machine.ts`
4. `machines/FoundersLoop.tla`
5. `machines/FoundersLoop.cfg`
6. `design/specs/10_founders_loop_ui_state_projection.md`
7. `design/specs/11_zhc0_ui_evidence_contract.md`
8. `specs/43_zhc0_founders_loop_state_contract.md`
9. this roadmap spec

If implementation changes one layer, it must reconcile the chain.

---

## 3. Development rules for agentic AI implementers

1. Only take one milestone at a time.
2. Keep each implementation pass small enough to verify clearly.
3. Do not widen scope into later worker/offload/marketplace features during the founders loop.
4. Preserve worker-first architecture.
5. Preserve browser-first playability.
6. Preserve modal/in-shell continuity where relevant.
7. Do not replace real actions with fake tutorial-only completions.
8. Update docs, machine artifacts, and tests in the same change when a milestone modifies state truth.
9. A milestone is complete only when:
   - the named tests are green,
   - the required machine/design docs are aligned,
   - the measurable goals are satisfied.

---

## 4. Global measurable metrics

These metrics should trend to `true` or exact parity as milestones complete.

### 4.1 State and projection metrics

1. `foundersLoopStateProjectionMismatchCount = 0`
   - Meaning: formal state, UI projection, and visible UI do not disagree.
2. `phaseMarkerCoverage = 100%`
   - Meaning: every founders-loop screen exposes a machine-readable phase marker.
3. `overlayStateCoverage = 100%`
   - Meaning: every meaningful loading/blocked/error/success state is explicitly handled and marked.

### 4.2 Primary-action metrics

1. `primaryActionUniqueness = 1`
   - Meaning: exactly one visible primary action per founders-loop screen state.
2. `lateLoopActionLeakCount = 0`
   - Meaning: no future-phase CTA appears before its prerequisites are satisfied.
3. `blockedStateExplained = true`
   - Meaning: every blocked state says what prerequisite is missing.

### 4.3 Progression metrics

1. `worldUnlockConsistency = exact`
   - Meaning: newly visible rooms/quests correspond exactly to completed milestones.
2. `resumeParity = exact`
   - Meaning: resuming the loop shows the same phase/progress truth after reload.
3. `firstLoopCompletionTruth = exact`
   - Meaning: loop completion is not claimed before memory save and next-quest reveal.

### 4.4 Evidence metrics

1. `mobileTabletDesktopEvidenceCoverage = 100%`
   - Meaning: each major founders-loop phase has screenshot evidence at mobile, tablet, and desktop.
2. `machineArtifactParity = exact`
   - Meaning: `.machine.ts`, `.tla`, and human-readable state model agree on state variables and invariants.

---

## 5. Reserved Playwright block

Reserved tests for the founders-loop roadmap:

1. `e2e/414_zhc0_founders_loop_harness.spec.js`
2. `e2e/415_zhc0_start_entry_contract.spec.js`
3. `e2e/416_zhc0_first_worker_ready_gate.spec.js`
4. `e2e/417_zhc0_townhall_founder_progress.spec.js`
5. `e2e/418_zhc0_alignment_gate.spec.js`
6. `e2e/419_zhc0_create_crest_contract.spec.js`
7. `e2e/420_zhc0_house_first_entry_hq_surface.spec.js`
8. `e2e/421_zhc0_first_mission_brief_contract.spec.js`
9. `e2e/422_zhc0_first_mission_completion_contract.spec.js`
10. `e2e/423_zhc0_first_memory_capture_contract.spec.js`
11. `e2e/424_zhc0_next_quest_reveal_contract.spec.js`
12. `e2e/425_zhc0_founders_loop_resume_contract.spec.js`
13. `e2e/426_zhc0_founders_loop_machine_projection.spec.js`
14. `e2e/427_zhc0_founders_loop_mobile_primary_action.spec.js`
15. `e2e/428_zhc0_founders_loop_full_smoke.spec.js`

These may be expanded later, but these are the minimum roadmap anchors.

---

## 6. Milestones

## M44.0 — Artifact-chain freeze

### Goal
Freeze the first coherent founders-loop artifact chain before UI work spreads.

### Required outputs
- state model
- machine scaffold
- TLA+ artifact scaffold
- UI projection spec
- UI evidence contract
- roadmap spec

### Measurable goals
1. `machineArtifactParity = exact`
2. every formal phase maps to at least one UI surface
3. every critical invariant appears in both human-readable and formal artifacts

### Acceptance
- docs and machine artifacts exist and cross-link correctly
- no unresolved contradiction between state model and UI projection table

### Suggested tests
- none required yet beyond lint/sanity and doc parity review

---

## M44.1 — `/start` contract

### Goal
Make `/start` a one-action entry into the founders loop.

### Measurable goals
1. `primaryActionUniqueness = 1`
2. `lateLoopActionLeakCount = 0` on `/start`
3. `phaseMarkerCoverage` for the arrival state = `100%`
4. the primary CTA is visible in initial viewport on mobile

### Acceptance
- `/start` clearly projects `arrival`
- no House/mission/next-quest action appears early
- blocked/auth/loading states are explicit

### Required artifact updates
- UI projection spec
- evidence contract if markers differ
- screen plan if narrative changes

### Tests to turn green
- `e2e/415_zhc0_start_entry_contract.spec.js`
- `e2e/427_zhc0_founders_loop_mobile_primary_action.spec.js` (arrival assertions)

---

## M44.2 — First worker readiness gate

### Goal
Make the first worker setup feel guided and block later phases honestly until ready.

### Measurable goals
1. founders progression remains blocked until `brainState = ready`
2. `blockedStateExplained = true`
3. recoverable error state exists and is testable
4. late-loop CTAs still absent

### Acceptance
- agent readiness is machine-visible
- founders registration cannot be treated as complete if the worker is not ready
- setup errors recover in-place

### Required artifact updates
- state model if readiness semantics change
- machine invariants if gating changes
- UI evidence contract for ready/loading/error/blocked overlays

### Tests to turn green
- `e2e/416_zhc0_first_worker_ready_gate.spec.js`
- `e2e/426_zhc0_founders_loop_machine_projection.spec.js` (worker gate assertions)

---

## M44.3 — Town Hall founder progression

### Goal
Make Town Hall a measurable founding ceremony rather than a form blob.

### Measurable goals
1. partial progress is resumable
2. alignment cannot pass before both founders are registered
3. exactly one primary CTA is visible per Town Hall state
4. `phaseMarkerCoverage` for founder states = `100%`

### Acceptance
- human and agent founder progress can be resumed after refresh
- completion state is explicit
- no HQ or mission CTA leaks early

### Required artifact updates
- screen plan
- state model if founder substates evolve
- UI projection and evidence contract

### Tests to turn green
- `e2e/417_zhc0_townhall_founder_progress.spec.js`
- `e2e/425_zhc0_founders_loop_resume_contract.spec.js` (Town Hall resume assertions)

---

## M44.4 — Alignment and crest

### Goal
Make the alignment ritual and crest creation a strict, measurable gate into HQ.

### Measurable goals
1. crest cannot become `created` before `alignmentState = passed`
2. House CTA remains blocked until crest exists
3. success feedback is brief and explicit
4. the transition path into HQ is clear

### Acceptance
- ritual completion is test-visible
- House first-entry cannot appear early
- the player is handed off to crest/HQ in one clear sequence

### Required artifact updates
- machine transitions and invariants if needed
- UI projection for alignment/crest handoff states
- TLA+ artifact if transitions changed

### Tests to turn green
- `e2e/418_zhc0_alignment_gate.spec.js`
- `e2e/419_zhc0_create_crest_contract.spec.js`
- `e2e/426_zhc0_founders_loop_machine_projection.spec.js` (alignment/crest assertions)

---

## M44.5 — House first-entry HQ surface

### Goal
Make House feel like headquarters, not miscellaneous platform sprawl.

### Measurable goals
1. House first-entry state exposes `hq_ready`
2. exactly one primary action is visible for first entry
3. deep admin/library complexity is de-emphasized on first entry
4. mission CTA appears only after HQ is truly ready

### Acceptance
- the user can identify House as HQ in one screenful
- the first mission is the obvious next move
- late/lower-priority systems do not dominate first entry

### Required artifact updates
- screen plan if room semantics change
- UI projection and evidence contract for House first entry

### Tests to turn green
- `e2e/420_zhc0_house_first_entry_hq_surface.spec.js`
- `e2e/426_zhc0_founders_loop_machine_projection.spec.js` (House gating assertions)

---

## M44.6 — First mission brief and completion

### Goal
Create one real, measurable first mission lane.

### Recommended first mission
- Web Ops / market research

### Measurable goals
1. mission can start only from `hq_ready`
2. mission completion produces visible output/evidence
3. mission completion alone does **not** mark the loop complete
4. player sees a clear handoff to memory capture

### Acceptance
- one canonical first mission exists
- success condition is explicit
- result is visible in the UI
- memory save is the next step

### Required artifact updates
- screen plan if mission meaning changes
- state model if mission substates expand
- UI evidence contract for active/completed/failed mission overlays

### Tests to turn green
- `e2e/421_zhc0_first_mission_brief_contract.spec.js`
- `e2e/422_zhc0_first_mission_completion_contract.spec.js`

---

## M44.7 — First memory capture and save-point path

### Goal
Make first memory capture a real progression event.

### Measurable goals
1. first memory may come from mission output and/or the user-agent discussion that shaped it
2. loop completion remains false until memory is saved
3. a visible success state explains why the save matters
4. a future-compatible path toward config/mind capture is preserved

### Acceptance
- player saves one meaningful artifact/note/conversation capture
- Library first entry is understandable
- memory save feels rewarding, not administrative

### Required artifact updates
- screen plan
- state model if memory-source semantics change
- UI evidence contract for memory save success/error states

### Tests to turn green
- `e2e/423_zhc0_first_memory_capture_contract.spec.js`
- `e2e/426_zhc0_founders_loop_machine_projection.spec.js` (memory invariant assertions)

---

## M44.8 — Next quest reveal, resume, and full smoke

### Goal
Close the first playable loop and prove it resumes correctly.

### Measurable goals
1. next quest becomes visible only after first memory save
2. reload/resume preserves correct phase truth
3. full-loop smoke passes from entry to next-quest reveal
4. world unlock consistency stays exact

### Acceptance
- the user exits the loop knowing what comes next
- the loop survives refresh/resume without contradictory UI
- the full founders loop is now playable end to end

### Required artifact updates
- screen plan if next-quest semantics change
- machine/TLA if final completion semantics changed
- evidence contract with complete-phase screenshots

### Tests to turn green
- `e2e/424_zhc0_next_quest_reveal_contract.spec.js`
- `e2e/425_zhc0_founders_loop_resume_contract.spec.js`
- `e2e/428_zhc0_founders_loop_full_smoke.spec.js`

---

## 7. Evidence requirements per milestone

Every milestone must capture:

1. mobile screenshot
2. tablet screenshot
3. desktop screenshot
4. machine-state note if state semantics changed
5. test names turned green
6. explicit statement of what remains blocked until next milestone

This is required so future implementers can replay the work instead of guessing.

---

## 8. Definition of first playable

ZHC0 is first playable only when:

1. `e2e/415` through `e2e/428` required scope tests are green,
2. the artifact chain is aligned,
3. the founders loop is playable end to end in browser,
4. first memory capture is real,
5. next quest appears only after the real progression conditions are satisfied.

If those conditions are not met, ZHC0 is not done.

---

## 9. Recommendation

Implement in milestone order.
Do not skip ahead to later worker or market systems.

The point of this roadmap is not just to ship ZHC0.
It is to make the work reproducible for future humans and future agentic AI developers.
