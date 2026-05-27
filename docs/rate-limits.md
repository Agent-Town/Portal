# Rate Limits (Current State)

## Summary

- `/api/state` is **not** rate-limited by middleware.
- `/api/state` no longer performs `readStore()` and no longer returns signup/public-team stats.
- Most explicit request throttling is in `server/index.js` middleware and Pony inbox flow.
- There is also a worker-side tool limiter for `http_request` fallback proxy calls.

## `/api/state` hot path (current)

Route:
- `/Users/robin/.codex/worktrees/d83e/Portal/server/index.js` (`app.get('/api/state', ...)`)

Current behavior:
- Uses only in-memory session state (`ensureHumanSession`, lite/onboarding/ceremony/experience snapshots).
- Does not read global store tables per request.
- Does not compute `stats.signups` or `stats.publicTeams`.

Implication:
- `/api/state` latency should now reflect normal request handling, not full-store JSON deserialization.

Note:
- `/api/session` and `/api/session/reset` still read store stats today and are separate from `/api/state`.

## Active server rate limits

Middleware implementation:
- `/Users/robin/.codex/worktrees/d83e/Portal/server/index.js` (`rateLimit({ windowMs, max, keyFn })`)

Headers when active:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- On reject: `Retry-After`, response `429 { ok: false, error: 'RATE_LIMITED' }`

Configured middleware limits:

| Scope | Window | Max | Key |
|---|---:|---:|---|
| `/api/agent` | 60s | 1200 | `agent:${req.ip}` |
| `/api/house` | 60s | 180 | `house:${req.ip}` |
| `/api/share/create` | 60s | 60 | `share:${req.ip}` |
| `/api/token` | 60s | 30 | `token:${req.ip}` |
| `/api/wallet` | 60s | 30 | `wallet:${req.ip}` |
| `/api/house/init` | 60s | 20 | `house-init:${req.ip}` |

## World-grid prototype mutation limit

Implementation:
- `/Users/robin/.codex/worktrees/657c/Portal/server/world_grid/rate_limit.js`

Scope:
- Mutating V5.1+ `/api/world/*` routes and mutating
  `/api/world/tool/:toolName` calls.

Behavior:
- Default process-local window: 60 seconds.
- Default max: 30 requests per owner and mutation surface.
- Exact idempotent world-grid mutation replays are detected before rate-limit
  consumption and return `x-world-grid-idempotency-replay: 1` without consuming
  another bucket hit.
- Changed-payload reuse of an idempotency key still passes through the mutation
  limiter before returning the conflict error.
- Environment overrides:
  - `WORLD_GRID_MUTATION_RATE_LIMIT_WINDOW_MS`
  - `WORLD_GRID_MUTATION_RATE_LIMIT_MAX`
  - `WORLD_GRID_RATE_LIMIT_SQLITE_PATH` for optional durable owner/surface
    counters in the V5 hardening baseline
  - `WORLD_GRID_RATE_LIMIT_IDENTITY_MODE=owner_session_ip_risk` or
    `WORLD_GRID_RISK_AWARE_RATE_LIMIT=1` for optional owner/session/IP/risk
    bucket identity. Session and IP values are hashed before storage; raw
    session/IP values are not persisted in bucket rows.
- On reject: `Retry-After`, response `429 { ok: false, error: { code:
  'RATE_LIMITED' } }`.

Release note:
- Process-local buckets are prototype abuse resistance only. Optional
  `WORLD_GRID_RATE_LIMIT_SQLITE_PATH` durable counters prove owner/surface
  restart persistence, exact idempotent replays no longer burn another bucket
  hit, and optional hashed owner/session/IP/risk identity gives the release
  target a privacy-safe foundation. V5/V6 release promotion still needs counters
  bound to the final browser session, wallet/owner identity, trusted proxy/risk
  signal wiring, and production operational tuning.
  `server/world_grid/rate_limit_rollout.js` names the non-executing release
  target for trusted proxy header ownership, risk-signal ownership, distributed
  counters, per-surface budget calibration, abuse-burst backoff, and
  privacy-safe production observability.

## Pony message rate limit

Implementation:
- `/Users/robin/.codex/worktrees/d83e/Portal/server/index.js`
- `PONY_RATE_WINDOW_MS = 60_000`
- `PONY_RATE_MAX_PER_PAIR = 20`
- `checkPonyRateLimit({ senderKey, toHouseId })`

Applied in:
- `/api/pony/send`

Behavior:
- Keyed by sender-target pair: `${senderKey}->${toHouseId}`
- On reject: `429 { ok: false, error: 'RATE_LIMITED_PONY', retryAfter }`

## Worker/runtime-side rate limit (OpenClaw)

Implementation:
- `/Users/robin/.codex/worktrees/d83e/Portal/vendors/openclaw-lite-main/src/openclaw-lite/worker.js`
- `HTTP_RATE_LIMIT_WINDOW_MS = 1000`
- `HTTP_RATE_LIMIT_MAX = 50`
- `consumeHttpRateLimit(url)`

Behavior:
- Applies to `http_request`/`web_fetch` proxy fallback path by origin.
- Effective threshold: up to 50 fallback requests per origin per 1-second window.
- Same-origin requests that succeed directly do not hit this limiter.
- Returns tool error code `RATE_LIMIT` with `retryAfterMs`.

Synced runtime artifact:
- `/Users/robin/.codex/worktrees/d83e/Portal/public/openclaw-lite/worker.js`

## Endpoints not currently middleware-rate-limited

Examples:
- `/api/state`
- `/api/session`
- `/api/atlas/*`

These may still be slow due to CPU/IO hot paths (not throttling).
