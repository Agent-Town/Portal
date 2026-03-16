# ZHC Remote Branch Audit

Status: audit of relevant unmerged or divergent Portal branches for ZHC0 planning  
Last updated: 2026-03-16
Baseline for comparison: `origin/codex/frontend-design`
Branch context: `zhc0-founders-loop`

This document records the most relevant branch lines outside the current ZHC0 base and explains what they imply for ZHC0.

## 1. Quick summary

ZHC0 should **not** merge all these branches first.

The right approach is:

1. keep `origin/codex/frontend-design` as the current substrate,
2. understand what each divergent branch contributes,
3. port or cherry-pick only what sharpens the founders loop,
4. preserve the rest as later-compatible architecture and vision.

---

## 2. Branch status table

Counts below are shown as:

- `frontend-design ahead / branch ahead`

relative to `origin/codex/frontend-design`.

| Branch | Divergence vs `frontend-design` | What it is |
| --- | --- | --- |
| `origin/codex/agent-library` | `3 / 0` | older branch line for Library/public-stack/safety/discovery work; effectively subsumed by newer base |
| `origin/codex/house-worker-packages-spawn-v0-1` | `68 / 46` | worker packages, House deployments, helper spawn, share-to-friend |
| `origin/codex/backend-worker-pool-spec-v0-1` | `68 / 49` | backend pool/offload/local-node direction for serious worker execution |
| `origin/codex/executor-abstraction-research-v0-1` | `68 / 57` | executor abstraction / offload research and contracts |
| `origin/codex/house-office-frontend` | `68 / 51` | HQ/office/frontend shaping for House as a clearer operating place |
| `origin/codex/poker-frontend-design-v1` | `96 / 61` | first-experience frontend deepening, especially poker UX and global readability |

Interpretation:
- `agent-library` is effectively already absorbed into the newer frontend line.
- the other branches contain meaningful future direction but are too divergent to mass-merge into ZHC0.

---

## 3. Branch-by-branch analysis

## 3.1 `origin/codex/agent-library`

### What it contributes
This branch represents a major deepening of House Library beyond “notes.”

Key visible themes in the phase specs:

- **Phase 39** — local safety and moderation
- **Phase 40** — trust-aware discovery lanes
- **Phase 41** — route follow/sync between Houses
- **Phase 42** — shell-wide icon-first simplification

This means Library is already envisioned as:

1. a digital artifact shelf,
2. a share/import/publish surface,
3. a trust/safety/provenance surface,
4. a route-following feed between Houses,
5. a same-shell exchange desk between companies.

### Why it matters for ZHC0
This is the strongest branch evidence that:

- ZHC0 memory is not just private notes,
- digital artifacts can become reusable and shareable,
- Houses may later exchange bundles/stacks/routes,
- ZHC0s could become counterparts or customers of one another.

### ZHC0 recommendation
Do **not** fork away from this logic.
Treat it as already part of the future-compatible substrate.

Bluntly:
- Library is not optional lore dressing.
- It is a core company-memory and artifact-market layer.

---

## 3.2 `origin/codex/house-worker-packages-spawn-v0-1`

### What it contributes
This branch is the clearest “future workers” line.

Key themes from Phases 34, 35, and 37:

1. Registry-backed worker packages
2. House-scoped deployments
3. share-to-friend installs
4. spawnable child/helper sessions
5. supervision/state/guardrails
6. reality-hardening around runtime truth and lifecycle

The product thesis is clean:

- Registry = package truth
- House = deployment truth
- runtime = live execution truth

### Why it matters for ZHC0
This is basically the branch that begins turning:
- one founder + one agent
into
- one House + reusable helpers + later teams.

It is exactly the bridge from:
- pair
to
- staff.

### ZHC0 recommendation
Do **not** merge this wholesale into ZHC0 now.

Instead:
- design the founders loop so it naturally grows into this model later
- keep “first worker” and “future helper shelf” compatible in naming and IA
- reserve room in House for later helper deployments

This branch is **future-critical**, but not first-play critical.

---

## 3.3 `origin/codex/backend-worker-pool-spec-v0-1`

### What it contributes
This branch pushes the worker model toward:

- backend pool/offload
- stronger runtime topology
- more serious execution and scaling architecture
- local node / offload semantics

### Why it matters for ZHC0
This is where Agent Town starts becoming more than a browser worker shell.
It points toward:

- serious autonomous operation,
- more persistent execution,
- scaling workers beyond one page/tab reality,
- eventual portability into local/server contexts.

### ZHC0 recommendation
This is **not** first-play scope.
But it should inform the long-term architecture language:

- browser-first now,
- offload/export later,
- avoid naming or IA that traps the product in a one-tab mental model forever.

---

## 3.4 `origin/codex/executor-abstraction-research-v0-1`

### What it contributes
This branch appears to push further into:

- executor abstraction
- offload mechanics
- generalized runtime execution contracts
- agent/runbook style deeper infrastructure

### Why it matters for ZHC0
This is a serious later-stage business-operations branch.
It matters if the company evolves into:

- many workers,
- serious mission execution,
- different runtime backends,
- operator choice between browser/local/server modes.

### ZHC0 recommendation
Keep it as a **future systems line**, not a current UX line.

It matters most for:
- portability,
- scaling,
- serious zero-human-company operation.

Not for the first magical hour.

---

## 3.5 `origin/codex/house-office-frontend`

### What it contributes
This branch is the clearest House/HQ semantic refinement line.

Observed themes:

- House Office framing
- readiness and briefing clarity
- staff and structure presence
- office-oriented product semantics
- star-office-inspired extension thinking

### Why it matters for ZHC0
This branch is highly relevant because House needs to feel like:
- headquarters,
- not miscellaneous system sprawl.

It is one of the best branches for:
- room semantics,
- office semantics,
- readiness language,
- making the House feel inhabited and operational.

### ZHC0 recommendation
This is a **good donor branch** for:
- House entry framing,
- office metaphors,
- HQ feeling,
- future room naming and hierarchy.

But still port selectively.
Do not blindly merge the whole thing.

---

## 3.6 `origin/codex/poker-frontend-design-v1`

### What it contributes
This is the strongest focused experience-frontend branch.

Strong themes:

- human-first decision environment
- global readability
- Simplified Chinese resilience
- operator/player/spectator separation
- clear action visibility
- modal/embed compatibility
- provider/model labels demoted to supporting metadata

### Why it matters for ZHC0
Poker is the first mature experience proof that Agent Town can host:

- a serious action loop,
- AI teammate visibility,
- multilingual/global usability,
- role-specific views,
- evidence/replay/review.

That makes it a valuable template for later mission design.

### ZHC0 recommendation
Use this branch as a donor for:

- first-experience clarity,
- action prioritization,
- mobile-first seriousness,
- global/Chinese design discipline,
- player/agent/observer separation logic where relevant.

This branch is especially useful for mission UX, not just poker.

---

## 4. What is already in the current frontend base

The current `frontend-design` base already carries substantial platform reality.

Observed subsystem evidence includes:

- Registry
- Web
- Poker
- Trainer
- House Office scaffold
- Tracks
- House Library at significant depth

The e2e surface is already very broad, including:

- Registry grouped search, proof cards, claim/review flows
- Trainer jobs/results/promotion
- Tracks reward hooks and progression surfaces
- Poker season, operator, replay, proof, leaderboard flows
- Library authoring, conversation capture, shelves, satchels, public stacks, attestations, safety, route sync, shellwide simplification

So ZHC0 is not starting from an empty shell.
It is choosing which deep existing layers to expose first.

---

## 5. What this means for ZHC0 design

## 5.1 Immediate first-play contract

ZHC0 should expose only the minimum slices needed for the founders loop:

1. start
2. first worker
3. founding
4. alignment
5. crest
6. HQ
7. first mission
8. first memory
9. next quest

## 5.2 Strong future-compatible choices

ZHC0 should still be designed so it grows naturally into:

- Library artifact sharing
- Registry market/discovery
- worker package deployment
- helper spawning
- office specialization
- proving-ground experiences
- future portability/offload

## 5.3 Things to avoid

Do not prematurely dump into ZHC0:

- every worker-management detail
- every executor/runtime abstraction detail
- deep Registry complexity on the first screen
- all House Office panels at once

The player should feel future depth, not be crushed by it.

---

## 6. Final recommendation

Treat the remote branches like this:

### Substrate already absorbed
- `agent-library`

### Best future donor branches
- `house-office-frontend`
- `poker-frontend-design-v1`
- `house-worker-packages-spawn-v0-1`

### Important future architecture lines
- `backend-worker-pool-spec-v0-1`
- `executor-abstraction-research-v0-1`

### ZHC0 operating rule

Borrow in this order:

1. **HQ clarity** from House Office
2. **experience clarity** from Poker frontend
3. **future staffing model** from worker package/spawn branch
4. **long-term runtime scaling** from backend/executor branches

That gives ZHC0 the right shape:
- magical now,
- serious later,
- compatible with the deeper system you are already building.
