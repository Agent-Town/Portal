# OpenClaw Lite

Web-first **OpenClaw Lite** runtime (browser Worker + minimal server storage) with:
- PI (pi-mono) hard requirement (PI agent loop + PI-AI providers).
- Deterministic Playwright milestones (TDD).
- Encrypted server-hosted **vault backups** (server stores ciphertext only).
- OpenClaw-compatible exports (workspace + sessions JSONL).
- Same-origin OpenAI-compatible LLM proxy (no API keys persisted server-side).

## Quick Start

Prereqs:
- Node `>=22.12.0`
- Git (for the vendored OpenClaw submodule)

```bash
git clone https://github.com/Agent-Town/openclaw-lite.git
cd openclaw-lite

git submodule update --init --recursive

npm install
npm test
npm run dev
```

Open:
- Gateway Panel: `http://localhost:4173/lite`
- Town grid: `http://localhost:4173/town`

## Vendored OpenClaw (Security + Compatibility)

This repo vendors OpenClaw as a **git submodule** at `vendor/openclaw-main`.

Why:
- Export compatibility is validated against OpenClaw’s on-disk formats.
- Transcript hygiene uses OpenClaw’s source-of-truth repair implementation:
  `vendor/openclaw-main/src/agents/session-transcript-repair.ts`
- PI package versions are pinned to match OpenClaw’s pinned PI versions.

Update workflow (when OpenClaw/PI changes):
1. Update the submodule checkout in `vendor/openclaw-main`.
2. Run `npm test`.
3. Commit the submodule pointer bump.

The Playwright suite will fail if PI versions drift.

## No Mocks Policy

- Runtime: real PI agent loop + real crypto.
- Wallet in e2e: a real Ed25519 wallet (deterministic seed) is provisioned via `GET /__test__/wallet/seed`.
- LLM in e2e: the runtime still calls the OpenAI-compatible proxy, but `NODE_ENV=test` makes the server respond deterministically.

## Structure

- `public/`: Gateway + town UI routes (`/lite`, `/town`, `/house`).
- `src/openclaw-lite/`: Worker runtime + UI scripts (bundled with esbuild).
- `src/openclaw-wallet/`: local Solana-style `signMessage` wallet (real Ed25519) for deterministic e2e.
- `server/`: Express API + server storage.
- `specs/`: runtime + API specifications.
- `e2e/`: Playwright acceptance tests (definition of done).
