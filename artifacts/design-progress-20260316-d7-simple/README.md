# D7 Dead-Simple Lobby + Schedule

Date: 2026-03-16  
Branch: `codex/poker-frontend-design-v1`

This capture set documents the first dead-simple default pass for poker lobby and tournament schedule.

What changed in this slice:

1. default lobby now keeps wallet limits and live-table detail behind explicit advanced drawers,
2. default schedule now leads with the next playable events and keeps recurring/admin detail behind explicit advanced drawers,
3. the underlying forms and richer state still exist; they are now secondary by default instead of ambient clutter.

Screens:

1. `mobile_lobby_simple.png`  
   Compact player-first lobby on mobile.
2. `desktop_lobby_simple.png`  
   Default desktop lobby with collapsed support detail.
3. `desktop_lobby_advanced_open.png`  
   Lobby with limits and table detail drawers opened.
4. `mobile_schedule_simple.png`  
   Mobile tournament schedule with player-first default hierarchy.
5. `desktop_schedule_simple.png`  
   Default desktop schedule with recurring and admin detail collapsed.
6. `desktop_schedule_advanced_open.png`  
   Schedule with recurring and admin drawers opened.

Validation for this slice:

1. `e2e/276_poker_play_schedule_calendar_ui.spec.js`
2. `e2e/285_poker_play_schedule_registration_ui.spec.js`
3. `e2e/287_poker_play_schedule_template_admin_ui.spec.js`
4. `e2e/302_poker_design_lobby_hierarchy_ui.spec.js`
5. `e2e/304_poker_design_schedule_hierarchy_ui.spec.js`
6. `e2e/332_poker_design_lobby_dead_simple_default_ui.spec.js`
7. `e2e/333_poker_design_lobby_advanced_detail_gate_ui.spec.js`
8. `e2e/334_poker_design_schedule_dead_simple_default_ui.spec.js`
9. `e2e/335_poker_design_schedule_advanced_detail_gate_ui.spec.js`
