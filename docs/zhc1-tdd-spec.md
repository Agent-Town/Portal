# ZHC1 TDD Specification — Iteration Feed Loop

Status: implementation-driving spec  
Last updated: 2026-03-18  
Branch: `zhc1-iteration-feed`  
Predecessor: `docs/zhc1-iteration-feed.md` (product direction)  
Predecessor: `docs/zhc-spec-stack.md` (methodology)

---

## 1. Document purpose

This is the test-driven development specification for the ZHC1 iteration feed loop.

Every feature is defined as a test with a measurable result. An agentic AI developer must be able to:
1. Read a test
2. Understand what to build
3. Implement it
4. Verify the result is correct
5. Move to the next test

These documents represent the whole thought process of the software. They are not disposable scaffolding. They are the permanent reasoning layer that survives implementation.

---

## 2. Test methodology for agentic AI

### 2.1 Why TDD for agents

Traditional TDD assumes a human writes code. Here, an agentic AI developer reads this spec, builds artifacts, and verifies them. The tests must be:

- **Self-contained**: enough context to act without asking
- **Measurable**: a binary pass/fail criterion exists
- **Verifiable**: a script, screenshot, or API check can confirm the result
- **Ordered**: dependencies between tests are explicit

### 2.2 Test anatomy

Every test in this spec follows this structure:

```
### ZHC1-Txxx: [Title]

Phase: [phase name]
Priority: P0 | P1 | P2
Dependencies: [test IDs this depends on]

Given:
  [initial state — what the system looks like before]

When:
  [the action — what the agent does]

Then:
  [measurable outcome — what must be true after]

Verification:
  [how to check — specific script, query, screenshot, or assertion]

Notes:
  [implementation guidance, edge cases, design rationale]
```

### 2.3 Test scope levels

- **Unit**: a single function, component, or data model
- **Integration**: two or more components working together
- **Scenario**: a user-facing flow across multiple components
- **Smoke**: a full end-to-end check that the system is alive

### 2.4 Verification patterns

| Pattern | When to use | Example |
|---|---|---|
| **DOM assertion** | UI renders correctly | `querySelector('#feed')` returns non-null |
| **API response** | Backend returns expected shape | `GET /api/cards` returns array with `visual_url` field |
| **State assertion** | Internal state is correct | Problem Story has `evaluation_metrics` array with length > 0 |
| **Screenshot comparison** | Visual output is correct | Feed card renders with expected layout |
| **Audio transcription** | Voice feedback is captured | Transcribed text matches spoken words within confidence threshold |
| **Metric check** | Evaluation scores are valid | Card has `score` field, 0 ≤ score ≤ 1 |
| **Log assertion** | Agent behavior is traceable | Agent logs contain "experiment_started" with correct `card_id` |

---

## 3. System architecture

### 3.1 Component map

```
┌─────────────────────────────────────────────────┐
│                   Portal Shell                    │
│  ┌─────────────┐  ┌──────────────┐              │
│  │   Auth       │  │   Onboarding  │              │
│  │  (ZHC0)      │  │  (ZHC0)       │              │
│  └─────────────┘  └──────────────┘              │
│                                                   │
│  ┌─────────────────────────────────────────┐     │
│  │         Iteration Feed Engine            │     │
│  │                                          │     │
│  │  ┌──────────┐  ┌───────────────────┐    │     │
│  │  │ Problem   │  │ Experiment Engine  │    │     │
│  │  │ Story     │◄─┤ (agent execution)  │    │     │
│  │  │ Manager   │  └───────┬───────────┘    │     │
│  │  └──────────┘          │                 │     │
│  │                   ┌────▼────┐            │     │
│  │                   │ Card    │            │     │
│  │                   │ Store   │            │     │
│  │                   └────┬────┘            │     │
│  │  ┌──────────┐          │                 │     │
│  │  │ Eval     │◄─────────┘                 │     │
│  │  │ Engine   │                            │     │
│  │  └──────────┘                            │     │
│  │                                          │     │
│  │  ┌──────────┐  ┌───────────────────┐    │     │
│  │  │ Private  │  │ Discovery         │    │     │
│  │  │ Feed     │  │ Feed              │    │     │
│  │  └──────────┘  └───────────────────┘    │     │
│  │                                          │     │
│  │  ┌──────────┐  ┌───────────────────┐    │     │
│  │  │ Feedback │  │ Save Game         │    │     │
│  │  │ Capture  │  │ Manager           │    │     │
│  │  └──────────┘  └───────────────────┘    │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  ┌─────────────────────────────────────────┐     │
│  │         OpenClaw Agent Runtime           │     │
│  └─────────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

### 3.2 Data flow

```
User explains problem
       │
       ▼
┌──────────────┐
│ Problem Story │ ◄─── enriched by feedback every round
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌───────────────┐
│   Program     │──────│ Eval Function  │  ← user MUST define this
│  (config)     │      │ (scoring)      │
└──────┬───────┘      └───────┬───────┘
       │                       │
       ▼                       │
┌──────────────┐               │
│ Experiment    │               │
│ Engine        │               │
└──────┬───────┘               │
       │                       │
       ▼                       ▼
┌──────────────┐      ┌───────────────┐
│ Experiment    │──────│ Card Scorer   │
│ Card (visual) │      │               │
└──────┬───────┘      └───────────────┘
       │
       ▼
┌──────────────┐
│ Private Feed  │ ──► User swipes, gives feedback
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Feedback      │────► Problem Story enriched ──► next round
│ Extractor     │
└──────────────┘
```

---

## 4. Data models

### 4.1 Problem Story

```typescript
interface ProblemStory {
  id: string;
  createdAt: string;          // ISO 8601
  updatedAt: string;

  // Core content
  problemDescription: string;  // Human's original problem statement
  constraints: string[];       // Extracted constraints from feedback rounds
  preferences: string[];       // User preferences discovered through feedback
  context: string[];           // Additional context pulled from Discovery Feed

  // Evaluation — THE critical component
  evaluationFunction: {
    target: string;            // What we're optimizing for
    metrics: EvaluationMetric[];
    baselineScores: Record<string, number>;
    convergenceThreshold?: number;
    confirmedAt?: string;       // Set when user confirms evaluation
  };

  // History
  feedbackRounds: FeedbackRound[];
  totalIterations: number;

  // State
  status: 'draft' | 'active' | 'converged' | 'saved' | 'published';
}
```

### 4.2 Evaluation Metric

```typescript
interface EvaluationMetric {
  id: string;
  name: string;
  type: 'quantitative' | 'qualitative';

  // For quantitative metrics
  unit?: string;               // e.g., "ms", "%", "score"
  direction: 'minimize' | 'maximize';
  range?: { min: number; max: number };

  // For qualitative metrics
  assessmentPrompt?: string;   // How the agent should assess this

  // Weight in composite score
  weight?: number;             // 0-1, defaults to equal weighting
}
```

### 4.3 Experiment Card

```typescript
interface ExperimentCard {
  id: string;
  problemStoryId: string;
  iterationNumber: number;
  roundNumber: number;         // Which batch this belongs to
  createdAt: string;
  durationMs: number;          // Must be ≤ 7 minutes (420,000ms)

  // The visual representation
  visual: {
    type: 'screenshot' | 'preview' | 'slide' | 'chart' | 'diff';
    url: string;
    thumbnailUrl: string;
    alt: string;               // Accessibility text
    codeTrace: string;         // What code produced this visual
  };

  // Code grounding
  codeReference: {
    filePath: string;
    diffSummary: string;       // What changed and why (max 200 chars)
    commitHash?: string;
  };

  // Agent explanation
  agentSummary: string;        // Max 280 chars
  deltaFromLast: string;       // Max 200 chars

  // Evaluation scores
  scores: Record<string, number>;  // metric_id → score
  compositeScore: number;      // Weighted average, 0-1
  deltaScore: number;          // Change from previous card

  // Status
  status: 'pending_review' | 'kept' | 'discarded' | 'refined';

  // Feedback received
  feedback?: CardFeedback;
}
```

### 4.4 Card Feedback

```typescript
interface CardFeedback {
  cardId: string;
  timestamp: string;

  modality: 'audio' | 'text' | 'gesture';

  audioUrl?: string;
  transcription?: string;      // Speech-to-text result
  textContent?: string;
  gesture?: 'swipe_keep' | 'swipe_discard';

  // What the agent distilled from user input
  extractedConstraints?: string[];
  extractedPreferences?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral' | 'confused';

  reviewDurationMs: number;
}
```

### 4.5 Program

```typescript
interface Program {
  id: string;
  problemStoryId: string;
  createdAt: string;
  updatedAt: string;

  problemStatement: string;

  scope: {
    include: string[];
    exclude: string[];
  };

  timeBudgetMs: number;        // Default: 420000 (7 minutes)
  maxParallelExperiments: number;  // Default: 3

  evaluationFunctionId: string;
}
```

### 4.6 Save Game

```typescript
interface SaveGame {
  id: string;
  problemStoryId: string;
  createdAt: string;
  label: string;

  // Snapshot
  problemStory: ProblemStory;
  program: Program;
  experimentCards: ExperimentCard[];
  agentState: object;          // Serializable, loadable

  // Metadata
  totalIterationsAtSave: number;
  bestCompositeScore: number;
}
```

### 4.7 Published Stream (Discovery Feed)

```typescript
interface PublishedStream {
  id: string;
  problemStoryId: string;
  publishedAt: string;

  problemDescription: string;
  problemDomain: string[];
  codeFingerprint: string;     // Semantic hash for similarity matching

  // Quality signals
  totalIterations: number;
  convergenceSpeed: number;
  bestCompositeScore: number;
  userSatisfaction?: number;

  // The full journey
  cards: ExperimentCard[];
  feedbackRounds: FeedbackRound[];

  // Discovery
  discoveryKeywords: string[];
  similarProblemIds?: string[];
}
```

---

## 5. State machine

### 5.1 Problem lifecycle

```
                    ┌──────────────┐
                    │    DRAFT      │  User is explaining problem
                    └──────┬───────┘
                           │ user submits problem description
                           ▼
                    ┌──────────────┐
                    │ EVAL_SETUP   │  Defining evaluation function
                    └──────┬───────┘
                           │ evaluation function confirmed
                           ▼
                    ┌──────────────┐
                    │   ACTIVE     │  Agent is running experiments
                    └──┬───────┬───┘
                       │       │
          agent runs   │       │  user declares done
          experiment   │       │
                       │       ▼
                       │  ┌──────────────┐
                       │  │ CONVERGED    │  Solution found
                       │  └──┬───────┬───┘
                       │     │       │
                       │     │       │  user publishes
                       │     │       ▼
                       │     │  ┌──────────────┐
                       │     │  │ PUBLISHED    │  Visible in Discovery Feed
                       │     │  └──────────────┘
                       │     │
                       │     │  user saves checkpoint
                       │     ▼
                       │  ┌──────────────┐
                       │  │   SAVED      │  Checkpoint for later
                       │  └──┬──────────┘
                       │     │  user resumes
                       └─────┘
```

### 5.2 Card lifecycle

```
┌──────────────┐
│   CREATED    │  Agent produced a card
└──────┬───────┘
       │ user swipes/gives feedback
       ▼
┌──────────────┐     ┌──────────────┐
│    KEPT      │     │  DISCARDED   │
│  (direction  │     │  (wrong      │
│   approved)  │     │   direction) │
└──────┬───────┘     └──────────────┘
       │
       │ agent refines based on feedback
       ▼
┌──────────────┐
│   REFINED    │  Next iteration incorporates feedback
└──────────────┘
```

### 5.3 Critical invariants

1. `card.durationMs` MUST be ≤ `program.timeBudgetMs` (default 420,000)
2. `card.compositeScore` MUST be 0 ≤ x ≤ 1
3. `problemStory.status = 'active'` implies `evaluationFunction.metrics.length > 0`
4. `publishedStream.cards` MUST only contain cards with status 'kept' or 'refined'
5. Discovery Feed visibility REQUIRES `problemStory.status = 'published'`
6. `saveGame.agentState` MUST be serializable and loadable
7. Every `ExperimentCard` MUST have a `codeReference` — no ungrounded visuals
8. `feedbackRound.extractedConstraints` MUST be derived from user input, not fabricated

---

## 6. Evaluation function design

> **This is the most important design problem in ZHC1.**
>
> With a bad evaluation strategy, the experiments will be garbage.
> The system MUST push the user to define their optimization function before any experiment runs.

### 6.1 The evaluation problem

The agent needs to know what "better" means. Without a clear evaluation function:
- The agent optimizes for the wrong thing
- Experiment cards show no meaningful delta
- The user sees random variations instead of convergence
- The feed becomes noise, not signal

### 6.2 Evaluation function lifecycle

```
Phase 1: Elicit
  Agent asks: "What are you trying to improve?"
  User describes in natural language
  Agent extracts potential metrics

Phase 2: Propose
  Agent proposes concrete, measurable metrics
  Agent shows examples of what "score 0.0" and "score 1.0" look like
  User confirms or adjusts

Phase 3: Baseline
  Agent measures current state against proposed metrics
  Baseline scores are recorded and shown to user
  User confirms baseline is accurate

Phase 4: Execute
  Each experiment is scored against all metrics
  Composite score is calculated (weighted average)
  Scores appear on experiment cards

Phase 5: Detect convergence
  Agent tracks score trends across iterations
  When improvement rate drops below threshold, signal convergence
  User confirms or continues iterating
```

### 6.3 Metric types

**Quantitative (auto-scored by agent):**
- Performance: response time, throughput, latency
- Quality: test coverage, lint score, error rate
- Engagement: click-through rate, conversion, time on page
- Accuracy: precision, recall, F1, loss function value

**Qualitative (agent-assessed):**
- Visual quality: "Does this look professional?"
- UX coherence: "Does this flow make sense?"
- Content quality: "Is this well-written?"
- Design alignment: "Does this match the stated style?"

For qualitative metrics, the agent uses an assessment prompt to score 0-1.

### 6.4 Composite scoring

```
compositeScore = Σ(metric.score × metric.weight) / Σ(metric.weight)
```

All metrics normalized to 0-1 before composition.
Default weight = 1.0 for all metrics if not specified.
Direction (minimize/maximize) determines normalization.

### 6.5 Failure modes and mitigations

| Failure mode | Description | Mitigation |
|---|---|---|
| No metrics defined | User skips evaluation setup | System BLOCKS experiment execution until ≥1 metric confirmed |
| Wrong metric | Optimizing for the wrong thing | Agent proposes alternatives; user can change metrics mid-loop |
| Metric gaming | Agent optimizes for score, not quality | Multiple metrics reduce gaming; qualitative metrics as guardrails |
| Impossible metric | Metric can never be satisfied | Agent flags if no improvement after N rounds |
| Metric drift | What matters changes over time | Metrics are editable; old scores preserved in legacyScores |
| Subjective quality | "I know it when I see it" | Combine quantitative + qualitative; swipe patterns feed into scoring |

---

## 7. Test suite

### 7.1 Phase 0: Problem Definition

---

#### ZHC1-T001: User can create a new Problem Story

**Phase:** Problem Definition  
**Priority:** P0  
**Dependencies:** None

**Given:**
The user is authenticated and past the ZHC0 onboarding flow. The House/HQ view is visible.

**When:**
The user taps "New Problem" (or equivalent CTA in the feed shell).

**Then:**
- A new Problem Story is created with `status: 'draft'`
- A Problem Story editor/modal opens
- The editor contains a text area for `problemDescription`
- The editor shows a placeholder: "Describe what you want to improve or solve"

**Verification:**
```javascript
const story = await api.get('/api/problem-stories/latest');
assert(story.status === 'draft');
assert(typeof story.problemDescription === 'string');
assert(story.evaluationFunction === null);

assert(document.querySelector('[data-testid="problem-editor"]') !== null);
assert(document.querySelector('[data-testid="problem-description-input"]') !== null);
```

---

#### ZHC1-T002: Problem Story persists across sessions

**Phase:** Problem Definition  
**Priority:** P0  
**Dependencies:** T001

**Given:**
A Problem Story exists with `status: 'draft'` and `problemDescription` set.

**When:**
The user closes the browser and reopens the app after more than 1 hour.

**Then:**
- The Problem Story is loaded with all fields intact
- The user is returned to the Problem Story editor
- `updatedAt` reflects the original save time, not the reload time

**Verification:**
```javascript
const before = await api.get('/api/problem-stories/latest');
// simulate session break
const after = await api.get('/api/problem-stories/latest');
assert(before.id === after.id);
assert(before.problemDescription === after.problemDescription);
```

---

#### ZHC1-T003: System blocks experiment execution without evaluation function

**Phase:** Problem Definition  
**Priority:** P0  
**Dependencies:** T001

**Given:**
A Problem Story exists with `status: 'draft'` and `evaluationFunction.metrics` is empty or null.

**When:**
The user attempts to trigger an experiment run.

**Then:**
- The system does NOT start an experiment
- A clear message is shown: "Define how to measure success before running experiments"
- The user is directed to the evaluation setup step
- No experiment cards are created

**Verification:**
```javascript
const story = await api.get('/api/problem-stories/latest');
assert(story.evaluationFunction.metrics.length === 0);

const result = await api.post('/api/experiments/start', { problemStoryId: story.id });
assert(result.status === 400);
assert(result.error.includes('evaluation'));

assert(document.querySelector('[data-testid="eval-required-notice"]') !== null);
```

---

### 7.2 Phase 1: Evaluation Function Setup

---

#### ZHC1-T010: Agent elicits evaluation metrics from problem description

**Phase:** Evaluation Setup  
**Priority:** P0  
**Dependencies:** T001

**Given:**
A Problem Story exists with a `problemDescription` of at least 20 characters.

**When:**
The user advances from the problem description step to evaluation setup.

**Then:**
- The agent analyzes the problem description
- The agent proposes at least 1 concrete, measurable metric
- Each proposed metric shows: name, type (quantitative/qualitative), direction (minimize/maximize)
- The agent explains WHY each metric fits this problem
- The user can accept, reject, or modify each proposed metric

**Verification:**
```javascript
const proposals = await api.get('/api/problem-stories/latest/eval-proposals');
assert(proposals.metrics.length >= 1);
proposals.metrics.forEach(m => {
  assert(typeof m.name === 'string');
  assert(['quantitative', 'qualitative'].includes(m.type));
  assert(['minimize', 'maximize'].includes(m.direction));
  assert(typeof m.rationale === 'string');
});
```

---

#### ZHC1-T011: User can define a custom metric via natural language

**Phase:** Evaluation Setup  
**Priority:** P0  
**Dependencies:** T010

**Given:**
The evaluation setup step is active. Agent has proposed initial metrics.

**When:**
The user adds a metric via natural language: "I want the page to load in under 2 seconds."

**Then:**
- The agent parses the input into a structured metric
- The metric has: name, type, direction, unit, and target range
- The metric is shown in the metric list with editable fields
- The user can confirm or adjust the parsed metric before saving

**Verification:**
```javascript
await api.post('/api/problem-stories/latest/eval-proposals/metrics', {
  rawInput: 'I want the page to load in under 2 seconds'
});

const metrics = await api.get('/api/problem-stories/latest/eval-proposals/metrics');
const loadTime = metrics.find(m => m.name.toLowerCase().includes('load'));
assert(loadTime !== undefined);
assert(loadTime.direction === 'minimize');
assert(loadTime.type === 'quantitative');
```

---

#### ZHC1-T012: Evaluation function requires explicit user confirmation

**Phase:** Evaluation Setup  
**Priority:** P0  
**Dependencies:** T010, T011

**Given:**
At least 1 metric is proposed or defined.

**When:**
The user has not yet explicitly confirmed the evaluation function.

**Then:**
- Problem Story status remains 'draft'
- A "Confirm Evaluation" CTA is visible
- The system summarizes: "You will optimize for: [metric list]"
- Experiment execution remains blocked

**Verification:**
```javascript
const story = await api.get('/api/problem-stories/latest');
assert(story.status === 'draft');
assert(story.evaluationFunction.metrics.length >= 1);
assert(story.evaluationFunction.confirmedAt === null);

const result = await api.post('/api/experiments/start', { problemStoryId: story.id });
assert(result.status === 400);
```

---

#### ZHC1-T013: Evaluation confirmation transitions problem to active and captures baseline

**Phase:** Evaluation Setup  
**Priority:** P0  
**Dependencies:** T012

**Given:**
At least 1 metric is defined and the user sees the evaluation summary.

**When:**
The user confirms the evaluation function.

**Then:**
- Problem Story status changes to 'active'
- `evaluationFunction.confirmedAt` is set to current timestamp
- The agent captures baseline measurements for every metric
- Baseline scores are shown to the user
- The first experiment round is queued

**Verification:**
```javascript
await api.post('/api/problem-stories/latest/eval-confirm');

const story = await api.get('/api/problem-stories/latest');
assert(story.status === 'active');
assert(story.evaluationFunction.confirmedAt !== null);
assert(Object.keys(story.evaluationFunction.baselineScores).length > 0);
```

---

#### ZHC1-T014: User can modify metrics mid-loop

**Phase:** Evaluation Setup  
**Priority:** P1  
**Dependencies:** T013

**Given:**
Problem Story is 'active'. At least 1 experiment has run.

**When:**
The user modifies the evaluation function (adds, removes, or changes a metric).

**Then:**
- The modification is saved
- All existing cards are rescored with the updated function
- Old scores are preserved in a `legacyScores` field
- The feed reflects updated scores

**Verification:**
```javascript
await api.put('/api/problem-stories/latest/evaluation', {
  addMetric: { id: 'new-m', name: 'Speed', type: 'quantitative', direction: 'minimize' }
});

const cards = await api.get('/api/experiment-cards', { problemStoryId: story.id });
cards.forEach(c => {
  assert(c.scores.hasOwnProperty('new-m'));
  if (c.iterationNumber < currentIteration) {
    assert(c.legacyScores !== undefined);
  }
});
```

---

### 7.3 Phase 2: Experiment Execution

---

#### ZHC1-T020: Agent runs experiment within time budget

**Phase:** Experiment Execution  
**Priority:** P0  
**Dependencies:** T013

**Given:**
Problem Story is 'active' with confirmed evaluation function. Program has `timeBudgetMs: 420000`.

**When:**
The agent starts an experiment.

**Then:**
- An Experiment Card is created with `status: 'pending_review'`
- The experiment completes within the time budget
- `card.durationMs` ≤ 420,000
- The card has a visual representation (non-null `visual.url`)
- The card has a code reference (non-null `codeReference`)
- The card has scores for every defined metric
- The card has a `compositeScore` between 0 and 1

**Verification:**
```javascript
const card = await api.get('/api/experiment-cards/latest', { problemStoryId: story.id });
assert(card.status === 'pending_review');
assert(card.durationMs <= 420000);
assert(card.visual !== null && card.visual.url !== '');
assert(card.codeReference !== null && card.codeReference.filePath !== '');
Object.keys(story.evaluationFunction.metrics).forEach(mid => {
  assert(card.scores.hasOwnProperty(mid));
});
assert(card.compositeScore >= 0 && card.compositeScore <= 1);
```

---

#### ZHC1-T021: Experiment card shows delta from previous iteration

**Phase:** Experiment Execution  
**Priority:** P0  
**Dependencies:** T020

**Given:**
At least 1 experiment card exists (iteration N).

**When:**
The agent produces a new card (iteration N+1).

**Then:**
- `card.deltaScore` = current compositeScore − previous compositeScore
- `card.deltaFromLast` is a human-readable explanation (≤200 chars)
- Both positive and negative deltas are tracked

**Verification:**
```javascript
const cards = await api.get('/api/experiment-cards', {
  problemStoryId: story.id, sort: 'iterationNumber', limit: 2
});
assert(cards[1].deltaScore === cards[1].compositeScore - cards[0].compositeScore);
assert(typeof cards[1].deltaFromLast === 'string');
assert(cards[1].deltaFromLast.length > 0 && cards[1].deltaFromLast.length <= 200);
```

---

#### ZHC1-T022: Agent produces multiple proposals per round

**Phase:** Experiment Execution  
**Priority:** P1  
**Dependencies:** T013

**Given:**
Problem Story is 'active'. Program has `maxParallelExperiments: 3`.

**When:**
The agent starts an experiment round.

**Then:**
- Up to 3 cards are produced in a single round
- Each card represents a different approach
- Each card is scored independently
- All cards appear in the Private Feed together

**Verification:**
```javascript
const cards = await api.get('/api/experiment-cards', {
  problemStoryId: story.id, round: currentRound
});
assert(cards.length >= 1 && cards.length <= 3);
const rounds = new Set(cards.map(c => c.roundNumber));
assert(rounds.size === 1);
```

---

#### ZHC1-T023: Every experiment card visual is grounded in code

**Phase:** Experiment Execution  
**Priority:** P0  
**Dependencies:** T020

**Given:**
An experiment card exists.

**When:**
The card is inspected.

**Then:**
- `codeReference.filePath` points to a real file
- `codeReference.diffSummary` describes what was changed
- `visual.codeTrace` explains what code produced the visual
- No card exists with a visual but no code reference

**Verification:**
```javascript
const cards = await api.get('/api/experiment-cards', { problemStoryId: story.id });
cards.forEach(card => {
  assert(card.codeReference.filePath !== '');
  assert(card.codeReference.diffSummary !== '');
  assert(card.visual.codeTrace !== undefined);
  // File exists check (for local projects)
  assert(fileExists(card.codeReference.filePath));
});
```

---

#### ZHC1-T024: Agent uses Problem Story constraints in experiments

**Phase:** Experiment Execution  
**Priority:** P1  
**Dependencies:** T010, T020

**Given:**
Problem Story has accumulated feedback rounds with extracted constraints.

**When:**
The agent produces a new experiment.

**Then:**
- The agent's experiment plan references constraints from the Problem Story
- The experiment does not violate any constraints in `problemStory.constraints`
- Agent logs include which constraints were applied

**Verification:**
```javascript
const experiment = await api.get('/api/experiments/latest', { problemStoryId: story.id });
const story = await api.get('/api/problem-stories/latest');
experiment.appliedConstraints.forEach(c => {
  assert(story.constraints.includes(c));
});
```

---

### 7.4 Phase 3: Private Feed

---

#### ZHC1-T030: Private Feed displays cards in chronological order

**Phase:** Private Feed  
**Priority:** P0  
**Dependencies:** T020

**Given:**
Multiple experiment cards exist for the current Problem Story.

**When:**
The user opens the Private Feed.

**Then:**
- Cards are displayed in chronological order (newest first by default)
- Each card shows: visual thumbnail, agent summary, composite score, delta
- The feed is swipeable (vertical scroll)
- No card is displayed twice

**Verification:**
```javascript
const feed = document.querySelector('[data-testid="private-feed"]');
assert(feed !== null);

const cards = feed.querySelectorAll('[data-testid="experiment-card"]');
assert(cards.length > 0);

const iterations = Array.from(cards).map(c => parseInt(c.getAttribute('data-iteration')));
for (let i = 1; i < iterations.length; i++) {
  assert(iterations[i] <= iterations[i - 1]); // descending
}
```

---

#### ZHC1-T031: Card displays all required information at a glance

**Phase:** Private Feed  
**Priority:** P0  
**Dependencies:** T030

**Given:**
A card is visible in the feed.

**When:**
The card is rendered.

**Then:**
The card displays:
- Visual representation (image/slide/chart)
- Agent summary (max 280 chars)
- Composite score (visible number)
- Delta indicator (up/down + number)
- Iteration number
- Time elapsed

**Verification:**
```javascript
const card = document.querySelector('[data-testid="experiment-card"]');
assert(card.querySelector('[data-testid="card-visual"]') !== null);
assert(card.querySelector('[data-testid="card-summary"]') !== null);
assert(card.querySelector('[data-testid="card-score"]') !== null);
assert(card.querySelector('[data-testid="card-delta"]') !== null);
assert(card.querySelector('[data-testid="card-iteration"]') !== null);
```

---

#### ZHC1-T032: User can swipe between cards

**Phase:** Private Feed  
**Priority:** P0  
**Dependencies:** T030

**Given:**
Multiple cards are in the feed.

**When:**
The user swipes up/down (mobile) or scrolls (desktop).

**Then:**
- Next/previous card animates into view smoothly (≥55fps)
- No card content is clipped during transition
- Feed position is persisted across app close/reopen

**Verification:**
```javascript
const perf = await measureSwipePerformance();
assert(perf.averageFps >= 55);

const posBefore = getFeedPosition();
await simulateCloseAndReopen();
const posAfter = getFeedPosition();
assert(posBefore === posAfter);
```

---

#### ZHC1-T033: Tapping a card opens detail view

**Phase:** Private Feed  
**Priority:** P1  
**Dependencies:** T031

**Given:**
A card is visible in the feed.

**When:**
The user taps the card.

**Then:**
- Full visual representation is shown (not just thumbnail)
- Agent's full explanation is shown
- Code diff summary is shown
- All individual metric scores are shown
- Feedback history for this card is shown (if any)

**Verification:**
```javascript
await tap('[data-testid="experiment-card"]');
const detail = document.querySelector('[data-testid="card-detail"]');
assert(detail !== null);
assert(detail.querySelector('[data-testid="full-visual"]') !== null);
assert(detail.querySelector('[data-testid="metric-scores"]') !== null);
assert(detail.querySelector('[data-testid="code-diff"]') !== null);
```

---

### 7.5 Phase 4: Feedback Capture

---

#### ZHC1-T040: User can give text feedback on a card

**Phase:** Feedback Capture  
**Priority:** P0  
**Dependencies:** T031

**Given:**
A card with `status: 'pending_review'` is visible.

**When:**
The user types feedback and submits.

**Then:**
- A `CardFeedback` is created with `modality: 'text'`
- `textContent` stores the user's input
- The agent extracts constraints and preferences from the text
- `problemStory.constraints` and `problemStory.preferences` are updated
- `problemStory.feedbackRounds` is updated
- The card status changes to 'kept' or 'discarded' based on feedback sentiment

**Verification:**
```javascript
await type('[data-testid="feedback-input"]', 'Make the header darker');
await tap('[data-testid="feedback-submit"]');

const card = await api.get('/api/experiment-cards/latest');
assert(card.feedback !== null);
assert(card.feedback.modality === 'text');
assert(card.feedback.textContent === 'Make the header darker');
assert(card.feedback.extractedConstraints.length > 0);

const story = await api.get('/api/problem-stories/latest');
assert(story.feedbackRounds.length > 0);
assert(card.status === 'kept' || card.status === 'discarded');
```

---

#### ZHC1-T041: User can give audio feedback on a card

**Phase:** Feedback Capture  
**Priority:** P0  
**Dependencies:** T031

**Given:**
A card with `status: 'pending_review'` is visible.
The device has microphone access.

**When:**
The user presses and holds a microphone button, speaks, and releases.

**Then:**
- Audio is recorded and stored (`feedback.audioUrl` is set)
- Audio is transcribed via speech-to-text (`feedback.transcription` is set)
- Transcription accuracy ≥ 85% (measured against expected text)
- Agent extracts constraints and preferences from transcription
- The rest of the feedback flow proceeds identically to text feedback

**Verification:**
```javascript
await pressAndHold('[data-testid="mic-button"]');
await simulateSpeech('The layout is too cramped');
await release('[data-testid="mic-button"]');

const card = await api.get('/api/experiment-cards/latest');
assert(card.feedback.modality === 'audio');
assert(card.feedback.audioUrl !== '');
assert(card.feedback.transcription !== '');
assert(card.feedback.transcription.toLowerCase().includes('layout'));
assert(card.feedback.transcription.toLowerCase().includes('cramped'));
```

---

#### ZHC1-T042: Swipe gesture counts as implicit feedback

**Phase:** Feedback Capture  
**Priority:** P1  
**Dependencies:** T032

**Given:**
A card is visible in the feed.

**When:**
The user swipes left (discard) or right (keep) without tapping for detail.

**Then:**
- `feedback.modality` is 'gesture'
- `feedback.gesture` is 'swipe_keep' or 'swipe_discard'
- Card status changes accordingly
- The gesture is logged but no extracted constraints are generated (gesture alone is not enough context)
- The agent uses the gesture signal alongside other feedback for next-round planning

**Verification:**
```javascript
await swipeLeft('[data-testid="experiment-card"]'); // discard
const card = await api.get('/api/experiment-cards/latest');
assert(card.feedback.gesture === 'swipe_discard');
assert(card.status === 'discarded');
```

---

#### ZHC1-T043: Feedback enriches the Problem Story automatically

**Phase:** Feedback Capture  
**Priority:** P0  
**Dependencies:** T040

**Given:**
The user has given feedback on multiple cards across several rounds.

**When:**
The Problem Story is inspected.

**Then:**
- `problemStory.constraints` has grown with each round's extracted constraints
- `problemStory.preferences` has accumulated user preferences
- No duplicate constraints exist (agent deduplicates)
- The Problem Story can be reviewed by the user at any time
- The user can edit or remove any constraint/preference

**Verification:**
```javascript
const story = await api.get('/api/problem-stories/latest');
assert(story.constraints.length > 0);
assert(story.preferences.length > 0);
// No duplicates
assert(new Set(story.constraints).size === story.constraints.length);
```

---

### 7.6 Phase 5: Iteration Loop

---

#### ZHC1-T050: Agent triggers next round after feedback

**Phase:** Iteration Loop  
**Priority:** P0  
**Dependencies:** T040, T020

**Given:**
The user has reviewed all cards in the current round and given feedback on at least one.

**When:**
The user returns to the feed (or the agent auto-proceeds after a brief delay).

**Then:**
- A new experiment round is queued
- The agent incorporates all feedback from the previous round
- New cards are produced that address the feedback
- The new cards appear at the top of the feed
- `problemStory.totalIterations` is incremented

**Verification:**
```javascript
const storyBefore = await api.get('/api/problem-stories/latest');
const iterBefore = storyBefore.totalIterations;

// give feedback, wait for next round
await giveFeedback('Make it faster');
await waitForNewCards();

const storyAfter = await api.get('/api/problem-stories/latest');
assert(storyAfter.totalIterations > iterBefore);

const newCards = await api.get('/api/experiment-cards', {
  problemStoryId: story.id,
  sinceIteration: iterBefore
});
assert(newCards.length > 0);
```

---

#### ZHC1-T051: Convergence is detected when improvement plateaus

**Phase:** Iteration Loop  
**Priority:** P1  
**Dependencies:** T050

**Given:**
Multiple rounds have completed. Composite scores have stopped improving significantly.

**When:**
The improvement rate drops below the convergence threshold for 3 consecutive rounds.

**Then:**
- The agent signals convergence to the user
- A message appears: "Your solution is converging. Ready to finish, or keep iterating?"
- The user can choose to declare done or continue
- `problemStory.status` does NOT automatically change (user decides)

**Verification:**
```javascript
const story = await api.get('/api/problem-stories/latest');
assert(story.convergenceDetected === true);

assert(document.querySelector('[data-testid="convergence-notice"]') !== null);
```

---

#### ZHC1-T052: Scores trend is visible to the user

**Phase:** Iteration Loop  
**Priority:** P1  
**Dependencies:** T030

**Given:**
Multiple experiment rounds have completed.

**When:**
The user views the feed.

**Then:**
- A score trend indicator is visible (sparkline or mini chart)
- The trend shows composite score progression across iterations
- Individual metric trends are viewable in card detail
- Baseline is marked on the trend

**Verification:**
```javascript
assert(document.querySelector('[data-testid="score-trend"]') !== null);
const trendData = await api.get('/api/problem-stories/latest/score-trend');
assert(trendData.points.length > 0);
assert(trendData.baseline !== undefined);
```

---

### 7.7 Phase 6: Save Game

---

#### ZHC1-T060: User can create a save game at any point

**Phase:** Save Game  
**Priority:** P0  
**Dependencies:** T030

**Given:**
Problem Story is 'active' and at least 1 experiment has run.

**When:**
The user taps "Save Progress" (or equivalent).

**Then:**
- A Save Game is created with a snapshot of: Problem Story, Program, all Experiment Cards, Agent State
- `saveGame.agentState` is serializable
- `saveGame.bestCompositeScore` reflects the best score achieved so far
- The save game is listed in the user's saves
- The user can optionally name the save game

**Verification:**
```javascript
await tap('[data-testid="save-progress"]');
await type('[data-testid="save-label"]', 'Before risky change');
await tap('[data-testid="save-confirm"]');

const saves = await api.get('/api/save-games', { problemStoryId: story.id });
const latest = saves[0];
assert(latest.label === 'Before risky change');
assert(latest.problemStory !== null);
assert(latest.experimentCards.length > 0);
assert(JSON.parse(JSON.stringify(latest.agentState))); // serializable
```

---

#### ZHC1-T061: User can resume from a save game

**Phase:** Save Game  
**Priority:** P0  
**Dependencies:** T060

**Given:**
A save game exists.

**When:**
The user selects "Load" on a save game.

**Then:**
- The Problem Story is restored to its saved state
- All saved Experiment Cards are restored to the feed
- Agent state is restored (memory, config, working context)
- The user can continue iterating from where they left off
- New experiments reference the saved context

**Verification:**
```javascript
await tap('[data-testid="load-save"]', { saveId: saveId });

const story = await api.get('/api/problem-stories/latest');
assert(story.id === savedStory.id);
assert(story.constraints.length === savedStory.constraints.length);

const cards = await api.get('/api/experiment-cards', { problemStoryId: story.id });
assert(cards.length === savedCardCount);
```

---

#### ZHC1-T062: User can fork from a save game

**Phase:** Save Game  
**Priority:** P2  
**Dependencies:** T060

**Given:**
A save game exists.

**When:**
The user selects "Fork" on a save game.

**Then:**
- A new Problem Story is created as a copy of the saved state
- The new story has `status: 'active'`
- The original story and cards are untouched
- The user can now experiment in a different direction without losing the original

**Verification:**
```javascript
await tap('[data-testid="fork-save"]', { saveId: saveId });

const stories = await api.get('/api/problem-stories');
assert(stories.length > 1);
const forked = stories.find(s => s.parentStoryId === originalStoryId);
assert(forked !== undefined);
assert(forked.status === 'active');
```

---

### 7.8 Phase 7: Publication

---

#### ZHC1-T070: User can declare project finished

**Phase:** Publication  
**Priority:** P0  
**Dependencies:** T051

**Given:**
Problem Story is 'active' and convergence has been detected (or user chooses to finish manually).

**When:**
The user taps "Finish Project" (or equivalent).

**Then:**
- Problem Story status changes to 'converged'
- The system prompts the user to confirm: "Your solution will be shared with others. Publish?"
- The user can optionally rate their satisfaction (1-5 stars)
- Publication does NOT happen until user confirms

**Verification:**
```javascript
await tap('[data-testid="finish-project"]');

const story = await api.get('/api/problem-stories/latest');
assert(story.status === 'converged');

assert(document.querySelector('[data-testid="publish-confirm-dialog"]') !== null);
```

---

#### ZHC1-T071: Published streams include the complete journey

**Phase:** Publication  
**Priority:** P0  
**Dependencies:** T070

**Given:**
User has confirmed publication.

**When:**
The stream is published.

**Then:**
- Problem Story status changes to 'published'
- A `PublishedStream` is created containing: all kept/refined cards, all feedback rounds, problem description, quality signals
- The stream has a `codeFingerprint` for similarity matching
- The stream has `discoveryKeywords` extracted from the problem description
- Discarded cards are NOT included in the published stream

**Verification:**
```javascript
const stream = await api.get('/api/published-streams/latest');
assert(stream.problemStoryId === story.id);
assert(stream.cards.length > 0);
stream.cards.forEach(c => {
  assert(c.status === 'kept' || c.status === 'refined');
});
assert(stream.codeFingerprint !== '');
assert(stream.discoveryKeywords.length > 0);
```

---

### 7.9 Phase 8: Discovery Feed

---

#### ZHC1-T080: Discovery Feed shows only published streams

**Phase:** Discovery Feed  
**Priority:** P0  
**Dependencies:** T071

**Given:**
The user has published at least one project. Multiple published streams exist from various users.

**When:**
The user opens the Discovery Feed.

**Then:**
- Only published streams are shown (no draft, active, saved, or converged)
- Streams are ordered by semantic similarity to the user's problem domain
- Each stream shows: problem description excerpt, quality signals, iteration count
- No stream from the current user is shown (don't show your own)

**Verification:**
```javascript
const feed = document.querySelector('[data-testid="discovery-feed"]');
assert(feed !== null);

const streams = feed.querySelectorAll('[data-testid="published-stream"]');
assert(streams.length > 0);
streams.forEach(s => {
  const author = s.getAttribute('data-author-id');
  assert(author !== currentUserId); // not own streams
});
```

---

#### ZHC1-T081: Discovery matching uses problem + code similarity

**Phase:** Discovery Feed  
**Priority:** P1  
**Dependencies:** T080

**Given:**
The user has an active Problem Story with a defined problem domain.

**When:**
The Discovery Feed is loaded.

**Then:**
- Streams are ranked by combined similarity of: problem description semantics, code fingerprint, problem domain tags
- The ranking is not based on popularity, follower count, or publication date
- The user can filter by problem domain

**Verification:**
```javascript
const streams = await api.get('/api/discovery-feed', { problemStoryId: story.id });
// Verify ordering is by similarity score, not by date
const similarityScores = streams.map(s => s.similarityScore);
for (let i = 1; i < similarityScores.length; i++) {
  assert(similarityScores[i] <= similarityScores[i - 1]);
}
```

---

#### ZHC1-T082: User can pull context from a Discovery Stream into their Problem Story

**Phase:** Discovery Feed  
**Priority:** P1  
**Dependencies:** T080

**Given:**
The user is viewing a Discovery Stream with a similar problem.

**When:**
The user selects "Use insights from this" (or equivalent).

**Then:**
- Relevant constraints and approaches from the stream are extracted
- The user can review and select which insights to pull
- Selected insights are added to their Problem Story as `context` entries
- The agent incorporates this context into future experiments
- The source stream is referenced (not copied blindly)

**Verification:**
```javascript
await tap('[data-testid="use-insights"]');
await selectInsights(['metric: load-time-optimization', 'approach: lazy-loading']);

const story = await api.get('/api/problem-stories/latest');
assert(story.context.some(c => c.includes('load-time')));
assert(story.context.some(c => c.sourceStreamId === viewedStreamId));
```

---

## 8. UI specifications

### 8.1 Layout: modal-based, mobile-friendly

The iteration feed is rendered as a **full-screen modal overlay** on top of the Portal app screen.

**Why modal:** The agent needs the app screen for execution context. The feed is a review layer, not a replacement.

**Why mobile-friendly:** The primary input on mobile is voice. The feed must work with one thumb.

**Layout rules:**
- Feed modal occupies full viewport on mobile, centered 90% on desktop
- Card content fills the modal width
- Feedback input (text field + mic button) is fixed at the bottom
- Score trend and save/load actions accessible via top bar

### 8.2 Card layout

```
┌─────────────────────────────┐
│  #3  ↑ 0.12  Score: 0.87    │  ← iteration, delta, composite
├─────────────────────────────┤
│                             │
│                             │
│     [Visual Area]           │  ← screenshot, slide, chart, preview
│                             │
│                             │
├─────────────────────────────┤
│  "Reduced header padding    │  ← agent summary (max 280 chars)
│   and adjusted spacing"     │
├─────────────────────────────┤
│  📄 main.css  +3 -1 lines  │  ← code reference
├─────────────────────────────┤
│  [Expand for details]       │  ← tap for full view + metrics
└─────────────────────────────┘
  ──────────────────────────  ← swipe zone
┌─────────────────────────────┐
│  [💬 Type feedback] [🎙️]   │  ← fixed bottom bar
└─────────────────────────────┘
```

### 8.3 Score trend (top bar)

```
┌─────────────────────────────┐
│  ↗ 0.52 → 0.67 → 0.81 → 0.87 │  ← sparkline
│  Baseline: 0.52              │
│  [💾 Save] [✅ Finish]       │
└─────────────────────────────┘
```

### 8.4 Evaluation setup modal

```
┌─────────────────────────────┐
│  How will you measure       │
│  success?                   │
│                             │
│  1. Page load time (↓)      │  ← proposed metric
│     Target: < 2s            │
│     [✓] [✗] [✎]            │
│                             │
│  2. Visual quality (↑)      │  ← qualitative metric
│     "Does it look polished?"│
│     [✓] [✗] [✎]            │
│                             │
│  [+ Add metric]             │
│                             │
│  ─────────────────────────  │
│  [Confirm & Start]          │  ← blocked until ≥1 metric
└─────────────────────────────┘
```

### 8.5 Responsive breakpoints

| Breakpoint | Card width | Feed columns | Feedback layout |
|---|---|---|---|
| Mobile (<640px) | 100% | 1 | Full-width bottom bar, mic prominent |
| Tablet (640-1024px) | 90% | 1 | Side panel for text, mic in corner |
| Desktop (>1024px) | 600px max | 1 (modal) | Side panel for detail view |

---

## 9. Integration with ZHC0

### 9.1 What ZHC0 provides

ZHC0 built the foundation. ZHC1 builds on top:

| ZHC0 Component | ZHC1 Usage |
|---|---|
| Auth / Privy login | Unchanged — required before feed access |
| Founders loop (Town Hall, sigil, crest) | Becomes onboarding to reach the feed |
| House as HQ | Feed modal opens from within House |
| Library as memory | Problem Stories are stored in Library |
| OpenClaw agent runtime | Powers the Experiment Engine |
| Save-point concept | Evolved into Save Game |

### 9.2 What ZHC1 adds

| ZHC1 Component | Purpose |
|---|---|
| Problem Story Manager | Living context document for each problem |
| Experiment Engine | Runs time-boxed experiments via OpenClaw |
| Card Store | Stores and retrieves experiment cards |
| Eval Engine | Scores experiments against user-defined metrics |
| Private Feed | Swipeable feed of user's own experiments |
| Discovery Feed | Published streams from similar problems |
| Feedback Capture | Audio, text, and gesture feedback |
| Save Game Manager | Checkpoint and resume |

### 9.3 Route integration

```
/app                        ← existing ZHC0 app shell (modal host)
  └─ feed (modal)           ← ZHC1 iteration feed
       ├─ private           ← own experiments
       └─ discovery         ← published streams

/api/problem-stories        ← CRUD for Problem Stories
/api/experiment-cards       ← CRUD for Experiment Cards
/api/experiments/start      ← trigger experiment round
/api/eval-proposals         ← evaluation metric proposals
/api/save-games             ← Save Game CRUD
/api/published-streams      ← Discovery Feed data
/api/discovery-feed         ← ranked Discovery Feed query
```

---

## 10. Verification patterns for agentic developers

### 10.1 How to run tests

Tests are designed to be executable by an agentic AI developer. Each test specifies:
1. The preconditions (Given)
2. The action to perform (When)
3. The expected outcome (Then)
4. The specific verification method (Verification)

### 10.2 Test execution order

Tests must be executed in dependency order. A test with `Dependencies: T001, T020` requires both T001 and T020 to pass first.

```
Phase 0 (no dependencies):
  T001 → T002 → T003

Phase 1 (depends on Phase 0):
  T010 → T011 → T012 → T013 → T014

Phase 2 (depends on Phase 1):
  T020 → T021 → T022 → T023 → T024

Phase 3 (depends on Phase 2):
  T030 → T031 → T032 → T033

Phase 4 (depends on Phase 3):
  T040 → T041 → T042 → T043

Phase 5 (depends on Phase 4):
  T050 → T051 → T052

Phase 6 (depends on Phase 5):
  T060 → T061 → T062

Phase 7 (depends on Phase 6):
  T070 → T071

Phase 8 (depends on Phase 7):
  T080 → T081 → T082
```

### 10.3 Test priority meaning

| Priority | Meaning |
|---|---|
| **P0** | Must ship. Blocker for the first playable loop. |
| **P1** | Should ship. Important for the product to feel complete. |
| **P2** | Nice to have. Can defer without breaking the core loop. |

---

## 11. Milestone plan

### Milestone M1: Evaluation Function Foundation
**Tests:** T001, T002, T003, T010, T011, T012, T013, T014  
**Goal:** The user can define a problem, set up evaluation metrics, and the system enforces the evaluation-before-experiment rule.  
**Deliverable:** Problem Story Manager + Eval Engine (minimum viable)

### Milestone M2: First Experiment Loop
**Tests:** T020, T021, T022, T023, T024  
**Goal:** The agent can run time-boxed experiments and produce scored cards.  
**Deliverable:** Experiment Engine + Card Store

### Milestone M3: Private Feed
**Tests:** T030, T031, T032, T033, T040, T041, T042, T043  
**Goal:** The user can swipe through experiments and give text/audio/gesture feedback.  
**Deliverable:** Private Feed UI + Feedback Capture

### Milestone M4: Iteration Loop
**Tests:** T050, T051, T052  
**Goal:** Feedback triggers new rounds. Convergence is detected and signaled.  
**Deliverable:** Iteration loop wiring + convergence detection

### Milestone M5: Save Game
**Tests:** T060, T061, T062  
**Goal:** Users can checkpoint and resume their work.  
**Deliverable:** Save Game Manager

### Milestone M6: Discovery Feed
**Tests:** T070, T071, T080, T081, T082  
**Goal:** Published streams are discoverable by semantic similarity. Users can pull context.  
**Deliverable:** Publication flow + Discovery Feed + similarity engine

### Milestone M7: Polish and Mobile
**Tests:** All P1 tests + responsive checks  
**Goal:** Mobile-first experience works well. Voice input is reliable.  
**Deliverable:** Responsive UI, voice pipeline optimization, accessibility

---

## 12. Anti-goals

1. Do NOT allow experiments without a confirmed evaluation function
2. Do NOT show Discovery Feed to users who haven't solved their own problem
3. Do NOT publish unconverged or abandoned projects
4. Do NOT allow cards without code references (no ungrounded visuals)
5. Do NOT make the feed infinite without convergence signals
6. Do NOT require the user to read agent logs to understand what happened
7. Do NOT fabricate feedback or constraints — all extracted data must trace to user input
8. Do NOT let the founding ceremony dominate the product — it's onboarding, not the main event