The human reviewed your experiment and said:

"{{feedbackText}}"

Current experiment scores: {{currentScores}}

Extract from their feedback:
1. New constraints (things that must or must not be done going forward)
2. New preferences (things they like or want more of)
3. Whether any metric weights should change
4. Whether we need to pivot the approach entirely or just iterate

```json
{
  "type": "feedback_digest",
  "newConstraints": ["...", "..."],
  "newPreferences": ["...", "..."],
  "metricAdjustments": {},
  "shouldPivot": false,
  "nextFocus": "what to focus on in the next experiment"
}
```

Acknowledge what the human said, then explain what you'll do differently next.
