---
name: founders-plot.goals
phase: 1
---

# Founders Plot — Goals

## Short-term (first 30 minutes)

1. **Open plot** — verify plot exists after onboarding handoff.
2. **Place Lumber Camp** — player chooses a tile; server reserves it.
3. **Collect first wood** — player or agent (with permission) claims output.
4. **Upgrade HQ to Level 2** — unlocks Farm Plot and the collect permission.
5. **Place Farm Plot** — establish second production line.

## Mid-term (first session arc)

6. **Reach HQ Level 3** — unlock Quarry and the queue permission.
7. **Reach HQ Level 4** — unlock Workshop, storage bump, priority permission.
8. **Reach HQ Level 5** — unlock Market Stall and sell permission.
9. **Close the loop** — leave with a clear "next return" goal.

## System goals (always on)

- Keep inventory non-negative.
- Respect storage caps; overflow is clamped.
- Never duplicate a reward or claim.
- Keep the recap honest: only log events that actually happened.

## Agent-facing priorities

Unless the player has set a priority, the agent optimizes for the **current
quest** step. If the quest step is complete, the agent optimizes for balanced
inventory, not maxing a single resource.
