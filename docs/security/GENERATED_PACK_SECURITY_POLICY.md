# Generated Pack Security Policy

Status: prototype-gated

## Hard Rules

- A generated pack is untrusted input until schema validation, content validation, asset manifest validation, and first-loop playtest pass.
- Generated packs cannot introduce tool handlers, formulas, script fields, eval fields, server-rule overrides, mutation handlers, or secret-like fields.
- Generated packs cannot store raw prompts as executable instructions. Runtime packs store a prompt hash and safe keyword hints.
- Generated packs cannot store provider credentials, API keys, access tokens, refresh tokens, wallet secrets, Brain vault data, private event logs, or account recovery material.
- Player-visible generated text must be escaped in DOM rendering.
- Production image generation requires explicit consent and a documented cost/auth model before any user-facing release claim.

## Release Gate

```json
{
  "schemaValid": true,
  "moderationPassed": true,
  "playtestPassed": true,
  "assetManifestValid": true,
  "secretLeakCount": 0,
  "fallbackVerified": true,
  "humanReviewComplete": true,
  "publicReleaseEligible": true
}
```

