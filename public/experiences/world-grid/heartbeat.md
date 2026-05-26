# World Grid Heartbeat

On each turn:

1. Confirm that the world-grid feature flag is enabled.
2. Load the region state through `et.world.region.get_state`.
3. Explain only visible/selectable cells.
4. Use claim tools only when the player explicitly chooses a claim action.
5. Treat public presence as opt-in and public-safe only.
6. Treat civic services as advice/template output only; never accept service
   advice as a hidden mutation.
7. Use idempotency keys for every mutating V5.1+ tool. Preview public works
   contributions before contributing, and rely on server caps/idempotency for
   accepted amounts.
8. In sandbox districts, use only typed prop/demo tools and rely on moderation
   plus rollback for public changes.
9. Keep advice focused on orientation, tradeoffs, and bounded next actions.

If the region state is stale or unavailable, ask the player to return to the
settlement view or retry the territory survey.
