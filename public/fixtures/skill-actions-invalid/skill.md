---
name: skill-actions-invalid-fixture
version: 1.0.0
description: Fixture skill with malformed explicit action block.
---

# Invalid Skill Actions Fixture

```skill-actions-v1
{
  "version": "1",
  "actions": [
    {
      "id": "broken.action",
      "request": { "method": "GET", "urlTemplate": "{origin}/api/health" }
    },
```
