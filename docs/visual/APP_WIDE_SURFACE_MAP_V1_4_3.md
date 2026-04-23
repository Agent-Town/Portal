# Agent Town V1.4.3 — App-Wide Surface Map

This document maps non-game app surfaces to assets and routes.

## Current known surfaces

The repository currently exposes public routes and view fragments for the main app shell and district surfaces. The current branch includes a `public/assets/platform` directory with platform assets, a `public/assets/hero-cast` directory with hero cast images, and `public/views` entries for Brain, House, Leaderboard, Pony, Saloon, Sigil, and Town Hall.

## Surface map

| Surface | Primary route / fragment | Current visual role | V1.4.3 production asset |
|---|---|---|---|
| Start Gate | `public/start.html` | first product impression | `/assets/platform/start_gate/start-gate-hero-v1_4_3.webp` |
| Town Shell | `public/index.html`, `public/app.js`, `public/styles.css` | district hub | `/assets/platform/town_shell/town-shell-background-v1_4_3.webp` |
| Town Hall | `public/views/townhall.html` | onboarding / identity / ceremony | `/assets/platform/townhall/townhall-onboarding-illustration-v1_4_3.webp` |
| Brain | `public/views/brain.html` | LLM/model/provider connection | `/assets/platform/brain/brain-connect-illustration-v1_4_3.webp` |
| House | `public/views/house.html`, `public/house.html`, `public/claim-wallet.html`, `public/share.html` | home/private place | `/assets/platform/house/house-claim-share-illustration-v1_4_3.webp` |
| Pony Express | `public/views/pony.html`, `public/inbox.html` | private notes | `/assets/platform/pony/pony-express-illustration-v1_4_3.webp` |
| Saloon | `public/views/saloon.html` | future experiences hub | `/assets/platform/saloon/saloon-future-games-hub-v1_4_3.webp` |
| Sigil | `public/views/sigil.html` | co-op unlock ritual | `/assets/platform/sigil/sigil-ceremony-illustration-v1_4_3.webp` |
| Atlas | `public/atlas.html`, modal route via `public/app.js` | discovery / map | `/assets/platform/atlas/atlas-leaderboard-illustration-v1_4_3.webp` |
| Leaderboard | `public/views/leaderboard.html`, `public/leaderboard.html` | rankings / civic board | `/assets/platform/atlas/atlas-leaderboard-illustration-v1_4_3.webp` |
| Generic empty states | `public/share.html`, `public/styles.css` | empty/loading/error ornamentation | `/assets/platform/generic/ui-ornaments-empty-states-v1_4_3.webp` |
| Brand hero cast | `public/start.html`, `public/styles.css` | platform identity strip and shelf texture | `/assets/hero-cast/*.webp` |
