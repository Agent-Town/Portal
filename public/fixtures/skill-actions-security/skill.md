---
name: skill-actions-security-fixture
version: 1.0.0
description: Fixture skill for plugin security guard tests.
---

# Security Fixture

```skill-actions-v1
{
  "version": "1",
  "actions": [
    {
      "id": "cross.origin.block",
      "title": "Cross Origin Block",
      "request": {
        "method": "GET",
        "urlTemplate": "https://example.com/api/status"
      },
      "params": [],
      "success": {
        "httpStatus": "2xx"
      },
      "security": {
        "sameOriginOnly": true,
        "allowMethods": ["GET"],
        "maxBodyBytes": 0
      }
    },
    {
      "id": "method.block",
      "title": "Method Block",
      "request": {
        "method": "POST",
        "urlTemplate": "{origin}/api/health"
      },
      "params": [],
      "success": {
        "httpStatus": "2xx"
      },
      "security": {
        "sameOriginOnly": true,
        "allowMethods": ["GET"],
        "maxBodyBytes": 0
      }
    },
    {
      "id": "body.limit",
      "title": "Body Limit",
      "request": {
        "method": "POST",
        "urlTemplate": "{origin}/api/health",
        "bodyTemplate": {
          "blob": "{blob}"
        }
      },
      "params": [
        { "name": "blob", "type": "string", "required": true }
      ],
      "success": {
        "httpStatus": "2xx"
      },
      "security": {
        "sameOriginOnly": true,
        "allowMethods": ["POST"],
        "maxBodyBytes": 16
      }
    }
  ]
}
```
