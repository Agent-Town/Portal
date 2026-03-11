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
- the configured private key matches that address
- the wallet has at least the required Sepolia ETH balance over a real RPC endpoint

What it does **not** verify:

- it is not a full in-app user journey
- it does not boot the Agent Town server
- it does not exercise Privy or wallet UI

This suite is a readiness check for wallet-backed flows, not a complete product smoke.

If `data/local.sepolia.wallet.json` is missing or still contains placeholder values, the lane should be treated as "private wallet not configured yet", not as a product failure.

## House flows are manual-live, not fake-live

There is intentionally no automated external "house live lane" in this repo yet.
Attaching a real house still depends on a real user/session journey, so pretending that a `__test__` helper or seeded session proves live House behavior would be misleading.

Instead, House flows use a session-bound readiness report plus a manual validation checklist:

- `GET /api/platform/house-readiness`
- the `House readiness` panel in the House Console

What that readiness report verifies:

- whether the current live session has an attached house
- whether an active team is selected
- whether House Office, Workshop, Tracks, Archive, Trainer, and Experiences are ready for in-shell validation
- per-surface route evidence:
  - `routeOk`
  - `dataOk`
  - `selectionOk`
  - `browserValidationRequired`
  - `blockedBy[]`
- which district sections should be reachable during the walkthrough
- the exact manual validation steps and success metrics an operator should use

Recommended House validation sequence:

1. open the House Console in `/app?district=house`
2. confirm the readiness summary no longer reports `HOUSE_REQUIRED` or `ACTIVE_TEAM_REQUIRED`
3. open `House Office` and confirm the selected-office card, briefing, attention, and office map render inside `/app`
4. follow one briefing citation and confirm the shell stays in `/app`
5. open `Workshop`, `Tracks`, `Archive`, and `Trainer` and confirm the same active team context is preserved

This is the honest boundary today:

- automated deterministic coverage proves the House shell and contracts
- the readiness report proves whether a current live session is ready for operator validation
- the final user-level walkthrough is still manual until a true external House live lane exists

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
- `data/local.sepolia.wallet.json` configured through `npm run setup:sepolia-wallet`

Preflight commands:

```bash
npm run test:live:status
node scripts/test_live.js --check privy-guest
node scripts/test_live.js --check privy-email-otp
node scripts/test_live.js --check sepolia-wallet
```

Only after those checks are ready should the real live suites be treated as release evidence.
