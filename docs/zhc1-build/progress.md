# ZHC1 Build Progress — The System Builds Itself

> This file IS the iteration feed. Each experiment card below is a sub-agent run.
> Each heartbeat reviews the cards, scores them, and plans the next round.
> The evaluation function is defined in `problem-story.md`.

---

## Score Trend

```
Baseline  0.00  ░░░░░░░░░░░░░░░░░░░
Round 1   0.51  ██████████░░░░░░░░░░  (+0.51)
Round 2   0.72  ███████████████░░░░░  (+0.21)
```

| Round | Composite | Tests | Grounding | Integration | Visual |
|---|---|---|---|---|---|
| Baseline | 0.00 | 0/32 | 0.00 | 0.00 | 0.00 |
| R1 | 0.51 | 10/32 | 1.00 | 0.73 | 0.62 |
| **R2** | **0.72** | **14/32** | **1.00** | **0.85** | **0.85** |

---

## Round 1 — Foundation Layer ✅
**Duration:** 5 min | **Score:** 0.51 | **Tests:** 10/32

- R1-A: Server Data Layer ✅ kept (0.52) — CRUD API, experiments block stub
- R1-B: Evaluation Engine ✅ kept (0.49) — metric proposals, NL parsing, confirmation
- R1-C: Feed UI Shell ✅ kept (0.53) — modal, cards, score trend, feedback bar

---

## Round 2 — Integration + Feedback ✅
**Started:** 2026-03-18 02:27 ICT  
**Completed:** 2026-03-18 02:32 ICT (5 min total)  
**Tests targeted:** T010 (improved), T011 (improved), T040, T041, T042, T043  
**Tests passed:** 4/6 targeted ✅ (T010/T011 improved but same test IDs)

---

### Card R2-A: API Integration Layer

| Field | Value |
|---|---|
| **Status** | ✅ kept |
| **Agent** | subagent-R2A |
| **Duration** | 2m 33s |
| **Score** | **0.72** |
| **What it tried** | Wire feed.js to real API, create experiment-cards store, one-click test seed |
| **Delta** | +0.20 |
| **Code** | `server/experiment-cards.js` (new), `public/feed.js` (modified), `server/index.js` (modified) |
| **Scoring:** | Tests 0.14 · Grounding 1.0 · Integration 0.9 · Visual 0.85 |

**Review:** Excellent integration work. Experiment cards store with auto-incrementing iterations and auto-computed deltas. Feed.js now fetches from API with graceful sample-data fallback. "Create Test Problem" button seeds the full lifecycle in one click.

**Remaining gaps:** No persistence (resets on restart), no DELETE/PUT on cards, feed doesn't auto-refresh.

---

### Card R2-B: Feedback Capture API

| Field | Value |
|---|---|
| **Status** | ✅ kept |
| **Agent** | subagent-R2B |
| **Duration** | 3m 41s |
| **Score** | **0.70** |
| **What it tried** | Text/audio/gesture feedback with sentiment detection and constraint extraction |
| **Delta** | +0.18 |
| **Code** | `server/feedback.js` (new), `server/experiment-cards.js` (modified — added getCardById, updateCardById), `server/index.js` (modified) |
| **Tests** | T040 ✅, T041 ✅, T042 ✅, T043 ✅ |

**Review:** Solid feedback pipeline. Sentiment detection works (positive/negative/confused/neutral). Constraint extraction catches directive patterns ("make", "remove", "add"). Card status correctly transitions based on feedback. Problem Story constraints grow with deduplication.

**Remaining gaps:** Constraint extraction is regex-only — misses indirect feedback ("The layout feels cramped"). No actual STT (accepts pre-transcribed text).

---

### Card R2-C: Eval Engine Improvements

| Field | Value |
|---|---|
| **Status** | ✅ kept |
| **Agent** | subagent-R2C |
| **Duration** | 2m 31s |
| **Score** | **0.75** |
| **What it tried** | Richer metric proposals (2-3 per problem), clean NL names, confidence scores, edge cases |
| **Delta** | +0.23 |
| **Code** | `server/evaluation.js` (modified) |
| **Tests** | All 10 improvement tests pass |

**Review:** Significant quality improvement. Proposal rules expanded from 12→19. Always returns ≥1 quantitative + ≥1 qualitative metric. NL name cleaning works well ("I want the page to load in under 2 seconds" → "Page Load"). Confidence scores on all metrics. Contradiction detection ("faster but bigger" → needsClarification).

---

## Round 2 Review Summary

**Project composite: 0.72** (up from 0.51, +0.21)  
**Tests passing: 14/32 (44%)**

**What converged:** The integration gap between R1 components is largely closed. Feed ↔ API ↔ Eval ↔ Feedback all connected. The eval engine is now genuinely useful (rich proposals, clean names, confidence).

**What's still missing:**
1. **Experiment execution engine** (T020-T024) — the agent actually modifying code and producing scored cards. This is the hardest and most important piece.
2. **Iteration loop wiring** (T050-T052) — feedback triggering next round, convergence detection.
3. **Save game** (T060-T062) — checkpoint/restore.
4. **Card detail view** (T033) — tap to expand.
5. **Publication + Discovery** (T070-T082) — later phases.

### Extracted constraints for Round 3
1. Experiment execution is the next critical path — without it, there's no actual iteration loop
2. The execution engine needs: take a Program + Problem Story → modify code → measure metrics → produce card
3. Iteration loop: after feedback on all cards in a round, trigger next experiment round
4. Save game: snapshot Problem Story + all cards + agent state

---

## Round 3 — Experiment Execution + Loop Wiring
**Started:** 2026-03-18 02:34 ICT  
**Target:** T020-T024 (experiment execution), T050-T052 (iteration loop), T033 (card detail)

### Card R3-A: Experiment Execution Engine
| Field | Value |
|---|---|
| **Status** | 🔄 running |
| **Agent** | subagent-R3A |
| **Started** | 2026-03-18 02:34 ICT |
| **What it tried** | Build the agent experiment runner: take Program → modify code → measure metrics → produce scored Experiment Card within 7-min budget |
| **Tests** | T020, T021, T022, T023, T024 |

### Card R3-B: Iteration Loop + Convergence
| Field | Value |
|---|---|
| **Status** | 🔄 running |
| **Agent** | subagent-R3B |
| **Started** | 2026-03-18 02:34 ICT |
| **What it tried** | Wire feedback → next round trigger. Detect convergence when scores plateau. Show score trends. |
| **Tests** | T050, T051, T052 |

### Card R3-C: Save Game + Card Detail View
| Field | Value |
|---|---|
| **Status** | 🔄 running |
| **Agent** | subagent-R3C |
| **Started** | 2026-03-18 02:34 ICT |
| **What it tried** | Save game checkpoint/restore. Card detail view (tap to expand). |
| **Tests** | T033, T060, T061 |

---

## Round 4+
*(Planned: T014 (mid-loop metric edit), T062 (fork), T070-T082 (publication + discovery))*

## Save Games
*(None yet)*
