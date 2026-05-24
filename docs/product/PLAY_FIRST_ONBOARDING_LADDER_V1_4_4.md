# Agent Town V1.4.4 — Play-First Onboarding Ladder

## Purpose

This document defines the player-facing onboarding ladder for the play-first refactor. It should be used by product, UX, QA, and agentic AI developers when implementing or reviewing the V1.4.4 onboarding changes.

---

## The ladder

### Step 1 — Play Now

**When:** Start Gate / first app entry.  
**Requirement:** Privy login or test-auth equivalent.  
**Destination:** Founders Plot.

Player promise:

> Start building your first settlement immediately.

What is unlocked:

- manual building;
- manual production;
- manual collection;
- starter contracts;
- deterministic Clover guide copy;
- first visible town progression.

What is not unlocked:

- real Clover Foreman actions;
- scheduled Foreman actions;
- LLM-generated Foreman decisions;
- official Town Hall identity;
- future reputation/social features.

---

### Step 2 — Connect Brain

**When:** after the player has seen a meaningful moment where Clover could help.  
**Requirement:** ChatGPT login through existing `openai-codex` OAuth first; provider/model/API key setup remains available as an advanced alternative.
**Destination:** Brain Quick Connect sheet, not full onboarding wall.

Player promise:

> Let Clover reason about your town and help with approved actions.

What is unlocked:

- real Clover mode;
- OpenClaw Lite worker + Brain decision path;
- LLM/Test Brain safe-candidate selection;
- player-facing Foreman plan/receipt;
- scheduled in-session help when supported by current runtime.

What remains locked:

- persistent/off-session Foreman;
- doctrine board;
- specialist Foremen;
- public identity/reputation features unless Town Hall complete.

---

### Step 3 — Visit Town Hall

**When:** after HQ2, first contract completion, first Morning Brief, or an explicit public identity action.  
**Requirement:** user chooses to open Town Hall.  
**Destination:** Town Hall modal/district.

Player promise:

> Make your growing settlement official.

What is unlocked or prepared:

- public role/name/avatar/profile;
- official founder identity;
- ERC-8004 / passport-like setup where supported;
- future reputation/social/governance readiness;
- deeper Brain and agent settings where relevant.

What Town Hall must not do:

- block the first game loop;
- force Brain setup before play;
- interrupt the player mid-action;
- make Founders Plot feel like paperwork.

---

## Copy map

| Context | Copy |
|---|---|
| Start CTA | `Play Founders Plot` |
| Manual mode badge | `Manual Founder Mode` |
| Manual mode helper | `Build by hand for now. Clover can guide the basics.` |
| Brain CTA | `Log in with ChatGPT` |
| Brain CTA helper | `Let Clover use your ChatGPT subscription to help with approved actions.` |
| Brain connected badge | `Real Clover Foreman` |
| Brain connected helper | `ChatGPT is connected. Clover can help with routine work.` |
| Town Hall invite | `Make it official` |
| Town Hall helper | `Your settlement is growing. Visit Town Hall to set your public role and prepare for future identity features.` |

---

## UX timing rules

### Brain CTA timing

Brain CTA may appear:

- after first manual resource collection;
- after player opens Clover;
- when a ready output exists;
- when an active contract would benefit from production;
- when the player tries to use a Foreman control.

Brain CTA must not appear:

- before Founders Plot renders;
- before the first objective is understood;
- as a blocking modal on first entry;
- while a build/collect/contract action is in progress.

### Town Hall invite timing

Town Hall invite may appear:

- after HQ2;
- after first contract completion;
- after first Morning Brief;
- when user tries public/social/identity feature.

Town Hall invite must not:

- block play;
- cover the main objective;
- appear before the town feels like something worth formalizing.

---

## Product principle

The player should think:

```text
I can play now.
I understand why Clover needs a Brain.
I want to visit Town Hall because my town matters.
```

not:

```text
I must complete setup paperwork before I know whether I like the game.
```
