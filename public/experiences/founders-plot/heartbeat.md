# Founders Plot Heartbeat

## Runtime boundary

- Clover runs in-session only in V1.2.
- Clover does not keep acting after the page closes.
- If the page reloads, Clover needs a fresh runtime start.

## Human-facing promise

- When `COLLECT_READY_OUTPUTS` is enabled and this page remains open, Clover checks for ready outputs and may collect one safe output at a time.

## Cadence

- Default scheduler preset: `COLLECT_READY_OUTPUTS`.
- Default interval after a successful collect: 15 seconds.
- The worker should schedule from server-provided `nextRunAtMs`.
- The worker must not run overlapping ticks.

## Hidden-tab behavior

- Browser throttling may delay ticks while the tab is hidden.
- On return to visible, Clover may perform at most one immediate catch-up action if a task is due.
- Do not promise off-session automation.

## Retry and backoff

- On transient error: back off 5s, 10s, then cap at 30s.
- On `FOREMAN_RUNTIME_REQUIRED` or `STALE_RUNTIME`: stop the scheduler and ask the human to restart Clover.
- On `RATE_LIMITED`: respect `retryAfterMs` if present.

## Tool route rules

- Foreman mutations must go through the OpenClaw Lite worker path.
- Foreman mutation calls must include `OPENCLAW_LITE_WORKER` origin metadata.
- The server remains the source of truth.

## Recommended loop

1. Observe state and scheduler status.
2. If the preset is disabled or paused, wait.
3. If `nextRunAtMs` is in the future, wait until due.
4. If due and output is ready, run one worker-owned Foreman tick.
5. Record the receipt and return to waiting.
