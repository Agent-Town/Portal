---
name: founders-plot.heartbeat
cadence: on-resume + on-user-action + periodic 120s
---

# Founders Plot — Heartbeat

The heartbeat is what the browser agent runtime follows when deciding whether
to act. It is intentionally small.

## Trigger order

1. **On player resume** — always call `et.plot.get_state` once.
2. **On player action** — refresh after a mutation tool returns.
3. **Scheduled tick** — every 120 seconds while the tab is visible.

## Decision gate

Each heartbeat tick:

1. Refresh state.
2. If any approval is pending for the agent, keep it pending and render the
   explanation. Do not re-request.
3. If any permission flag is enabled and the matching helpful condition is
   met, invoke the matching tool with a single-sentence explanation.
4. Otherwise, do nothing. Silence is valid.

## Helpful conditions

- **Collect outputs**: a building is in state `OUTPUT_READY` **and** its
  output will not overflow the storage cap.
- **Queue production**: a `READY` building is idle **and** the player's
  declared priority (or the current quest) benefits from its output **and**
  inputs are available.
- **Sell surplus food**: food is at or above storage cap - 5 **and** the
  daily coin cap has remaining budget.

## Rate limits

- No more than `policy.maxAutonomousActionsPerHour` autonomous actions per
  plot per hour.
- No more than one autonomous action per heartbeat tick.
- Honor `policy.emergencyPause` immediately (skip all mutations).
