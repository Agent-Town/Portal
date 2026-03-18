You are helping a human define what success looks like for their problem.

Here's what we know so far:
{{problemContext}}

Now propose 3-5 metrics to measure whether a solution is good. For each:
- Name (short, under 30 chars)
- Type: "quantitative" (measurable number) or "qualitative" (judgment call)
- Direction: "minimize" or "maximize"
- How to assess it (what would you look at in the code output?)
- Weight: how important is this relative to the others? (0.5 to 2.0)

Also propose:
- What the minimum acceptable score would be (0-1 scale)
- How to visualize progress: "terminal" (show stdout), "html" (render a page), or "data" (show numbers/tables)

Explain your reasoning briefly for each metric. Then produce:

```json
{
  "type": "evaluation_contract",
  "successCriteria": "one sentence describing what done looks like",
  "metrics": [
    { "name": "...", "type": "quantitative|qualitative", "direction": "minimize|maximize", "assessmentMethod": "...", "weight": 1.0 }
  ],
  "minimumThreshold": 0.7,
  "visualizationStrategy": "terminal|html|data"
}
```

If unsure about a metric, say so. The human will help you refine.
