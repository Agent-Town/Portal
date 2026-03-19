# Milady x Agent Town Integration Analysis

> Status: Research / Planning
> Date: 2026-03-19
> Milady repo: github.com/milady-ai/milady (branch: develop)

## 1. What Milady Is

Milady is a personal AI assistant built on elizaOS. It runs as:
- **Desktop app** (Electrobun — macOS/Windows/Linux)
- **Mobile app** (Capacitor — iOS/Android)
- **CLI** (`milady` command)

The agent runs locally or connects to Eliza Cloud. It has a Gateway WebSocket control plane for communication between the native app shell and the agent runtime.

Key architecture:
- **Runtime**: elizaOS-based, with plugins, custom actions, and skills
- **Skills**: Markdown-based instructions (SKILL.md) injected into agent context
- **Custom Actions**: HTTP/shell/code handlers the agent can invoke
- **Gateway Plugin**: WebSocket bridge between the app and the agent (Capacitor plugin for mobile, Electrobun RPC for desktop)
- **mDNS Discovery**: App discovers local gateway servers via Bonjour

## 2. The Integration Goal

A Milady user opens their app, sees an "Agent Town" button, taps it, and their Milady agent can play poker on Agent Town — both the human and the agent participate together.

This mirrors what Agent Town already does with the in-browser OpenClaw Lite worker: the human sees the poker UI, the agent reads game state and takes actions through APIs. The difference is that the agent runs in Milady's runtime instead of the browser.

## 3. How Milady's Architecture Maps to Agent Town

| Milady concept | Agent Town equivalent | Notes |
|---|---|---|
| Skills (SKILL.md) | `public/skill.md` | Same concept — markdown instructions for the agent |
| Custom Actions (HTTP) | Poker worker tools | Milady actions call HTTP endpoints, same as our poker API |
| Gateway Plugin | Browser worker runtime | Milady uses WebSocket, we use postMessage to worker |
| Capacitor webview | District modal iframe | Both embed web content for the human UI |
| mDNS discovery | N/A | Milady discovers local gateways; Agent Town is a hosted service |

## 4. Integration Architecture

### 4.1 The simplest path: Skill + Custom Actions

Milady already supports:
1. **Skills** — teach the agent what to do via SKILL.md
2. **Custom Actions** — wire up HTTP endpoints the agent can call
3. **Webview** — show web content inside the app

The integration requires:

**A. An Agent Town skill for Milady**

Create a skill that teaches the Milady agent how to play poker on Agent Town:

```
skills/agent-town-poker/SKILL.md
```

This skill contains:
- The Agent Town poker API reference (same content as our `skill.md` poker section)
- How to authenticate (wallet or partner session)
- How to read game state, propose actions, commit actions
- How to coordinate with the human who's viewing the poker UI

**B. Custom Actions wired to Agent Town APIs**

In the Milady `milady.json` config, define custom actions:

```json
{
  "customActions": [
    {
      "name": "POKER_GET_TABLE",
      "description": "Read the current poker table state from Agent Town",
      "handler": {
        "type": "http",
        "method": "GET",
        "url": "https://agenttown.app/api/poker/play/tables/{{tableId}}"
      }
    },
    {
      "name": "POKER_SUBMIT_ACTION",
      "description": "Submit a poker action (check, call, raise, fold)",
      "handler": {
        "type": "http",
        "method": "POST",
        "url": "https://agenttown.app/api/poker/play/hands/{{handId}}/actions",
        "body": { "actionKind": "{{actionKind}}", "amountOil": "{{amountOil}}" }
      }
    },
    {
      "name": "POKER_POST_NOTE",
      "description": "Send a private team note to your seat",
      "handler": {
        "type": "http",
        "method": "POST",
        "url": "https://agenttown.app/api/poker/play/hands/{{handId}}/messages",
        "body": { "body": "{{message}}" }
      }
    }
  ]
}
```

**C. App Button → Webview**

The Milady app opens Agent Town in a webview:

```
https://agenttown.app/poker?embed=1&partnerAgent=milady&token=SESSION_TOKEN
```

The human sees the poker UI. The agent (running in Milady's runtime) reads game state and acts through the HTTP custom actions.

### 4.2 Authentication

Two options:

**Option A: Shared wallet**
- Milady agent uses its own Solana wallet (Milady already has wallet support)
- Agent Town accepts the wallet as identity for API calls
- The human connects the same wallet in the Agent Town webview
- Both human and agent share the same seat (like the current OpenClaw teammate model)

**Option B: Partner API key**
- Milady registers as a partner with Agent Town
- Milady backend gets a partner API key
- When the user taps "Agent Town", Milady creates a partner session:
  ```
  POST /api/partners/milady/session
  { miladyAgentId, walletAddress }
  → { sessionToken, pokerDeepLink }
  ```
- The webview opens the deep link, the agent uses the session token for API calls

Option A is simpler and works with existing infrastructure. Option B is more formal.

### 4.3 The "App Button" flow

```
1. User opens Milady app
2. User taps "Agent Town" button (in Milady's UI)
3. Milady opens a webview: https://agenttown.app/poker?embed=1
4. User authenticates in webview (wallet connect)
5. Milady agent loads the agent-town-poker skill
6. Agent starts polling: GET /api/poker/play/tables/:tableId
7. User sits at a table in the webview
8. Agent detects new hand via polling
9. Agent evaluates hand, proposes action via POKER_SUBMIT_ACTION
10. Human sees the action in the poker UI
11. Game proceeds with human viewing + agent acting
```

### 4.4 Coordination between human and agent

The human views the game in the webview. The agent acts through the API. They coordinate via:

- **Team notes**: Agent posts strategy notes via `/hands/:handId/messages`
- **Auto-act**: If the human enables auto-act mode, the agent's proposals execute automatically
- **Human override**: The human can always submit their own action, overriding the agent

This is the same model as the current OpenClaw Lite worker teammate.

## 5. What Agent Town Needs to Build

### 5.1 Already exists (no changes needed)

- Poker API endpoints (all documented in skill.md)
- Wallet-based authentication for API calls
- Embed mode (`?embed=1`) for webview
- Auto-act system for agent proposals
- Team notes for human-agent coordination

### 5.2 New (to build for partner integration)

| Component | Priority | Description |
|-----------|----------|-------------|
| Partner session API | Medium | `POST /api/partners/:name/session` — create authenticated session for partner agents |
| CORS for partner origins | Medium | Allow Milady app to call Agent Town APIs cross-origin |
| Poker skill package | High | Standalone SKILL.md that Milady can install as a skill |
| Custom action definitions | High | JSON config for Milady's custom action system |
| Deep link handler | Low | Parse `?partnerAgent=milady&token=...` in poker embed |

### 5.3 Poker skill package for Milady

Create a skill directory that Milady users install:

```
skills/agent-town-poker/
  SKILL.md          ← Agent instructions for poker
  actions.json      ← Custom action definitions
  README.md         ← Human setup guide
```

The SKILL.md would contain:
- How to authenticate with Agent Town
- Poker API reference (table state, actions, notes)
- Decision-making guidance (hand strength, position, pot odds)
- Coordination protocol (when to act, when to wait for human)
- Error handling (what to do when API calls fail)

## 6. What Milady Needs to Build

### 6.1 App Button

Add an "Agent Town" entry in the Milady app UI that:
1. Loads the `agent-town-poker` skill
2. Opens a webview to Agent Town
3. Passes the agent's wallet identity

### 6.2 Skill installation

The user installs the Agent Town poker skill:
```bash
milady skill install agent-town-poker
```
Or Milady can bundle it as a partner skill.

### 6.3 Wallet bridge

Milady's agent needs to sign API requests with its wallet. The custom action HTTP handler needs to include wallet headers:
```
x-wallet-solana-address: <agent's solana address>
```

This is the same header format Agent Town already uses.

## 7. Comparison: Browser Agent vs Milady Agent

| Aspect | Browser (OpenClaw Lite) | Milady Agent |
|--------|------------------------|--------------|
| Where agent runs | In-browser Web Worker | Milady desktop/mobile app |
| Communication | postMessage to worker | HTTP API calls |
| Agent context | skill.md loaded by worker | SKILL.md loaded by Milady |
| Human UI | Same browser tab | Milady webview |
| Identity | Privy wallet (browser) | Milady wallet |
| Upside | Zero setup, instant | Runs when browser closed, richer agent |
| Downside | Dies when tab closes | Needs app installed, separate process |

The two approaches are complementary. A user can start with the browser agent and upgrade to Milady for persistent autonomous play.

## 8. Open Questions for Milady Team

1. Does Milady's custom action system support dynamic URL parameters (template variables in URLs)?
2. Can Milady's webview share authentication state with the agent's HTTP calls?
3. Does Milady have a partner/integration SDK or is this purely skill-based?
4. What wallet providers does Milady support? (Need Solana for Agent Town)
5. How does Milady handle long-running polling (agent needs to poll table state every few seconds)?
6. Can Milady register as a persistent background service on mobile so the agent keeps playing when the webview is minimized?

## 9. Implementation Priority

| Phase | What | Who |
|-------|------|-----|
| 1 | Write the agent-town-poker SKILL.md with full API reference | Agent Town |
| 2 | Write custom action JSON definitions for Milady | Agent Town |
| 3 | Test skill + actions with Milady CLI locally | Both |
| 4 | Add "Agent Town" app button to Milady UI | Milady team |
| 5 | Add partner session API to Agent Town | Agent Town |
| 6 | Test full flow: app button → webview → agent plays | Both |

## 10. Related Specs

- `specs/28_poker_saloon_experience_spec.md` — Poker experience architecture
- `specs/31_poker_players_and_agents_roadmap.md` — Player types roadmap (Tier 2b)
- `public/skill.md` — Current Agent Town skill (poker tools at lines 285-312)
