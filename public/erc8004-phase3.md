# Phase 3 — ERC-8004 minting (real)

Goal: mint a canonical ERC-8004 identity / profile on Ethereum (or target chain) using the human’s wallet (no server keys).

## What we use
- **Agent-Town fork** of Agent0 SDK at `vendors/agent0-ts` (git submodule)
- In-browser load via local bundle only:
  - `/public/vendor/agent0-sdk.mjs`
- Bundle build command:
  - `npm run build:agent0-sdk`

## Current behavior (MVP)
- Chain selector: **Sepolia** (default) or **mainnet** (confirm dialog)
- Uses `window.ethereum` (MetaMask or compatible)
- Calls SDK `createAgent(name, desc)` and then **mints/registers** via:
  - `agent.registerHTTP('')` (empty URI for now)
- Waits for confirmation and then populates `humanErc8004` in the Phase 2 statement with the returned `agentId`.

## Follow-ups
- Host a real ERC-8004 registration JSON (HTTP) or use IPFS via SDK `registerIPFS()` once we add IPFS config.
- Persist minted `humanErc8004` in server store keyed by `roomId` (optional; note privacy implications).
- Add richer tx UX (progress, failure modes, explorer links kept in UI).
