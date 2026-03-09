# Town Hall Mint Ops Handoff (Feb 18, 2026)

This document captures working behavior and hard-won debugging outcomes for the current Town Hall onboarding mint flow.

## Current architecture

- User ownership is preserved:
  - EVM and Solana registrations are initiated from the frontend with the user Privy wallets.
  - Backend never becomes owner of user/agent identities.
- Solana flow:
  - `/api/townhall/mint/solana/prepare` returns unsigned transaction payload.
  - Frontend signs with:
    - user Privy Solana wallet
    - local asset keypair (generated client-side)
  - Backend `/api/townhall/mint/solana/sponsor-send` adds sponsor fee-payer signature and broadcasts.

## Solana transaction format decision

- Single format path only (no compatibility branching):
  - Prepared transaction parsing is `web3.Transaction.from(...)`.
  - Signing path uses `partialSign(...)`.

## Critical config requirements

- Privy dashboard:
  - `http://localhost:4173` must be in allowed domains.
  - Gas sponsorship toggles do not remove all rent/lamport requirements for Solana account creation paths.
- CSP/connect:
  - Must allow Privy RPC hosts and Solana RPC endpoints in `connect-src`.
- Required env:
  - `PINATA_JWT`
  - `INFURA_ID` (or explicit `EVM_ERC8004_RPC_URL`)
  - `SOLANA_ERC8004_CLUSTER`
  - `SOLANA_ERC8004_RPC_URL`
  - `SOLANA_ERC8004_FEE_PAYER_SECRET`

## Solana sponsor-send guardrails now in place

- Fee-payer must be different from user wallet.
- Prepared tx must include valid user + asset signatures before sponsor send.
- Pending tx correlation:
  - Primary match: wallet + asset + message hash.
  - Safe fallback match: wallet + asset (when message hash drifts due to wallet-side blockhash refresh).
- Owner lamport funding:
  - Server can auto-top-up owner wallet from sponsor wallet when needed (`SOLANA_SPONSOR_AUTO_TOPUP=true`).
  - Default owner pre-fund target: `50_000_000` lamports (`SOLANA_SPONSOR_OWNER_MIN_LAMPORTS`).
  - If simulation returns `insufficient lamports X, need Y`, server computes shortfall, top-ups, and retries once.

## Common failures and direct meaning

- `Embedded wallet proxy not initialized`
  - Privy bootstrap/proxy issue (often domain allowlist, blocked third-party scripts, stale bridge state).
- `SOLANA_SPONSORED_TX_NOT_PREPARED`
  - Signed tx does not match latest prepared entry for current session.
  - Can happen with stale frontend bundle or hash drift.
- `SOLANA_SPONSOR_FEEPAYER_MATCHES_WALLET`
  - Sponsor key was set to user wallet by mistake.
- `Transfer: insufficient lamports ... need ...` in simulation logs
  - Funding shortfall in accounts used by registration instruction; server retry/top-up path should handle one shortfall cycle.

## Practical debugging commands

- Check runtime mint config:
  - `curl -sS http://localhost:4173/api/townhall/mint/config`
- Check sponsor balance:
  - `curl -sS -X POST https://api.devnet.solana.com -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"getBalance","params":["<SPONSOR_PUBKEY>",{"commitment":"confirmed"}]}'`
- Verify current frontend bundle version:
  - Open page source and confirm `app.js?v=...` is latest.

## Session hygiene that mattered

- Restart server after backend changes.
- Force fresh frontend load when bundle token changes.
- Keep Playwright mint flow coverage green after each mint-path change:
  - `e2e/36_townhall_registration.spec.js`
  - `e2e/37_townhall_live_mint.spec.js`
  - `e2e/45_townhall_sponsored_transaction_id.spec.js`
  - `e2e/46_townhall_solana_asset_partial_sign.spec.js`
