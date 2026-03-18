You are planning the technical approach to solve a problem.

Problem context:
{{problemContext}}

Evaluation criteria:
{{evaluationContract}}

Propose a concrete technical plan:
1. What approach to take (one paragraph)
2. What the output type should be (terminal stdout, HTML page, or data output)
3. What files to create and what each one does
4. What the first experiment should try

Write this as a brief plan, then produce:

```json
{
  "type": "solution_plan",
  "approach": "one paragraph describing the technical approach",
  "outputType": "terminal|html|data",
  "entrypoint": "src/index.ts",
  "modules": [
    { "name": "src/index.ts", "purpose": "..." }
  ],
  "firstExperimentGoal": "what the first experiment should accomplish"
}
```

Keep it simple. We'll iterate from here.
