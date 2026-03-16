# ZHC0 UI Evidence Contract

Status: design-state evidence and reproducibility contract  
Last updated: 2026-03-16
Branch: `zhc0-founders-loop`

## 1. Purpose

This spec makes the founders-loop UI measurable for agentic AI developers and future implementers.

It exists so the UI is not only described in prose.
It must be:

1. state-projected,
2. machine-observable,
3. screenshot-verifiable,
4. reproducible later.

---

## 2. Core rule

Every meaningful founders-loop UI state must expose enough evidence that another implementer can answer:

1. what phase is this?
2. what overlay state is active?
3. what is the primary action?
4. what is blocking progress?
5. what will unlock next?

If those answers are not observable, the UI is under-specified.

---

## 3. Required machine-visible markers

Each founders-loop screen root should expose these markers in a stable way.

### 3.1 Phase marker

Required:
- `data-zhc-phase`

Allowed values should align with the current machine/state docs, e.g.:
- `arrival`
- `first_worker_online`
- `founders_established`
- `alignment_passed`
- `crest_created`
- `hq_ready`
- `first_mission_completed`
- `first_memory_saved`
- `next_quest_visible`

### 3.2 Overlay marker

Required:
- `data-zhc-overlay-state`

Allowed values:
- `loading`
- `ready`
- `blocked`
- `needs_confirmation`
- `recoverable_error`
- `fatal_error`
- `success_feedback`

### 3.3 Primary action marker

Required:
- exactly one visible element with `data-zhc-primary-action="true"`

This is how tests should verify primary-action uniqueness.

### 3.4 Progress marker

Required:
- `data-zhc-progress-step`
- `data-zhc-progress-total`

This can be numeric or string-based, but it must be deterministic.

### 3.5 Blocker markers

If the phase is blocked, the UI must expose at least one blocker marker:
- `data-zhc-blocker-key="<key>"`

Example keys:
- `needs_auth`
- `needs_brain`
- `needs_founders`
- `needs_alignment`
- `needs_crest`
- `needs_house`
- `needs_memory_save`

### 3.6 Next unlock marker

If a next quest/room is visible or about to unlock, expose:
- `data-zhc-next-unlock`

Examples:
- `townhall`
- `alignment`
- `create`
- `house`
- `first_mission`
- `library`
- `next_quest`

---

## 4. Screenshot evidence contract

Every milestone screen state needs screenshots at:

1. mobile
2. tablet
3. desktop

Required screenshot set per meaningful phase:

1. ready state
2. blocked state where relevant
3. recoverable error state where relevant
4. success handoff state where relevant

If a phase has no screenshot evidence, it is not complete.

---

## 5. Required evidence table by phase

| Phase | Must prove |
| --- | --- |
| `arrival` | exactly one primary action, no late-loop CTA leakage |
| `first_worker_online` | worker readiness and blocked/error recovery states |
| `founders_established` | partial progress and completed founder registration |
| `alignment_passed` | clear gate completion and next action |
| `crest_created` | crest success handoff to HQ |
| `hq_ready` | House reads as HQ and mission is the primary next move |
| `first_mission_completed` | mission result exists but loop is not falsely complete |
| `first_memory_saved` | memory save success is visible and meaningful |
| `next_quest_visible` | next quest visible only after true progression |

---

## 6. Reproducibility harness rule

Each meaningful phase should be reproducible in at least one of these ways:

1. deterministic end-to-end progression
2. fixture/harness setup for a given state
3. explicit route/session seed designed for tests only

The important thing is not the mechanism.
The important thing is that another implementer can recreate the state on demand.

---

## 7. Copy evidence rule

For each phase, capture the exact strings used for:

1. main heading
2. primary CTA
3. blocked-state explanation
4. success handoff explanation

This matters because wording is part of the state projection.

If the copy changes meaningfully, screenshot and test evidence should be refreshed.

---

## 8. Interaction evidence rule

Each primary founders-loop action should have one associated assertion proving that:

1. it was visible in the expected state,
2. it was actionable in the expected state,
3. it was hidden/disabled outside the allowed state.

This is especially important for:

- `Enter town`
- `Bring your first worker online`
- `Continue to alignment`
- `Create crest`
- `Open headquarters`
- `Run first mission`
- `Save to company memory`
- `See next quest`

---

## 9. Design-state proof rule

The following states are not optional design polish.
They are contractual states and must be visible in evidence:

1. `loading`
2. `blocked`
3. `recoverable_error`
4. `success_feedback`

A screen that looks good only in the happy-path ready state is incomplete.

---

## 10. Relationship to the formal machine

The UI evidence layer should never invent states that the product truth does not recognize.

If a new meaningful UI state appears, one of two things must happen:

1. it is categorized as a valid overlay on an existing formal phase,
2. or the formal machine and state model are updated.

That prevents design drift.

---

## 11. Initial implementation focus

This evidence contract should first be applied to:

1. `public/start.html`
2. `public/start.js`
3. `public/app.js`
4. `public/views/townhall.html`
5. `public/views/house.html`
6. any first-mission UI surface chosen for ZHC0

---

## 12. Acceptance rule

A founders-loop UI surface is only complete when:

1. the machine-visible markers exist,
2. screenshot evidence exists,
3. the primary CTA is uniquely testable,
4. blocked/error/success states are visible where relevant,
5. the surface can be reproduced later by another implementer.

This is the minimum UI rigor required for ZHC0.
