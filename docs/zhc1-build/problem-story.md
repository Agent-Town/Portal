# Problem Story: Build the ZHC1 Iteration Feed Loop

**ID:** zhc1-build-001  
**Status:** active  
**Created:** 2026-03-18 02:18 ICT  
**Updated:** 2026-03-18 02:18 ICT

---

## Problem Description

Build the ZHC1 iteration feed loop as specified in `docs/zhc1-tdd-spec.md`.

The system must include: Problem Story Manager, Evaluation Engine, Experiment Engine, Card Store, Private Feed UI, Feedback Capture (text + audio), Save Game Manager, and Discovery Feed.

Full TDD spec: 33 tests across 9 phases. Full data model defined in spec section 4.
Interactive mockup: `docs/zhc1-mockup.html` (4 screens: Private Feed, Eval Setup, Discovery, Converged).

This is a **dogfooding exercise**: we are using the ZHC1 iteration feed pattern to build the ZHC1 iteration feed. Each sub-agent run is an "experiment card." Each heartbeat is a "review round." The progress file IS the feed.

---

## Constraints

1. Must be test-driven: each test in zhc1-tdd-spec.md must have a corresponding passing verification
2. Must follow the data models defined in spec section 4 (TypeScript interfaces as reference)
3. Must integrate with existing ZHC0 Portal infrastructure (Express server, existing routes, auth)
4. Mobile-friendly, modal-based UI (dark theme, match mockup)
5. Audio feedback support (mic button, speech-to-text)
6. Code changes must be grounded: every visual/UI change must have a corresponding code reference
7. No fabricated feedback or constraints — all extracted data must trace to actual sub-agent output
8. Experiment execution blocked until evaluation function is confirmed (T003)

---

## Preferences

1. Prefer simple in-memory storage first, add persistence later
2. Match the visual design in `zhc1-mockup.html` as closely as possible
3. Keep code clean and modular — each component in its own file
4. Each experiment should be small and reviewable
5. Prefer existing dependencies (Express, vanilla JS) over new libraries
6. Dark theme by default, mobile-first responsive

---

## Evaluation Function

| Metric | Type | Direction | Target | Weight |
|---|---|---|---|---|
| Tests Passing | quantitative | maximize | 33/33 | 0.4 |
| Code Grounding | quantitative | maximize | 100% changes have code refs | 0.2 |
| Integration | quantitative | maximize | All components reachable via API | 0.2 |
| Visual Fidelity | qualitative | maximize | Matches mockup | 0.2 |

### Baseline Scores
- Tests Passing: 0/33 → **0.00**
- Code Grounding: N/A → **0.00**
- Integration: No components → **0.00**
- Visual Fidelity: No UI → **0.00**
- **Composite baseline: 0.00**

### Convergence Threshold
Composite score ≥ 0.80 (meaning most tests pass, components integrate, UI matches spec)

---

## Program

- **Time budget:** 7 minutes per experiment (hard cap per sub-agent)
- **Max parallel experiments:** 3 per round
- **Working directory:** `/Users/robin/.openclaw/workspace/Portal-zhc0`
- **Include:** `server/`, `public/`, `docs/zhc1-build/`
- **Exclude:** `vendors/`, `node_modules/`, `e2e/` (existing tests), `machines/`, `design/`
- **Spec reference:** `docs/zhc1-tdd-spec.md`
- **Mockup reference:** `docs/zhc1-mockup.html`

---

## Feedback Rounds

*(Each round's feedback will be appended here as experiments complete)*

### Round 1 — Foundation Layer
**Started:** 2026-03-18 02:20 ICT
**Experiments:** R1-A (Data Layer), R1-B (Eval Engine), R1-C (Feed UI Shell)
**Feedback:** *(pending completion)*
