# Phase 3 — ERC-8004 minting (real)

Goal: mint a canonical ERC-8004 identity / profile on Ethereum (or target chain) using the human’s wallet (no server keys).

## Required inputs (need confirmation from Robin)
- Target chain (Ethereum mainnet / Sepolia / other)
- ERC-8004 contract address
- Mint function signature + args (ABI)
  - e.g. `mint(address owner, bytes ... )` or `register(...)` etc.
- Any required fees / allowlists

## Implementation plan
- Add EVM wallet connect (window.ethereum)
- Add "Mint ERC-8004 identity" button
- Build calldata using minimal ABI encoder (or add a small dependency like viem)
- Send tx via `eth_sendTransaction`
- Store tx hash in the Room UI + (optional) server store keyed by roomId
- E2E test: mocked window.ethereum, asserts tx request called, tx hash displayed
