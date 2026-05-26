# Public Presence Redaction Policy

Status: implementation planning

Public town discovery and visit previews expose only public-safe summary fields.

Public presence rendering must also follow
`docs/security/PUBLIC_TEXT_RENDERING_POLICY.md`: public names, summaries,
generated text, and agent-authored text are untrusted and must use DOM
construction, `textContent`, or explicit escaping before reaching the DOM.

## Must Redact

- Brain secrets and provider/model configuration.
- Wallet/account raw identifiers.
- Runtime, worker traffic, debug and session context payloads.
- Private event logs, recaps, approvals, and doctrine details.
- Exact inventories, timers, and internal economic state.

## Required Tests

- Public summary redacts private state.
- Private town does not appear in discovery.
- Public lookup without auth returns only public-safe fields.
- Visiting/following another town cannot mutate that town.
