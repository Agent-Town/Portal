# Live-Lane Audit

This document describes what the live suites in this repo verify, which shortcuts were removed, and which remaining boundaries are local harness choices rather than mocks.

## Live suites

### `privy-guest`

Command:

```bash
npm run test:privy-live
```

What it verifies:

- real Privy guest login from `/start`
- redirect into `/app`
- creation and reuse of Privy-backed Solana and EVM wallets
- session continuity when returning to `/start`

What is deliberately **not** used anymore:

- no deterministic guest Privy bridge
- no `/__test__/reset`
- no `NODE_ENV=test`
- no `ENABLE_PRIVY_IN_TEST`

Remaining local harness boundaries:

- the app still runs locally on `http://localhost:<port>`
- the suite uses a dedicated local SQLite store path that is deleted before startup
- the browser context is Playwright-controlled, not a deployed browser session

These are harness boundaries, not product mocks. The external identity and wallet provisioning still come from Privy.

### `privy-email-otp`

Command:

```bash
npm run test:privy-email-live
```

What it verifies:

- real Privy email-code login from `/start`
- redirect into `/app`
- creation and reuse of Privy-backed Solana and EVM wallets
- no second OTP prompt on re-entry during the same run

What it does **not** use:

- no deterministic guest bridge
- no `/__test__/reset`
- no test-only Privy enable flag

Remaining local harness boundaries:

- the app runs locally with an isolated store path
- OTP retrieval is delegated to a caller-supplied HTTP JSON endpoint via `PRIVY_EMAIL_OTP_FETCH_URL`

The OTP endpoint is not shipped by this repo. It must be backed by a real mailbox or provider integration if this lane is used as a real-world release check.

### `sepolia-wallet`

Command:

```bash
npm run test:sepolia-live
```

What it verifies:

- the local configured Sepolia wallet file is stable
- the configured wallet address is valid
- the wallet has at least the required Sepolia ETH balance over a real RPC endpoint

What it does **not** verify:

- it is not a full in-app user journey
- it does not boot the Agent Town server
- it does not exercise Privy or wallet UI

This suite is a readiness check for wallet-backed flows, not a complete product smoke.

## Removed false-live behavior

The previous guest live lane was not fully live. It ran the app under `NODE_ENV=test`, which caused `/api/privy/config` to expose `testMode`, and the frontend then selected the deterministic guest bridge in `public/privy_bridge.js`.

That path is no longer used by the live guest suite.

## Remaining blockers to claiming true live confidence

The code can now run the live lanes without built-in mocks or stubs, but this workspace still needs real environment configuration before those lanes can be executed successfully:

- `PRIVY_APP_ID`
- `PRIVY_LOGIN_METHOD`
- `PRIVY_EMAIL_OTP_PROVIDER`
- `PRIVY_EMAIL_OTP_FETCH_URL`
- `PRIVY_EMAIL_OTP_TEST_EMAIL`
- `REAL_SEPOLIA_WALLET_TEST=1`
- `SEPOLIA_TEST_WALLET_ADDRESS`

Preflight commands:

```bash
npm run test:live:status
node scripts/test_live.js --check privy-guest
node scripts/test_live.js --check privy-email-otp
node scripts/test_live.js --check sepolia-wallet
```

Only after those checks are ready should the real live suites be treated as release evidence.
