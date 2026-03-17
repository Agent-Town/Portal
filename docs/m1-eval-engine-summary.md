# M1 Evaluation Engine — Implementation Summary

**Date:** 2026-03-18  
**Subagent:** R1B-eval-engine

## Files Created

### `server/problem-stories.js`
Minimal in-memory store for Problem Stories. CRUD operations on a `Map<string, ProblemStory>`.
- `createProblemStory({ problemDescription, id? })` — creates draft story
- `getProblemStory(id)` — lookup
- `updateProblemStory(id, patch)` — partial merge
- `listProblemStories()` / `deleteProblemStory(id)` / `_resetStore()`

### `server/evaluation.js`
Evaluation Function engine with Express Router and all logic.

**Heuristic metric proposal** (`generateMetricProposals`):
- 12 keyword-domain rules (performance, accessibility, visual, UX, tests, errors, code quality, responsive, SEO, conversion)
- Returns 1-3 matched metrics per problem description
- Fallback generic quality metric if nothing matches
- No LLM dependency — pure pattern matching

**Natural language parsing** (`parseNaturalLanguageMetric`):
- Extracts numbers from input text
- Recognizes units: s, ms, min, h, %, px, bytes, score
- Infers direction from minimize/maximize keyword lists
- Builds range from target value × direction
- Generates human-readable name by stripping filler phrases

**Routes mounted at `/api/problem-stories`:**
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/` | Create Problem Story |
| GET | `/:id` | Get Problem Story |
| GET | `/:id/eval-proposals` | Propose metrics from description |
| GET | `/:id/eval-proposals/metrics` | List accepted metrics |
| POST | `/:id/eval-proposals/metrics` | Add metric (rawInput or structured) |
| POST | `/:id/eval-confirm` | Confirm eval → transition to active |

## Files Modified

### `server/index.js`
Added 2 lines after the JSON error handler:
```js
const { router: evalRouter } = require('./evaluation');
app.use('/api/problem-stories', evalRouter);
```

## Test Results

**25/25 passed** on `localhost:5111`:

| Test | Description | Result |
|------|-------------|--------|
| Seed | Create Problem Story → 201, status=draft | ✅ |
| T010 | GET eval-proposals → ≥1 metric with name/type/direction/rationale | ✅ |
| T011 | POST rawInput "page load in under 2 seconds" → parsed metric (minimize, quantitative, unit, range) | ✅ |
| T012 | Status remains 'draft' until confirmation, no confirmedAt | ✅ |
| T013 | POST eval-confirm → status='active', confirmedAt set, baselineScores all 0.5 | ✅ |
| Edge | Double confirm → 400 | ✅ |
| Edge | Confirm without metrics → 400 | ✅ |
| Edge | Missing rawInput → 400 | ✅ |
| Edge | Nonexistent story → 404 | ✅ |

## What Works
- Full metric proposal lifecycle: propose → add → confirm
- Natural language parsing handles "under X seconds", "at least Y%", etc.
- All ZHC1-T010 through T013 requirements satisfied
- Edge cases properly guarded (double confirm, missing data, 404s)

## What Doesn't / Known Limitations
- **In-memory store only** — resets on server restart. No persistence yet.
- **Baseline scores are placeholder 0.5** — real baselines need experiment execution (M2+)
- **No 'latest' alias** — spec uses `/api/problem-stories/latest/...` but we use `:id` directly. Can add a convenience alias later.
- **No metric editing/removal** — ZHC1-T014 (modify metrics mid-loop) is P1, not implemented yet.
- **No composite scoring** — the `weight` field is stored but composite score calculation is deferred to the Card Scorer (later milestone).

## Issues Encountered
- Port 3999 was occupied (original dev server). Used port 5111 for testing instead.
- `node` not on default PATH; needed `~/.nvm/versions/node/v23.11.1/bin` prefix.
