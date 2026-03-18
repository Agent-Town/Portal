# ZHC1 Conversation Flow & Prompt Engineering — Spec

Status: implementation-driving spec
Version: 0.1.0
Branch: `zhc1-sandbox-artifact-system`
Last updated: 2026-03-18
Predecessor: [specs/45_zhc1_iterate_prototype_spec.md](specs/45_zhc1_iterate_prototype_spec.md)
Predecessor: [specs/47_zhc1_sandbox_artifact_system_spec.md](specs/47_zhc1_sandbox_artifact_system_spec.md)

---

## 1. Purpose

The iterate loop fails if the conversation is free-form. The agent must extract specific information at each step to produce the right artifacts downstream. This spec defines the conversation state machine, the structured artifacts each step produces, and the prompt templates that drive each step.

Prompts are versioned product artifacts — they ship with the code and iterate with usage.

## 2. Conversation State Machine

```
problem_input → understanding → success_definition → solution_strategy → code_generation → execution → feedback → [code_generation again | converged]
```

Each state has:
- A **system prompt** sent to the agent
- A **required artifact** the agent must produce (JSON parseable)
- A **validation function** that checks the artifact
- A **UI treatment** (what the user sees)

## 3. Steps & Artifacts

### Step 1: Problem Understanding

**Goal**: Extract domain, scope, current state, desired state, constraints.

**System prompt** instructs agent to ask targeted questions, then produce:
```json
{
  "type": "problem_context",
  "domain": "web_ui | backend | data | workflow | business | other",
  "scope": "small_fix | feature | full_system | ongoing_process",
  "currentState": "what exists now",
  "desiredState": "what it should look like",
  "constraints": ["must use TypeScript", "no external APIs", ...]
}
```

**UI**: Conversation thread. After agent asks questions and user answers, agent produces the artifact. Shown to user as a summary card for confirmation.

### Step 2: Success Definition

**Goal**: Define what "done" looks like, how to measure it, what to visualize.

**System prompt** receives ProblemContext, instructs agent to propose metrics:
```json
{
  "type": "evaluation_contract",
  "successCriteria": "Page loads in under 2 seconds on mobile",
  "metrics": [
    { "name": "Load time", "type": "quantitative", "direction": "minimize", "assessmentMethod": "measure console.time output", "weight": 1.0 },
    { "name": "Code quality", "type": "qualitative", "direction": "maximize", "assessmentMethod": "no TypeScript errors, clean structure", "weight": 0.5 }
  ],
  "minimumThreshold": 0.7,
  "visualizationStrategy": "terminal"
}
```

**UI**: Metrics shown as cards. User can accept, modify, or ask for different ones.

### Step 3: Solution Strategy

**Goal**: Agree on technical approach before writing code.

**System prompt** receives ProblemContext + EvaluationContract:
```json
{
  "type": "solution_plan",
  "approach": "Build a caching middleware with LRU eviction",
  "outputType": "terminal",
  "entrypoint": "src/index.ts",
  "modules": [
    { "name": "src/cache.ts", "purpose": "LRU cache implementation" },
    { "name": "src/index.ts", "purpose": "Main entry, demo usage" }
  ],
  "firstExperimentGoal": "Implement basic LRU cache with get/set/evict"
}
```

**UI**: Plan shown as a summary. User confirms or redirects.

### Step 4: Code Generation (per experiment)

**Goal**: Produce runnable TypeScript.

**System prompt** receives ALL accumulated context:
- ProblemContext
- EvaluationContract
- SolutionPlan
- All previous experiments (code, output, scores)
- All feedback digests
- Current strategy variant (conservative/aggressive/creative)

Agent produces TypeScript in fenced code blocks. iterate.js extracts and runs it.

### Step 5: Execution + Scoring

**Goal**: Run code, let agent assess against metrics.

**System prompt** receives sandbox output + metrics:
```json
{
  "type": "execution_result",
  "actualOutput": "cache hit: 42\ncache miss: undefined",
  "exitCode": 0,
  "adjustedScores": {
    "Load time": { "score": 0.8, "reasoning": "Cache lookup is O(1)" },
    "Code quality": { "score": 0.7, "reasoning": "Clean but no error handling" }
  },
  "compositeScore": 0.76,
  "diagnosis": "Basic functionality works. Missing edge cases."
}
```

### Step 6: User Feedback

**Goal**: Extract actionable signals from user response.

**System prompt** receives user's feedback text + current experiment:
```json
{
  "type": "feedback_digest",
  "newConstraints": ["handle empty input gracefully"],
  "newPreferences": ["prefer explicit error messages over silent failures"],
  "metricAdjustments": {},
  "shouldPivot": false,
  "nextFocus": "Add error handling for edge cases"
}
```

### Step 7: Next Round → loops to Step 4

Agent receives accumulated context and decides what to try next.

## 4. Prompt storage

Prompts are stored as versioned templates in `public/prompts/`:
- `public/prompts/v1/step1_understanding.md`
- `public/prompts/v1/step2_success.md`
- `public/prompts/v1/step3_strategy.md`
- `public/prompts/v1/step4_codegen.md`
- `public/prompts/v1/step5_scoring.md`
- `public/prompts/v1/step6_feedback.md`

Each template has `{{placeholders}}` for dynamic context injection.

## 5. Artifact parsing

Agent responses may contain both conversational text and structured JSON. The system must:
1. Look for JSON blocks in agent messages (fenced with ```json)
2. Parse and validate against the expected artifact type
3. If invalid, ask the agent to retry
4. Store valid artifacts in the conversation state
