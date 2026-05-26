# Public Presence Privacy Model V5

Status: implementation planning

## Public Promise

Players may choose to make a small public summary of their town visible. Private
town state, Brain state, account secrets, wallet details, provider details,
runtime logs, and event history remain private.

## Public-Safe Fields

- Public town ID.
- Display name chosen for public use.
- Town name chosen for public use.
- HQ level band, not full internal progression.
- Charm/style band.
- Visible landmarks selected for public display.
- Optional operating style card only if separately enabled.

## Private Fields

- Brain secrets and provider metadata.
- Wallet/account identifiers beyond public-safe pseudonyms.
- Raw event logs and recaps.
- Inventory, exact timers, tool traffic, debug payloads.
- Private contracts, approvals, doctrine details, and Foreman runtime state.

## Opt-In And Opt-Out

Public presence is off by default. Opt-out must remove a town from public
discovery within the active release target and must not leave stale cards in
normal discovery APIs.
