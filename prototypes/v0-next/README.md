# Agent Town v0 Next Prototype

This folder contains a standalone Next.js App Router prototype used to iterate on the combined UX from:

- `codex/experience_trainer`
- `codex/erc8004-district-storefronts`

The goal is rapid visual/interaction exploration in v0-style workflows while preserving the current website information architecture:

- `/` town hub + district modal patterns
- `/atlas` district map + storefront discovery
- `/house` house/claim/media flow shell
- `/leaderboard` leaderboard surface
- `/share/[id]` public share shell
- `/trainer` experience trainer shell

## Run

```bash
cd /Users/robin/.codex/worktrees/d83e/Portal/prototypes/v0-next
npm install
npm run dev
```

Server starts on `http://localhost:4300`.

## Notes

- This prototype is intentionally mock-data-driven (`lib/mockData.js`) and does not call backend APIs.
- It keeps the one-web-app interaction model with a persistent dock and route-level surfaces.
- Use this as design input for v0 and then port approved UI deltas back into `/public` + `/server` implementation.
