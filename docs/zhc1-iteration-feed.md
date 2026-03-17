# ZHC1 — Iteration Feed Loop

Status: product direction  
Last updated: 2026-03-18  
Branch: `zhc1-iteration-feed`

This is the next iteration of Agent Town's product direction, built on top of ZHC0.

ZHC0 established the founders loop — how a human and agent meet, bond, and form a company.
ZHC1 defines what the company actually *does*: solve real problems through a feed-based iteration loop.

---

## 1. Core thesis

Humans want to save time by explaining problems to an AI agent and getting automations back.
The AI agent configuration should be optimized for support and stability to form a good collaborative pair.
For longer ventures, the AI agent takes over long-term responsibility — extracting and abstracting higher-level concepts, adapting automatically.

The unit of value is: **human explains a problem → agent iterates autonomously → human reviews results → pair converges on a solution.**

If it helps one human, it can help others. Every solved problem becomes a resource for the next person with a similar problem.

---

## 2. Inspiration

Karpathy's [autoresearch](https://github.com/karpathy/autoresearch) proved the core pattern:
- Human writes `program.md` (direction and constraints)
- Agent modifies code autonomously
- Loop: modify → run (5 min cap) → measure → keep or discard
- Human wakes up to better results

ZHC1 extends this from ML research to general-purpose problem-solving, with a visual feed interface and a social discovery layer.

---

## 3. The interaction model

**Not a wizard. Not a dashboard. A feed.**

TikTok proved that vertical swipe is how humans consume content. ZHC1 uses the same pattern for productive work:
- Each experiment appears as a card in a vertical feed
- Human swipes through iterations
- Tap any card to give audio or text feedback
- Feedback enriches the problem story
- Agent generates better proposals for the next round

The addiction loop becomes an **improvement loop**.

---

## 4. Core entities

### 4.1 Problem Story

A living context document. Contains:
- Human's original problem description
- Constraints and preferences
- Extracted essentials from each feedback round
- The growing shared understanding between human and agent

The problem story is not a ticket or a doc. It is the shared context that makes each iteration better than the last.

### 4.2 Experiment Card

One iteration. Contains:
- **Visual representation** — the thing the user actually sees (preview, mockup, chart, slide, diff)
- **Code link** — grounded in actual implementation, not just text
- **Agent summary** — one-line explanation of what it tried and why
- **Delta** — what changed from the last card

Time-boxed: ~7 minutes per experiment. This forces the agent to ship small, reviewable increments.

### 4.3 Iteration Stream

An ordered sequence of experiment cards for one problem. The complete journey.

### 4.4 Program

Mission configuration (inspired by Karpathy's `program.md`). Tells the agent:
- What problem to solve
- What to touch and what not to touch
- How to measure success
- Time budget and constraints

Human writes and refines the program. Agent executes within its boundaries.

### 4.5 Save Game

Checkpoint of current state:
- Problem story
- Experiment history
- Agent state and config
- Program

Resumable after days or weeks. Forkable before risky experiments.

---

## 5. Two feeds

### 5.1 Private Feed

Your own experiment cards. Swipeable, chronological.
Available from the first experiment.

### 5.2 Discovery Feed

Published iteration streams from other users, matched by:
- Semantic similarity of problem statements
- Code and approach similarity
- Problem domain

Available **only after you declare your own project finished.**

---

## 6. Visual representation

Slides as the default format for abstract ideas (PowerPoint proved this works for decades).

Requirements:
- Not just text — visual elements, diagrams, previews, live demos
- Grounded in actual code — the visual proves the work is real
- Clear delta communication — what changed from last iteration
- Human and agent can discuss what's shown on any card

For concrete/visual tasks (web, design, code), the card shows the actual output.
For abstract tasks (strategy, research, planning), the card uses a slide format with visual structure.

---

## 7. Feedback modalities

### Audio (primary for mobile/casual)
- Human speaks feedback ("the blue is too dark")
- Agent transcribes and extracts essential constraints
- Frictionless — faster than typing

### Text (secondary)
- For precise, structured feedback
- For when the user prefers writing

### Implicit signals
- Swipe direction (keep direction / discard)
- Time spent on a card (interest signal)
- Replay patterns (revisiting a card = uncertainty)

---

## 8. The complete loop

```
1. Human explains problem → Problem Story created
2. Human writes/refines Program → agent gets constraints
3. Agent proposes ideas, runs experiments (≤7 min each)
4. Results appear as cards in Private Feed
5. Human swipes through, gives feedback (audio/text/gestures)
6. Agent extracts essentials → Problem Story enriched
7. Agent runs next round with richer context
8. Repeat → convergence, or save game and come back later
9. On completion → Iteration Stream published to Discovery Feed
10. Others browse Discovery Feed for similar problems
11. Others pull context (not solutions) into their own Problem Story
```

---

## 9. Publication rules

### What gets published
- The **complete journey** of a converged solution
- Dead ends, pivots, constraints discovered, why things failed
- Not just the result — the methodology

### What does NOT get published
- Unconverged or abandoned projects
- Projects where the pair did not reach a satisfactory solution

### Why the journey matters
A finished artifact tells you nothing about how to solve your own similar problem.
The journey — what was tried, what failed, what worked, and why — is the actual value.

### Quality signals for Discovery Feed
- Iteration depth (enough experiments to be meaningful)
- Convergence speed (how quickly the pair found a solution)
- Problem domain similarity (matched to the browsing user's problem)
- User satisfaction signals

---

## 10. Relationship to ZHC0

ZHC0 built the foundations:
- Founders loop (human + agent pair formation)
- House as HQ
- Library as company memory
- Session management and auth flow

ZHC1 changes the product's core interaction:

| Aspect | ZHC0 | ZHC1 |
|---|---|---|
| Core metaphor | Wizard / quest | Feed |
| Primary action | Complete steps | Swipe and react |
| Progression | Linear phases | Iterative convergence |
| Feedback mode | Click / form | Audio / text / gesture |
| Social layer | Registry marketplace | Discovery feed (journeys) |
| Founding ceremony | Central product | Onboarding to get to the feed |

The founding ceremony (Town Hall, sigil, crest) still exists as onboarding.
Once past it, **the feed is the product.**

---

## 11. Platform's role

The platform does not do the work. The platform supports the pair.

Responsibilities:
1. **Anticipate problems** — know where pairs get stuck and provide options
2. **Keep the code-visual connection honest** — no garbage visualizations, no disconnected slides
3. **Match discovery streams by semantic similarity** — not popularity, not social graphs
4. **Structure and label everything** — so the system doesn't rot as it scales
5. **Extract essentials automatically** — from audio feedback, from iteration patterns, from convergence signals
6. **Make save games seamless** — the user should never worry about losing progress

---

## 12. Open questions

1. **How many proposals per round?** One is too slow. Ten is too many. 2-3 feels right — the user picks the best, agent refines from there. More like a dating app than TikTok for this part.

2. **Mobile-first or desktop-first?** The swipe + audio feedback pattern implies mobile. The current Portal is desktop. Needs a decision.

3. **What does "visual representation" look like for non-visual tasks?** "Reorganize my schedule" or "draft an email campaign" — how do these become cards?

4. **How does the Discovery Feed avoid becoming low-quality?** Even with "finished only," quality varies. Community signals? Expert curation? Algorithmic filtering?

5. **When exactly does the user declare "finished"?** Is it a button? A convergence threshold? A satisfaction score? Needs a concrete UX.

6. **How portable are Problem Stories?** If a user pulls context from a Discovery Stream, how much of that stream's problem story becomes part of their own?

---

## 13. Implementation priority

Not building yet — this is the direction doc. But when we do:

1. Define the Experiment Card data model
2. Define the Problem Story data model
3. Build the Private Feed (swipeable experiment cards)
4. Build audio/text feedback capture
5. Build the Program config format
6. Build save game / checkpoint
7. Build the Discovery Feed (after Private Feed is proven)
8. Build semantic matching for Discovery Feed

---

## 14. Anti-goals

1. Do NOT become a marketplace for finished artifacts (the journey is the value)
2. Do NOT let the founding ceremony dominate the product (it's onboarding)
3. Do NOT show the Discovery Feed before the user has solved their own problem (copying, not learning)
4. Do NOT allow garbage visualizations (code-visual connection must be honest)
5. Do NOT make the feed infinite for no reason (convergence is the goal, not engagement)
6. Do NOT require the user to read agent logs to understand what happened (the card IS the summary)
