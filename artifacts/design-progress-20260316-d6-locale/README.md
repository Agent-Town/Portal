## Poker Design D6 Locale And Beginner Screenshots

Deterministic captures for the beginner-first, Simplified Chinese, provider-neutral, and voice-ready design pass.

### Screens

- `mobile_lobby_zh_hans.png`
- `desktop_schedule_zh_hans.png`
- `mobile_live_table_zh_hans.png`
- `mobile_live_table_zh_hans_stress.png`
- `desktop_live_season_zh_hans.png`
- `mobile_centaur_zh_hans.png`

### What these document

1. lobby copy simplified for first-time players while keeping the action-first layout,
2. Simplified Chinese route titles and key section headers on live play, schedule, season, and centaur surfaces,
3. localized expansion safety on mobile live-table actions,
4. provider metadata staying hidden and structural,
5. dormant voice-ready slots staying invisible while preserving section order.

### Seeds

- lobby and live table: deterministic `pkt_play_cash_01` A/B seating via the design live harness
- schedule: `schedule_calendar_story`
- native season: `economy_native_season_story`
- centaur: `pkt_centaur_01` with deterministic Streamflow lock verification and funded OIL wallet

### Related design tests

- `e2e/326_poker_design_beginner_copy_ui.spec.js`
- `e2e/327_poker_design_cjk_layout_ui.spec.js`
- `e2e/328_poker_design_localized_expansion_ui.spec.js`
- `e2e/329_poker_design_provider_neutral_ui.spec.js`
- `e2e/330_poker_design_voice_ready_layout_contract.spec.js`
- `e2e/331_poker_design_international_persona_ui.spec.js`
