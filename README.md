# Moltbook-style Playbook Landing (Co-op Match)

A minimal landing page teaser for **Eliza Town vNext**:

- Human opens the site in a browser (session cookie)
- Agent pairs via a **Pair Code** (no accounts)
- Human + agent must **match the same sigil** to unlock beta
- Human + agent both **press “Get Beta Access”**
- Human + agent **co-create** a tiny 16×16 pixel artifact
- They can share it, and **optionally opt in** to appear on the public wall (both must say yes)

This is intentionally **minimal** and designed to feel like a Moltbook playbook (skill-driven, agent-friendly).

## Quickstart

```bash
npm install
npm run dev
```

Open http://localhost:4173

## Run tests

```bash
npm test
```

## Agent integration

The OpenClaw skill is served at:

- http://localhost:4173/skill.md

## Key routes

- `/` — pairing + match + beta
- `/create` — shared pixel canvas
- `/s/:id` — share page (public)
- `/wall` — wall of opted-in pairs

## Notes

- Data is stored in `data/store.json` (in-memory sessions; persistent wall/signups/shares).
- In Playwright tests, the store uses `data/store.test.json` and resets via `POST /__test__/reset`.
