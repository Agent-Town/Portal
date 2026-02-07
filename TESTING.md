# Testing

## Default (recommended): deterministic mocked Solana wallet

All Playwright e2e tests should run without any real wallet keys or RPC access.
This repo includes a Phantom-style wallet mock (see `e2e/*` tests) that provides:
- `window.solana.connect()`
- `window.solana.signMessage()`

Run:
```bash
npm test
```

## Optional: real Solana wallet mode (local only)

If you need to run flows against real Solana RPCs (devnet/testnet/etc.), keep secrets **out of git**.

1) Put your keypair in a local, gitignored file, e.g.:
- `.secrets/solana-devnet.json`

2) Export env vars:
```bash
export SOLANA_TEST_KEYPAIR_PATH="$PWD/.secrets/solana-devnet.json"
export SOLANA_TEST_RPC_URL="https://api.devnet.solana.com"
# optional, if the test reset endpoint is enabled:
export TEST_RESET_TOKEN="test-reset"
```

3) Run tests (or a subset):
```bash
npm test -- e2e/08_claim_erc8004.spec.js
```

Notes:
- `.secrets/` is in `.gitignore` and must never be committed.
- CI/Codex workers should stick to the mocked wallet mode.
