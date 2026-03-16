# Frontend Design Master Implementation Roadmap

Status: current execution roadmap
Last updated: 2026-03-16

This document translates the earlier audit findings into one implementation-ready roadmap for future AI design agents.

It does not replace the phase specs.
It tells the next agent:

1. what exists,
2. what is wrong,
3. what must change,
4. in what order it should change,
5. which files and screenshots matter,
6. which constraints must never be broken,
7. how to keep the UI simple while preserving rich detail for the LLM and advanced users.

Use this document after reading:

1. `design/README.md`
2. `design/DESIGN_SYSTEM.md`
3. `design/FRONTEND_GUIDELINES.md`
4. `design/APP_FLOW.md`
5. `design/PRD.md`
6. `design/TECH_STACK.md`
7. `design/progress.txt`
8. `design/LESSONS.md`
9. `design/specs/00_design_tdd_protocol.md`
10. `design/specs/01_design_audit_baseline_2026_03_16.md`
11. `design/specs/09_global_human_first_design_requirements.md`

## 1. Execution rule

Do not skip ahead to surface polish before the system is calmer.

The correct order is:

1. system,
2. entry,
3. hub,
4. modal shell,
5. House Library,
6. Town Hall and agent sidebar,
7. polish.

If this order is violated, later work will likely become cosmetic rather than structural.

## 2. Non-negotiable constraints

Every future design phase must preserve:

1. current routes,
2. modal-first navigation,
3. worker continuity,
4. existing data and API behavior,
5. all current feature capability,
6. deterministic Playwright coverage,
7. current `data-testid` hooks unless intentionally migrated with test updates,
8. the pixel-RPG world identity,
9. usability for low-AI-literacy users,
10. international flexibility, especially English and Chinese,
11. provider-agnostic primary flows,
12. future voice-ready interaction grammar,
13. default human surfaces that remain simpler than the underlying information model because the LLM can explain deeper detail on demand.

Do not:

1. remove functionality,
2. simplify by hiding critical flows irrecoverably,
3. redesign the app into a generic SaaS dashboard,
4. introduce a second conflicting visual language,
5. make the world flat in order to make the UI calm.

The correct design move is:

1. keep the world rich,
2. make the interface quieter,
3. make the user's next action obvious,
4. name actions in human language,
5. avoid letting infrastructure vocabulary become the product face,
6. preserve detail for LLM interpretation and advanced disclosure instead of surfacing it all by default.

## 3. Surface inventory

The current frontend surfaces that must be considered together are:

1. `/start`
2. `/app` town hub
3. district modal shell
4. House Library inside House
5. Town Hall
6. Pony Express
7. Leaderboard
8. Saloon
9. Brain
10. right-side agent sidebar and debug stack

The work is not complete until all of these surfaces feel like one authored product family.

They must also feel understandable to users who do not think in AI systems language.
They must not force users to browse rich system detail manually when the LLM can mediate it.

## 4. Master findings matrix

### 4.1 System-level foundations

Current problems:

1. one display-like typeface carries too many UI roles,
2. spacing exists but not as an enforced rhythm,
3. too many panels share the same level of emphasis,
4. buttons, pills, chips, and tokens compete too closely,
5. gradients, borders, and shadows are overused at the same time,
6. icon language is not yet fully unified,
7. visual hierarchy is solved locally instead of systemically.

Required outcome:

1. distinct display and UI text roles,
2. one spacing ladder used consistently,
3. explicit depth roles,
4. sharper primary versus secondary versus token hierarchy,
5. calmer chrome with a richer world layer behind it,
6. one icon language for action and one for state, both visually consistent,
7. a design system future agents can extend without inventing one-off fixes,
8. token and typography rules that remain stable under English and Chinese UI,
9. primary action naming that stays compatible with future voice control,
10. a summary-first visual language that does not force humans to parse system detail screens.

Primary files:

1. `public/styles.css`
2. `design/DESIGN_SYSTEM.md`

Primary spec:

1. `design/specs/02_phase_d1_foundation_and_tokens_tdd_spec.md`

Dependencies:

1. none

Must be done before:

1. all other design phases

### 4.2 Start page

Current problems:

1. the hero media frame dominates before the proposition does,
2. a missing or blocked media load makes the page feel incomplete,
3. the primary action is not visually inevitable,
4. lower-priority informational blocks compete with the first action,
5. mobile feels vertically crowded too early.

Required outcome:

1. the title and proposition are understood within two seconds,
2. the primary CTA is the obvious next step,
3. the media frame supports rather than dominates,
4. fallback presentation looks intentional if media is absent,
5. the bottom of the screen remains calm on mobile,
6. the first action is understandable without knowing what an AI agent is,
7. deeper technical detail stays secondary because the LLM can explain it if needed.

Primary files:

1. `public/start.html`
2. `public/styles.css`
3. `public/start.js` only if a presentational state hook is required

Primary spec:

1. `design/specs/03_phase_d2_start_and_town_hub_tdd_spec.md`

Dependencies:

1. D1

### 4.3 Town hub

Current problems:

1. the town map is atmospheric but not instantly legible,
2. hotspots do not always feel tappable enough,
3. the selected district does not own the screen strongly enough,
4. the overlay information is weaker than the world illustration,
5. the agent sidebar competes with town discovery on both mobile and desktop.

Required outcome:

1. the active district is unmistakable,
2. the next action after tapping a district is obvious,
3. the world remains expressive without forcing interpretation,
4. the sidebar becomes a supporting presence unless engaged,
5. touch behavior feels intentional on mobile,
6. the map reads like places and actions, not a technical dashboard,
7. the hub does not front-load technical state that the LLM can explain if asked.

Primary files:

1. `public/index.html`
2. `public/styles.css`
3. `public/app.js` only if a purely presentational active-state hook is required

Primary spec:

1. `design/specs/03_phase_d2_start_and_town_hub_tdd_spec.md`

Dependencies:

1. D1

### 4.4 District modal shell

Current problems:

1. the modal shell is too loud,
2. inner content panels are also too loud,
3. nested shadows, borders, and wood textures flatten hierarchy,
4. content feels heavy before the user commits to a task,
5. multiple district surfaces inherit the same structural noise.

Required outcome:

1. the modal frame becomes a calm container,
2. one inner content surface becomes the clear focus,
3. secondary panels step back visually,
4. all district modals share one composition grammar,
5. information density feels deliberate rather than stacked,
6. room identity remains obvious enough for future voice reference,
7. default modal views emphasize the task rather than exhaustive room detail.

Primary files:

1. `public/styles.css`
2. `public/index.html`
3. `public/views/house.html`
4. `public/views/townhall.html`
5. `public/views/pony.html`
6. `public/views/leaderboard.html`
7. `public/views/saloon.html`
8. `public/views/brain.html`

Primary spec:

1. `design/specs/04_phase_d3_district_modal_shell_tdd_spec.md`

Dependencies:

1. D1
2. ideally after D2

### 4.5 House Library

Current problems:

1. the Library still reads like a long administrative surface,
2. user goals are weaker than system sections,
3. advanced and manual controls remain too visible too early,
4. the top-level screen is not yet organized around meaningful human tasks,
5. card language is improved but not yet calm enough across all Library desks,
6. too much information still appears as if the human must inspect it directly instead of asking the LLM.

Required outcome:

1. the Library opens on a clear human task posture,
2. one primary working area is obvious,
3. discovery remains nearby but not noisy,
4. supporting desks feel related and secondary,
5. technical provenance stays available without dominating the first screenful,
6. Library actions read as human verbs rather than AI concepts,
7. rich artifact detail remains available while the main path stays summary-first.

Primary files:

1. `public/views/house.html`
2. `public/styles.css`
3. `public/app.js` for presentation ordering only

Primary specs:

1. `design/specs/05_phase_d4_house_library_human_task_ui_tdd_spec.md`
2. `design/specs/07_phase_d6_polish_states_motion_accessibility_tdd_spec.md`

Dependencies:

1. D1
2. D3

### 4.6 Town Hall

Current problems:

1. onboarding still feels like a form stack,
2. primary identity decisions do not dominate enough,
3. avatar customization competes with naming,
4. processing and minting steps feel mechanically clear but visually procedural,
5. status blocks feel too equivalent in weight.

Required outcome:

1. onboarding reads like a guided ceremony,
2. each step has one dominant decision,
3. customization is clearly secondary,
4. processing reads as confident progress,
5. identity completion feels meaningful rather than clerical,
6. the ceremony remains understandable without agent-setup literacy,
7. onboarding asks for decisions, not for manual interpretation of system detail.

Primary files:

1. `public/views/townhall.html`
2. `public/styles.css`
3. `public/app.js` only if presentational state grouping requires it

Primary spec:

1. `design/specs/06_phase_d5_townhall_and_agent_sidebar_tdd_spec.md`

Dependencies:

1. D1
2. D3

### 4.7 Agent sidebar

Current problems:

1. it feels like a separate product bolted onto the shell,
2. it claims too much visual attention by default,
3. it compresses the main interface on shorter viewports,
4. it does not yet behave like a calm companion.

Required outcome:

1. the sidebar remains available and observable,
2. it is visually subordinate until summoned,
3. mobile and short-height layouts feel protected,
4. debugging remains transparent without dominating the town,
5. the main app still reads as the product for non-technical users.

Primary files:

1. `public/index.html`
2. `public/styles.css`
3. `public/app.js`

Primary spec:

1. `design/specs/06_phase_d5_townhall_and_agent_sidebar_tdd_spec.md`

Dependencies:

1. D1
2. D2

### 4.8 Other district surfaces

Current problems:

1. Pony, Leaderboard, Saloon, and Brain inherit the same too-many-panels pattern,
2. section headers, metadata, and actions often feel too equal,
3. empty and supporting states can feel mechanically present rather than composed.

Required outcome:

1. each surface has one obvious lead task,
2. metadata becomes quieter,
3. repeated framing is reduced,
4. the family resemblance to House and Town Hall becomes stronger.

Primary files:

1. `public/views/pony.html`
2. `public/views/leaderboard.html`
3. `public/views/saloon.html`
4. `public/views/brain.html`
5. `public/styles.css`

Primary specs:

1. `design/specs/04_phase_d3_district_modal_shell_tdd_spec.md`
2. `design/specs/07_phase_d6_polish_states_motion_accessibility_tdd_spec.md`

Dependencies:

1. D1
2. D3

## 5. Cross-cutting design backlog

The following findings must be carried through every phase rather than solved once:

### 5.1 Visual hierarchy

Future agent must verify:

1. the eye lands correctly in under two seconds,
2. there is one dominant action cluster per view,
3. secondary tools do not visually challenge the primary action.

### 5.2 Spacing and rhythm

Future agent must verify:

1. all new spacing uses the approved ladder,
2. section spacing is more generous than control spacing,
3. vertical rhythm survives on mobile, tablet, and desktop.

### 5.3 Typography

Future agent must verify:

1. display type is used sparingly,
2. UI copy is calmer,
3. metadata is quieter than titles,
4. no screen feels like every line is trying to headline itself,
5. label choices remain short, plain, and localization-friendly.

### 5.4 Color and depth

Future agent must verify:

1. color directs attention rather than decorates every layer,
2. surface depth is consistent,
3. nested panels never outshout their container,
4. status color is never the only distinction.

### 5.5 Components

Future agent must verify:

1. buttons of the same role look the same everywhere,
2. chips, pills, and tokens no longer impersonate primary controls,
3. drawers, cards, and panels form one family,
4. key controls can later be referred to cleanly in speech.

### 5.6 Motion

Future agent must verify:

1. motion clarifies change,
2. modal arrival, drawer reveal, and card selection follow one grammar,
3. nothing animates for decoration alone.

### 5.7 Empty, loading, and error states

Future agent must verify:

1. every blank state feels intentional,
2. loading never looks like a broken surface,
3. error language is calm and readable,
4. these states follow the same visual system as full states,
5. fallback states remain understandable across languages and low technical literacy,
6. fallback states summarize what matters instead of exposing raw system internals first.

### 5.8 Responsiveness and accessibility

Future agent must verify:

1. no horizontal overflow exists,
2. touch targets remain usable,
3. focus states remain visible,
4. contrast remains adequate,
5. screen-reader order is not harmed by visual reordering,
6. the agent sidebar does not create unusable short-height layouts,
7. English and Chinese remain plausible first-class UI targets.

## 6. Recommended implementation sequence

This is the recommended next execution order after this roadmap exists.

### Step 1

Approve and implement D1:

1. typography roles,
2. spacing ladder,
3. depth hierarchy,
4. control hierarchy.

### Step 2

Approve and implement D2:

1. `/start`
2. `/app` map
3. active district clarity

Do not redesign the whole app before the entry and hub are understandable.

### Step 3

Approve and implement D3:

1. unify the modal shell,
2. reduce nested framing,
3. apply the new system across all district interiors.

### Step 4

Approve and implement D4:

1. make House Library task-first,
2. demote advanced controls,
3. unify all Library desks.

### Step 5

Approve and implement D5:

1. make Town Hall ceremonial and clearer,
2. subordinate the agent sidebar by default.

### Step 6

Approve and implement D6:

1. loading,
2. empty states,
3. motion,
4. accessibility tightening,
5. cross-device cleanup.

## 7. Required evidence for every step

Every future implementation step must include:

1. before screenshots,
2. after screenshots,
3. mobile, tablet, and desktop captures,
4. a short written rationale,
5. confirmation that behavior did not change,
6. passing targeted Playwright runs,
7. passing `npm test`,
8. explicit confirmation that the phase still satisfies `design/specs/09_global_human_first_design_requirements.md`,
9. explicit confirmation that the phase keeps the default human path simpler than the full underlying information model.

## 8. File-target map for next agent

If a future agent is asked to implement the findings, start in this order:

1. `public/styles.css`
2. `design/DESIGN_SYSTEM.md`
3. `public/start.html`
4. `public/index.html`
5. `public/views/house.html`
6. `public/views/townhall.html`
7. `public/views/pony.html`
8. `public/views/leaderboard.html`
9. `public/views/saloon.html`
10. `public/views/brain.html`
11. `public/app.js` only when a presentational state or layout hook cannot be solved in CSS or markup alone

Do not begin by editing JS if the problem is hierarchy, spacing, typography, or chrome.

## 9. Definition of design done

The frontend findings from the earlier audit are considered implemented only when all of the following are true:

1. the app is understandable quickly on mobile, tablet, and desktop,
2. one primary action is obvious on every major surface,
3. the world remains distinctive,
4. the interface becomes calmer and more inevitable,
5. the Library feels human-friendly rather than administrative,
6. the debug and worker surfaces remain available but no longer compete visually,
7. existing functionality and tests still pass,
8. the UI lets the LLM and advanced views carry detail while the default path stays dead simple.
