# Phase 3 — ERC-8004 minting (real)

Goal: mint a canonical ERC-8004 identity / profile on Ethereum (or target chain) using the human’s wallet (no server keys).

## What we use
- **Agent-Town fork** of Agent0 SDK at `vendors/agent0-ts` (git submodule)
- In-browser load via local bundle only:
  - `/public/vendor/agent0-sdk.mjs`
- Bundle build command:
  - `npm run build:agent0-sdk`

## Current behavior
- Chain selector: **Sepolia** (default) or **mainnet** (confirm dialog)
- Uses `window.ethereum` (MetaMask or compatible)
- Uses draft -> mint -> complete:
  1. `POST /api/erc8004/registration/draft` to create a stable HTTP `tokenUri` (registration-v1 JSON).
  2. SDK `createAgent(name, desc, image)` and `agent.setEntityType?.('house')` (when supported).
  3. `agent.registerHTTP(tokenUri)`.
  4. Waits for confirmation, parses on-chain `agentId`, then `POST /api/erc8004/registration/complete`.
- Persists minted identity locally per house (`localStorage`) and restores after reload.

## Follow-ups
- Add vault-backed encrypted persistence for minted identity records (optional hardening over local storage).
- Add richer tx UX (progress, failure modes, explorer links kept in UI).
