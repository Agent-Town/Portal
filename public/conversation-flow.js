/**
 * conversation-flow.js — Structured conversation state machine for iterate.
 *
 * Drives the agent through a step-by-step information extraction pipeline.
 * Each step has a prompt template, produces a structured artifact, and
 * feeds into the next step.
 *
 * Prompts are versioned at /prompts/v1/*.md and are the product.
 */

const PROMPT_VERSION = 'v1';

// ── Conversation steps ──────────────────────────────────────
const STEPS = [
  'understanding',      // Step 1: Extract problem context
  'success_definition', // Step 2: Define metrics + visualization
  'solution_strategy',  // Step 3: Plan the approach
  'code_generation',    // Step 4: Write TypeScript
  'execution',          // Step 5: Score against metrics
  'feedback',           // Step 6: Process user feedback
  // Step 7 loops back to code_generation
];

const STRATEGY_ROTATION = ['conservative', 'aggressive', 'creative'];

// ── Prompt template cache ───────────────────────────────────
const promptCache = new Map();

async function loadPrompt(stepName) {
  const key = `${PROMPT_VERSION}/${stepName}`;
  if (promptCache.has(key)) return promptCache.get(key);

  const stepFileMap = {
    understanding: 'step1_understanding',
    success_definition: 'step2_success',
    solution_strategy: 'step3_strategy',
    code_generation: 'step4_codegen',
    execution: 'step5_scoring',
    feedback: 'step6_feedback',
  };

  const filename = stepFileMap[stepName];
  if (!filename) return '';

  try {
    const res = await fetch(`/prompts/${PROMPT_VERSION}/${filename}.md`);
    if (!res.ok) return '';
    const text = await res.text();
    promptCache.set(key, text);
    return text;
  } catch {
    return '';
  }
}

function fillTemplate(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`;
    const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || '');
    result = result.split(placeholder).join(stringValue);
  }
  // Remove unfilled conditional blocks {{#if ...}}...{{/if}}
  result = result.replace(/\{\{#if\s+\w+\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  return result;
}

// ── Artifact extraction ─────────────────────────────────────
function extractJsonArtifact(text, expectedType) {
  // Look for ```json blocks
  const jsonPattern = /```json\s*\n([\s\S]*?)```/gi;
  const matches = [...text.matchAll(jsonPattern)];

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (!expectedType || parsed.type === expectedType) {
        return parsed;
      }
    } catch {
      // Try next match
    }
  }

  // Fallback: try to find raw JSON object in text
  const bracePattern = /\{[\s\S]*"type"\s*:\s*"[\w_]+"[\s\S]*\}/g;
  const braceMatches = [...text.matchAll(bracePattern)];
  for (const match of braceMatches) {
    try {
      const parsed = JSON.parse(match[0]);
      if (!expectedType || parsed.type === expectedType) {
        return parsed;
      }
    } catch {
      // Continue
    }
  }

  return null;
}

function extractCodeFiles(text) {
  const files = {};
  // Match ```typescript blocks with optional filename comment
  const tsPattern = /```(?:typescript|ts)\s*\n(?:\/\/\s*([\w/.]+)\s*\n)?([\s\S]*?)```/gi;
  const matches = [...text.matchAll(tsPattern)];

  if (matches.length === 0) return null;

  matches.forEach((m, i) => {
    const filename = m[1]?.trim() || (i === 0 ? 'src/index.ts' : `src/module${i}.ts`);
    files[filename] = m[2].trim();
  });

  return files;
}

// ── Conversation Flow Manager ───────────────────────────────
export class ConversationFlow {
  constructor() {
    this.currentStep = 'understanding';
    this.artifacts = {
      problemContext: null,
      evaluationContract: null,
      solutionPlan: null,
      experiments: [],         // { files, output, scores, feedback }
      feedbackDigests: [],
    };
    this.pendingArtifactType = null;
    this.experimentRound = 0;
    this.onStepChange = null;  // callback(step, artifacts)
    this.onArtifact = null;    // callback(type, artifact)
    this.onCodeReady = null;   // callback(files, entrypoint)
    this.onScoresReady = null; // callback(executionResult)
  }

  /**
   * Build the prompt for the current step, ready to send to the agent.
   */
  async buildPrompt(extraVars = {}) {
    const template = await loadPrompt(this.currentStep);
    if (!template) return null;

    const vars = {
      problemDescription: extraVars.problemDescription || '',
      problemContext: this.artifacts.problemContext
        ? JSON.stringify(this.artifacts.problemContext, null, 2) : '(not yet defined)',
      evaluationContract: this.artifacts.evaluationContract
        ? JSON.stringify(this.artifacts.evaluationContract, null, 2) : '(not yet defined)',
      solutionPlan: this.artifacts.solutionPlan
        ? JSON.stringify(this.artifacts.solutionPlan, null, 2) : '(not yet defined)',
      strategy: STRATEGY_ROTATION[this.experimentRound % STRATEGY_ROTATION.length],
      previousExperiments: this.artifacts.experiments.length > 0
        ? this.artifacts.experiments.map((e, i) =>
          `Round ${i + 1}: ${e.scores ? `Score: ${e.scores.compositeScore}` : 'no scores'}\n` +
          `Output: ${(e.output?.stdout || '').slice(0, 200)}\n` +
          `Diagnosis: ${e.scores?.diagnosis || 'none'}`
        ).join('\n\n')
        : '',
      feedbackHistory: this.artifacts.feedbackDigests.length > 0
        ? this.artifacts.feedbackDigests.map((fd, i) =>
          `Feedback ${i + 1}: focus="${fd.nextFocus}", constraints=[${fd.newConstraints?.join(', ')}]`
        ).join('\n')
        : '',
      ...extraVars,
    };

    return fillTemplate(template, vars);
  }

  /**
   * Process an agent message. Extract artifacts if present, advance step if complete.
   * Returns { artifact, codeFiles, conversationText, nextAction }
   */
  processAgentMessage(text) {
    const result = {
      artifact: null,
      codeFiles: null,
      conversationText: text,
      nextAction: null, // 'confirm' | 'run_code' | 'advance' | 'wait'
    };

    switch (this.currentStep) {
      case 'understanding': {
        const artifact = extractJsonArtifact(text, 'problem_context');
        if (artifact) {
          result.artifact = artifact;
          result.nextAction = 'confirm';
        } else {
          result.nextAction = 'wait'; // Agent is still asking questions
        }
        break;
      }

      case 'success_definition': {
        const artifact = extractJsonArtifact(text, 'evaluation_contract');
        if (artifact) {
          result.artifact = artifact;
          result.nextAction = 'confirm';
        } else {
          result.nextAction = 'wait';
        }
        break;
      }

      case 'solution_strategy': {
        const artifact = extractJsonArtifact(text, 'solution_plan');
        if (artifact) {
          result.artifact = artifact;
          result.nextAction = 'confirm';
        } else {
          result.nextAction = 'wait';
        }
        break;
      }

      case 'code_generation': {
        const files = extractCodeFiles(text);
        if (files) {
          result.codeFiles = files;
          result.nextAction = 'run_code';
        } else {
          result.nextAction = 'wait';
        }
        break;
      }

      case 'execution': {
        const artifact = extractJsonArtifact(text, 'execution_result');
        if (artifact) {
          result.artifact = artifact;
          result.nextAction = 'advance'; // Move to feedback
        } else {
          result.nextAction = 'wait';
        }
        break;
      }

      case 'feedback': {
        const artifact = extractJsonArtifact(text, 'feedback_digest');
        if (artifact) {
          result.artifact = artifact;
          result.nextAction = 'advance'; // Move to next code_generation round
        } else {
          result.nextAction = 'wait';
        }
        break;
      }
    }

    return result;
  }

  /**
   * Confirm an artifact and advance to the next step.
   */
  confirmArtifact(artifact) {
    switch (this.currentStep) {
      case 'understanding':
        this.artifacts.problemContext = artifact;
        this.currentStep = 'success_definition';
        break;
      case 'success_definition':
        this.artifacts.evaluationContract = artifact;
        this.currentStep = 'solution_strategy';
        break;
      case 'solution_strategy':
        this.artifacts.solutionPlan = artifact;
        this.currentStep = 'code_generation';
        break;
      case 'execution':
        // Store scores with current experiment
        if (this.artifacts.experiments.length > 0) {
          this.artifacts.experiments[this.artifacts.experiments.length - 1].scores = artifact;
        }
        this.currentStep = 'feedback';
        break;
      case 'feedback':
        this.artifacts.feedbackDigests.push(artifact);
        this.experimentRound++;
        this.currentStep = 'code_generation';
        break;
    }

    if (this.onStepChange) this.onStepChange(this.currentStep, this.artifacts);
    if (this.onArtifact) this.onArtifact(artifact.type, artifact);
  }

  /**
   * Record a code experiment (after sandbox runs it).
   */
  recordExperiment(files, output) {
    this.artifacts.experiments.push({ files, output, scores: null, feedback: null });
    this.currentStep = 'execution';
    if (this.onStepChange) this.onStepChange(this.currentStep, this.artifacts);
  }

  /**
   * Get a human-readable label for the current step.
   */
  getStepLabel() {
    const labels = {
      understanding: 'Understanding your problem',
      success_definition: 'Defining success metrics',
      solution_strategy: 'Planning the approach',
      code_generation: `Writing code (round ${this.experimentRound + 1})`,
      execution: 'Scoring the experiment',
      feedback: 'Processing your feedback',
    };
    return labels[this.currentStep] || this.currentStep;
  }

  /**
   * Serialize the full state for debugging / session context panel.
   */
  toJSON() {
    return {
      currentStep: this.currentStep,
      experimentRound: this.experimentRound,
      hasContext: !!this.artifacts.problemContext,
      hasMetrics: !!this.artifacts.evaluationContract,
      hasPlan: !!this.artifacts.solutionPlan,
      experimentsCount: this.artifacts.experiments.length,
      feedbackCount: this.artifacts.feedbackDigests.length,
    };
  }
}
