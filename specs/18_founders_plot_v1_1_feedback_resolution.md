# Agent Town: Founders Plot V1.1 Feedback Resolution

**Date:** 2026-04-19  
**Purpose:** explain how team feedback changed the V1.1 spec  
**Primary output:** `agent-town-founders-plot-v1.1-refined-spec.md`  
**Audience:** humans and LLM implementers preparing the next build/spec cycle

---

## 0. Verdict

The team feedback materially improves the specification.

The original V1.1 spec had the right direction but too much load-bearing ambition. It correctly emphasized server authority, honest in-session boundaries, OpenClaw Lite as the real Foreman, auditability, and test discipline. But it risked shipping a technically impressive automation shell around a game loop that still felt too thin.

This feedback has been accepted as a refinement input.

The refined spec narrows V1.1 around one hero moment:

> The player gives the Foreman one simple standing order, enables one safe automation, and sees the actual OpenClaw Lite Foreman collect a ready output through the real runtime path with a clear receipt.

---

## 1. Accepted critique

### 1.1 Original spec was too broad

**Feedback:** V1.1 bundled too many major projects: UX relaunch, contracts, OpenClaw Lite runtime, generalized scheduler, replay/ledger hardening, migrations, CI, and recap redesign.

**Decision:** accepted.

**Change made:** The refined spec now separates work into:

- P0 must ship;
- P1 only after P0 is green;
- P2 deferred.

The scheduler was narrowed from a broad system to one P0 preset: `COLLECT_READY_OUTPUTS`.

---

### 1.2 “Teaching the Foreman” was not earned

**Feedback:** permissions, presets, approvals, and receipts are delegation, not teaching.

**Decision:** accepted.

**Change made:** Added **Foreman Standing Order v0** with exactly two presets:

- `CAREFUL_STEWARD`
- `BOLD_FOUNDER`

This is intentionally not a full Doctrine Board. It is a small teaching mechanic that affects Plan Cards, candidate scoring, and recap wording.

---

### 1.3 The town fantasy needed stakeholders

**Feedback:** contracts looked like abstract checklist cards and did not yet imply a living town.

**Decision:** accepted.

**Change made:** Contract Board v0 now requires:

- named requester;
- institution;
- `whyNow` text;
- town signal;
- philosophy hint.

P0 contracts are only `SUPPLY` and `BUILD`, but they must feel like civic requests from a town.

---

### 1.4 Goal priority was unresolved

**Feedback:** tutorial, contracts, approvals, Foreman plans, receipts, and recap suggestions could conflict.

**Decision:** accepted.

**Change made:** Added a hard attention arbitration hierarchy:

1. blocking approval or safety warning;
2. critical town failure;
3. tutorial/current milestone;
4. ready-to-turn-in active contract;
5. active contract progress suggestion;
6. Foreman receipt;
7. optional Foreman optimization;
8. general recap suggestion.

This hierarchy is now testable.

---

### 1.5 Trust needed predictability, not only auditability

**Feedback:** receipts explain actions after the fact, but players need to predict what the Foreman will do before it acts.

**Decision:** accepted.

**Change made:** Added:

- Standing Order v0;
- explicit Foreman silence rules;
- correction controls;
- Plan Card authority fields;
- “Ask me next time” and “Pause Foreman” as P0 recovery affordances.

---

### 1.6 First-hour progression was underspecified

**Feedback:** the golden path named beats but lacked a compact table of unlocks, costs, pacing, and resource fixes.

**Decision:** accepted.

**Change made:** Added a first-hour progression table with:

- initial resources;
- storage caps;
- production baselines;
- starter construction costs;
- HQ upgrade costs;
- the required First Timber reward that makes HQ2 reachable before Farm Plot exists;
- a 13-beat first-hour path.

---

### 1.7 AI boundary was too vague

**Feedback:** the spec mixed deterministic automation and LLM-ish agency without saying what each does.

**Decision:** accepted.

**Change made:** Defined the V1.1 boundary:

- deterministic logic enumerates safe candidates;
- the OpenClaw Lite worker chooses or explains among safe candidates;
- the server validates again;
- on model failure, the worker no-ops.

The model is not allowed to invent executable world actions.

---

### 1.8 Scheduler needed conflict rules

**Feedback:** multiple due tasks and goals could conflict.

**Decision:** accepted, but narrowed.

**Change made:** P0 has one preset only, so conflict is small. If multiple outputs are ready, choose by:

1. active contract requirement;
2. Standing Order reserve policy;
3. oldest ready output.

P1 `KEEP_ONE_BUILDING_RUNNING` may add richer conflict handling later.

---

### 1.9 Player-facing trust metrics were missing

**Feedback:** engineering metrics alone can pass while the player remains confused or disappointed.

**Decision:** accepted.

**Change made:** Added player-understanding metrics:

- Foreman enabled after unlock rate;
- in-session-only boundary comprehension;
- first Foreman action understood rate;
- first action unsurprising rate;
- one-primary-goal comprehension rate.

---

## 2. Partially accepted critique

### 2.1 Add run identity in V1.1

**Feedback:** V1.1 should include at least one source of run identity.

**Decision:** partially accepted.

**What changed now:** Contract requesters, town signals, philosophy hints, and Standing Order v0 add light identity.

**What remains deferred:** true starting town traits, charters, regional pressure, and contract-board bias remain future work.

Reason: charters would add too much replay/balance scope before the first hour is proven.

---

### 2.2 Make contract choice strategic

**Feedback:** one active contract may flatten strategy.

**Decision:** partially accepted.

**What changed now:** the board offers two different contract choices after HQ2, each tied to requester/institution/philosophy hint.

**What remains deferred:** contract portfolios, expiration, multiple active contracts, seasonal decks, and opportunity-cost chains.

Reason: one active contract preserves first-session clarity.

---

### 2.3 Strengthen economic meaning of coin

**Feedback:** coin rewards need meaningful uses.

**Decision:** partially accepted.

**What changed now:** construction costs include small coin permit costs after starter Lumber Camp, and Standing Order controls small coin spend authority.

**What remains deferred:** richer coin sinks, rush services, civic purchases, premium services, and market systems.

Reason: adding many coin sinks now risks distracting from the Foreman hero moment.

---

## 3. Rejected or deferred critique

### 3.1 Full doctrine board in V1.1

**Decision:** deferred.

The refined spec adds Standing Order v0 instead. Full doctrine belongs to V2 because it changes the game from operator loop into governance loop.

---

### 3.2 Generalized scheduler platform

**Decision:** deferred.

The refined spec exposes presets only. Internal implementation may be generic, but users and agents must not deal with arbitrary schedules in V1.1.

---

### 3.3 Maintain reserve / check bottleneck / assist active contract presets

**Decision:** deferred.

These are valuable, but they require richer decision policies. Shipping them before the first hero automation works would increase complexity and reduce clarity.

---

### 3.4 Recovery and Preparation contracts

**Decision:** deferred.

They risk being thin wrappers around the same small economy. V1.1 proves `SUPPLY` and `BUILD` first.

---

### 3.5 Persistent off-session Foreman

**Decision:** deferred from V1.1 implementation.

The refined spec keeps server-persisted task definitions so backend-pool execution can reuse the model later, but V1.1 remains honest: OpenClaw Lite browser runtime acts only while active.

---

## 4. Old V1.1 vs refined V1.1

| Topic | Original V1.1 | Refined V1.1 |
|---|---|---|
| Scope shape | broad milestone with many systems | P0/P1/P2 gated scope |
| Hero moment | broad scheduler + contracts + runtime | one real Foreman auto-collect through OpenClaw Lite |
| Contracts | 4 types: Supply, Build, Preparation, Recovery | P0 only Supply + Build |
| Contract feel | functional goal cards | named requesters, institutions, why-now, town signals |
| Scheduler | generalized task model exposed through multiple presets | P0 preset only: Collect ready outputs |
| Teaching fantasy | permissions/presets/approval | Standing Order v0 affects behavior/explanation |
| AI boundary | mixed deterministic + LLM language | deterministic candidates; model explains/ranks; server validates |
| Goal priority | implied by UI | explicit arbitration hierarchy |
| Trust | receipt/audit heavy | predictable policy + receipt + correction |
| First hour | narrative golden path | exact progression table and starter reward fix |
| Metrics | mostly engineering | engineering + player-understanding metrics |

---

## 5. Required team behavior after this refinement

### 5.1 Treat the refined spec as the implementation scope

`agent-town-founders-plot-v1.1-refined-spec.md` supersedes the older V1.1 document for build scope.

The older document remains useful as background, but implementers must not treat its broader scheduler/contract scope as mandatory.

### 5.2 Implement P0 first

Do not start P1 until P0 tests are green.

Do not start P2 in this milestone.

### 5.3 Preserve the product proof

Every implementation choice should be judged by this question:

> Does this make the first real Foreman delegation moment clearer, safer, or more delightful?

If not, defer it.

---

## 6. Notes for the next LLM that writes a future spec

When preparing V1.2 or V2, do not reopen these decisions unless new implementation evidence contradicts them:

- Agent Town is the product; Founders Plot is the launch chapter.
- V1.1 is in-session OpenClaw Lite automation, not backend-persistent automation.
- P0 scheduler is one preset, not a generic automation platform.
- The Foreman must be real runtime-originated, not actor-string spoofed.
- Standing Order v0 is the small teaching mechanic; full doctrine is later.
- Contracts need stakeholders and town context, not just resource thresholds.
- Goal arbitration is mandatory for clean UX.
- Recap must separate passive world progress from Foreman-authored action.

The likely next specs after V1.1 are:

1. `agent-town-founders-plot-v1.2-keep-running-and-contract-depth-spec.md`
2. `agent-town-founders-plot-v2-persistent-foreman-and-doctrine-spec.md`
3. `agent-town-founders-plot-v3-charters-capability-web-and-specialists-spec.md`

---

## 7. Final resolution

The feedback improves the spec.

The refined direction is not smaller because the ambition shrank. It is smaller because the product proof is now sharper.

V1.1 should ship one unforgettable, honest, auditable moment:

> “I told Clover how I like to run the town, and Clover actually helped.”
