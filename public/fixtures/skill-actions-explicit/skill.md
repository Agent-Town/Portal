---
name: skill-actions-explicit-fixture
version: 1.0.0
description: Fixture skill for plugin-based explicit action parsing.
---

# Explicit Skill Actions Fixture

This fixture is for deterministic Playwright validation.

```skill-actions-v1
{
  "version": "1",
  "actions": [
    {
      "id": "health.check",
      "title": "Health Check",
      "description": "Check API health endpoint",
      "transport": "http",
      "request": {
        "method": "GET",
        "urlTemplate": "{origin}/api/health"
      },
      "params": [],
      "success": {
        "httpStatus": "2xx",
        "jsonRules": [
          { "path": "ok", "equals": true }
        ]
      },
      "evidence": {
        "produces": ["health.check.ok"],
        "ttlMs": 120000
      },
      "security": {
        "sameOriginOnly": true,
        "allowMethods": ["GET"],
        "maxBodyBytes": 0
      }
    },
    {
      "id": "health.strict_fail",
      "title": "Health Strict Fail",
      "description": "Intentional strict check to verify SUCCESS_RULE_FAILED path",
      "transport": "http",
      "request": {
        "method": "GET",
        "urlTemplate": "{origin}/api/health"
      },
      "params": [],
      "success": {
        "httpStatus": "2xx",
        "jsonRules": [
          { "path": "ok", "equals": false }
        ]
      },
      "evidence": {
        "produces": ["health.strict_fail.ok"],
        "ttlMs": 120000
      },
      "security": {
        "sameOriginOnly": true,
        "allowMethods": ["GET"],
        "maxBodyBytes": 0
      }
    }
  ]
}
```
