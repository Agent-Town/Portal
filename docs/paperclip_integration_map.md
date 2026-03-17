# Paperclip Integration Map for Portal / Agent Town

Status: architecture recommendation  
Last updated: 2026-03-17  
Context: `zhc0-founders-loop`

## Executive call

**Do not replace Portal with Paperclip. Do not rebuild a Paperclip clone from scratch either.**

The right move is:

1. **Portal owns the first hour** — world, onboarding, House, memory, missions, and the human+agent cofounder relationship.
2. **OpenClaw owns runtime execution** — the first worker, later workers, browser/runtime continuity, real actions.
3. **Paperclip should be integrated as the later-stage company ops kernel** — org chart, delegation, issue/task routing, heartbeats, budgets, approvals, run history, and multi-company control.

In one sentence:

> **OpenClaw is the worker, Paperclip is the company control plane, and Portal is the world/HQ/memory shell around both.**

That means:

- **yes** to integrating Paperclip,
- **no** to making it the primary user-facing product,
- **no** to rebuilding overlapping org/budget/heartbeat/ticketing software unless a narrow Paperclip bridge spike fails.

---

## Why this is the right call

Portal’s current direction is strongest at:

1. browser-first onboarding,
2. the human+agent founding story,
3. House as HQ,
4. Library as company memory,
5. Workshop/Web/Trainer/Tracks as real mission surfaces,
6. world/game framing for non-technical users.

Paperclip is strongest at:

1. multi-agent company orchestration,
2. org charts and reporting lines,
3. goal -> project -> issue hierarchy,
4. heartbeat scheduling and run tracking,
5. budget/cost governance,
6. board approvals and operator control,
7. multi-company management.

These are **complementary strengths**.

The trap would be either:

1. **forcing new Portal users into board software too early**, or
2. **rebuilding the exact same company-ops layer Portal will eventually need**.

Paperclip is the right answer to the **second-half problem**.
Portal is the right answer to the **first-half problem**.

---

## 1. Overlap with Portal / OpenClaw

## 1.1 Capability overlap map

| Capability | Portal / Agent Town today | Paperclip | Recommendation |
| --- | --- | --- | --- |
| Human+agent founding journey | Strong | Weak / not the focus | **Portal owns this** |
| Browser-first, non-technical onboarding | Strong | Weak | **Portal owns this** |
| First worker bring-up | Strong via OpenClaw Lite | Uses adapters; not core UX | **OpenClaw + Portal** |
| Shared HQ / world shell | Strong (House, `/app`) | None | **Portal owns this** |
| Durable company memory | Strong (Library) | Deliberately thin; knowledge base is plugin/future | **Portal owns this** |
| Real web work + approvals + evidence | Strong (Web, Trainer, Archive) | Not core | **Portal owns this** |
| Org chart / reporting structure | Partial/future | Core strength | **Use Paperclip** |
| Goal / project / issue hierarchy | Partial/future | Core strength | **Use Paperclip** |
| Heartbeats / wakeups / run history | Exists in OpenClaw; partial product surface in Portal | Core strength | **Use Paperclip as control plane over runtimes** |
| Budgets / spend / board governance | Partial/future | Core strength | **Use Paperclip** |
| Multi-company portfolio ops | Future | Core strength | **Use Paperclip later** |
| Public template/package exchange | Registry direction exists | ClipHub direction exists | **Merge semantics into Registry, not a separate product** |

## 1.2 The real overlap

The real overlap is **not** “Portal and Paperclip are the same product.”

The real overlap is narrower:

1. future office/staff/company-ops surfaces in Portal,
2. future multi-worker zero-human-company control loops,
3. future company templates/packages,
4. future budget/governance/managerial tooling.

That is exactly the area where Paperclip is already opinionated and fairly complete.

## 1.3 The non-overlap that matters

Paperclip is explicit that it is:

- **not a chatbot**,
- **not a knowledge base**,
- **not the agent runtime**,
- **not the first-run magical onboarding shell**.

Portal is explicitly moving toward:

- human-first onboarding,
- cofounder relationship building,
- sparse/game-like progression,
- House as HQ,
- memory-first company formation,
- browser-native accessibility.

So Paperclip should not be asked to become Portal.
Portal should not be asked to reinvent Paperclip.

---

## 2. What to steal, integrate, and ignore

## 2.1 Steal now

These ideas are worth stealing even before a runtime integration exists:

### A. The company ops data model

Paperclip’s core model is useful and should influence Agent Town’s future Office/Operations design:

1. company
2. agents/employees
3. org tree
4. goals / initiatives
5. projects
6. issues/tasks
7. comments
8. heartbeat runs
9. cost events
10. approvals

Portal does not need to mirror the naming exactly, but it should not invent a fuzzier duplicate.

### B. Atomic single-owner task checkout

Paperclip’s “single assignee + atomic checkout” is the correct default for autonomous work.

Agent Town should steal this directly for any later internal company work queue.
It prevents duplicate work and blame diffusion.

### C. Board/governance semantics

Paperclip is correct that autonomous company ops need:

1. pause/resume,
2. budget ceilings,
3. explicit approvals for important actions,
4. visible audit history.

That should become the backbone of any later Agent Town office/staff layer.

### D. Adapter stance

Paperclip’s control-plane-not-runtime stance is right.
It fits Agent Town cleanly:

- OpenClaw remains the runtime,
- Paperclip coordinates runtimes,
- Portal presents the human experience.

### E. Template export/import shape

ClipHub’s template idea is worth stealing.
But it should be absorbed into **Registry** rather than launched as a separate public brand inside Agent Town.

## 2.2 Integrate for real

These parts are worth integrating, not just borrowing conceptually:

### A. Paperclip company kernel

Use Paperclip for:

1. org chart,
2. worker records,
3. goal/project/issue management,
4. heartbeat scheduling,
5. run status/history,
6. budget/cost control,
7. company-level approvals,
8. multi-company operations later.

### B. OpenClaw gateway adapter path

Paperclip already has an OpenClaw gateway adapter and invite/onboarding flow.
That is highly relevant.

Agent Town should use that as the serious path for:

1. hiring later workers,
2. connecting remote OpenClaw workers,
3. bridging browser-first users into more serious worker infrastructure.

### C. REST integration, not plugin dependency, for the first bridge

Paperclip’s plugin system is promising, but the current runtime is still early and not cloud-ready enough to be the core Agent Town dependency boundary.

So the first real integration should be via:

1. **Paperclip REST API**,
2. a narrow Portal-side bridge/service,
3. optional embedded UI only after the data flow works.

## 2.3 Ignore or refuse

### A. Do not adopt Paperclip’s UX as the first-run UX

Do **not** dump a new founder into:

- board dashboards,
- issue boards,
- agent config panels,
- budget spreadsheets,
- approval queues.

That kills the magic and violates the current ZHC0 direction.

### B. Do not make tasks/comments the whole user-facing communication model

Paperclip is right for internal delegation.
It is wrong as the primary emotional surface for the founding pair.

Portal should remain:

- conversation-first,
- memory-first,
- quest/mission-first,
- House-first.

Tasks can exist underneath later.

### C. Do not make Paperclip the canonical memory layer

Library is already a stronger fit for company memory than Paperclip’s issue/comments core.

Paperclip should reference Library artifacts, not replace them.

### D. Do not bet the product on Paperclip plugins yet

The plugin system is useful, but it is still early and currently assumes a trusted, persistent self-hosted environment.

That is not the boundary to bet Portal’s hosted/browser-first future on.

### E. Do not launch ClipHub as a second public marketplace brand inside Agent Town

Agent Town already has Registry.
Use Registry as the public distribution/discovery layer.
Steal the package semantics; ignore the brand split.

---

## 3. Recommended target architecture

## 3.1 Product rule

A new user should **start a company in Portal without knowing Paperclip exists**.

Paperclip should appear only when the company has earned an actual operations layer.

Good unlock triggers:

1. House exists,
2. first mission completed,
3. first memory saved,
4. or the pair wants to hire a second worker / run scheduled work / manage budget.

This matches Paperclip’s own product truth: if you only have one agent, you probably do not need a full company control plane yet.

## 3.2 The target stack

### Layer 1 — Portal experience shell

Portal remains the primary product surface:

1. `/start`
2. Town Hall
3. `/create`
4. House
5. Library
6. Workshop
7. Web
8. Tracks
9. Trainer
10. Registry
11. Pony

This is where the human experiences the business.

### Layer 2 — Portal company bridge

A thin integration service owned by Portal.
Its jobs:

1. map House <-> Paperclip Company IDs,
2. map founder/worker identities,
3. sync selected missions into structured work,
4. keep Library artifacts linked,
5. proxy/auth Paperclip API access,
6. import summarized ops state back into Portal.

This should be a **narrow boundary**, not a giant shared-database mess.

### Layer 3 — Paperclip ops kernel

Paperclip runs as the company-ops subsystem for enabled Houses.
It owns:

1. org structure,
2. worker roster,
3. goals/projects/issues,
4. comment threads for internal delegation,
5. heartbeat runs,
6. cost tracking,
7. budget enforcement,
8. board approval queues,
9. portfolio ops later.

### Layer 4 — Runtime layer

Workers run through:

1. OpenClaw Lite,
2. OpenClaw gateway/full runtimes,
3. other supported agent adapters where useful.

Paperclip coordinates these runtimes.
Portal does not need to become the runtime scheduler itself.

## 3.3 Source-of-truth split

This is the most important architecture rule.

### Portal is source of truth for:

1. human identity in the world,
2. House identity and public presence,
3. Library memory/artifacts,
4. mission framing and world progression,
5. Web evidence/approval records,
6. Registry presence and public packages,
7. Pony messaging/network identity.

### Paperclip is source of truth for:

1. org chart,
2. internal work queue,
3. worker assignment state,
4. heartbeat runs,
5. run/cost/budget state,
6. internal approval queue for company operations,
7. portfolio management later.

### OpenClaw is source of truth for:

1. actual worker runtime/session state,
2. tool execution,
3. mind/runtime continuity,
4. direct operational work.

## 3.4 Entity mapping

| Portal / Agent Town | Paperclip | Rule |
| --- | --- | --- |
| House | Company | Create lazily when Operations unlocks or company opts in |
| Human founder | Board user | Human remains ultimate approver |
| First agent / cofounder | CEO or first employee agent | Same worker, different surface |
| Mission | Initiative / Project / Issue | Only structured missions need syncing |
| Library artifact | Document / attachment reference | Library stays canonical |
| Workshop pack / SOP | Agent config / template / issue document | Copy or reference as needed |
| Tracks milestone | unlock state outside Paperclip | Keep in Portal |
| Pony / House inbox | notifications / wakeups / summaries | Portal-facing, not raw Paperclip comments |
| Registry package | company template / team template / agent template | Registry becomes the public wrapper |

## 3.5 User journey in the target architecture

### Stage 1 — Founding

Inside Portal:

1. meet agent,
2. found the pair,
3. create House,
4. run first mission,
5. save first memory.

No Paperclip UI yet.

### Stage 2 — Operations unlock

Inside House, a new room appears:

- **Office** or **Operations Room**

Copy should be plain:

- hire help
- assign work
- track what your company is doing
- set limits and approvals

This room is Paperclip-backed.

### Stage 3 — Embedded Paperclip use inside Portal

The user can now:

1. hire a second worker,
2. see the company org,
3. create structured work items,
4. approve important actions,
5. inspect spend and status,
6. watch scheduled work happen.

This should first appear as a **Portal-native UI backed by Paperclip APIs**.

### Stage 4 — Power-user escape hatch

Add an advanced action:

- **Open full board**

That can expose the raw/full Paperclip interface for users who want deeper control.
But the default journey should stay inside the Portal shell.

---

## 4. Major risks and mismatches

## 4.1 UX mismatch: board software vs. cofounder world

Paperclip is manager software.
Portal is becoming a world/game/HQ experience.

If Paperclip leaks too far up the stack, the product will feel like a startup dashboard wearing a costume.

**Mitigation:**

1. lazy unlock,
2. Portal-native wrapper UI first,
3. keep Paperclip as the operations room, not the whole city.

## 4.2 Duplicate truth risk

If both systems own:

- company identity,
- memory,
- tasks,
- approvals,
- artifacts,

the integration will rot.

**Mitigation:** explicit source-of-truth split. Library stays canonical memory. Paperclip stays canonical internal ops queue.

## 4.3 Auth and tenancy mismatch

Paperclip is self-hosted, single-tenant, multi-company.
Portal wants a browser-first public-facing experience.

**Mitigation:**

1. keep Paperclip behind Portal auth initially,
2. use a Portal-side service/proxy,
3. do not expose raw Paperclip auth/account concepts to end users at first.

## 4.4 Plugin/runtime maturity risk

Paperclip is moving fast. The repo is very new and already on rapid `v0.3.x` releases. The plugin system is implemented but still early and not yet the right cloud boundary.

**Mitigation:** integrate through the stable narrowest thing available: REST + sidecar/service boundary.

## 4.5 Memory model mismatch

Paperclip explicitly does not center a rich knowledge base in core.
Portal absolutely does.

**Mitigation:** never demote Library into “attachments on issues.” Use issue docs/comments only for internal execution context.

## 4.6 Product maturity mismatch

Paperclip is built for people who already know they want to run many agents.
Portal’s target includes people who just want to start with one browser-based worker and no infra headache.

**Mitigation:** Paperclip unlocks only after the company becomes defined enough for it to matter.

## 4.7 Region-pack mismatch

Portal needs China/international packs and low-jargon setup.
Paperclip is more adapter/operator-oriented.

**Mitigation:** keep provider/runtime-region choices in Portal/OpenClaw setup layers, not in the user-facing Paperclip layer.

## 4.8 Modal-first shell mismatch

Portal’s founder path must stay modal-first in `/app`.
Paperclip is a route/page-style board.

**Mitigation:** use a Portal-native embedded operations surface first; expose raw Paperclip pages only as advanced support surfaces.

---

## 5. Phased implementation plan

## Phase 0 — Decide the boundary

**Goal:** prevent accidental system overlap before code starts.

Deliverables:

1. confirm the source-of-truth split,
2. define the House <-> Company ID mapping,
3. define the minimal Paperclip API subset Agent Town actually needs,
4. define the unlock condition for the Operations Room.

Recommended unlock default:

1. House created,
2. first mission complete,
3. first memory saved,
4. or explicit “hire help” intent.

## Phase 1 — Steal the concepts without depending on Paperclip yet

**Goal:** sharpen Agent Town’s future Office design immediately.

Do now:

1. adopt Paperclip’s single-owner work semantics in design docs,
2. adopt org/budget/approval vocabulary for future office/staff specs,
3. define how Library artifacts become structured work inputs,
4. define Registry template semantics using ClipHub-like package rules.

This phase is cheap and useful even if the integration later changes.

## Phase 2 — Sidecar bridge spike

**Goal:** prove the integration is real before designing too much UI around it.

Build a thin prototype where:

1. a House can create a linked Paperclip Company,
2. the founding agent becomes the CEO/first worker in Paperclip,
3. one mission can sync into an initiative/project/issue,
4. one Library artifact can be attached or referenced,
5. Paperclip run/cost/status summary can be shown back in House.

Success criteria:

1. no shared DB coupling,
2. no duplicate identity confusion,
3. OpenClaw worker can complete a synced task through Paperclip,
4. Portal can display that state cleanly.

## Phase 3 — Operations Room inside House

**Goal:** make Paperclip usable without breaking the Portal shell.

Add a new House room:

- **Office** or **Operations**

Initial surfaces should be Portal-native and small:

1. org chart lite,
2. worker list,
3. work inbox,
4. approvals queue,
5. budget/spend strip,
6. recent runs/activity.

Do **not** start with the full Paperclip board as the default UI.

## Phase 4 — Multi-worker expansion

**Goal:** make the company actually benefit from the control plane.

Add:

1. hire second/third workers,
2. role templates,
3. scheduled work and wakeups,
4. manager/subordinate patterns,
5. budget ceilings and auto-pause,
6. more explicit internal company operations.

This is where Paperclip begins paying for itself visibly.

## Phase 5 — Templates and ecosystem merge

**Goal:** avoid building two registries.

Unify:

1. Registry public packs,
2. worker/team/company templates,
3. import/export flows,
4. reusable company operating packages.

Recommendation:

- Paperclip provides the package semantics.
- Agent Town Registry provides the public discovery/distribution surface.

## Phase 6 — Networked companies later

**Goal:** preserve the bigger dream without forcing it early.

Longer term:

1. internal company ops continue to live in Paperclip,
2. inter-company exchange/discovery/messaging live in Registry + Pony + House identity,
3. Paperclip should not become the public market/network protocol.

That public/network role belongs to Agent Town.

---

## 6. Concrete recommendation

If we have to pick one default path, it should be this:

1. **Keep building ZHC0 in Portal exactly as the cofounder-first flow.**
2. **Do not build a fresh org-chart/task/budget/heartbeat company layer in Portal.**
3. **Run a Paperclip bridge spike as soon as the first-mission + House loop is solid enough to support an Operations unlock.**
4. **Expose Paperclip first as a House Office/Operations room inside Portal, not as the app’s main identity.**
5. **Use Registry, not ClipHub, as the long-term public package/discovery surface.**

The decisive answer is:

> **Integrate Paperclip as the later-stage company operations kernel inside Portal. Do not replace Portal with it, and do not waste time rebuilding its core orchestration primitives from scratch.**

---

## 7. Immediate next actions

1. Add a follow-on doc/spec for **House Office / Operations Room** with the exact Portal <-> Paperclip entity mapping.
2. Build a minimal bridge spike:
   - create linked company,
   - create CEO/worker,
   - sync one mission to one issue,
   - run one OpenClaw worker through Paperclip,
   - display status back in House.
3. Decide the unlock rule and keep Paperclip completely hidden before that threshold.
4. Fold ClipHub/template thinking into Registry planning instead of spawning a separate marketplace track.
