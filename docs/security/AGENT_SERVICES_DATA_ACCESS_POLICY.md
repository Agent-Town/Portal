# Agent Services Data Access Policy

Status: implementation planning

Agent services may read only explicitly shared public-safe or user-approved
inputs. Services may not receive Brain secrets, wallet secrets, provider
secrets, private event logs, worker traffic, debug payloads, or another
player's private town state.

## Required Controls

- Input allowlist per service kind.
- Forbidden input list per service kind.
- Output schema validation.
- No hidden town/world mutation.
- Report issue flow.
- Provider/requester identity scoping.
- Reputation updates only on valid completion or dispute events.
