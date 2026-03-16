# PRD

Status: design-oriented product requirements for future UI work
Last updated: 2026-03-16

This PRD is intentionally about design outcomes, not new features.

## 1. Product promise

Agent Town should feel like:

1. a quiet pixel world,
2. a cooperative human-and-agent system,
3. a trustworthy place for memory and tools,
4. something understandable without technical literacy.

## 2. Design objective

The app already works.

The design mandate is to make it feel:

1. obvious,
2. premium,
3. minimal,
4. calm under complexity,
5. consistent across all screens.

## 3. Core design requirements

1. A first-time user should understand the next action in under 2 seconds.
2. The interface must never feel busier than the user's current task.
3. The world art should create atmosphere, not obscure usability.
4. The Library must feel human-meaningful, not file-system-like.
5. The debug/agent layer must be present, but visually secondary unless actively in use.
6. The modal-first architecture must be preserved.

## 4. Screen-level requirements

### 4.1 Start page

Required outcome:

1. instantly understandable,
2. one clear call to action,
3. graceful if external media fails or is blocked.

### 4.2 Town hub

Required outcome:

1. clearly tappable districts,
2. strong active district signal,
3. no ambiguity about what opens next.

### 4.3 District modal

Required outcome:

1. one calm frame,
2. inner content hierarchy stronger than shell chrome,
3. consistent behavior across districts.

### 4.4 House Library

Required outcome:

1. task-first,
2. minimal default chrome,
3. advanced controls visible only when needed,
4. consistent card/drawer language,
5. trust and safety visible without long reading,
6. same-shell continuity always preserved.

### 4.5 Town Hall

Required outcome:

1. guided and friendly,
2. sequential and clear,
3. ceremonial rather than clerical.

### 4.6 Agent sidebar

Required outcome:

1. still available,
2. still debuggable,
3. visually subordinate to the user's main task by default.

## 5. Design success metrics

These are the primary measurable outcomes for future phases:

1. key first screens show title and primary action without scroll on mobile,
2. primary action is visually dominant on every surface,
3. no screen looks broken when empty or loading,
4. advanced or technical controls are hidden by default unless task-critical,
5. visual hierarchy remains stable at mobile, tablet, and desktop,
6. functionality remains unchanged,
7. full Playwright suite remains green.

## 6. Non-goals

This design program does not authorize:

1. feature invention,
2. workflow changes,
3. new backend systems,
4. social or gamified additions,
5. route architecture changes that break modal-first continuity,
6. adding decorative complexity in the name of polish.

## 7. House Library-specific product direction

Current Library functionality is rich enough.

The next design goal is not "more capability."
It is:

1. better hierarchy,
2. stronger human task framing,
3. calmer defaults,
4. better trust readability,
5. simpler cross-device use.

## 8. Approval rule

No design phase should be implemented until the user explicitly approves that phase.

