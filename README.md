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
5. `/house?house=...` unlocks with a Solana wallet signature and shows a descriptor QR, ERC-8004 statement, and optional ERC-8004 mint (Agent0 SDK).
6. Create a public share link and show up on the leaderboard; referrals are counted.

Token-holder path:
Use the token check on `/` to verify a Solana wallet holds $ELIZATOWN, then create a house without an agent via `/create?mode=token`.

## Quickstart
```bash
npm install
npm run dev
```

Open http://localhost:4173

## Tests
```bash
npm test
```

Tests reset state via `POST /__test__/reset` (header `x-test-reset` uses `TEST_RESET_TOKEN`, default `test-reset`).

Optional local integration checks (reused wallets):
```bash
REAL_SEPOLIA_WALLET_TEST=1 npx playwright test e2e/10_sepolia_wallet_reuse.spec.js
REAL_SOLANA_WALLET_TEST=1 npx playwright test e2e/13_solana_wallet_reuse.spec.js
```

Notes:
- Setup EVM wallet:
```bash
npm run setup:sepolia-wallet
```
- Fresh setup auto-generates an EVM private key + address and stores it in `data/local.sepolia.wallet.json`.
- If balance is below threshold on fresh generation, setup attempts a Google Sepolia faucet request automatically.
- Test checks on-chain Sepolia ETH balance and fails with the faucet URL if below threshold.
- Override threshold with `MIN_SEPOLIA_ETH` (default `0.001`).
- Non-interactive setup (automation):
```bash
npm run setup:sepolia-wallet -- --no-balance-check
```
- Provide your own wallet:
```bash
npm run setup:sepolia-wallet -- --address 0x...
```
- Disable faucet automation:
```bash
npm run setup:sepolia-wallet -- --no-faucet
```
- Setup Solana devnet wallet:
```bash
npm run setup:solana-wallet
```
- Fresh setup auto-generates a Solana secret key + address and stores it in `data/local.solana.devnet.wallet.json`.
- If balance is below threshold on fresh generation, setup attempts a Solana devnet faucet request automatically.
- Test checks on-chain Solana devnet balance and fails with the faucet URL if below threshold.
- Override threshold with `MIN_SOLANA_DEVNET_SOL` (default `0.1`).
- Non-interactive setup (automation):
```bash
npm run setup:solana-wallet -- --no-balance-check
```
- Provide your own wallet address:
```bash
npm run setup:solana-wallet -- --address <base58>
```
- Provide your own secret key:
```bash
npm run setup:solana-wallet -- --secret-key <base58-or-json-array>
```
- Disable faucet automation:
```bash
npm run setup:solana-wallet -- --no-faucet
```

## Agent integration
- The agent skill is served at `/skill.md` (source: `public/skill.md`).
- Core agent endpoints: `/api/agent/connect`, `/api/agent/state`, `/api/agent/select`, `/api/agent/open/press`.
- Co-op actions: `/api/agent/canvas/paint`, `/api/agent/house/*`.
- House API auth and ceremony details are documented in `specs/02_api_contract.md`.

## Key routes
- `/` — onboarding, Team Code, token check, reconnect.
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

Unlocking a house in the UI is gated by a Solana wallet signature. Decryption happens client-side after deriving keys from the ceremony materials.

## Environment variables
- `PORT` (default `4173`)
- `NODE_ENV` (`production` enables HTTPS redirect + HSTS; `test` enables reset endpoint)
- `STORE_PATH` (override store file)
- `SOLANA_RPC_URL` (token check RPC, default mainnet-beta)
- `TEST_RESET_TOKEN` (required for `/__test__/reset` in tests)
- `TEST_TOKEN_ADDRESS` (test-only override for token-holder flow)

## Specs
- API contract: `specs/02_api_contract.md`
- Experience flow: `specs/01_experience_flow.md`
- TDD milestones: `specs/04_tdd_milestones.md`
