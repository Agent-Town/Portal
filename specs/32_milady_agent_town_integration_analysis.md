# Milady x Agent Town Integration Analysis

> Status: Research / Planning
> Date: 2026-03-19
> Milady repo: github.com/milady-ai/milady (branch: develop)
> elizaOS docs: docs.elizaos.ai

## 1. What Milady Is

Milady is a personal AI assistant built on elizaOS. It runs as:
- **Desktop app** (Electrobun — macOS/Windows/Linux)
- **Mobile app** (Capacitor — iOS/Android)
- **CLI** (`milady` command)

The agent runs locally or connects to Eliza Cloud. It uses the elizaOS plugin system for extensibility.

## 2. The Integration Goal

A Milady user installs an Agent Town plugin. Their Milady agent can then play poker on Agent Town — both the human and the agent participate together. The human views the game in a webview inside the Milady app; the agent acts through API calls from the plugin.

## 3. Why elizaOS Plugin (Not Skills or Custom Actions)

Milady has three extension mechanisms:

| Mechanism | What it is | Fits us? |
|-----------|-----------|----------|
| **Skills** (SKILL.md) | Markdown instructions injected into prompts | Too passive — just context, no executable code |
| **Custom Actions** (milady.json) | JSON-defined HTTP handlers | Limited — no state management, polling, or services |
| **Plugins** (TypeScript) | Full code: actions, providers, services, routes | Best fit — we need polling, state, and active behavior |

A plugin gives us:
- **Actions**: The agent can check, call, raise, fold, propose
- **Providers**: Inject current game state into every agent message
- **Services**: Background polling of table state, auto-play logic
- **Init hook**: Set up wallet identity and connect to Agent Town on startup

## 4. Plugin Architecture

### 4.1 Package structure

```
plugin-agent-town/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Plugin export
│   ├── actions/
│   │   ├── joinTable.ts      # POKER_JOIN_TABLE
│   │   ├── submitAction.ts   # POKER_SUBMIT_ACTION
│   │   ├── postNote.ts       # POKER_POST_NOTE
│   │   ├── proposeAction.ts  # POKER_PROPOSE_ACTION
│   │   ├── leaveTable.ts     # POKER_LEAVE_TABLE
│   │   └── fillBots.ts       # POKER_FILL_BOTS
│   ├── providers/
│   │   └── tableState.ts     # Injects current game state into context
│   ├── services/
│   │   └── pokerService.ts   # Background polling, session management
│   ├── types.ts              # Agent Town API types
│   └── api.ts                # HTTP client for Agent Town endpoints
└── skill/
    └── SKILL.md              # Poker strategy context for the agent
```

### 4.2 Plugin export

```typescript
import { Plugin } from '@elizaos/core';
import { joinTableAction } from './actions/joinTable';
import { submitActionAction } from './actions/submitAction';
import { postNoteAction } from './actions/postNote';
import { proposeActionAction } from './actions/proposeAction';
import { leaveTableAction } from './actions/leaveTable';
import { fillBotsAction } from './actions/fillBots';
import { tableStateProvider } from './providers/tableState';
import { PokerService } from './services/pokerService';

export const agentTownPlugin: Plugin = {
  name: 'agent-town',
  description: 'Play poker on Agent Town with your human partner',

  init: async (config, runtime) => {
    const origin = config.AGENT_TOWN_ORIGIN || 'https://agenttown.app';
    const walletAddress = config.AGENT_TOWN_WALLET || '';
    // Store connection config in runtime settings
  },

  actions: [
    joinTableAction,
    submitActionAction,
    postNoteAction,
    proposeActionAction,
    leaveTableAction,
    fillBotsAction,
  ],

  providers: [tableStateProvider],
  services: [PokerService],
};

export default agentTownPlugin;
```

### 4.3 Key action: Submit poker action

```typescript
import { Action, ActionResult, IAgentRuntime, Memory, State } from '@elizaos/core';

export const submitActionAction: Action = {
  name: 'POKER_SUBMIT_ACTION',
  similes: [
    'check', 'call', 'raise', 'fold', 'bet', 'shove', 'all in',
    'play poker action', 'make my move',
  ],
  description: 'Submit a poker action (check, call, raise, fold, shove) at the current Agent Town table',

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    // Only valid when seated at a table with a live hand and it's our turn
    const service = runtime.getService('agent-town-poker') as PokerService;
    if (!service?.isSeated() || !service?.isActing()) return false;
    return true;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: any,
    callback?: HandlerCallback,
  ): Promise<ActionResult> => {
    const service = runtime.getService('agent-town-poker') as PokerService;
    const tableState = service.getTableState();
    const handId = tableState?.hand?.handId;

    // Extract action from message context
    const actionKind = extractPokerAction(message.content.text, tableState);
    const amountOil = extractBetAmount(message.content.text, tableState);

    const result = await service.submitAction(handId, actionKind, amountOil);

    if (callback) {
      await callback({ text: `${actionKind}${amountOil ? ` ${amountOil} OIL` : ''}` });
    }

    return {
      success: true,
      text: `Submitted ${actionKind}`,
      data: result,
    };
  },

  examples: [[
    { name: '{{user}}', content: { text: 'I think we should raise here' } },
    { name: '{{agent}}', content: { text: 'Raising to 60 OIL', actions: ['POKER_SUBMIT_ACTION'] } },
  ]],
};
```

### 4.4 Provider: Game state in every message

```typescript
import { Provider, IAgentRuntime, Memory, State, ProviderResult } from '@elizaos/core';

export const tableStateProvider: Provider = {
  name: 'agent-town-poker-state',
  description: 'Current poker game state from Agent Town',
  dynamic: true,

  get: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<ProviderResult> => {
    const service = runtime.getService('agent-town-poker') as PokerService;
    if (!service?.isSeated()) {
      return { text: 'Not currently seated at a poker table.' };
    }

    const table = service.getTableState();
    const hand = table?.hand;
    const mySeat = table?.mySeat;

    if (!hand || hand.status !== 'live') {
      return { text: `Seated at ${table?.table?.title}. Waiting for next hand.` };
    }

    return {
      text: [
        `Playing poker at ${table.table.title}.`,
        `Hand #${hand.handNumber} · ${hand.street} · Pot: ${hand.potOil} OIL`,
        `Your seat: ${mySeat.seatNumber} · Stack: ${mySeat.stackOil} OIL`,
        `Hole cards: ${mySeat.holeCards?.join(' ') || 'hidden'}`,
        `Board: ${hand.communityCards?.join(' ') || 'none'}`,
        hand.actingSeat === mySeat.seatNumber ? 'IT IS YOUR TURN TO ACT.' : `Waiting for seat ${hand.actingSeat}.`,
        `Allowed actions: ${hand.viewerAllowedActions?.join(', ') || 'none'}`,
      ].join('\n'),
      data: { table, hand, mySeat },
    };
  },
};
```

### 4.5 Service: Background polling

```typescript
import { Service, IAgentRuntime } from '@elizaos/core';

export class PokerService extends Service {
  static serviceType = 'agent-town-poker';
  capabilityDescription = 'Agent Town poker table connection';

  private origin = '';
  private walletAddress = '';
  private tableId = '';
  private tableState: any = null;
  private pollTimer: NodeJS.Timeout | null = null;

  static async start(runtime: IAgentRuntime): Promise<PokerService> {
    const service = new PokerService(runtime);
    service.origin = runtime.getSetting('AGENT_TOWN_ORIGIN') || 'https://agenttown.app';
    service.walletAddress = runtime.getSetting('AGENT_TOWN_WALLET') || '';
    return service;
  }

  async stop(): Promise<void> {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  isSeated(): boolean { return !!this.tableId && !!this.tableState?.mySeat; }
  isActing(): boolean {
    return this.tableState?.hand?.actingSeat === this.tableState?.mySeat?.seatNumber;
  }
  getTableState() { return this.tableState; }

  async joinTable(tableId: string, buyInOil: number): Promise<any> {
    this.tableId = tableId;
    const result = await this.api(`/api/poker/play/tables/${tableId}/sit`, {
      method: 'POST',
      body: { seatNumber: 0, buyInOil, displayName: 'Milady Agent' },
    });
    this.startPolling();
    return result;
  }

  async submitAction(handId: string, actionKind: string, amountOil: number): Promise<any> {
    return this.api(`/api/poker/play/hands/${handId}/actions`, {
      method: 'POST',
      body: { actionKind, amountOil },
    });
  }

  private startPolling() {
    this.pollTimer = setInterval(async () => {
      if (!this.tableId) return;
      this.tableState = await this.api(`/api/poker/play/tables/${this.tableId}`);
    }, 3000);
  }

  private async api(path: string, options?: any): Promise<any> {
    const resp = await fetch(`${this.origin}${path}`, {
      method: options?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-solana-address': this.walletAddress,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    const body = await resp.json();
    if (!body.ok) throw new Error(body.error?.message || 'API error');
    return body.data;
  }
}
```

## 5. How Users Would Install It

```bash
# In Milady
milady plugin install plugin-agent-town

# Or in character config
plugins: ['plugin-agent-town']
```

Environment:
```
AGENT_TOWN_ORIGIN=https://agenttown.app
AGENT_TOWN_WALLET=<solana-address>
```

Then the agent automatically:
- Injects poker state into every conversation
- Responds to "let's play poker" by joining a table
- Acts when it's the agent's turn
- Discusses strategy with the human via team notes

## 6. What We Would Ship

An npm package `@agent-town/elizaos-plugin` that Milady (or any elizaOS agent) can install. It contains:

| Component | Purpose |
|-----------|---------|
| 6 actions | Join, act, propose, note, leave, fill bots |
| 1 provider | Game state injected into every agent message |
| 1 service | Background table polling, session management |
| 1 SKILL.md | Poker strategy context |
| HTTP client | Typed wrapper around Agent Town poker APIs |

## 7. What Agent Town Needs for This

### 7.1 Already exists

- All poker API endpoints
- Wallet-based auth via `x-wallet-solana-address` header
- Embed mode for webview

### 7.2 New (minimal)

| Item | Why |
|------|-----|
| CORS headers for external origins | Milady app runs on different origin |
| API key auth (optional) | Alternative to wallet for headless agents |

### 7.3 CORS change

In `server/index.js`, allow Agent Town API calls from Milady app origins:
```javascript
app.use('/api/poker', cors({
  origin: ['https://agenttown.app', 'capacitor://localhost', 'http://localhost'],
  credentials: true,
}));
```

## 8. Testing Path

1. We build the plugin in this repo (or a separate package)
2. Milady team installs it locally: `plugins: ['./plugin-agent-town']`
3. Test with Milady CLI: agent joins a table, plays a hand
4. Test with Milady app: human views webview + agent acts via plugin
5. Publish to npm when stable

## 9. Comparison: Three Integration Paths

| Path | Effort | Capability | Maintenance |
|------|--------|-----------|-------------|
| Skills (SKILL.md only) | Low | Passive — agent gets context but can't act | Low |
| Custom Actions (JSON) | Medium | Can call APIs but no state/polling | Low |
| **Plugin (TypeScript)** | **Higher** | **Full: actions, state, polling, strategy** | **Medium** |

The plugin path is more work upfront but delivers the real experience: the agent actively participates in the game, maintains state, and coordinates with the human.

## 10. Implementation Priority

| Phase | What | Who |
|-------|------|-----|
| 1 | Build plugin package with actions + provider + service | Agent Town |
| 2 | Add CORS support for external agent origins | Agent Town |
| 3 | Test with Milady CLI locally | Both |
| 4 | Milady adds "Agent Town" button in app UI | Milady team |
| 5 | Publish plugin to npm | Agent Town |
| 6 | Milady bundles or recommends the plugin | Milady team |

## 11. Related Specs

- `specs/28_poker_saloon_experience_spec.md` — Poker experience architecture
- `specs/31_poker_players_and_agents_roadmap.md` — Player types roadmap (Tier 2b)
- `public/skill.md` — Current Agent Town skill (poker tools at lines 285-312)
