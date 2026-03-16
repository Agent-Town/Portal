# Design Audit And Target State

Status: Active phased design plan

This document translates the current visual audit into a target state for future design agents.

## Overall Assessment

Agent Town already has a memorable world and a distinctive atmosphere. The design problem is structural: too many surfaces are styled as if they are equally important, so the user has to think harder than necessary to know where to look, what to do, and what matters now.

The target product should feel more like an inviting game world and less like an insider console, while remaining timeless, operationally clear, and usable across languages and provider choices.
The visible UI should show the minimum needed to act. Deeper operational detail should remain available through advanced views and assistant-guided explanation, not pushed into every first-view screen.
The visible UI should not collapse into a text desert. It should use visual anchors, hierarchy, and game-like structure so users can orient instantly without reading everything.

## Phase 1: Critical Structural Fixes

These issues actively hurt clarity, usability, or responsiveness.

### 1. Town Hub modal hierarchy

Current problem:

- The town shell and district modal stack too many framed regions
- Panels inside the modal often look like peer destinations instead of a guided flow
- The eye does not land on one clear action

Target state:

- One dominant content plane inside the modal
- A shorter, quieter header
- Stronger differentiation between primary content and supporting content
- Fewer nested panel treatments

Why this matters:

- This is the app's main operational shell
- If the modal feels noisy, every downstream experience inherits that noise

### 2. House Console and House Office top-of-screen hierarchy

Current problem:

- Readiness text dominates the surface
- Action rows and district navigation appear with equal weight
- The surface reads like a control panel instead of an intuitive workspace

Target state:

- A compact summary card with one primary action
- Secondary sections grouped below with quieter styling
- Section labels that read as structure, not decoration
- Deep readiness and operations detail available after the overview, not ahead of it

Why this matters:

- House is the highest-trust, highest-value product surface
- It must feel inevitable and calm

### 3. Agent Comms dock dominance

Current problem:

- The dock visually overstates its importance relative to the main task surface
- Header chrome and control styling are too loud
- It feels mechanically present instead of gracefully available

Target state:

- A quieter minimized state
- Clearer expanded hierarchy
- Consistent iconography and more restrained materials
- The assistant remains the path to explanation; the dock should not require the user to read a wall of operational data

Why this matters:

- The agent should feel like a capable companion, not a second app fighting for attention

### 4. Leaderboard empty-state failure

Current problem:

- The screen leaves too much dead space
- The empty state looks unfilled rather than intentionally empty
- The stats float without compositional anchor

Target state:

- One centered empty-state composition
- Support metadata visually demoted
- Stronger center of gravity

Why this matters:

- Empty states define perceived polish
- A blank leaderboard should still feel complete

### 5. Mobile density in operational surfaces

Current problem:

- Modal content and dock content stack into a visually cramped vertical experience
- Section boxes and labels repeat too aggressively

Target state:

- Tighter copy
- Fewer simultaneous boxes
- Clearer progression through sections

Why this matters:

- Mobile is the hardest truth test for hierarchy
- It is also the most unforgiving environment for translated and spoken-first interaction

### 6. Text-desert regression

Current problem:

- several redesigned surfaces now rely too heavily on stacked headings, labels, and status copy
- the simplification work reduced noise, but in places it also removed too many visual anchors
- users are still asked to scan too much text to understand the scene

Target state:

- key surfaces use visual anchors before explanation
- summary cards, office maps, action clusters, progress markers, and icon-supported section labels do more of the orientation work
- text becomes shorter and more supportive because the layout already communicates structure

Why this matters:

- a simple UI should feel clear, not empty
- game-like products need readable scene composition, not just reduced copy volume

## Phase 2: Refinement And System Unification

These changes elevate the experience once the structural problems are reduced.

### 1. Typography hierarchy

Current problem:

- One serif family is carrying display, utility, buttons, and body copy
- Too many headings feel equally "special"

Target state:

- Distinct display and UI/body roles
- Fewer type sizes
- Clearer meta/body/title separation

Why this matters:

- Typography is the cheapest and most powerful source of clarity

### 2. Button and panel hierarchy

Current problem:

- Default buttons are already loud
- Default panels are already premium-looking, so nothing special can stand out

Target state:

- Quieter baseline components
- Reserved emphasis for primary actions and truly important summary areas

Why this matters:

- Hierarchy fails when the defaults already shout

### 3. Registry integration into the shared system

Current problem:

- Registry uses page-local styles and a separate type/color logic
- It feels like a different product

Target state:

- Shared tokens
- Shared spacing rhythm
- Shared action hierarchy

Why this matters:

- Premium products feel coherent across surfaces

### 4. Start screen focal hierarchy

Current problem:

- The intro video visually competes with the Enter action
- The warning banner damages tone

Target state:

- CTA first
- media second
- minimal supporting copy

Why this matters:

- This is the first emotional impression of the product

### 5. Trainer / Brain / advanced debug surface refinement

Current problem:

- Power-user surfaces are dense and over-paneled
- Advanced settings rely on inline styles and ad hoc layout
- AI/provider terminology can feel like internal tooling instead of user-facing product language

Target state:

- Same design language as the main product
- Better grouping
- Advanced treatment that feels intentional
- AI/provider-specific controls visually demoted behind task-first framing

Why this matters:

- Even debug/power surfaces shape the perceived quality of the platform

## Phase 3: Polish

These changes make the app feel premium after hierarchy and consistency are fixed.

### 1. Motion

Target:

- One shared, restrained motion curve
- Shorter, calmer transitions for modal and dock state changes

### 2. Empty, loading, and error state library

Target:

- One reusable pattern for each state type
- No surface should feel unstyled while waiting or empty

### 3. Icon consistency

Target:

- One icon language across dock, modals, and controls
- No mixed emoji-like control language in premium UI

### 4. Final responsiveness and accessibility polish

Target:

- Better scan order
- cleaner focus behavior
- no overlooked tablet/desktop awkwardness

## Explicit Design Decisions

These decisions are already made for future agents:

- The app should remain themed and worlded
- The app should not be flattened into generic SaaS minimalism
- The town map should remain cinematic
- The product should lean further into game-like framing, but never at the expense of clarity
- The house surfaces should become quieter and more structured
- The dock should become less dominant, not disappear
- Registry should be brought into the shared system, not preserved as a separate visual language
- Non-technical users should understand the main path without needing AI vocabulary
- Chinese and international audiences must be first-class layout and typography targets
- Future voice control should be anticipated in labels, structure, and state feedback
- Default UI should be summary-first, while structured detail remains available for assistant-guided exploration and advanced views
- summary-first does not mean text-only; visual anchors are required on core surfaces
- core agent experiences must remain modal-first on top of the town shell to preserve worker continuity

## Explicit Rejections

Future agents should not do the following:

- Remove the frontier identity entirely
- Replace the town shell with a generic dashboard
- Add decorative animation that does not improve orientation
- Introduce new panel or button variants casually
- Add explanatory labels where hierarchy should solve the problem
- Expose dense operational detail by default when it can live in an advanced view or be explained by the assistant

## Visual Definition Of Success

When the design work is done, a new user should be able to:

- identify the primary action on each core screen in 2 seconds
- understand which surface they are in without reading dense copy
- use the mobile UI without feeling cramped
- perceive the agent as supportive rather than intrusive
- feel the same design system across start, town, house, registry, leaderboard, and advanced surfaces
- accomplish the main path without understanding LLM/provider jargon
- use the product comfortably in translated or Chinese copy contexts
