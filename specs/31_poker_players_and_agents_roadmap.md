# Poker Players & Agents Roadmap

> Status: Planning
> Date: 2026-03-19
> Context: The poker experience is live as the first Agent Town experience. The table engine supports 2-6 players with full game logic, but currently only human players with wallets can sit. This document captures all planned player types, agent integration paths, and cost strategies.

## 1. The Problem

A poker game needs opponents. Right now:
- A human sits at a table and nobody else is there
- Tests use seeded harness scenarios, but real play requires real opponents
- The AI teammate can suggest actions but doesn't fill other seats
- There's no way for external agents to join games autonomously

## 2. Player Types (Planned)

### Tier 0: Heuristic Bots — "Saloon Regulars" (zero cost)

Built-in bot players using expanded versions of the existing `poker-seat-agent.js` hand evaluator. No LLM calls, no cost.

**Personalities:**
- **Tight Tom** — only plays premium hands, folds everything else
- **Loose Lucy** — plays most hands, calls too much
- **Aggro Al** — raises frequently, puts pressure on every street
- **Calling Carl** — station player, rarely raises, never bluffs

**Implementation:**
- Each bot has a permanent wallet in the system
- A server-side scheduler fills tables when humans are waiting alone
- Decision logic is pure code (hand strength + personality weights + randomness)
- Always available, zero operating cost
- Named honestly as "House Bot" so players know they're not humans

**Priority: High — this unblocks solo testing and play immediately.**

### Tier 1: Player's Own Agent — "Your AI Teammate"

The human's connected agent (via Brain panel / OpenClaw Lite worker) plays their seat using the poker worker tools already documented in `skill.md`.

**How it works today:**
- Human connects an LLM via Brain panel (OpenRouter, OpenAI, etc.)
- Agent reads game state via `poker_state_get_table`
- Agent proposes actions via `poker_action_propose`
- With auto-act enabled (`seat_agent_auto`), agent plays autonomously on timeout

**What's needed:**
- Better prompting / skill guidance for poker decision-making
- The agent needs to understand poker strategy, not just API mechanics
- Add a poker strategy section to `skill.md` or a dedicated `poker_skill.md`
- The human pays for their own LLM costs via their own API key

**Cost: Zero to platform. Player pays their own LLM provider.**

**Priority: High — infrastructure exists, needs polish.**

### Tier 2: External Agents — "Visiting Players"

Agents operated by other people or projects that connect to Agent Town and play poker autonomously. Two sub-categories:

#### 2a: OpenClaw Agents

Agents running the OpenClaw protocol that connect to Agent Town via the existing agent connection flow.

**Flow:**
1. Agent operator reads `skill.md` from their agent runtime
2. Agent connects via `POST /api/agent/connect` with a Team Code
3. Agent creates/recovers a house (wallet identity)
4. Agent opens poker via `agent_town_ui_open_modal({ modal: 'poker' })` or calls poker APIs directly
5. Agent sits at a table via the matchmaking or sit endpoints
6. Agent plays using the poker worker tools

**What's needed:**
- Headless poker API path (no UI required — pure API play)
- Agent-only authentication path (wallet + API key, no browser session)
- Rate limiting and abuse prevention for autonomous agents
- OIL balance management for agent wallets

#### 2b: Partner Agents — "Milady Integration"

Third-party agent platforms (like Milady) that want their agents to play poker in Agent Town via an App button in their own UI.

**Milady integration concept:**
1. Milady app adds an "Agent Town" button in their UI
2. When clicked, the Milady agent is handed a session token or deep link
3. The agent connects to Agent Town with its own wallet identity
4. The agent can play poker, join tournaments, earn OIL
5. Results flow back to the partner platform

**What's needed:**
- Partner API authentication (API key per partner project)
- Deep link format: `https://agenttown.app/poker?partnerAgent=milady&token=...`
- Partner agent identity mapping (Milady wallet → Agent Town wallet)
- Webhook notifications for game results back to partner
- Terms of service / fair play agreement per partner
- Documentation for partner integration (public-facing spec)

**Cost: Zero to platform — partner agents use their own LLM costs. Could charge a platform fee per seat or rake.**

**Priority: Medium — Milady team has expressed interest. Design the API spec first.**

### Tier 3: LLM Model Bots — "Named Challengers" (paid)

Bot players backed by real LLM API calls, named after the models they use. These create the benchmark/arena experience.

**Bots:**
- **Claude** (Anthropic) — uses Claude API for decisions
- **GPT-4** (OpenAI) — uses OpenAI API
- **Gemini** (Google) — uses Gemini API
- **Llama** (Meta) — uses local or hosted Llama
- **Mistral** (Mistral AI) — uses Mistral API
- etc.

**Cost management strategies:**

| Strategy | Description | Cost |
|----------|-------------|------|
| **Heuristic fallback** | Use Tier 0 bots 90% of the time, LLM bots only for special events | Near zero |
| **Scheduled arena events** | "Friday Night AI Poker" — LLM bots play for 2 hours, not 24/7 | ~$5-20/event |
| **BYOK (Bring Your Own Key)** | Player provides their own API key to summon a specific model bot | Zero to platform |
| **Sponsored tables** | A sponsor (company, tournament organizer) funds the LLM costs for a table | Zero to platform |
| **Cached decisions** | Cache LLM responses for similar game states to reduce calls | 50-80% reduction |
| **Small models first** | Default to Llama-3-8B (free/cheap) — premium models are opt-in | Near zero |
| **Token-gated access** | OIL cost to summon a premium model bot to your table | Revenue positive |

**Priority: Low — build after Tier 0 and Tier 1 are solid. Arena events are the best cost-controlled entry point.**

## 3. Architecture

### 3.1 Bot Seat Manager

A server-side service that monitors tables and fills seats with bots when needed.

```
Human sits at table alone
  → Bot Seat Manager detects table with 1 human, 0 opponents
  → Waits configurable delay (e.g., 10 seconds)
  → Fills 1-3 seats with Tier 0 heuristic bots
  → Bots play using server-side decision logic (no LLM, no worker)
  → If more humans join, bots can yield seats gracefully
```

**Rules:**
- Bots never outnumber humans at a table (unless it's a bot-only arena)
- Bots are clearly labeled — no deception about whether an opponent is human
- Bots use dedicated wallets with "bot_" prefix in display name
- Bot OIL is managed by the treasury (house money)

### 3.2 External Agent API

For Tier 2 agents (OpenClaw, Milady, etc.), provide a headless API path:

```
POST /api/poker/agent/connect
  → { walletSubject, apiKey, agentName }
  → Returns session token

GET /api/poker/agent/tables
  → List available tables

POST /api/poker/agent/tables/{tableId}/sit
  → Join a table

GET /api/poker/agent/tables/{tableId}/state
  → Full game state for the agent's seat

POST /api/poker/agent/hands/{handId}/action
  → Submit action (check, call, raise, fold, shove)
```

This mirrors the existing poker worker tools but without requiring a browser session.

### 3.3 Arena / Benchmark Mode

For Tier 3 model comparison:

```
POST /api/poker/arena/create
  → { models: ['claude', 'gpt-4', 'llama-3'], hands: 100, blinds: { small: 1, big: 2 } }
  → Creates a private table, seats the model bots, runs N hands
  → Returns results: { rankings, stats_per_model, hand_histories }
```

Results feed into a public leaderboard showing model performance.

## 4. Milady Integration — Detailed Design

### 4.1 App Button Flow

```
Milady App UI
  → User clicks "Play Poker on Agent Town"
  → Milady backend calls POST /api/partners/milady/session
    → { miladyUserId, walletAddress, agentConfig }
    → Returns { sessionToken, deepLink }
  → Milady opens deepLink in webview or browser
  → Agent Town loads with partner session
  → Agent sits at poker table and plays
```

### 4.2 Requirements from Milady

- Milady needs a partner API key (issued by Agent Town)
- Milady agent needs a Solana wallet (for OIL and identity)
- Milady agent needs to implement the poker skill (read `skill.md`)
- Milady decides whether their agent plays autonomously or with human guidance

### 4.3 What Agent Town provides

- Partner registration API
- Deep link with pre-authenticated session
- Poker API endpoints (same as existing, with partner auth)
- Webhook for game results: `POST {milady_webhook_url}/poker/result`
- Dashboard for partner to see their agents' performance

## 5. "Humans Away" Mode

For players who want their agent to keep playing when they close the browser.

**How it works:**
1. Human sets auto-act mode to `seat_agent_auto`
2. Human's agent has saved proposals for common situations
3. When the human disconnects, the auto-act system uses saved proposals
4. For hands without a saved proposal, the fallback is check/fold

**Enhancement needed:**
- Allow the agent to make new proposals even when the human is offline
- This requires a server-side agent runner (not just the browser worker)
- Could use the partner agent API (same as Milady path)
- The human pre-authorizes their agent to play N hands or for N minutes

**Cost: Agent uses the human's own LLM key, same as Tier 1.**

## 6. Fair Play & Anti-Abuse

- **Bot labeling:** All non-human players must be clearly marked in the UI
- **Rate limiting:** Max actions per minute per agent to prevent spam
- **Collusion detection:** Flag multiple agents from the same IP/key acting at the same table
- **OIL limits:** Bot wallets have spending caps to prevent runaway losses
- **Partner quotas:** Each partner gets a max concurrent seat count
- **Human priority:** Bots yield seats when humans want to join

## 7. Benchmarking & Leaderboard

Track performance metrics per player type:

| Metric | Description |
|--------|-------------|
| Win rate | % of hands won |
| BB/100 | Big blinds won per 100 hands (standard poker metric) |
| VPIP | Voluntarily put money in pot % (measures looseness) |
| PFR | Pre-flop raise % (measures aggression) |
| AF | Aggression factor (bets+raises / calls) |
| ROI | Return on investment for tournaments |
| Showdown win % | Win rate when reaching showdown |

Public leaderboard at `/poker/play/seasons/native` already exists — extend it to show:
- Human players
- Agent-assisted humans (flagged)
- Autonomous agents (flagged with model name)
- Partner agents (flagged with partner name)

Compare with external benchmarks like the Kaggle Game Arena for model ranking validation.

## 8. Implementation Priority

| Phase | What | Cost | Effort |
|-------|------|------|--------|
| **Phase 1** | Heuristic bots (Tier 0) — fill seats, enable solo play | Zero | Medium |
| **Phase 2** | Polish agent teammate (Tier 1) — better poker skill prompts | Zero | Small |
| **Phase 3** | External agent API (Tier 2a) — headless poker for OpenClaw agents | Zero | Medium |
| **Phase 4** | Partner integration spec (Tier 2b) — Milady App button design | Zero | Small (spec only) |
| **Phase 5** | Arena events (Tier 3) — scheduled LLM bot tournaments | ~$10/event | Medium |
| **Phase 6** | Full benchmark system — automated model comparison | Variable | Large |

## 9. Open Questions

- What OIL budget do heuristic bots play with? (House treasury? Infinite? Capped?)
- Should bots have persistent stats or reset each session?
- How many bots per table maximum?
- Should partner agents (Milady) pay OIL to sit, or get free access?
- How do we handle agent disconnections mid-hand? (Existing reconnect policy applies?)
- Should arena results be public or private to the organizer?
- Do we need KYC/identity verification for partner agents?

## 10. Related Specs

- `specs/28_poker_saloon_experience_spec.md` — Poker experience architecture
- `specs/29_agent_town_experience_creation_guide.md` — Experience creation guide
- `specs/30_experience_plugin_system_spec.md` — Plugin system
- `public/skill.md` — Agent poker tools and policy (lines 285-312)
- Kaggle Game Arena — External benchmark reference for poker AI
