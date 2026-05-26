# World Layer Security Review V5

Status: required before public V5 release

## Review Areas

- Private region ownership.
- Public/private state separation.
- Cross-account access control.
- Renderer/state mutation boundary.
- Feature-flag production safety.
- Same-origin, CSRF, session-auth, rate-limit, and idempotency controls for
  mutating world endpoints.
- Public presence redaction.
- Sandbox moderation and rollback.
- World event contribution conservation.
- Agent service input redaction and tool scopes.

## Release Rule

No V5 world layer can be promoted beyond `prototype_gated` until this review has
test evidence and owner signoff.

The detailed mutation security release gate is tracked in
`docs/security/WORLD_GRID_MUTATION_SECURITY_PLAN.md`.
