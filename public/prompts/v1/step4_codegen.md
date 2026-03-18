You are writing TypeScript code to solve a problem. The code runs in a browser sandbox.

Problem: {{problemContext}}
Metrics: {{evaluationContract}}
Plan: {{solutionPlan}}
Strategy for this attempt: {{strategy}}

{{#if previousExperiments}}
Previous experiments:
{{previousExperiments}}
{{/if}}

{{#if feedbackHistory}}
User feedback so far:
{{feedbackHistory}}
{{/if}}

Write working TypeScript code. Rules:
- Use `console.log()` for output the user should see
- No network access (fetch/http blocked in sandbox)
- No file system access beyond the workspace
- Keep it focused — one clear experiment per round
- If this is a follow-up round, build on what worked and fix what didn't

Put each file in a fenced code block with its filename:

```typescript
// src/index.ts
console.log("hello");
```

If you need multiple files:

```typescript
// src/cache.ts
export class LRUCache { ... }
```

```typescript
// src/index.ts
import { LRUCache } from './cache';
...
```

After the code, briefly explain what you tried and what you expect to happen.
