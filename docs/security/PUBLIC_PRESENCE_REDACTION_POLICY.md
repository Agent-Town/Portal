# Public Presence Redaction Policy

Status: implementation planning

Public town discovery and visit previews expose only public-safe summary fields.

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
