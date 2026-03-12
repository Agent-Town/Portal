# Agent Town Landing (Co-op + Houses)

A minimal landing page for Agent Town with two entry paths:
- Co-op unlock with a human + OpenClaw agent (Team Code + sigil match + dual Open press).
- Token-holder solo unlock using $ELIZATOWN on Solana.

The only identity is a session cookie for the human and a Team Code for the agent. No external auth providers.

## Flow summary
1. Human visits `/` and gets a Team Code (session cookie `et_session`).
2. Agent connects via API, matches the same sigil, and both press Open.
3. `/create` opens a 16x16 co-op pixel canvas to generate entropy.
4. House ceremony combines human + agent entropy to derive a `houseId` and shared keys.
5. `/house?house=...` unlocks with a Privy-backed Solana wallet signature and shows a descriptor QR, ERC-8004 statement, and optional ERC-8004 mint (Agent0 SDK).
6. Create a public share link and show up on the leaderboard; referrals are counted.

Token-holder path:
Use the token check on `/` to verify a Solana wallet holds $ELIZATOWN, then create a house without an agent via `/create?mode=token`.

## Quickstart
```bash
npm install
npm run dev
```

Open http://localhost:4173

## Docs
- Docs home: `docs/README.md`
- Getting started: `docs/getting-started.md`
- Which provider should I pick?: `docs/which-provider.md`
- Provider reference: `docs/providers/README.md`

When Privy is configured (`PRIVY_APP_ID` set), `/` serves the start page:
- logo + hero video + "Welcome to the Wild West!"
- `Enter` triggers Privy login
- successful login redirects to `/app` (current landing/index experience)

## Privy credentials (.env)
Use a local `.env` file for Privy credentials.

1. Copy `.env.example` to `.env`.
2. Set:
   - `PRIVY_APP_ID` (public)
   - `PRIVY_CLIENT_ID` (optional/public)
   - `PRIVY_APP_SECRET` (private/server-only)
3. Restart the dev server.

Server-side loading order:
- `.env`
- `.env.<NODE_ENV>`
- `.env.local`
- `.env.<NODE_ENV>.local`

Browser-safe config is exposed at `GET /api/privy/config` (public fields only). `PRIVY_APP_SECRET` is never returned.

## Tests
```bash
npm test
```

Tests reset state via `POST /__test__/reset` (header `x-test-reset` uses `TEST_RESET_TOKEN`, default `test-reset`).

Live Privy guest-login smoke (real `.env`, no OTP):
```bash
npm run test:privy-live
```

Optional live Privy email-OTP smoke (real `.env` plus OTP provider adapter):
```bash
npm run test:privy-email-live
```

Machine-readable live-suite manifest and setup checker:
```bash
npm run test:live -- --list
npm run test:live -- --check privy-email-otp
```

Structural and durable-store verification helpers:
```bash
npm run verify:route-modules
npm run verify:platform-export
```

Requirements for the live Privy smoke:
- set `PRIVY_APP_ID` in `.env` or `.env.local`
- set `PRIVY_LOGIN_METHOD=guest` to avoid OTP during Playwright
- allow `http://localhost:4175` in the Privy app origin/domain allowlist
- optionally set `PRIVY_CLIENT_ID`

What `npm run test:privy-live` does:
- loads `.env*` and starts an isolated local app server in development mode
- forces `PRIVY_LOGIN_METHOD=guest` for the suite
- deletes the dedicated live SQLite store before server boot so the run starts clean without `/__test__/reset`
- verifies `/start` login, redirect to `/app`, and real Privy-provided Solana + EVM wallet availability without the deterministic test bridge

What `npm run test:privy-email-live` requires:
- set `PRIVY_EMAIL_OTP_TEST_EMAIL`
- set one supported `PRIVY_EMAIL_OTP_PROVIDER`
- provider options:
  - `http-json`: set `PRIVY_EMAIL_OTP_FETCH_URL`
  - `imap`: set `PRIVY_EMAIL_OTP_IMAP_HOST` and `PRIVY_EMAIL_OTP_IMAP_PASSWORD`
  - `gmail-imap`: set `PRIVY_EMAIL_OTP_IMAP_PASSWORD` and use a Gmail app password
- the suite forces `PRIVY_LOGIN_METHOD=email` internally
- `imap` and `gmail-imap` read the mailbox directly during the live lane, so no separate OTP bridge service is required

Optional local integration check (reused Sepolia wallet):
```bash
npm run test:sepolia-live
```

Optional operator-assisted House worker live gate:
```bash
npm run test:house-worker-live
```

What `npm run test:house-worker-live` requires:
- a running local or staging Agent Town server that keeps the real session store intact
- `HOUSE_WORKER_LIVE_BASE_URL`
- `HOUSE_WORKER_LIVE_STORAGE_STATE`
- `HOUSE_WORKER_LIVE_PROVIDER`
- `HOUSE_WORKER_LIVE_MODEL`
- `HOUSE_WORKER_LIVE_API_KEY`
- a saved Playwright `storageState` file captured from a real session with a house attached and an active team selected

What the House worker live gate does:
- reopens a real saved session against the live server
- configures a real local helper brain through the product UI if the current browser is not ready yet
- verifies helper live-readiness before install
- installs one Registry worker package, starts it, asks for one short reply, then stops it again
- avoids `__test__` helper shortcuts and seeded fake success

Notes:
- Setup command:
```bash
npm run setup:sepolia-wallet
```
- Fresh setup auto-generates an EVM private key + address and stores it in `data/local.sepolia.wallet.json`.
- If that file is missing or still contains placeholder values, the live lane treats Sepolia as "not configured yet" instead of ready.
- If balance is below threshold on fresh generation, setup attempts a Google Sepolia faucet request automatically.
- Test checks on-chain Sepolia ETH balance and fails with the faucet URL if below threshold.
- Override threshold with `MIN_SEPOLIA_ETH` (default `0.001`).
- Non-interactive setup (automation):
```bash
npm run setup:sepolia-wallet -- --no-balance-check
```

Live-lane boundary audit and remaining external prerequisites:
```bash
cat docs/live_lane_audit.md
```

- Provide your own wallet:
```bash
npm run setup:sepolia-wallet -- --address 0x...
```
- Disable faucet automation:
```bash
npm run setup:sepolia-wallet -- --no-faucet
```

## Agent integration
- The agent skill is served at `/skill.md` (source: `public/skill.md`).
- Core agent endpoints: `/api/agent/connect`, `/api/agent/state`, `/api/agent/select`, `/api/agent/open/press`.
- Co-op actions: `/api/agent/canvas/paint`, `/api/agent/house/*`.
- House API auth and ceremony details are documented in `specs/02_api_contract.md`.

## Trainer namespace toggle
You can enable/disable `trainer.*` tools with either URL params or localStorage.

- URL query param:
  - `?trainerNamespace=1` enables
  - `?trainerNamespace=0` disables
  - aliases also supported: `trainer_namespace`, `trainer-tools`, `trainerTools`
- localStorage override key: `agentTown:feature:trainerNamespace`
  - set `"true"` to enable
  - set `"false"` to disable
  - remove the key to clear the override

Browser console examples:

```js
localStorage.setItem('agentTown:feature:trainerNamespace', 'true');  // enable
localStorage.setItem('agentTown:feature:trainerNamespace', 'false'); // disable
localStorage.removeItem('agentTown:feature:trainerNamespace');       // clear override
```

Resolution precedence:
- localStorage override
- URL query param
- default behavior

## Key routes
- `/` — onboarding, Team Code, token check, reconnect.
- `/start` — start page (logo/video/welcome + Enter -> Privy login).
- `/app` — current landing/onboarding page after start/login.
- `/create` — co-op canvas + house generation.
- `/house` — house unlock, descriptor QR, ERC-8004, encrypted log.
- `/s/:id` — public share page.
- `/leaderboard` — public teams and referrals (`/wall` redirects here).

## Data + storage
- Store file: `data/store.sqlite` (or `STORE_PATH`).
- Test store: `data/store.test.sqlite` when `NODE_ENV=test`.
- Legacy `data/store.json` is imported automatically on first boot (non-test) if the SQLite store is empty.
- Session state is in memory; signups/shares/public teams/houses persist in the store.

## Security model (data)
House entries are end-to-end encrypted. The server only stores ciphertext and never sees plaintext.

What the server stores:
- Encrypted house log entries (`ciphertext` only).
- House metadata, including a wallet-wrapped `K_root` (`keyWrap`) for recovery.
- `houseAuthKey` (HMAC key) for authenticating `/api/house/:id/*` requests.

What the server does not store:
- The raw `K_root` or `K_enc` used to decrypt entries.
- Any unencrypted house content.
- The `keyWrapSig` (clients re-sign the wrap message during recovery).

Unlocking a house in the UI is gated by a Privy-backed Solana wallet signature. Decryption happens client-side after deriving keys from the ceremony materials.

## Environment variables
- `PORT` (default `4173`)
- `NODE_ENV` (`production` enables HTTPS redirect + HSTS; `test` enables reset endpoint)
- `STORE_PATH` (override store file)
- `SOLANA_RPC_URL` (token check RPC, default mainnet-beta)
- `PRIVY_APP_ID` (public Privy app id for browser wallet bridge bootstrap)
- `PRIVY_CLIENT_ID` (optional public Privy client id)
- `PRIVY_APP_SECRET` (private Privy server credential; never exposed by this app)
- `PRIVY_PUBLIC_CONFIG_JSON` (optional JSON object merged into public Privy config)
- `PRIVY_SDK_SCRIPT_URL` (optional browser SDK script URL loaded by `public/privy_bridge.js`)
- `PRIVY_SDK_MODULE_URL` (optional ESM module URL for Privy JS SDK, default `https://esm.sh/@privy-io/js-sdk-core@0.60.0?bundle`)
- `PRIVY_LOGIN_METHOD` (`email` or `guest`, default `email`)
- `START_PAGE_ENABLED` (default: enabled when `PRIVY_APP_ID` is set)
- `ENABLE_PRIVY_IN_TEST` (default `false`; test env disables Privy bridge unless this is explicitly enabled)
- `LOAD_DOTENV_IN_TEST` (default `false`; when `true`, test-mode servers also load `.env*` files)
- `CSP_SCRIPT_SRC_EXTRA` (optional comma-separated extra `script-src` entries)
- `CSP_CONNECT_SRC_EXTRA` (optional comma-separated extra `connect-src` entries)
- `CSP_FRAME_SRC_EXTRA` (optional comma-separated extra `frame-src` entries)
- `TEST_RESET_TOKEN` (required for `/__test__/reset` in tests)
- `TEST_TOKEN_ADDRESS` (test-only override for token-holder flow)

## Specs
- API contract: `specs/02_api_contract.md`
- Experience flow: `specs/01_experience_flow.md`
- TDD milestones: `specs/04_tdd_milestones.md`
- District map + storefront: `specs/11_district_map_storefront_spec.md`
