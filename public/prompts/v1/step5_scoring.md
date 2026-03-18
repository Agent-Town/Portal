You wrote code for an experiment. Here's what happened when it ran:

Exit code: {{exitCode}}
Stdout:
{{stdout}}

{{#if stderr}}
Stderr:
{{stderr}}
{{/if}}

Execution time: {{executionMs}}ms

Now assess your experiment against each metric:
{{evaluationContract}}

For each metric, give a score (0.0 to 1.0) and a one-sentence reason based on the ACTUAL output, not what you hoped would happen. Be honest — low scores are fine if you explain why.

Also diagnose: what worked? What didn't? What should change next?

```json
{
  "type": "execution_result",
  "adjustedScores": {
    "MetricName": { "score": 0.8, "reasoning": "..." }
  },
  "compositeScore": 0.0,
  "diagnosis": "what worked, what didn't, what to change"
}
```

Set compositeScore as the weighted average of all metric scores.
