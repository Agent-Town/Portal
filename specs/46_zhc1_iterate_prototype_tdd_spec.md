# ZHC1 Iterate Prototype — TDD Spec

Status: implementation-driving spec
Branch: `zhc1-iterate-prototype`
Last updated: 2026-03-18
Predecessor: `specs/45_zhc1_iterate_prototype_spec.md` (product spec)

---

## 1. Document purpose

Every feature is defined as a test with a measurable result. An agentic AI developer must be able to read a test, understand what to build, implement it, and verify the result.

## 2. Test anatomy

```
### IT-Txxx: [Title]

Phase: [phase name]
Priority: P0 | P1 | P2
Dependencies: [test IDs]

Given: [initial state]
When: [action]
Then: [measurable outcome]
Verification: [how to check]
```

---

## Phase 0: Entry Point

### IT-T001: Iterate page loads

Phase: entry_point
Priority: P0
Dependencies: none

Given: Server is running
When: User navigates to `/iterate`
Then: Page loads with Agent Town branding (sky blue background, Wellfleet title font, cream panels)
Verification: `page.goto('/iterate')` → `data-testid="iterate-page"` visible, title contains "Iterate"

### IT-T002: Iterate page is responsive

Phase: entry_point
Priority: P1
Dependencies: IT-T001

Given: Iterate page is loaded
When: Viewport is resized to 390px, 820px, and 1440px widths
Then: Layout adapts without horizontal scroll. Primary action visible without scrolling at all sizes.
Verification: `page.setViewportSize()` at each breakpoint → no `overflow-x: scroll`, primary CTA visible

---

## Phase 1: Identity Onboarding

### IT-T010: User can enter their name

Phase: identity
Priority: P0
Dependencies: IT-T001

Given: Iterate page is loaded, showing identity step
When: User types a name into the name input
Then: Input accepts text, "Next" / continue button becomes enabled
Verification: `fill('[data-testid="user-name-input"]', 'User')` → continue button not disabled

### IT-T011: User can name their agent

Phase: identity
Priority: P0
Dependencies: IT-T010

Given: User has entered their name
When: User sees agent name input (pre-filled "OpenClaw")
Then: User can modify or accept the agent name
Verification: `data-testid="agent-name-input"` has value "OpenClaw", is editable

### IT-T012: Avatars displayed for both user and agent

Phase: identity
Priority: P0
Dependencies: IT-T010

Given: Identity step is showing
When: Page renders
Then: User avatar (`/brand-kit/default_user_avatar.png`) and agent avatar (`/brand-kit/default_agent_avatar.png`) are both visible, displayed side by side
Verification: Two `img` elements with correct `src` attributes are visible

### IT-T013: Identity persists in localStorage

Phase: identity
Priority: P1
Dependencies: IT-T010, IT-T011

Given: User has entered name "User" and agent name "Scout"
When: User completes identity step
Then: `localStorage` contains `iterate:userName` = "User" and `iterate:agentName` = "Scout"
Verification: `page.evaluate(() => localStorage.getItem('iterate:userName'))` === "User"

---

## Phase 2: Brain Config

### IT-T020: Brain config step shown after identity

Phase: brain_config
Priority: P0
Dependencies: IT-T013

Given: User has completed identity step
When: Identity step completes
Then: Brain config panel appears with agent avatar and text "Give [agent name] a brain"
Verification: `data-testid="brain-config"` visible, contains agent name

### IT-T021: Provider and API key inputs present

Phase: brain_config
Priority: P0
Dependencies: IT-T020

Given: Brain config panel is showing
When: Page renders
Then: Provider selector (dropdown or radio), API key input, and model input are present
Verification: `data-testid="brain-provider"`, `data-testid="brain-api-key"`, `data-testid="brain-model"` all visible

### IT-T022: Brain config enables continue

Phase: brain_config
Priority: P0
Dependencies: IT-T021

Given: Brain config panel is showing
When: User selects provider, enters API key, and enters model name
Then: Continue / "Boot agent" button becomes enabled
Verification: Fill all three fields → `data-testid="brain-boot-btn"` not disabled

---

## Phase 3: Agent Boot

### IT-T030: Session created on boot

Phase: agent_boot
Priority: P0
Dependencies: IT-T022

Given: Brain config is complete
When: User clicks "Boot agent"
Then: `POST /api/agent/session` is called, session created, team code stored
Verification: Network request to `/api/agent/session` returns `{ ok: true, teamCode: ... }`

### IT-T031: Agent status indicator shows connection progress

Phase: agent_boot
Priority: P1
Dependencies: IT-T030

Given: Boot is initiated
When: Worker is connecting
Then: Agent avatar shows status indicator: "connecting..." → "ready"
Verification: `data-testid="agent-status"` text transitions from connecting to ready

---

## Phase 4: Problem Input

### IT-T040: Problem input shown after boot

Phase: problem_input
Priority: P0
Dependencies: IT-T030

Given: Agent is booted and ready
When: Boot completes
Then: Problem input area appears with text area and "Start iterating" button
Verification: `data-testid="problem-input"` and `data-testid="start-btn"` visible

### IT-T041: Problem story created on submit

Phase: problem_input
Priority: P0
Dependencies: IT-T040

Given: Problem input is showing
When: User types "Optimize my landing page for conversions" and clicks "Start iterating"
Then: `POST /api/problem-stories` called with the description, story ID stored
Verification: Network request returns `{ id: ... }`, `data-testid="active-loop"` becomes visible

---

## Phase 5: Conversation + Metrics

### IT-T050: Conversation thread renders

Phase: conversation
Priority: P0
Dependencies: IT-T041

Given: Problem has been submitted
When: Active loop view appears
Then: Conversation area with message thread is visible. Agent's first message appears (from gateway).
Verification: `data-testid="conversation-thread"` visible, contains at least one message

### IT-T051: User messages show with avatar and name

Phase: conversation
Priority: P0
Dependencies: IT-T050

Given: Conversation thread is visible
When: User types a message and sends it
Then: Message appears in thread with user avatar and user name
Verification: Message bubble with `data-testid="msg-user"`, contains avatar img and name

### IT-T052: Agent messages show with avatar and name

Phase: conversation
Priority: P0
Dependencies: IT-T050

Given: Conversation thread is visible
When: Agent responds via gateway
Then: Agent message appears with agent avatar and agent name
Verification: Message bubble with `data-testid="msg-agent"`, contains avatar img and name

### IT-T053: Metric proposal cards appear

Phase: conversation
Priority: P0
Dependencies: IT-T050

Given: Agent has analyzed the problem
When: Agent proposes metrics (via conversation or structured response)
Then: Metric cards appear in a reviewable list with name, type, rationale
Verification: `data-testid="metric-card"` elements appear with metric details

### IT-T054: User can confirm metrics

Phase: conversation
Priority: P0
Dependencies: IT-T053

Given: Metrics are proposed
When: User clicks "Confirm metrics" (or accepts via conversation)
Then: `POST /api/problem-stories/:id/eval-confirm` called, story becomes active
Verification: API call succeeds, status transitions to "active"

---

## Phase 6: Experiment Feed + Visualization

### IT-T060: Experiment cards appear after metrics confirmed

Phase: experiment_feed
Priority: P0
Dependencies: IT-T054

Given: Metrics are confirmed, story is active
When: Agent generates experiments
Then: Experiment cards appear in a feed area with: proposal summary, scores, visual representation
Verification: `data-testid="experiment-card"` elements visible with score data

### IT-T061: Score trend visualization shows progress

Phase: experiment_feed
Priority: P0
Dependencies: IT-T060

Given: At least one round of experiments exists
When: Feed renders
Then: Score trend visualization (sparkline or progress bar) shows composite score over rounds
Verification: `data-testid="score-trend"` visible with rendered data points

### IT-T062: Problem visualization adapts to domain

Phase: experiment_feed
Priority: P1
Dependencies: IT-T060

Given: Experiments are running
When: Cards render
Then: Each card includes a visual representation appropriate to the problem domain (gradient placeholder, text summary, or metric dashboard)
Verification: `data-testid="card-visual"` element present in each experiment card

### IT-T063: Progress indicator shows convergence trajectory

Phase: experiment_feed
Priority: P1
Dependencies: IT-T061

Given: Multiple rounds of experiments exist
When: Score trend updates
Then: Convergence trajectory is visible — improvement rate, rounds completed, estimated distance to convergence
Verification: `data-testid="convergence-status"` shows convergence info

---

## Phase 7: Feedback Loop

### IT-T070: User can give feedback on a card

Phase: feedback
Priority: P0
Dependencies: IT-T060

Given: Experiment cards are showing
When: User taps/clicks a card and types feedback in the conversation
Then: Feedback is captured and linked to the card via API
Verification: Feedback stored, card status updates

### IT-T071: Next round triggered after feedback

Phase: feedback
Priority: P0
Dependencies: IT-T070

Given: User has given feedback on current round
When: Agent processes feedback
Then: Agent runs next experiment round, new cards appear
Verification: New cards with incremented round number appear in feed

### IT-T072: Constraints extracted from feedback

Phase: feedback
Priority: P1
Dependencies: IT-T070

Given: User gives feedback like "Make it faster, remove the sidebar"
When: Feedback is processed
Then: Constraints extracted and added to problem story
Verification: Problem story `constraints` array grows

---

## Phase 8: Convergence + Resolution

### IT-T080: Convergence message shown

Phase: convergence
Priority: P1
Dependencies: IT-T071

Given: Score improvement has plateaued (< 3% for 3 rounds)
When: Convergence detected
Then: "Your solution is converging" message displayed
Verification: `data-testid="convergence-message"` visible

### IT-T081: Save game available

Phase: convergence
Priority: P2
Dependencies: IT-T041

Given: Active loop is running
When: User clicks save
Then: Checkpoint created via `POST /api/save-games`
Verification: API returns save game ID

---

## Phase 9: Smoke Test

### IT-T090: Full journey smoke test

Phase: smoke
Priority: P0
Dependencies: all above

Given: Fresh server, clean state
When: User completes: identity → brain config → boot → problem → conversation → metrics → experiments → feedback → next round
Then: All steps complete without error. At least 2 rounds of experiments produced.
Verification: Playwright test walks through full journey, asserts key data-testid elements at each step

---

## Test count summary

| Phase | Tests | Priority |
|-------|-------|----------|
| Entry point | 2 | P0, P1 |
| Identity | 4 | P0, P0, P0, P1 |
| Brain config | 3 | P0, P0, P0 |
| Agent boot | 2 | P0, P1 |
| Problem input | 2 | P0, P0 |
| Conversation + metrics | 5 | P0, P0, P0, P0, P0 |
| Experiment feed + visualization | 4 | P0, P0, P1, P1 |
| Feedback loop | 3 | P0, P0, P1 |
| Convergence | 2 | P1, P2 |
| Smoke | 1 | P0 |
| **Total** | **28** | |
