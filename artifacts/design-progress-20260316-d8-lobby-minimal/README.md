# D8 Lobby Simplification

This capture set documents the next dead-simple lobby pass after the broader D6 simplification work.

Before reference:
- `artifacts/design-progress-20260316-d7-simple/mobile_lobby_simple.png`
- `artifacts/design-progress-20260316-d7-simple/desktop_lobby_simple.png`

After captures:
- `mobile_lobby_minimal.png`
- `desktop_lobby_minimal.png`
- `desktop_lobby_advanced_open.png`

What changed in this pass:
- Quick Seat now exposes only the game picker and primary join/create action by default.
- Stakes, invite-only access, naming, and extra destinations moved behind the explicit advanced drawer.
- Live tables and tournament series now render as compact poker-room rows instead of tall card stacks.
- Richer detail still exists behind explicit advanced drawers for the user and the LLM.
