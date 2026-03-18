# ZHC1 Iterate Prototype — Product Spec

Status: active
Branch: `zhc1-iterate-prototype`
Last updated: 2026-03-18
Predecessor: `docs/zhc1-iteration-feed.md` (product direction)
Predecessor: `specs/02_api_contract.md` (API surface)

---

## 1. What this is

A standalone experience at `/iterate` where a human and their agent solve a problem together through iterative experimentation. The human describes a problem, the agent figures out how to evaluate a good solution, proposes experiments, and the pair iterates until convergence.

This is the first usable prototype of the ZHC1 iteration feed loop — a real product surface, not a demo.

## 2. Core thesis

The unit of value is: **human explains a problem → agent clarifies and proposes evaluation → agent iterates autonomously → human reviews results and gives feedback → pair converges on a solution.**

The conversation between human and agent IS the core interface. The feed of experiment cards is the artifact trail.

## 3. Architecture rule

All LLM calls go through the OpenClaw Lite browser worker using the user's own API key. Agent Town does not run LLMs server-side. The server stores state only.

## 4. User journey

### 4.1 Identity (onboarding)

1. User enters their name or nickname.
2. User names their agent (default: "OpenClaw").
3. Both displayed with pixel art avatars side-by-side:
   - User: `/brand-kit/default_user_avatar.png`
   - Agent: `/brand-kit/default_agent_avatar.png`
4. Names and avatars persist in localStorage, used throughout conversation.

### 4.2 Brain config

1. User selects LLM provider (OpenAI, Ollama, etc.)
2. User enters API key and model name.
3. Config saved to IndexedDB.
4. Visual: "Give [agent name] a brain" with agent avatar.

### 4.3 Agent boot

1. Session created via `POST /api/agent/session` (agent_solo flow).
2. OpenClaw Lite worker bootstrapped.
3. Gateway initialized.
4. Agent avatar shows status: connecting → ready.

### 4.4 Problem definition

1. User types a problem description in a text area.
2. Problem stored via `POST /api/problem-stories`.
3. Agent receives context and begins conversation:
   - Asks clarifying questions
   - Proposes evaluation metrics
   - Explains reasoning
4. Conversation thread with avatars and names.
5. User reviews proposed metrics, can accept/modify.
6. Metrics confirmed via `POST /api/problem-stories/:id/eval-confirm`.

### 4.5 Experiment loop

1. Agent generates experiment proposals via LLM.
2. Agent submits cards to API with: proposal, self-assessed scores, rationale.
3. Cards appear in the feed.
4. User reviews, gives feedback via conversation.
5. Agent incorporates feedback, runs next round.
6. Convergence detected when scores plateau or meet threshold.

### 4.6 Resolution

1. Convergence message shown.
2. Option to publish (discovery feed) or keep iterating.
3. Save game available at any point.

## 5. Entry point

- Route: `/iterate`
- Standalone HTML page: `public/iterate.html`
- Does NOT require the full portal onboarding or co-op ceremony.
- Agent Town branded (sky blues, warm cream, Wellfleet, pixel borders).
- Responsive: mobile-first (390px), tablet (820px), desktop (1440px).

## 6. State machine

```
identity → brain_config → booting → problem_input → active_loop → converged
```

- `identity`: name yourself and your agent
- `brain_config`: connect LLM provider
- `booting`: worker starting, gateway connecting
- `problem_input`: describe the problem
- `active_loop`: conversation + experiment feed + feedback
- `converged`: resolution options

## 7. Agent skill

A dedicated skill file `public/skill_iterate.md` tells the agent how to behave:

1. When given a problem: ask 2-3 clarifying questions to understand scope.
2. Propose 3-5 evaluation metrics with rationale.
3. After metrics confirmed: generate experiment proposals, one at a time.
4. For each experiment: describe what would change, self-assess against metrics, note tradeoffs.
5. After feedback: incorporate constraints and preferences, adjust next experiment.
6. Be honest about uncertainty. If a metric score is low, say why.

## 8. What "experiment" means

Experiments are domain-flexible:
- For code/design: description of changes, pseudo-diff, rationale
- For business/strategy: plan document, key decisions, rationale
- For any problem: structured proposal with self-assessment

The agent produces text artifacts. The system does not execute code.

## 9. Non-goals (prototype)

- No real code execution or modification
- No audio/STT (text only for now)
- No persistence to disk (in-memory acceptable)
- No Privy auth required (brain config is sufficient identity)
- No integration with Portal co-op ceremony
