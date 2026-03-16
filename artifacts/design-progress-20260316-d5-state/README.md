## Poker Design D5 State Screenshots

Deterministic captures for the accessibility, status, and state-design pass.

### Screens

- `mobile_lobby_empty.png`
- `desktop_lobby_loading.png`
- `desktop_lobby_error.png`
- `mobile_live_table_focus_disabled.png`
- `mobile_centaur_error.png`

### What these document

1. empty state treatment for a lobby with no live tables,
2. route-level loading treatment before data resolves,
3. route-level error treatment after a failed load,
4. visible keyboard focus plus clearly inactive disabled controls on the live table,
5. centaur route error styling with the same structural state system.

### Seeds

- live lobby empty: mocked empty `/api/poker/play/tables` payload
- live lobby loading: delayed `/api/poker/play/tables` payload
- live lobby error: failing `/api/poker/play/tables` payload
- live table focus and disabled state: deterministic `pkt_play_cash_01` seeded via design live A/B fixtures
- centaur error: failing `pkt_centaur_01` route payload
